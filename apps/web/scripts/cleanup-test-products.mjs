/**
 * Remove placeholder / test products from the catalogue (e.g. "Test Image
 * Product"). Idempotent and safe — only matches obvious test names.
 *
 * Usage (from apps/web):  node scripts/cleanup-test-products.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const line of (() => { try { return fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split("\n"); } catch { return []; } })()) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error("✗ Missing Supabase env. Run `vercel env pull .env.local`."); process.exit(1); }

const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

const { data, error } = await supabase
  .from("products")
  .select("id, name")
  .or("name.ilike.%test%,name.ilike.%placeholder%,name.ilike.%sample%");

if (error) { console.error("✗", error.message); process.exit(1); }
if (!data || data.length === 0) { console.log("No test products found. Nothing to do."); process.exit(0); }

for (const p of data) {
  // Cascades to skus/images via FK on delete cascade.
  const { error: delErr } = await supabase.from("products").delete().eq("id", p.id);
  console.log(delErr ? `✗ ${p.name}: ${delErr.message}` : `✓ deleted "${p.name}"`);
}
console.log(`\nDone. Removed ${data.length} test product(s).`);
