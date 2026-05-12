"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Save, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useCodeEditorStore } from "@/store/useCodeEditorStore";
import { SnippetFull } from "@/types";

interface Props {
  onClose: () => void;
}

export function SaveSnippetModal({ onClose }: Props) {
  const { language, getCode, activeSnippetId, setActiveSnippetId } = useCodeEditorStore();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingOverwrite, setLoadingOverwrite] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Pre-fill title when editing a loaded snippet
  useEffect(() => {
    if (!activeSnippetId) return;
    fetch(`/api/snippets/${activeSnippetId}`)
      .then((r) => r.json())
      .then((data: { snippet: SnippetFull }) => {
        if (data.snippet?.title) setTitle(data.snippet.title);
      })
      .catch(() => {});
  }, [activeSnippetId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const saveNew = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), language, code: getCode() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setActiveSnippetId(data.snippet._id);
      toast.success("Snippet saved");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const overwrite = async () => {
    if (!activeSnippetId) return;
    setLoadingOverwrite(true);
    try {
      const res = await fetch(`/api/snippets/${activeSnippetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() || undefined, code: getCode() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to overwrite");
      toast.success("Snippet updated");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to overwrite");
    } finally {
      setLoadingOverwrite(false);
    }
  };

  const isEditing = !!activeSnippetId;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm mx-4 bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-medium text-[var(--text-primary)] font-body">
            {isEditing ? "Save Snippet" : "Save as New Snippet"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wide mb-1.5 font-body">
              Title
            </label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !isEditing) saveNew(); }}
              placeholder="e.g. Binary search in Python"
              className="w-full px-3 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--text-primary)] text-sm font-body placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--flame)]/50 transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[100vw] text-sm font-medium font-body bg-[var(--surface-3)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>

          {isEditing && (
            <button
              onClick={overwrite}
              disabled={loadingOverwrite}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[100vw] text-sm font-medium font-body bg-[var(--surface-3)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingOverwrite ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Overwrite
            </button>
          )}

          <button
            onClick={saveNew}
            disabled={!title.trim() || loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[100vw] text-sm font-medium font-body bg-[var(--flame)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            {isEditing ? "Save as New" : "Save"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
