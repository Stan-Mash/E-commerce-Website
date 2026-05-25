export function MpesaMoment() {
  const steps = [
    { n: "01", label: "Enter your number",   detail: "Type your Safaricom number at checkout — no card details, no account needed." },
    { n: "02", label: "M-Pesa push arrives", detail: "A prompt lands on your phone within seconds. The amount is pre-filled." },
    { n: "03", label: "Confirm with PIN",    detail: "Enter your M-Pesa PIN. Payment clears instantly. Your order is confirmed." },
  ];

  return (
    <section
      style={{
        background: "#3d1a4a",
        color: "#ffffff",
        padding: "120px 64px",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 96,
          alignItems: "center",
        }}
        className="!grid-cols-1 lg:!grid-cols-2"
      >
        {/* Left — headline */}
        <div>
          <div
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 11,
              letterSpacing: ".45em",
              color: "#c9a961",
              textTransform: "uppercase",
              marginBottom: 24,
            }}
          >
            SEAMLESS CHECKOUT&nbsp;·&nbsp;KENYA'S PREFERRED PAYMENT
          </div>

          <h2
            style={{
              fontFamily: "var(--font-inter), 'Inter', sans-serif",
              fontSize: "clamp(40px, 5.5vw, 64px)",
              fontWeight: 900,
              lineHeight: 1.0,
              letterSpacing: "-.04em",
              margin: "0 0 32px",
            }}
          >
            Tap once.
            <br />
            <span style={{ color: "#c9a961" }}>Your order is placed.</span>
          </h2>

          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 16,
              lineHeight: 1.65,
              color: "rgba(255,255,255,.65)",
              maxWidth: 440,
              marginBottom: 40,
            }}
          >
            No credit card. No foreign gateway fees. Your Safaricom number is
            all you need — the same way Kenyans have paid for everything
            for fifteen years.
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              border: "1px solid rgba(201,169,97,.4)",
              padding: "10px 20px",
            }}
          >
            <svg width="28" height="18" viewBox="0 0 28 18" fill="none" aria-hidden>
              <rect width="28" height="18" rx="2" fill="#00A550" />
              <text x="14" y="12" textAnchor="middle" fill="#fff"
                style={{ font: "bold 6px sans-serif", letterSpacing: 0.5 }}>
                M-PESA
              </text>
            </svg>
            <span
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: 11,
                letterSpacing: ".28em",
                color: "rgba(255,255,255,.7)",
                textTransform: "uppercase",
              }}
            >
              Accepted at checkout
            </span>
          </div>
        </div>

        {/* Right — 3 steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {steps.map((s, i) => (
            <div
              key={s.n}
              style={{
                display: "grid",
                gridTemplateColumns: "56px 1fr",
                gap: 24,
                paddingTop: i === 0 ? 0 : 40,
                paddingBottom: 40,
                borderBottom: i < steps.length - 1 ? "1px solid rgba(255,255,255,.10)" : "none",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-inter), 'Inter', sans-serif",
                  fontSize: 28,
                  fontWeight: 900,
                  color: "rgba(201,169,97,.3)",
                  lineHeight: 1,
                  paddingTop: 2,
                  letterSpacing: "-0.03em",
                }}
              >
                {s.n}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    color: "#ffffff",
                    marginBottom: 8,
                  }}
                >
                  {s.label}
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "rgba(255,255,255,.55)",
                    margin: 0,
                  }}
                >
                  {s.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
