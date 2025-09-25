// This serverless function is now deprecated.
// The timetable generation logic has been moved to the client-side service
// at `services/geminiService.ts` to work within the project's static environment.
// This file is kept to avoid breaking project structure but should not be used.

// A mock interface to satisfy TypeScript, as the function signature is required.
interface MockResponse {
    status: (code: number) => { json: (data: any) => void };
}

export default async function handler(req: any, res: MockResponse) {
    // Return a 501 Not Implemented status code.
    res.status(501).json({ message: 'This API endpoint is deprecated. Timetable generation is now handled on the client.' });
}
