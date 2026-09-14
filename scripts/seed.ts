import "dotenv/config";
import { getDb } from "../lib/db";
import { guests } from "../lib/db/schema";

const demoGuests = [
  {
    name: "Kresna Wijaya & Partner",
    phone: "+628000000001",
    invitationToken: "xqmtaz",
    maxGuests: 2,
  },
  {
    name: "Budi Santoso",
    phone: "+628000000002",
    invitationToken: "jrvkpe",
    maxGuests: 1,
  },
  {
    name: "Wina & Family",
    phone: "+628000000003",
    invitationToken: "uhfcyn",
    maxGuests: 3,
  },
] satisfies Array<typeof guests.$inferInsert>;

async function seed() {
  const db = getDb();

  for (const guest of demoGuests) {
    await db
      .insert(guests)
      .values(guest)
      .onConflictDoUpdate({
        target: guests.phone,
        set: {
          name: guest.name,
          invitationToken: guest.invitationToken,
          maxGuests: guest.maxGuests,
          isActive: true,
          updatedAt: new Date(),
        },
      });
  }

  const rows = await db.select({ name: guests.name, token: guests.invitationToken }).from(guests);
  console.log(`Database ready. ${rows.length} guest record(s) available.`);
}

seed().catch((error) => {
  console.error("Database seed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
