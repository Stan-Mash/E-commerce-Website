# EliteStyle — Deployment & Setup Notes

This change set adds card payments, CBD-based delivery, a Coming Soon
collection, product reviews, real search, urgency badges, and hardens admin
auth. A few **manual steps** are required because the database and secrets
live in Supabase/Vercel, not in this repo.

## 1. Set environment variables in Vercel
Project → Settings → Environment Variables (Production + Preview):

| Variable | Value | Notes |
|---|---|---|
| `ADMIN_PASSWORD` | your admin password | **Required** — no fallback now |
| `ADMIN_SESSION_TOKEN` | `openssl rand -hex 32` | **Required** — admin locks out if unset |
| `OWNER_SESSION_TOKEN` | `openssl rand -hex 32` | finance module |
| `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY` | `FLWPUBK-...` | enables Card option in UI |
| `FLUTTERWAVE_SECRET_KEY` | `FLWSECK-...` | server-side |
| `FLUTTERWAVE_WEBHOOK_HASH` | your webhook secret | set the same value in the Flutterwave dashboard |
| `NEXT_PUBLIC_MPESA_PAYBILL` | your Paybill number | enables Paybill option |
| `NEXT_PUBLIC_MPESA_PAYBILL_NAME` | `Elite Style Co.` | |
| `DELIVERY_FEE_OUTSIDE_CBD` | `300` | server fee |
| `NEXT_PUBLIC_DELIVERY_FEE_OUTSIDE_CBD` | `300` | shown in checkout UI |

> After changing `ADMIN_SESSION_TOKEN`, everyone is logged out — log in again.

In the **Flutterwave dashboard** → Settings → Webhooks, set the URL to
`https://<your-domain>/api/webhooks/flutterwave` and the secret hash to the
same value as `FLUTTERWAVE_WEBHOOK_HASH`.

## 2. Run database migrations
Supabase Dashboard → SQL Editor, run in order:
- `apps/web/supabase/migrations/012_coming_soon_status.sql`
- `apps/web/supabase/migrations/013_product_reviews.sql`

## 3. Import Coming Soon products + remove test product
From `apps/web` with production env pulled:
```bash
vercel env pull .env.local      # pulls real secrets locally
node scripts/import-coming-soon.mjs
node scripts/cleanup-test-products.mjs
```
The 45 source images are already committed to
`apps/web/public/products/coming-soon/`, so no cloud upload is needed.

## 4. Deploy
Push to `main` (or `vercel --prod`). Verify:
- Search returns real products (try "tweed", "bag").
- `/coming-soon` shows the 16 new items with the badge.
- Checkout shows Pickup / CBD (free) / Outside CBD (fee) + M-Pesa / Paybill / Card.
- Admin → Reviews moderates submissions.

## What changed (summary)
- **Security:** removed hardcoded admin token/password; env-driven, fail-closed (`lib/adminAuth.ts`).
- **Search:** real DB full-text search (`/api/search`).
- **Checkout:** verifies payment by polling order status; no more 8s guess.
- **Delivery:** free in Nairobi CBD, flat fee outside (`lib/delivery.ts`).
- **Payments:** Flutterwave cards/local methods + Paybill alongside M-Pesa STK.
- **Coming Soon:** `coming_soon` status, `/coming-soon` page, no add-to-cart.
- **SHEIN features:** product filters (size/colour/price/in-stock), low-stock urgency badges, reviews & ratings.
- **Honesty:** removed false "500+ Styles" / "free delivery across Kenya" claims.
