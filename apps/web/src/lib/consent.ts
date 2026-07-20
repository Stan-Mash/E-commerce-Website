// Shared cookie-consent state for CookieConsent.tsx (the banner) and
// AnalyticsScripts.tsx (the pixel loaders it gates). Decline-by-default:
// tracking scripts only render once the user explicitly grants consent.

export const CONSENT_KEY = "es_cookie_consent_v1";
export const CONSENT_EVENT = "es-consent-changed";

export type ConsentState = "granted" | "denied" | null;

export function readConsent(): ConsentState {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (raw === "granted" || raw === "denied") return raw;
    return null;
  } catch {
    return null;
  }
}

export function writeConsent(state: "granted" | "denied") {
  try {
    localStorage.setItem(CONSENT_KEY, state);
  } catch {
    // ignore — banner just won't remember the choice
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: state }));
}
