import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  requestCount: number;
  lastResetDate: Date;
  plan: "free" | "pro";
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  requestCount: { type: Number, default: 0 },
  lastResetDate: { type: Date, default: Date.now },
  plan: { type: String, enum: ["free", "pro"], default: "free" },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.models.User ?? mongoose.model<IUser>("User", userSchema);
