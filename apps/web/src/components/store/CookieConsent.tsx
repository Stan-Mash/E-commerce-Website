"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readConsent, writeConsent } from "@/lib/consent";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // readConsent() is a client-only read of localStorage/cookies — it can't
    // run during render (would break SSR), so it has to stay in an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only read of persisted consent state, not derivable during render
    if (readConsent() === null) setShow(true);
  }, []);

  function choose(state: "granted" | "denied") {
    writeConsent(state);
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        background: "var(--es-ink, #1a1a1a)",
        color: "#fff",
        padding: "16px 20px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        fontFamily: "var(--font-inter)",
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      <p style={{ margin: 0, maxWidth: 640 }}>
        We use essential cookies and local storage to run the shop (your bag, wishlist). With your
        permission we&apos;d also like to use analytics cookies to improve it. See our{" "}
        <Link href="/legal" style={{ color: "#c9a961", textDecoration: "underline" }}>
          Privacy &amp; Cookie Policy
        </Link>
        .
      </p>
      <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
        <button
          onClick={() => choose("denied")}
          style={{
            background: "none",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.4)",
            padding: "10px 20px",
            fontSize: 11,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Decline
        </button>
        <button
          onClick={() => choose("granted")}
          style={{
            background: "#fff",
            color: "#1a1a1a",
            border: "none",
            padding: "10px 24px",
            fontSize: 11,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
