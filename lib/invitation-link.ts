import { randomInt } from "node:crypto";
import { DEFAULT_WHATSAPP_TEMPLATE, renderWhatsappTemplate } from "@/lib/whatsapp-template";

export function createInvitationCode() {
  const suffix = Array.from({ length: 6 }, () => String.fromCharCode(97 + randomInt(0, 26))).join("");
  return suffix;
}

export function invitationUrl(siteUrl: string, code: string) {
  const path = /^[a-z]{6}$/.test(code) ? code : `i/${code}`;
  return `${siteUrl.replace(/\/$/, "")}/${path}`;
}

export function whatsappUrl(phone: string, name: string, url: string, template = DEFAULT_WHATSAPP_TEMPLATE) {
  const number = phone.replace(/\D/g, "");
  const message = renderWhatsappTemplate(template, name, url);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
