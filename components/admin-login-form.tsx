"use client";

import { useActionState, useState } from "react";
import { loginAdmin, type AdminFormState } from "@/app/admin/actions";

const initial: AdminFormState = { status: "idle", message: "" };

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(loginAdmin, initial);
  const [showPin, setShowPin] = useState(false);
  return (
    <form action={action} className="admin-login-form">
      <label>Username<input name="username" autoComplete="username" required disabled={pending}/></label>
      <label>4-digit PIN
        <span className="admin-pin-field">
          <input name="pin" type={showPin ? "text" : "password"} inputMode="numeric" pattern="[0-9]{4}" minLength={4} maxLength={4} autoComplete="current-password" placeholder="••••" required disabled={pending}/>
          <button type="button" aria-label={showPin ? "Hide PIN" : "Show PIN"} aria-pressed={showPin} onClick={() => setShowPin((visible) => !visible)}>{showPin ? "Hide" : "Show"}</button>
        </span>
      </label>
      {state.message && <p className="form-message error" role="alert">{state.message}</p>}
      <button className="admin-button" disabled={pending}>{pending ? "Checking…" : "Sign in"}</button>
    </form>
  );
}
