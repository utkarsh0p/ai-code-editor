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
    <div className="relative z-10 mb-4">
      <div className="flex items-center lg:justify-between justify-center bg-[var(--surface-1)] border border-[var(--border)] backdrop-blur-xl px-6 py-4 rounded-[var(--radius-md)]">
        <div className="hidden lg:flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative bg-[var(--surface-2)] border border-[var(--border-strong)] p-2 rounded-[var(--radius-sm)] group-hover:border-[var(--flame)]/40 transition-colors">
              <Blocks className="size-5 text-[var(--flame)] transform -rotate-6 group-hover:rotate-0 transition-transform duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="block text-base font-semibold font-heading text-white leading-none">
                CodeCraft
              </span>
              <span className="block text-xs text-[var(--text-muted)] font-body mt-0.5">
                AI-Powered Editor
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <ThemeSelector />
            <LanguageSelector />
          </div>

          <RunButton />

          {!loading && user && (
            <div className="flex items-center gap-3 pl-3 border-l border-[var(--border-strong)]">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-2)] rounded-[var(--radius-sm)] border border-[var(--border)]">
                <User className="size-3.5 text-[var(--text-muted)]" />
                <span className="text-xs text-[var(--text-secondary)] max-w-[120px] truncate font-body">
                  {user.email}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] hover:border-[var(--flame)]/30 rounded-[var(--radius-sm)] transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="size-4 text-[var(--text-muted)] hover:text-[var(--flame)] transition-colors" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Header;
