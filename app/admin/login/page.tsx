import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { isAdminAuthenticated } from "@/lib/auth/admin-session";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect("/admin");
  return <main className="admin-login"><div><p className="eyebrow dark">Together Forever · Private</p><h1>Wedding<br/><em>desk.</em></h1><p>Manage guests, attendance, and messages for Airlangga & Agata.</p></div><AdminLoginForm/></main>;
}
