// Single source of truth for size data — was previously duplicated between
// the SizeGuide modal (shown on product pages) and the standalone
// /sizing-guide page, which had silently drifted to only listing up to XXL
// even though the catalogue carries sizes through 5XL.
//
// 3XL–5XL measurements are extrapolated from the existing S→XXL progression
// (roughly +5 to +6cm per step) rather than measured from real garments —
// worth double-checking against actual stock and adjusting the numbers here
// if they're off.

export interface SizeRow {
  size: string;
  chest: number;
  waist: number;
  hips: number;
  height: string;
}

export const ADULT_SIZES: SizeRow[] = [
  { size: "XS",  chest: 82,  waist: 62,  hips: 88,  height: "155–160" },
  { size: "S",   chest: 86,  waist: 66,  hips: 92,  height: "160–165" },
  { size: "M",   chest: 90,  waist: 70,  hips: 96,  height: "165–170" },
  { size: "L",   chest: 95,  waist: 75,  hips: 101, height: "170–175" },
  { size: "XL",  chest: 100, waist: 80,  hips: 106, height: "175–180" },
  { size: "XXL", chest: 106, waist: 86,  hips: 112, height: "180+" },
  { size: "3XL", chest: 112, waist: 92,  hips: 118, height: "180+" },
  { size: "4XL", chest: 118, waist: 98,  hips: 124, height: "180+" },
  { size: "5XL", chest: 124, waist: 104, hips: 130, height: "180+" },
];

export const KIDS_SIZES: SizeRow[] = [
  { size: "2Y",  chest: 52, waist: 51, hips: 55, height: "86–92" },
  { size: "4Y",  chest: 56, waist: 53, hips: 59, height: "98–104" },
  { size: "6Y",  chest: 60, waist: 55, hips: 63, height: "110–116" },
  { size: "8Y",  chest: 64, waist: 58, hips: 67, height: "122–128" },
  { size: "10Y", chest: 68, waist: 61, hips: 72, height: "134–140" },
];

// Canonical display order for the size filter on the shop page — Set-based
// dedup elsewhere has no ordering, which produced XS/L/3XL/S/... type chip
// rows. Anything not in this list (custom kids sizes, "One Size", etc.)
// sorts after the known sizes, alphabetically.
const SIZE_ORDER = [...ADULT_SIZES, ...KIDS_SIZES].map((s) => s.size);

export function compareSizes(a: string, b: string): number {
  const ai = SIZE_ORDER.indexOf(a);
  const bi = SIZE_ORDER.indexOf(b);
  if (ai === -1 && bi === -1) return a.localeCompare(b);
  if (ai === -1) return 1;
  if (bi === -1) return -1;
  return ai - bi;
}

// Suggestions for the admin product form's size field (a <datalist>, not a
// closed dropdown — staff can still type anything custom). Consistent
// spelling here means the storefront's size filter doesn't end up with
// near-duplicate chips like "5xl" and "5XL" for the same real size.
export const SIZE_SUGGESTIONS = [
  ...ADULT_SIZES.map((s) => s.size),
  ...KIDS_SIZES.map((s) => s.size),
  "One Size",
];
