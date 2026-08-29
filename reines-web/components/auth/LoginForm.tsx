"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginSchema } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, MailCheck } from "lucide-react";
import { useReinesLoader } from "@/components/layout/ReinesLoaderProvider";
import { AuthDivider, GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "This email is already registered with a different sign-in method. Use your password, or contact support if you need help linking Google.",
  OAuthCallback:
    "Google sign-in failed during the callback. Please try again.",
  OAuthSignin:
    "Could not start Google sign-in. Please try again.",
  AccessDenied:
    "Access was denied. Please try again or use email and password.",
  Configuration:
    "Google sign-in is not configured correctly. Please contact support.",
  Callback:
    "Sign-in callback failed. Please try again.",
  Default:
    "Sign-in failed. Please try again.",
};

function oauthErrorMessage(code: string | null): string {
  if (!code) return "";
  return OAUTH_ERROR_MESSAGES[code] ?? OAUTH_ERROR_MESSAGES.Default;
}

/** Mirrors the resend cooldown enforced in lib/otp.ts. */
const RESEND_COOLDOWN_SECONDS = 45;

const GENERIC_FAILURE = "Something went wrong. Please try again.";

interface LoginFormProps {
  googleEnabled?: boolean;
}

export function LoginForm({ googleEnabled = false }: LoginFormProps) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") ?? "/dashboard";
  const { triggerSignInLoader } = useReinesLoader();

  const verified = searchParams.get("verified") === "1";
  const wasReset = searchParams.get("reset")    === "1";
  const oauthError = oauthErrorMessage(searchParams.get("error"));

  const [step, setStep]       = useState<"credentials" | "code">("credentials");
  const [form, setForm]       = useState({ email: "", password: "" });
  const [code, setCode]       = useState("");
  const [errors, setErrors]   = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState("");
  const [notice, setNotice]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const codeRef = useRef<HTMLInputElement>(null);

  // Countdown for the resend button.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((p) => ({ ...p, [field]: e.target.value }));
      setErrors((p) => ({ ...p, [field]: undefined }));
      setServerError("");
    };
  }

  /** Exchanges a cleared 2FA challenge for a real session. */
  const completeSignIn = useCallback(
    async (passToken: string) => {
      const result = await signIn("credentials", {
        email:    form.email,
        password: form.password,
        passToken,
        redirect: false,
      });

      if (result?.error) {
        setLoading(false);
        setServerError("We verified your code but couldn't start your session. Please try again.");
        return;
      }

      triggerSignInLoader(callbackUrl);
      router.push(callbackUrl);
      router.refresh();
    },
    [callbackUrl, form.email, form.password, router, triggerSignInLoader]
  );

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      setErrors({ email: fe.email?.[0], password: fe.password?.[0] });
      return;
    }

    setLoading(true);
    setServerError("");
    setNotice("");

    try {
      const res = await fetch("/api/auth/login/challenge", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setLoading(false);
        setServerError(data?.error ?? GENERIC_FAILURE);
        return;
      }

      // Browser already cleared 2FA — straight through, no code needed.
      if (!data?.twoFactorRequired) {
        await completeSignIn(data.passToken);
        return;
      }

      setLoading(false);
      setStep("code");
      setCode("");
      setNotice(data.notice ?? `We sent a 6-digit code to ${form.email}.`);
      setCooldown(data.retryAfterSeconds ?? RESEND_COOLDOWN_SECONDS);
    } catch {
      setLoading(false);
      setServerError("Couldn't reach the server. Check your connection and try again.");
    }
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!/^\d{6}$/.test(code)) {
      setServerError("Enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    setServerError("");

    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: form.email, password: form.password, code }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setLoading(false);
        setServerError(data?.error ?? GENERIC_FAILURE);
        return;
      }

      await completeSignIn(data.passToken);
    } catch {
      setLoading(false);
      setServerError("Couldn't reach the server. Check your connection and try again.");
    }
  }

  async function handleResend() {
    if (cooldown > 0 || loading) return;

    setLoading(true);
    setServerError("");
    setNotice("");

    try {
      const res = await fetch("/api/auth/login/challenge", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json().catch(() => null);
      setLoading(false);

      if (!res.ok) {
        setServerError(data?.error ?? GENERIC_FAILURE);
        return;
      }

      setNotice(data?.notice ?? `We sent a new code to ${form.email}.`);
      setCooldown(data?.retryAfterSeconds ?? RESEND_COOLDOWN_SECONDS);
    } catch {
      setLoading(false);
      setServerError("Couldn't reach the server. Check your connection and try again.");
    }
  }

  function backToCredentials() {
    setStep("credentials");
    setCode("");
    setServerError("");
    setNotice("");
  }

  const displayError = serverError || oauthError;

  // ── Step 2: 6-digit code ───────────────────────────────────────────────────
  if (step === "code") {
    return (
      <form onSubmit={handleCodeSubmit} className="space-y-4" noValidate>
        <div className="flex items-start gap-2 rounded-lg border border-[#8fb9e8]/50 bg-[#8fb9e8]/10 px-4 py-3 text-sm text-[#35475D]">
          <MailCheck size={15} className="mt-0.5 shrink-0" />
          <span>{notice || `We sent a 6-digit code to ${form.email}.`}</span>
        </div>

        <div className="space-y-1">
          <label htmlFor="code" className="block text-sm font-medium text-zinc-700">
            Verification code
          </label>
          <input
            ref={codeRef}
            id="code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
              setServerError("");
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            aria-describedby="code-hint"
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-center text-2xl font-bold tracking-[0.4em] text-zinc-900 caret-[#35475D] placeholder:text-zinc-300 placeholder:tracking-[0.4em] focus:border-[#8fb9e8]/60 focus:outline-none focus:ring-2 focus:ring-[#8fb9e8]/20"
          />
          <p id="code-hint" className="text-xs text-zinc-400">
            The code expires in 10 minutes.
          </p>
        </div>

        {displayError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{displayError}</span>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
          {loading ? "Verifying…" : "Verify and sign in"}
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
            onClick={handleResend}
            disabled={cooldown > 0 || loading}
            className="font-medium text-[#35475D] hover:underline disabled:text-zinc-400 disabled:no-underline"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        </div>
      </form>
    );
  }

  // ── Step 1: email + password ───────────────────────────────────────────────
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
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
            Password
          </label>
          <Link href="/forgot-password" className="text-xs text-[#35475D] hover:underline">
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
            className={`block w-full rounded-lg border bg-white px-3 py-2 pr-10 text-sm text-zinc-900 caret-[#35475D] placeholder:text-zinc-400 focus:outline-none focus:ring-2 ${
              errors.password
                ? "border-red-400 focus:border-red-400 focus:ring-red-100"
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
        {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
      </div>

      {displayError && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Checking…" : "Continue"}
      </Button>

      {googleEnabled && (
        <>
          <AuthDivider />
          <GoogleSignInButton callbackUrl={callbackUrl} label="Sign in with Google" />
        </>
      )}

      <p className="text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-[#35475D] underline-offset-2 hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
