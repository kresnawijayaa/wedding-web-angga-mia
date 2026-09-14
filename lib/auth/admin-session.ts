import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "wedding_admin";
const MAX_AGE = 60 * 60 * 12;

function appSecret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET is not configured securely.");
  return value;
}

function sign(payload: string) {
  return createHmac("sha256", appSecret()).update(payload).digest("base64url");
}

export function verifyAdminCredentials(username: string, pin: string) {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPin = process.env.ADMIN_PIN;
  if (!expectedUsername || username !== expectedUsername || !expectedPin || !/^\d{4}$/.test(expectedPin) || !/^\d{4}$/.test(pin)) return false;
  const actual = Buffer.from(pin);
  const expected = Buffer.from(expectedPin);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function createAdminSession() {
  const expires = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = `admin.${expires}`;
  (await cookies()).set(COOKIE_NAME, `${payload}.${sign(payload)}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/admin", maxAge: MAX_AGE, priority: "high" });
}

export async function isAdminAuthenticated() {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return false;
  const [role, expires, signature] = value.split(".");
  if (role !== "admin" || !expires || Number(expires) <= Date.now() / 1000 || !signature) return false;
  const expected = sign(`${role}.${expires}`);
  const received = Buffer.from(signature);
  return received.length === Buffer.byteLength(expected) && timingSafeEqual(received, Buffer.from(expected));
}

export async function clearAdminSession() {
  (await cookies()).delete(COOKIE_NAME);
}
