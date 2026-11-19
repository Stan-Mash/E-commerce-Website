import type { Metadata } from "next";
import { StyleFinderQuiz } from "@/components/es/StyleFinderQuiz";

export const metadata: Metadata = {
  title: "Find My Style",
  description:
    "Answer three quick questions and we'll pull the right pieces from our Nairobi edit — matched to your occasion and budget.",
  alternates: { canonical: "/style-finder" },
};

export default function StyleFinderPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Page header */}
      <div className="border-b border-es-hair bg-es-paper">
        <div className="mx-auto max-w-[1200px] px-6 sm:px-16 py-14 sm:py-20">
          <p className="text-[11px] tracking-[.48em] uppercase text-es-champagne-dk mb-4">
            ELITE STYLE CO.
          </p>
          <h1
            className="text-4xl sm:text-6xl font-bold leading-none text-es-ink mb-4"
            style={{ fontFamily: "var(--font-bodoni)" }}
          >
            Find Your Style
          </h1>
          <p className="text-sm text-es-mute max-w-md leading-relaxed">
            Three quick questions. We'll show you the pieces from our edit that
            match your occasion and budget.
          </p>
        </div>
      </div>

      {/* Quiz */}
      <div className="mx-auto max-w-[1200px] px-6 sm:px-16 py-14 sm:py-20">
        <StyleFinderQuiz />
      </div>
    </div>
  );
}
