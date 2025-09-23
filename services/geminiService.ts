

import { GoogleGenAI, Type } from "@google/genai";
import { AppState, TimetableEntry, Faculty, LeaveRequest } from '../context/types';
import { DAYS, TIME_SLOTS } from '../context/constants';

const timetableSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      day: { type: Type.STRING, enum: DAYS },
      time: { type: Type.STRING, enum: TIME_SLOTS },
      groupId: { type: Type.STRING },
      subjectId: { type: Type.STRING },
      facultyId: { type: Type.STRING },
      roomId: { type: Type.STRING },
    },
    required: ["day", "time", "groupId", "subjectId", "facultyId", "roomId"]
  }
};

/**
 * Helper function to get all dates within a given start and end date range.
 * @param startDate - The start date string (e.g., '2024-10-10').
 * @param endDate - The end date string (e.g., '2024-10-11').
 * @returns An array of Date objects.
 */
const getDatesInRange = (startDate: string, endDate: string): Date[] => {
    const dates: Date[] = [];
    // Add timezone offset to avoid off-by-one day errors
    const currentDate = new Date(startDate + 'T00:00:00');
    const lastDate = new Date(endDate + 'T00:00:00');

    while (currentDate <= lastDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

const getDayOfWeekFromDate = (date: Date) => {
    const dayIndex = date.getDay(); // 0 for Sunday, 1 for Monday...
    if (dayIndex >= 1 && dayIndex <= 5) {
        return DAYS[dayIndex - 1]; // DAYS array is 0-indexed ('Monday' is at index 0)
    }
    return null;
}


export const generateTimetableWithGemini = async (
    appState: AppState,
    generationProfile: 'balanced' | 'speed' | 'accuracy',
    additionalConstraints: string
): Promise<TimetableEntry[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const { classrooms, subjects, studentGroups, faculty, leaveRequests } = appState;

    // --- Process Approved Leaves to update Faculty Availability ---
    const approvedLeaves = leaveRequests.filter(r => r.status === 'Approved');
    const facultyWithLeaves: Faculty[] = JSON.parse(JSON.stringify(faculty)); // Deep copy to avoid mutation

    approvedLeaves.forEach(leave => {
        const facultyMember = facultyWithLeaves.find(f => f.id === leave.facultyId);
        if (!facultyMember) return;

        if (leave.leaveType === 'multi-day' || leave.leaveType === 'full-day') {
            const leaveDates = getDatesInRange(leave.startDate, leave.endDate);
            leaveDates.forEach(date => {
                const dayOfWeek = getDayOfWeekFromDate(date);
                if (dayOfWeek) {
                    facultyMember.availability[dayOfWeek] = []; // Block the entire day
                }
            });
        } else if (leave.leaveType === 'half-day') {
            const dayOfWeek = getDayOfWeekFromDate(new Date(leave.startDate + 'T00:00:00'));
            if (dayOfWeek && facultyMember.availability[dayOfWeek]) {
                const originalSlots = facultyMember.availability[dayOfWeek];
                const midpoint = Math.ceil(originalSlots.length / 2);
                if (leave.halfDaySession === 'first-half') {
                    facultyMember.availability[dayOfWeek] = originalSlots.slice(midpoint);
                } else { // second-half
                    facultyMember.availability[dayOfWeek] = originalSlots.slice(0, midpoint);
                }
            }
        }
    });
    // --- End of Leave Processing ---


    // Filter faculty to only include their assignments for the prompt, now using the leave-adjusted data
    const facultyAssignments = facultyWithLeaves.map(f => ({
      id: f.id,
      name: f.name,
      assignments: f.assignments,
      availability: f.availability
    }));
  
    try {
    
    const systemInstruction = `You are an expert university timetable scheduler. Your task is to generate a weekly class schedule for a college department based on the provided data and constraints. The output must be a valid JSON array matching the provided schema. You must strictly adhere to all constraints provided. Your primary goal is to create a valid, clash-free, and optimized schedule. Ensure all subjects for each group are scheduled for the exact number of times per week as specified.`;

    const prompt = `
      DATA:
      1. Classrooms: ${JSON.stringify(classrooms)}
      2. Subjects: ${JSON.stringify(subjects)}
      3. Student Groups: ${JSON.stringify(studentGroups)}
      4. Faculty Assignments & Availability (NOTE: This availability data has been pre-processed to account for approved leaves. An empty array for a day means the faculty is unavailable): ${JSON.stringify(facultyAssignments)}
      5. Time Slots: ${JSON.stringify(TIME_SLOTS)}
      6. Days: ${JSON.stringify(DAYS)}

      CONSTRAINTS:
      1. CRITICAL: No clashes. A faculty member, a classroom, or a student group cannot be in two places at the same time.
      2. Adhere strictly to the provided Faculty Assignments. A subject for a group must be taught by the assigned faculty.
      3. For each student group, every assigned subject must be scheduled for the exact number of times specified in the subject's "classesPerWeek".
      4. If a subject has "labRequired: true", it MUST be scheduled in a classroom of type "Lab".
      5. The capacity of a classroom must be greater than or equal to the strength of the student group scheduled in it.
      6. CRITICAL: Respect faculty availability. A faculty member can only be scheduled in a time slot if they are marked as available for that day and time. This data already includes unavailability due to approved leave.
      7. Distribute classes evenly throughout the week for each student group to avoid overloading any single day.
      ${additionalConstraints ? `8. Additional User Constraints: ${additionalConstraints}` : ''}
    `;

    // Base config
    const config: any = {
        responseMimeType: "application/json",
        responseSchema: timetableSchema,
        systemInstruction: systemInstruction,
    };

    // Profile-specific config adjustments
    if (generationProfile === 'speed') {
        config.thinkingConfig = { thinkingBudget: 0 };
    } else if (generationProfile === 'accuracy') {
        config.temperature = 0.2;
    }
    // 'balanced' profile uses the default config with no adjustments.

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: config,
    });

    const jsonText = response.text.trim();
    const generatedData = JSON.parse(jsonText);
    
    if (!Array.isArray(generatedData)) {
      throw new Error("AI response is not in the expected array format.");
    }
    
    return generatedData as TimetableEntry[];

  } catch (error) {
    console.error("Error generating timetable with Gemini:", error);
    throw new Error("Failed to generate timetable. The AI model might be unavailable or the constraints were too restrictive. Please check your data and try again.");
  }
};