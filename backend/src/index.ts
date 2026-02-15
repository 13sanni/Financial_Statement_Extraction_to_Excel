import { randomUUID } from "crypto";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";
import authRoutes from "./routes/authRoutes";
import { bootstrapAdminUser } from "./services/authService";
import toolRoutes from "./routes/toolRoutes";
import { AppError } from "./utils/appError";

const app = express();

app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(
  cors({
    origin: env.corsOrigin ? env.corsOrigin.split(",").map((item) => item.trim()) : true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = randomUUID();
  res.setHeader("X-Request-Id", requestId);
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      JSON.stringify({
        type: "http_request",
        requestId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: duration,
      }),
    );
  });
  next();
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/", authRoutes);
app.use("/", toolRoutes);

app.use(
  (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const statusCode = err instanceof AppError ? err.statusCode : 500;
    res.status(statusCode).json({ error: err.message || "Internal server error" });
  },
);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

async function startServer() {
  await connectDatabase();
  await bootstrapAdminUser();
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
