"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { BookOpen, Wrench, Loader2, X } from "lucide-react";
import { useCodeEditorStore } from "@/store/useCodeEditorStore";
import { InlineDiff } from "./InlineDiff";

type ToolbarPhase =
  | { phase: "toolbar" }
  | { phase: "loading"; action: string }
  | { phase: "explain"; text: string }
  | { phase: "diff"; action: string; oldCode: string; newCode: string }
  | { phase: "failed"; message: string };

interface SelectionToolbarProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selection: any;
  onDismiss: () => void;
}

export function SelectionToolbar({ selection, onDismiss }: SelectionToolbarProps) {
  const { editor, language, error: execError } = useCodeEditorStore();
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [state, setState] = useState<ToolbarPhase>({ phase: "toolbar" });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor || !selection) return;

    const editorDom = editor.getDomNode();
    if (!editorDom) return;

    const startPos = { lineNumber: selection.startLineNumber, column: selection.startColumn };
    const pixelPos = editor.getScrolledVisiblePosition(startPos);
    const editorRect = editorDom.getBoundingClientRect();

    if (!pixelPos) return;

    setPosition({
      top: editorRect.top + pixelPos.top - 48,
      left: editorRect.left + pixelPos.left,
    });
  }, [editor, selection]);

  const handleDismiss = useCallback(() => {
    onDismiss();
    editor?.focus();
  }, [onDismiss, editor]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleDismiss]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleDismiss();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleDismiss]);

  const getSelectedCode = useCallback(() => {
    if (!editor || !selection) return "";
    return editor.getModel()?.getValueInRange(selection) ?? "";
  }, [editor, selection]);

  const handleAction = async (action: "fix" | "explain") => {
    const selectedText = getSelectedCode();
    if (!selectedText) return;

    const taskMap = { fix: "fix", explain: "explain_brief" } as const;

    setState({ phase: "loading", action });

    try {
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          code: editor?.getModel()?.getValue() ?? "",
          task: taskMap[action],
          selectedText,
          error: action === "fix" ? (execError ?? undefined) : undefined,
          cursorLine: selection.startLineNumber,
          cursorCol: selection.startColumn,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "AI request failed" }));
        setState({ phase: "failed", message: data.error ?? "AI request failed" });
        return;
      }

      const data = await res.json();
      if (typeof data.result !== "string" || !data.result.trim()) {
        setState({ phase: "failed", message: "AI returned an empty response." });
        return;
      }

      if (action === "explain") {
        setState({ phase: "explain", text: data.result });
      } else {
        setState({ phase: "diff", action, oldCode: selectedText, newCode: data.result });
      }
    } catch {
      setState({ phase: "failed", message: "Network error. Please try again." });
    }
  };

  const handleAccept = () => {
    if (state.phase !== "diff" || !editor) return;
    editor.executeEdits("ai-inline", [{ range: selection, text: state.newCode }]);
    handleDismiss();
  };

  if (!position) return null;

  return createPortal(
    <div
      ref={containerRef}
      style={{ position: "fixed", top: position.top, left: position.left, zIndex: 9999 }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {state.phase === "toolbar" && (
        <div className="flex items-center gap-0.5 bg-[#0a0a1a] border border-[var(--border)] rounded-[100vw] px-1.5 py-1 shadow-2xl">
          <button
            onClick={() => handleAction("explain")}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] rounded-[100vw] transition-colors font-body"
          >
            <BookOpen className="size-3" />
            Explain
          </button>
          <div className="w-px h-3 bg-[var(--border)]" />
          <button
            onClick={() => handleAction("fix")}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] rounded-[100vw] transition-colors font-body"
          >
            <Wrench className="size-3" />
            Fix
          </button>
        </div>
      )}

      {state.phase === "loading" && (
        <div className="flex items-center gap-2 bg-[#0a0a1a] border border-[var(--border)] rounded-[100vw] px-3 py-1.5 shadow-2xl">
          <Loader2 className="size-3 animate-spin text-[var(--flame)]" />
          <span className="text-xs text-[var(--text-muted)] font-body capitalize">
            {state.action}ing…
          </span>
        </div>
      )}

      {state.phase === "explain" && (
        <div className="max-w-xs bg-[#0a0a1a] border border-[var(--border)] rounded-[var(--radius-sm)] p-3 shadow-2xl">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <span className="text-xs text-[var(--text-muted)] font-body uppercase tracking-wide">Explanation</span>
            <button
              onClick={handleDismiss}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0"
            >
              <X className="size-3" />
            </button>
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-body leading-relaxed">{state.text}</p>
        </div>
      )}

      {state.phase === "failed" && (
        <div className="flex items-center gap-2 bg-[#0a0a1a] border border-[var(--border)] rounded-[100vw] px-3 py-1.5 shadow-2xl">
          <span className="text-xs text-red-400 font-body">{state.message}</span>
          <button
            onClick={() => setState({ phase: "toolbar" })}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Retry"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      {state.phase === "diff" && (
        <div className="w-96">
          <InlineDiff
            oldCode={state.oldCode}
            newCode={state.newCode}
            onAccept={handleAccept}
            onReject={handleDismiss}
            label={`AI ${state.action}`}
          />
        </div>
      )}
    </div>,
    document.body
  );
}
