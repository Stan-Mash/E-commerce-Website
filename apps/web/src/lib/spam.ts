// Honeypot spam protection for public forms.
//
// A field that is hidden from humans (off-screen, aria-hidden, tabindex -1) but
// present in the DOM. Real users never fill it; naive bots that fill every input
// do. Chosen name is a common bot magnet and is never a real field on this site.
//
// Detection is silent: the caller returns the same success shape it would for a
// real submission, so a bot gets no signal that it was rejected. Nothing is
// written to the database and no email is sent.
export const HONEYPOT_FIELD = "website";

export function isHoneypotTripped(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const value = (body as Record<string, unknown>)[HONEYPOT_FIELD];
  return typeof value === "string" && value.trim().length > 0;
}
