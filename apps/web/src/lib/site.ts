// Canonical site origin, shared by metadata, JSON-LD, robots.ts, and sitemap.ts
// so every URL the site emits points at the same deployed origin. Swapping the
// custom domain in later only requires updating NEXT_PUBLIC_SITE_URL.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://e-commerce-website-web.vercel.app";

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

// JSON.stringify doesn't escape "<", so a stored value containing
// "</script><script>..." could break out of a JSON-LD <script> block when
// injected via dangerouslySetInnerHTML. Escape it to a JSON-safe unicode
// sequence that parses back to the same string.
export function jsonLdString(schema: unknown): string {
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}
