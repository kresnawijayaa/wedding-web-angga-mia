import { eq } from "drizzle-orm";
import { isAdminAuthenticated } from "@/lib/auth/admin-session";
import { getDb } from "@/lib/db";
import { guests, rsvps } from "@/lib/db/schema";

function csv(value: unknown) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }

export async function GET() {
  if (!(await isAdminAuthenticated())) return new Response("Unauthorized", { status: 401 });
  const rows = await getDb().select({ name: guests.name, phone: guests.phone, maxGuests: guests.maxGuests, active: guests.isActive, attendance: rsvps.attendance, guestCount: rsvps.guestCount, message: rsvps.message }).from(guests).leftJoin(rsvps, eq(guests.id, rsvps.guestId));
  const header = ["Name", "WhatsApp", "Max Guests", "Active", "Attendance", "Guest Count", "Message"];
  const body = rows.map(row => [row.name, row.phone, row.maxGuests, row.active, row.attendance ?? "waiting", row.guestCount ?? "", row.message ?? ""].map(csv).join(","));
  return new Response(`\uFEFF${header.map(csv).join(",")}\r\n${body.join("\r\n")}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=airlangga-agata-guests.csv", "Cache-Control": "no-store" } });
}
