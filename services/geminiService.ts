import { GoogleGenAI, Type } from "@google/genai";
import { TheoryResponse, ViewMode } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMaestroAdvice = async (mode: ViewMode, context: string): Promise<TheoryResponse> => {
  try {
    const modelId = "gemini-2.5-flash";
    
    const prompt = `You are a strict but encouraging Classical Music Maestro from the Baroque era.
    The student is currently studying ${mode}. 
    Context/State of the app: ${context}.
    
    Provide a brief, elegant piece of music theory advice or a historical anecdote related to this topic.
    Keep it under 50 words.
    Use a sophisticated tone.
    `;

    const response = await genAI.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
            tip: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as TheoryResponse;
    }
    
    throw new Error("No response text");
  } catch (error) {
    console.error("Gemini Service Error:", error);
    return {
      explanation: "The muses are silent at the moment. Focus on your rhythm.",
      tip: "Keep practicing."
    };
  }
};

export const generatePracticeDrill = async (difficulty: string): Promise<string> => {
  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a short 4-bar rhythm pattern description for a ${difficulty} level student. describe it in text only.`
    });
    return response.text || "Simple 4/4 time march.";
  } catch (e) {
    return "Simple 4/4 time march.";
  }
};
