import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";
import { recordAudit, getOperator } from "@/lib/audit";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function checkAuth(request: NextRequest): boolean {
  return isAuthenticatedAdminRequest(request);
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ skus: [] });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("skus")
    .select(`
      id,
      sku_code,
      size,
      color,
      stock_quantity,
      products(id, name, base_price)
    `)
    .order("stock_quantity", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ skus: data ?? [] });
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const body = await request.json();
  const {
    sku_id,
    delta,
    reason,
  }: { sku_id: string; delta: number; reason: string } = body;

  if (!sku_id || delta === undefined) {
    return NextResponse.json({ error: "sku_id and delta are required" }, { status: 400 });
  }

  const supabase = getAdminClient();

  // Adjust via the RPC so inventory_levels is updated and the trigger keeps
  // skus.stock_quantity in sync. This is the single source of truth that
  // checkout and POS reserve against — updating skus directly (as before)
  // let the two drift apart. Fall back to a direct update only if the
  // multi-location infra isn't present.
  const { error: rpcError } = await supabase.rpc("increment_sku_stock", {
    p_sku_id: sku_id,
    p_delta: Number(delta),
  });

  if (rpcError) {
    const { data: sku, error: fetchError } = await supabase
      .from("skus")
      .select("stock_quantity")
      .eq("id", sku_id)
      .single();
    if (fetchError || !sku) {
      return NextResponse.json({ error: "SKU not found" }, { status: 404 });
    }
    const newQty = Math.max(0, sku.stock_quantity + Number(delta));
    const { error: updateError } = await supabase
      .from("skus")
      .update({ stock_quantity: newQty })
      .eq("id", sku_id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  // Audit log
  await supabase.from("inventory_log").insert({
    sku_id,
    delta: Number(delta),
    reason: reason ?? "adjustment",
    reference: null,
  });

  const { data: after } = await supabase
    .from("skus")
    .select("stock_quantity")
    .eq("id", sku_id)
    .single();

  await recordAudit(supabase, {
    actor: getOperator(request),
    action: "stock.adjust",
    entity: "sku",
    entityId: sku_id,
    detail: { delta: Number(delta), reason: reason ?? "adjustment", new_quantity: after?.stock_quantity ?? null },
  });

  return NextResponse.json({ ok: true, new_quantity: after?.stock_quantity ?? null });
}
