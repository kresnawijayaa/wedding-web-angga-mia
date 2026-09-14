export type GuestImportCell = unknown;

export type GuestImportRecord = {
  name: string;
  phone: string;
  maxGuests: number;
  row: number;
};

export type GuestImportResult = {
  records: GuestImportRecord[];
  errors: string[];
  totalRows: number;
};

const HEADER_ALIASES = {
  name: ["nama tamu", "nama", "guest name", "name"],
  phone: ["nomor whatsapp", "no whatsapp", "whatsapp", "phone", "phone number"],
  maxGuests: ["jumlah tamu", "max guests", "jumlah undangan", "guest count", "seats"],
};

export function normalizePhone(value: unknown) {
  const raw = String(value ?? "").trim();
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) return `+62${digits.slice(1)}`;
  if (digits.startsWith("62")) return `+${digits}`;
  if (digits.startsWith("8")) return `+62${digits}`;
  return raw.startsWith("+") ? `+${digits}` : digits;
}

function normalizeHeader(value: GuestImportCell) {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function findColumn(headers: string[], aliases: string[]) {
  return headers.findIndex((header) => aliases.includes(header));
}

function hasValue(value: GuestImportCell) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

export function parseGuestRows(rows: GuestImportCell[][]): GuestImportResult {
  const headerIndex = rows.findIndex((row) => row.some(hasValue));
  if (headerIndex < 0) return { records: [], errors: ["File tidak berisi data."], totalRows: 0 };

  const headers = rows[headerIndex].map(normalizeHeader);
  const nameIndex = findColumn(headers, HEADER_ALIASES.name);
  const phoneIndex = findColumn(headers, HEADER_ALIASES.phone);
  const maxGuestsIndex = findColumn(headers, HEADER_ALIASES.maxGuests);
  const missing = [
    nameIndex < 0 ? '"Nama Tamu"' : "",
    phoneIndex < 0 ? '"Nomor WhatsApp"' : "",
    maxGuestsIndex < 0 ? '"Jumlah Tamu"' : "",
  ].filter(Boolean);

  if (missing.length) {
    return {
      records: [],
      errors: [`Kolom ${missing.join(", ")} tidak ditemukan.`],
      totalRows: 0,
    };
  }

  const dataRows = rows.slice(headerIndex + 1).filter((row) => row.some(hasValue));
  const errors: string[] = [];
  const records: GuestImportRecord[] = [];
  const seenPhones = new Map<string, number>();

  if (dataRows.length > 500) errors.push("Maksimal 500 tamu dalam satu file.");

  dataRows.slice(0, 500).forEach((row, index) => {
    const rowNumber = headerIndex + index + 2;
    const name = String(row[nameIndex] ?? "").trim();
    const phone = normalizePhone(row[phoneIndex]);
    const rawMaxGuests = row[maxGuestsIndex];
    const maxGuests = rawMaxGuests === null || rawMaxGuests === undefined || String(rawMaxGuests).trim() === ""
      ? 1
      : Number(rawMaxGuests);
    const rowErrors: string[] = [];

    if (name.length < 2) rowErrors.push("nama minimal 2 karakter");
    if (name.length > 160) rowErrors.push("nama maksimal 160 karakter");
    if (!/^\+62\d{8,13}$/.test(phone)) rowErrors.push("nomor WhatsApp tidak valid");
    if (!Number.isInteger(maxGuests) || maxGuests < 1 || maxGuests > 10) rowErrors.push("jumlah tamu harus 1–10");

    const duplicateRow = seenPhones.get(phone);
    if (phone && duplicateRow) rowErrors.push(`nomor WhatsApp sama dengan baris ${duplicateRow}`);

    if (rowErrors.length) {
      errors.push(`Baris ${rowNumber}: ${rowErrors.join(", ")}.`);
      return;
    }

    seenPhones.set(phone, rowNumber);
    records.push({ name, phone, maxGuests, row: rowNumber });
  });

  return { records, errors, totalRows: dataRows.length };
}
