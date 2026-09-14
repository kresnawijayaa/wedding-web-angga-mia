"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { readSheet } from "read-excel-file/browser";
import { importGuests, type AdminImportState } from "@/app/admin/actions";
import { parseGuestRows, type GuestImportCell } from "@/lib/guest-import";

const initialState: AdminImportState = { status: "idle", message: "" };

type Preview = {
  fileName: string;
  totalRows: number;
  validRows: number;
  errors: string[];
};

export function AdminGuestImport() {
  const [state, action, pending] = useActionState(importGuests, initialState);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [checking, setChecking] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setPreview(null);
    }
  }, [state]);

  async function inspectFile(file?: File) {
    setPreview(null);
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setPreview({ fileName: file.name, totalRows: 0, validRows: 0, errors: ["Ukuran file maksimal 2 MB."] });
      return;
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx")) {
      setPreview({ fileName: file.name, totalRows: 0, validRows: 0, errors: ["Gunakan file Excel dengan format .xlsx."] });
      return;
    }

    setChecking(true);
    try {
      const rows: GuestImportCell[][] = await readSheet(file);
      const result = parseGuestRows(rows);
      setPreview({
        fileName: file.name,
        totalRows: result.totalRows,
        validRows: result.records.length,
        errors: result.errors,
      });
    } catch {
      setPreview({ fileName: file.name, totalRows: 0, validRows: 0, errors: ["File tidak dapat dibaca."] });
    } finally {
      setChecking(false);
    }
  }

  const canImport = preview && preview.validRows > 0 && preview.errors.length === 0;

  return (
    <details className="admin-import">
      <summary><span>Import guests</span><small>Excel .xlsx</small></summary>
      <div className="admin-import-panel">
        <div className="admin-import-heading">
          <div>
            <strong>Upload guest list</strong>
            <p>Upload up to 500 guests. Existing WhatsApp numbers will be skipped.</p>
          </div>
          <a href="/admin/import-template">Download template</a>
        </div>
        <form action={action} ref={formRef}>
          <label className="admin-file-field">
            Excel file (.xlsx)
            <input
              name="file"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              required
              onChange={(event) => void inspectFile(event.currentTarget.files?.[0])}
            />
          </label>
          {checking && <p className="admin-import-preview" aria-live="polite">Checking file…</p>}
          {!checking && preview && (
            <div className={`admin-import-preview ${preview.errors.length ? "has-errors" : "is-ready"}`} aria-live="polite">
              <strong>{preview.fileName}</strong>
              <span>{preview.validRows} of {preview.totalRows} rows ready</span>
              {preview.errors.slice(0, 3).map((error) => <small key={error}>{error}</small>)}
              {preview.errors.length > 3 && <small>{preview.errors.length - 3} more errors must be fixed.</small>}
            </div>
          )}
          <button className="admin-button" disabled={pending || checking || !canImport}>
            {pending ? "Importing…" : "Import guests"}
          </button>
          {state.message && <p className={`form-message ${state.status}`} aria-live="polite">{state.message}</p>}
        </form>
      </div>
    </details>
  );
}
