"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Loader2, Sparkles, X } from "lucide-react";
import { useCodeEditorStore } from "@/store/useCodeEditorStore";
import { InlineDiff } from "./InlineDiff";

interface InlineCommandWidgetProps {
  onClose: () => void;
}

export function InlineCommandWidget({ onClose }: InlineCommandWidgetProps) {
  const { editor, language, getCode } = useCodeEditorStore();
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 420 });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Snapshot the selection and old code at mount time (before focus changes)
  const selectionRef = useRef<{ range: unknown; selectedText: string; oldCode: string } | null>(null);

  useEffect(() => {
    if (!editor) return;

    const sel = editor.getSelection();
    const model = editor.getModel();
    const selectedText = sel && !sel.isEmpty() && model ? model.getValueInRange(sel as never) : "";
    const oldCode = selectedText || getCode();
    selectionRef.current = { range: sel, selectedText, oldCode };

    const editorDom = editor.getDomNode();
    if (!editorDom) return;

    const cursorPos = editor.getPosition();
    if (!cursorPos) return;

    const pixelPos = editor.getScrolledVisiblePosition(cursorPos);
    const editorRect = editorDom.getBoundingClientRect();

    const rawTop = editorRect.top + (pixelPos?.top ?? 0) + 26;
    const rawLeft = editorRect.left + (pixelPos?.left ?? 40);
    const width = Math.min(440, editorRect.width - 32);
    const left = Math.min(rawLeft, editorRect.right - width - 8);

    setPosition({ top: rawTop, left, width });
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [editor, getCode]);

  const handleClose = useCallback(() => {
    onClose();
    editor?.focus();
  }, [onClose, editor]);

  // Escape to close, Tab to accept
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "Tab" && aiResult) {
        e.preventDefault();
        handleAccept();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleClose, aiResult]);

  // Click-outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClose]);

  const handleSubmit = async () => {
    if (!instruction.trim() || !editor) return;

    const snapshot = selectionRef.current;
    if (!snapshot) return;

    setLoading(true);
    setApiError(null);

    try {
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          code: getCode(),
          task: "inline_edit",
          userMessage: instruction,
          selectedText: snapshot.selectedText || undefined,
          cursorLine: (editor.getPosition()?.lineNumber ?? 1),
          cursorCol: (editor.getPosition()?.column ?? 1),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Request failed" }));
        setApiError(data.error ?? "AI request failed");
        return;
      }

      const data = await res.json();
      setAiResult(data.result);
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (!editor || !aiResult) return;

    const snapshot = selectionRef.current;
    if (!snapshot) return;

    const model = editor.getModel();
    if (!model) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sel = snapshot.range as any;
    if (sel && !sel.isEmpty()) {
      editor.executeEdits("ai-inline", [{ range: sel, text: aiResult }]);
    } else {
      editor.executeEdits("ai-inline", [{ range: model.getFullModelRange(), text: aiResult }]);
    }

    handleClose();
  };

  return createPortal(
    <div
      ref={containerRef}
      style={{ position: "fixed", top: position.top, left: position.left, width: position.width, zIndex: 9999 }}
      className="shadow-2xl"
    >
      {!aiResult ? (
        <div className="bg-[#0a0a1a] border border-[var(--border)] rounded-[var(--radius-sm)] overflow-hidden">
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <Sparkles className="size-3.5 text-[var(--flame)] shrink-0" />
            <input
              ref={inputRef}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !loading) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Tell AI what to do… (Enter to send)"
              className="flex-1 bg-transparent text-[var(--text-primary)] text-sm outline-none placeholder:text-[var(--text-muted)] font-body"
              disabled={loading}
            />
            {loading ? (
              <Loader2 className="size-3.5 text-[var(--text-muted)] animate-spin shrink-0" />
            ) : (
              <button
                onClick={handleClose}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {apiError && (
            <div className="px-3 pb-2.5 text-red-400 text-xs font-body">{apiError}</div>
          )}

          <div className="px-3 pb-2 text-[var(--text-muted)] text-xs font-body flex gap-3">
            <span><kbd className="opacity-60 font-mono">Enter</kbd> Send</span>
            <span><kbd className="opacity-60 font-mono">Esc</kbd> Dismiss</span>
          </div>
        </div>
      ) : (
        <InlineDiff
          oldCode={selectionRef.current?.oldCode ?? ""}
          newCode={aiResult}
          onAccept={handleAccept}
          onReject={handleClose}
        />
      )}
    </div>,
    document.body
  );
}
