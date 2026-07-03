"use client";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginSchema } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff, AlertCircle, MailCheck, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useReinesLoader } from "@/components/layout/ReinesLoaderProvider";

type Phase = "credentials" | "otp";

const RESEND_COOLDOWN = 45;

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const shown = name.slice(0, 2);
  return `${shown}${"•".repeat(Math.max(name.length - 2, 1))}@${domain}`;
}

export function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") ?? "/dashboard";
  const { triggerSignInLoader } = useReinesLoader();

  const verified  = searchParams.get("verified") === "1";
  const wasReset  = searchParams.get("reset")    === "1";

  const [phase, setPhase]       = useState<Phase>("credentials");
  const [form, setForm]         = useState({ email: "", password: "" });
  const [otp, setOtp]           = useState("");
  const [errors, setErrors]     = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const otpInputRef = useRef<HTMLInputElement>(null);

  // Resend cooldown countdown.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Autofocus the OTP field when we enter the OTP phase.
  useEffect(() => {
    if (phase === "otp") otpInputRef.current?.focus();
  }, [phase]);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((p) => ({ ...p, [field]: e.target.value }));
      setErrors((p) => ({ ...p, [field]: undefined }));
      setServerError("");
    };
  }

  // ── Phase 1: verify password, request an emailed OTP ────────────────────────
  async function requestOtp(isResend = false) {
    setLoading(true);
    setServerError("");

    try {
      const res  = await fetch("/api/auth/otp/request", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setServerError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setPhase("otp");
      setCooldown(RESEND_COOLDOWN);
      if (isResend) setOtp("");
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        email:    fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }

    await requestOtp(false);
  }

  // ── Phase 2: verify the OTP via NextAuth and create the session ─────────────
  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!/^\d{6}$/.test(otp)) {
      setServerError("Enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    setServerError("");

    const result = await signIn("credentials", {
      email:    form.email,
      password: form.password,
      otp,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setServerError("That code is invalid or has expired. Request a new one and try again.");
      return;
    }

    triggerSignInLoader(callbackUrl);
    router.push(callbackUrl);
    router.refresh();
  }

  function backToCredentials() {
    setPhase("credentials");
    setOtp("");
    setServerError("");
    setCooldown(0);
  }

  // ── OTP phase UI ────────────────────────────────────────────────────────────
  if (phase === "otp") {
    return (
      <form onSubmit={handleOtpSubmit} className="space-y-5" noValidate>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#8fb9e8]/15 text-[#2d4a6b]">
            <MailCheck size={22} />
          </div>
          <h2 className="mt-3 text-base font-semibold text-[#2d4a6b]">Check your email</h2>
          <p className="mt-1 text-sm text-zinc-500">
            We sent a 6-digit code to <span className="font-medium text-zinc-700">{maskEmail(form.email)}</span>.
            It expires in 10 minutes.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="otp" className="block text-sm font-medium text-zinc-700">
            Verification code
          </label>
          <input
            id="otp"
            ref={otpInputRef}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
              setServerError("");
            }}
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-center text-2xl font-semibold tracking-[0.5em] text-zinc-900 caret-[#2d4a6b] placeholder:text-zinc-300 placeholder:tracking-[0.5em] focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </div>

        {serverError && (
          <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
          {loading ? "Verifying…" : "Verify & sign in"}
        </Button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={backToCredentials}
            className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-700"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <button
            type="button"
            onClick={() => requestOtp(true)}
            disabled={cooldown > 0 || loading}
            className="font-medium text-[#2d4a6b] hover:underline disabled:text-zinc-400 disabled:no-underline"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        </div>
      </form>
    );
  }

  // ── Credentials phase UI ──────────────────────────────────────────────────
  return (
    <form onSubmit={handleCredentialsSubmit} className="space-y-4" noValidate>
      {(verified || wasReset) && (
        <div className="flex items-start gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
          <span>
            {verified
              ? "Email verified! You can now sign in."
              : "Password updated! Sign in with your new password."}
          </span>
        </div>
      )}
      <Input
        id="email"
        type="email"
        label="Email address"
        placeholder="you@example.com"
        value={form.email}
        onChange={update("email")}
        error={errors.email}
        required
        autoComplete="email"
        autoFocus
      />

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700">Password</label>
          <Link href="/forgot-password" className="text-xs text-[#2d4a6b] hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={form.password}
            onChange={update("password")}
            required
            autoComplete="current-password"
            className={`block w-full rounded-lg border bg-white px-3 py-2 pr-10 text-sm text-zinc-900 caret-[#2d4a6b] placeholder:text-zinc-400 focus:outline-none focus:ring-2 ${
              errors.password
                ? "border-blue-400 focus:border-blue-400 focus:ring-blue-100"
                : "border-zinc-200 focus:border-zinc-400 focus:ring-zinc-200"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400 hover:text-zinc-600"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-blue-500">{errors.password}</p>}
      </div>

      {serverError && (
        <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Sending code…" : "Continue"}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-zinc-400">
        <MailCheck size={13} /> We'll email you a one-time code to confirm it's you.
      </p>

      <p className="text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-[#2d4a6b] underline-offset-2 hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
