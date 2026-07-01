import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifyPayment, normaliseStatus } from "@/lib/paychangu";

/**
 * GET /api/payments/callback
 *
 * PayChangu redirects the customer here after both successful and
 * cancelled/failed payments (callback_url and return_url both point here).
 *
 * Query params PayChangu appends:
 *   tx_ref         — our transaction reference
 *   status         — redirect hint ("successful" / "failed" / "cancelled" / …)
 *   transaction_id — PayChangu's own charge ID
 *
 * IMPORTANT: The redirect `status` param MUST NOT be trusted alone.
 * Per PayChangu docs: "make a server-side call to our transaction verification
 * endpoint to confirm the status of the transaction."
 *
 * Flow:
 *  1. Log every param PayChangu sends (helps debug status value mismatches).
 *  2. Call PayChangu's verify API to get the authoritative status.
 *  3. Fall back to case-insensitive normalisation of the redirect `status`
 *     only if the verify API is unavailable.
 *  4. Update the DB and bust page caches.
 *  5. Redirect the user to their receipt page.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  // ── 1. Log everything PayChangu sends ─────────────────────────────────────
  const allParams = Object.fromEntries(searchParams.entries());
  console.info("[callback] PayChangu redirect params:", JSON.stringify(allParams));

  const txRef         = searchParams.get("tx_ref");
  const redirectStatus = searchParams.get("status");       // hint only — not authoritative
  const transactionId = searchParams.get("transaction_id"); // PayChangu charge ID

  if (!txRef) {
    console.warn("[callback] Missing tx_ref — redirecting to payments page.");
    return NextResponse.redirect(new URL("/dashboard/payments?error=missing_ref", req.nextUrl));
  }

  let newStatus: "SUCCESS" | "FAILED" | "CANCELLED" = "FAILED";
  let paychanguId: string | null = transactionId ?? null;
  let projectId:   string | null = null;

  // ── 2. Verify with PayChangu server-side (authoritative) ──────────────────
  try {
    const verified = await verifyPayment(txRef, transactionId);
    console.info("[callback] PayChangu verification response:", JSON.stringify(verified));

    newStatus    = normaliseStatus(verified.status);
    paychanguId  = verified.charge_id ?? paychanguId;
  } catch (verifyErr) {
    // Verification API unavailable — fall back to redirect status param.
    console.warn(
      "[callback] Verification API failed, falling back to redirect status param:",
      redirectStatus,
      verifyErr
    );
    newStatus = normaliseStatus(redirectStatus);
  }

  console.info(`[callback] ${txRef} → ${newStatus} (redirectStatus="${redirectStatus}")`);

  // ── 3. Update the DB ───────────────────────────────────────────────────────
  try {
    const updated = await prisma.payment.update({
      where: { txRef },
      data: {
        status:      newStatus,
        paychanguId: paychanguId ?? undefined,
        ...(newStatus === "SUCCESS" ? { paidAt: new Date() } : {}),
      },
      select: { projectId: true },
    });

    projectId = updated.projectId;

    // Bust Next.js page caches so the project budget and payment list reflect
    // the new status immediately when the user is redirected.
    revalidatePath("/dashboard/payments", "layout");
    if (projectId) {
      revalidatePath(`/dashboard/projects/${projectId}`, "page");
    }
  } catch (dbErr) {
    console.error("[callback] DB update failed:", dbErr);
    // Still redirect — don't strand the user on a blank API response.
  }

  // ── 4. Redirect to the receipt page ───────────────────────────────────────
  const flashParam =
    newStatus === "SUCCESS"   ? "success"   :
    newStatus === "CANCELLED" ? "cancelled" : "failed";

  return NextResponse.redirect(
    new URL(`/dashboard/payments/${txRef}?status=${flashParam}`, req.nextUrl)
  );
}
