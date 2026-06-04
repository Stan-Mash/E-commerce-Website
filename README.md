# Elite Style Co. — E-Commerce MVP

Nairobi-made fashion storefront (project name: nairobi-fashion). PWA with M-Pesa STK Push checkout, video-first product pages, pickup + door delivery, and WhatsApp order notifications.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router (TypeScript) + PWA (next-pwa) |
| Backend API | Next.js Route Handlers |
| Background Jobs | BullMQ + Upstash Redis |
| Database | Supabase (PostgreSQL + RLS) |
| Media | Cloudinary (images + adaptive video) |
| Search | Typesense |
| Payments | Safaricom Daraja v2 STK Push |
| Notifications | Africa's Talking WhatsApp + SMS |
| Hosting | Vercel (web) + Railway (workers) |
| Observability | Sentry |
| CI/CD | GitHub Actions |

---

## Monorepo Structure

```
nairobi-fashion/
├── apps/
│   └── web/                    # Next.js 14 PWA
│       ├── src/
│       │   ├── app/            # App Router pages + API routes
│       │   ├── components/     # UI components
│       │   └── lib/            # Supabase client, M-Pesa, utils
│       └── supabase/
│           └── migrations/     # SQL migration files
├── packages/
│   └── lib/                    # Shared TypeScript types + seed script
└── workers/
    └── notifications/          # BullMQ worker (WhatsApp + SMS)
```

---

## Quick Start

### 1. Prerequisites

- Node.js 20+
- A Supabase project
- An Upstash Redis instance (**required in production** — rate limiting fails closed without it)
- A Cloudinary account
- Safaricom Daraja sandbox account
- Africa's Talking sandbox account

> **Security notes**
> - `ADMIN_SESSION_TOKEN` must be set before the admin area is accessible (fail-closed if missing). Only the `admin_session` **HttpOnly** cookie is accepted — the old JS-readable `admin_token` cookie is no longer issued or checked.
> - `MPESA_WEBHOOK_SECRET` is appended as `?secret=...` to the Safaricom callback URL because Daraja v2 does not support custom request headers. Use a high-entropy value (`openssl rand -hex 32`) and rotate it periodically. **Add a log-scrub filter** in Vercel / Railway to redact `?secret=` query params from access logs before rotation — otherwise the old secret remains visible in historical logs.
>   - Vercel: Settings → Log Drains → add a query-param redaction rule for `secret`.
>   - Railway: use a log drain with a regex filter on the webhook path.
> - `NEXT_PUBLIC_SUPPORT_PHONE` / `NEXT_PUBLIC_SUPPORT_EMAIL` — set these to real values before going live. The defaults are demo placeholders.

### 2. Environment setup

```bash
cp .env.example .env
# Fill in all values (see .env.example for descriptions)
```

### 3. Install dependencies

```bash
npm install
```

### 4. Run database migration

```bash
cd apps/web
npx supabase db push
# Or paste supabase/migrations/001_initial_schema.sql into Supabase SQL editor
```

### 5. Seed sample products

```bash
npm run db:seed
```

### 6. Start development

```bash
npm run dev
# Web: http://localhost:3000
# Worker: runs separately (see workers/notifications)
```

### 7. Start the notification worker

```bash
cd workers/notifications
npm run dev
```

---

## Deployment

### Vercel (web)

1. Connect the `apps/web` directory to a Vercel project
2. Set all env vars in Vercel dashboard
3. Every push to `main` → auto-deploy; every PR → preview deploy

### Railway (worker)

1. Create a new Railway service from `workers/notifications`
2. Set `START_COMMAND=npm run start`
3. Add all env vars
4. The worker polls Supabase every 5s — no port needed

---

## GitHub Actions Secrets Required

```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
NEXT_PUBLIC_TYPESENSE_SEARCH_KEY
TURBO_TOKEN            (optional — Vercel Remote Cache)
TURBO_TEAM             (optional)
```

---

## Development Workflow

- Feature branches → PR → preview deploy → review → merge to `main` → production deploy
- Commit every 48 hours with a status summary
- Run `npm run type-check` and `npm run lint` before pushing

---

## Key API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/checkout` | POST | Create order + initiate STK Push |
| `/api/webhooks/mpesa` | POST | Daraja STK callback (IP-allowlisted) |
| `/api/products` | GET | Product listing with filters |

---

## See Also

- [RUNBOOK.md](./RUNBOOK.md) — Daraja + WhatsApp production onboarding
- [apps/web/supabase/migrations/001_initial_schema.sql](./apps/web/supabase/migrations/001_initial_schema.sql) — Full DB schema
