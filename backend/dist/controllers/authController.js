"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.register = register;
const zod_1 = require("zod");
const authService_1 = require("../services/authService");
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
});
async function login(req, res, next) {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid login payload." });
            return;
        }
        const token = await (0, authService_1.loginWithEmailPassword)(parsed.data.email, parsed.data.password);
        res.json({ token });
    }
    catch (error) {
        next(error);
    }
}
async function register(req, res, next) {
    try {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid register payload." });
            return;
        }
        await (0, authService_1.registerWithEmailPassword)(parsed.data.email, parsed.data.password);
        res.status(201).json({ ok: true });
    }
    catch (error) {
        next(error);
    }
}
