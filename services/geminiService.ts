
import { GoogleGenAI, Type } from "@google/genai";
import { Student, StudentImage } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const imageToPart = (image: StudentImage) => ({
  inlineData: {
    mimeType: image.mimeType,
    data: image.base64,
  },
});

export const recognizeStudent = async (
  liveImage: StudentImage,
  students: Student[]
): Promise<{ studentId: string; confidence: number } | null> => {
  if (!students.length) {
    return null;
  }

  // To improve performance, we can run recognition checks in parallel
  const recognitionPromises = students.map(async (student) => {
    const prompt = `
      Analyze the person in the first image (the candidate). 
      Compare them against the people in the subsequent images (the student record).
      Is the candidate the same person as the student in the record?
      Respond ONLY with a valid JSON object with two keys: "match" (boolean) and "confidence" (a number between 0 and 1).
      Example: {"match": true, "confidence": 0.95}
    `;

    const imageParts = [
      imageToPart(liveImage),
      ...student.images.map(imageToPart)
    ];

    try {
      // FIX: Use responseSchema to ensure the model returns valid JSON, making parsing more reliable.
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [{ text: prompt }, ...imageParts] },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              match: { type: Type.BOOLEAN },
              confidence: { type: Type.NUMBER },
            },
            required: ['match', 'confidence'],
          },
        },
      });
      const text = response.text.trim();
      const result = JSON.parse(text);
      
      if (result.match === true && typeof result.confidence === 'number' && result.confidence > 0.85) {
        return { studentId: student.id, confidence: result.confidence };
      }
    } catch (error) {
      console.error(`Error recognizing student ${student.id}:`, error);
    }
    return null;
  });

  const results = await Promise.all(recognitionPromises);
  const successfulMatches = results.filter(r => r !== null) as { studentId: string; confidence: number }[];

  if (successfulMatches.length === 0) {
    return null;
  }

  // Return the match with the highest confidence
  return successfulMatches.reduce((prev, current) => (prev.confidence > current.confidence) ? prev : current);
};
