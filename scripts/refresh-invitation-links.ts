import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../lib/db";
import { guests } from "../lib/db/schema";
import { createInvitationCode } from "../lib/invitation-link";

async function refreshInvitationLinks() {
  const db = getDb();
  const rows = await db.select({ id: guests.id }).from(guests);
  for (const guest of rows) {
    await db.update(guests).set({ invitationToken: createInvitationCode(), updatedAt: new Date() }).where(eq(guests.id, guest.id));
  }
  console.log(`Refreshed ${rows.length} personal invitation link(s).`);
}

refreshInvitationLinks().catch((error) => {
  console.error("Unable to refresh invitation links:", error instanceof Error ? error.message : error);
  process.exit(1);
});
