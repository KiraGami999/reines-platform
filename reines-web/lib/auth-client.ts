"use client";

import { signOut } from "next-auth/react";

/**
 * Signs out AND drops this browser's 2FA trust, so the next sign-in requires a
 * fresh emailed code.
 *
 * Use this for deliberate "Log out" actions. An automatic idle timeout should
 * call `signOut()` directly instead, so re-logging in after a timeout doesn't
 * demand a second code.
 */
export async function signOutAndForgetDevice(options?: { callbackUrl?: string }) {
  try {
    await fetch("/api/auth/2fa/forget-device", { method: "POST" });
  } catch {
    // The trust cookie expires on its own, so never block sign-out on this.
  }
  await signOut(options);
}
