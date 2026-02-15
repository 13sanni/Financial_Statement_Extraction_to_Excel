"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ["admin", "analyst"], default: "analyst" },
    isActive: { type: Boolean, required: true, default: true },
}, { timestamps: true });
const existingModel = mongoose_1.models.User;
exports.UserModel = existingModel || (0, mongoose_1.model)("User", userSchema);
