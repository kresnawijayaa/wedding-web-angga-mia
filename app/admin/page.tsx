import { and, count, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AdminGuestForm } from "@/components/admin-guest-form";
import { AdminGuestImport } from "@/components/admin-guest-import";
import { AdminGuestTable, type AdminGuestRow } from "@/components/admin-guest-table";
import { AdminWhatsappTemplate } from "@/components/admin-whatsapp-template";
import { isAdminAuthenticated } from "@/lib/auth/admin-session";
import { getDb } from "@/lib/db";
import { guests, rsvps, siteSettings, wishes } from "@/lib/db/schema";
import { invitationUrl, whatsappUrl } from "@/lib/invitation-link";
import { DEFAULT_WHATSAPP_TEMPLATE, WHATSAPP_TEMPLATE_KEY } from "@/lib/whatsapp-template";
import { logoutAdmin, moderateWish } from "./actions";

const PAGE_SIZE = 20;

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const params = await searchParams;
  const query = (params.q ?? "").trim().slice(0, 80);
  const status = ["all", "attending", "not_attending", "waiting"].includes(params.status ?? "") ? params.status! : "all";
  const requestedPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const conditions = [];
  if (query) conditions.push(or(ilike(guests.name, `%${query}%`), ilike(guests.phone, `%${query}%`))!);
  if (status === "waiting") conditions.push(isNull(rsvps.attendance));
  if (status === "attending" || status === "not_attending") conditions.push(eq(rsvps.attendance, status));
  const where = conditions.length ? and(...conditions) : undefined;
  const db = getDb();

  const [allRows, countRows, wishRows, settingRows] = await Promise.all([
    db.select({ attendance: rsvps.attendance, guestCount: rsvps.guestCount }).from(guests).leftJoin(rsvps, eq(guests.id, rsvps.guestId)),
    db.select({ total: count() }).from(guests).leftJoin(rsvps, eq(guests.id, rsvps.guestId)).where(where),
    db.select({ id: wishes.id, name: guests.name, message: wishes.message, status: wishes.status }).from(wishes).innerJoin(guests, eq(wishes.guestId, guests.id)).orderBy(desc(wishes.createdAt)).limit(50),
    db.select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, WHATSAPP_TEMPLATE_KEY)).limit(1),
  ]);

  const filteredCount = countRows[0]?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const guestRows = await db
    .select({ id: guests.id, name: guests.name, phone: guests.phone, maxGuests: guests.maxGuests, active: guests.isActive, token: guests.invitationToken, attendance: rsvps.attendance, guestCount: rsvps.guestCount })
    .from(guests)
    .leftJoin(rsvps, eq(guests.id, rsvps.guestId))
    .where(where)
    .orderBy(desc(guests.createdAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  const attending = allRows.filter((row) => row.attendance === "attending");
  const declined = allRows.filter((row) => row.attendance === "not_attending");
  const waiting = allRows.filter((row) => !row.attendance);
  const headcount = attending.reduce((total, row) => total + (row.guestCount ?? 0), 0);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const whatsappTemplate = settingRows[0]?.value ?? DEFAULT_WHATSAPP_TEMPLATE;
  const tableRows: AdminGuestRow[] = guestRows.map((row) => {
    const url = invitationUrl(siteUrl, row.token);
    return { ...row, url, waUrl: whatsappUrl(row.phone, row.name, url, whatsappTemplate) };
  });
  const pageHref = (target: number) => `/admin?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(status !== "all" ? { status } : {}), page: String(target) })}`;

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div><p className="admin-kicker">Airlangga & Agata</p><h1>Guest dashboard</h1><p className="admin-header-note">Manage invitations, RSVP, and messages from one place.</p></div>
        <div className="admin-header-actions"><a href="/admin/export" className="admin-link">Export CSV</a><form action={logoutAdmin}><button className="admin-link">Sign out</button></form></div>
      </header>

      <section className="admin-stats">
        <article><span>Invited</span><strong>{allRows.length}</strong></article>
        <article><span>Attending</span><strong>{attending.length}</strong></article>
        <article><span>Headcount</span><strong>{headcount}</strong></article>
        <article><span>Declined</span><strong>{declined.length}</strong></article>
        <article><span>Waiting</span><strong>{waiting.length}</strong></article>
      </section>

      <AdminWhatsappTemplate initialTemplate={whatsappTemplate}/>

      <section className="admin-section">
        <div className="admin-section-title">
          <div><p className="eyebrow dark">Guest management</p><h2>Guest list</h2></div>
          <div className="admin-guest-tools"><AdminGuestForm/><AdminGuestImport/></div>
        </div>
        <form className="admin-filters">
          <input name="q" defaultValue={query} placeholder="Search name or WhatsApp…"/>
          <select name="status" defaultValue={status}><option value="all">All RSVP</option><option value="attending">Attending</option><option value="not_attending">Declined</option><option value="waiting">Waiting</option></select>
          <button className="admin-button">Apply</button>
          {(query || status !== "all") && <a href="/admin">Clear</a>}
        </form>
        <p className="admin-result-count">{filteredCount} guest{filteredCount === 1 ? "" : "s"} found</p>
        <AdminGuestTable rows={tableRows}/>
        {totalPages > 1 && <nav className="admin-pagination" aria-label="Guest pages"><a aria-disabled={page === 1} href={page > 1 ? pageHref(page - 1) : undefined}><ArrowLeft aria-hidden="true"/>Previous</a><span>Page {page} of {totalPages}</span><a aria-disabled={page === totalPages} href={page < totalPages ? pageHref(page + 1) : undefined}>Next<ArrowRight aria-hidden="true"/></a></nav>}
      </section>

      <section className="admin-section">
        <div className="admin-section-title"><div><p className="eyebrow dark">Moderation</p><h2>Wishes</h2></div></div>
        {wishRows.length ? <div className="admin-wishes">{wishRows.map((wish) => <article key={wish.id}><span className={`status ${wish.status}`}>{wish.status}</span><p>“{wish.message}”</p><strong>{wish.name}</strong><div><form action={moderateWish}><input type="hidden" name="id" value={wish.id}/><input type="hidden" name="status" value="approved"/><button className="admin-text-button">Approve</button></form><form action={moderateWish}><input type="hidden" name="id" value={wish.id}/><input type="hidden" name="status" value="hidden"/><button className="admin-text-button">Hide</button></form></div></article>)}</div> : <p className="admin-empty">No wishes yet. New messages will appear here for review.</p>}
      </section>
    </main>
  );
}
