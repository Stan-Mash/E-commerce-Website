"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClientSupabaseClient } from "@/lib/supabase/client";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Answers {
  who: string;
  occasion: string;
  budget: string;
}

interface ProductResult {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  compare_price: number | null;
  category: string;
  product_images: { url: string; alt: string | null; sort_order: number }[];
  skus: { stock_quantity: number }[];
}

type ViewState = "step1" | "step2" | "step3" | "loading" | "results" | "empty";

// ─── Config ──────────────────────────────────────────────────────────────────

const WHO_OPTIONS = [
  { label: "Women", value: "women", sub: "Dresses, co-ords & more" },
  { label: "Men", value: "men", sub: "Shirts, trousers & suits" },
  { label: "Children", value: "children", sub: "Kids' fashion" },
  { label: "Everyone", value: "everyone", sub: "Browse the full edit" },
];

const OCCASION_OPTIONS = [
  { label: "Work & Office", value: "work", desc: "Sharp, polished looks" },
  { label: "Weekend", value: "casual", desc: "Relaxed & effortless" },
  { label: "Special Event", value: "event", desc: "Dressed to impress" },
  { label: "Going Out", value: "out", desc: "Evening & nightlife" },
];

const BUDGET_OPTIONS = [
  { label: "Under KES 2,000", value: "0-2000", min: 0, max: 1999 },
  { label: "KES 2,000 – 5,000", value: "2000-5000", min: 2000, max: 5000 },
  { label: "KES 5,000 – 10,000", value: "5000-10000", min: 5000, max: 10000 },
  { label: "KES 10,000+", value: "10000+", min: 10000, max: 9_999_999 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount);
}

function categoryVariants(who: string): string[] {
  if (who === "women") return ["women", "Woman", "WOMAN", "womenswear"];
  if (who === "men") return ["men", "Man", "MAN", "menswear"];
  if (who === "children") return ["children", "Children", "CHILDREN", "kids"];
  // everyone → no category filter (handled below)
  return [];
}

async function fetchResults(answers: Answers): Promise<ProductResult[]> {
  let supabase;
  try {
    supabase = createClientSupabaseClient();
  } catch {
    return [];
  }
  const budget = BUDGET_OPTIONS.find((b) => b.value === answers.budget);

  let query = supabase
    .from("products")
    .select(
      `id, name, slug, base_price, compare_price, category,
       product_images(url, alt, sort_order),
       skus(stock_quantity)`
    )
    .eq("status", "active")
    .gte("base_price", budget?.min ?? 0)
    .lte("base_price", budget?.max ?? 9_999_999)
    .limit(8);

  if (answers.who !== "everyone") {
    query = query.in("category", categoryVariants(answers.who));
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as unknown as ProductResult[];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function OptionButton({
  label,
  sub,
  selected,
  onClick,
}: {
  label: string;
  sub?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full text-left border px-5 py-4 transition-all duration-150 cursor-pointer",
        selected
          ? "border-es-ink bg-es-ink text-white"
          : "border-es-rule bg-white hover:border-es-champagne hover:bg-es-paper text-es-ink",
      ].join(" ")}
    >
      <span className="block text-[13px] font-semibold tracking-[.12em] uppercase">
        {label}
      </span>
      {sub && (
        <span
          className={[
            "block text-[11px] mt-0.5 tracking-[.05em]",
            selected ? "text-white/70" : "text-es-mute",
          ].join(" ")}
        >
          {sub}
        </span>
      )}
    </button>
  );
}

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex gap-2 mb-8">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className={[
            "h-[2px] flex-1 transition-colors duration-300",
            n <= step ? "bg-es-ink" : "bg-es-bone",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

