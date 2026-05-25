"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const FONT = "'Inter','Urbanist',sans-serif";
function fKES(n: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

interface Report {
  month:             string;
  revenue:           number;
  gross_profit:      number;
  expenses_total:    number;
  expenses_by_cat:   Record<string, number>;
  debt_service:      number;
  total_outstanding: number;
  tax_provisions:    { tot: number; vat_collected: number };
  operating_profit:  number;
  net_position:      number;
  order_count:       number;
}

function monthsBack(n: number): string[] {
  const months: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    d.setMonth(d.getMonth() - 1);
  }
  return months;
}

export default function ReportsPage() {
  const [report,    setReport]    = useState<Report | null>(null);
  const [month,     setMonth]     = useState(new Date().toISOString().slice(0, 7));
  const [loading,   setLoading]   = useState(true);
  const [exporting, setExporting] = useState(false);
  const router = useRouter();

  const loadReport = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/finance/reports?month=${month}`)
      .then(r => { if (r.status === 403) { router.replace("/admin/finance/login"); return null; } return r.json() as Promise<Report>; })
      .then(d => { if (d) setReport(d); })
      .finally(() => setLoading(false));
  }, [month, router]);

  useEffect(() => { loadReport(); }, [loadReport]);

  function exportCSV() {
    if (!report) return;
    setExporting(true);
    const rows: string[][] = [
      ["Elite Style Co — Monthly P&L Report"],
      [`Period: ${report.month}`],
      [`Generated: ${new Date().toLocaleDateString("en-KE")}`],
      [],
      ["Category", "Amount (KES)"],
      ["REVENUE", String(report.revenue)],
      ["  Paid Orders", String(report.order_count) + " orders"],
      [],
      ["EXPENSES", ""],
      ...Object.entries(report.expenses_by_cat).map(([cat, amt]) => [`  ${cat}`, String(amt)]),
      ["  TOTAL EXPENSES", String(report.expenses_total)],
      [],
      ["OPERATING PROFIT", String(report.operating_profit)],
      [],
      ["DEBT SERVICE", String(report.debt_service)],
      ["  Total Outstanding Loans", String(report.total_outstanding)],
      [],
      ["TAX PROVISIONS", ""],
      ["  TOT (1.5%)", String(report.tax_provisions.tot)],
      ["  VAT Collected (16%)", String(report.tax_provisions.vat_collected)],
      [],
      ["NET POSITION", String(report.net_position)],
    ];

    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `elite-style-pl-${report.month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f7" }}>
      <div style={{ background: "#111", padding: "14px 32px", display: "flex", alignItems: "center", gap: 20 }}>
        <Link href="/admin/finance" style={{ fontFamily: FONT, fontSize: 12, color: "#888", textDecoration: "none" }}>← Finance</Link>
        <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 800, color: "#fff" }}>P&amp;L Report</span>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "28px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: FONT, fontSize: 24, fontWeight: 900, color: "#111", margin: "0 0 4px", letterSpacing: "-0.02em" }}>Monthly P&amp;L</h1>
            <p style={{ fontFamily: FONT, fontSize: 13, color: "#888", margin: 0 }}>Full profit &amp; loss statement for accountant review</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <select value={month} onChange={e => setMonth(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #e0e0e0", borderRadius: 6, fontFamily: FONT, fontSize: 13, color: "#111" }}>
              {monthsBack(12).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button onClick={exportCSV} disabled={!report || exporting}
              style={{ fontFamily: FONT, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", background: "#2e7d32", color: "#fff", border: "none", borderRadius: 6, padding: "9px 18px", cursor: !report ? "not-allowed" : "pointer", fontWeight: 700 }}>
              {exporting ? "Exporting…" : "Export CSV"}
            </button>
          </div>
        </div>

        {loading ? (
          <p style={{ fontFamily: FONT, fontSize: 14, color: "#aaa" }}>Loading report…</p>
        ) : !report ? null : (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e8e8", overflow: "hidden" }}>
            {/* Report header */}
            <div style={{ background: "#111", padding: "20px 28px" }}>
              <p style={{ fontFamily: FONT, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#c9a961", margin: "0 0 4px" }}>Elite Style Co</p>
              <p style={{ fontFamily: FONT, fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 2px" }}>
                Profit &amp; Loss Statement — {report.month}
              </p>
              <p style={{ fontFamily: FONT, fontSize: 12, color: "#666", margin: 0 }}>
                Generated {new Date().toLocaleDateString("en-KE", { dateStyle: "long" })}
              </p>
            </div>

            <div style={{ padding: "28px" }}>
              <Section title="REVENUE" />
              <PLLine label={`Gross Sales (${report.order_count} orders)`} value={report.revenue} indent={1} />
              <PLLine label="Gross Revenue" value={report.revenue} bold />

              <Section title="OPERATING EXPENSES" />
              {Object.entries(report.expenses_by_cat).map(([cat, amt]) => (
                <PLLine key={cat} label={cat} value={-amt} indent={1} />
              ))}
              <PLLine label="Total Operating Expenses" value={-report.expenses_total} bold />

              <Section title="OPERATING PROFIT" />
              <PLLine label="Operating Profit / (Loss)" value={report.operating_profit} bold highlight />

              <Section title="DEBT SERVICE" />
              <PLLine label="Loan Repayments (this month)" value={-report.debt_service} indent={1} />
              <PLLine label="Total Outstanding Loans" value={-report.total_outstanding} indent={1} note="(balance sheet)" />

              <Section title="TAX PROVISIONS" />
              <PLLine label="Turnover Tax — TOT (1.5%)" value={-report.tax_provisions.tot} indent={1} note="pay to KRA monthly" />
              <PLLine label="VAT Collected (16%)" value={report.tax_provisions.vat_collected} indent={1} note="to remit to KRA" />
              <div style={{ marginTop: 4, padding: "8px 12px", background: "#fff8e1", borderRadius: 6, marginBottom: 12 }}>
                <p style={{ fontFamily: FONT, fontSize: 11, color: "#856404", margin: 0 }}>
                  ⚠️ PAYE, NSSF (KES 200/employee), and NHIF must be filed separately based on payroll.
                </p>
              </div>

              <Section title="NET POSITION" />
              <PLLine label="Net Position (after debt &amp; TOT)" value={report.net_position} bold highlight />

              {/* Disclaimer */}
              <div style={{ marginTop: 24, padding: "14px 16px", background: "#f7f7f7", borderRadius: 8, border: "1px solid #e8e8e8" }}>
                <p style={{ fontFamily: FONT, fontSize: 11, color: "#888", margin: "0 0 4px", fontWeight: 700 }}>Notes to Accountant</p>
                <ul style={{ fontFamily: FONT, fontSize: 11, color: "#888", margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
                  <li>Revenue excludes returns/refunds. Confirm refund adjustments separately.</li>
                  <li>No COGS is tracked yet — cost price per SKU should be added for accurate gross margin.</li>
                  <li>VAT figure assumes all sales are VAT-inclusive. Confirm VAT registration status.</li>
                  <li>Personal/owner drawings are not tracked here — record separately.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title }: { title: string }) {
  return (
    <div style={{ background: "#f7f7f7", margin: "16px -28px 8px", padding: "6px 28px" }}>
      <p style={{ fontFamily: FONT, fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#aaa", margin: 0, fontWeight: 700 }}>{title}</p>
    </div>
  );
}

function PLLine({ label, value, bold, indent = 0, highlight, note }: {
  label: string; value: number; bold?: boolean; indent?: number; highlight?: boolean; note?: string;
}) {
  const isNeg  = value < 0;
  const color  = highlight ? (value >= 0 ? "#2e7d32" : "#c0392b") : isNeg ? "#c0392b" : "#111";
  const bgStyle = highlight ? { background: isNeg ? "#fde8e8" : "#e8f5e9", margin: "0 -28px", padding: "10px 28px", borderRadius: 0 } : {};
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", paddingLeft: indent * 20, ...bgStyle }}>
      <span style={{ fontFamily: FONT, fontSize: bold ? 13 : 12, fontWeight: bold ? 700 : 400, color: "#555" }}>
        {label}
        {note && <span style={{ fontSize: 10, color: "#bbb", marginLeft: 8 }}>{note}</span>}
      </span>
      <span style={{ fontFamily: FONT, fontSize: bold ? 14 : 12, fontWeight: bold ? 800 : 500, color, whiteSpace: "nowrap" }}>
        {isNeg ? `(${fKES(Math.abs(value))})` : fKES(value)}
      </span>
    </div>
  );
}
