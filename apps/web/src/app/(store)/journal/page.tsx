import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { JOURNAL_ARTICLES } from "@/lib/journalData";

export const metadata: Metadata = {
  title: "Fashion Journal | Style Tips & Trends for Nairobi",
  description:
    "Nairobi fashion tips, outfit ideas, and trend reports from Elite Style Co. Office looks, capsule wardrobes, plus size style, and what to wear in Kenya's seasons.",
  alternates: { canonical: "/journal" },
};

export default function JournalPage() {
  return (
    <div className="min-h-screen bg-es-paper">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-10 sm:px-16 sm:py-20">
        {/* Page header */}
        <header className="mb-14">
          <p className="mb-3 text-[11px] tracking-[.48em] uppercase text-es-gold">
            ELITE STYLE CO. JOURNAL
          </p>
          <h1
            className="text-5xl sm:text-7xl font-bold leading-none tracking-tight text-es-ink"
            style={{ fontFamily: "var(--font-bodoni)" }}
          >
            STYLE NOTES
          </h1>
        </header>

        {/* Article grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-14">
          {JOURNAL_ARTICLES.map((article) => {
            return (
              <Link
                key={article.slug}
                href={`/journal/${article.slug}`}
                className="group block"
                aria-label={`Read ${article.title}`}
              >
                <div
                  className="relative w-full overflow-hidden bg-es-bone mb-5"
                  style={{ aspectRatio: "3 / 2" }}
                >
                  <Image
                    src={article.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>

                {/* Article meta */}
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] tracking-[.46em] uppercase text-es-gold">
                    {article.category}
                  </p>
                  <h2
                    className="text-2xl font-bold leading-tight text-es-ink group-hover:opacity-75 transition-opacity duration-200"
                    style={{ fontFamily: "var(--font-bodoni)" }}
                  >
                    {article.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-es-mute line-clamp-3">
                    {article.excerpt}
                  </p>
                  <p className="text-[11px] tracking-[.32em] uppercase text-es-mute mt-1">
                    {article.date}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
