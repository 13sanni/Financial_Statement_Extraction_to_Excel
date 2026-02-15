"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
exports.hasGeminiConfig = hasGeminiConfig;
exports.hasMongoConfig = hasMongoConfig;
exports.hasCloudinaryConfig = hasCloudinaryConfig;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.env = {
    geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
    geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    mongoUri: process.env.MONGO_URI || "",
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
    cloudinaryFolder: process.env.CLOUDINARY_FOLDER || "financial-statement-extraction",
};
function hasGeminiConfig() {
    return Boolean(exports.env.geminiApiKey);
}
function hasMongoConfig() {
    return Boolean(exports.env.mongoUri);
}
function hasCloudinaryConfig() {
    return Boolean(exports.env.cloudinaryCloudName && exports.env.cloudinaryApiKey && exports.env.cloudinaryApiSecret);
}
