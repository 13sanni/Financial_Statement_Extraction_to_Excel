import dotenv from "dotenv";

dotenv.config();

export const env = {
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  mongoUri: process.env.MONGO_URI || "",
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "12h",
  corsOrigin: process.env.CORS_ORIGIN || "",
  adminEmail: process.env.ADMIN_EMAIL || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  enableHttpLogs:
    process.env.ENABLE_HTTP_LOGS !== undefined
      ? process.env.ENABLE_HTTP_LOGS === "true"
      : process.env.NODE_ENV !== "production",
};

export function hasGeminiConfig(): boolean {
  return Boolean(env.geminiApiKey);
}

export function hasMongoConfig(): boolean {
  return Boolean(env.mongoUri);
}

export function hasJwtConfig(): boolean {
  return Boolean(env.jwtSecret);
}
