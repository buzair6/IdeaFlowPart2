import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface IdeaEvaluation {
  score: number;
  feedback: string;
  feasibility: number;
  marketPotential: number;
  innovation: number;
  impact: number;
}

export async function evaluateIdea(
  title: string,
  description: string,
  category: string,
  targetAudience?: string,
  timeline?: string
): Promise<IdeaEvaluation> {
  try {
    const prompt = `
Please evaluate the following business/technology idea and provide a comprehensive analysis:

Title: ${title}
Description: ${description}
Category: ${category}
Target Audience: ${targetAudience || 'Not specified'}
Timeline: ${timeline || 'Not specified'}

Please analyze this idea based on the following criteria:
1. Technical/Business Feasibility (0-100)
2. Market Potential (0-100)
3. Innovation Level (0-100)
4. Potential Impact (0-100)
5. Overall Score (0-100)

Provide constructive feedback including strengths, weaknesses, and suggestions for improvement.

Respond with JSON in this exact format:
{
  "score": number,
  "feedback": "detailed feedback text",
  "feasibility": number,
  "marketPotential": number,
  "innovation": number,
  "impact": number
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            score: { type: "number" },
            feedback: { type: "string" },
            feasibility: { type: "number" },
            marketPotential: { type: "number" },
            innovation: { type: "number" },
            impact: { type: "number" },
          },
          required: ["score", "feedback", "feasibility", "marketPotential", "innovation", "impact"],
        },
      },
      contents: prompt,
    });

    const rawJson = response.text;
    
    if (rawJson) {
      const evaluation: IdeaEvaluation = JSON.parse(rawJson);
      
      // Ensure scores are within valid range
      evaluation.score = Math.max(0, Math.min(100, evaluation.score));
      evaluation.feasibility = Math.max(0, Math.min(100, evaluation.feasibility));
      evaluation.marketPotential = Math.max(0, Math.min(100, evaluation.marketPotential));
      evaluation.innovation = Math.max(0, Math.min(100, evaluation.innovation));
      evaluation.impact = Math.max(0, Math.min(100, evaluation.impact));
      
      return evaluation;
    } else {
      throw new Error("Empty response from AI model");
    }
  } catch (error) {
    console.error("AI evaluation error:", error);
    
    // Return fallback evaluation
    return {
      score: 50,
      feedback: "AI evaluation temporarily unavailable. Please try again later.",
      feasibility: 50,
      marketPotential: 50,
      innovation: 50,
      impact: 50,
    };
  }
}
