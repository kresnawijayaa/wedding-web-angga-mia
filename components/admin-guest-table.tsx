"use client";

import { type FormEvent, useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  deleteGuest,
  deleteGuests,
  regenerateInvitationCode,
  toggleGuest,
  updateGuest,
  type AdminDeleteState,
} from "@/app/admin/actions";
import { CopyInvitationLink } from "@/components/copy-invitation-link";

export type AdminGuestRow = {
  id: string;
  name: string;
  phone: string;
  maxGuests: number;
  active: boolean;
  token: string;
  attendance: "attending" | "not_attending" | null;
  guestCount: number | null;
  url: string;
  waUrl: string;
};

const initialDeleteState: AdminDeleteState = { status: "idle", message: "" };

function DeleteButton() {
  const { pending } = useFormStatus();
  return <button className="admin-action-button danger" disabled={pending}>{pending ? "Deleting…" : "Delete"}</button>;
}

function GuestActions({ row, confirmDelete }: { row: AdminGuestRow; confirmDelete: (event: FormEvent<HTMLFormElement>, name: string) => void }) {
  return (
    <div className="admin-row-actions">
      <details className="admin-edit">
        <summary className="admin-action-button">Edit</summary>
        <form action={updateGuest}>
          <input type="hidden" name="id" value={row.id}/>
          <label>Name<input name="name" defaultValue={row.name} required maxLength={160}/></label>
          <label>WhatsApp<input name="phone" defaultValue={row.phone} required/></label>
          <label>Max guests<input name="maxGuests" type="number" min="1" max="10" defaultValue={row.maxGuests} required/></label>
          <button className="admin-button">Save changes</button>
        </form>
      </details>
      <form action={toggleGuest}><input type="hidden" name="id" value={row.id}/><input type="hidden" name="active" value={String(row.active)}/><button className="admin-action-button">{row.active ? "Disable" : "Enable"}</button></form>
      <form action={regenerateInvitationCode}><input type="hidden" name="id" value={row.id}/><input type="hidden" name="name" value={row.name}/><button className="admin-action-button" title="The previous invitation link will stop working">New code</button></form>
      <form action={deleteGuest} onSubmit={(event) => confirmDelete(event, row.name)}><input type="hidden" name="id" value={row.id}/><DeleteButton/></form>
    </div>
  );
}

function InvitationCode({ row }: { row: AdminGuestRow }) {
  return (
    <div className="admin-code-block">
      <span>Invitation code</span>
      <code>{row.token}</code>
      <div><CopyInvitationLink url={row.url}/><a className="admin-action-button" href={row.url} target="_blank" rel="noreferrer">Open</a></div>
    </div>
  );
}

export function AdminGuestTable({ rows }: { rows: AdminGuestRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteState, bulkDeleteAction, deleting] = useActionState(deleteGuests, initialDeleteState);
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id));

  useEffect(() => {
    const visibleIds = new Set(rows.map((row) => row.id));
    setSelected((current) => new Set([...current].filter((id) => visibleIds.has(id))));
  }, [rows]);

  useEffect(() => {
    if (deleteState.status === "success") setSelected(new Set());
  }, [deleteState]);

  function toggleRow(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function confirmSingleDelete(event: FormEvent<HTMLFormElement>, name: string) {
    if (!window.confirm(`Hapus ${name} dari daftar tamu? RSVP dan wishes milik tamu ini juga akan dihapus.`)) event.preventDefault();
  }

  function confirmBulkDelete(event: FormEvent<HTMLFormElement>) {
    if (!selected.size || !window.confirm(`Hapus ${selected.size} tamu terpilih? RSVP dan wishes mereka juga akan dihapus.`)) event.preventDefault();
  }

  return (
    <>
      <div className={`admin-bulk-bar ${selected.size ? "is-visible" : ""}`} aria-live="polite">
        <label className="admin-select-all"><input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map((row) => row.id)))}/><span>{selected.size ? `${selected.size} guests selected` : "Select all on this page"}</span></label>
        <form action={bulkDeleteAction} onSubmit={confirmBulkDelete}>
          {[...selected].map((id) => <input key={id} type="hidden" name="ids" value={id}/>) }
          <button className="admin-button danger" disabled={!selected.size || deleting}>{deleting ? "Deleting…" : `Delete selected${selected.size ? ` (${selected.size})` : ""}`}</button>
        </form>
      </div>
      {deleteState.message && <p className={`form-message admin-bulk-message ${deleteState.status}`}>{deleteState.message}</p>}

      <div className="admin-desktop-list admin-table-wrap">
        <table>
          <thead><tr><th className="admin-check-cell">Select</th><th>Guest</th><th>WhatsApp</th><th>Invitation</th><th>RSVP</th><th>Seats</th><th>Actions</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id} className={!row.active ? "is-disabled" : undefined}>
            <td className="admin-check-cell"><input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} aria-label={`Select ${row.name}`}/></td>
            <td><strong className="admin-guest-name">{row.name}</strong>{!row.active && <small>Invitation disabled</small>}<small>{row.phone}</small></td>
            <td><a className="admin-wa-button" href={row.waUrl} target="_blank" rel="noreferrer">Send WhatsApp</a></td>
            <td><InvitationCode row={row}/></td>
            <td><span className={`status ${row.attendance ?? "waiting"}`}>{row.attendance?.replace("_", " ") ?? "waiting"}</span></td>
            <td><strong>{row.guestCount ?? "—"}</strong><small>of {row.maxGuests}</small></td>
            <td><GuestActions row={row} confirmDelete={confirmSingleDelete}/></td>
          </tr>)}</tbody>
        </table>
      </div>

      <div className="admin-mobile-list">
        {rows.map((row) => <article key={row.id} className={!row.active ? "is-disabled" : undefined}>
          <header>
            <label className="admin-mobile-select"><input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} aria-label={`Select ${row.name}`}/></label>
            <div><strong>{row.name}</strong><span>{row.phone}</span></div>
            <span className={`status ${row.attendance ?? "waiting"}`}>{row.attendance?.replace("_", " ") ?? "waiting"}</span>
          </header>
          {!row.active && <p className="admin-disabled-note">Invitation is currently disabled.</p>}
          <div className="admin-mobile-summary">
            <span><small>Code</small><code>{row.token}</code></span>
            <span><small>Guests</small><strong>{row.guestCount ?? "—"} / {row.maxGuests}</strong></span>
          </div>
          <div className="admin-mobile-primary-actions">
            <a className="admin-wa-button" href={row.waUrl} target="_blank" rel="noreferrer">Send WhatsApp</a>
            <CopyInvitationLink url={row.url}/>
          </div>
          <details className="admin-mobile-more">
            <summary>More actions</summary>
            <div className="admin-mobile-more-content">
              <a className="admin-action-button" href={row.url} target="_blank" rel="noreferrer">Open invitation</a>
              <GuestActions row={row} confirmDelete={confirmSingleDelete}/>
            </div>
          </details>
        </article>)}
      </div>
    </>
  );
}
