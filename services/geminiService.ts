import { GoogleGenAI, Type } from "@google/genai";
import { AppState, TimetableEntry, Faculty, LeaveRequest } from '../context/types';
import { TIME_SLOTS, DAYS } from '../context/constants';

// Helper function to get all dates between a start and end date
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

// Helper function to get the day of the week ('Monday', 'Tuesday', etc.) from a Date object
const getDayOfWeekFromDate = (date: Date) => {
    const dayIndex = date.getDay();
    // Monday is 1, Friday is 5. Date.getDay() has Sunday as 0.
    if (dayIndex >= 1 && dayIndex <= 5) return DAYS[dayIndex - 1];
    return null;
};

/**
 * Generates a timetable by calling the Google Gemini API directly from the client.
 *
 * @param state - The current application state.
 * @param generationProfile - The selected profile for generation ('balanced', 'speed', 'accuracy').
 * @param additionalConstraints - Any user-provided additional constraints.
 * @returns A promise that resolves to the generated timetable array.
 */
export const generateTimetableWithGemini = async (
    state: AppState,
    generationProfile: 'balanced' | 'speed' | 'accuracy',
    additionalConstraints: string
): Promise<TimetableEntry[]> => {
    
    if (!process.env.API_KEY) {
        throw new Error("Missing Google Gemini API Key. Please configure it as an environment variable named API_KEY.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const { classrooms, subjects, studentGroups, faculty, leaveRequests } = state;

    // --- Data processing to account for approved leaves ---
    // Create a deep copy of faculty data to avoid mutating the original state
    const facultyWithLeaves: Faculty[] = JSON.parse(JSON.stringify(faculty)); 

    leaveRequests.filter(r => r.status === 'Approved').forEach(leave => {
        const facultyMember = facultyWithLeaves.find(f => f.id === leave.facultyId);
        if (!facultyMember) return;

        if (leave.leaveType === 'multi-day' || leave.leaveType === 'full-day') {
            getDatesInRange(leave.startDate, leave.endDate).forEach(date => {
                const dayOfWeek = getDayOfWeekFromDate(date);
                if (dayOfWeek) {
                    // Mark as completely unavailable on this day
                    facultyMember.availability[dayOfWeek] = [];
                }
            });
        } else if (leave.leaveType === 'half-day') {
            const dayOfWeek = getDayOfWeekFromDate(new Date(leave.startDate + 'T00:00:00'));
            if (dayOfWeek && facultyMember.availability[dayOfWeek]) {
                const midpoint = Math.ceil(TIME_SLOTS.length / 2);
                const slotsToRemove = leave.halfDaySession === 'first-half'
                    ? TIME_SLOTS.slice(0, midpoint)
                    : TIME_SLOTS.slice(midpoint);
                facultyMember.availability[dayOfWeek] = facultyMember.availability[dayOfWeek].filter(slot => !slotsToRemove.includes(slot));
            }
        }
    });

    const facultyAssignments = facultyWithLeaves.map(f => ({
        id: f.id,
        name: f.name,
        assignments: f.assignments,
        availability: f.availability,
    }));
    
    const systemInstruction = `You are an expert university timetable scheduler. Your task is to generate an optimized, conflict-free weekly timetable based on the provided data and constraints.
- The output MUST be a valid JSON array of timetable entry objects.
- Each entry must conform to the provided JSON schema.
- Adhere strictly to all hard constraints.
- Try to satisfy soft constraints where possible.
- Ensure every subject's 'classesPerWeek' requirement is met for each assigned student group.
`;

    const prompt = `
      Please generate a weekly timetable based on the following data and constraints.

      DATA:
      1. Classrooms: ${JSON.stringify(classrooms.map(({ id, name, capacity, type }) => ({ id, name, capacity, type })))}
      2. Subjects: ${JSON.stringify(subjects.map(({ id, name, code, classesPerWeek, labRequired }) => ({ id, name, code, classesPerWeek, labRequired })))}
      3. Student Groups: ${JSON.stringify(studentGroups.map(({ id, name, strength, department, semester }) => ({ id, name, strength, department, semester })))}
      4. Faculty Assignments & Availability: ${JSON.stringify(facultyAssignments)}
      5. Time Slots: ${JSON.stringify(TIME_SLOTS)}
      6. Days: ${JSON.stringify(DAYS)}

      HARD CONSTRAINTS (Must be satisfied):
      1. A faculty member can only teach one class at a time.
      2. A student group can only attend one class at a time.
      3. A classroom can only host one class at a time.
      4. Schedule classes only during a faculty member's available time slots.
      5. The number of classes per week for each subject must be met exactly as specified for each student group it is assigned to.
      6. A student group's size ('strength') must not exceed the classroom's 'capacity'.
      7. If a subject requires a lab ('labRequired: true'), it MUST be assigned to a classroom of type 'Lab'.
      8. A subject must be taught by the faculty member it is assigned to for a specific group.

      SOFT CONSTRAINTS (Try to satisfy):
      1. Distribute classes for a subject evenly throughout the week. Avoid scheduling all classes for one subject on the same day.
      2. Avoid scheduling more than 3 consecutive hours of classes for any student group. A lunch break around 12:00-14:00 is ideal.

      ${additionalConstraints ? `ADDITIONAL USER CONSTRAINTS (High Priority): ${additionalConstraints}` : ''}

      Generate the timetable now.
    `;
    
    const timetableSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                day: { type: Type.STRING, description: "Day of the week", enum: DAYS },
                time: { type: Type.STRING, description: "Time slot for the class", enum: TIME_SLOTS },
                groupId: { type: Type.STRING, description: "ID of the student group" },
                subjectId: { type: Type.STRING, description: "ID of the subject" },
                facultyId: { type: Type.STRING, description: "ID of the faculty member" },
                roomId: { type: Type.STRING, description: "ID of the classroom" },
            },
            required: ["day", "time", "groupId", "subjectId", "facultyId", "roomId"]
        }
    };

    const config: any = {
        responseMimeType: "application/json",
        responseSchema: timetableSchema,
        systemInstruction: systemInstruction,
    };
    
    if (generationProfile === 'speed') {
        config.thinkingConfig = { thinkingBudget: 0 };
    }
    if (generationProfile === 'accuracy') {
        config.temperature = 0.2; // Lower temperature for more deterministic, accurate output
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: config,
        });

        const jsonText = response.text.trim();
        const generatedData = JSON.parse(jsonText);

        if (!Array.isArray(generatedData)) {
            console.error("AI response is not an array:", generatedData);
            throw new Error("AI response was not in the expected format. Please try again.");
        }
        
        return generatedData as TimetableEntry[];

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            // Provide a more user-friendly error message
            if (error.message.includes('API key not valid')) {
                throw new Error('The provided API Key is not valid. Please check your environment configuration.');
            }
            throw new Error(`Failed to generate timetable. ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the timetable.");
    }
};
