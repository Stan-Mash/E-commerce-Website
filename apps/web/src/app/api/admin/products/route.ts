import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";

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
    return NextResponse.json({ products: [] });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, skus(*)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ products: data ?? [] });
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
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
    image_url,
    skus: skuList,
  } = body;

  const supabase = getAdminClient();

  // Normalize category to lowercase for DB constraint
  const normalizedCategory = (category as string).toLowerCase();

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
      image_url: image_url ?? null,
    })
    .select()
    .single();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  // Sync primary image into product_images table (used by the public storefront)
  if (image_url) {
    await supabase.from("product_images").upsert(
      {
        product_id: product.id,
        url: image_url,
        alt: name ?? null,
        media_type: "image",
        sort_order: 0,
      },
      { onConflict: "product_id,sort_order" }
    );
  }

  // Insert SKUs + inventory_levels rows (so stock is tracked per location)
  if (Array.isArray(skuList) && skuList.length > 0) {
    const skuRows = skuList.map((sku: {
      sku_code: string;
      size: string;
      color?: string;
      color_hex?: string;
      stock_quantity?: number;
    }) => ({
      product_id: product.id,
      sku_code: sku.sku_code,
      size: sku.size,
      color: sku.color ?? null,
      color_hex: sku.color_hex ?? null,
      stock_quantity: Number(sku.stock_quantity ?? 0),
    }));

    const { data: insertedSkus, error: skuError } = await supabase
      .from("skus")
      .insert(skuRows)
      .select("id, stock_quantity");
    if (skuError) {
      return NextResponse.json({ error: skuError.message }, { status: 500 });
    }

    // Create inventory_levels rows for Main Warehouse so the checkout RPC
    // can reserve stock (it reads inventory_levels, not skus.stock_quantity).
    if (insertedSkus && insertedSkus.length > 0) {
      const { data: warehouse } = await supabase
        .from("locations")
        .select("id")
        .eq("name", "Main Warehouse")
        .single();

      if (warehouse) {
        const levelRows = insertedSkus.map((s) => ({
          sku_id: s.id,
          location_id: warehouse.id,
          quantity: s.stock_quantity,
        }));
        await supabase.from("inventory_levels").upsert(levelRows, {
          onConflict: "sku_id,location_id",
        });
      }
    }
  }

  return NextResponse.json({ product }, { status: 201 });
}
