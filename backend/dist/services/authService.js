"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrapAdminUser = bootstrapAdminUser;
exports.loginWithEmailPassword = loginWithEmailPassword;
exports.registerWithEmailPassword = registerWithEmailPassword;
exports.verifyAuthToken = verifyAuthToken;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const user_1 = require("../models/user");
const appError_1 = require("../utils/appError");
async function bootstrapAdminUser() {
    if (!(0, env_1.hasMongoConfig)())
        return;
    if (!env_1.env.adminEmail || !env_1.env.adminPassword) {
        console.warn("ADMIN_EMAIL/ADMIN_PASSWORD not configured. Skipping admin bootstrap.");
        return;
    }
    const email = env_1.env.adminEmail.toLowerCase().trim();
    const existing = await user_1.UserModel.findOne({ email }).lean();
    if (existing)
        return;
    const passwordHash = await bcryptjs_1.default.hash(env_1.env.adminPassword, 10);
    await user_1.UserModel.create({
        email,
        passwordHash,
        role: "admin",
        isActive: true,
    });
    console.log(`Admin user bootstrapped for ${email}`);
}
async function loginWithEmailPassword(email, password) {
    if (!(0, env_1.hasJwtConfig)()) {
        throw new appError_1.AppError("JWT is not configured. Set JWT_SECRET.", 500);
    }
    const normalizedEmail = email.toLowerCase().trim();
    const user = await user_1.UserModel.findOne({ email: normalizedEmail });
    if (!user || !user.isActive)
        throw new appError_1.AppError("Invalid credentials.", 401);
    const matches = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!matches)
        throw new appError_1.AppError("Invalid credentials.", 401);
    const payload = {
        sub: String(user._id),
        email: user.email,
        role: user.role,
    };
    return jsonwebtoken_1.default.sign(payload, env_1.env.jwtSecret, { expiresIn: env_1.env.jwtExpiresIn });
}
async function registerWithEmailPassword(email, password) {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await user_1.UserModel.findOne({ email: normalizedEmail }).lean();
    if (existing)
        throw new appError_1.AppError("An account with this email already exists.", 409);
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    await user_1.UserModel.create({
        email: normalizedEmail,
        passwordHash,
        role: "analyst",
        isActive: true,
    });
}
function verifyAuthToken(token) {
    if (!(0, env_1.hasJwtConfig)())
        throw new appError_1.AppError("JWT is not configured. Set JWT_SECRET.", 500);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
        return decoded;
    }
    catch {
        throw new appError_1.AppError("Invalid or expired token.", 401);
    }
}
