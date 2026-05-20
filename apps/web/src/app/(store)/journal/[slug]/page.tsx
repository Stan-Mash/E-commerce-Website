import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
  params: { slug: string };
}

const ARTICLES = [
  {
    slug: "dressed-for-the-nairobi-rains",
    title: "Dressed for the Nairobi Rains",
    category: "STYLE",
    date: "May 2026",
    readTime: "4 min read",
    gradient: "linear-gradient(160deg, #c4c8d0 0%, #9ba0aa 55%, #6b717d 100%)",
    body: [
      "When the long rains arrive in Nairobi, dressing well is an act of defiance. The city transforms — rivers run down Uhuru Highway, the air smells of red earth, and umbrellas become the city's most traded commodity.",
      "The instinct is to retreat into waterproofs and practicality. But the most elegant Nairobians know something the weather forecasts don't: that dressing for rain is about fabric, not function. A well-woven cotton blend dries in minutes. A linen coat loses nothing to a light shower. A good knit wicks moisture while holding its form.",
      "The key is layering with intention. Start with a base that moves — something fitted, something breathable. Add a mid layer that gives you warmth without weight. Finish with a coat that has presence. The umbrella is optional. The coat is not.",
      "This season, we've been watching how Nairobi women navigate the rains on their own terms — a printed wrap doubled as a shawl, a linen co-ord that transitions from the office to the long commute home. There is no wrong way to be dressed in the rain, as long as you are dressed with care.",
    ],
  },
  {
    slug: "5-trends-nairobi-2026",
    title: "5 Trends Taking Over Nairobi This Season",
    category: "TRENDS",
    date: "April 2026",
    readTime: "5 min read",
    gradient: "linear-gradient(160deg, #d4c4a8 0%, #b8a484 55%, #967e60 100%)",
    body: [
      "Nairobi's fashion scene moves fast. In a city where the weekend includes a rooftop in Westlands, a Sunday in Karen, and a Monday morning in the CBD, versatility isn't a nice-to-have — it's a requirement. Here are the five looks that are everywhere right now.",
      "First: the oversized blazer. Worn open over a fitted top, belted as a dress, or thrown over tailored trousers, the oversized blazer has become the defining piece of the 2026 Nairobi wardrobe. The trick is fit in the shoulders — everything else can be big.",
      "Second: bold co-ords. Matching sets are still going strong, but the shift this season is toward louder prints and more relaxed silhouettes. A wide-leg trouser with a matching boxy shirt, in an eye-catching pattern, reads effortlessly put-together.",
      "Third: the midi skirt comeback. After years of minis, the midi is back — and the Nairobi version comes in wrap styles, pleated cotton, and printed fabrics. It works with trainers or heels, which is exactly what this city needs.",
      "Fourth: menswear-inspired cuts for women. Straight-leg trousers, structured shirts, and wide-shouldered jackets — borrowed from menswear and made entirely for women. Fifth: children's co-ords that mirror adult styles. The family matching moment is real.",
    ],
  },
  {
    slug: "capsule-wardrobe-on-a-budget",
    title: "A Capsule Wardrobe on Any Budget",
    category: "STYLE",
    date: "March 2026",
    readTime: "6 min read",
    gradient: "linear-gradient(160deg, #7b4d8c 0%, #4e2460 55%, #2a1135 100%)",
    body: [
      "A capsule wardrobe is not about owning less. It is about owning the right things — pieces that work together, that cover most situations, and that you actually want to wear. The good news is that it doesn't require a large budget.",
      "Start with your base layers. Two or three fitted tops in neutral tones — white, black, camel — are the foundation of almost every outfit. They go under blazers, over trousers, and tuck into skirts. Spend moderately here: these are the pieces that see the most wear.",
      "Add one great pair of trousers. Not the cheap ones you bought in a hurry, but a pair that fits properly through the waist and hip. Straight-leg or wide-leg both work well and have real longevity. In Nairobi's climate, a mid-weight fabric in a versatile colour — navy, camel, black — is ideal.",
      "Then a blazer. One well-cut blazer in a neutral colour will transform everything underneath it. Wear it to the office, over a dress for evening, or with jeans at the weekend. It is the single highest-leverage piece in any wardrobe.",
      "Round out with one or two dresses that feel genuinely you — not occasion-specific, but wearable in multiple contexts. Everything else — prints, colour, accessories — builds on top of this foundation. Shop the foundation first. Everything else comes after.",
    ],
  },
  {
    slug: "linen-season-nairobi",
    title: "Linen Season: Nairobi",
    category: "STYLE",
    date: "February 2026",
    readTime: "3 min read",
    gradient: "linear-gradient(160deg, #b4bfb0 0%, #8a9885 55%, #5f6e5a 100%)",
    body: [
      "The case for linen in a city that never really gets cold is almost too easy to make. Nairobi sits at 1,700 metres. The sun is direct. The seasons are a negotiation rather than a declaration. In this climate, linen is not a seasonal choice — it is a permanent one.",
      "Good linen is heavier than you might expect — more structural, slower to wrinkle in the way that becomes character rather than flaw. Stonewashed, it softens immediately. Raw, it stiffens pleasingly with wear.",
      "The linen co-ord was designed for the city's rhythms — the morning meeting, the afternoon errand, the evening gathering that runs later than planned. It does not demand to be ironed. It asks only that you wear it.",
      "Linen is patient. It improves with age and washing. In a city that moves as fast as Nairobi, there is something to be said for clothing that slows you down just enough to notice how well you are dressed.",
    ],
  },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = ARTICLES.find((a) => a.slug === params.slug);
  if (!article) return { title: "Article Not Found" };
  return { title: article.title, description: article.body[0]?.slice(0, 160) };
}

