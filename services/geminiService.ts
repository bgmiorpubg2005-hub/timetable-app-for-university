import { AppState, TimetableEntry } from '../context/types';

/**
 * Generates a timetable by calling the secure serverless API endpoint.
 * This function sends the necessary data to the backend, which then communicates
 * with the Gemini API. This approach keeps the API key secure on the server.
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
    // We only need to send the data required for generation, not the entire state.
    const { classrooms, subjects, studentGroups, faculty, leaveRequests } = state;

    try {
        // The fetch call points to the serverless function located in `api/generate-timetable.ts`
        const response = await fetch('/api/generate-timetable', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                // Pass all necessary data in the request body
                classrooms,
                subjects,
                studentGroups,
                faculty,
                leaveRequests,
                generationProfile,
                additionalConstraints,
            }),
        });

        const responseData = await response.json();

        if (!response.ok) {
            // If the server returned an error, throw it to be caught by the calling component
            throw new Error(responseData.message || `API Error: ${response.statusText}`);
        }

        // The serverless function returns the timetable in a 'timetable' property
        return responseData.timetable;

    } catch (error) {
        console.error("Error calling timetable generation API:", error);
        // Re-throw the error so the UI can display an appropriate message
        if (error instanceof Error) {
            throw new Error(`Failed to generate timetable. ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the timetable.");
    }
};
