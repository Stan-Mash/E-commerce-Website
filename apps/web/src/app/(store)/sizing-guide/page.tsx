import type { Metadata } from "next";
import Link from "next/link";
import { SUPPORT_WHATSAPP_LINK, SUPPORT_EMAIL } from "@/lib/supportConfig";

export const metadata: Metadata = { title: "Sizing Guide | Elite Style Co." };

const ADULT_SIZES = [
  { size: "XS",  chest: 82,  waist: 62, hips: 88,  height: "155–160" },
  { size: "S",   chest: 86,  waist: 66, hips: 92,  height: "160–165" },
  { size: "M",   chest: 90,  waist: 70, hips: 96,  height: "165–170" },
  { size: "L",   chest: 95,  waist: 75, hips: 101, height: "170–175" },
  { size: "XL",  chest: 100, waist: 80, hips: 106, height: "175–180" },
  { size: "XXL", chest: 106, waist: 86, hips: 112, height: "180+" },
];

const KIDS_SIZES = [
  { size: "2Y",  chest: 52, waist: 51, hips: 55, height: "86–92" },
  { size: "4Y",  chest: 56, waist: 53, hips: 59, height: "98–104" },
  { size: "6Y",  chest: 60, waist: 55, hips: 63, height: "110–116" },
  { size: "8Y",  chest: 64, waist: 58, hips: 67, height: "122–128" },
  { size: "10Y", chest: 68, waist: 61, hips: 72, height: "134–140" },
];

const TH: React.CSSProperties = {
  background: "#f8f7f5",
  padding: "10px 16px",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: ".28em",
  textTransform: "uppercase" as const,
  color: "#555",
  textAlign: "left" as const,
  borderBottom: "1px solid #e5e4df",
};

const TD: React.CSSProperties = {
  padding: "12px 16px",
  borderBottom: "1px solid #f0efe9",
  fontSize: 14,
  color: "#444",
};

function SizeTable({ rows }: { rows: typeof ADULT_SIZES }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #e5e4df", marginBottom: 40 }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={TH}>Size</th>
            <th style={TH}>Chest (cm)</th>
            <th style={TH}>Waist (cm)</th>
            <th style={TH}>Hips (cm)</th>
            <th style={TH}>Height fits (cm)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.size} style={{ transition: "background 0.1s" }}>
              <td style={{ ...TD, fontWeight: 700, color: "#171717", letterSpacing: ".06em" }}>{row.size}</td>
              <td style={TD}>{row.chest}</td>
              <td style={TD}>{row.waist}</td>
              <td style={TD}>{row.hips}</td>
              <td style={TD}>{row.height}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SizingGuidePage() {
  return (
    <main className="min-h-screen bg-es-white">
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "80px 24px 100px" }}>
        <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, letterSpacing: ".45em", textTransform: "uppercase", color: "var(--es-gold)", marginBottom: 16 }}>
          ELITE STYLE CO.
        </p>
        <h1 style={{ fontFamily: "var(--font-bodoni)", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700, lineHeight: 1.1, color: "var(--es-ink)", marginBottom: 16 }}>
          Sizing Guide
        </h1>
        <p style={{ fontFamily: "var(--font-inter)", fontSize: 15, lineHeight: 1.7, color: "var(--es-mute)", marginBottom: 48, maxWidth: 560 }}>
          All measurements are body measurements in centimetres — not garment measurements. For the best fit, size up if you are between sizes.
        </p>

        {/* Adult sizes */}
        <h2 style={{ fontFamily: "var(--font-bodoni)", fontSize: 26, fontWeight: 700, color: "var(--es-ink)", marginBottom: 20 }}>
          Adults
        </h2>
        <SizeTable rows={ADULT_SIZES} />

        {/* Kids sizes */}
        <h2 style={{ fontFamily: "var(--font-bodoni)", fontSize: 26, fontWeight: 700, color: "var(--es-ink)", marginBottom: 20 }}>
          Children
        </h2>
        <SizeTable rows={KIDS_SIZES} />

        {/* Measuring tips */}
        <div style={{ background: "var(--es-paper)", padding: "28px 32px", marginBottom: 40 }}>
          <h3 style={{ fontFamily: "var(--font-inter)", fontSize: 11, letterSpacing: ".38em", textTransform: "uppercase", color: "var(--es-ink)", marginBottom: 20 }}>
            HOW TO MEASURE
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Chest", desc: "Measure around the fullest part of your chest, keeping the tape parallel to the floor." },
              { label: "Waist", desc: "Measure around your natural waist — the narrowest part of your torso, usually just above the belly button." },
              { label: "Hips", desc: "Measure around the fullest part of your hips and bottom, keeping the tape level." },
              { label: "Height", desc: "Stand against a wall without shoes. Measure from the floor to the top of your head." },
            ].map(({ label, desc }) => (
              <li key={label} style={{ display: "flex", gap: 16 }}>
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase", color: "var(--es-ink)", fontWeight: 600, minWidth: 60, paddingTop: 2 }}>{label}</span>
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, lineHeight: 1.6, color: "var(--es-mute)" }}>{desc}</span>
              </li>
            ))}
          </ul>
        </div>

        <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "var(--es-mute)", lineHeight: 1.65, marginBottom: 32 }}>
          Not sure? Our team is happy to help you find the right size. Reach us on{" "}
          <a href={SUPPORT_WHATSAPP_LINK} style={{ color: "var(--es-ink)" }}>WhatsApp</a> or at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "var(--es-ink)" }}>{SUPPORT_EMAIL}</a>.
        </p>

        <Link href="/products" style={{ fontFamily: "var(--font-inter)", fontSize: 11, letterSpacing: ".34em", textTransform: "uppercase", color: "var(--es-ink)", borderBottom: "1px solid var(--es-ink)", paddingBottom: 2, textDecoration: "none" }}>
          Shop the Collection →
        </Link>
      </div>
    </main>
  );
}
