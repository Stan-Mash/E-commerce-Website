"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const FONT = "'Inter','Urbanist',sans-serif";

function formatKES(n: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function thisMonth() {
  return new Date().toISOString().slice(0, 7);
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

export default function FinanceDashboardPage() {
  const [report,  setReport]  = useState<Report | null>(null);
  const [month,   setMonth]   = useState(thisMonth());
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/finance/reports?month=${month}`)
      .then(r => {
        if (r.status === 403) { router.replace("/admin/finance/login"); return null; }
        return r.json() as Promise<Report>;
      })
      .then(d => { if (d) setReport(d); })
      .finally(() => setLoading(false));
  }, [month, router]);

  async function logout() {
    await fetch("/api/admin/owner/login", { method: "DELETE" });
    router.replace("/admin/finance/login");
  }

  const nav = [
    { href: "/admin/finance", label: "Dashboard", icon: "📊" },
    { href: "/admin/finance/expenses", label: "Expenses", icon: "🧾" },
    { href: "/admin/finance/loans", label: "Loans", icon: "🏦" },
    { href: "/admin/finance/reports", label: "P&L Report", icon: "📈" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f7" }}>
      {/* Top bar */}
      <div style={{ background: "#111", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 32, height: 32, background: "#7c3aed", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          </div>
          <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>Finance — Owner View</span>
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          {nav.map(n => (
            <Link key={n.href} href={n.href} style={{ fontFamily: FONT, fontSize: 12, color: "#fff", textDecoration: "none", opacity: 0.75 }}>
              {n.icon} {n.label}
            </Link>
          ))}
          <button onClick={logout} style={{ fontFamily: FONT, fontSize: 11, color: "#888", background: "none", border: "1px solid #333", borderRadius: 4, padding: "6px 12px", cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Lock
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <p style={{ fontFamily: FONT, fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "#c9a961", margin: "0 0 4px" }}>Finance Module</p>
            <h1 style={{ fontFamily: FONT, fontSize: 28, fontWeight: 900, color: "#111", margin: 0, letterSpacing: "-0.03em" }}>Dashboard</h1>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #e0e0e0", borderRadius: 6, fontFamily: FONT, fontSize: 13, color: "#111" }}
            />
          </div>
        </div>

        {loading ? (
          <p style={{ fontFamily: FONT, fontSize: 14, color: "#aaa" }}>Loading financial data…</p>
        ) : !report ? null : (
          <>
            {/* KPI cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
              <KpiCard label="Revenue" value={formatKES(report.revenue)} sub={`${report.order_count} paid orders`} color="#2e7d32" />
              <KpiCard label="Total Expenses" value={formatKES(report.expenses_total)} sub="all categories" color="#c0392b" />
              <KpiCard label="Debt Service" value={formatKES(report.debt_service)} sub={`Outstanding: ${formatKES(report.total_outstanding)}`} color="#856404" />
              <KpiCard label="Operating Profit" value={formatKES(report.operating_profit)} sub="Revenue − Expenses" color={report.operating_profit >= 0 ? "#1565c0" : "#c0392b"} />
              <KpiCard label="Net Position" value={formatKES(report.net_position)} sub="After debt & TOT" color={report.net_position >= 0 ? "#7c3aed" : "#c0392b"} />
              <KpiCard label="TOT Provision" value={formatKES(report.tax_provisions.tot)} sub="1.5% of revenue" color="#555" />
            </div>

            {/* P&L waterfall */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              {/* Summary */}
              <div style={{ background: "#fff", borderRadius: 10, padding: 24, border: "1px solid #e8e8e8" }}>
                <h2 style={{ fontFamily: FONT, fontSize: 15, fontWeight: 800, color: "#111", margin: "0 0 20px" }}>P&amp;L Summary — {report.month}</h2>
                <PLRow label="Revenue" value={report.revenue} bold />
                <PLRow label="Total Expenses" value={-report.expenses_total} />
                <PLRow label="Operating Profit" value={report.operating_profit} bold divider />
                <PLRow label="Debt Repayments" value={-report.debt_service} />
                <PLRow label="TOT Provision (1.5%)" value={-report.tax_provisions.tot} />
                <PLRow label="VAT Collected" value={report.tax_provisions.vat_collected} note="(to remit to KRA)" />
                <PLRow label="Net Position" value={report.net_position} bold divider highlight />
              </div>

              {/* Expenses breakdown */}
              <div style={{ background: "#fff", borderRadius: 10, padding: 24, border: "1px solid #e8e8e8" }}>
                <h2 style={{ fontFamily: FONT, fontSize: 15, fontWeight: 800, color: "#111", margin: "0 0 20px" }}>Expenses by Category</h2>
                {Object.keys(report.expenses_by_cat).length === 0 ? (
                  <p style={{ fontFamily: FONT, fontSize: 13, color: "#aaa" }}>No expenses recorded for this period.</p>
                ) : (
                  Object.entries(report.expenses_by_cat)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, amt]) => (
                      <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontFamily: FONT, fontSize: 13, color: "#111", margin: 0 }}>{cat}</p>
                          <div style={{ height: 4, background: "#f0f0f0", borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
                            <div style={{ height: "100%", background: "#7c3aed", width: `${Math.min(100, (amt / report.expenses_total) * 100)}%`, borderRadius: 2 }} />
                          </div>
                        </div>
                        <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: "#111", marginLeft: 16, flexShrink: 0 }}>
                          {formatKES(amt)}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Quick links */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {[
                { href: "/admin/finance/expenses", label: "Log Expense", desc: "Record daily business spend", icon: "🧾" },
                { href: "/admin/finance/loans", label: "Manage Loans", desc: "Track loans & repayments", icon: "🏦" },
                { href: "/admin/finance/reports", label: "Full P&L Report", desc: "Export to CSV for accountant", icon: "📈" },
              ].map(card => (
                <Link key={card.href} href={card.href} style={{ textDecoration: "none" }}>
                  <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 10, padding: "20px 22px", cursor: "pointer" }}>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>{card.icon}</div>
                    <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 800, color: "#111", margin: "0 0 4px" }}>{card.label}</p>
                    <p style={{ fontFamily: FONT, fontSize: 12, color: "#888", margin: 0 }}>{card.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, padding: "20px 22px", border: "1px solid #e8e8e8" }}>
      <p style={{ fontFamily: FONT, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", margin: "0 0 8px" }}>{label}</p>
      <p style={{ fontFamily: FONT, fontSize: 22, fontWeight: 900, color, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{value}</p>
      <p style={{ fontFamily: FONT, fontSize: 11, color: "#aaa", margin: 0 }}>{sub}</p>
    </div>
  );
}

function PLRow({ label, value, bold, divider, highlight, note }: { label: string; value: number; bold?: boolean; divider?: boolean; highlight?: boolean; note?: string }) {
  const color = highlight ? (value >= 0 ? "#2e7d32" : "#c0392b") : value < 0 ? "#c0392b" : "#111";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: divider ? "10px 0 10px" : "6px 0", borderTop: divider ? "2px solid #111" : "none", marginTop: divider ? 4 : 0 }}>
      <span style={{ fontFamily: FONT, fontSize: bold ? 13 : 12, fontWeight: bold ? 700 : 400, color: "#555" }}>
        {label}
        {note && <span style={{ fontSize: 10, color: "#aaa", marginLeft: 6 }}>{note}</span>}
      </span>
      <span style={{ fontFamily: FONT, fontSize: bold ? 14 : 12, fontWeight: bold ? 800 : 500, color }}>
        {value >= 0 ? formatKES(value) : `−${formatKES(Math.abs(value))}`}
      </span>
    </div>
  );
}
