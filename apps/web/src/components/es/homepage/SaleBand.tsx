import Link from "next/link";

export function SaleBand() {
  return (
    <section className="bg-es-champagne-lt border-t border-b border-es-champagne/30 px-8 md:px-16 py-10 flex items-center justify-between flex-wrap gap-6">
      <div className="flex items-center flex-wrap gap-7">
        <span className="font-sans text-[10px] tracking-label uppercase text-es-champagne-dk border border-es-champagne px-3.5 py-2">
          Private Preview
        </span>
        <span className="font-cormorant text-[22px] md:text-[28px] font-semibold text-es-ink leading-tight tracking-[-0.02em]">
          The Equinox Edit —{" "}
          <span className="text-es-champagne-dk italic">10 days only, by invitation.</span>
        </span>
      </div>
      <Link href="/contact" className="es-btn-champagne" style={{ textDecoration: "none" }}>
        Reserve Access →
      </Link>
    </section>
  );
}
