-- Server-side CAPI event log for debugging & deduplication
CREATE TABLE IF NOT EXISTS capi_events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name   text        NOT NULL,
  event_id     text        NOT NULL,
  platform     text        NOT NULL CHECK (platform IN ('meta', 'tiktok', 'both')),
  payload_json jsonb       NOT NULL DEFAULT '{}',
  status       text        NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  response_json jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS capi_events_event_id_idx   ON capi_events (event_id);
CREATE INDEX IF NOT EXISTS capi_events_created_at_idx ON capi_events (created_at DESC);

ALTER TABLE capi_events ENABLE ROW LEVEL SECURITY;
