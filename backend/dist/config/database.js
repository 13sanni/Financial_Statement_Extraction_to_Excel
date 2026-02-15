"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
let connectionAttempted = false;
async function connectDatabase() {
    if (connectionAttempted)
        return;
    connectionAttempted = true;
    if (!(0, env_1.hasMongoConfig)()) {
        console.warn("MONGO_URI is not configured. Metadata persistence is disabled.");
        return;
    }
    await mongoose_1.default.connect(env_1.env.mongoUri);
    console.log("MongoDB connected.");
}
