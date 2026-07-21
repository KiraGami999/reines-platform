"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { AuthDesktopBrandLogo, AuthMobileBrandLogo } from "@/components/auth/AuthBrandLogo";

type Phase = "email" | "code";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [phase, setPhase]       = useState<Phase>("email");
  const [email, setEmail]       = useState("");
  const [code, setCode]         = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [done, setDone]         = useState(false);

  const codeRef = useRef<HTMLInputElement>(null);

  // ── Phase 1: request reset code ────────────────────────────────────────────
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/reset-password/request", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      setPhase("code");
      setTimeout(() => codeRef.current?.focus(), 100);
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Phase 2: confirm code + new password ───────────────────────────────────
  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/reset-password/confirm", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, code, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      setDone(true);
      setTimeout(() => router.push("/login?reset=1"), 2500);
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-[#2d4a6b] p-12">
        <AuthDesktopBrandLogo />
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Reset your password</h2>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
            Enter your email and we&apos;ll send a 6-digit code to verify it&apos;s really you.
            Your new password must be at least 8 characters, include an uppercase letter and a number.
          </p>
        </div>
        <p className="text-xs text-zinc-500">
          Remember your password?{" "}
          <Link href="/login" className="text-[#8fb9e8] hover:underline">Sign in here.</Link>
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 bg-zinc-50">
        <div className="mx-auto w-full max-w-sm">
          <AuthMobileBrandLogo />

          {done ? (
            <div className="text-center space-y-4">
              <CheckCircle2 size={48} className="mx-auto text-green-500" />
              <h1 className="text-xl font-bold text-[#2d4a6b]">Password updated!</h1>
              <p className="text-sm text-zinc-500">Redirecting you to sign in…</p>
            </div>
          ) : phase === "email" ? (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#2d4a6b]">Forgot password?</h1>
                <p className="mt-1 text-sm text-zinc-500">
                  Enter your account email and we&apos;ll send a reset code.
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Email address</label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm placeholder-zinc-400 outline-none focus:border-[#2d4a6b] focus:ring-2 focus:ring-[#2d4a6b]/10"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2d4a6b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#243d5a] disabled:opacity-60 transition-colors"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? "Sending…" : "Send reset code"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700">
                  <ArrowLeft size={14} /> Back to sign in
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#2d4a6b]">Enter your code</h1>
                <p className="mt-1 text-sm text-zinc-500">
                  We sent a 6-digit code to <span className="font-medium text-zinc-700">{email}</span>.
                  It expires in 15 minutes.
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Verification code</label>
                  <input
                    ref={codeRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-center tracking-[0.4em] placeholder-zinc-400 outline-none focus:border-[#2d4a6b] focus:ring-2 focus:ring-[#2d4a6b]/10 font-mono text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">New password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars, uppercase, number"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm placeholder-zinc-400 outline-none focus:border-[#2d4a6b] focus:ring-2 focus:ring-[#2d4a6b]/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Confirm new password</label>
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm placeholder-zinc-400 outline-none focus:border-[#2d4a6b] focus:ring-2 focus:ring-[#2d4a6b]/10"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2d4a6b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#243d5a] disabled:opacity-60 transition-colors"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? "Updating…" : "Set new password"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => { setPhase("email"); setError(""); }}
                  className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
                >
                  <ArrowLeft size={14} /> Use a different email
                </button>
              </div>
            </>
          )}

          <p className="mt-10 text-center text-xs text-zinc-400">
            © {new Date().getFullYear()} Reines Property Development Limited
          </p>
        </div>
      </div>
    </div>
  );
}
