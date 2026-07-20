import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Style notes, trend reports, and Nairobi-made styling guidance from Elite Style Co.",
  alternates: { canonical: "/journal" },
};

const ARTICLES = [
  {
    slug: "dressed-for-the-nairobi-rains",
    title: "Dressed for the Nairobi Rains",
    category: "STYLE",
    date: "May 2026",
    excerpt:
      "When the long rains arrive, dressing well is an act of defiance — a refusal to let the weather dictate your elegance.",
    image: "/products/tweed-set-black-white.jpg",
  },
  {
    slug: "5-trends-nairobi-2026",
    title: "5 Trends Taking Over Nairobi This Season",
    category: "TRENDS",
    date: "April 2026",
    excerpt:
      "From oversized blazers to bold co-ords — the looks dominating Nairobi streets right now, and exactly where to get them.",
    image: "/products/tweed-set-pink-black.jpg",
  },
  {
    slug: "capsule-wardrobe-on-a-budget",
    title: "A Capsule Wardrobe on Any Budget",
    category: "STYLE",
    date: "March 2026",
    excerpt:
      "You don't need a full wardrobe refresh to look great every day. Here are the ten pieces worth investing in first.",
    image: "/products/knitted-vest-blue.png",
  },
  {
    slug: "linen-season-nairobi",
    title: "Linen Season: Nairobi",
    category: "STYLE",
    date: "February 2026",
    excerpt:
      "The case for linen in a city that never really gets cold — why breathable, natural fabrics belong in every wardrobe year-round.",
    image: "/products/tweed-set-white-gold.jpg",
  },
];

export default function JournalPage() {
  return (
    <main className="min-h-screen bg-es-paper">
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
          {ARTICLES.map((article) => {
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
    </main>
  );
}
