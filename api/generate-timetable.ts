import { GoogleGenAI, Type } from "@google/genai";

// In a real-world monorepo, these types and constants would be in a shared package.
// For this demonstration, they are included here to make the API route self-contained.

// --- START: Duplicated Types & Constants ---
const TIME_SLOTS = ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00', '14:00 - 15:00', '15:00 - 16:00'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface LeaveRequest {
  facultyId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  startDate: string;
  endDate: string;
  leaveType: 'full-day' | 'multi-day' | 'half-day';
  halfDaySession?: 'first-half' | 'second-half';
}

interface Faculty {
  id: string;
  name: string;
  assignments: { subjectId: string; groupId: string }[];
  availability: { [day: string]: string[] };
}

interface TimetableEntry {
  day: string;
  time: string;
  groupId: string;
  subjectId: string;
  facultyId: string;
  roomId: string;
}
// --- END: Duplicated Types & Constants ---

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

const getDatesInRange = (startDate: string, endDate: string): Date[] => {
    const dates: Date[] = [];
    const currentDate = new Date(startDate + 'T00:00:00');
    const lastDate = new Date(endDate + 'T00:00:00');

    while (currentDate <= lastDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

const getDayOfWeekFromDate = (date: Date) => {
    const dayIndex = date.getDay();
    if (dayIndex >= 1 && dayIndex <= 5) {
        return DAYS[dayIndex - 1];
    }
    return null;
}

const generateTimetableOnServer = async (
    payload: {
        classrooms: any[];
        subjects: any[];
        studentGroups: any[];
        faculty: Faculty[];
        leaveRequests: LeaveRequest[];
        generationProfile: 'balanced' | 'speed' | 'accuracy';
        additionalConstraints: string;
    }
): Promise<TimetableEntry[]> => {
    if (!process.env.API_KEY) {
        console.error("Gemini API Key is missing. Please set the API_KEY environment variable.");
        throw new Error("API Key is not configured on the server.");
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const { classrooms, subjects, studentGroups, faculty, leaveRequests, generationProfile, additionalConstraints } = payload;

    const approvedLeaves = leaveRequests.filter(r => r.status === 'Approved');
    const facultyWithLeaves: Faculty[] = JSON.parse(JSON.stringify(faculty));

    approvedLeaves.forEach(leave => {
        const facultyMember = facultyWithLeaves.find(f => f.id === leave.facultyId);
        if (!facultyMember) return;

        if (leave.leaveType === 'multi-day' || leave.leaveType === 'full-day') {
            const leaveDates = getDatesInRange(leave.startDate, leave.endDate);
            leaveDates.forEach(date => {
                const dayOfWeek = getDayOfWeekFromDate(date);
                if (dayOfWeek) {
                    facultyMember.availability[dayOfWeek] = [];
                }
            });
        } else if (leave.leaveType === 'half-day') {
            const dayOfWeek = getDayOfWeekFromDate(new Date(leave.startDate + 'T00:00:00'));
            if (dayOfWeek && facultyMember.availability[dayOfWeek]) {
                const originalSlots = facultyMember.availability[dayOfWeek];
                const midpoint = Math.ceil(originalSlots.length / 2);
                if (leave.halfDaySession === 'first-half') {
                    facultyMember.availability[dayOfWeek] = originalSlots.slice(midpoint);
                } else {
                    facultyMember.availability[dayOfWeek] = originalSlots.slice(0, midpoint);
                }
            }
        }
    });

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

        const config: any = {
            responseMimeType: "application/json",
            responseSchema: timetableSchema,
            systemInstruction: systemInstruction,
        };

        if (generationProfile === 'speed') {
            config.thinkingConfig = { thinkingBudget: 0 };
        } else if (generationProfile === 'accuracy') {
            config.temperature = 0.2;
        }

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

// This function signature is compatible with Vercel Serverless Functions.
// It simulates a backend endpoint that would run in a Node.js environment.
export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const payload = req.body;
        const timetable = await generateTimetableOnServer(payload);
        return res.status(200).json({ timetable });
    } catch (error) {
        console.error("Error in /api/generate-timetable:", error);
        return res.status(500).json({ error: (error as Error).message || "Failed to generate timetable" });
    }
}
