import { Model, Schema, model, models } from "mongoose";

export type UserRole = "admin" | "analyst";

export type UserDocument = {
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ["admin", "analyst"], default: "analyst" },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

const existingModel = models.User as Model<UserDocument> | undefined;
export const UserModel = existingModel || model<UserDocument>("User", userSchema);
