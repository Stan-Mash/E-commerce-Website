import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";
import { recordAudit, getOperator } from "@/lib/audit";
import { withApiErrorHandling } from "@/lib/apiErrorHandler";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

function checkAuth(request: NextRequest): boolean {
  return isAuthenticatedAdminRequest(request);
}

const StockAdjustSchema = z.object({
  sku_id: z.string(),
  delta: z.coerce.number(),
  reason: z.string().optional(),
});

export const GET = withApiErrorHandling("admin/stock GET", async (request: NextRequest) => {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ skus: [] });
  }

  const supabase = createAdminSupabaseClient();
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
});

export const POST = withApiErrorHandling("admin/stock POST", async (request: NextRequest) => {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  let jsonBody: unknown;
  try {
    jsonBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parseResult = StockAdjustSchema.safeParse(jsonBody);
  if (!parseResult.success) {
    return NextResponse.json({ error: "Validation failed", details: parseResult.error.flatten() }, { status: 422 });
  }
  const { sku_id, delta, reason } = parseResult.data;

  if (!sku_id || delta === undefined) {
    return NextResponse.json({ error: "sku_id and delta are required" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

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
});
