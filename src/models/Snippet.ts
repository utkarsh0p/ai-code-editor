import mongoose, { Schema, Document } from "mongoose";

export interface ISnippet extends Document {
  userId: string;
  language: string;
  code: string;
  title: string;
  createdAt: Date;
}

const snippetSchema = new Schema<ISnippet>({
  userId: { type: String, required: true, index: true },
  language: { type: String, required: true },
  code: { type: String, required: true },
  title: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Snippet =
  mongoose.models.Snippet ?? mongoose.model<ISnippet>("Snippet", snippetSchema);
