import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createGuestSession } from "@/lib/auth/guest-session";
import { getDb } from "@/lib/db";
import { guests } from "@/lib/db/schema";

export async function GET(request: Request, { params }: { params: Promise<{ invite: string }> }) {
  const { invite } = await params;
  if (!/^[a-z]{6}$/.test(invite)) return NextResponse.redirect(new URL("/?invalid=1", request.url));
  try {
    const [guest] = await getDb().select({ id: guests.id }).from(guests).where(and(eq(guests.invitationToken, invite), eq(guests.isActive, true))).limit(1);
    if (!guest) return NextResponse.redirect(new URL("/?invalid=1", request.url));
    await createGuestSession(guest.id);
    return NextResponse.redirect(new URL("/invitation", request.url));
  } catch {
    return NextResponse.redirect(new URL("/?invalid=1", request.url));
  }
}
