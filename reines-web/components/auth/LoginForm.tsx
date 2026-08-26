"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginSchema } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
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

  const [form, setForm]       = useState({ email: "", password: "" });
  const [errors, setErrors]   = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((p) => ({ ...p, [field]: e.target.value }));
      setErrors((p) => ({ ...p, [field]: undefined }));
      setServerError("");
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      setErrors({ email: fe.email?.[0], password: fe.password?.[0] });
      return;
    }

    setLoading(true);
    setServerError("");

    const result = await signIn("credentials", {
      email:    form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setServerError("Invalid email or password. Please try again.");
      return;
    }

    triggerSignInLoader(callbackUrl);
    router.push(callbackUrl);
    router.refresh();
  }

  const displayError = serverError || oauthError;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
        {loading ? "Signing in…" : "Sign in"}
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
