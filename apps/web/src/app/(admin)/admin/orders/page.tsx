import type { Metadata } from "next";

export const metadata: Metadata = { title: "Orders" };

const ORDER_COLUMNS = [
  "Order Ref",
  "Date",
  "Customer",
  "Items",
  "Total",
  "Status",
] as const;

// When Supabase is connected, fetch from the `orders` table here:
// const { data: orders } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
const orders: never[] = [];

export default function AdminOrdersPage() {
  return (
    <div>
      {/* Page header */}
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
          Recent Orders
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
          Orders
        </h1>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "var(--font-inter)",
          }}
        >
          {/* Header */}
          <thead>
            <tr style={{ background: "var(--es-ink)" }}>
              {ORDER_COLUMNS.map((col) => (
                <th
                  key={col}
                  style={{
                    padding: "14px 20px",
                    textAlign: "left",
                    fontFamily: "var(--font-inter)",
                    fontSize: 11,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "#ffffff",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={ORDER_COLUMNS.length}
                  style={{
                    padding: "48px 20px",
                    textAlign: "center",
                    background: "#ffffff",
                    border: "1px solid var(--es-bone)",
                  }}
                >
                  {/* Empty state card */}
                  <div
                    style={{
                      maxWidth: 400,
                      margin: "0 auto",
                      padding: "40px 24px",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "var(--font-bodoni)",
                        fontStyle: "italic",
                        fontSize: 22,
                        color: "var(--es-ink)",
                        marginBottom: 12,
                      }}
                    >
                      No orders yet.
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: 14,
                        color: "var(--es-mute)",
                        lineHeight: 1.6,
                      }}
                    >
                      Orders will appear here once customers start checking out.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              <tr>
                <td
                  colSpan={ORDER_COLUMNS.length}
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    fontFamily: "var(--font-inter)",
                    fontSize: 14,
                    color: "var(--es-mute)",
                    background: "#ffffff",
                  }}
                >
                  No orders to display.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
