/**
 * Seed script — run with:
 *   npx tsx packages/lib/src/seed/index.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment.
 */
import { createClient } from "@supabase/supabase-js";

// Not typed against Database here: that hand-maintained type only declares
// Tables (no Views/Functions/Enums/CompositeTypes), which newer
// @supabase/supabase-js generics require for .from() to infer correctly —
// PRODUCTS below is also a union of slightly different literal shapes, which
// the same generic can't resolve either. Both push overload resolution to a
// `never[]` dead end. This is a manually-run seeding script, not app runtime
// code, so plain (unparameterized) typing is the pragmatic tradeoff.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SeedSku {
  size: string;
  color: string;
  color_hex: string;
  stock_quantity: number;
  sku_code: string;
}

interface SeedImage {
  url: string;
  alt: string;
  sort_order: number;
}

interface SeedProduct {
  name: string;
  slug: string;
  category: string;
  description: string;
  base_price: number;
  compare_price: number | null;
  material: string;
  care_instructions: string;
  is_featured: boolean;
  status: "active";
  skus: SeedSku[];
  video_url: string;
  video_public_id: string;
  thumbnail_url: string;
  images: SeedImage[];
}

const PRODUCTS: SeedProduct[] = [
  {
    name: "Kikoy Wrap Dress",
    slug: "kikoy-wrap-dress",
    category: "women",
    description:
      "Hand-loomed kikoy fabric wrap dress in vibrant coastal Kenya stripe patterns. Lightweight and breathable — perfect for Nairobi days and Mombasa evenings.",
    base_price: 3800,
    compare_price: 4500,
    material: "100% Cotton Kikoy",
    care_instructions: "Hand wash cold. Lay flat to dry. Iron on low.",
    is_featured: true,
    status: "active" as const,
    skus: [
      { size: "XS", color: "Blue/White", color_hex: "#1a6eb5", stock_quantity: 5, sku_code: "KWD-XS-BW" },
      { size: "S", color: "Blue/White", color_hex: "#1a6eb5", stock_quantity: 8, sku_code: "KWD-S-BW" },
      { size: "M", color: "Blue/White", color_hex: "#1a6eb5", stock_quantity: 10, sku_code: "KWD-M-BW" },
      { size: "L", color: "Blue/White", color_hex: "#1a6eb5", stock_quantity: 6, sku_code: "KWD-L-BW" },
      { size: "XL", color: "Blue/White", color_hex: "#1a6eb5", stock_quantity: 3, sku_code: "KWD-XL-BW" },
      { size: "XS", color: "Red/Black", color_hex: "#c0392b", stock_quantity: 4, sku_code: "KWD-XS-RB" },
      { size: "S", color: "Red/Black", color_hex: "#c0392b", stock_quantity: 7, sku_code: "KWD-S-RB" },
      { size: "M", color: "Red/Black", color_hex: "#c0392b", stock_quantity: 9, sku_code: "KWD-M-RB" },
    ],
    // Cloudinary video URL — replace with your actual Cloudinary upload
    video_url: "https://res.cloudinary.com/demo/video/upload/sp_hd/elephants.mp4",
    video_public_id: "demo/elephants",
    thumbnail_url: "https://res.cloudinary.com/demo/video/upload/so_0/elephants.jpg",
    // Placeholder image from Cloudinary demo
    images: [
      {
        url: "https://res.cloudinary.com/demo/image/upload/w_800,h_1067,c_fill,g_auto/fashion/woman_dress_1.jpg",
        alt: "Kikoy Wrap Dress — Blue/White front view",
        sort_order: 0,
      },
      {
        url: "https://res.cloudinary.com/demo/image/upload/w_800,h_1067,c_fill,g_auto/fashion/woman_dress_2.jpg",
        alt: "Kikoy Wrap Dress — detail view",
        sort_order: 1,
      },
    ],
  },
  {
    name: "Maasai Bead Collar Shirt",
    slug: "maasai-bead-collar-shirt",
    category: "men",
    description:
      "Contemporary slim-fit shirt with hand-stitched Maasai bead collar detail. Crafted from premium organic cotton grown in Rift Valley.",
    base_price: 4200,
    compare_price: null,
    material: "100% Organic Cotton",
    care_instructions: "Machine wash cold, delicate cycle. Tumble dry low.",
    is_featured: true,
    status: "active" as const,
    skus: [
      { size: "S", color: "White", color_hex: "#ffffff", stock_quantity: 12, sku_code: "MBS-S-W" },
      { size: "M", color: "White", color_hex: "#ffffff", stock_quantity: 15, sku_code: "MBS-M-W" },
      { size: "L", color: "White", color_hex: "#ffffff", stock_quantity: 10, sku_code: "MBS-L-W" },
      { size: "XL", color: "White", color_hex: "#ffffff", stock_quantity: 8, sku_code: "MBS-XL-W" },
      { size: "S", color: "Cream", color_hex: "#f5f0e8", stock_quantity: 6, sku_code: "MBS-S-C" },
      { size: "M", color: "Cream", color_hex: "#f5f0e8", stock_quantity: 9, sku_code: "MBS-M-C" },
    ],
    video_url: "https://res.cloudinary.com/demo/video/upload/sp_hd/elephants.mp4",
    video_public_id: "demo/elephants_men",
    thumbnail_url: "https://res.cloudinary.com/demo/video/upload/so_0/elephants.jpg",
    images: [
      {
        url: "https://res.cloudinary.com/demo/image/upload/w_800,h_1067,c_fill,g_auto/fashion/man_shirt_1.jpg",
        alt: "Maasai Bead Collar Shirt — White front view",
        sort_order: 0,
      },
    ],
  },
  {
    name: "Ankara Print Kids Jumpsuit",
    slug: "ankara-print-kids-jumpsuit",
    category: "children",
    description:
      "Playful and durable Ankara print jumpsuit for active kids. Elastic waist and snap buttons for easy dressing.",
    base_price: 1800,
    compare_price: 2200,
    material: "Cotton-Ankara blend",
    care_instructions: "Machine wash 30°C. Do not bleach.",
    is_featured: true,
    status: "active" as const,
    skus: [
      { size: "2Y", color: "Yellow/Green", color_hex: "#f1c40f", stock_quantity: 8, sku_code: "APJ-2Y-YG" },
      { size: "3Y", color: "Yellow/Green", color_hex: "#f1c40f", stock_quantity: 10, sku_code: "APJ-3Y-YG" },
      { size: "4Y", color: "Yellow/Green", color_hex: "#f1c40f", stock_quantity: 7, sku_code: "APJ-4Y-YG" },
      { size: "5Y", color: "Yellow/Green", color_hex: "#f1c40f", stock_quantity: 5, sku_code: "APJ-5Y-YG" },
      { size: "6Y", color: "Yellow/Green", color_hex: "#f1c40f", stock_quantity: 4, sku_code: "APJ-6Y-YG" },
    ],
    video_url: "https://res.cloudinary.com/demo/video/upload/sp_hd/elephants.mp4",
    video_public_id: "demo/elephants_kids",
    thumbnail_url: "https://res.cloudinary.com/demo/video/upload/so_0/elephants.jpg",
    images: [
      {
        url: "https://res.cloudinary.com/demo/image/upload/w_800,h_1067,c_fill,g_auto/fashion/kids_jumpsuit.jpg",
        alt: "Ankara Print Kids Jumpsuit",
        sort_order: 0,
      },
    ],
  },
];

