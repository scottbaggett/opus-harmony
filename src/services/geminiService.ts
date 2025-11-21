import type { TheoryResponse, ViewMode } from "../core/types";

/**
 * Client-side service for Gemini AI integration
 * Calls backend API routes to keep API keys secure
 */

export const getMaestroAdvice = async (
	mode: ViewMode,
	context: string
): Promise<TheoryResponse> => {
	try {
		const response = await fetch("/api/maestro-advice", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ mode, context }),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		console.error("Gemini Service Error:", error);
		return {
			explanation: "The muses are silent at the moment. Focus on your rhythm.",
			tip: "Keep practicing.",
		};
	}
};

export const generatePracticeDrill = async (difficulty: string): Promise<string> => {
	// TODO: Implement backend API route for practice drills
	return "Simple 4/4 time march.";
};
