import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { callLLM, callLLMClean, callLLMStream, AITask } from "@/lib/ai";

const CLEAN_TASKS = new Set<AITask>(["inline_edit", "fix", "explain_brief"]);

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { language, code, cursorLine, cursorCol, task, error, selectedText, prefix, userMessage, stream } = body as {
      language: string;
      code: string;
      cursorLine?: number;
      cursorCol?: number;
      task: AITask;
      error?: string;
      selectedText?: string;
      prefix?: string;
      userMessage?: string;
      stream?: boolean;
    };

    if (!language || !code || !task) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const llmParams = {
      language,
      code,
      cursorLine: cursorLine ?? 1,
      cursorCol: cursorCol ?? 0,
      task,
      error,
      selectedText,
      prefix,
      userMessage,
    };

    if (CLEAN_TASKS.has(task)) {
      const result = await callLLMClean(llmParams);
      return NextResponse.json({ result });
    }

    if (stream) {
      const generator = callLLMStream(llmParams);
      const readable = new ReadableStream({
        async pull(controller) {
          const { value, done } = await generator.next();
          if (done) {
            controller.close();
          } else {
            controller.enqueue(new TextEncoder().encode(value));
          }
        },
        async cancel() {
          await generator.return(undefined);
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          "X-Accel-Buffering": "no",
        },
      });
    }

    const result = await callLLM(llmParams);
    return NextResponse.json({ result });
  } catch (err) {
    console.error("AI assist error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
