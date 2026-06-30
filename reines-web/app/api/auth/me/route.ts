import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/** GET /api/auth/me — returns the current session user. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  return NextResponse.json({ user: session.user });
}
