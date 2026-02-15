"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const authService_1 = require("./services/authService");
const port = process.env.PORT ? Number(process.env.PORT) : 4000;
async function startServer() {
    await (0, database_1.connectDatabase)();
    await (0, authService_1.bootstrapAdminUser)();
    app_1.default.listen(port, () => {
        console.log(`API listening on http://localhost:${port}`);
    });
}
startServer().catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
});
