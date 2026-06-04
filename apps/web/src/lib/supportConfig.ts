/**
 * Central support/contact configuration.
 * Values are read from environment variables so they can be changed without
 * code deployments. Set these in your .env / Vercel project settings.
 *
 * Required for a real storefront — leave the defaults only for local dev/demo.
 */

export const SUPPORT_PHONE =
  process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "+254 700 000 000";

export const SUPPORT_WHATSAPP_LINK =
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ??
  `https://wa.me/${(SUPPORT_PHONE).replace(/[^0-9]/g, "")}`;

export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "hello@elitestyle.co.ke";
