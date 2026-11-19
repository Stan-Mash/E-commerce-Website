-- Abandoned cart / inquiry recovery engine
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  restore_token text        UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  phone         text,
  email         text,
  cart_json     jsonb       NOT NULL DEFAULT '[]',
  subtotal_kes  numeric(10, 2) NOT NULL DEFAULT 0,
  status        text        NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'recovered', 'expired')),
  recovery_stage int        NOT NULL DEFAULT 0, -- 0=pending, 1=60min sent, 2=24h sent, 3=48h sent
  last_activity timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL DEFAULT now() + interval '72 hours',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS abandoned_carts_phone_idx      ON abandoned_carts (phone);
CREATE INDEX IF NOT EXISTS abandoned_carts_status_idx     ON abandoned_carts (status, last_activity);
CREATE INDEX IF NOT EXISTS abandoned_carts_token_idx      ON abandoned_carts (restore_token);

ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
-- service role only; no client access
