"use client";

import { useCodeEditorStore } from "@/store/useCodeEditorStore";
import { useEffect, useRef, useState } from "react";
import { defineMonacoThemes, LANGUAGE_CONFIG } from "../_constants";
import { Editor, Monaco } from "@monaco-editor/react";
import Image from "next/image";
import { RotateCcwIcon, Sparkles, Save, FolderOpen, Settings2 } from "lucide-react";
import { EditorPanelSkeleton } from "./EditorPanelSkeleton";
import useMounted from "@/hooks/useMounted";
import { InlineCommandWidget } from "@/components/ai/InlineCommandWidget";
import { SelectionToolbar } from "@/components/ai/SelectionToolbar";
import { ErrorLens } from "@/components/ai/ErrorLens";
import { SaveSnippetModal } from "./SaveSnippetModal";
import { SnippetLibraryModal } from "./SnippetLibraryModal";
import { useAuth } from "@/hooks/useAuth";

// Registered once per Monaco instance; flag prevents re-registration on hot reload.
let completionsProviderRegistered = false;

function EditorPanel() {
  const [showInlineWidget, setShowInlineWidget] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showEditorMenu, setShowEditorMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [currentSelection, setCurrentSelection] = useState<any | null>(null);
  const { language, theme, fontSize, editor, setFontSize, setEditor, setActiveSnippetId } = useCodeEditorStore();
  const { user } = useAuth();
  const mounted = useMounted();

  useEffect(() => {
    const savedCode = localStorage.getItem(`editor-code-${language}`);
    const newCode = savedCode || LANGUAGE_CONFIG[language].defaultCode;
    if (editor) editor.setValue(newCode);
  }, [language, editor]);

  useEffect(() => {
    const savedFontSize = localStorage.getItem("editor-font-size");
    if (savedFontSize) setFontSize(parseInt(savedFontSize));
  }, [setFontSize]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowEditorMenu(false);
      }
    };
    if (showEditorMenu) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEditorMenu]);

  const handleBeforeMount = (monaco: Monaco) => {
    defineMonacoThemes(monaco);

    if (completionsProviderRegistered) return;
    completionsProviderRegistered = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (monaco.languages as any).registerInlineCompletionsProvider("*", {
      provideInlineCompletions: async (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        model: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        position: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        _context: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token: any,
      ) => {
        const { language: lang } = useCodeEditorStore.getState();

        const prefix = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        if (prefix.trim().length < 10) return { items: [] };
        if (token.isCancellationRequested) return { items: [] };

        try {
          const res = await fetch("/api/ai/assist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              language: lang,
              code: model.getValue(),
              prefix,
              cursorLine: position.lineNumber,
              cursorCol: position.column,
              task: "completion",
              stream: false,
            }),
          });

          if (token.isCancellationRequested || !res.ok) return { items: [] };

          const data = await res.json();
          if (!data.result) return { items: [] };

          return {
            items: [{
              insertText: data.result,
              range: new monaco.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column,
              ),
            }],
          };
        } catch {
          return { items: [] };
        }
      },
      freeInlineCompletions: () => {},
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditorMount = (ed: any, monaco: Monaco) => {
    setEditor(ed);

    // Ctrl+K: open inline AI command widget
    ed.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      setShowInlineWidget(true);
    });

    // Track selection for floating toolbar
    ed.onDidChangeCursorSelection(() => {
      const sel = ed.getSelection();
      if (sel && !sel.isEmpty()) {
        setCurrentSelection(sel);
      } else {
        setCurrentSelection(null);
      }
    });
  };

  const handleRefresh = () => {
    const defaultCode = LANGUAGE_CONFIG[language].defaultCode;
    if (editor) editor.setValue(defaultCode);
    localStorage.removeItem(`editor-code-${language}`);
    setActiveSnippetId(null);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value) localStorage.setItem(`editor-code-${language}`, value);
  };

  const handleFontSizeChange = (newSize: number) => {
    const size = Math.min(Math.max(newSize, 12), 24);
    setFontSize(size);
    localStorage.setItem("editor-font-size", size.toString());
  };

  if (!mounted) return null;

  return (
    <div className="relative">
      <div className="relative bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius-md)] p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--surface-2)] border border-[var(--border)]">
            <Image src={"/" + language + ".png"} alt="Logo" width={24} height={24} />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInlineWidget(true)}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-[100vw] transition-all font-body text-sm font-medium bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-white border border-[var(--border)] hover:bg-[var(--surface-3)]"
            >
              <Sparkles className="size-4 shrink-0" />
              <span>AI</span>
              <span className="hidden sm:inline text-xs opacity-60">Ctrl+K</span>
            </button>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowEditorMenu((v) => !v)}
                className="p-2 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] rounded-[var(--radius-sm)] transition-colors"
                aria-label="Editor options"
              >
                <Settings2 className="size-4 text-[var(--text-muted)]" />
              </button>

              {showEditorMenu && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius-sm)] shadow-xl z-50 overflow-hidden">
                  {/* Font size */}
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border)]">
                    <span className="text-xs text-[var(--text-muted)] font-body">Font size</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleFontSizeChange(fontSize - 1)}
                        disabled={fontSize <= 12}
                        className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--surface-3)]"
                      >
                        A
                      </button>
                      <span className="text-xs font-medium text-[var(--text-secondary)] w-6 text-center tabular-nums">{fontSize}</span>
                      <button
                        onClick={() => handleFontSizeChange(fontSize + 1)}
                        disabled={fontSize >= 24}
                        className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--surface-3)]"
                      >
                        A
                      </button>
                    </div>
                  </div>

                  {/* Rollback */}
                  <button
                    onClick={() => { handleRefresh(); setShowEditorMenu(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-colors font-body"
                  >
                    <RotateCcwIcon className="size-4 text-[var(--text-muted)]" />
                    Rollback to default
                  </button>

                  {/* Saved files */}
                  {user && (
                    <button
                      onClick={() => { setShowLibraryModal(true); setShowEditorMenu(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-colors font-body"
                    >
                      <FolderOpen className="size-4 text-[var(--text-muted)]" />
                      Saved files
                    </button>
                  )}

                  {/* Save */}
                  {user && (
                    <button
                      onClick={() => { setShowSaveModal(true); setShowEditorMenu(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-colors font-body"
                    >
                      <Save className="size-4 text-[var(--text-muted)]" />
                      Save snippet
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 relative group rounded-[var(--radius-sm)] overflow-hidden border border-[var(--border)]">
          <Editor
            height="clamp(320px, 50vh, 600px)"
            language={LANGUAGE_CONFIG[language].monacoLanguage}
            onChange={handleEditorChange}
            theme={theme}
            beforeMount={handleBeforeMount}
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: false },
              fontSize,
              automaticLayout: true,
              scrollBeyondLastLine: false,
              padding: { top: 16, bottom: 16 },
              renderWhitespace: "selection",
              fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
              fontLigatures: true,
              cursorBlinking: "smooth",
              smoothScrolling: true,
              contextmenu: true,
              renderLineHighlight: "all",
              lineHeight: 1.6,
              letterSpacing: 0.5,
              roundedSelection: true,
              scrollbar: {
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
              },
              inlineSuggest: { enabled: true },
            }}
          />
          {!editor && <EditorPanelSkeleton />}
        </div>
      </div>

      {/* Inline AI features (portaled to document.body for positioning) */}
      {showInlineWidget && (
        <InlineCommandWidget onClose={() => setShowInlineWidget(false)} />
      )}
      {currentSelection && !showInlineWidget && (
        <SelectionToolbar
          selection={currentSelection}
          onDismiss={() => setCurrentSelection(null)}
        />
      )}
      <ErrorLens />

      {showSaveModal && <SaveSnippetModal onClose={() => setShowSaveModal(false)} />}
      {showLibraryModal && <SnippetLibraryModal onClose={() => setShowLibraryModal(false)} />}
    </div>
  );
}

export default EditorPanel;
