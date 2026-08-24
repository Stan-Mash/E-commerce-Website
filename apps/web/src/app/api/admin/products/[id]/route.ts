import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";
import { syncProductImages, resolveImageList, syncProductVideos, resolveVideoList } from "@/lib/productImages";
import { recordAudit, getOperator } from "@/lib/audit";
import { withApiErrorHandling } from "@/lib/apiErrorHandler";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

function checkAuth(request: NextRequest): boolean {
  return isAuthenticatedAdminRequest(request);
}

const SkuInputSchema = z.object({
  id: z.string().optional(),
  sku_code: z.string(),
  size: z.string(),
  color: z.string().optional(),
  color_hex: z.string().optional(),
  stock_quantity: z.coerce.number().optional(),
});

const ProductPutSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  category: z.string(),
  base_price: z.coerce.number(),
  compare_price: z.coerce.number().nullable().optional(),
  material: z.string().nullable().optional(),
  care_instructions: z.string().nullable().optional(),
  is_featured: z.boolean().optional(),
  status: z.string().optional(),
  skus: z.array(SkuInputSchema).optional(),
  images: z.array(z.unknown()).optional(),
  image_url: z.unknown().optional(),
  videos: z.array(z.unknown()).optional(),
});

const ProductPatchSchema = z.object({
  status: z.string(),
});

export const GET = withApiErrorHandling("admin/products/[id] GET", async (
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) => {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const params = await paramsPromise;
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, skus(*), product_images(id, url, alt, sort_order, media_type), product_videos(id, cloudinary_url, sort_order)")
    .eq("id", params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ product: data });
});

