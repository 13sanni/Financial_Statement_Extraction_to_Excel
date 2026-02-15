import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { loginWithEmailPassword } from "../services/authService";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid login payload." });
      return;
    }

    const token = await loginWithEmailPassword(parsed.data.email, parsed.data.password);
    res.json({ token });
  } catch (error) {
    next(error);
  }
}
