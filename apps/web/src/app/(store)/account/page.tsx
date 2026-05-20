import Link from "next/link";

export default function AccountPage() {
  return (
    <main
      className="min-h-screen bg-es-paper flex flex-col items-center justify-center px-6 py-20"
    >
      <div className="flex flex-col items-center text-center max-w-lg">
        {/* Gold eyebrow */}
        <p className="mb-5 text-[11px] tracking-[.48em] uppercase text-es-gold">
          MY ACCOUNT
        </p>

        {/* Bodoni heading */}
        <h1
          className="mb-6 text-5xl sm:text-6xl font-bold leading-none tracking-tight text-es-ink"
          style={{ fontFamily: "var(--font-bodoni)" }}
        >
          Coming Soon.
        </h1>

        {/* Cormorant italic subtext */}
        <p
          className="mb-12 text-xl leading-relaxed"
          style={{
            fontFamily: "var(--font-cormorant)",
            fontStyle: "italic",
            color: "#717171",
          }}
        >
          Member accounts are on their way &mdash; order tracking, wishlists, and
          appointment history in one place.
        </p>

        {/* CTA */}
        <Link
          href="/products"
          className="es-btn-outline-ink px-10 py-3 text-[11px] tracking-[.38em] uppercase"
        >
          CONTINUE SHOPPING
        </Link>
      </div>
    </main>
  );
}
