"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerSchema } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

function PasswordStrengthBar({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const label  = ["", "Weak", "Fair", "Strong"][score] ?? "";
  const colour  = ["", "bg-blue-400", "bg-blue-400", "bg-blue-500"][score] ?? "";

  if (!password) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colour : "bg-zinc-100"}`} />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs">
        <div className="flex gap-3 text-zinc-400">
          <span className={checks[0] ? "text-blue-600" : ""}>8+ chars</span>
          <span className={checks[1] ? "text-blue-600" : ""}>Uppercase</span>
          <span className={checks[2] ? "text-blue-600" : ""}>Number</span>
        </div>
        {label && <span className={`font-medium ${score === 3 ? "text-blue-600" : "text-zinc-400"}`}>{label}</span>}
      </div>
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((p) => ({ ...p, [field]: e.target.value }));
      setFieldErrors((p) => ({ ...p, [field]: undefined }));
      setServerError("");
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Client-side validation first
    const parsed = registerSchema.safeParse({ ...form, role: "CLIENT" });
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        name:     fe.name?.[0],
        email:    fe.email?.[0],
        password: fe.password?.[0],
      });
      return;
    }

    setServerError("");
    setLoading(true);

    try {
      const res  = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...form, role: "CLIENT" }),
      });
      const data = await res.json();

      if (res.status === 422) {
        const fe = data.issues ?? {};
        setFieldErrors({
          name:     fe.name?.[0],
          email:    fe.email?.[0],
          password: fe.password?.[0],
        });
        return;
      }
      if (!res.ok) {
        setServerError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input
        id="name"
        type="text"
        label="Full name"
        placeholder="Jane Smith"
        value={form.name}
        onChange={update("name")}
        error={fieldErrors.name}
        required
        autoComplete="name"
        autoFocus
      />
      <Input
        id="email"
        type="email"
        label="Email address"
        placeholder="you@example.com"
        value={form.email}
        onChange={update("email")}
        error={fieldErrors.email}
        required
        autoComplete="email"
      />

      {/* Password with strength bar */}
      <div className="space-y-2">
        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 chars, 1 uppercase, 1 number"
              value={form.password}
              onChange={update("password")}
              required
              autoComplete="new-password"
              className={`block w-full rounded-lg border bg-white px-3 py-2 pr-10 text-sm text-zinc-900 caret-[#2d4a6b] placeholder:text-zinc-400 focus:outline-none focus:ring-2 ${
                fieldErrors.password
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
          {fieldErrors.password && <p className="text-xs text-blue-500">{fieldErrors.password}</p>}
        </div>
        <PasswordStrengthBar password={form.password} />
      </div>

      {serverError && (
        <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[#2d4a6b] underline-offset-2 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
