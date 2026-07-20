# Launch Checklist

Running list of manual / external steps discovered while implementing the
Elite Style Co. upgrade. Code changes are already shipped for everything
below — these are the account/config steps only a human can do.

## Immediate (needed for Phase 0 fixes to fully work in production)

- [ ] Set `NEXT_PUBLIC_SITE_URL` in Vercel (Production + Preview) to the real
      deployed origin (e.g. `https://e-commerce-website-web.vercel.app`, or
      the custom domain once it's connected — see below). Everything else
      (OG images, canonical tags, JSON-LD, robots.txt, sitemap.xml) derives
      from this one variable.
- [ ] Run the two new Supabase migrations (SQL Editor, in order — same
      process as existing migrations per `DEPLOY-NOTES.md`):
      - `apps/web/supabase/migrations/022_newsletter_discount_codes.sql`
      - `apps/web/supabase/migrations/023_equinox_reservations.sql`
      Until these run, newsletter signup still mints and emails a real
      promo code (the `promotions` table already exists) but won't
      remember which subscriber has which code; Equinox reservations will
      fail until `023` runs.
- [ ] Set `RESEND_API_KEY` + `EMAIL_FROM` if not already set, so the
      newsletter welcome-discount email and Equinox notification actually
      send (the code is still shown on-screen either way).

## Custom domain (elitestyle.co.ke)

- [ ] Register the domain (confirmed not yet registered).
- [ ] Point it at the Vercel project, add it in Vercel → Domains.
- [ ] Update `NEXT_PUBLIC_SITE_URL` to the new domain once DNS is live.

## Analytics & marketing pixels (all optional, all safe to leave unset)

Every one of these no-ops until you set its env var — nothing breaks or
shows partial/broken tracking in the meantime.

- [ ] Google Tag Manager: create a container at tagmanager.google.com,
      set `NEXT_PUBLIC_GTM_ID` (format `GTM-XXXXXXX`).
- [ ] GA4: create a property at analytics.google.com, set
      `NEXT_PUBLIC_GA_MEASUREMENT_ID` (format `G-XXXXXXXXXX`).
- [ ] Meta Pixel: create at business.facebook.com/events_manager, set
      `NEXT_PUBLIC_META_PIXEL_ID`.
- [ ] TikTok Pixel: create at ads.tiktok.com → Assets → Events, set
      `NEXT_PUBLIC_TIKTOK_PIXEL_ID`.
- [ ] Verify in GTM/GA4 debug view and Meta/TikTok pixel helper browser
      extensions that events fire through a full test purchase once IDs
      are set — the event contract is `view_item`, `add_to_cart`,
      `begin_checkout`, `add_payment_info`, `purchase`, `search`,
      `sign_up` (see `apps/web/src/lib/analytics.ts`).
- [ ] Note: pixels only load after a visitor clicks "Accept" on the cookie
      banner (decline-by-default) — this is intentional, not a bug.

## Google Merchant Center / TikTok Catalog (product feeds)

See `docs/MARKETING_SETUP.md` for the full walkthrough. Feed URLs:
- Google: `{SITE_URL}/api/feeds/google`
- TikTok: `{SITE_URL}/api/feeds/tiktok`

- [ ] Google Search Console: verify domain ownership, submit
      `{SITE_URL}/sitemap.xml`.
- [ ] Google Merchant Center: create account, register the Google feed URL
      as a scheduled fetch.
- [ ] TikTok Shop/Ads Catalog Manager: register the TikTok feed URL.
- [ ] Consider adding real GTIN/MPN per product later — the feed currently
      has no product identifiers, which can limit Shopping ad performance
      for apparel (not a hard validation blocker today).

## AI features (Phase 3)

**AI Stylist chat — built, ready to enable.**
- [ ] Get an Anthropic API key at console.anthropic.com, set
      `ANTHROPIC_API_KEY`. Calls the Messages API directly (no SDK), model
      configurable via `ANTHROPIC_MODEL` (defaults to `claude-sonnet-5`).
      Rate-limited 20 msgs/day per session+IP, only recommends real in-stock
      catalog items, no order data access. Fully inert (503 response) until
      the key is set — safe to deploy as-is.

**Virtual Try-On ("See it on you") — built, needs a smoke test before enabling.**
- [ ] Get a FASHN API account + billing (fashn.ai), set `FASHN_API_KEY`
      AND `TRYON_ENABLED=true` (both required — it's an explicit opt-in
      given this processes photos of real people, not just a missing-key
      no-op).
- [ ] **Important:** the FASHN integration (`apps/web/src/lib/tryon/provider.ts`)
      was written against FASHN's documented API contract but has not been
      tested against a live account — there was no API key available while
      building it. Before enabling in production: run one real try-on,
      confirm the job-start/status-poll shape matches what FASHN actually
      returns, and fix `provider.ts` if their contract has drifted from
      what's implemented (the interface is designed so only this one file
      needs to change).
- [ ] Once you've run a real try-on, check what domain FASHN's returned
      result-image URL is on, and add it to the `img-src` CSP directive in
      `apps/web/next.config.js` — otherwise the browser will silently
      refuse to load the result image even though generation succeeded.
- [ ] The private `tryon-uploads` Storage bucket is created automatically
      on first upload (same lazy-create pattern as `product-images`) — no
      manual bucket setup needed.
- [ ] Free-tier limit is 2 try-ons per anonymous session, enforced
      server-side. Note: the original spec called for "2 free, then 10/day
      per account," but this codebase has no customer account/login system
      (only phone+order-ref lookup) — there's nothing to escalate to, so
      it's a flat per-session cap for now.
- [ ] A daily cleanup cron (`/api/cron/tryon-cleanup`, added to
      `vercel.json`) deletes uploads/results past 24h. If this project is
      on a Vercel plan that doesn't support 2 cron jobs, this is the one to
      drop or merge with `/api/cron/notifications` — the "delete my photos
      now" button and the 24h `expires_at` column are the actual compliance
      backstops either way.

**AI Catalog Studio (admin product-to-model tool) — not built.**
- [ ] Explicitly out of scope for this pass — building it blind (no FASHN
      account to test the product-to-model endpoint against) risked
      shipping a broken admin tool. The provider interface has room for a
      second method if you want to add this later; the try-on work above
      should be smoke-tested first since it exercises the same FASHN
      account/auth.

## Already-existing gaps worth knowing about (not blocking, not fixed here)

- Reviews have no "Verified Purchase" concept (no `order_id` link) and no
  post-purchase review-invitation email — real feature work, out of scope
  for this pass.
- The product feeds have no GTIN/MPN (see above).
- Journal articles are hardcoded in three separate files rather than
  CMS/DB-backed — fine for 4 articles, worth revisiting if the Journal
  grows.
