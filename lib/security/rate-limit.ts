import { createHmac } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { rateLimits } from "@/lib/db/schema";

function privateKey(scope: string, identifier: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured.");
  return createHmac("sha256", secret).update(`${scope}:${identifier}`).digest("hex");
}

export async function consumeRateLimit(scope: string, identifier: string, limit: number, windowMs: number) {
  try {
    const db = getDb();
    const key = privateKey(scope, identifier);
    const now = new Date();
    const [record] = await db.select().from(rateLimits).where(eq(rateLimits.key, key)).limit(1);

    if (!record) {
      await db.insert(rateLimits).values({ key }).onConflictDoNothing();
      return true;
    }

    if (now.getTime() - record.windowStartedAt.getTime() >= windowMs) {
      await db.update(rateLimits).set({ attempts: 1, windowStartedAt: now, updatedAt: now }).where(eq(rateLimits.key, key));
      return true;
    }

    if (record.attempts >= limit) return false;
    await db.update(rateLimits).set({ attempts: record.attempts + 1, updatedAt: now }).where(eq(rateLimits.key, key));
    return true;
  } catch (error) {
    console.error("Rate limit check unavailable:", error instanceof Error ? error.message : error);
    return true;
  }
}
