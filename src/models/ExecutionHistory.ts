import mongoose, { Schema, Document } from "mongoose";

export interface IExecutionHistory extends Document {
  userId: string;
  language: string;
  code: string;
  output?: string;
  error?: string;
  executedAt: Date;
}

const executionHistorySchema = new Schema<IExecutionHistory>({
  userId: { type: String, required: true, index: true },
  language: { type: String, required: true },
  code: { type: String, required: true },
  output: { type: String },
  error: { type: String },
  executedAt: { type: Date, default: Date.now },
});

export const ExecutionHistory =
  mongoose.models.ExecutionHistory ??
  mongoose.model<IExecutionHistory>("ExecutionHistory", executionHistorySchema);
