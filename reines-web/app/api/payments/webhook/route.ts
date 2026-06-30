import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature, type PaychanguWebhookPayload } from "@/lib/paychangu";
import { autoAwardPointsForPayment } from "@/lib/loyalty";

/**
 * POST /api/payments/webhook
 *
 * Paychangu sends real-time payment event notifications here.
 * We verify the signature, then update the Payment record accordingly.
 *
 * Paychangu retries 3× with 30-min intervals if we return anything other than 200.
 * Always return 200 to acknowledge, even for events we don't handle.
 */
export async function POST(req: NextRequest) {
  const rawBody  = await req.text();
  const signature = req.headers.get("Signature");

  // ── Verify the request is genuinely from Paychangu ─────────────────────────
  const isValid = verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    console.warn("[webhook] Invalid Paychangu signature — rejecting.");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: PaychanguWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // We only care about charge payment events
  if (payload.event_type !== "api.charge.payment") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const txRef  = payload.reference;
  const status = payload.status;

  try {
    const newStatus =
      status === "success" ? "SUCCESS" :
      status === "failed"  ? "FAILED"  : "PENDING";

    const updated = await prisma.payment.update({
      where: { txRef },
      data: {
        status:      newStatus,
        paychanguId: payload.charge_id,
        ...(newStatus === "SUCCESS" ? { paidAt: new Date(payload.updated_at) } : {}),
      },
    });

    // Auto-award loyalty points for successful online payments
    if (newStatus === "SUCCESS") {
      await autoAwardPointsForPayment(
        updated.userId,
        updated.projectId,
        updated.id,
        Number(updated.amount),
        updated.description,
        null,
      );
    }

    console.info(`[webhook] Payment ${txRef} → ${newStatus}`);
  } catch (err) {
    // Log but still return 200 — Paychangu shouldn't retry for DB errors
    console.error("[webhook] DB update failed:", err);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
