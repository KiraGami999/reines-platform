import { NextResponse } from "next/server";
import { forgetCurrentDevice } from "@/lib/two-factor";

/**
 * POST /api/auth/2fa/forget-device
 *
 * Drops this browser's 2FA trust so the next sign-in requires a fresh code.
 * Called when someone deliberately signs out — an idle timeout should NOT call
 * this, since re-logging in after a timeout is meant to skip the code step.
 *
 * Needs no auth: the only thing it can do is make the caller's own next sign-in
 * stricter.
 */
export async function POST() {
  await forgetCurrentDevice();
  return NextResponse.json({ ok: true });
}
