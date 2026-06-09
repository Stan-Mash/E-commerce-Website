"use client";

import Link from "next/link";

const CATS = [
  { label: "Women",    sub: "Current edit",  href: "/woman" },
  { label: "Men",      sub: "Sharp looks",   href: "/man" },
  { label: "Children", sub: "Mini style",    href: "/children" },
  { label: "New In",   sub: "Just landed",   href: "/products" },
] as const;

interface HeroProps {
  productCount?: number;
}

export function Hero({ productCount }: HeroProps = {}) {
  const stylesValue =
    productCount && productCount >= 10
      ? `${Math.floor(productCount / 10) * 10}+`
      : productCount && productCount > 0
        ? `${productCount}`
        : "New";

  return (
    <section>
      <style>{`
        @keyframes kenburns {
          from { transform: scale(1); }
          to   { transform: scale(1.05); }
        }
        .hero-img      { animation: kenburns 18s ease-in-out infinite alternate; }
        .hero-headline { animation: _fadeup 0.8s cubic-bezier(0.22,1,0.36,1) 0.10s both; }
        .hero-sub      { animation: _fadeup 0.8s cubic-bezier(0.22,1,0.36,1) 0.28s both; }
        .hero-cta      { animation: _fadeup 0.8s cubic-bezier(0.22,1,0.36,1) 0.46s both; }
        .hero-stats    { animation: _fadeup 0.8s cubic-bezier(0.22,1,0.36,1) 0.62s both; }
        @keyframes _fadeup {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Split layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[88vh]">

        {/* Image panel */}
        <div className="relative overflow-hidden bg-es-bone order-first min-h-[60vw] md:min-h-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/products/tweed-set-black-white.jpg"
            alt="New season — Tweed Jacket & Skirt Set"
            className="hero-img absolute inset-0 w-full h-full object-cover object-top"
          />

          <div className="absolute top-5 left-5 bg-es-ink text-white px-4 py-[7px] text-[10px] font-semibold tracking-label uppercase font-sans">
            New Season 2026
          </div>

          <div className="absolute bottom-5 right-5 bg-white/95 backdrop-blur-sm px-5 py-3 border border-es-hair">
            <p className="text-[10px] font-medium tracking-label uppercase text-es-mute mb-0.5 font-sans">
              Complimentary delivery
            </p>
            <p className="text-[13px] font-bold text-es-ink font-sans">
              Within Nairobi CBD
            </p>
          </div>
        </div>

        {/* Text panel */}
        <div className="flex flex-col justify-center px-8 py-16 md:px-16 md:py-24 bg-white">

          <span className="hero-headline text-[11px] font-semibold tracking-label uppercase text-es-champagne mb-6 block font-sans">
            Elite Style Co. · Nairobi
          </span>

          <h1
            className="hero-headline font-cormorant font-semibold text-es-ink mb-6"
            style={{
              fontSize: "clamp(48px, 5.5vw, 80px)",
              lineHeight: 0.96,
              letterSpacing: "-0.025em",
            }}
          >
            Dressed<br />for every<br />moment.
          </h1>

          <p className="hero-sub font-sans text-[15px] text-es-mute leading-relaxed max-w-sm mb-10">
            Curated fashion for the whole family — KES pricing,
            M-Pesa &amp; card checkout, free delivery within Nairobi CBD.
          </p>

          <div className="hero-cta flex flex-wrap gap-3">
            <Link href="/products" className="es-btn-plum min-w-[176px]">
              Explore New Arrivals
            </Link>
            <Link href="/woman" className="es-btn-outline-ink min-w-[160px]">
              Women&apos;s Edit
            </Link>
          </div>

          <div className="hero-stats flex gap-8 mt-12 pt-8 border-t border-es-hair">
            {[
              { num: stylesValue, label: "Styles available" },
              { num: "CBD",       label: "Free delivery zone" },
              { num: "M-Pesa",    label: "Accepted" },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-cormorant text-2xl font-semibold text-es-ink leading-none mb-1">
                  {s.num}
                </p>
                <p className="text-[11px] text-es-mute tracking-wide font-sans">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-t border-b border-es-hair bg-white">
        {CATS.map((cat, i) => (
          <Link
            key={cat.label}
            href={cat.href}
            className={[
              "group flex items-center justify-between px-6 py-5",
              "hover:bg-es-paper transition-colors duration-150",
              i < CATS.length - 1 ? "border-r border-es-hair" : "",
            ].join(" ")}
          >
            <div>
              <p className="text-[10px] font-semibold tracking-label uppercase text-es-faint mb-1 font-sans">
                {cat.sub}
              </p>
              <p className="text-[15px] font-semibold text-es-ink group-hover:text-es-champagne-dk transition-colors duration-150 font-sans">
                {cat.label}
              </p>
            </div>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="text-es-faint group-hover:text-es-champagne transition-colors duration-150 group-hover:translate-x-1 translate-x-0 duration-200"
            >
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        ))}
      </div>
    </section>
  );
}
