"use client";

import { useState } from "react";
import { GoldCrown } from "@/components/es/GoldCrown";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  }

  return (
    <section style={{ background: "#f6f5f2", padding: "96px 64px", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <GoldCrown size={32} />
      </div>

      <h2
        style={{
          fontFamily: "var(--font-bodoni), Georgia, serif",
          fontOpticalSizing: "auto",
          fontSize: "clamp(32px, 4vw, 48px)",
          fontWeight: 700,
          color: "#0a0a0a",
          letterSpacing: "-.025em",
          margin: "20px auto 12px",
          maxWidth: 720,
          lineHeight: 1.1,
        }}
      >
        The next chapter, addressed to you.
      </h2>

      <p
        style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: 16,
          color: "#717171",
          maxWidth: 520,
          margin: "0 auto 36px",
          lineHeight: 1.6,
        }}
      >
        Receive seasonal lookbooks, atelier invitations, and the occasional
        private sale. Never anything else.
      </p>

      {submitted ? (
        <p
          style={{
            fontFamily: "var(--font-bodoni), Georgia, serif",
            fontSize: 18,
            fontStyle: "italic",
            color: "#3d1a4a",
          }}
        >
          Thank you. Your first chapter arrives soon.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            justifyContent: "center",
            maxWidth: 520,
            margin: "0 auto",
          }}
        >
          <input
            type="email"
            placeholder="your address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              flex: 1,
              padding: "18px 20px",
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 12,
              letterSpacing: ".18em",
              border: "1px solid #0a0a0a",
              borderRight: "none",
              background: "#ffffff",
              outline: "none",
            }}
          />
          <button type="submit" className="es-btn-plum">
            SUBSCRIBE
          </button>
        </form>
      )}

      <div
        style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: 10,
          letterSpacing: ".34em",
          color: "#a8a8a8",
          marginTop: 22,
          textTransform: "uppercase",
        }}
      >
        BY SUBSCRIBING YOU AGREE TO OUR PRIVACY POLICY
      </div>
    </section>
  );
}
