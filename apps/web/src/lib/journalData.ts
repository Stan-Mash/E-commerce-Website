export interface JournalArticle {
  slug: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  image: string;
  readTime: string;
}

export const JOURNAL_ARTICLES: JournalArticle[] = [
  {
    slug: "dressed-for-the-nairobi-rains",
    title: "Dressed for the Nairobi Rains",
    category: "STYLE",
    date: "May 2026",
    excerpt:
      "When the long rains arrive, dressing well is an act of defiance, a refusal to let the weather dictate your elegance.",
    image: "/products/tweed-set-black-white.jpg",
    readTime: "4 min read",
  },
  {
    slug: "5-trends-nairobi-2026",
    title: "5 Trends Taking Over Nairobi This Season",
    category: "TRENDS",
    date: "April 2026",
    excerpt:
      "From oversized blazers to bold co-ords: the looks dominating Nairobi streets right now, and exactly where to get them.",
    image: "/products/tweed-set-pink-black.jpg",
    readTime: "3 min read",
  },
  {
    slug: "capsule-wardrobe-on-a-budget",
    title: "A Capsule Wardrobe on Any Budget",
    category: "STYLE",
    date: "March 2026",
    excerpt:
      "You don't need a full wardrobe refresh to look great every day. Here are the ten pieces worth investing in first.",
    image: "/products/knitted-vest-blue.png",
    readTime: "5 min read",
  },
  {
    slug: "linen-season-nairobi",
    title: "Linen Season: Nairobi",
    category: "STYLE",
    date: "February 2026",
    excerpt:
      "The case for linen in a city that never really gets cold: why breathable, natural fabrics belong in every wardrobe year-round.",
    image: "/products/tweed-set-white-gold.jpg",
    readTime: "4 min read",
  },
];
