import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPortalGreeting } from "@/lib/greetings";

/**
 * Fresh portal greeting for the signed-in user.
 * Called whenever Overview is opened or the browser tab becomes visible again.
 * Optional `exclude` query skips the previous phrase when other options exist.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.name) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const exclude = request.nextUrl.searchParams.get("exclude");
    const greeting = await getPortalGreeting(session.user.name, {
      excludePhrase: exclude,
    });
    return NextResponse.json(
      { greeting },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (err) {
    console.error("[api/portal/greeting]", err);
    return NextResponse.json({ error: "Could not load greeting." }, { status: 500 });
  }
}
