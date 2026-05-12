import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Snippet } from "@/models/Snippet";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const snippet = await Snippet.findOne({ _id: id, userId: payload.userId });
  if (!snippet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ snippet });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { title, code } = body as { title?: string; code?: string };

  const update: Record<string, string> = {};
  if (title?.trim()) update.title = title.trim();
  if (code !== undefined) update.code = code;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await connectDB();

  const snippet = await Snippet.findOneAndUpdate(
    { _id: id, userId: payload.userId },
    update,
    { new: true }
  );
  if (!snippet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ snippet });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const snippet = await Snippet.findOneAndDelete({ _id: id, userId: payload.userId });
  if (!snippet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
