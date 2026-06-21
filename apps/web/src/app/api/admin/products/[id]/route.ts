import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";
import { syncProductImages, resolveImageList, syncProductVideos, resolveVideoList } from "@/lib/productImages";
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, skus(*), product_images(id, url, alt, sort_order, media_type), product_videos(id, cloudinary_url, sort_order)")
    .eq("id", params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ product: data });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const body = await request.json();
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

  const supabase = getAdminClient();
  const normalizedCategory = (category as string).toLowerCase();

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

    for (const sku of skuList as SkuInput[]) {
      const row = {
        product_id: params.id,
        sku_code: sku.sku_code,
        size: sku.size,
        color: sku.color ?? null,
        color_hex: sku.color_hex ?? null,
        stock_quantity: Number(sku.stock_quantity ?? 0),
      };

      const matchId =
        (sku.id && idSet.has(sku.id) ? sku.id : undefined) ??
        codeToId.get(sku.sku_code);

      if (matchId) {
        keptIds.add(matchId);
        const { error } = await supabase.from("skus").update(row).eq("id", matchId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      } else {
        const { data: inserted, error } = await supabase
          .from("skus")
          .insert(row)
          .select("id")
          .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        if (inserted) keptIds.add(inserted.id);
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

    // Sync Main Warehouse inventory_levels with the current SKU set.
    const { data: currentSkus } = await supabase
      .from("skus")
      .select("id, stock_quantity")
      .eq("product_id", params.id);
    if (currentSkus && currentSkus.length > 0) {
      const { data: warehouse } = await supabase
        .from("locations")
        .select("id")
        .eq("name", "Main Warehouse")
        .single();
      if (warehouse) {
        await supabase.from("inventory_levels").upsert(
          currentSkus.map((s) => ({
            sku_id: s.id,
            location_id: warehouse.id,
            quantity: s.stock_quantity,
          })),
          { onConflict: "sku_id,location_id" }
        );
      }
    }
  }

  return NextResponse.json({ product });
}

// PATCH — partial update, used for bulk status changes from the products table.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const body = await request.json() as { status?: string };
  const VALID = ["active", "draft", "coming_soon", "archived"];
  if (!body.status || !VALID.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { error } = await supabase
    .from("products")
    .update({ status: body.status })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// Products are NEVER hard-deleted - doing so would cascade to SKUs and break
// order_items foreign keys, corrupting historical financial records.
// Instead we archive: the product is hidden from the storefront (RLS policy
// only exposes status='active') while all historical order data remains intact.
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const supabase = getAdminClient();

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
}
