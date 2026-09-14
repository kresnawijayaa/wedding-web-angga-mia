"use client";

import { useActionState } from "react";
import { loginAdmin, type AdminFormState } from "@/app/admin/actions";

const initial: AdminFormState = { status: "idle", message: "" };

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(loginAdmin, initial);
  return <form action={action} className="admin-login-form"><label>Username<input name="username" autoComplete="username" required disabled={pending}/></label><label>Password<input name="password" type="password" autoComplete="current-password" required disabled={pending}/></label>{state.message && <p className="form-message error" role="alert">{state.message}</p>}<button className="admin-button" disabled={pending}>{pending ? "Checking…" : "Sign in"}</button></form>;
}
