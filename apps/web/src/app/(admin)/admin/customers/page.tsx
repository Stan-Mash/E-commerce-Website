"use client";

import { useState, useEffect, useCallback } from "react";

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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/customers");
      if (res.status === 401) { window.location.href = "/admin/login"; return; }
      if (res.ok) {
        const json = await res.json() as { customers: CustomerRow[] };
        setCustomers(json.customers ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
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

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-inter)" }}>
          <thead>
            <tr style={{ background: "var(--es-ink)" }}>
              {["Phone", "Name", "Orders", "Total Spent", "Last Order", "Joined"].map((col, i) => (
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
                  colSpan={6}
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
            ) : customers.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
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
                    No customers yet.
                  </p>
                </td>
              </tr>
            ) : (
              customers.map((customer, index) => {
                const isEven = index % 2 === 0;
                return (
                  <tr
                    key={customer.id}
                    style={{ background: isEven ? "var(--es-white)" : "var(--es-paper)" }}
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
                        {customer.last_order_at
                          ? new Date(customer.last_order_at).toLocaleDateString("en-KE", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
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
                        {new Date(customer.created_at).toLocaleDateString("en-KE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
