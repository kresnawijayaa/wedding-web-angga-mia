"use client";

import { useActionState } from "react";
import { loginAdmin, type AdminFormState } from "@/app/admin/actions";

const initial: AdminFormState = { status: "idle", message: "" };

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(loginAdmin, initial);
  return (
    <form action={action} className="admin-login-form">
      <label>Username<input name="username" autoComplete="username" required disabled={pending}/></label>
      <label>4-digit PIN<input name="pin" type="password" inputMode="numeric" pattern="[0-9]{4}" minLength={4} maxLength={4} autoComplete="current-password" placeholder="••••" required disabled={pending}/></label>
      {state.message && <p className="form-message error" role="alert">{state.message}</p>}
      <button className="admin-button" disabled={pending}>{pending ? "Checking…" : "Sign in"}</button>
    </form>
  );
}
