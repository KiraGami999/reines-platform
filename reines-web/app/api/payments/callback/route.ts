import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * GET /api/payments/callback
 *
 * Paychangu redirects the customer here after payment completion.
 * Query params: tx_ref, status, transaction_id
 *
 * We update the payment record in the DB, bust the relevant page caches,
 * then redirect the user to their payment receipt page.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const txRef  = searchParams.get("tx_ref");
  const status = searchParams.get("status"); // "successful" | "failed" | "cancelled"

  if (!txRef) {
    return NextResponse.redirect(new URL("/dashboard/payments?error=missing_ref", req.nextUrl));
  }

  let projectId: string | null = null;

  try {
    const newStatus =
      status === "successful" || status === "success" ? "SUCCESS" :
      status === "failed"                             ? "FAILED"  :
      status === "cancelled"                          ? "CANCELLED" : "FAILED";

    const updated = await prisma.payment.update({
      where: { txRef },
      data: {
        status: newStatus,
        ...(newStatus === "SUCCESS" ? { paidAt: new Date() } : {}),
      },
      select: { projectId: true },
    });

    projectId = updated.projectId;

    // Bust Next.js page caches so the project budget and payment list are
    // immediately up to date when the user is redirected.
    revalidatePath("/dashboard/payments", "layout");
    if (projectId) {
      revalidatePath(`/dashboard/projects/${projectId}`, "page");
    }

    console.info(`[callback] ${txRef} → ${newStatus}`);
  } catch (err) {
    console.error("[callback] Failed to update payment status:", err);
  }

  const destination = status === "successful" || status === "success"
    ? `/dashboard/payments/${txRef}?status=success`
    : `/dashboard/payments/${txRef}?status=${status ?? "failed"}`;

  return NextResponse.redirect(new URL(destination, req.nextUrl));
}
