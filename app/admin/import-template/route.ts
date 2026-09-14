import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth/admin-session";
import { createGuestImportTemplate } from "@/lib/guest-import-template";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const workbook = await createGuestImportTemplate();

  return new Response(new Uint8Array(workbook), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="guest-import-template.xlsx"',
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
