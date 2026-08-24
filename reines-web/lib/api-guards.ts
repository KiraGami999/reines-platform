import { NextResponse, type NextRequest } from "next/server";
import { auth } from "./auth";
import { verifyToken, extractBearer } from "./jwt";
import { prisma } from "./prisma";

/**
 * Web API Guard
 * Checks if the user is authenticated via NextAuth and, if they are a CLIENT,
 * verifies that their status is APPROVED.
 */
export async function checkVerification() {
  const session = await auth();
  if (!session?.user) {
    return {
      errorResponse: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }),
      session: null,
    };
  }

  if (session.user.role === "CLIENT" && session.user.verificationStatus !== "APPROVED") {
    return {
      errorResponse: NextResponse.json({ error: "Verification required." }, { status: 403 }),
      session,
    };
  }

  return { session };
}

/**
 * Mobile API Guard
 * Parses the mobile Bearer token and checks if the client user is verified in the DB.
 */
export async function checkMobileVerification(req: NextRequest) {
  const token = extractBearer(req.headers.get("authorization"));
  if (!token) {
    return {
      errorResponse: NextResponse.json({ error: "Unauthenticated." }, { status: 401 }),
      payload: null,
    };
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return {
      errorResponse: NextResponse.json({ error: "Token invalid or expired." }, { status: 401 }),
      payload: null,
    };
  }

  if (payload.role === "CLIENT") {
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { verificationStatus: true },
    });
    if (!user || user.verificationStatus !== "APPROVED") {
      return {
        errorResponse: NextResponse.json({ error: "Verification required." }, { status: 403 }),
        payload,
      };
    }
  }

  return { payload };
}
