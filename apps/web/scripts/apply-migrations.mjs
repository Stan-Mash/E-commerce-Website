// Applies pending SQL migrations to the linked Supabase project via the
// pg-meta query endpoint (service role auth). Idempotent migrations only.
// Usage: node scripts/apply-migrations.mjs [--probe]
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

// Minimal .env.local parser (no deps).
const env = {};
for (const line of readFileSync(resolve(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

async function runSQL(query) {
  const res = await fetch(`${URL_}/pg-meta/v0/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}`, apikey: KEY },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text.slice(0, 500) };
}

const probe = await runSQL("select 1 as ok");
console.log(`probe select 1 -> HTTP ${probe.status} ${probe.ok ? "OK" : probe.body}`);
if (!probe.ok || process.argv.includes("--probe")) process.exit(probe.ok ? 0 : 2);

const MIGRATIONS = [
  "014_newsletter_fulfilment_email.sql",
  "015_admin_audit_log.sql",
  "016_visual_search.sql",
  "017_pickup_points.sql",
];

for (const file of MIGRATIONS) {
  const sql = readFileSync(resolve(root, "supabase/migrations", file), "utf8");
  const r = await runSQL(sql);
  console.log(`${file} -> HTTP ${r.status} ${r.ok ? "APPLIED" : "FAILED: " + r.body}`);
}

// Verify the key objects now exist.
const checks = [
  ["newsletter_subscribers table", "select count(*) from newsletter_subscribers"],
  ["admin_audit_log table", "select count(*) from admin_audit_log"],
  ["orders.tracking_number column", "select tracking_number from orders limit 1"],
  ["pickup_points table", "select count(*) from pickup_points"],
  ["product_images.embedding column", "select count(*) from product_images where embedding is not null"],
  ["match RPC", "select count(*) from pg_proc where proname = 'match_products_by_embedding'"],
];
for (const [label, q] of checks) {
  const r = await runSQL(q);
  console.log(`verify ${label} -> ${r.ok ? "OK" : "MISSING (" + r.status + ")"}`);
}
