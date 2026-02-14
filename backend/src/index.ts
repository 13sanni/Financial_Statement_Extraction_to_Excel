import cors from "cors";
import express from "express";
import toolRoutes from "./routes/toolRoutes";
import { AppError } from "./utils/appError";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/", toolRoutes);

app.use(
  (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const statusCode = err instanceof AppError ? err.statusCode : 500;
    res.status(statusCode).json({ error: err.message || "Internal server error" });
  },
);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
