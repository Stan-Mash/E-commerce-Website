import type { Metadata } from "next";
import { SUPPORT_PHONE, SUPPORT_WHATSAPP_LINK } from "@/lib/supportConfig";
import ReturnRequestForm from "@/components/store/ReturnRequestForm";

export const metadata: Metadata = {
  title: "Returns & Exchanges",
};

const STEPS = [
  {
    num: "01",
    heading: "WhatsApp us",
    body: `Message us on WhatsApp (${SUPPORT_PHONE}) with your order reference and reason for return. Say "I want to return order NF-XXXX".`,
  },
  {
    num: "02",
    heading: "Receive your return code",
    body: "We will send you a unique return authorisation code within a few hours. Please include this code on your parcel.",
  },
  {
    num: "03",
    heading: "Drop off or we collect",
    body: "Drop your parcel at our Westlands location, or arrange a collection for a small fee of KES 200 within Nairobi.",
  },
  {
    num: "04",
    heading: "Refund in 3–5 days",
    body: "Once we receive and inspect your item, your refund will be processed within 3–5 business days.",
  },
] as const;

const CAN_RETURN = [
  "Items in unworn, original condition",
  "Items with all original tags still attached",
  "Items in their original packaging or bag",
  "Items returned within 14 days of delivery",
];

const CANNOT_RETURN = [
  "Intimate apparel (underwear, swimwear, socks) for hygiene reasons",
  "Items purchased in a sale or with a promotional discount",
  "Customised or personalised items",
  "Items showing signs of wear, washing, or damage",
  "Items without original tags or packaging",
];

