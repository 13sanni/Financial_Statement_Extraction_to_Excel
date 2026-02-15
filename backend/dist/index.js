"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const database_1 = require("./config/database");
const toolRoutes_1 = __importDefault(require("./routes/toolRoutes"));
const appError_1 = require("./utils/appError");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "2mb" }));
app.get("/health", (_req, res) => {
    res.json({ ok: true });
});
app.use("/", toolRoutes_1.default);
app.use((err, _req, res, _next) => {
    const statusCode = err instanceof appError_1.AppError ? err.statusCode : 500;
    res.status(statusCode).json({ error: err.message || "Internal server error" });
});
const port = process.env.PORT ? Number(process.env.PORT) : 4000;
async function startServer() {
    await (0, database_1.connectDatabase)();
    app.listen(port, () => {
        console.log(`API listening on http://localhost:${port}`);
    });
}
startServer().catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
});