async function seed() {
  console.log("🌱 Starting seed...");

  for (const product of PRODUCTS) {
    const { skus, images, video_url, video_public_id, thumbnail_url, ...productData } = product;

    // Upsert product
    const { data: p, error: pErr } = await supabase
      .from("products")
      .upsert(productData, { onConflict: "slug" })
      .select("id")
      .single();

    if (pErr || !p) {
      console.error(`Failed to upsert product ${product.slug}:`, pErr);
      continue;
    }
    console.log(`  ✅ Product: ${product.name} (${p.id})`);

    // Upsert SKUs
    for (const sku of skus) {
      const { error: sErr } = await supabase
        .from("skus")
        .upsert({ ...sku, product_id: p.id }, { onConflict: "sku_code" });
      if (sErr) console.error(`  ❌ SKU ${sku.sku_code}:`, sErr);
    }
    console.log(`  ✅ ${skus.length} SKUs seeded`);

    // Upsert images
    for (const image of images) {
      await supabase.from("product_images").upsert(
        { ...image, product_id: p.id, media_type: "image" },
        { onConflict: "product_id,sort_order" }
      );
    }
    console.log(`  ✅ ${images.length} images seeded`);

    // Upsert video
    await supabase.from("product_videos").upsert(
      {
        product_id: p.id,
        cloudinary_url: video_url,
        cloudinary_public_id: video_public_id,
        thumbnail_url,
        sort_order: 0,
      },
      { onConflict: "product_id,sort_order" }
    );
    console.log(`  ✅ Video seeded`);
  }

  console.log("\n🎉 Seed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
