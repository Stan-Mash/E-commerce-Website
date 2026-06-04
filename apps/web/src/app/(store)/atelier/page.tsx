import type { Metadata } from "next";

export const metadata: Metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6"
        style={{ height: "60vh", background: "var(--es-ink)", color: "#ffffff" }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at 50% 30%, rgba(201,169,97,0.12) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />
        <p className="mb-6 text-[11px] tracking-[.48em] uppercase" style={{ color: "#c9a961" }}>
          ELITE STYLE CO.
        </p>
        <h1
          className="mb-5 text-5xl sm:text-7xl font-bold leading-none"
          style={{ fontFamily: "var(--font-bodoni)" }}
        >
          About Us
        </h1>
        <p
          className="text-xl sm:text-2xl max-w-xl"
          style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", opacity: 0.85 }}
        >
          Nairobi&apos;s home for curated international fashion.
        </p>
      </section>

      {/* Story section */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-[800px] px-6 py-16 sm:px-16 sm:py-24">
          <p
            className="mb-4 text-[11px] tracking-[.48em] uppercase text-es-gold"
          >
            OUR STORY
          </p>
          <h2
            className="mb-8 text-3xl sm:text-5xl font-bold leading-tight text-es-ink"
            style={{ fontFamily: "var(--font-bodoni)" }}
          >
            Great fashion, brought to Nairobi.
          </h2>
          <div className="space-y-5 text-[15px] leading-relaxed text-es-mute">
            <p>
              Elite Style Co. was born from a simple idea: Nairobi deserves access to the same
              quality fashion that people in London, Dubai, and Shanghai take for granted — at
              prices that make sense in Kenya.
            </p>
            <p>
              We source our pieces from carefully vetted suppliers around the world, selecting
              styles that work for the Nairobi lifestyle — the office, the weekend, the school
              run, the event. Everything is priced in Kenyan shillings, with no hidden forex
              fees or import surprises.
            </p>
            <p>
              We are not manufacturers. We are curators. Our job is to find great clothes, bring
              them to you, and make the whole experience — from browsing to delivery — as smooth
              as possible.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-es-paper">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-16 sm:px-16 sm:py-24">
          <p className="mb-4 text-[11px] tracking-[.48em] uppercase text-es-gold text-center">
            HOW IT WORKS
          </p>
          <h2
            className="mb-14 text-3xl sm:text-5xl font-bold leading-tight text-es-ink text-center"
            style={{ fontFamily: "var(--font-bodoni)" }}
          >
            Simple. Fast. Yours.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8">
            {[
              {
                numeral: "01",
                label: "BROWSE & ADD TO BAG",
                description:
                  "Shop woman, man, and children across our curated edit. Filter by size, category, and price. Add your favourites to your bag.",
              },
              {
                numeral: "02",
                label: "PAY WITH M-PESA",
                description:
                  "At checkout, enter your Safaricom number. You'll get an M-Pesa push in seconds. Confirm your PIN — payment done. No card needed.",
              },
              {
                numeral: "03",
                label: "WE DELIVER TO YOU",
                description:
                  "Your order is packed and dispatched. Free delivery within Nairobi CBD, low flat rate countrywide. Track your order and receive it at your door.",
              },
            ].map((step) => (
              <div key={step.numeral} className="flex flex-col">
                <span
                  className="mb-4 text-6xl font-bold leading-none"
                  style={{ fontFamily: "var(--font-bodoni)", color: "#c9a961" }}
                >
                  {step.numeral}
                </span>
                <p className="mb-4 text-[11px] tracking-[.48em] uppercase" style={{ color: "#0a0a0a" }}>
                  {step.label}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#717171" }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-16 sm:px-16 sm:py-24 flex flex-col items-center text-center">
          <p className="mb-4 text-[11px] tracking-[.48em] uppercase text-es-gold">
            START SHOPPING
          </p>
          <h2
            className="mb-8 text-3xl sm:text-5xl font-bold leading-tight text-es-ink"
            style={{ fontFamily: "var(--font-bodoni)" }}
          >
            Find your next favourite outfit.
          </h2>
          <a href="/products" className="es-btn-plum px-10 py-4 text-[11px] tracking-[.38em] uppercase">
            Shop Now
          </a>
          <p className="mt-10 text-[11px] tracking-[.32em] uppercase text-es-mute">
            Questions? Reach us on WhatsApp or at hello@elitestyle.co.ke
          </p>
        </div>
      </section>
    </main>
  );
}
