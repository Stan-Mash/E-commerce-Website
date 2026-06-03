const steps = [
  { n: "01", label: "Enter your number",   detail: "Type your Safaricom number at checkout — no card details, no account needed." },
  { n: "02", label: "M-Pesa push arrives", detail: "A prompt lands on your phone within seconds. The amount is pre-filled." },
  { n: "03", label: "Confirm with PIN",    detail: "Enter your M-Pesa PIN. Payment clears instantly. Your order is confirmed." },
];

export function MpesaMoment() {
  return (
    <section className="bg-es-ink text-white px-8 md:px-16 py-24 md:py-32">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

        {/* Left — headline */}
        <div>
          <p className="font-sans text-[11px] tracking-label uppercase text-es-champagne mb-6">
            Seamless Checkout · Kenya&apos;s Preferred Payment
          </p>

          <h2 className="font-cormorant font-semibold text-white mb-8" style={{ fontSize: "clamp(40px, 5.5vw, 64px)", lineHeight: 1.0, letterSpacing: "-0.025em" }}>
            Tap once.<br />
            <span className="text-es-champagne italic">Your order is placed.</span>
          </h2>

          <p className="font-sans text-[16px] leading-relaxed text-white/60 max-w-[440px] mb-10">
            No credit card. No foreign gateway fees. Your Safaricom number is
            all you need — the same way Kenyans have paid for everything
            for fifteen years.
          </p>

          <div className="inline-flex items-center gap-2.5 border border-es-champagne/30 px-5 py-2.5">
            <svg width="28" height="18" viewBox="0 0 28 18" fill="none" aria-hidden>
              <rect width="28" height="18" rx="2" fill="#00A550" />
              <text x="14" y="12" textAnchor="middle" fill="#fff"
                style={{ font: "bold 6px sans-serif", letterSpacing: 0.5 }}>
                M-PESA
              </text>
            </svg>
            <span className="font-sans text-[11px] tracking-wide uppercase text-white/60">
              Accepted at checkout
            </span>
          </div>
        </div>

        {/* Right — 3 steps */}
        <div className="flex flex-col">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className={[
                "grid gap-6 py-10",
                i === 0 ? "pt-0" : "",
                i < steps.length - 1 ? "border-b border-white/10" : "",
              ].join(" ")}
              style={{ gridTemplateColumns: "56px 1fr" }}
            >
              <span className="font-cormorant text-[28px] font-light text-es-champagne/30 leading-none pt-0.5">
                {s.n}
              </span>
              <div>
                <p className="font-sans text-[13px] font-semibold tracking-label uppercase text-white mb-2">
                  {s.label}
                </p>
                <p className="font-sans text-[14px] leading-relaxed text-white/55 m-0">
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
