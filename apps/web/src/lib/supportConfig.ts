// Strip BOM (﻿) and any non-ASCII chars that cause React to sanitize
// tel:/wa.me hrefs into "about:invalid#zCSafez".
function sanitizePhone(raw: string): string {
  return raw.replace(/[^\x20-\x7E]/g, "").trim();
}

// Hardcoded — do NOT read from NEXT_PUBLIC_SUPPORT_EMAIL env var because that
// Vercel variable was set to the old Gmail address and overrides the fallback.
export const SUPPORT_EMAIL = "support@elitestyle.co.ke";

const rawPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "+254 142 424 802";
export const SUPPORT_PHONE = sanitizePhone(rawPhone);

export const SUPPORT_WHATSAPP_LINK =
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ??
  `https://wa.me/${SUPPORT_PHONE.replace(/[^0-9]/g, "")}`;
