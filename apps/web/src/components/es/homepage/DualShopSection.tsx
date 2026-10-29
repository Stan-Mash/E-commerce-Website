import Link from "next/link";

export function DualShopSection() {
  return (
    <section className="w-full grid grid-cols-1 md:grid-cols-2">
      {/* NEW COLLECTION panel */}
      <div
        className="relative overflow-hidden flex flex-col justify-end"
        style={{
          minHeight: 480,
          background: "linear-gradient(160deg, #f5f0eb 0%, #e8dfd4 100%)",
        }}
      >
        {/* Decorative line pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 p-10 md:p-14">
          <p className="text-[9px] tracking-[.5em] uppercase font-medium mb-4" style={{ color: "#8a7560" }}>
            Shop One
          </p>
          <h2
            className="text-[42px] md:text-[56px] leading-none font-semibold tracking-[-0.03em] mb-5 text-es-ink"
            style={{ fontFamily: "var(--font-bodoni), serif" }}
          >
            New<br />Collection
          </h2>
          <p className="font-sans text-[14px] text-es-char leading-relaxed mb-8 max-w-xs">
            Freshly curated styles for women, men, and children. New arrivals every week.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/woman"
              className="font-sans text-[11px] tracking-[.35em] uppercase font-medium bg-es-ink text-white px-6 py-3 no-underline hover:bg-opacity-80 transition-colors"
            >
              Women
            </Link>
            <Link
              href="/man"
              className="font-sans text-[11px] tracking-[.35em] uppercase font-medium border border-es-ink text-es-ink px-6 py-3 no-underline hover:bg-es-ink hover:text-white transition-colors"
            >
              Men
            </Link>
            <Link
              href="/children"
              className="font-sans text-[11px] tracking-[.35em] uppercase font-medium border border-es-ink text-es-ink px-6 py-3 no-underline hover:bg-es-ink hover:text-white transition-colors"
            >
              Children
            </Link>
          </div>
        </div>
      </div>

      {/* THRIFT STORE panel */}
      <div
        className="relative overflow-hidden flex flex-col justify-end"
        style={{
          minHeight: 480,
          background: "linear-gradient(160deg, #2c2416 0%, #4a3828 40%, #7a5c38 100%)",
        }}
      >
        {/* Subtle grain overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: "200px 200px",
          }}
        />

        {/* PRE-OWNED badge */}
        <div className="absolute top-8 right-8 z-10">
          <span
            className="font-sans text-[8px] tracking-[.42em] uppercase font-medium px-3 py-1.5 border"
            style={{ color: "#c9a961", borderColor: "rgba(201,169,97,.4)" }}
          >
            Pre-Owned
          </span>
        </div>

        {/* Content */}
        <div className="relative z-10 p-10 md:p-14">
          <p className="text-[9px] tracking-[.5em] uppercase font-medium mb-4" style={{ color: "#c9a961" }}>
            Shop Two
          </p>
          <h2
            className="text-[42px] md:text-[56px] leading-none font-semibold tracking-[-0.03em] mb-5 text-white"
            style={{ fontFamily: "var(--font-bodoni), serif" }}
          >
            Thrift<br />Store
          </h2>
          <p className="font-sans text-[14px] leading-relaxed mb-8 max-w-xs" style={{ color: "rgba(255,255,255,0.75)" }}>
            Quality pre-owned fashion at great prices. Browse by your size.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/thrifted/plus-size"
              className="font-sans text-[11px] tracking-[.35em] uppercase font-medium px-6 py-3 no-underline transition-colors"
              style={{ background: "#c9a961", color: "#1a1209" }}
            >
              Plus Size
            </Link>
            <Link
              href="/thrifted/standard"
              className="font-sans text-[11px] tracking-[.35em] uppercase font-medium px-6 py-3 no-underline transition-colors border"
              style={{ borderColor: "rgba(201,169,97,.5)", color: "#c9a961" }}
            >
              Standard
            </Link>
            <Link
              href="/thrifted"
              className="font-sans text-[11px] tracking-[.35em] uppercase font-medium px-6 py-3 no-underline transition-colors border"
              style={{ borderColor: "rgba(255,255,255,.25)", color: "rgba(255,255,255,.7)" }}
            >
              View All
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
