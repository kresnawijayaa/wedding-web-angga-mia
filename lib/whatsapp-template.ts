export const WHATSAPP_TEMPLATE_KEY = "whatsapp_invitation_template";

export const DEFAULT_WHATSAPP_TEMPLATE = `Halo {name},

Dengan penuh sukacita, kami mengundang Anda untuk hadir dan merayakan hari pernikahan kami.

Silakan buka undangan personal Anda melalui tautan berikut:
{link}

Kami menantikan kehadiran Anda.

Airlangga & Mia`;

export function renderWhatsappTemplate(template: string, name: string, link: string) {
  return template.replaceAll("{name}", name).replaceAll("{link}", link);
}
