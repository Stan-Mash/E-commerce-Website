import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const revalidate = 300;

// GET /api/pickup-points — active pickup locations for the checkout selector.
export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ points: [] });
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("pickup_points")
    .select("id, name, area, address, fee")
    .eq("active", true)
    .order("area")
    .order("name");

  if (error) {
    // Table missing (migration 017 not applied) — checkout falls back to plain pickup.
    return NextResponse.json({ points: [] });
  }
  return NextResponse.json({ points: data ?? [] });
}
