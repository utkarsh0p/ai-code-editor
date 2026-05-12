import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Snippet } from "@/models/Snippet";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const snippets = await Snippet.find({ userId: payload.userId })
    .select("-code")
    .sort({ createdAt: -1 });

  return NextResponse.json({ snippets });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, language, code } = body as { title: string; language: string; code: string };

  if (!title?.trim() || !language || !code) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await connectDB();

  const snippet = await Snippet.create({
    userId: payload.userId,
    title: title.trim(),
    language,
    code,
  });

  return NextResponse.json({ snippet }, { status: 201 });
}
