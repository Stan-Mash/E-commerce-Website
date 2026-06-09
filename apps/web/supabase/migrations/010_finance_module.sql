--
-- Elite Style Co - Finance Module Migration
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
--

-- 1. Expense Categories
CREATE TABLE IF NOT EXISTS expense_categories (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name       TEXT NOT NULL,
  icon       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO expense_categories (id, name, icon) VALUES
  ('rent',        'Rent / Premises',                         '🏢'),
  ('utilities',   'Utilities (electricity, water, internet)','💡'),
  ('salaries',    'Staff Salaries',                          '👥'),
  ('stock',       'Stock / Inventory Purchase',              '📦'),
  ('transport',   'Transport / Delivery',                    '🚚'),
  ('marketing',   'Marketing & Advertising',                 '📢'),
  ('equipment',   'Equipment & Supplies',                    '🔧'),
  ('maintenance', 'Repairs & Maintenance',                   '🔨'),
  ('tax',         'Tax & Government Fees',                   '🏛️'),
  ('banking',     'Bank Charges & Loans',                    '🏦'),
  ('insurance',   'Insurance',                               '🛡️'),
  ('petty_cash',  'Petty Cash',                              '💵'),
  ('other',       'Other',                                   '📌')
ON CONFLICT (id) DO NOTHING;

-- 2. Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id    TEXT REFERENCES expense_categories(id),
  description    TEXT NOT NULL,
  amount         INTEGER NOT NULL CHECK (amount > 0),  -- KES, always integer
  expense_date   DATE NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  location_id    UUID REFERENCES locations(id),
  receipt_url    TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);

-- 3. Loans
CREATE TABLE IF NOT EXISTS loans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_name      TEXT NOT NULL,
  loan_type        TEXT NOT NULL DEFAULT 'Bank Loan',
  principal_amount INTEGER NOT NULL CHECK (principal_amount > 0),
  interest_rate    NUMERIC(5,2) DEFAULT 0,  -- % per annum
  start_date       DATE NOT NULL,
  due_date         DATE,
  notes            TEXT,
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paid_off','written_off')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Loan Payments
CREATE TABLE IF NOT EXISTS loan_payments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id      UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  amount       INTEGER NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loan_payments_loan ON loan_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_date ON loan_payments(payment_date DESC);

-- 5. Petty Cash Log
CREATE TABLE IF NOT EXISTS petty_cash_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id  UUID REFERENCES locations(id),
  shift_id     UUID REFERENCES shifts(id),
  entry_type   TEXT NOT NULL CHECK (entry_type IN ('opening','expense','topup','closing')),
  amount       INTEGER NOT NULL,  -- positive = in, negative = out
  description  TEXT NOT NULL,
  cashier_name TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_petty_cash_location ON petty_cash_log(location_id, created_at DESC);

-- 6. Tax Provisions
CREATE TABLE IF NOT EXISTS tax_provisions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_type   TEXT NOT NULL CHECK (tax_type IN ('TOT','VAT','PAYE','NSSF','NHIF','CIT','Other')),
  period     TEXT NOT NULL,  -- YYYY-MM
  amount     INTEGER NOT NULL DEFAULT 0,
  status     TEXT NOT NULL DEFAULT 'provisional' CHECK (status IN ('provisional','filed','paid')),
  paid_date  DATE,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tax_type, period)
);

-- 7. Row-Level Security
-- These tables are accessed only via service role (server API), so RLS blocks
-- all direct client access by default.
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans               ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE petty_cash_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_provisions      ENABLE ROW LEVEL SECURITY;

-- No public policies - service role bypasses RLS automatically.

-- 8. Optional: add cost_price to products for COGS calculation
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price INTEGER DEFAULT 0;
COMMENT ON COLUMN products.cost_price IS 'Landed cost per unit in KES (used for COGS/gross margin)';

-- Done
-- After running this migration, set these env vars in Vercel:
-- OWNER_PASSWORD = a strong password (never share with staff)
-- OWNER_SESSION_TOKEN = a long random string (e.g. openssl rand -base64 48)
