import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";
import { syncProductImages, resolveImageList, syncProductVideos, resolveVideoList } from "@/lib/productImages";
import { withApiErrorHandling } from "@/lib/apiErrorHandler";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

function checkAuth(request: NextRequest): boolean {
  return isAuthenticatedAdminRequest(request);
}

const SkuInputSchema = z.object({
  sku_code: z.string(),
  size: z.string(),
  color: z.string().optional(),
  color_hex: z.string().optional(),
  stock_quantity: z.coerce.number().optional(),
});

const ProductSchema = z.object({
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

export const GET = withApiErrorHandling("admin/products GET", async (request: NextRequest) => {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ products: [] });
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, skus(*)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ products: data ?? [] });
});

export const POST = withApiErrorHandling("admin/products POST", async (request: NextRequest) => {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  let jsonBody: unknown;
  try {
    jsonBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parseResult = ProductSchema.safeParse(jsonBody);
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

  // Normalize category to lowercase for DB constraint
  const normalizedCategory = category.toLowerCase();

  // Resolve the full ordered image list; first image is the primary thumbnail.
  const imageList = resolveImageList(body) ?? [];

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
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
      image_url: imageList[0] ?? null,
    })
    .select()
    .single();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  // Populate the product's gallery.
  if (imageList.length > 0) {
    await syncProductImages(supabase, product.id, imageList, name ?? null);
  }
  const videoList = resolveVideoList(body);
  if (videoList && videoList.length > 0) {
    await syncProductVideos(supabase, product.id, videoList);
  }

  // Insert SKUs, then write their real stock to inventory_levels — the DB
  // trigger from migration 006 recomputes skus.stock_quantity (the
  // display-only cached aggregate the admin form and storefront listing
  // read) from inventory_levels automatically. Every SKU is inserted with
  // stock_quantity: 0 here on purpose: inventory_levels is the only place
  // this route writes a real quantity, so a broken location lookup below
  // fails visibly (shows 0 everywhere) instead of silently drifting from
  // what checkout actually sees — which is exactly how this bug hid for
  // months under the old two-writer version of this code.
  if (Array.isArray(skuList) && skuList.length > 0) {
    type SkuInput = {
      sku_code: string;
      size: string;
      color?: string;
      color_hex?: string;
      stock_quantity?: number;
    };
    const inputRows = skuList as SkuInput[];
    const skuRows = inputRows.map((sku) => ({
      product_id: product.id,
      sku_code: sku.sku_code,
      size: sku.size,
      color: sku.color ?? null,
      color_hex: sku.color_hex ?? null,
      stock_quantity: 0,
    }));

    const { data: insertedSkus, error: skuError } = await supabase
      .from("skus")
      .insert(skuRows)
      .select("id");
    if (skuError) {
      return NextResponse.json({ error: skuError.message }, { status: 500 });
    }

    // Looked up by type, not a hardcoded name: migration 020 renamed the only
    // location from "Main Warehouse" to "CBD Store", and a stale lookup by
    // that old name was what caused newly added stock to display as in
    // stock while being unbuyable at actual checkout.
    if (insertedSkus && insertedSkus.length > 0) {
      const { data: warehouse } = await supabase
        .from("locations")
        .select("id")
        .eq("type", "store")
        .limit(1)
        .single();

      if (warehouse) {
        // A single multi-row insert with no ON CONFLICT returns rows in the
        // same order they were given, so zipping by index against the
        // original input is safe here.
        const levelRows = insertedSkus.map((s, i) => ({
          sku_id: s.id,
          location_id: warehouse.id,
          quantity: Number(inputRows[i]?.stock_quantity ?? 0),
        }));
        await supabase.from("inventory_levels").upsert(levelRows, {
          onConflict: "sku_id,location_id",
        });
      } else {
        // Never fail the whole save over this, but make sure it's loud
        // somewhere — this exact silent no-op is what caused newly added
        // stock to look available while being unbuyable.
        console.error("[products POST] No active store location found — inventory_levels not created for", product.id);
      }
    }
  }

  return NextResponse.json({ product }, { status: 201 });
});
