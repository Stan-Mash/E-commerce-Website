import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** GET → all reviews (newest first), with product name, for moderation. */
export async function GET(request: NextRequest) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = db();
  const { data, error } = await supabase
    .from("product_reviews")
    .select("id, product_id, author_name, rating, title, body, is_approved, created_at, product:products(name, slug)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data ?? [] });
}

/** PATCH { id, is_approved } → approve / unapprove a review. */
export async function PATCH(request: NextRequest) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, is_approved } = (await request.json()) as { id: string; is_approved: boolean };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const supabase = db();
  const { error } = await supabase.from("product_reviews").update({ is_approved: !!is_approved }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** DELETE ?id=... → remove a review. */
export async function DELETE(request: NextRequest) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const supabase = db();
  const { error } = await supabase.from("product_reviews").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
