"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
exports.hasGeminiConfig = hasGeminiConfig;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.env = {
    geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
    geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
};
function hasGeminiConfig() {
    return Boolean(exports.env.geminiApiKey);
}
