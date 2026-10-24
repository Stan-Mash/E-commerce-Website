import Link from "next/link";

export function StyleFinderBanner() {
  return (
    <section className="bg-es-ink text-white">
      <div className="mx-auto max-w-[1200px] px-6 sm:px-16 py-16 sm:py-20 flex flex-col sm:flex-row items-center justify-between gap-8">
        {/* Copy */}
        <div className="text-center sm:text-left">
          <p className="text-[11px] tracking-[.48em] uppercase mb-3" style={{ color: "#c9a961" }}>
            PERSONAL STYLING
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold leading-tight mb-3"
            style={{ fontFamily: "var(--font-bodoni)" }}
          >
            Not sure what to wear?
          </h2>
          <p className="text-sm text-white/60 max-w-sm leading-relaxed">
            Answer three questions — occasion, budget, who it's for — and we'll
            pull the right pieces from our edit.
          </p>
        </div>

        {/* Steps preview + CTA */}
        <div className="flex flex-col items-center sm:items-end gap-6 shrink-0">
          <div className="flex gap-6 text-center">
            {[
              { n: "01", label: "Who" },
              { n: "02", label: "Occasion" },
              { n: "03", label: "Budget" },
            ].map((s) => (
              <div key={s.n} className="flex flex-col items-center gap-1">
                <span className="text-[11px] tracking-[.3em] uppercase" style={{ color: "#c9a961" }}>
                  {s.n}
                </span>
                <span className="text-[12px] tracking-[.15em] uppercase text-white/70">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          <Link
            href="/style-finder"
            className="inline-block px-10 py-3.5 bg-white text-es-ink text-[11px] font-semibold tracking-[.35em] uppercase hover:bg-es-bone transition-colors duration-150"
          >
            Find My Style
          </Link>
        </div>
      </div>
    </section>
  );
}