export const PUT = withApiErrorHandling("admin/products/[id] PUT", async (
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) => {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const params = await paramsPromise;
  let jsonBody: unknown;
  try {
    jsonBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parseResult = ProductPutSchema.safeParse(jsonBody);
  if (!parseResult.success) {
    return NextResponse.json({ error: "Validation failed", details: parseResult.error.flatten() }, { status: 422 });
  }
  const body = parseResult.data;
  const {
    name,
    slug,
    description,
    category,
    base_price,
    compare_price,
    material,
    care_instructions,
    is_featured,
    status,
    skus: skuList,
  } = body;

  const supabase = createAdminSupabaseClient();
  const normalizedCategory = category.toLowerCase();

  // Resolve the full ordered image list (new `images` array, or legacy single
  // `image_url`). products.image_url stays as the primary for card thumbnails.
  const imageList = resolveImageList(body);
  const primaryImageUrl = imageList ? (imageList[0] ?? null) : undefined;

  const { data: product, error: productError } = await supabase
    .from("products")
    .update({
      name,
      slug,
      description: description ?? null,
      category: normalizedCategory,
      base_price: Number(base_price),
      compare_price: compare_price ? Number(compare_price) : null,
      material: material ?? null,
      care_instructions: care_instructions ?? null,
      is_featured: Boolean(is_featured),
      status: status ?? "draft",
      image_url: primaryImageUrl,
    })
    .eq("id", params.id)
    .select()
    .single();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  await recordAudit(supabase, {
    actor: getOperator(request),
    action: "product.update",
    entity: "product",
    entityId: params.id,
    detail: { name, base_price: Number(base_price), status: status ?? "draft" },
  });

  // Replace the product's gallery with the submitted images.
  if (imageList !== undefined) {
    await syncProductImages(supabase, params.id, imageList, name ?? null);
  }
  const videoList = resolveVideoList(body);
  if (videoList !== undefined) {
    await syncProductVideos(supabase, params.id, videoList);
  }

  // Reconcile SKUs in place. A blind delete-all + insert-all breaks when a SKU
  // is referenced by order_items / inventory_log (no cascade): the delete fails
  // and the re-insert collides on the unique sku_code. Instead: update existing
  // SKUs (matched by id, then sku_code), insert new ones, and delete only those
  // removed from the form that aren't FK-protected.
  if (Array.isArray(skuList)) {
    type SkuInput = {
      id?: string;
      sku_code: string;
      size: string;
      color?: string;
      color_hex?: string;
      stock_quantity?: number;
    };

    const { data: existingSkus, error: existingErr } = await supabase
      .from("skus")
      .select("id, sku_code")
      .eq("product_id", params.id);
    if (existingErr) {
      return NextResponse.json({ error: existingErr.message }, { status: 500 });
    }

    const idSet = new Set((existingSkus ?? []).map((s) => s.id));
    const codeToId = new Map((existingSkus ?? []).map((s) => [s.sku_code, s.id]));
    const keptIds = new Set<string>();
    // Requested quantity per SKU id, from the form input directly — not
    // re-read from skus.stock_quantity afterward. inventory_levels is the
    // only thing this route writes a real quantity to; skus.stock_quantity
    // is left for the DB trigger (see migration 006) to compute from it.
    // Previously this route set stock_quantity directly here *and* tried to
    // mirror it into inventory_levels in a second step — two writers of the
    // same fact that can silently drift apart if the second step's location
    // lookup ever fails again (as it did for months: see the "Main
    // Warehouse" -> "CBD Store" rename bug fixed alongside this change).
    // With one writer, a broken location lookup now makes the admin form
    // show 0 immediately — visibly wrong instead of silently wrong.
    const requestedQuantity = new Map<string, number>();

    for (const sku of skuList as SkuInput[]) {
      const row = {
        product_id: params.id,
        sku_code: sku.sku_code,
        size: sku.size,
        color: sku.color ?? null,
        color_hex: sku.color_hex ?? null,
      };
      const quantity = Number(sku.stock_quantity ?? 0);

      const matchId =
        (sku.id && idSet.has(sku.id) ? sku.id : undefined) ??
        codeToId.get(sku.sku_code);

      if (matchId) {
        keptIds.add(matchId);
        requestedQuantity.set(matchId, quantity);
        const { error } = await supabase.from("skus").update(row).eq("id", matchId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      } else {
        const { data: inserted, error } = await supabase
          .from("skus")
          .insert({ ...row, stock_quantity: 0 })
          .select("id")
          .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        if (inserted) {
          keptIds.add(inserted.id);
          requestedQuantity.set(inserted.id, quantity);
        }
      }
    }

    // Delete SKUs the admin removed. Tolerate FK errors: a SKU referenced by an
    // order or inventory log must stay so historical records aren't corrupted.
    for (const s of existingSkus ?? []) {
      if (keptIds.has(s.id)) continue;
      const { error } = await supabase.from("skus").delete().eq("id", s.id);
      if (error) {
        console.warn(`[products PUT] kept SKU ${s.id} (referenced by history): ${error.message}`);
      }
    }

    // Write the store location's inventory_levels — what checkout_and_
    // reserve_stock and pos_checkout actually read and decrement. The
    // trigger from migration 006 recomputes skus.stock_quantity (the
    // display-only cached aggregate the admin form and storefront listing
    // read) from this automatically. Looked up by type, not a hardcoded
    // name, since migration 020 renamed the only location from
    // "Main Warehouse" to "CBD Store".
    if (requestedQuantity.size > 0) {
      const { data: warehouse } = await supabase
        .from("locations")
        .select("id")
        .eq("type", "store")
        .limit(1)
        .single();
      if (warehouse) {
        await supabase.from("inventory_levels").upsert(
          [...requestedQuantity.entries()].map(([skuId, quantity]) => ({
            sku_id: skuId,
            location_id: warehouse.id,
            quantity,
          })),
          { onConflict: "sku_id,location_id" }
        );
      } else {
        console.error("[products PUT] No active store location found — inventory_levels not synced for", params.id);
      }
    }
  }

  return NextResponse.json({ product });
});

// PATCH — partial update, used for bulk status changes from the products table.
export const PATCH = withApiErrorHandling("admin/products/[id] PATCH", async (
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) => {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const params = await paramsPromise;
  let jsonBody: unknown;
  try {
    jsonBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parseResult = ProductPatchSchema.safeParse(jsonBody);
  if (!parseResult.success) {
    return NextResponse.json({ error: "Validation failed", details: parseResult.error.flatten() }, { status: 422 });
  }
  const body = parseResult.data;
  const VALID = ["active", "draft", "coming_soon", "archived"];
  if (!body.status || !VALID.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("products")
    .update({ status: body.status })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
});

// Products are NEVER hard-deleted - doing so would cascade to SKUs and break
// order_items foreign keys, corrupting historical financial records.
// Instead we archive: the product is hidden from the storefront (RLS policy
// only exposes status='active') while all historical order data remains intact.
export const DELETE = withApiErrorHandling("admin/products/[id] DELETE", async (
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) => {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const params = await paramsPromise;
  const supabase = createAdminSupabaseClient();

  // Soft-delete: set status to 'archived' - never a hard DELETE
  const { error } = await supabase
    .from("products")
    .update({ status: "archived" })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordAudit(supabase, {
    actor: getOperator(request),
    action: "product.archive",
    entity: "product",
    entityId: params.id,
  });

  return NextResponse.json({ ok: true });
});
