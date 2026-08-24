"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24, margin: 0 }}>
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: "#666", marginBottom: 20 }}>Please refresh the page or try again shortly.</p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error replaces
              the root layout entirely; router context (and Link) may not be functional here. */}
          <a href="/" style={{ display: "inline-block", padding: "10px 24px", border: "1px solid #1a1a1a", color: "#1a1a1a", textDecoration: "none", letterSpacing: "0.2em", textTransform: "uppercase", fontSize: 12 }}>
            Back to home
          </a>
        </div>
      </body>
    </html>
  );
}
