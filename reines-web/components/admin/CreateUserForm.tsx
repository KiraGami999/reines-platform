"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, ShieldCheck, HardHat, UserCheck } from "lucide-react";
import type { AdminUser } from "@/lib/mock-admin";

interface Props {
  editUser?: AdminUser | null;
  onSuccess: (user: AdminUser) => void;
  onCancel:  () => void;
}

const ROLES: {
  value: "CLIENT" | "PROJECT_MANAGER" | "ADMIN";
  label: string;
  desc:  string;
  icon:  React.ReactNode;
  ring:  string;
}[] = [
  {
    value: "CLIENT",
    label: "Client",
    desc:  "Can view their projects, gallery and chat with their manager.",
    icon:  <UserCheck  size={16} />,
    ring:  "ring-blue-400 bg-blue-50 text-blue-700",
  },
  {
    value: "PROJECT_MANAGER",
    label: "Project Manager",
    desc:  "Manages projects, uploads progress updates and messages clients.",
    icon:  <HardHat    size={16} />,
    ring:  "ring-blue-400 bg-blue-50 text-blue-700",
  },
  {
    value: "ADMIN",
    label: "Admin",
    desc:  "Full platform access including user and project management.",
    icon:  <ShieldCheck size={16} />,
    ring:  "ring-blue-400 bg-blue-50 text-blue-700",
  },
];

const FIELD = "block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100";
const LABEL = "mb-1.5 block text-sm font-medium text-zinc-700";

export default function CreateUserForm({ editUser, onSuccess, onCancel }: Props) {
  const isEdit = Boolean(editUser);

  const [form, setForm] = useState({
    name:     editUser?.name  ?? "",
    email:    editUser?.email ?? "",
    password: "",
    role:     (editUser?.role ?? "CLIENT") as "CLIENT" | "PROJECT_MANAGER" | "ADMIN",
  });
  const [showPass,    setShowPass]    = useState(false);
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [loading,     setLoading]     = useState(false);
  const [serverError, setServerError] = useState("");

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
    setServerError("");
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      e.name = "Name must be at least 2 characters.";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      e.email = "Enter a valid email address.";
    if (!isEdit && form.password.length < 8)
      e.password = "Password must be at least 8 characters.";
    if (isEdit && form.password && form.password.length < 8)
      e.password = "New password must be at least 8 characters.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setServerError("");

    const url    = isEdit ? `/api/admin/users/${editUser!.id}` : "/api/admin/users";
    const method = isEdit ? "PATCH" : "POST";
    const body: Record<string, string> = {
      name:  form.name.trim(),
      email: form.email.trim(),
      role:  form.role,
    };
    if (!isEdit || form.password) body.password = form.password;

    try {
      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setServerError(data.error ?? "Something went wrong."); return; }
      onSuccess(data as AdminUser);
    } catch (err) {
      console.error("[CreateUserForm] network error:", err);
      setServerError("A network error occurred. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Server error */}
      {serverError && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {serverError}
        </div>
      )}

      {/* Name */}
      <div>
        <label className={LABEL}>Full Name</label>
        <input
          className={`${FIELD} ${errors.name ? "border-blue-300 focus:ring-blue-100" : ""}`}
          type="text"
          placeholder="e.g. John Chirwa"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
        {errors.name && <p className="mt-1 text-xs text-blue-600">{errors.name}</p>}
      </div>

      {/* Email */}
      <div>
        <label className={LABEL}>Email Address</label>
        <input
          className={`${FIELD} ${errors.email ? "border-blue-300 focus:ring-blue-100" : ""}`}
          type="email"
          placeholder="john@example.com"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
        {errors.email && <p className="mt-1 text-xs text-blue-600">{errors.email}</p>}
      </div>

      {/* Password */}
      <div>
        <label className={LABEL}>
          {isEdit ? "New Password" : "Password"}
          {isEdit && (
            <span className="ml-2 font-normal text-zinc-400">(leave blank to keep current)</span>
          )}
        </label>
        <div className="relative">
          <input
            className={`${FIELD} pr-10 ${errors.password ? "border-blue-300 focus:ring-blue-100" : ""}`}
            type={showPass ? "text" : "password"}
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-600"
            tabIndex={-1}
            aria-label={showPass ? "Hide password" : "Show password"}
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-blue-600">{errors.password}</p>}
      </div>

      {/* Role — card selector */}
      <div>
        <label className={LABEL}>Role</label>
        <div className="space-y-2">
          {ROLES.map((r) => (
            <label
              key={r.value}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 transition-all ${
                form.role === r.value
                  ? `border-[#2d4a6b] bg-[#2d4a6b]/3`
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={form.role === r.value}
                onChange={() => set("role", r.value)}
                className="mt-0.5 accent-[#2d4a6b]"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ring-1 ${r.ring}`}
                  >
                    {r.icon} {r.label}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">{r.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex flex-1 items-center justify-center gap-2  py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1a2f4a] disabled:opacity-60"
        >
          {loading
            ? <><Loader2 size={14} className="animate-spin" /> {isEdit ? "Saving…" : "Creating…"}</>
            : isEdit ? "Save Changes" : "Create User"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