export default function JournalArticlePage({ params }: Props) {
  const article = ARTICLES.find((a) => a.slug === params.slug);
  if (!article) notFound();

  return (
    <main style={{ background: "var(--es-white)", minHeight: "100vh" }}>
      {/* Hero */}
      <div
        style={{
          width: "100%",
          height: "55vh",
          minHeight: 320,
          background: article.gradient,
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)",
          }}
        />
        <div style={{ position: "relative", padding: "0 clamp(24px, 8vw, 96px) 48px" }}>
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 11,
              letterSpacing: ".45em",
              textTransform: "uppercase",
              color: "var(--es-gold)",
              marginBottom: 12,
            }}
          >
            {article.category}
          </p>
          <h1
            style={{
              fontFamily: "var(--font-bodoni)",
              fontSize: "clamp(28px, 5vw, 56px)",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              margin: 0,
              maxWidth: 680,
            }}
          >
            {article.title}
          </h1>
        </div>
      </div>

      {/* Article body */}
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "clamp(40px, 6vw, 80px) clamp(24px, 6vw, 48px)",
        }}
      >
        {/* Byline */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 48,
            paddingBottom: 24,
            borderBottom: "1px solid var(--es-bone)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 12,
              letterSpacing: ".2em",
              textTransform: "uppercase",
              color: "var(--es-mute)",
            }}
          >
            Elite Style Co. · {article.date}
          </span>
          <span style={{ color: "var(--es-bone)" }}>·</span>
          <span
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 12,
              letterSpacing: ".2em",
              textTransform: "uppercase",
              color: "var(--es-mute)",
            }}
          >
            {article.readTime}
          </span>
        </div>

        {/* Body paragraphs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {article.body.map((para, i) => (
            <p
              key={i}
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 17,
                lineHeight: 1.75,
                color: i === 0 ? "var(--es-char)" : "var(--es-ink)",
                margin: 0,
                fontWeight: i === 0 ? 500 : 400,
              }}
            >
              {para}
            </p>
          ))}
        </div>

        {/* Divider + back link */}
        <div
          style={{
            marginTop: 64,
            paddingTop: 32,
            borderTop: "1px solid var(--es-bone)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <Link
            href="/journal"
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 11,
              letterSpacing: ".34em",
              textTransform: "uppercase",
              color: "var(--es-ink)",
              textDecoration: "none",
              borderBottom: "1px solid var(--es-ink)",
              paddingBottom: 2,
            }}
          >
            ← Back to Journal
          </Link>
          <Link
            href="/products"
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 11,
              letterSpacing: ".34em",
              textTransform: "uppercase",
              color: "var(--es-plum)",
              textDecoration: "none",
              borderBottom: "1px solid var(--es-plum)",
              paddingBottom: 2,
            }}
          >
            Shop the Collection →
          </Link>
        </div>
      </div>
    </main>
  );
}
