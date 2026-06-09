"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "es_cookie_consent_v1";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      // localStorage unavailable — don't block the page
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(KEY, new Date().toISOString());
    } catch {
      // ignore
    }
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
        We use essential cookies and local storage to run the shop (your bag, wishlist) and a little analytics to improve it. See our{" "}
        <Link href="/legal" style={{ color: "#c9a961", textDecoration: "underline" }}>
          Privacy &amp; Cookie Policy
        </Link>
        .
      </p>
      <button
        onClick={accept}
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
        Got it
      </button>
    </div>
  );
}
