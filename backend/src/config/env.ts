import dotenv from "dotenv";

dotenv.config();

export const env = {
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  mongoUri: process.env.MONGO_URI || "",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
  cloudinaryFolder: process.env.CLOUDINARY_FOLDER || "financial-statement-extraction",
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "12h",
  corsOrigin: process.env.CORS_ORIGIN || "",
  adminEmail: process.env.ADMIN_EMAIL || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
};

export function hasGeminiConfig(): boolean {
  return Boolean(env.geminiApiKey);
}

export function hasMongoConfig(): boolean {
  return Boolean(env.mongoUri);
}

export function hasCloudinaryConfig(): boolean {
  return Boolean(env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret);
}

export function hasJwtConfig(): boolean {
  return Boolean(env.jwtSecret);
}
