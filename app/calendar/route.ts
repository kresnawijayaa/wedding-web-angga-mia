const calendar = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "PRODID:-//Together Forever//Airlangga and Agata//ID",
  "CALSCALE:GREGORIAN",
  "METHOD:PUBLISH",
  "BEGIN:VEVENT",
  "UID:airlangga-agata-20261227@togetherforever.id",
  "DTSTAMP:20260911T000000Z",
  "DTSTART;TZID=Asia/Jakarta:20261227T100000",
  "DTEND;TZID=Asia/Jakarta:20261227T153000",
  "SUMMARY:Wedding of Airlangga & Agata",
  "DESCRIPTION:Holy Matrimony pukul 10.00–12.00 WIB dan resepsi pukul 13.30–15.30 WIB.",
  "LOCATION:Gereja Katolik St. Antonius Padua, Muntilan",
  "BEGIN:VALARM",
  "TRIGGER:-P1D",
  "ACTION:DISPLAY",
  "DESCRIPTION:Wedding of Airlangga & Agata tomorrow",
  "END:VALARM",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

export function GET() {
  return new Response(calendar, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": "attachment; filename=airlangga-agata-wedding.ics", "Cache-Control": "public, max-age=86400" } });
}
