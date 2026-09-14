"use server";

import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { guests, rsvps, wishes } from "@/lib/db/schema";
import { readGuestSession } from "@/lib/auth/guest-session";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export type FormState = { status: "idle" | "success" | "error"; message: string };

async function currentGuest() {
  const guestId = await readGuestSession();
  if (!guestId) return null;
  const [guest] = await getDb().select().from(guests).where(and(eq(guests.id, guestId), eq(guests.isActive, true))).limit(1);
  return guest ?? null;
}

export async function saveRsvp(_: FormState, formData: FormData): Promise<FormState> {
  const guest = await currentGuest();
  if (!guest) return { status: "error", message: "Sesi undangan berakhir. Silakan buka kembali tautan undangan Anda." };
  if (!(await consumeRateLimit("rsvp", guest.id, 10, 10 * 60_000))) return { status: "error", message: "Terlalu banyak perubahan dalam waktu singkat. Coba lagi beberapa menit lagi." };
  const attendanceValue = String(formData.get("attendance") ?? "");
  const attendance = attendanceValue === "yes" ? "attending" : attendanceValue === "no" ? "not_attending" : null;
  if (!attendance) return { status: "error", message: "Pilih konfirmasi kehadiran terlebih dahulu." };
  const requestedCount = attendance === "attending" ? Number(formData.get("count")) : 0;
  if (!Number.isInteger(requestedCount) || requestedCount < 0 || requestedCount > guest.maxGuests) return { status: "error", message: `Jumlah tamu maksimal untuk undangan ini adalah ${guest.maxGuests}.` };
  const message = String(formData.get("message") ?? "").trim().slice(0, 800);
  await getDb().insert(rsvps).values({ guestId: guest.id, attendance, guestCount: requestedCount, message: message || null }).onConflictDoUpdate({ target: rsvps.guestId, set: { attendance, guestCount: requestedCount, message: message || null, updatedAt: new Date() } });
  return { status: "success", message: "Konfirmasi kehadiran Anda sudah tersimpan." };
}

export async function sendWish(_: FormState, formData: FormData): Promise<FormState> {
  const guest = await currentGuest();
  if (!guest) return { status: "error", message: "Sesi undangan berakhir. Silakan buka kembali tautan undangan Anda." };
  if (!(await consumeRateLimit("wish", guest.id, 3, 60 * 60_000))) return { status: "error", message: "Batas pengiriman ucapan telah tercapai. Silakan coba lagi nanti." };
  const message = String(formData.get("wish") ?? "").trim();
  if (message.length < 3) return { status: "error", message: "Tuliskan ucapan sedikit lebih panjang." };
  if (message.length > 600) return { status: "error", message: "Ucapan maksimal 600 karakter." };
  await getDb().insert(wishes).values({ guestId: guest.id, message });
  return { status: "success", message: "Terima kasih. Ucapan Anda akan tampil setelah ditinjau." };
}
