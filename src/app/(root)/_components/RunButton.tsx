"use client";

import { useCodeEditorStore } from "@/store/useCodeEditorStore";
import { motion } from "framer-motion";
import { Loader2, Play } from "lucide-react";

function RunButton() {
  const { runCode, isRunning } = useCodeEditorStore();

  return (
    <motion.button
      onClick={runCode}
      disabled={isRunning}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-pill)]
        bg-[var(--flame)] hover:bg-[var(--flame-hover)] disabled:opacity-50 disabled:cursor-not-allowed
        text-white font-body font-medium text-sm transition-colors focus:outline-none
        focus-visible:ring-2 focus-visible:ring-[var(--flame)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
    >
      {isRunning ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Executing…</span>
        </>
      ) : (
        <>
          <Play className="w-4 h-4" />
          <span>Run Code</span>
        </>
      )}
    </motion.button>
  );
}

export default RunButton;
