import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function checkAuth(request: NextRequest): boolean {
  const session = request.cookies.get("admin_session")?.value === "elite-admin-2024";
  const token   = request.cookies.get("admin_token")?.value   === "elite-admin-2024";
  const header  = request.headers.get("x-admin-token")        === "elite-admin-2024";
  return session || token || header;
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
    })
    .select()
    .single();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  // Insert SKUs if provided
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

    const { error: skuError } = await supabase.from("skus").insert(skuRows);
    if (skuError) {
      return NextResponse.json({ error: skuError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ product }, { status: 201 });
}
