/**
 * Import the "Coming Soon" collection into Supabase.
 *
 * - Idempotent: re-running updates existing rows (matched by slug) instead of
 *   duplicating. Safe to run multiple times.
 * - Inserts each product with status 'coming_soon', one image per colour
 *   variant, and one SKU per colour (size "One Size", stock 0 — not for sale yet).
 *
 * Requires (read from apps/web/.env.local, or the shell environment):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage (from apps/web):
 *   node scripts/import-coming-soon.mjs
 *
 * If your local .env.local has empty values, pull them first:
 *   vercel env pull .env.local
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// --- Load env (.env.local) without a dependency ---
function loadEnv(file) {
  try {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
      }
    }
  } catch {}
}
loadEnv(path.join(ROOT, ".env.local"));

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("✗ Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  console.error("  Run `vercel env pull .env.local` (from apps/web) first.");
  process.exit(1);
}

const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

const catalog = JSON.parse(
  fs.readFileSync(path.join(ROOT, "scripts-coming-soon.json"), "utf8")
);

function skuCode(slug, color) {
  return `${slug}-${color}`.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/-+/g, "-").slice(0, 48);
}

let created = 0, updated = 0;

for (const p of catalog) {
  // Upsert product by slug.
  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("slug", p.slug)
    .maybeSingle();

  const productRow = {
    name: p.name,
    slug: p.slug,
    category: p.category,
    base_price: p.price,
    compare_price: null,
    description: `${p.name} — launching soon at Elite Style Co. Available in ${p.variants.map((v) => v.color).join(", ")}.`,
    status: "coming_soon",
    is_featured: false,
  };

  let productId;
  if (existing) {
    const { error } = await supabase.from("products").update(productRow).eq("id", existing.id);
    if (error) { console.error(`✗ update ${p.slug}:`, error.message); continue; }
    productId = existing.id;
    updated++;
    // Clear old images/skus so re-runs stay clean.
    await supabase.from("product_images").delete().eq("product_id", productId);
    await supabase.from("skus").delete().eq("product_id", productId);
  } else {
    const { data, error } = await supabase.from("products").insert(productRow).select("id").single();
    if (error) { console.error(`✗ insert ${p.slug}:`, error.message); continue; }
    productId = data.id;
    created++;
  }

  // Images — one per colour variant.
  const images = p.variants.map((v, i) => ({
    product_id: productId,
    url: v.image,
    alt: `${p.name} — ${v.color}`,
    sort_order: i,
  }));
  const { error: imgErr } = await supabase.from("product_images").insert(images);
  if (imgErr) console.error(`  ! images ${p.slug}:`, imgErr.message);

  // SKUs — one per colour, stock 0 (not purchasable until launch).
  const skus = p.variants.map((v) => ({
    product_id: productId,
    sku_code: skuCode(p.slug, v.color),
    size: "One Size",
    color: v.color,
    stock_quantity: 0,
  }));
  const { error: skuErr } = await supabase.from("skus").insert(skus);
  if (skuErr) console.error(`  ! skus ${p.slug}:`, skuErr.message);

  console.log(`✓ ${p.slug} (${p.variants.length} variants)`);
}

console.log(`\nDone. Created ${created}, updated ${updated}, total ${catalog.length}.`);
