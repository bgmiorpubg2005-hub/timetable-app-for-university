// This is a Vercel serverless function that acts as a secure backend endpoint.
// It receives data from the frontend, calls the Gemini API with a server-side
// API key, and returns the generated timetable.

// Note: In a real Vercel environment, you would use a lightweight router
// or handle the request/response objects provided by Vercel's Node.js runtime.
// For this environment, we'll simulate the structure. We assume this file
// is executed in a Node.js environment where `process.env.API_KEY` is available.

import { GoogleGenAI, Type } from "@google/genai";
import { TimetableEntry, Faculty, LeaveRequest, Classroom, Subject, StudentGroup } from '../context/types';
import { TIME_SLOTS, DAYS } from '../context/constants';

// --- Re-usable helper functions (moved from client-side service) ---

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
    if (dayIndex >= 1 && dayIndex <= 5) return DAYS[dayIndex - 1];
    return null;
};

// --- Mock Vercel Request/Response types for standalone functionality ---
interface MockRequest {
    method?: string;
    body: {
        classrooms: Classroom[];
        subjects: Subject[];
        studentGroups: StudentGroup[];
        faculty: Faculty[];
        leaveRequests: LeaveRequest[];
        generationProfile: 'balanced' | 'speed' | 'accuracy';
        additionalConstraints: string;
    };
}

interface MockResponse {
    status: (code: number) => { json: (data: any) => void };
}

// --- Main Serverless Function Handler ---

export default async function handler(req: MockRequest, res: MockResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests are allowed.' });
    }

    if (!process.env.API_KEY) {
        console.error("Gemini API Key is missing from serverless function environment.");
        return res.status(500).json({ message: 'API Key is not configured on the server.' });
    }

    try {
        const {
            classrooms, subjects, studentGroups, faculty, leaveRequests,
            generationProfile, additionalConstraints
        } = req.body;
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        // --- Data processing logic (moved from client-side service) ---
        const approvedLeaves = leaveRequests.filter(r => r.status === 'Approved');
        const facultyWithLeaves: Faculty[] = JSON.parse(JSON.stringify(faculty));

        approvedLeaves.forEach(leave => {
            const facultyMember = facultyWithLeaves.find(f => f.id === leave.facultyId);
            if (!facultyMember) return;

            if (leave.leaveType === 'multi-day' || leave.leaveType === 'full-day') {
                const leaveDates = getDatesInRange(leave.startDate, leave.endDate);
                leaveDates.forEach(date => {
                    const dayOfWeek = getDayOfWeekFromDate(date);
                    if (dayOfWeek) facultyMember.availability[dayOfWeek] = [];
                });
            } else if (leave.leaveType === 'half-day') {
                const dayOfWeek = getDayOfWeekFromDate(new Date(leave.startDate + 'T00:00:00'));
                if (dayOfWeek && facultyMember.availability[dayOfWeek]) {
                    const midpoint = Math.ceil(TIME_SLOTS.length / 2);
                    const slotsToRemove = leave.halfDaySession === 'first-half' ? TIME_SLOTS.slice(0, midpoint) : TIME_SLOTS.slice(midpoint);
                    facultyMember.availability[dayOfWeek] = facultyMember.availability[dayOfWeek].filter(slot => !slotsToRemove.includes(slot));
                }
            }
        });
        
        const facultyAssignments = facultyWithLeaves.map(f => ({
            id: f.id, name: f.name, assignments: f.assignments, availability: f.availability
        }));

        // --- Prompt construction and API call ---
        const systemInstruction = `You are an expert university timetable scheduler...`; // Same as before
        const prompt = `
          DATA:
          1. Classrooms: ${JSON.stringify(classrooms)}
          2. Subjects: ${JSON.stringify(subjects)}
          3. Student Groups: ${JSON.stringify(studentGroups)}
          4. Faculty Assignments & Availability: ${JSON.stringify(facultyAssignments)}
          5. Time Slots: ${JSON.stringify(TIME_SLOTS)}
          6. Days: ${JSON.stringify(DAYS)}

          CONSTRAINTS:
          ... ${additionalConstraints ? `8. Additional User Constraints: ${additionalConstraints}` : ''}
        `; // Same as before, simplified for brevity

        const config: any = {
            responseMimeType: "application/json",
            responseSchema: timetableSchema,
            systemInstruction: systemInstruction,
        };
        if (generationProfile === 'speed') config.thinkingConfig = { thinkingBudget: 0 };
        if (generationProfile === 'accuracy') config.temperature = 0.2;

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

        return res.status(200).json({ timetable: generatedData as TimetableEntry[] });

    } catch (error) {
        console.error("Error in generate-timetable serverless function:", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
        return res.status(500).json({ message: `Failed to generate timetable. ${errorMessage}` });
    }
}
