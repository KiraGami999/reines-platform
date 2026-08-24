"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, KeyRound, Loader2, UserCircle } from "lucide-react";

type Props = {
  initialName: string;
  email: string;
};

const FIELD =
  "block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100";

export function SettingsAccountPanel({ initialName, email }: Props) {
  const { update } = useSession();
  const router = useRouter();

  const [name, setName] = useState(initialName);
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState("");
  const [nameError, setNameError] = useState("");

  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (typeof data?.user?.hasPassword === "boolean") {
          setHasPassword(data.user.hasPassword);
        } else {
          setHasPassword(true);
        }
      })
      .catch(() => {
        if (!cancelled) setHasPassword(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    setNameMessage("");
    setNameError("");
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const issue =
          data?.issues &&
          Object.values(data.issues as Record<string, string[]>)
            .flat()
            .find(Boolean);
        setNameError(issue || data?.error || "Could not update name.");
        return;
      }
      await update({ name: data?.user?.name ?? name });
      setNameMessage("Display name updated.");
      router.refresh();
    } catch {
      setNameError("A network error occurred. Please try again.");
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage("");
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const issue =
          data?.issues &&
          Object.values(data.issues as Record<string, string[]>)
            .flat()
            .find(Boolean);
        setPasswordError(issue || data?.error || "Could not change password.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Password updated successfully.");
    } catch {
      setPasswordError("A network error occurred. Please try again.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2d4a6b]/10 text-[#2d4a6b]">
            <UserCircle size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-zinc-900">Profile</h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Update how your name appears across the portal. Email stays managed with your
              login identity ({email}).
            </p>

            <form onSubmit={saveName} className="mt-4 space-y-3">
              <div>
                <label htmlFor="settings-name" className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Display name
                </label>
                <input
                  id="settings-name"
                  className={FIELD}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameMessage("");
                    setNameError("");
                  }}
                  maxLength={80}
                  required
                  disabled={savingName}
                />
              </div>
              {(nameMessage || nameError) && (
                <p
                  className={`flex items-center gap-1.5 text-xs ${
                    nameError ? "text-red-600" : "text-green-700"
                  }`}
                >
                  {nameError ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
                  {nameError || nameMessage}
                </p>
              )}
              <button
                type="submit"
                disabled={savingName || name.trim() === initialName.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2d4a6b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a2f4a] disabled:opacity-60"
              >
                {savingName ? <Loader2 size={14} className="animate-spin" /> : null}
                {savingName ? "Saving…" : "Save name"}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2d4a6b]/10 text-[#2d4a6b]">
            <KeyRound size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-zinc-900">Password</h2>
            {hasPassword === false ? (
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                This account signs in with Google and has no password yet. You can create one
                anytime with{" "}
                <Link href="/forgot-password" className="font-medium text-[#2d4a6b] underline-offset-2 hover:underline">
                  Forgot password
                </Link>
                .
              </p>
            ) : (
              <>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  Change your password here, or use{" "}
                  <Link href="/forgot-password" className="font-medium text-[#2d4a6b] underline-offset-2 hover:underline">
                    Forgot password
                  </Link>{" "}
                  if you need an email reset code.
                </p>
                <form onSubmit={savePassword} className="mt-4 space-y-3">
                  <div>
                    <label htmlFor="current-password" className="mb-1.5 block text-sm font-medium text-zinc-700">
                      Current password
                    </label>
                    <input
                      id="current-password"
                      type="password"
                      autoComplete="current-password"
                      className={FIELD}
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        setPasswordError("");
                        setPasswordMessage("");
                      }}
                      required
                      disabled={savingPassword || hasPassword === null}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-zinc-700">
                        New password
                      </label>
                      <input
                        id="new-password"
                        type="password"
                        autoComplete="new-password"
                        className={FIELD}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setPasswordError("");
                          setPasswordMessage("");
                        }}
                        minLength={8}
                        required
                        disabled={savingPassword || hasPassword === null}
                      />
                    </div>
                    <div>
                      <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-zinc-700">
                        Confirm new password
                      </label>
                      <input
                        id="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        className={FIELD}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setPasswordError("");
                          setPasswordMessage("");
                        }}
                        minLength={8}
                        required
                        disabled={savingPassword || hasPassword === null}
                      />
                    </div>
                  </div>
                  {(passwordMessage || passwordError) && (
                    <p
                      className={`flex items-center gap-1.5 text-xs ${
                        passwordError ? "text-red-600" : "text-green-700"
                      }`}
                    >
                      {passwordError ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
                      {passwordError || passwordMessage}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={savingPassword || hasPassword === null}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#2d4a6b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a2f4a] disabled:opacity-60"
                  >
                    {savingPassword ? <Loader2 size={14} className="animate-spin" /> : null}
                    {savingPassword ? "Updating…" : "Update password"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
