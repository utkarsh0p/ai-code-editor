"use client";

import { useCodeEditorStore } from "@/store/useCodeEditorStore";
import { AlertTriangle, CheckCircle, Clock, Copy, Terminal } from "lucide-react";
import { useState } from "react";
import RunningCodeSkeleton from "./RunningCodeSkeleton";

function OutputPanel() {
  const { output, error, isRunning } = useCodeEditorStore();
  const [isCopied, setIsCopied] = useState(false);

  const hasContent = error || output;

  const handleCopy = async () => {
    if (!hasContent) return;
    await navigator.clipboard.writeText(error || output);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="relative bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius-md)] p-3 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--surface-2)] border border-[var(--border)]">
            <Terminal className="w-4 h-4 text-[var(--flame)]" />
          </div>
          <span className="text-sm font-medium text-[var(--text-primary)] font-body">Output</span>
        </div>

        {hasContent && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]
              bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--border-strong)]
              rounded-[var(--radius-pill)] transition-all font-body"
          >
            {isCopied ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-[var(--success)]" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        )}
      </div>

      {/* Output Area */}
      <div
        className="bg-[var(--surface-2)] border border-[var(--border)]
          rounded-[var(--radius-sm)] p-3 sm:p-4 overflow-auto font-mono text-sm"
        style={{ height: "clamp(240px, 50vh, 600px)" }}
      >
        {isRunning ? (
          <RunningCodeSkeleton />
        ) : error ? (
          <div className="flex items-start gap-3 text-[var(--error)]">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-1" />
            <div className="space-y-1">
              <div className="font-medium">Execution Error</div>
              <pre className="whitespace-pre-wrap opacity-80">{error}</pre>
            </div>
          </div>
        ) : output ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[var(--success)] mb-3">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium font-body">Execution Successful</span>
            </div>
            <pre className="whitespace-pre-wrap text-[var(--text-secondary)]">{output}</pre>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)]">
            <div className="flex items-center justify-center w-12 h-12 rounded-[var(--radius-sm)] bg-[var(--surface-3)] border border-[var(--border)] mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-center font-body text-sm">Run your code to see the output here…</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default OutputPanel;
