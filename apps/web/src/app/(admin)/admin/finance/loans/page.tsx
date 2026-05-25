"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const FONT = "'Inter','Urbanist',sans-serif";
function fKES(n: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

const LOAN_TYPES = [
  "Bank Loan", "Mobile Loan (M-Pesa, Fuliza, KCB-Mpesa)",
  "SACCO Loan", "Supplier Credit", "Family / Personal Loan",
  "Invoice Financing", "Other",
];

interface LoanPayment { id: string; amount: number; payment_date: string; notes: string | null; }
interface Loan {
  id:               string;
  lender_name:      string;
  loan_type:        string;
  principal_amount: number;
  interest_rate:    number;
  start_date:       string;
  due_date:         string | null;
  notes:            string | null;
  status:           string;
  amount_paid:      number;
  outstanding:      number;
  loan_payments:    LoanPayment[];
}

export default function LoansPage() {
  const [loans,       setLoans]       = useState<Loan[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showPayForm,  setShowPayForm]  = useState<string | null>(null); // loan id
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");
  const router = useRouter();

  // Loan form
  const [lender,     setLender]     = useState("");
  const [loanType,   setLoanType]   = useState(LOAN_TYPES[0]);
  const [principal,  setPrincipal]  = useState("");
  const [rate,       setRate]       = useState("0");
  const [startDate,  setStartDate]  = useState(new Date().toISOString().slice(0, 10));
  const [dueDate,    setDueDate]    = useState("");
  const [loanNotes,  setLoanNotes]  = useState("");

  // Payment form
  const [payAmount,  setPayAmount]  = useState("");
  const [payDate,    setPayDate]    = useState(new Date().toISOString().slice(0, 10));
  const [payNotes,   setPayNotes]   = useState("");

  function loadLoans() {
    setLoading(true);
    fetch("/api/admin/finance/loans")
      .then(r => { if (r.status === 403) { router.replace("/admin/finance/login"); return null; } return r.json() as Promise<{ loans: Loan[] }>; })
      .then(d => { if (d) setLoans(d.loans ?? []); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadLoans(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveLoan(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const r = await fetch("/api/admin/finance/loans", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_loan", lender_name: lender, loan_type: loanType,
          principal_amount: parseFloat(principal), interest_rate: parseFloat(rate) || 0,
          start_date: startDate, due_date: dueDate || undefined, notes: loanNotes || undefined,
        }),
      });
      const j = await r.json() as { error?: string };
      if (!r.ok) { setError(j.error ?? "Failed"); return; }
      setShowLoanForm(false);
      setLender(""); setPrincipal(""); setRate("0"); setDueDate(""); setLoanNotes("");
      loadLoans();
    } catch { setError("Network error"); } finally { setSaving(false); }
  }

  async function savePayment(loanId: string) {
    if (!payAmount) return;
    setSaving(true); setError("");
    try {
      const r = await fetch("/api/admin/finance/loans", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_payment", loan_id: loanId,
          amount: parseFloat(payAmount), payment_date: payDate, payment_notes: payNotes || undefined,
        }),
      });
      const j = await r.json() as { error?: string };
      if (!r.ok) { setError(j.error ?? "Failed"); return; }
      setShowPayForm(null); setPayAmount(""); setPayNotes("");
      loadLoans();
    } catch { setError("Network error"); } finally { setSaving(false); }
  }

  const totalOutstanding = loans.reduce((s, l) => s + l.outstanding, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f7" }}>
      <div style={{ background: "#111", padding: "14px 32px", display: "flex", alignItems: "center", gap: 20 }}>
        <Link href="/admin/finance" style={{ fontFamily: FONT, fontSize: 12, color: "#888", textDecoration: "none" }}>← Finance</Link>
        <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 800, color: "#fff" }}>Loans & Credit</span>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: FONT, fontSize: 24, fontWeight: 900, color: "#111", margin: "0 0 4px", letterSpacing: "-0.02em" }}>Loan Tracker</h1>
            <p style={{ fontFamily: FONT, fontSize: 13, color: "#888", margin: 0 }}>
              {loans.length} loan{loans.length !== 1 ? "s" : ""} · Total outstanding: <strong style={{ color: "#c0392b" }}>{fKES(totalOutstanding)}</strong>
            </p>
          </div>
          <button onClick={() => setShowLoanForm(true)}
            style={{ fontFamily: FONT, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, padding: "9px 18px", cursor: "pointer", fontWeight: 700 }}>
            + Add Loan
          </button>
        </div>

        {/* Add loan modal */}
        {showLoanForm && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: 36, width: 500, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto" }}>
              <h2 style={{ fontFamily: FONT, fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 24px" }}>Add Loan / Credit</h2>
              <form onSubmit={saveLoan}>
                <label style={lbl}>Lender Name *</label>
                <input value={lender} onChange={e => setLender(e.target.value)} placeholder="e.g. Equity Bank, KCB, Mama" style={inp} required />

                <label style={lbl}>Loan Type</label>
                <select value={loanType} onChange={e => setLoanType(e.target.value)} style={sel}>
                  {LOAN_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={lbl}>Principal Amount (KES) *</label>
                    <input type="number" value={principal} onChange={e => setPrincipal(e.target.value)} placeholder="0" style={inp} required min="1" />
                  </div>
                  <div>
                    <label style={lbl}>Interest Rate (% p.a.)</label>
                    <input type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="0" style={inp} min="0" max="100" step="0.01" />
                  </div>
                  <div>
                    <label style={lbl}>Start Date *</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inp} required />
                  </div>
                  <div>
                    <label style={lbl}>Due Date (optional)</label>
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inp} />
                  </div>
                </div>

                <label style={lbl}>Notes</label>
                <textarea value={loanNotes} onChange={e => setLoanNotes(e.target.value)} rows={2}
                  placeholder="Collateral, terms, purpose…"
                  style={{ ...inp, resize: "vertical", height: "auto" }} />

                {error && <p style={{ fontFamily: FONT, fontSize: 12, color: "#c0392b", margin: "0 0 12px" }}>{error}</p>}
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="submit" disabled={saving}
                    style={{ flex: 1, padding: "12px 0", background: saving ? "#ccc" : "#7c3aed", color: "#fff", border: "none", borderRadius: 6, fontFamily: FONT, fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
                    {saving ? "Saving…" : "Add Loan"}
                  </button>
                  <button type="button" onClick={() => setShowLoanForm(false)}
                    style={{ padding: "12px 20px", background: "#f1f1f1", color: "#555", border: "none", borderRadius: 6, fontFamily: FONT, fontSize: 12, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add payment modal */}
        {showPayForm && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: 36, width: 420, maxWidth: "95vw" }}>
              <h2 style={{ fontFamily: FONT, fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 24px" }}>Record Repayment</h2>
              <label style={lbl}>Amount Paid (KES) *</label>
              <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="0" style={inp} required min="1" autoFocus />
              <label style={lbl}>Payment Date *</label>
              <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} style={inp} required />
              <label style={lbl}>Notes</label>
              <input value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="e.g. Bank ref #123" style={inp} />
              {error && <p style={{ fontFamily: FONT, fontSize: 12, color: "#c0392b", margin: "0 0 12px" }}>{error}</p>}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => void savePayment(showPayForm)} disabled={saving}
                  style={{ flex: 1, padding: "12px 0", background: saving ? "#ccc" : "#2e7d32", color: "#fff", border: "none", borderRadius: 6, fontFamily: FONT, fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "Saving…" : "Record Payment"}
                </button>
                <button onClick={() => { setShowPayForm(null); setPayAmount(""); setPayNotes(""); setError(""); }}
                  style={{ padding: "12px 20px", background: "#f1f1f1", color: "#555", border: "none", borderRadius: 6, fontFamily: FONT, fontSize: 12, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <p style={{ fontFamily: FONT, fontSize: 14, color: "#aaa" }}>Loading loans…</p>
        ) : loans.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 10, padding: 48, textAlign: "center", border: "1px solid #e8e8e8" }}>
            <p style={{ fontFamily: FONT, fontSize: 14, color: "#aaa" }}>No loans recorded yet.</p>
            <button onClick={() => setShowLoanForm(true)} style={{ marginTop: 16, fontFamily: FONT, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, padding: "10px 20px", cursor: "pointer" }}>
              Add First Loan
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {loans.map(loan => {
              const pct = loan.principal_amount > 0
                ? Math.min(100, (loan.amount_paid / loan.principal_amount) * 100) : 0;
              const overdue = loan.due_date && loan.outstanding > 0 && new Date(loan.due_date) < new Date();
              return (
                <div key={loan.id} style={{ background: "#fff", borderRadius: 10, padding: 22, border: `1px solid ${overdue ? "#f5c6cb" : "#e8e8e8"}`, borderLeft: `4px solid ${overdue ? "#c0392b" : loan.outstanding <= 0 ? "#2e7d32" : "#7c3aed"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <p style={{ fontFamily: FONT, fontSize: 16, fontWeight: 800, color: "#111", margin: 0 }}>{loan.lender_name}</p>
                        <span style={{ fontFamily: FONT, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 10, background: loan.outstanding <= 0 ? "#e8f5e9" : overdue ? "#fde8e8" : "#f3e8ff", color: loan.outstanding <= 0 ? "#2e7d32" : overdue ? "#c0392b" : "#7c3aed", fontWeight: 700 }}>
                          {loan.outstanding <= 0 ? "PAID OFF" : overdue ? "OVERDUE" : "ACTIVE"}
                        </span>
                      </div>
                      <p style={{ fontFamily: FONT, fontSize: 12, color: "#888", margin: "0 0 12px" }}>
                        {loan.loan_type} · {loan.interest_rate > 0 ? `${loan.interest_rate}% p.a.` : "0% interest"} · Started {loan.start_date}
                        {loan.due_date ? ` · Due ${loan.due_date}` : ""}
                      </p>
                      {/* Progress bar */}
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ height: 6, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", background: loan.outstanding <= 0 ? "#2e7d32" : "#7c3aed", width: `${pct}%`, borderRadius: 3, transition: "width 0.3s" }} />
                        </div>
                        <p style={{ fontFamily: FONT, fontSize: 10, color: "#aaa", margin: "4px 0 0" }}>{pct.toFixed(0)}% repaid</p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontFamily: FONT, fontSize: 11, color: "#888", margin: "0 0 2px" }}>Principal</p>
                      <p style={{ fontFamily: FONT, fontSize: 16, fontWeight: 800, color: "#111", margin: "0 0 8px" }}>{fKES(loan.principal_amount)}</p>
                      <p style={{ fontFamily: FONT, fontSize: 11, color: "#888", margin: "0 0 2px" }}>Outstanding</p>
                      <p style={{ fontFamily: FONT, fontSize: 20, fontWeight: 900, color: loan.outstanding <= 0 ? "#2e7d32" : "#c0392b", margin: "0 0 10px" }}>{fKES(Math.max(0, loan.outstanding))}</p>
                      {loan.outstanding > 0 && (
                        <button onClick={() => { setShowPayForm(loan.id); setError(""); }}
                          style={{ fontFamily: FONT, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", background: "#2e7d32", color: "#fff", border: "none", borderRadius: 4, padding: "7px 14px", cursor: "pointer", fontWeight: 700 }}>
                          Record Payment
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Payment history */}
                  {loan.loan_payments.length > 0 && (
                    <div style={{ marginTop: 12, borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
                      <p style={{ fontFamily: FONT, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#aaa", margin: "0 0 8px" }}>Payment History</p>
                      {loan.loan_payments.slice().sort((a, b) => b.payment_date.localeCompare(a.payment_date)).map(p => (
                        <div key={p.id} style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT, fontSize: 12, color: "#555", marginBottom: 4 }}>
                          <span>{p.payment_date}{p.notes ? ` — ${p.notes}` : ""}</span>
                          <span style={{ fontWeight: 700, color: "#2e7d32" }}>{fKES(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { fontFamily: FONT, fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: 5 };
const inp: React.CSSProperties = { display: "block", width: "100%", padding: "9px 12px", border: "1px solid #e0e0e0", borderRadius: 6, fontFamily: FONT, fontSize: 13, color: "#111", outline: "none", boxSizing: "border-box", marginBottom: 14 };
const sel: React.CSSProperties = { ...inp };
