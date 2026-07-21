"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck, ArrowLeft, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { Suspense } from "react";
import { AuthDesktopBrandLogo, AuthMobileBrandLogo } from "@/components/auth/AuthBrandLogo";

function VerifyEmailForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const emailParam   = searchParams.get("email") ?? "";

  const [email, setEmail]         = useState(emailParam);
  const [code, setCode]           = useState("");
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]         = useState("");
  const [done, setDone]           = useState(false);
  const [cooldown, setCooldown]   = useState(0);

  const codeRef = useRef<HTMLInputElement>(null);

  // Countdown ticker for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    if (emailParam) codeRef.current?.focus();
  }, [emailParam]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/verify-email", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "verify", email, code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      setDone(true);
      setTimeout(() => router.push("/login?verified=1"), 2500);
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    setError("");
    setResending(true);
    try {
      const res  = await fetch("/api/auth/verify-email", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "resend", email }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          // Extract seconds from message like "Please wait 42s before..."
          const match = (data.error as string)?.match(/(\d+)s/);
          setCooldown(match ? Number(match[1]) : 45);
        }
        setError(data.error ?? "Could not resend code.");
        return;
      }
      setCooldown(45);
    } catch {
      setError("A network error occurred.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-[#2d4a6b] p-12">
        <AuthDesktopBrandLogo />
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Verify your email</h2>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
            We sent a 6-digit code to the email you registered with. Enter it to activate your account.
            The code is valid for 24 hours.
          </p>
        </div>
        <p className="text-xs text-zinc-500">
          Already verified?{" "}
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
              <h1 className="text-xl font-bold text-[#2d4a6b]">Email verified!</h1>
              <p className="text-sm text-zinc-500">Redirecting you to sign in…</p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#2d4a6b]">Verify your email</h1>
                <p className="mt-1 text-sm text-zinc-500">
                  Enter the 6-digit code we sent to{" "}
                  {emailParam
                    ? <span className="font-medium text-zinc-700">{emailParam}</span>
                    : "your email address"
                  }.
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {!emailParam && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Email address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm placeholder-zinc-400 outline-none focus:border-[#2d4a6b] focus:ring-2 focus:ring-[#2d4a6b]/10"
                    />
                  </div>
                )}
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
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2d4a6b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#243d5a] disabled:opacity-60 transition-colors"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? "Verifying…" : "Verify email"}
                </button>
              </form>

              <div className="mt-5 flex flex-col items-center gap-2">
                <button
                  onClick={handleResend}
                  disabled={resending || cooldown > 0}
                  className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw size={13} className={resending ? "animate-spin" : ""} />
                  {cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : resending
                    ? "Sending…"
                    : "Resend code"}
                </button>
                <Link href="/login" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-600">
                  <ArrowLeft size={13} /> Back to sign in
                </Link>
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

// useSearchParams requires Suspense when used in a page component.
export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
