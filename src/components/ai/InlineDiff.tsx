"use client";

type DiffLine = { type: "same" | "removed" | "added"; text: string };

function computeDiff(oldText: string, newText: string): DiffLine[] {
  const a = oldText.split("\n");
  const b = newText.split("\n");
  const m = a.length;
  const n = b.length;

  // Bail out to simple display for very large files to avoid O(m*n) blowup
  if (m * n > 50000) {
    return [
      ...a.map((text) => ({ type: "removed" as const, text })),
      ...b.map((text) => ({ type: "added" as const, text })),
    ];
  }

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);

  const result: DiffLine[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.unshift({ type: "same", text: a[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "added", text: b[j - 1] });
      j--;
    } else {
      result.unshift({ type: "removed", text: a[i - 1] });
      i--;
    }
  }
  return result;
}

interface InlineDiffProps {
  oldCode: string;
  newCode: string;
  onAccept: () => void;
  onReject: () => void;
  label?: string;
}

export function InlineDiff({ oldCode, newCode, onAccept, onReject, label }: InlineDiffProps) {
  const diff = computeDiff(oldCode, newCode);
  const hasChanges = diff.some((l) => l.type !== "same");

  const CONTEXT = 2;
  const changeIndices = new Set<number>();
  diff.forEach((line, idx) => {
    if (line.type !== "same") {
      for (let k = Math.max(0, idx - CONTEXT); k <= Math.min(diff.length - 1, idx + CONTEXT); k++) {
        changeIndices.add(k);
      }
    }
  });

  type DisplayLine = DiffLine | { type: "ellipsis"; count: number };
  const displayLines: DisplayLine[] = [];
  let skipStart = -1;
  diff.forEach((line, idx) => {
    if (line.type === "same" && !changeIndices.has(idx)) {
      if (skipStart === -1) skipStart = idx;
    } else {
      if (skipStart !== -1) {
        displayLines.push({ type: "ellipsis", count: idx - skipStart });
        skipStart = -1;
      }
      displayLines.push(line);
    }
  });
  if (skipStart !== -1) {
    displayLines.push({ type: "ellipsis", count: diff.length - skipStart });
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[#0a0a1a] overflow-hidden text-xs font-mono shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--surface-2)] border-b border-[var(--border)]">
        <span className="text-[var(--text-muted)] font-body text-xs tracking-wide uppercase">
          {label ?? "AI suggestion"}
        </span>
        <div className="flex gap-2">
          <button
            onClick={onReject}
            className="px-3 py-1 text-xs rounded-[100vw] bg-[var(--surface-3)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-body"
          >
            Discard
          </button>
          {hasChanges && (
            <button
              onClick={onAccept}
              className="px-3 py-1 text-xs rounded-[100vw] bg-[var(--flame)] text-white hover:opacity-90 transition-opacity font-body font-medium"
            >
              Accept
            </button>
          )}
        </div>
      </div>

      {/* Diff lines */}
      <div className="max-h-64 overflow-y-auto">
        {!hasChanges ? (
          <div className="px-4 py-4 text-[var(--text-muted)] text-center font-body text-xs">
            No changes suggested
          </div>
        ) : (
          displayLines.map((line, idx) => {
            if (line.type === "ellipsis") {
              return (
                <div
                  key={idx}
                  className="px-3 py-0.5 text-[var(--text-muted)] bg-[var(--surface-1)] text-center text-xs font-body"
                >
                  ··· {line.count} unchanged line{line.count !== 1 ? "s" : ""} ···
                </div>
              );
            }
            return (
              <div
                key={idx}
                className={`px-3 py-px whitespace-pre flex gap-2 leading-5 ${
                  line.type === "removed"
                    ? "bg-red-950/40 text-red-300"
                    : line.type === "added"
                    ? "bg-green-950/40 text-green-300"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                <span className="select-none opacity-50 shrink-0 w-3 text-right">
                  {line.type === "removed" ? "−" : line.type === "added" ? "+" : " "}
                </span>
                <span className={line.type === "removed" ? "line-through opacity-60" : ""}>
                  {line.text || " "}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-1.5 bg-[var(--surface-2)] border-t border-[var(--border)] flex gap-4 text-[var(--text-muted)] font-body text-xs">
        <span>
          <kbd className="opacity-60 font-mono text-xs">Tab</kbd>{" "}
          <span>Accept</span>
        </span>
        <span>
          <kbd className="opacity-60 font-mono text-xs">Esc</kbd>{" "}
          <span>Discard</span>
        </span>
      </div>
    </div>
  );
}
