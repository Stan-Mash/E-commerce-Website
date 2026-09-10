import Link from "next/link";

/**
 * Root 404, used for URLs that match no route at all (mistyped links, dead
 * inbound links, stale search-engine results).
 *
 * `(store)/not-found.tsx` only covers not-found calls raised inside that route
 * group, so without this file those unmatched URLs fell through to Next's
 * unstyled default "404: This page could not be found." page.
 *
 * This renders outside the store layout, so it carries its own header and
 * footer links rather than inheriting the site chrome.
 */
export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "80px 24px",
        background: "var(--es-white, #ffffff)",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          fontSize: 11,
          letterSpacing: "0.48em",
          textTransform: "uppercase",
          color: "var(--es-champagne, #8c715d)",
          marginBottom: 24,
        }}
      >
        Elite Style Co.
      </p>

      <h1
        style={{
          fontFamily: "var(--font-cormorant), Georgia, serif",
          fontSize: "clamp(32px, 5vw, 52px)",
          fontWeight: 600,
          lineHeight: 1.1,
          color: "var(--es-ink, #0d0d0d)",
          marginBottom: 16,
        }}
      >
        Page not found
      </h1>

      <p
        style={{
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          fontSize: 15,
          lineHeight: 1.7,
          color: "var(--es-mute, #6b6b6b)",
          maxWidth: 460,
          marginBottom: 40,
        }}
      >
        This page may have moved, sold out, or never existed. The collection is
        still here.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            fontSize: 12,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            background: "var(--es-ink, #0d0d0d)",
            color: "#ffffff",
            padding: "16px 32px",
            textDecoration: "none",
          }}
        >
          Back to home
        </Link>
        <Link
          href="/products"
          style={{
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            fontSize: 12,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            border: "1px solid var(--es-ink, #0d0d0d)",
            color: "var(--es-ink, #0d0d0d)",
            padding: "16px 32px",
            textDecoration: "none",
          }}
        >
          Shop all
        </Link>
      </div>
    </main>
  );
}
