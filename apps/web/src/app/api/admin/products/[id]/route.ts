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
  const session = request.cookies.get("admin_session");
  return session?.value === "elite-admin-2024";
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
    .select("*, skus(*)")
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
    })
    .eq("id", params.id)
    .select()
    .single();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  // Replace SKUs if provided
  if (Array.isArray(skuList)) {
    // Delete existing SKUs
    await supabase.from("skus").delete().eq("product_id", params.id);

    if (skuList.length > 0) {
      const skuRows = skuList.map((sku: {
        sku_code: string;
        size: string;
        color?: string;
        color_hex?: string;
        stock_quantity?: number;
      }) => ({
        product_id: params.id,
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
  }

  return NextResponse.json({ product });
}

// Products are NEVER hard-deleted — doing so would cascade to SKUs and break
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

  // Soft-delete: set status to 'archived' — never a hard DELETE
  const { error } = await supabase
    .from("products")
    .update({ status: "archived" })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
