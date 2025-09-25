import { AppState, TimetableEntry } from '../context/types';

/**
 * Generates a timetable by calling a secure serverless function.
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
    
    try {
        const response = await fetch('/api/generate-timetable', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ state, generationProfile, additionalConstraints }),
        });

        const data = await response.json();

        if (!response.ok) {
            // Use the error message from the API if available, otherwise a generic one.
            const errorMessage = data.message || `API request failed with status ${response.status}`;
            throw new Error(errorMessage);
        }

        return data as TimetableEntry[];

    } catch (error) {
        console.error("Error calling timetable generation API:", error);
        // Rethrow the error to be caught by the component and displayed to the user.
        if (error instanceof Error) {
            throw new Error(`Failed to generate timetable: ${error.message}`);
        }
        throw new Error("An unknown error occurred while communicating with the generation service.");
    }
};