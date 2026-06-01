"use client";

import { useState } from "react";
import { AnimateIn } from "@/components/es/AnimateIn";

const FONT = "'Inter','Urbanist',sans-serif";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.ok) {
        setSubmitted(true);
      } else {
        setError(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ background: "#111", padding: "96px 40px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
        <AnimateIn direction="up">

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
                Thank you! You&apos;re on the list.
              </p>
            </div>
          ) : (
            <>
              <form
                onSubmit={handleSubmit}
                style={{
                  display: "flex",
                  maxWidth: 480,
                  margin: "0 auto",
                  opacity: loading ? 0.7 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
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
                  disabled={loading}
                  style={{
                    padding: "16px 28px",
                    background: loading ? "#a88a48" : "#c9a961",
                    color: "#111",
                    fontFamily: FONT,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                    transition: "background 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{
                        width: 12,
                        height: 12,
                        border: "2px solid #111",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "newsletter-spin 0.7s linear infinite",
                      }} />
                      <style>{`@keyframes newsletter-spin { to { transform: rotate(360deg); } }`}</style>
                      Sending
                    </>
                  ) : (
                    "Subscribe"
                  )}
                </button>
              </form>

              {error && (
                <p style={{
                  fontFamily: FONT,
                  fontSize: 12,
                  color: "#e63946",
                  marginTop: 12,
                  letterSpacing: "0.02em",
                }}>
                  {error}
                </p>
              )}
            </>
          )}

          <p style={{
            fontFamily: FONT, fontSize: 10, color: "rgba(255,255,255,0.25)",
            marginTop: 20, letterSpacing: "0.1em", textTransform: "uppercase",
          }}>
            Unsubscribe any time · No card required
          </p>

        </AnimateIn>
      </div>
    </section>
  );
}
