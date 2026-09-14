"use client";

import { useActionState } from "react";
import { createGuest, type AdminFormState } from "@/app/admin/actions";

const initial: AdminFormState = { status: "idle", message: "" };

export function AdminGuestForm() {
  const [state, action, pending] = useActionState(createGuest, initial);
  return (
    <details className="admin-add admin-tool-disclosure">
      <summary><span>Add guest</span><small>Manually</small></summary>
      <div className="admin-add-panel">
        <div className="admin-tool-heading"><div><strong>Add one guest</strong><span>Create a personal invitation link.</span></div></div>
        <form action={action} className="admin-add-form">
          <label>Guest name<input name="name" required maxLength={160} placeholder="Name or family"/></label>
          <label>WhatsApp<input name="phone" type="tel" required placeholder="08xx xxxx xxxx"/></label>
          <label>Max guests<input name="maxGuests" type="number" min="1" max="10" defaultValue="1" required/></label>
          <button className="admin-button" disabled={pending}>{pending ? "Adding…" : "Add guest"}</button>
          {state.message && <p className={`form-message ${state.status}`}>{state.message}</p>}
        </form>
      </div>
    </details>
  );
}
