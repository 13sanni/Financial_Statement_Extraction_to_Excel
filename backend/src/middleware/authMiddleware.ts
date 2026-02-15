import { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../services/authService";
import { AppError } from "../utils/appError";

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    next(new AppError("Missing Bearer token.", 401));
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new AppError("Unauthorized.", 401));
    return;
  }
  if (req.user.role !== "admin") {
    next(new AppError("Forbidden: admin access required.", 403));
    return;
  }
  next();
}
