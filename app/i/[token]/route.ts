import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { guests } from "@/lib/db/schema";
import { createGuestSession } from "@/lib/auth/guest-session";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-zA-Z0-9_-]{6,64}$/.test(token)) return NextResponse.redirect(new URL("/?invalid=1", request.url));
  const [guest] = await getDb().select({ id: guests.id }).from(guests).where(and(eq(guests.invitationToken, token), eq(guests.isActive, true))).limit(1);
  if (!guest) return NextResponse.redirect(new URL("/?invalid=1", request.url));
  await createGuestSession(guest.id);
  return NextResponse.redirect(new URL("/invitation", request.url));
}
