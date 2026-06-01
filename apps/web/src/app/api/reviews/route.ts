import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createPublicSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** GET /api/reviews?productId=... → approved reviews + aggregate rating. */
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }
  try {
    const supabase = createPublicSupabaseClient();
    const { data } = await supabase
      .from("product_reviews")
      .select("id, author_name, rating, title, body, created_at")
      .eq("product_id", productId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(50);

    const reviews = data ?? [];
    const count = reviews.length;
    const average =
      count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;

    return NextResponse.json({
      reviews,
      summary: { count, average: Math.round(average * 10) / 10 },
    });
  } catch {
    return NextResponse.json({ reviews: [], summary: { count: 0, average: 0 } });
  }
}

const ReviewSchema = z.object({
  productId: z.string().uuid(),
  authorName: z.string().min(2).max(60),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().max(1500).optional(),
});

/** POST /api/reviews → submit a review (held for admin approval). */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }
  try {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.from("product_reviews").insert({
      product_id: parsed.data.productId,
      author_name: parsed.data.authorName,
      rating: parsed.data.rating,
      title: parsed.data.title ?? null,
      body: parsed.data.body ?? null,
      is_approved: false,
    });
    if (error) return NextResponse.json({ error: "Could not save review" }, { status: 500 });
    return NextResponse.json({ ok: true, pending: true });
  } catch {
    return NextResponse.json({ error: "Could not save review" }, { status: 500 });
  }
}
