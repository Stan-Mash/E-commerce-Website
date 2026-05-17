# Runbook — Daraja & WhatsApp Production Onboarding

## Safaricom Daraja (M-Pesa)

### Step 1: Sandbox Setup (done on Day 1)
1. Register at developer.safaricom.co.ke
2. Create an app → get **Consumer Key** and **Consumer Secret**
3. Set `MPESA_ENVIRONMENT=sandbox` and use shortcode `174379`, passkey from the portal
4. Set `MPESA_CALLBACK_URL` to your ngrok/Vercel preview URL + `/api/webhooks/mpesa`
5. Test STK Push via the Daraja API Simulator

### Step 2: Go-Live Checklist
1. Apply for **Go-Live** in the Daraja portal (requires business registration docs)
2. Required docs: Business Registration Certificate, KRA PIN, M-Pesa Till/Paybill
3. Safaricom review takes 5–10 business days
4. Once approved:
   - Switch `MPESA_ENVIRONMENT=production`
   - Update `MPESA_SHORTCODE` to your production Paybill/Till
   - Update `MPESA_PASSKEY` from the production portal
   - Update `MPESA_CALLBACK_URL` to your production domain
5. Whitelist your production server IP in Vercel Edge config (for outbound calls to Daraja)

### IP Allowlist for Callbacks
The webhook at `/api/webhooks/mpesa` validates incoming IPs against Safaricom's known ranges.
Current ranges are hardcoded in `apps/web/src/app/api/webhooks/mpesa/route.ts`.
Check developer.safaricom.co.ke for updates if callbacks stop arriving.

### Testing Sandbox Flow
```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0712345678",
    "items": [{"skuId": "<sku-uuid>", "quantity": 1}],
    "deliveryType": "pickup"
  }'
```
Expected: `{"checkoutRequestId": "...", "customerMessage": "Success. Request accepted..."}`

### Payment Reconciliation
Run this SQL in Supabase to reconcile daily:
```sql
select
  o.order_ref,
  o.total,
  o.status,
  mt.mpesa_receipt_number,
  mt.amount_paid,
  o.created_at
from orders o
left join mpesa_transactions mt on mt.order_id = o.id
where o.created_at::date = current_date
order by o.created_at desc;
```

---

## Africa's Talking WhatsApp Business

### Step 1: Sandbox (Day 1)
1. Register at africastalking.com
2. Get API Key and use username `sandbox`
3. Set `AT_USERNAME=sandbox` and `AT_API_KEY=<sandbox-key>`
4. Test with the Africa's Talking simulator

### Step 2: WhatsApp Business Approval
1. Apply for WhatsApp Business Account via Africa's Talking portal
2. Required: Facebook Business Manager account, business phone number
3. Approval takes 2–4 weeks — start this process on Day 1
4. Once approved:
   - Update `AT_USERNAME` to your production username
   - Update `AT_WHATSAPP_SENDER` to your approved WhatsApp number
   - Test with a real phone (sandbox messages don't reach real devices)

### Step 3: Message Templates
WhatsApp Business requires pre-approved templates for outbound messages.
Submit these templates via Africa's Talking dashboard:

**Template: order_confirmation**
```
✅ Order Confirmed! 🎉

Hi! Your Nairobi Fashion order *{{1}}* has been received.

Total: KES {{2}}
{{3}}

Questions? Reply or call 0700 000 000.
Asante! 🇰🇪
```
(Variables: 1=order_ref, 2=total, 3=delivery_info)

### SMS Fallback
SMS works immediately via Africa's Talking with no approval needed.
Sender ID `NairobiFash` requires registration (3–5 days).
Until approved, messages will show the AT shortcode as sender.

---

## Cloudinary — Video Upload Setup

1. Create a Cloudinary account
2. In Settings → Upload → Upload Presets: create an **unsigned preset** named `nairobi-fashion-unsigned`
   - Folder: `nairobi-fashion/products`
   - Allowed formats: `jpg,png,webp,mp4,mov`
   - Incoming transformations: `q_auto,f_auto` for images; `sp_hd` for videos
3. Set `CLOUDINARY_UPLOAD_PRESET=nairobi-fashion-unsigned`
4. For admin uploads, use the signed preset with your API secret (never expose to browser)

### Video Optimization Settings
Videos are served via adaptive streaming (HLS). In Cloudinary:
- Enable **Adaptive Bitrate Streaming** on the upload preset
- Set max video size to 100MB for admin uploads
- Product videos should be 15–90 seconds, shot in portrait (9:16) for mobile

---

## Typesense — Search Setup

1. Create a Typesense Cloud cluster
2. Create an API key with `documents:search` permission only → `NEXT_PUBLIC_TYPESENSE_SEARCH_KEY`
3. Create an admin API key → `TYPESENSE_API_KEY`
4. Run the indexing script to create collection and sync products:
```bash
npx tsx scripts/typesense-sync.ts
```

### Collection Schema
```json
{
  "name": "products",
  "fields": [
    {"name": "id", "type": "string"},
    {"name": "name", "type": "string"},
    {"name": "slug", "type": "string"},
    {"name": "category", "type": "string", "facet": true},
    {"name": "base_price", "type": "float", "facet": true},
    {"name": "is_featured", "type": "bool", "facet": true},
    {"name": "status", "type": "string"},
    {"name": "description", "type": "string", "optional": true}
  ],
  "default_sorting_field": "base_price"
}
```

---

## Incident Response

### STK Push not completing
1. Check Safaricom sandbox status: developer.safaricom.co.ke/status
2. Check `mpesa_transactions` table for the `checkout_request_id`
3. Verify callback URL is accessible (use Vercel logs)
4. Check IP allowlist in the webhook handler matches current Safaricom IPs

### WhatsApp messages not delivered
1. Check `notification_jobs` table — status should be `done`
2. Check worker logs on Railway
3. Verify Africa's Talking account balance (even sandbox may have limits)
4. SMS fallback should activate automatically — check AT dashboard for sent SMS

### Order stuck in `pending_payment`
```sql
-- Manually resolve stuck orders after manual M-Pesa check
update orders set status = 'paid', paid_at = now()
where order_ref = 'NF-XXXXX' and status = 'pending_payment';
```
Always verify the M-Pesa receipt in the Safaricom business portal before doing this.
