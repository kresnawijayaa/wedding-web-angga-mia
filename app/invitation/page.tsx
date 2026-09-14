import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { WeddingInvitation } from "@/components/wedding-invitation";
import { readGuestSession } from "@/lib/auth/guest-session";
import { getDb } from "@/lib/db";
import { guests, rsvps, wishes } from "@/lib/db/schema";

export default async function InvitationPage() {
  const guestId = await readGuestSession();
  if (!guestId) redirect("/");
  const db = getDb();
  const [guest] = await db.select().from(guests).where(and(eq(guests.id, guestId), eq(guests.isActive, true))).limit(1);
  if (!guest) redirect("/");
  const [rsvp] = await db.select().from(rsvps).where(eq(rsvps.guestId, guest.id)).limit(1);
  const approvedWishes = await db.select({ id: wishes.id, message: wishes.message, name: guests.name }).from(wishes).innerJoin(guests, eq(wishes.guestId, guests.id)).where(eq(wishes.status, "approved")).orderBy(desc(wishes.createdAt)).limit(12);
  return <WeddingInvitation guest={{ name: guest.name, maxGuests: guest.maxGuests }} initialRsvp={rsvp ? { attendance: rsvp.attendance, guestCount: rsvp.guestCount, message: rsvp.message ?? "" } : null} wishes={approvedWishes}/>;
}
