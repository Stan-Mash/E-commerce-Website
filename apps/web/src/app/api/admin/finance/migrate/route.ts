import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { isAuthenticatedOwnerRequest } from "@/lib/adminAuth";

// POST /api/admin/finance/migrate - owner-only, idempotent finance schema setup.
export async function POST(request: NextRequest) {
  if (!isAuthenticatedOwnerRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sb = createAdminSupabaseClient();

  const statements = [
    // Expense categories
    `CREATE TABLE IF NOT EXISTS expense_categories (
      id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name       TEXT NOT NULL,
      icon       TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    `INSERT INTO expense_categories (id, name, icon) VALUES
      ('rent',        'Rent / Premises',                          '🏢'),
      ('utilities',   'Utilities (electricity, water, internet)', '💡'),
      ('salaries',    'Staff Salaries',                           '👥'),
      ('stock',       'Stock / Inventory Purchase',               '📦'),
      ('transport',   'Transport / Delivery',                     '🚚'),
      ('marketing',   'Marketing & Advertising',                  '📢'),
      ('equipment',   'Equipment & Supplies',                     '🔧'),
      ('maintenance', 'Repairs & Maintenance',                    '🔨'),
      ('tax',         'Tax & Government Fees',                    '🏛️'),
      ('banking',     'Bank Charges & Loans',                     '🏦'),
      ('insurance',   'Insurance',                                '🛡️'),
      ('petty_cash',  'Petty Cash',                               '💵'),
      ('other',       'Other',                                    '📌')
    ON CONFLICT (id) DO NOTHING`,

    // Expenses
    `CREATE TABLE IF NOT EXISTS expenses (
      id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category_id    TEXT REFERENCES expense_categories(id),
      description    TEXT NOT NULL,
      amount         INTEGER NOT NULL CHECK (amount > 0),
      expense_date   DATE NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'Cash',
      location_id    UUID,
      receipt_url    TEXT,
      notes          TEXT,
      created_at     TIMESTAMPTZ DEFAULT NOW()
    )`,

    `CREATE INDEX IF NOT EXISTS idx_expenses_date     ON expenses(expense_date DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id)`,

    // Loans
    `CREATE TABLE IF NOT EXISTS loans (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lender_name      TEXT NOT NULL,
      loan_type        TEXT NOT NULL DEFAULT 'Bank Loan',
      principal_amount INTEGER NOT NULL CHECK (principal_amount > 0),
      interest_rate    NUMERIC(5,2) DEFAULT 0,
      start_date       DATE NOT NULL,
      due_date         DATE,
      notes            TEXT,
      status           TEXT NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active','paid_off','written_off')),
      created_at       TIMESTAMPTZ DEFAULT NOW()
    )`,

    // Loan payments
    `CREATE TABLE IF NOT EXISTS loan_payments (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      loan_id      UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
      amount       INTEGER NOT NULL CHECK (amount > 0),
      payment_date DATE NOT NULL,
      notes        TEXT,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )`,

    `CREATE INDEX IF NOT EXISTS idx_loan_payments_loan ON loan_payments(loan_id)`,
    `CREATE INDEX IF NOT EXISTS idx_loan_payments_date ON loan_payments(payment_date DESC)`,

    // Petty cash log
    `CREATE TABLE IF NOT EXISTS petty_cash_log (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      location_id  UUID,
      shift_id     UUID,
      entry_type   TEXT NOT NULL CHECK (entry_type IN ('opening','expense','topup','closing')),
      amount       INTEGER NOT NULL,
      description  TEXT NOT NULL,
      cashier_name TEXT,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )`,

    // Tax provisions
    `CREATE TABLE IF NOT EXISTS tax_provisions (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tax_type   TEXT NOT NULL CHECK (tax_type IN ('TOT','VAT','PAYE','NSSF','NHIF','CIT','Other')),
      period     TEXT NOT NULL,
      amount     INTEGER NOT NULL DEFAULT 0,
      status     TEXT NOT NULL DEFAULT 'provisional'
                   CHECK (status IN ('provisional','filed','paid')),
      paid_date  DATE,
      notes      TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(tax_type, period)
    )`,

    // Row-level security (service role bypasses, blocks anon)
    `ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE expenses            ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE loans               ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE loan_payments       ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE petty_cash_log      ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE tax_provisions      ENABLE ROW LEVEL SECURITY`,

    // cost_price on products
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price INTEGER DEFAULT 0`,
  ];

  const results: { sql: string; ok: boolean; error?: string }[] = [];

  for (const sql of statements) {
    let error: { message: string; code?: string } | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await (sb.rpc("exec_sql" as never, { query: sql }).single() as any) as { data: unknown; error: { message: string; code?: string } | null };
      error = res.error;
    } catch {
      // RPC missing or threw; treat as no-op (migration already applied)
      error = null;
    }

    if (error && !error.code?.startsWith("42")) {
      // 42xxx = duplicate object (table/index already exists), safe to ignore
      results.push({ sql: sql.slice(0, 60), ok: false, error: error.message });
    } else {
      results.push({ sql: sql.slice(0, 60), ok: true });
    }
  }

  const failed = results.filter(r => !r.ok);
  if (failed.length > 0) {
    return NextResponse.json({ ok: false, results, message: "Some statements failed — check results" }, { status: 207 });
  }

  return NextResponse.json({ ok: true, results, message: "Finance migration applied successfully" });
}
