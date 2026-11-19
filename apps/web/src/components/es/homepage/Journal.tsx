import Link from "next/link";
import Image from "next/image";
import { JOURNAL_ARTICLES } from "@/lib/journalData";

export function Journal() {
  const posts = JOURNAL_ARTICLES.slice(0, 3);
  return (
    <section className="bg-white py-20 px-8 md:px-10 border-t border-es-hair">
      <div className="max-w-[1400px] mx-auto">

        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <p className="es-eyebrow mb-2">Journal</p>
            <h2 className="font-cormorant font-semibold text-es-ink m-0 tracking-[-0.02em]"
                style={{ fontSize: "clamp(26px, 3vw, 38px)" }}>
              From the Elite Style edit
            </h2>
          </div>
          <Link href="/journal" className="font-sans text-[13px] font-semibold text-es-ink no-underline border-b-2 border-es-ink pb-0.5 hover:text-es-champagne-dk hover:border-es-champagne-dk transition-colors whitespace-nowrap">
            All Articles →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-es-hair">
          {posts.map((p) => (
            <article key={p.slug} className="bg-white group">
              <div className="relative w-full overflow-hidden bg-es-bone" style={{ aspectRatio: "16 / 10" }}>
                <Image
                  src={p.image}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-10">
              <div className="mb-6">
                <span className="font-sans text-[10px] font-semibold tracking-label uppercase text-es-champagne-dk border border-es-champagne px-2.5 py-1">
                  {p.category}
                </span>
              </div>

              <h3 className="font-cormorant font-semibold text-es-ink mb-3.5 leading-[1.2] tracking-[-0.02em] group-hover:text-es-champagne-dk transition-colors"
                  style={{ fontSize: "clamp(18px, 2vw, 22px)" }}>
                {p.title}
              </h3>

              <p className="font-sans text-[13px] text-es-mute leading-relaxed mb-7">
                {p.excerpt}
              </p>

              <div className="flex items-center justify-between">
                <span className="font-sans text-[11px] text-es-faint tracking-wide">
                  {p.readTime}
                </span>
                <Link href={`/journal/${p.slug}`} className="font-sans text-[11px] font-semibold text-es-char no-underline tracking-label uppercase border-b border-es-char pb-0.5 hover:text-es-champagne-dk hover:border-es-champagne-dk transition-colors">
                  Read →
                </Link>
              </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
