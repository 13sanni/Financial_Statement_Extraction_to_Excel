import dotenv from "dotenv";

dotenv.config();

export const env = {
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
};

export function hasGeminiConfig(): boolean {
  return Boolean(env.geminiApiKey);
}
