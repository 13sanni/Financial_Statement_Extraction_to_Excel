import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env, hasJwtConfig, hasMongoConfig } from "../config/env";
import { UserModel } from "../models/user";
import { AppError } from "../utils/appError";

type AuthTokenPayload = {
  sub: string;
  email: string;
  role: "admin" | "analyst";
};

export async function bootstrapAdminUser(): Promise<void> {
  if (!hasMongoConfig()) return;
  if (!env.adminEmail || !env.adminPassword) {
    console.warn("ADMIN_EMAIL/ADMIN_PASSWORD not configured. Skipping admin bootstrap.");
    return;
  }

  const email = env.adminEmail.toLowerCase().trim();
  const existing = await UserModel.findOne({ email }).lean();
  if (existing) return;

  const passwordHash = await bcrypt.hash(env.adminPassword, 10);
  await UserModel.create({
    email,
    passwordHash,
    role: "admin",
    isActive: true,
  });
  console.log(`Admin user bootstrapped for ${email}`);
}

export async function loginWithEmailPassword(email: string, password: string): Promise<string> {
  if (!hasJwtConfig()) {
    throw new AppError("JWT is not configured. Set JWT_SECRET.", 500);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await UserModel.findOne({ email: normalizedEmail });
  if (!user || !user.isActive) throw new AppError("Invalid credentials.", 401);

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) throw new AppError("Invalid credentials.", 401);

  const payload: AuthTokenPayload = {
    sub: String(user._id),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  if (!hasJwtConfig()) throw new AppError("JWT is not configured. Set JWT_SECRET.", 500);
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
    return decoded;
  } catch {
    throw new AppError("Invalid or expired token.", 401);
  }
}
