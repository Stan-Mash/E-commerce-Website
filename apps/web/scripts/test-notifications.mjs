#!/usr/bin/env node
/**
 * Triggers the notification cron on demand so the SMS/WhatsApp path can be
 * verified without waiting for the daily 00:00 schedule in vercel.json.
 *
 * Usage:
 *   CRON_SECRET=... node scripts/test-notifications.mjs [--url https://...]
 *
 * The secret is read from the environment, never passed as an argument, so it
 * does not land in shell history or the process list.
 */

const args = process.argv.slice(2);
const urlFlag = args.indexOf("--url");
const base = (urlFlag !== -1 && args[urlFlag + 1])
  || process.env.NEXT_PUBLIC_SITE_URL
  || "https://e-commerce-website-web.vercel.app";

const secret = process.env.CRON_SECRET;
if (!secret) {
  console.error("CRON_SECRET is not set.\n");
  console.error("Pull it from Vercel without printing it:");
  console.error("  npx vercel env pull .env.cron --environment=production");
  console.error("then run this with that value in the environment.");
  process.exit(1);
}

const endpoint = `${base.replace(/\/$/, "")}/api/cron/notifications`;
console.log(`GET ${endpoint}`);

const started = Date.now();
let res;
try {
  // The route exports GET only (Vercel Cron issues GET), so a POST here
  // would 405 without ever reaching the auth check.
  res = await fetch(endpoint, {
    method: "GET",
    headers: { Authorization: `Bearer ${secret}` },
  });
} catch (err) {
  console.error(`\nRequest failed: ${err.message}`);
  process.exit(1);
}

const elapsed = Date.now() - started;
const body = await res.text();
console.log(`HTTP ${res.status} in ${elapsed}ms\n`);

if (res.status === 401) {
  console.error("Unauthorized. CRON_SECRET does not match production.");
  process.exit(1);
}

let data;
try { data = JSON.parse(body); } catch { console.log(body.slice(0, 600)); process.exit(res.ok ? 0 : 1); }
console.log(JSON.stringify(data, null, 2).slice(0, 1500));

// The cron reports per-job outcomes. Zero processed is the expected result on
// a quiet queue and is NOT a failure, so say so rather than looking broken.
const processed = data.processed ?? data.total ?? 0;
if (processed === 0) {
  console.log("\nNo queued jobs. The endpoint is reachable and authorised.");
  console.log("To exercise a real send, place a test order so a notification");
  console.log("job is queued, then run this again.");
} else {
  console.log(`\nProcessed ${processed} job(s). Check 'succeeded' vs 'failed' above.`);
  console.log("A failure naming Africa's Talking means the credentials are");
  console.log("missing or the account has no credit.");
}
