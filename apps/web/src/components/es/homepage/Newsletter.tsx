"use client";

import { useState } from "react";

const FONT = "'Inter','Urbanist',sans-serif";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  }

  return (
    <section style={{ background: "#111", padding: "96px 40px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>

        <p style={{
          fontFamily: FONT, fontSize: 11, fontWeight: 700,
          color: "#c9a961", textTransform: "uppercase",
          letterSpacing: "0.2em", margin: "0 0 20px",
        }}>
          Stay in the loop
        </p>

        <h2 style={{
          fontFamily: FONT,
          fontSize: "clamp(28px, 4vw, 42px)",
          fontWeight: 900,
          color: "#fff",
          letterSpacing: "-0.03em",
          margin: "0 0 16px",
          lineHeight: 1.1,
        }}>
          New arrivals. First access. No spam.
        </h2>

        <p style={{
          fontFamily: FONT,
          fontSize: 15,
          color: "rgba(255,255,255,0.55)",
          maxWidth: 480,
          margin: "0 auto 40px",
          lineHeight: 1.65,
        }}>
          Join 5,000+ Kenyans who get first access to new drops, private sales,
          and styling tips every week.
        </p>

        {submitted ? (
          <div style={{
            background: "rgba(201,169,97,0.12)",
            border: "1px solid rgba(201,169,97,0.3)",
            padding: "20px 32px",
            display: "inline-block",
          }}>
            <p style={{
              fontFamily: FONT, fontSize: 14, fontWeight: 600,
              color: "#c9a961", margin: 0,
            }}>
              You&apos;re on the list. Watch your inbox.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              maxWidth: 480,
              margin: "0 auto",
            }}
          >
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                flex: 1,
                padding: "16px 20px",
                fontFamily: FONT,
                fontSize: 13,
                letterSpacing: "0.02em",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRight: "none",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "16px 28px",
                background: "#c9a961",
                color: "#111",
                fontFamily: FONT,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Subscribe
            </button>
          </form>
        )}

        <p style={{
          fontFamily: FONT, fontSize: 10, color: "rgba(255,255,255,0.25)",
          marginTop: 20, letterSpacing: "0.1em", textTransform: "uppercase",
        }}>
          Unsubscribe any time · No card required
        </p>
      </div>
    </section>
  );
}
