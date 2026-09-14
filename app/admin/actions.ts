"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readSheet } from "read-excel-file/node";
import { clearAdminSession, createAdminSession, isAdminAuthenticated, verifyAdminCredentials } from "@/lib/auth/admin-session";
import { getDb } from "@/lib/db";
import { guests, siteSettings, wishes } from "@/lib/db/schema";
import { normalizePhone, parseGuestRows, type GuestImportCell } from "@/lib/guest-import";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { createInvitationCode } from "@/lib/invitation-link";
import { WHATSAPP_TEMPLATE_KEY } from "@/lib/whatsapp-template";

export type AdminFormState = { status: "idle" | "error" | "success"; message: string };
export type AdminImportState = AdminFormState & { imported?: number; skipped?: number };
export type AdminDeleteState = AdminFormState & { deleted?: number };

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) throw new Error("Unauthorized");
}

export async function loginAdmin(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const username = String(formData.get("username") ?? "").trim();
  const pin = String(formData.get("pin") ?? "");
  if (!(await consumeRateLimit("admin-login", username.toLowerCase() || "empty", 5, 15 * 60_000))) return { status: "error", message: "Terlalu banyak percobaan login. Silakan tunggu 15 menit." };
  if (!verifyAdminCredentials(username, pin)) return { status: "error", message: "Username atau PIN tidak sesuai." };
  await createAdminSession();
  redirect("/admin");
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function createGuest(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim().slice(0, 160);
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const maxGuests = Number(formData.get("maxGuests"));
  if (name.length < 2) return { status: "error", message: "Nama tamu minimal 2 karakter." };
  if (!/^\+62\d{8,13}$/.test(phone)) return { status: "error", message: "Nomor WhatsApp tidak valid." };
  if (!Number.isInteger(maxGuests) || maxGuests < 1 || maxGuests > 10) return { status: "error", message: "Jumlah tamu harus antara 1–10." };
  try {
    await getDb().insert(guests).values({ name, phone, maxGuests, invitationToken: createInvitationCode() });
  } catch {
    return { status: "error", message: "Nomor WhatsApp tersebut sudah terdaftar." };
  }
  revalidatePath("/admin");
  return { status: "success", message: "Tamu berhasil ditambahkan." };
}

export async function toggleGuest(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  await getDb().update(guests).set({ isActive: !active, updatedAt: new Date() }).where(eq(guests.id, id));
  revalidatePath("/admin");
}

export async function moderateWish(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["approved", "hidden"].includes(status)) return;
  await getDb().update(wishes).set({ status: status as "approved" | "hidden", updatedAt: new Date() }).where(eq(wishes.id, id));
  revalidatePath("/admin");
}

export async function updateGuest(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 160);
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const maxGuests = Number(formData.get("maxGuests"));
  if (!/^[0-9a-f-]{36}$/i.test(id) || name.length < 2 || !/^\+62\d{8,13}$/.test(phone) || !Number.isInteger(maxGuests) || maxGuests < 1 || maxGuests > 10) return;
  try {
    await getDb().update(guests).set({ name, phone, maxGuests, updatedAt: new Date() }).where(eq(guests.id, id));
    revalidatePath("/admin");
  } catch { return; }
}

export async function regenerateInvitationCode(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  await getDb().update(guests).set({ invitationToken: createInvitationCode(), updatedAt: new Date() }).where(eq(guests.id, id));
  revalidatePath("/admin");
}

function validGuestIds(values: FormDataEntryValue[]) {
  return [...new Set(values.map(String).filter((id) => /^[0-9a-f-]{36}$/i.test(id)))].slice(0, 100);
}

export async function deleteGuest(formData: FormData) {
  await requireAdmin();
  const ids = validGuestIds([formData.get("id") ?? ""]);
  if (!ids.length) return;
  await getDb().delete(guests).where(eq(guests.id, ids[0]));
  revalidatePath("/admin");
}

export async function deleteGuests(_: AdminDeleteState, formData: FormData): Promise<AdminDeleteState> {
  await requireAdmin();
  const ids = validGuestIds(formData.getAll("ids"));
  if (!ids.length) return { status: "error", message: "Pilih setidaknya satu tamu." };

  const deleted = await getDb().delete(guests).where(inArray(guests.id, ids)).returning({ id: guests.id });
  revalidatePath("/admin");
  return {
    status: "success",
    message: `${deleted.length} tamu berhasil dihapus.`,
    deleted: deleted.length,
  };
}

export async function importGuests(_: AdminImportState, formData: FormData): Promise<AdminImportState> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { status: "error", message: "Pilih file Excel terlebih dahulu." };
  if (file.size > 2 * 1024 * 1024) return { status: "error", message: "Ukuran file maksimal 2 MB." };

  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith(".xlsx")) {
    return { status: "error", message: "Format file harus .xlsx." };
  }

  let rows: GuestImportCell[][];
  try {
    rows = await readSheet(Buffer.from(await file.arrayBuffer()));
  } catch (error) {
    console.error("Unable to read guest import file", error);
    return { status: "error", message: "File tidak dapat dibaca. Pastikan file tidak rusak dan memakai format yang didukung." };
  }

  const parsed = parseGuestRows(rows);
  if (parsed.errors.length) {
    const visibleErrors = parsed.errors.slice(0, 5).join(" ");
    const remainder = parsed.errors.length > 5 ? ` Masih ada ${parsed.errors.length - 5} kesalahan lain.` : "";
    return { status: "error", message: `${visibleErrors}${remainder}` };
  }
  if (!parsed.records.length) return { status: "error", message: "Tidak ada tamu yang dapat diimpor." };

  try {
    const inserted = await getDb()
      .insert(guests)
      .values(parsed.records.map(({ name, phone, maxGuests }) => ({
        name,
        phone,
        maxGuests,
        invitationToken: createInvitationCode(),
      })))
      .onConflictDoNothing()
      .returning({ id: guests.id });
    const skipped = parsed.records.length - inserted.length;
    revalidatePath("/admin");
    return {
      status: "success",
      message: skipped
        ? `${inserted.length} tamu ditambahkan; ${skipped} nomor yang sudah terdaftar dilewati.`
        : `${inserted.length} tamu berhasil ditambahkan.`,
      imported: inserted.length,
      skipped,
    };
  } catch (error) {
    console.error("Unable to import guests", error);
    return { status: "error", message: "Impor gagal disimpan. Silakan coba lagi." };
  }
}

export async function updateWhatsappTemplate(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const template = String(formData.get("template") ?? "").trim();
  if (template.length < 20) return { status: "error", message: "Pesan terlalu pendek." };
  if (template.length > 2000) return { status: "error", message: "Pesan maksimal 2.000 karakter." };
  if (!template.includes("{name}") || !template.includes("{link}")) {
    return { status: "error", message: "Template harus memuat placeholder {name} dan {link}." };
  }

  try {
    await getDb().insert(siteSettings).values({ key: WHATSAPP_TEMPLATE_KEY, value: template }).onConflictDoUpdate({
      target: siteSettings.key,
      set: { value: template, updatedAt: new Date() },
    });
    revalidatePath("/admin");
    return { status: "success", message: "Template WhatsApp berhasil disimpan." };
  } catch (error) {
    console.error("Unable to update WhatsApp template", error);
    return { status: "error", message: "Template belum dapat disimpan. Silakan coba lagi." };
  }
}