export default function ReturnsPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6"
        style={{ height: "44vh", background: "var(--es-ink)", color: "#ffffff" }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(201,169,97,0.12) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />
        <p
          className="mb-6 text-[11px] tracking-[.48em] uppercase"
          style={{ color: "#c9a961" }}
        >
          Customer Care
        </p>
        <h1
          className="text-5xl sm:text-7xl font-bold leading-none"
          style={{ fontFamily: "var(--font-bodoni)" }}
        >
          Returns &amp; Exchanges
        </h1>
        <p
          className="mt-6 text-lg sm:text-xl max-w-lg"
          style={{ fontFamily: "var(--font-inter)", opacity: 0.8 }}
        >
          Simple, hassle-free returns within 14 days.
        </p>
      </section>

      {/* Our Promise */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-[800px] px-6 py-16 sm:px-16 sm:py-24">
          <p className="mb-4 text-[11px] tracking-[.48em] uppercase text-es-gold">
            Our Promise
          </p>
          <h2
            className="mb-8 text-3xl sm:text-5xl font-bold leading-tight text-es-ink"
            style={{ fontFamily: "var(--font-bodoni)" }}
          >
            14-day returns, no drama.
          </h2>
          <div className="space-y-5 text-[15px] leading-relaxed text-es-mute">
            <p>
              We want you to love every piece you buy from Elite Style Co. If something
              doesn&apos;t work — the fit, the colour, a change of mind — we make
              returning it straightforward.
            </p>
            <p>
              You have <strong className="text-es-ink">14 days from the date of delivery</strong>{" "}
              to initiate a return. All eligible items will be refunded to your
              M-Pesa in full, with no restocking fees.
            </p>
          </div>
        </div>
      </section>

      {/* What can / cannot be returned */}
      <section style={{ background: "#f7f7f7" }}>
        <div className="mx-auto w-full max-w-[1200px] px-6 py-16 sm:px-16 sm:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
            {/* Can return */}
            <div>
              <p className="mb-4 text-[11px] tracking-[.48em] uppercase text-es-gold">
                Accepted
              </p>
              <h3
                className="mb-8 text-2xl sm:text-3xl font-bold text-es-ink leading-tight"
                style={{ fontFamily: "var(--font-bodoni)" }}
              >
                What can be returned
              </h3>
              <ul className="flex flex-col gap-4">
                {CAN_RETURN.map((item) => (
                  <li key={item} className="flex gap-3 items-start">
                    <span
                      className="mt-0.5 flex-shrink-0 w-5 h-5 flex items-center justify-center"
                      style={{ color: "#c9a961" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span className="text-[14px] leading-relaxed text-es-char">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cannot return */}
            <div>
              <p className="mb-4 text-[11px] tracking-[.48em] uppercase" style={{ color: "#888" }}>
                Not accepted
              </p>
              <h3
                className="mb-8 text-2xl sm:text-3xl font-bold text-es-ink leading-tight"
                style={{ fontFamily: "var(--font-bodoni)" }}
              >
                What cannot be returned
              </h3>
              <ul className="flex flex-col gap-4">
                {CANNOT_RETURN.map((item) => (
                  <li key={item} className="flex gap-3 items-start">
                    <span
                      className="mt-0.5 flex-shrink-0 w-5 h-5 flex items-center justify-center"
                      style={{ color: "#aaa" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </span>
                    <span className="text-[14px] leading-relaxed text-es-mute">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How to return */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-16 sm:px-16 sm:py-24">
          <p className="mb-4 text-center text-[11px] tracking-[.48em] uppercase text-es-gold">
            The process
          </p>
          <h2
            className="mb-14 text-center text-3xl sm:text-5xl font-bold leading-tight text-es-ink"
            style={{ fontFamily: "var(--font-bodoni)" }}
          >
            How to return an item
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-8">
            {STEPS.map((step) => (
              <div key={step.num} className="flex flex-col">
                <span
                  className="mb-4 text-5xl font-bold leading-none"
                  style={{ fontFamily: "var(--font-bodoni)", color: "#c9a961" }}
                >
                  {step.num}
                </span>
                <p
                  className="mb-3 text-[12px] tracking-[.14em] uppercase font-semibold text-es-ink"
                >
                  {step.heading}
                </p>
                <p className="text-[13px] leading-relaxed text-es-mute">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Start a return */}
      <section style={{ background: "#f7f7f7" }}>
        <div className="mx-auto w-full max-w-[720px] px-6 py-16 sm:px-16 sm:py-24">
          <p className="mb-4 text-center text-[11px] tracking-[.48em] uppercase text-es-gold">
            Online
          </p>
          <h2
            className="mb-4 text-center text-3xl sm:text-5xl font-bold leading-tight text-es-ink"
            style={{ fontFamily: "var(--font-bodoni)" }}
          >
            Start your return
          </h2>
          <p className="mb-10 text-center text-[14px] leading-relaxed text-es-mute">
            Prefer not to message us? Submit your request here and our team will follow up with the next steps.
          </p>
          <ReturnRequestForm />
        </div>
      </section>

      {/* Refund methods */}
      <section style={{ background: "var(--es-ink)", color: "#fff" }}>
        <div className="mx-auto w-full max-w-[800px] px-6 py-16 sm:px-16 sm:py-24 text-center">
          <p
            className="mb-4 text-[11px] tracking-[.48em] uppercase"
            style={{ color: "#c9a961" }}
          >
            Refund methods
          </p>
          <h2
            className="mb-8 text-3xl sm:text-5xl font-bold leading-tight"
            style={{ fontFamily: "var(--font-bodoni)" }}
          >
            M-Pesa refunds, always.
          </h2>
          <p
            className="mb-6 text-[15px] leading-relaxed"
            style={{ opacity: 0.8, fontFamily: "var(--font-inter)" }}
          >
            All refunds are sent back to the M-Pesa number used at checkout.
            We do not issue store credits, cheques, or bank transfers — only
            direct M-Pesa refunds.
          </p>
          <p
            className="text-[14px] leading-relaxed"
            style={{ opacity: 0.65, fontFamily: "var(--font-inter)" }}
          >
            Refunds are typically processed within{" "}
            <strong style={{ opacity: 1 }}>3–5 business days</strong> after we
            receive and inspect your return. You will receive an M-Pesa
            confirmation SMS once the refund is sent.
          </p>
          <div className="mt-10 flex justify-center gap-4 flex-wrap">
            <a
              href="/contact"
              className="es-btn-outline-white px-10 py-4 text-[11px] tracking-[.38em] uppercase"
            >
              Contact Support
            </a>
            <a
              href={SUPPORT_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="es-btn-outline-white px-10 py-4 text-[11px] tracking-[.38em] uppercase"
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
