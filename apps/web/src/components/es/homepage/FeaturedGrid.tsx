"use client";

import { useState } from "react";
import { ElitePlate } from "@/components/es/ElitePlate";
import type { ToneKey, FigureKind } from "@/components/es/ElitePlate";

type Dept = "ALL" | "WOMAN" | "MAN" | "CHILDREN";

const PRODUCTS: {
  dept: Exclude<Dept, "ALL">;
  name: string;
  sub: string;
  price: string;
  tone: ToneKey;
  kind: FigureKind;
  tag?: string;
}[] = [
  { dept: "WOMAN",    name: "Kikoy Wrap Dress",        sub: "Hand-loomed coastal cotton",      price: "8,500",  tone: "smoke", kind: "woman", tag: "NEW" },
  { dept: "MAN",      name: "Maasai Bead Collar Shirt", sub: "Oxford cotton, hand-beaded collar", price: "6,200",  tone: "ink",   kind: "man" },
  { dept: "CHILDREN", name: "Ankara Print Jumpsuit",    sub: "Wax-print cotton, snap-leg",      price: "4,800",  tone: "sand",  kind: "child" },
  { dept: "WOMAN",    name: "Nairobi Linen Co-ord",     sub: "Stonewashed Belgian linen",        price: "12,400", tone: "plum",  kind: "woman" },
  { dept: "MAN",      name: "Kitenge Baraza Shirt",     sub: "Wax cotton, relaxed open hem",     price: "5,800",  tone: "bone",  kind: "man",   tag: "NEW" },
  { dept: "CHILDREN", name: "Shuka Check Romper",       sub: "Stretch cotton, growing hem",      price: "3,200",  tone: "warm",  kind: "child" },
];

const FILTERS: Dept[] = ["ALL", "WOMAN", "MAN", "CHILDREN"];

export function FeaturedGrid() {
  const [filter, setFilter] = useState<Dept>("ALL");

  const visible = filter === "ALL" ? PRODUCTS : PRODUCTS.filter((p) => p.dept === filter);

  return (
    <section style={{ background: "#ffffff", padding: "120px 64px" }}>
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 24,
          marginBottom: 48,
        }}
      >
        <div>
          <div style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: 11, letterSpacing: ".45em", color: "#9b7b3f", textTransform: "uppercase" }}>
            CHAPTER ONE
          </div>
          <h2
            style={{
              fontFamily: "var(--font-bodoni), Georgia, serif",
              fontOpticalSizing: "auto",
              fontSize: "clamp(32px, 4vw, 56px)",
              fontWeight: 700,
              letterSpacing: "-.025em",
              color: "#0a0a0a",
              margin: "12px 0 0",
            }}
          >
            The New Season, in six pieces.
          </h2>
        </div>

        <div style={{ display: "flex", gap: 24 }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: 11,
                letterSpacing: ".34em",
                color: "#0a0a0a",
                paddingBottom: 4,
                borderBottom: filter === f ? "2px solid #3d1a4a" : "2px solid transparent",
                transition: "border-color .15s",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* 3-col grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 22,
        }}
        className="!grid-cols-2 lg:!grid-cols-3"
      >
        {visible.map((p) => {
          const isLight = p.tone === "bone" || p.tone === "sand";
          return (
            <article key={p.name}>
              <div style={{ aspectRatio: "4/5", position: "relative", background: "#f6f5f2" }}>
                <ElitePlate kind={p.kind} tone={p.tone} />
                {/* dept label */}
                <div
                  style={{
                    position: "absolute",
                    top: 14,
                    left: 14,
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: 9,
                    letterSpacing: ".4em",
                    color: isLight ? "#0a0a0a" : "#ffffff",
                    padding: "6px 0",
                    textTransform: "uppercase",
                  }}
                >
                  {p.dept}
                </div>
                {/* NEW tag */}
                {p.tag && (
                  <div
                    style={{
                      position: "absolute",
                      top: 14,
                      right: 14,
                      background: "#3d1a4a",
                      color: "#ffffff",
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: 9,
                      letterSpacing: ".34em",
                      padding: "6px 10px",
                      textTransform: "uppercase",
                    }}
                  >
                    {p.tag}
                  </div>
                )}
                {/* Quick view */}
                <div
                  style={{
                    position: "absolute",
                    right: 14,
                    bottom: 14,
                    background: "rgba(255,255,255,.95)",
                    color: "#0a0a0a",
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: 10,
                    letterSpacing: ".28em",
                    padding: "8px 12px",
                    textTransform: "uppercase",
                  }}
                >
                  + QUICK VIEW
                </div>
              </div>
              <div style={{ paddingTop: 18 }}>
                <div
                  style={{
                    fontFamily: "var(--font-bodoni), Georgia, serif",
                    fontOpticalSizing: "auto",
                    fontSize: 22,
                    fontWeight: 600,
                    color: "#0a0a0a",
                    letterSpacing: "-.005em",
                  }}
                >
                  {p.name}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: 13,
                    color: "#717171",
                    marginTop: 4,
                  }}
                >
                  {p.sub}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginTop: 14,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: 12,
                      letterSpacing: ".28em",
                      color: "#0a0a0a",
                    }}
                  >
                    KES {p.price}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: 10,
                      letterSpacing: ".34em",
                      color: "#a8a8a8",
                      textTransform: "uppercase",
                    }}
                  >
                    5 SIZES
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* CTA */}
      <div style={{ textAlign: "center", marginTop: 56 }}>
        <button className="es-btn-outline-ink">VIEW THE FULL SEASON →</button>
      </div>
    </section>
  );
}
