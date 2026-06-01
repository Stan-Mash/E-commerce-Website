import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";

function checkAuth(req: NextRequest): boolean {
  return isAuthenticatedAdminRequest(req);
}

// GET /api/admin/pos/shifts?location_id=xxx
// Returns the currently open shift for a location (if any)
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const locationId = req.nextUrl.searchParams.get("location_id");
  const supabase = createAdminSupabaseClient();

  const query = supabase
    .from("shifts")
    .select("*")
    .eq("status", "open")
    .order("opened_at", { ascending: false })
    .limit(1);

  if (locationId) query.eq("location_id", locationId);

  const { data, error } = await query.maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ shift: data });
}

// POST /api/admin/pos/shifts
// Body: { action: "open", location_id, cashier_name, opening_float }
//     | { action: "close", shift_id, closing_float }
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    action:        "open" | "close";
    location_id?:  string;
    cashier_name?: string;
    opening_float?: number;
    shift_id?:     string;
    closing_float?: number;
  };

  const supabase = createAdminSupabaseClient();

  if (body.action === "open") {
    const { location_id, cashier_name, opening_float = 0 } = body;
    if (!location_id || !cashier_name) {
      return NextResponse.json({ error: "location_id and cashier_name required" }, { status: 400 });
    }

    // Only one open shift per location
    const { data: existing } = await supabase
      .from("shifts")
      .select("id")
      .eq("status", "open")
      .eq("location_id", location_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "A shift is already open at this location" }, { status: 409 });
    }

    const { data, error } = await supabase
      .from("shifts")
      .insert({ location_id, cashier_name, opening_float })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ shift: data }, { status: 201 });
  }

  if (body.action === "close") {
    const { shift_id, closing_float } = body;
    if (!shift_id || closing_float === undefined) {
      return NextResponse.json({ error: "shift_id and closing_float required" }, { status: 400 });
    }

    // Calculate expected float: opening_float + sum of cash sales during shift
    const { data: shiftData } = await supabase
      .from("shifts")
      .select("opening_float, location_id, opened_at")
      .eq("id", shift_id)
      .single();

    if (!shiftData) return NextResponse.json({ error: "Shift not found" }, { status: 404 });

    const { data: cashSales } = await supabase
      .from("orders")
      .select("total")
      .eq("payment_method", "cash")
      .eq("location_id", shiftData.location_id)
      .eq("status", "paid")
      .gte("paid_at", shiftData.opened_at);

    const cashTotal = (cashSales ?? []).reduce((sum: number, o: { total: number }) => sum + o.total, 0);
    const expectedFloat = Math.round((shiftData.opening_float + cashTotal) * 100) / 100;
    const variance      = Math.round((closing_float - expectedFloat) * 100) / 100;

    const { data, error } = await supabase
      .from("shifts")
      .update({
        status:         "closed",
        closing_float,
        expected_float: expectedFloat,
        variance,
        closed_at:      new Date().toISOString(),
      })
      .eq("id", shift_id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ shift: data });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
