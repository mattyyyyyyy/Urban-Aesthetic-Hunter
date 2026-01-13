import { GoogleGenAI } from "@google/genai";

// Ensure API Key is available
const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing via process.env.API_KEY");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-types' });

/**
 * Edits an image based on a text prompt using Gemini 2.5 Flash Image.
 * @param base64Image The source image in base64 format (no data URI prefix).
 * @param mimeType The mime type of the image (e.g., 'image/jpeg').
 * @param prompt The editing instruction.
 * @returns The base64 data of the generated image.
 */
export const editImageWithGemini = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    if (response.candidates && response.candidates.length > 0) {
      const parts = response.candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }
    
    console.warn("No image data found in response");
    return null;
  } catch (error) {
    console.error("Gemini Image Editing Error:", error);
    throw error;
  }
};

/**
 * Helper to strip data URI prefix using robust string parsing
 */
export const stripDataPrefix = (dataUri: string): { data: string; mimeType: string } => {
  if (!dataUri || typeof dataUri !== 'string') {
    throw new Error("Invalid input: dataUri must be a non-empty string");
  }

  // Find the comma that separates metadata from data
  const commaIndex = dataUri.indexOf(',');
  if (commaIndex === -1) {
    throw new Error("Invalid Data URI: missing comma separator");
  }

  const metaPart = dataUri.substring(0, commaIndex); // e.g., "data:image/png;base64"
  const dataPart = dataUri.substring(commaIndex + 1);

  // Extract MimeType
  // Expected format: "data:[mimeType];base64"
  const mimeMatch = metaPart.match(/^data:([^;]+);/);
  
  if (!mimeMatch || mimeMatch.length < 2) {
     // Fallback if structure is unexpected but comma exists, assume jpeg default for robustness if it looks base64
     console.warn("Could not extract mime type from data URI, defaulting to image/jpeg");
     return { mimeType: "image/jpeg", data: dataPart };
  }

  return { mimeType: mimeMatch[1], data: dataPart };
};