function ResultCard({ product }: { product: ProductResult }) {
  const sorted = [...(product.product_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const img = sorted[0];
  const inStock = product.skus?.some((s) => s.stock_quantity > 0);
  const hasCompare =
    product.compare_price && product.compare_price > product.base_price;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block"
      aria-label={`View ${product.name}`}
    >
      <div className="relative w-full overflow-hidden bg-es-bone mb-3">
        <div style={{ paddingBottom: "125%" }} />
        {img ? (
          <Image
            src={img.url}
            alt={img.alt ?? product.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#eeece8] to-[#c9b3a030]" />
        )}
        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="text-[10px] tracking-[.3em] uppercase text-es-mute">
              Sold Out
            </span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] tracking-[.4em] uppercase text-es-mute">
          {product.category}
        </p>
        <p
          className="text-base font-bold leading-snug text-es-ink line-clamp-2"
          style={{ fontFamily: "var(--font-bodoni)" }}
        >
          {product.name}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm tracking-[.25em] text-es-ink">
            {formatKES(product.base_price)}
          </span>
          {hasCompare && (
            <span className="text-sm tracking-[.25em] text-es-mute line-through">
              {formatKES(product.compare_price!)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StyleFinderQuiz() {
  const [view, setView] = useState<ViewState>("step1");
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [results, setResults] = useState<ProductResult[]>([]);

  const currentStep = view === "step1" ? 1 : view === "step2" ? 2 : 3;

  async function handleBudgetSelect(budgetValue: string) {
    const finalAnswers: Answers = {
      who: answers.who!,
      occasion: answers.occasion!,
      budget: budgetValue,
    };
    setAnswers(finalAnswers);
    setView("loading");

    try {
      const found = await fetchResults(finalAnswers);
      setResults(found);
      setView(found.length > 0 ? "results" : "empty");
    } catch {
      setResults([]);
      setView("empty");
    }
  }

  function reset() {
    setAnswers({});
    setResults([]);
    setView("step1");
  }

  const occasionLabel = OCCASION_OPTIONS.find(
    (o) => o.value === answers.occasion
  )?.label;
  const whoLabel = WHO_OPTIONS.find((w) => w.value === answers.who)?.label;

  // ── Loading ──
  if (view === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-8 h-8 border-2 border-es-ink border-t-transparent rounded-full animate-spin" />
        <p className="text-[11px] tracking-[.35em] uppercase text-es-mute">
          Finding your style…
        </p>
      </div>
    );
  }

  // ── Results ──
  if (view === "results") {
    return (
      <div>
        <div className="mb-8">
          <p className="text-[11px] tracking-[.45em] uppercase text-es-champagne-dk mb-2">
            YOUR EDIT · {whoLabel?.toUpperCase()} · {occasionLabel?.toUpperCase()}
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold text-es-ink mb-1"
            style={{ fontFamily: "var(--font-bodoni)" }}
          >
            {results.length} {results.length === 1 ? "piece" : "pieces"} found
          </h2>
          <button
            onClick={reset}
            className="mt-3 text-[11px] tracking-[.3em] uppercase text-es-mute underline underline-offset-4 hover:text-es-ink transition-colors"
          >
            Start over
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6">
          {results.map((p) => (
            <ResultCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    );
  }

  // ── Empty ──
  if (view === "empty") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-[11px] tracking-[.45em] uppercase text-es-champagne-dk mb-4">
          ELITE STYLE CO.
        </p>
        <h2
          className="text-3xl sm:text-4xl font-bold text-es-ink mb-4"
          style={{ fontFamily: "var(--font-bodoni)" }}
        >
          Nothing yet in that range
        </h2>
        <p className="text-sm text-es-mute mb-8 max-w-sm">
          We're adding new pieces every week. Browse everything we have now or
          try a different budget.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/products"
            className="px-8 py-3 bg-es-ink text-white text-[11px] tracking-[.35em] uppercase hover:bg-es-char transition-colors"
          >
            Browse All
          </Link>
          <button
            onClick={reset}
            className="px-8 py-3 border border-es-rule text-es-ink text-[11px] tracking-[.35em] uppercase hover:bg-es-paper transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Step 1: Who ──
  if (view === "step1") {
    return (
      <div>
        <StepIndicator step={1} />
        <p className="text-[11px] tracking-[.45em] uppercase text-es-champagne-dk mb-3">
          STEP 1 OF 3
        </p>
        <h2
          className="text-3xl sm:text-4xl font-bold text-es-ink mb-8"
          style={{ fontFamily: "var(--font-bodoni)" }}
        >
          Who are you shopping for?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {WHO_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              label={opt.label}
              sub={opt.sub}
              selected={answers.who === opt.value}
              onClick={() => {
                setAnswers({ who: opt.value });
                setView("step2");
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Step 2: Occasion ──
  if (view === "step2") {
    return (
      <div>
        <StepIndicator step={2} />
        <p className="text-[11px] tracking-[.45em] uppercase text-es-champagne-dk mb-3">
          STEP 2 OF 3
        </p>
        <h2
          className="text-3xl sm:text-4xl font-bold text-es-ink mb-8"
          style={{ fontFamily: "var(--font-bodoni)" }}
        >
          What's the occasion?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {OCCASION_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              label={opt.label}
              sub={opt.desc}
              selected={answers.occasion === opt.value}
              onClick={() => {
                setAnswers((prev) => ({ ...prev, occasion: opt.value }));
                setView("step3");
              }}
            />
          ))}
        </div>
        <button
          onClick={() => setView("step1")}
          className="text-[11px] tracking-[.3em] uppercase text-es-mute hover:text-es-ink transition-colors"
        >
          ← Back
        </button>
      </div>
    );
  }

  // ── Step 3: Budget ──
  return (
    <div>
      <StepIndicator step={3} />
      <p className="text-[11px] tracking-[.45em] uppercase text-es-champagne-dk mb-3">
        STEP 3 OF 3
      </p>
      <h2
        className="text-3xl sm:text-4xl font-bold text-es-ink mb-8"
        style={{ fontFamily: "var(--font-bodoni)" }}
      >
        What's your budget?
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {BUDGET_OPTIONS.map((opt) => (
          <OptionButton
            key={opt.value}
            label={opt.label}
            selected={false}
            onClick={() => handleBudgetSelect(opt.value)}
          />
        ))}
      </div>
      <button
        onClick={() => setView("step2")}
        className="text-[11px] tracking-[.3em] uppercase text-es-mute hover:text-es-ink transition-colors"
      >
        ← Back
      </button>
    </div>
  );
}
