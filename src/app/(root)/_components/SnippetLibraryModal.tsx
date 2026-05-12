"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Trash2, Download, Loader2, FileCode } from "lucide-react";
import toast from "react-hot-toast";
import { useCodeEditorStore } from "@/store/useCodeEditorStore";
import { SnippetFull, SnippetSummary } from "@/types";

interface Props {
  onClose: () => void;
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function SnippetLibraryModal({ onClose }: Props) {
  const { language, editor, setLanguage, setActiveSnippetId } = useCodeEditorStore();
  const [snippets, setSnippets] = useState<SnippetSummary[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/snippets")
      .then((r) => r.json())
      .then((data: { snippets: SnippetSummary[] }) => {
        setSnippets(data.snippets ?? []);
        setListLoading(false);
      })
      .catch(() => setListLoading(false));
  }, []);

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

  const loadSnippet = async (id: string, snippetLanguage: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/snippets/${id}`);
      const data = await res.json() as { snippet: SnippetFull };
      if (!res.ok) throw new Error("Failed to load snippet");

      const { code } = data.snippet;

      // Write code to localStorage so the EditorPanel useEffect picks it up on language switch
      localStorage.setItem(`editor-code-${snippetLanguage}`, code);

      if (snippetLanguage === language) {
        editor?.setValue(code);
      } else {
        setLanguage(snippetLanguage);
        // EditorPanel's useEffect fires on language change and reads from localStorage
      }

      setActiveSnippetId(id);
      toast.success("Snippet loaded");
      onClose();
    } catch {
      toast.error("Failed to load snippet");
    } finally {
      setLoadingId(null);
    }
  };

  const deleteSnippet = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/snippets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setSnippets((prev) => prev.filter((s) => s._id !== id));
      toast.success("Snippet deleted");
    } catch {
      toast.error("Failed to delete snippet");
    } finally {
      setDeletingId(null);
    }
  };

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg mx-4 bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
          <h2 className="text-sm font-medium text-[var(--text-primary)] font-body">Saved Files</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-3 py-3 space-y-1">
          {listLoading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-5 animate-spin text-[var(--text-muted)]" />
            </div>
          )}

          {!listLoading && snippets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <FileCode className="size-8 text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-muted)] font-body">No saved snippets yet.</p>
            </div>
          )}

          {snippets.map((s) => (
            <div
              key={s._id}
              className="flex items-center gap-3 px-3 py-3 rounded-[var(--radius-sm)] bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] font-body truncate">{s.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs px-2 py-0.5 rounded-[100vw] bg-[var(--surface-3)] text-[var(--text-secondary)] font-body">
                    {s.language}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] font-body">{relativeDate(s.createdAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => loadSnippet(s._id, s.language)}
                  disabled={loadingId === s._id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[100vw] text-xs font-medium font-body bg-[var(--flame)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingId === s._id
                    ? <Loader2 className="size-3 animate-spin" />
                    : <Download className="size-3" />}
                  Load
                </button>

                <button
                  onClick={() => deleteSnippet(s._id)}
                  disabled={deletingId === s._id}
                  className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-red-400 hover:bg-[var(--surface-3)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingId === s._id
                    ? <Loader2 className="size-3.5 animate-spin" />
                    : <Trash2 className="size-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
