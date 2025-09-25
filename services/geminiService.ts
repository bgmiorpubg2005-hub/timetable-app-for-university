import { AppState, TimetableEntry } from '../context/types';

/**
 * Generates a timetable by sending data to a secure backend API endpoint,
 * which then communicates with the Gemini API.
 * @param appState - The current state of the application.
 * @param generationProfile - The desired generation profile ('speed', 'balanced', 'accuracy').
 * @param additionalConstraints - Any user-provided constraints.
 * @returns A promise that resolves to an array of timetable entries.
 */
export const generateTimetableWithGemini = async (
    appState: AppState,
    generationProfile: 'balanced' | 'speed' | 'accuracy',
    additionalConstraints: string
): Promise<TimetableEntry[]> => {
    // Extract only the necessary data to send to the backend.
    // This avoids sending the entire UI state over the network.
    const { classrooms, subjects, studentGroups, faculty, leaveRequests } = appState;
    
    try {
        // The endpoint '/api/generate-timetable' is a convention for serverless functions
        // on platforms like Vercel or Netlify.
        const response = await fetch('/api/generate-timetable', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                classrooms,
                subjects,
                studentGroups,
                faculty,
                leaveRequests,
                generationProfile,
                additionalConstraints,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            // Propagate the specific error message from the backend.
            throw new Error(errorData.error || `API error: ${response.statusText}`);
        }

        const data = await response.json();
        
        // The backend is expected to return the data in a { timetable: [...] } structure.
        if (!data.timetable) {
            throw new Error("Invalid response format from the server.");
        }
        
        return data.timetable as TimetableEntry[];

    } catch (error) {
        console.error("Error calling timetable generation API:", error);
        // Rethrow the error so the UI layer can catch it and display a message.
        throw new Error((error as Error).message || "An unknown error occurred while communicating with the server.");
    }
};
