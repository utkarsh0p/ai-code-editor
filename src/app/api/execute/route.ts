import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const JUDGE0_URL = process.env.JUDGE0_API_URL ?? "https://ce.judge0.com";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { language_id, source_code } = await req.json();

  if (!language_id || !source_code) {
    return NextResponse.json({ error: "Missing language_id or source_code" }, { status: 400 });
  }

  const response = await fetch(
    `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language_id, source_code }),
    }
  );

  const data = await response.json();
  return NextResponse.json(data);
}
