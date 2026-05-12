"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Zap, Loader2, X } from "lucide-react";
import { useCodeEditorStore } from "@/store/useCodeEditorStore";
import { InlineDiff } from "./InlineDiff";

function parseErrorLine(errorMsg: string): number | null {
  const patterns = [
    /\bline[:\s]+(\d+)/i,
    /:(\d+):\d+/,
    /\[(\d+),\s*\d+\]/,
    /\(line\s+(\d+)\)/i,
    /:(\d+)/,
  ];
  for (const pattern of patterns) {
    const match = errorMsg.match(pattern);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > 0) return n;
    }
  }
  return null;
}

type FixPhase =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "diff"; oldCode: string; newCode: string }
  | { phase: "failed"; message: string };

export function ErrorLens() {
  const { editor, language, error: execError } = useCodeEditorStore();
  const [fixPhase, setFixPhase] = useState<FixPhase>({ phase: "idle" });
  const [fixBtnPos, setFixBtnPos] = useState<{ top: number; left: number; editorRight: number } | null>(null);
  const decorationIds = useRef<string[]>([]);

  useEffect(() => {
    if (!editor) return;

    // Clear previous decorations
    decorationIds.current = editor.deltaDecorations(decorationIds.current, []);
    setFixBtnPos(null);
    setFixPhase({ phase: "idle" });

    if (!execError) return;

    const lineNum = parseErrorLine(execError);
    if (!lineNum) return;

    const model = editor.getModel();
    if (!model) return;

    const safeLineNum = Math.min(lineNum, model.getLineCount());

    decorationIds.current = editor.deltaDecorations([], [
      {
        range: {
          startLineNumber: safeLineNum,
          startColumn: 1,
          endLineNumber: safeLineNum,
          endColumn: 1,
        },
        options: {
          isWholeLine: true,
          className: "ai-error-line-highlight",
          overviewRuler: { color: "#fa4028", position: 1 },
          minimap: { color: "#fa4028", position: 1 },
        },
      },
    ]);

    const editorDom = editor.getDomNode();
    if (!editorDom) return;

    const updatePosition = () => {
      const editorRect = editorDom.getBoundingClientRect();
      setFixBtnPos({
        top: editorRect.top + 14,
        left: editorRect.right - 112,
        editorRight: editorRect.right,
      });
    };

    updatePosition();

    window.addEventListener("resize", updatePosition);
    const layoutDisposable = editor.onDidLayoutChange?.(updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
      layoutDisposable?.dispose();
      if (editor) {
        decorationIds.current = editor.deltaDecorations(decorationIds.current, []);
      }
    };
  }, [editor, execError]);

  const handleFix = async () => {
    if (!editor || !execError) return;

    setFixPhase({ phase: "loading" });

    try {
      const code = editor.getModel()?.getValue() ?? "";
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          code,
          task: "fix",
          error: execError,
          cursorLine: parseErrorLine(execError) ?? 1,
          cursorCol: 1,
        }),
      });

      if (!res.ok) {
        setFixPhase({ phase: "failed", message: "AI fix failed. Try again." });
        return;
      }

      const data = await res.json();
      if (typeof data.result !== "string" || !data.result.trim()) {
        setFixPhase({ phase: "failed", message: "AI returned an empty response." });
        return;
      }
      setFixPhase({ phase: "diff", oldCode: code, newCode: data.result });
    } catch {
      setFixPhase({ phase: "failed", message: "Network error." });
    }
  };

  const handleAccept = () => {
    if (fixPhase.phase !== "diff" || !editor) return;
    const model = editor.getModel();
    if (!model) return;
    editor.executeEdits("ai-fix", [{ range: model.getFullModelRange(), text: fixPhase.newCode }]);
    setFixPhase({ phase: "idle" });
    setFixBtnPos(null);
  };

  const handleDismissDiff = () => {
    setFixPhase({ phase: "idle" });
  };

  // Inject CSS for Monaco error line decoration
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "ai-error-lens-style";
    style.textContent = `.ai-error-line-highlight { background-color: rgba(250, 64, 40, 0.07) !important; border-left: 2px solid rgba(250, 64, 40, 0.6) !important; }`;
    if (!document.getElementById("ai-error-lens-style")) {
      document.head.appendChild(style);
    }
    return () => {
      document.getElementById("ai-error-lens-style")?.remove();
    };
  }, []);

  if (!fixBtnPos) return null;

  return createPortal(
    <>
      {fixPhase.phase === "idle" && (
        <button
          onClick={handleFix}
          style={{
            position: "fixed",
            top: fixBtnPos.top,
            left: fixBtnPos.left,
            zIndex: 9998,
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-[#0a0a1a] border border-[var(--flame)]/35 text-[var(--flame)] rounded-[100vw] hover:bg-[var(--flame)]/10 transition-colors font-body whitespace-nowrap shadow-lg"
        >
          <Zap className="size-3" />
          AI Fix
        </button>
      )}

      {fixPhase.phase === "loading" && (
        <div
          style={{
            position: "fixed",
            top: fixBtnPos.top,
            left: fixBtnPos.left,
            zIndex: 9998,
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[var(--text-muted)] font-body bg-[#0a0a1a] border border-[var(--border)] rounded-[100vw] whitespace-nowrap shadow-lg"
        >
          <Loader2 className="size-3 animate-spin" />
          Analyzing…
        </div>
      )}

      {fixPhase.phase === "failed" && (
        <div
          style={{
            position: "fixed",
            top: fixBtnPos.top,
            left: Math.min(fixBtnPos.left, fixBtnPos.editorRight - 280),
            zIndex: 9998,
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-400 font-body bg-[#0a0a1a] border border-[var(--border)] rounded-[100vw] shadow-lg"
        >
          <span>{fixPhase.message}</span>
          <button onClick={() => setFixPhase({ phase: "idle" })}>
            <X className="size-3" />
          </button>
        </div>
      )}

      {fixPhase.phase === "diff" && (
        <div
          style={{
            position: "fixed",
            top: fixBtnPos.top + 34,
            left: Math.min(fixBtnPos.left, fixBtnPos.editorRight - 420),
            width: 400,
            zIndex: 9999,
          }}
        >
          <InlineDiff
            oldCode={fixPhase.oldCode}
            newCode={fixPhase.newCode}
            onAccept={handleAccept}
            onReject={handleDismissDiff}
            label="AI Fix"
          />
        </div>
      )}
    </>,
    document.body
  );
}
