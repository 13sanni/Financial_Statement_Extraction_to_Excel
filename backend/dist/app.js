"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const env_1 = require("./config/env");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const toolRoutes_1 = __importDefault(require("./routes/toolRoutes"));
const appError_1 = require("./utils/appError");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
}));
app.use((0, cors_1.default)({
    origin: env_1.env.corsOrigin ? env_1.env.corsOrigin.split(",").map((item) => item.trim()) : true,
}));
app.use(express_1.default.json({ limit: "2mb" }));
app.use((req, res, next) => {
    const requestId = (0, crypto_1.randomUUID)();
    res.setHeader("X-Request-Id", requestId);
    if (!env_1.env.enableHttpLogs) {
        next();
        return;
    }
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        console.log(JSON.stringify({
            type: "http_request",
            requestId,
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            durationMs: duration,
        }));
    });
    next();
});
app.get("/health", (_req, res) => {
    res.json({ ok: true });
});
app.use("/", authRoutes_1.default);
app.use("/", toolRoutes_1.default);
app.use((err, _req, res, _next) => {
    const statusCode = err instanceof appError_1.AppError ? err.statusCode : 500;
    res.status(statusCode).json({ error: err.message || "Internal server error" });
});
exports.default = app;
