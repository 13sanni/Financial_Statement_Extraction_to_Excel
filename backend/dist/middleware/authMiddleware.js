"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
const authService_1 = require("../services/authService");
const appError_1 = require("../utils/appError");
function requireAuth(req, _res, next) {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
        next(new appError_1.AppError("Missing Bearer token.", 401));
        return;
    }
    try {
        const payload = (0, authService_1.verifyAuthToken)(token);
        req.user = { id: payload.sub, email: payload.email, role: payload.role };
        next();
    }
    catch (error) {
        next(error);
    }
}
function requireAdmin(req, _res, next) {
    if (!req.user) {
        next(new appError_1.AppError("Unauthorized.", 401));
        return;
    }
    if (req.user.role !== "admin") {
        next(new appError_1.AppError("Forbidden: admin access required.", 403));
        return;
    }
    next();
}
