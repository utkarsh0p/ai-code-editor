"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Blocks, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="bg-[var(--surface-1)] border border-[var(--border-strong)] p-3 rounded-[var(--radius-sm)]">
            <Blocks className="size-7 text-[var(--flame)]" />
          </div>
          <h1 className="text-2xl font-heading text-[var(--text-primary)]">
            CodeCraft
          </h1>
        </div>

        {/* Card */}
        <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius-md)] p-8">
          <h2 className="text-lg font-body font-medium text-[var(--text-primary)] mb-6">
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-body text-[var(--text-secondary)] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-[var(--surface-2)] border border-[var(--border)]
                  rounded-[var(--radius-sm)] text-[var(--text-primary)] text-sm font-body
                  placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--flame)]/50
                  transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-body text-[var(--text-secondary)] mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-[var(--surface-2)] border border-[var(--border)]
                  rounded-[var(--radius-sm)] text-[var(--text-primary)] text-sm font-body
                  placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--flame)]/50
                  transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm font-body text-[var(--error)] bg-[var(--flame)]/10 border border-[var(--flame)]/20 rounded-[var(--radius-sm)] px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5
                bg-[var(--flame)] hover:bg-[var(--flame-hover)]
                disabled:opacity-50 disabled:cursor-not-allowed
                rounded-[var(--radius-pill)] text-white text-sm font-body font-medium transition-colors"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              Sign in
            </button>
          </form>

          <p className="mt-5 text-center text-sm font-body text-[var(--text-muted)]">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[var(--flame)] hover:text-[var(--flame-hover)] transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
