import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { GoogleGenAI, Type } from "@google/genai";
import type { TheoryResponse } from "../core/types";

export const Route = createFileRoute("/api/maestro-advice")({
	server: {
		handlers: {
			POST: async ({ request }) => {
		try {
			const { mode, context } = await request.json();

			const apiKey = process.env.GEMINI_API_KEY;
			if (!apiKey) {
				return json(
					{
						explanation: "The muses are silent at the moment. Focus on your rhythm.",
						tip: "Keep practicing.",
					},
					{ status: 500 }
				)
			}

			const genAI = new GoogleGenAI({ apiKey });

			const prompt = `You are a strict but encouraging Classical Music Maestro from the Baroque era.
    The student is currently studying ${mode}.
    Context/State of the app: ${context}.

    Provide a brief, elegant piece of music theory advice or a historical anecdote related to this topic.
    Keep it under 50 words.
    Use a sophisticated tone.
    `;

			const response = await genAI.models.generateContent({
				model: "gemini-2.5-flash",
				contents: prompt,
				config: {
					responseMimeType: "application/json",
					responseSchema: {
						type: Type.OBJECT,
						properties: {
							explanation: { type: Type.STRING },
							tip: { type: Type.STRING },
						},
					},
				},
			})

			if (response.text) {
				// Clean the string before parsing (LLMs sometimes wrap JSON in markdown code blocks)
				let cleanText = response.text.trim();
				cleanText = cleanText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
				const data = JSON.parse(cleanText) as TheoryResponse;
				return json(data);
			}

			throw new Error("No response text");
			} catch (error) {
				console.error("Gemini Service Error:", error);
				return json(
					{
						explanation: "The muses are silent at the moment. Focus on your rhythm.",
						tip: "Keep practicing.",
					},
					{ status: 500 }
				);
			}
		},
		},
	},
});
