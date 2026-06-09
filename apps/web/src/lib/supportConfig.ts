// Support/contact config from env vars (set in .env / Vercel).
// Defaults are placeholders for local dev/demo only.

export const SUPPORT_PHONE =
  process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "+254 700 000 000";

export const SUPPORT_WHATSAPP_LINK =
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ??
  `https://wa.me/${(SUPPORT_PHONE).replace(/[^0-9]/g, "")}`;

export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "hello@elitestyle.co.ke";
