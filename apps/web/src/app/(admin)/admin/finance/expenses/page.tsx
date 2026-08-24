"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const FONT = "'Inter','Urbanist',sans-serif";
function fKES(n: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

const CATEGORIES = [
  { id: "rent",         name: "Rent / Premises" },
  { id: "utilities",    name: "Utilities (electricity, water, internet)" },
  { id: "salaries",     name: "Staff Salaries" },
  { id: "stock",        name: "Stock / Inventory Purchase" },
  { id: "transport",    name: "Transport / Delivery" },
  { id: "marketing",    name: "Marketing & Advertising" },
  { id: "equipment",    name: "Equipment & Supplies" },
  { id: "maintenance",  name: "Repairs & Maintenance" },
  { id: "tax",          name: "Tax & Government Fees" },
  { id: "banking",      name: "Bank Charges & Loans" },
  { id: "insurance",    name: "Insurance" },
  { id: "petty_cash",   name: "Petty Cash" },
  { id: "other",        name: "Other" },
];

const PAYMENT_METHODS = ["Cash", "M-Pesa", "Bank Transfer", "Cheque", "Credit Card", "Supplier Credit"];

interface Expense {
  id:             string;
  description:    string;
  amount:         number;
  expense_date:   string;
  payment_method: string;
  notes:          string | null;
  expense_categories: { name: string } | null;
}

function thisMonth() { return new Date().toISOString().slice(0, 7); }

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [month,    setMonth]    = useState(thisMonth());
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const router = useRouter();

  // Form state
  const [category,   setCategory]   = useState(CATEGORIES[0]?.id ?? "rent");
  const [desc,       setDesc]        = useState("");
  const [amount,     setAmount]      = useState("");
  const [date,       setDate]        = useState(new Date().toISOString().slice(0, 10));
  const [payMethod,  setPayMethod]   = useState("Cash");
  const [notes,      setNotes]       = useState("");

  function loadExpenses() {
    setLoading(true);
    fetch(`/api/admin/finance/expenses?month=${month}`)
      .then(r => { if (r.status === 403) { router.replace("/admin/finance/login"); return null; } return r.json() as Promise<{ expenses: Expense[] }>; })
      .then(d => { if (d) setExpenses(d.expenses ?? []); })
      .finally(() => setLoading(false));
  }

  // loadExpenses is also called manually after saving an expense (see
  // saveExpense below), not just from this month-change effect — its
  // setLoading(true) is needed to re-show the loading state on that manual
  // refresh too, so it isn't a redundant initializer we can just delete.
  useEffect(() => { loadExpenses(); }, [month]); // eslint-disable-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect

  async function saveExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!desc || !amount) return;
    setSaving(true); setError("");
    try {
      const r = await fetch("/api/admin/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id:    category,
          description:    desc,
          amount:         parseFloat(amount),
          expense_date:   date,
          payment_method: payMethod,
          notes:          notes || undefined,
        }),
      });
      const j = await r.json() as { expense?: Expense; error?: string };
      if (!r.ok) { setError(j.error ?? "Failed to save"); return; }
      setShowForm(false);
      setDesc(""); setAmount(""); setNotes("");
      loadExpenses();
    } catch { setError("Network error"); } finally { setSaving(false); }
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f7" }}>
      <div style={{ background: "#111", padding: "14px 32px", display: "flex", alignItems: "center", gap: 20 }}>
        <Link href="/admin/finance" style={{ fontFamily: FONT, fontSize: 12, color: "#888", textDecoration: "none" }}>← Finance</Link>
        <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 800, color: "#fff" }}>Expenses</span>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: FONT, fontSize: 24, fontWeight: 900, color: "#111", margin: "0 0 4px", letterSpacing: "-0.02em" }}>Expense Tracker</h1>
            <p style={{ fontFamily: FONT, fontSize: 13, color: "#888", margin: 0 }}>
              {expenses.length} entries · {fKES(total)} total for {month}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <input type="month" value={month} onChange={e => setMonth(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #e0e0e0", borderRadius: 6, fontFamily: FONT, fontSize: 13 }} />
            <button onClick={() => setShowForm(true)}
              style={{ fontFamily: FONT, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, padding: "9px 18px", cursor: "pointer", fontWeight: 700 }}>
              + Add Expense
            </button>
          </div>
        </div>

        {/* Add expense modal */}
        {showForm && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: 36, width: 500, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto" }}>
              <h2 style={{ fontFamily: FONT, fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 24px" }}>Add Expense</h2>
              <form onSubmit={saveExpense}>
                <label style={lbl}>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} style={sel}>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <label style={lbl}>Description *</label>
                <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Rent for June — CBD store" style={inp} required />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={lbl}>Amount (KES) *</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" style={inp} required min="1" />
                  </div>
                  <div>
                    <label style={lbl}>Date *</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} required />
                  </div>
                </div>

                <label style={lbl}>Payment Method</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)} style={sel}>
                  {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                </select>

                <label style={lbl}>Notes (optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional details…" rows={2}
                  style={{ ...inp, resize: "vertical", height: "auto" }} />

                {error && <p style={{ fontFamily: FONT, fontSize: 12, color: "#c0392b", margin: "0 0 12px" }}>{error}</p>}

                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button type="submit" disabled={saving}
                    style={{ flex: 1, padding: "12px 0", background: saving ? "#ccc" : "#7c3aed", color: "#fff", border: "none", borderRadius: 6, fontFamily: FONT, fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
                    {saving ? "Saving…" : "Save Expense"}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    style={{ padding: "12px 20px", background: "#f1f1f1", color: "#555", border: "none", borderRadius: 6, fontFamily: FONT, fontSize: 12, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Expenses list */}
        {loading ? (
          <p style={{ fontFamily: FONT, fontSize: 14, color: "#aaa" }}>Loading…</p>
        ) : expenses.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 10, padding: "48px", textAlign: "center", border: "1px solid #e8e8e8" }}>
            <p style={{ fontFamily: FONT, fontSize: 14, color: "#aaa" }}>No expenses recorded for {month}.</p>
            <button onClick={() => setShowForm(true)} style={{ marginTop: 16, fontFamily: FONT, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, padding: "10px 20px", cursor: "pointer" }}>
              Add First Expense
            </button>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8e8e8", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f0f0f0" }}>
                  {["Date", "Category", "Description", "Payment", "Amount"].map(h => (
                    <th key={h} style={{ fontFamily: FONT, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#aaa", padding: "12px 16px", textAlign: h === "Amount" ? "right" : "left", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map((e, i) => (
                  <tr key={e.id} style={{ borderBottom: i < expenses.length - 1 ? "1px solid #f7f7f7" : "none", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ fontFamily: FONT, fontSize: 12, color: "#888", padding: "12px 16px" }}>{e.expense_date}</td>
                    <td style={{ fontFamily: FONT, fontSize: 12, color: "#7c3aed", padding: "12px 16px", fontWeight: 600 }}>{e.expense_categories?.name ?? "—"}</td>
                    <td style={{ fontFamily: FONT, fontSize: 13, color: "#111", padding: "12px 16px" }}>
                      {e.description}
                      {e.notes && <span style={{ display: "block", fontSize: 11, color: "#aaa", marginTop: 2 }}>{e.notes}</span>}
                    </td>
                    <td style={{ fontFamily: FONT, fontSize: 12, color: "#888", padding: "12px 16px" }}>{e.payment_method}</td>
                    <td style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: "#c0392b", padding: "12px 16px", textAlign: "right" }}>{fKES(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #e8e8e8" }}>
                  <td colSpan={4} style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "#111", padding: "12px 16px" }}>Total</td>
                  <td style={{ fontFamily: FONT, fontSize: 14, fontWeight: 900, color: "#c0392b", padding: "12px 16px", textAlign: "right" }}>{fKES(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { fontFamily: FONT, fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: 5 };
const inp: React.CSSProperties = { display: "block", width: "100%", padding: "9px 12px", border: "1px solid #e0e0e0", borderRadius: 6, fontFamily: FONT, fontSize: 13, color: "#111", outline: "none", boxSizing: "border-box", marginBottom: 14 };
const sel: React.CSSProperties = { ...inp };
