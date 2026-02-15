"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
exports.hasGeminiConfig = hasGeminiConfig;
exports.hasMongoConfig = hasMongoConfig;
exports.hasJwtConfig = hasJwtConfig;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.env = {
    geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
    geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    mongoUri: process.env.MONGO_URI || "",
    jwtSecret: process.env.JWT_SECRET || "",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "12h",
    corsOrigin: process.env.CORS_ORIGIN || "",
    adminEmail: process.env.ADMIN_EMAIL || "",
    adminPassword: process.env.ADMIN_PASSWORD || "",
    enableHttpLogs: process.env.ENABLE_HTTP_LOGS !== undefined
        ? process.env.ENABLE_HTTP_LOGS === "true"
        : process.env.NODE_ENV !== "production",
};
function hasGeminiConfig() {
    return Boolean(exports.env.geminiApiKey);
}
function hasMongoConfig() {
    return Boolean(exports.env.mongoUri);
}
function hasJwtConfig() {
    return Boolean(exports.env.jwtSecret);
}
