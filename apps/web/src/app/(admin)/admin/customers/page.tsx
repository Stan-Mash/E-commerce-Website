"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

interface CustomerRow {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  created_at: string;
  order_count: number;
  total_spent: number;
  last_order_at: string | null;
}

function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const PAGE_SIZE = 25;

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const load = useCallback(() => {
    fetch("/api/admin/customers")
      .then(async (res) => {
        if (res.status === 401) { window.location.href = "/admin/login"; return; }
        if (res.ok) {
          const json = await res.json() as { customers: CustomerRow[] };
          setCustomers(json.customers ?? []);
        }
      })
      .catch(() => {
        // ignore
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Derive top 3 customer ids by total_spent
  const topCustomerIds = useMemo(() => {
    const sorted = [...customers].sort((a, b) => b.total_spent - a.total_spent);
    return new Set(sorted.slice(0, 3).map((c) => c.id));
  }, [customers]);

  // Filtered customers
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.phone.toLowerCase().includes(q) ||
        (c.name ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q)
    );
  }, [customers, search]);

  // Reset to page 1 when search changes
  const [prevSearch, setPrevSearch] = useState(search);
  if (search !== prevSearch) {
    setPrevSearch(search);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const endIdx = Math.min(startIdx + PAGE_SIZE, filtered.length);
  const pageCustomers = filtered.slice(startIdx, endIdx);

  function openPanel(customer: CustomerRow) {
    setSelectedCustomer(customer);
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setTimeout(() => setSelectedCustomer(null), 300);
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 11,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "var(--es-gold)",
            marginBottom: 8,
          }}
        >
          CRM
        </p>
        <h1
          style={{
            fontFamily: "var(--font-bodoni)",
            fontSize: 36,
            fontWeight: 400,
            color: "var(--es-ink)",
            margin: 0,
          }}
        >
          Customers
        </h1>
      </div>

      {/* Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 20,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            background: "var(--es-white)",
            padding: "24px 20px",
            borderTop: "3px solid var(--es-plum)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-bodoni)",
              fontSize: 32,
              color: "var(--es-plum)",
              margin: "0 0 6px",
              fontWeight: 400,
            }}
          >
            {loading ? "—" : customers.length}
          </p>
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 11,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--es-mute)",
              margin: 0,
            }}
          >
            Total Customers
          </p>
        </div>
        <div
          style={{
            background: "var(--es-white)",
            padding: "24px 20px",
            borderTop: "3px solid var(--es-gold)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-bodoni)",
              fontSize: 32,
              color: "var(--es-gold)",
              margin: "0 0 6px",
              fontWeight: 400,
            }}
          >
            {loading
              ? "—"
              : formatKES(customers.reduce((s, c) => s + c.total_spent, 0))}
          </p>
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 11,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--es-mute)",
              margin: 0,
            }}
          >
            Total Revenue
          </p>
        </div>
      </div>

      {/* Search */}
      <div
        style={{
          position: "relative",
          marginBottom: 24,
          borderBottom: "2px solid var(--es-ink)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingBottom: 10,
        }}
      >
        {/* Magnifying glass icon */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--es-mute)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search by phone, name, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "var(--font-inter)",
            fontSize: 14,
            color: "var(--es-ink)",
            padding: 0,
          }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--es-mute)",
              fontFamily: "var(--font-inter)",
              fontSize: 16,
              padding: "0 4px",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-inter)" }}>
          <thead>
            <tr style={{ background: "var(--es-ink)" }}>
              {["Phone", "Name", "Orders", "Total Spent", "Avg Order", "Last Order", "Joined"].map((col, i) => (
                <th
                  key={i}
                  style={{
                    padding: "14px 20px",
                    textAlign: i >= 2 ? "right" : "left",
                    fontFamily: "var(--font-inter)",
                    fontSize: 11,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "var(--es-white)",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "48px",
                    textAlign: "center",
                    background: "var(--es-white)",
                    fontFamily: "var(--font-inter)",
                    fontSize: 14,
                    color: "var(--es-mute)",
                  }}
                >
                  Loading customers…
                </td>
              </tr>
            ) : pageCustomers.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "48px",
                    textAlign: "center",
                    background: "var(--es-white)",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-bodoni)",
                      fontStyle: "italic",
                      fontSize: 20,
                      color: "var(--es-ink)",
                    }}
                  >
                    {search ? "No customers match your search." : "No customers yet."}
                  </p>
                </td>
              </tr>
            ) : (
              pageCustomers.map((customer, index) => {
                const isEven = index % 2 === 0;
                const isTop = topCustomerIds.has(customer.id);
                const avgOrder =
                  customer.order_count > 0
                    ? customer.total_spent / customer.order_count
                    : 0;
                const isSelected = selectedCustomer?.id === customer.id && panelOpen;

                return (
                  <tr
                    key={customer.id}
                    onClick={() => openPanel(customer)}
                    style={{
                      background: isSelected
                        ? "rgba(139, 90, 43, 0.06)"
                        : isEven
                        ? "var(--es-white)"
                        : "var(--es-paper)",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLTableRowElement).style.background =
                          "rgba(0,0,0,0.04)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLTableRowElement).style.background =
                          isEven ? "var(--es-white)" : "var(--es-paper)";
                      }
                    }}
                  >
                    <td style={{ padding: "14px 20px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--es-ink)",
                        }}
                      >
                        {customer.phone}
                      </span>
                    </td>

                    <td style={{ padding: "14px 20px" }}>
                      <div>
                        <span
                          style={{
                            fontFamily: "var(--font-inter)",
                            fontSize: 13,
                            color: "var(--es-ink)",
                          }}
                        >
                          {isTop && (
                            <span
                              style={{ marginRight: 4, fontSize: 13 }}
                              title="Top 3 customer by spend"
                            >
                              ⭐
                            </span>
                          )}
                          {customer.name ?? "—"}
                        </span>
                        {customer.email && (
                          <p
                            style={{
                              fontFamily: "var(--font-inter)",
                              fontSize: 11,
                              color: "var(--es-mute)",
                              margin: "2px 0 0",
                            }}
                          >
                            {customer.email}
                          </p>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 14,
                          color: "var(--es-ink)",
                        }}
                      >
                        {customer.order_count}
                      </span>
                    </td>

                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--es-ink)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatKES(customer.total_spent)}
                      </span>
                    </td>

                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 13,
                          color: "var(--es-mute)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {customer.order_count > 0 ? formatKES(avgOrder) : "—"}
                      </span>
                    </td>

                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 13,
                          color: "var(--es-mute)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDate(customer.last_order_at)}
                      </span>
                    </td>

                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 13,
                          color: "var(--es-mute)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDate(customer.created_at)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 24,
            fontFamily: "var(--font-inter)",
            fontSize: 13,
            color: "var(--es-mute)",
          }}
        >
          <span>
            Showing {startIdx + 1}–{endIdx} of {filtered.length}
            {search ? ` (filtered from ${customers.length})` : ""}
          </span>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              style={{
                padding: "8px 16px",
                border: "1px solid var(--es-ink)",
                background: "var(--es-white)",
                fontFamily: "var(--font-inter)",
                fontSize: 12,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: safePage === 1 ? "not-allowed" : "pointer",
                opacity: safePage === 1 ? 0.35 : 1,
                color: "var(--es-ink)",
              }}
            >
              ← Prev
            </button>

            <span style={{ minWidth: 80, textAlign: "center" }}>
              {safePage} / {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              style={{
                padding: "8px 16px",
                border: "1px solid var(--es-ink)",
                background: "var(--es-white)",
                fontFamily: "var(--font-inter)",
                fontSize: 12,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: safePage === totalPages ? "not-allowed" : "pointer",
                opacity: safePage === totalPages ? 0.35 : 1,
                color: "var(--es-ink)",
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Overlay */}
      {panelOpen && (
        <div
          onClick={closePanel}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.25)",
            zIndex: 40,
          }}
        />
      )}

      {/* Customer Detail Side Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          // Uncapped 380px ran off the left edge on any phone narrower than
          // that (i.e. almost all of them) since right:0 pins the panel to
          // the viewport edge regardless of how much space is left.
          width: "min(380px, 100vw)",
          height: "100vh",
          background: "#ffffff",
          boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.12)",
          zIndex: 50,
          transform: panelOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {selectedCustomer && (
          <>
            {/* Panel header */}
            <div
              style={{
                padding: "28px 28px 20px",
                borderBottom: "1px solid #e8e4de",
                position: "relative",
              }}
            >
              <button
                onClick={closePanel}
                style={{
                  position: "absolute",
                  top: 20,
                  right: 20,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 18,
                  color: "#888",
                  lineHeight: 1,
                  padding: 4,
                }}
                aria-label="Close panel"
              >
                ✕
              </button>

              <p
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 10,
                  letterSpacing: "0.4em",
                  textTransform: "uppercase",
                  color: "var(--es-gold)",
                  margin: "0 0 8px",
                }}
              >
                Customer Profile
              </p>

              <h2
                style={{
                  fontFamily: "var(--font-bodoni)",
                  fontSize: 26,
                  fontWeight: 400,
                  color: "var(--es-ink)",
                  margin: "0 0 4px",
                  paddingRight: 32,
                }}
              >
                {topCustomerIds.has(selectedCustomer.id) && (
                  <span style={{ marginRight: 6 }} title="Top 3 customer by spend">
                    ⭐
                  </span>
                )}
                {selectedCustomer.name ?? "Unknown"}
              </h2>

              <p
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 13,
                  color: "var(--es-mute)",
                  margin: 0,
                }}
              >
                {selectedCustomer.phone}
              </p>
            </div>

            {/* Panel body */}
            <div style={{ padding: "24px 28px", flex: 1 }}>
              {/* Contact info */}
              <div style={{ marginBottom: 28 }}>
                <p
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: 10,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "var(--es-mute)",
                    margin: "0 0 12px",
                  }}
                >
                  Contact
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <span
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: 11,
                        color: "var(--es-mute)",
                        display: "block",
                        marginBottom: 2,
                      }}
                    >
                      Phone
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--es-ink)",
                      }}
                    >
                      {selectedCustomer.phone}
                    </span>
                  </div>

                  <div>
                    <span
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: 11,
                        color: "var(--es-mute)",
                        display: "block",
                        marginBottom: 2,
                      }}
                    >
                      Email
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: 14,
                        color: "var(--es-ink)",
                      }}
                    >
                      {selectedCustomer.email ?? "—"}
                    </span>
                  </div>

                  <div>
                    <span
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: 11,
                        color: "var(--es-mute)",
                        display: "block",
                        marginBottom: 2,
                      }}
                    >
                      Joined
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: 14,
                        color: "var(--es-ink)",
                      }}
                    >
                      {formatDate(selectedCustomer.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ borderTop: "1px solid #e8e4de", marginBottom: 28 }} />

              {/* Stats */}
              <div style={{ marginBottom: 28 }}>
                <p
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: 10,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "var(--es-mute)",
                    margin: "0 0 16px",
                  }}
                >
                  Purchase Summary
                </p>

                <div
                  className="grid grid-cols-2"
                  style={{
                    gap: 16,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      background: "#f9f7f4",
                      padding: "16px",
                      borderTop: "2px solid var(--es-plum)",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "var(--font-bodoni)",
                        fontSize: 28,
                        color: "var(--es-plum)",
                        margin: "0 0 4px",
                        fontWeight: 400,
                      }}
                    >
                      {selectedCustomer.order_count}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: 10,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "var(--es-mute)",
                        margin: 0,
                      }}
                    >
                      Orders
                    </p>
                  </div>

                  <div
                    style={{
                      background: "#f9f7f4",
                      padding: "16px",
                      borderTop: "2px solid var(--es-gold)",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "var(--font-bodoni)",
                        fontSize: 22,
                        color: "var(--es-gold)",
                        margin: "0 0 4px",
                        fontWeight: 400,
                      }}
                    >
                      {formatKES(selectedCustomer.total_spent)}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: 10,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "var(--es-mute)",
                        margin: 0,
                      }}
                    >
                      Total Spent
                    </p>
                  </div>
                </div>

                {/* Avg order value */}
                <div
                  style={{
                    background: "#f9f7f4",
                    padding: "14px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-inter)",
                      fontSize: 11,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "var(--es-mute)",
                    }}
                  >
                    Avg Order Value
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-inter)",
                      fontSize: 15,
                      fontWeight: 600,
                      color: "var(--es-ink)",
                    }}
                  >
                    {selectedCustomer.order_count > 0
                      ? formatKES(selectedCustomer.total_spent / selectedCustomer.order_count)
                      : "—"}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div style={{ borderTop: "1px solid #e8e4de", marginBottom: 24 }} />

              {/* View Orders link */}
              <a
                href={`/admin/orders?phone=${encodeURIComponent(selectedCustomer.phone)}`}
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "14px 20px",
                  background: "var(--es-ink)",
                  color: "var(--es-white)",
                  fontFamily: "var(--font-inter)",
                  fontSize: 11,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
              >
                View Orders →
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
