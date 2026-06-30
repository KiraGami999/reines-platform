import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/payments/callback
 *
 * Paychangu redirects the customer here after payment completion.
 * Query params: tx_ref, status, transaction_id
 *
 * We update the payment record and redirect the user to the payment receipt page.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const txRef  = searchParams.get("tx_ref");
  const status = searchParams.get("status"); // "successful" | "failed" | "cancelled"

  if (!txRef) {
    return NextResponse.redirect(new URL("/dashboard/payments?error=missing_ref", req.nextUrl));
  }

  try {
    const newStatus =
      status === "successful" || status === "success" ? "SUCCESS" :
      status === "failed"     ? "FAILED"    :
      status === "cancelled"  ? "CANCELLED" : "FAILED";

    await prisma.payment.update({
      where: { txRef },
      data: {
        status: newStatus,
        ...(newStatus === "SUCCESS" ? { paidAt: new Date() } : {}),
      },
    });
  } catch {
    // If DB is unavailable, still redirect gracefully
  }

  const destination = status === "successful" || status === "success"
    ? `/dashboard/payments/${txRef}?status=success`
    : `/dashboard/payments/${txRef}?status=${status ?? "failed"}`;

  return NextResponse.redirect(new URL(destination, req.nextUrl));
}
