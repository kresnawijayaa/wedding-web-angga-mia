import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "wedding_guest";
const SESSION_MAX_AGE = 60 * 60 * 24 * 120;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32 || value.startsWith("replace-")) {
    throw new Error("SESSION_SECRET must be a secure value of at least 32 characters.");
  }
  return value;
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export async function createGuestSession(guestId: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = `${guestId}.${expiresAt}`;
  (await cookies()).set(COOKIE_NAME, `${payload}.${signature(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    priority: "high",
  });
}

export async function readGuestSession() {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return null;
  const [guestId, expiresAt, receivedSignature] = value.split(".");
  if (!guestId || !expiresAt || !receivedSignature || Number(expiresAt) <= Date.now() / 1000) return null;
  const expected = signature(`${guestId}.${expiresAt}`);
  const received = Buffer.from(receivedSignature);
  const valid = received.length === Buffer.byteLength(expected) && timingSafeEqual(received, Buffer.from(expected));
  return valid ? guestId : null;
}
