"use client";

import Link from "next/link";
import { Blocks, LogOut, User } from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import LanguageSelector from "./LanguageSelector";
import RunButton from "./RunButton";
import { useAuth } from "@/hooks/useAuth";

function Header() {
  const { user, loading, logout } = useAuth();

  return (
    <div className="relative z-10 mb-3 sm:mb-4">
      <div className="flex items-center justify-between bg-[var(--surface-1)] border border-[var(--border)] backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4 rounded-[var(--radius-md)] gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="relative bg-[var(--surface-2)] border border-[var(--border-strong)] p-1.5 sm:p-2 rounded-[var(--radius-sm)] group-hover:border-[var(--flame)]/40 transition-colors">
            <Blocks className="size-4 sm:size-5 text-[var(--flame)] transform -rotate-6 group-hover:rotate-0 transition-transform duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="block text-sm sm:text-base font-semibold font-heading text-white leading-none">
              Orian
            </span>
            <span className="hidden sm:block text-xs text-[var(--text-muted)] font-body mt-0.5">
              Code editor with AI
            </span>
          </div>
        </Link>

        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="flex items-center gap-2">
            <ThemeSelector />
            <LanguageSelector />
          </div>

          <RunButton />

          {!loading && user && (
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[var(--border-strong)]">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-2)] rounded-[var(--radius-sm)] border border-[var(--border)]">
                <User className="size-3.5 text-[var(--text-muted)] shrink-0" />
                <span className="text-xs text-[var(--text-secondary)] max-w-[120px] truncate font-body">
                  {user.email}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-1.5 sm:p-2 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] hover:border-[var(--flame)]/30 rounded-[var(--radius-sm)] transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="size-3.5 sm:size-4 text-[var(--text-muted)] hover:text-[var(--flame)] transition-colors" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Header;
