-- WhatsApp order log: records every order intent before the WA redirect fires
CREATE TABLE IF NOT EXISTS whatsapp_orders (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code        text        UNIQUE NOT NULL,
  product_id      uuid        REFERENCES products(id) ON DELETE SET NULL,
  product_title   text        NOT NULL,
  product_slug    text,
  selected_size   text,
  unit_price_kes  numeric(10, 2) NOT NULL,
  customer_name   text,
  customer_phone  text,
  status          text        NOT NULL DEFAULT 'initiated'
                                CHECK (status IN ('initiated', 'confirmed', 'cancelled')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_orders_created_at_idx ON whatsapp_orders (created_at DESC);
CREATE INDEX IF NOT EXISTS whatsapp_orders_ref_code_idx   ON whatsapp_orders (ref_code);

-- RLS on; service role (used by API route) bypasses it automatically.
-- No permissive policies: anon/authenticated users cannot read or write directly.
ALTER TABLE whatsapp_orders ENABLE ROW LEVEL SECURITY;
