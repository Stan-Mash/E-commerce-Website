"use client";

/**
 * Elite Style Co — POS Terminal
 *
 * Features:
 *  • Barcode scanner (USB/Bluetooth — acts like keyboard, detected by keystroke speed)
 *  • Multi-location stock (location selector at top)
 *  • Shift management (open/close with cash float)
 *  • Three payment modes: Cash · M-Pesa STK · M-Pesa C2B (Till)
 *  • C2B live screen — Supabase Realtime subscription shows "Paid" the instant
 *    Safaricom's webhook fires (no polling required)
 *  • Promo code discount engine
 *  • Web Serial thermal receipt printer (ESC/POS)
 *  • Omnichannel customer upsert by phone
 */

import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { createClient } from "@supabase/supabase-js";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SKU {
  id:             string;
  sku_code:       string;
  size:           string;
  color:          string | null;
  stock_quantity: number;
}

interface Product {
  id:         string;
  name:       string;
  category:   string;
  base_price: number;
  skus:       SKU[];
}

interface CartItem {
  sku_id:       string;
  sku_code:     string;
  product_name: string;
  size:         string;
  color:        string | null;
  unit_price:   number;
  quantity:     number;
}

interface Location {
  id:   string;
  name: string;
  type: string;
}

interface Shift {
  id:            string;
  cashier_name:  string;
  opening_float: number;
  opened_at:     string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style:                 "currency",
    currency:              "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Web Serial receipt printer ────────────────────────────────────────────────

async function printReceipt(params: {
  orderRef:    string;
  items:       CartItem[];
  subtotal:    number;
  discount:    number;
  total:       number;
  cashierName: string;
  phone:       string;
}): Promise<void> {
  if (!("serial" in navigator)) {
    alert("Web Serial API not supported in this browser.\nUse Chrome or Edge on desktop.");
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let port: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    port = await (navigator as any).serial.requestPort();
    await port.open({ baudRate: 9600 });
  } catch {
    alert("Could not connect to printer. Make sure it is plugged in and try again.");
    return;
  }

  // Build ESC/POS byte stream
  const enc  = new TextEncoder();
  const ESC  = 0x1b;
  const GS   = 0x1d;

  function text(s: string): Uint8Array { return enc.encode(s); }
  function cmd(...bytes: number[]): Uint8Array { return new Uint8Array(bytes); }

  const init           = cmd(ESC, 0x40);                   // initialise printer
  const alignCentre    = cmd(ESC, 0x61, 0x01);
  const alignLeft      = cmd(ESC, 0x61, 0x00);
  const boldOn         = cmd(ESC, 0x45, 0x01);
  const boldOff        = cmd(ESC, 0x45, 0x00);
  const doubleSizeOn   = cmd(GS,  0x21, 0x11);
  const doubleSizeOff  = cmd(GS,  0x21, 0x00);
  const cut            = cmd(GS,  0x56, 0x00);             // full cut
  const lf             = cmd(0x0a);

  const date = new Date().toLocaleString("en-KE", {
    dateStyle: "short",
    timeStyle: "short",
  });

  function line(s = ""): Uint8Array { return enc.encode(s + "\n"); }
  function separator(): Uint8Array  { return enc.encode("-".repeat(32) + "\n"); }

  const chunks: Uint8Array[] = [
    init,
    alignCentre, doubleSizeOn, boldOn,
    line("ELITE STYLE CO"),
    doubleSizeOff, boldOff,
    line("Nairobi, Kenya"),
    line(date),
    lf,
    separator(),
    alignLeft,
  ];

  for (const item of params.items) {
    const label = `${item.product_name} (${item.size}${item.color ? "/" + item.color : ""})`;
    const price = formatKES(item.unit_price * item.quantity);
    chunks.push(line(`${item.quantity}x ${label}`));
    chunks.push(line(`   ${" ".repeat(Math.max(0, 28 - price.length))}${price}`));
  }

  chunks.push(separator());

  if (params.discount > 0) {
    const disc = `-${formatKES(params.discount)}`;
    chunks.push(line(`Subtotal:${" ".repeat(Math.max(0, 23 - formatKES(params.subtotal).length))}${formatKES(params.subtotal)}`));
    chunks.push(line(`Discount:${" ".repeat(Math.max(0, 23 - disc.length))}${disc}`));
    chunks.push(separator());
  }

  const totalStr = formatKES(params.total);
  chunks.push(boldOn, doubleSizeOn);
  chunks.push(line(`TOTAL:${" ".repeat(Math.max(0, 26 - totalStr.length))}${totalStr}`));
  chunks.push(doubleSizeOff, boldOff, lf);

  chunks.push(alignCentre);
  chunks.push(line(`Ref: ${params.orderRef}`));
  if (params.phone) chunks.push(line(`Customer: ${params.phone}`));
  chunks.push(line(`Cashier: ${params.cashierName}`));
  chunks.push(lf, line("Thank you for shopping with us!"), line("www.elitestyleco.co.ke"));
  chunks.push(lf, lf, lf, cut);

  // Write to printer
  const writer = port.writable!.getWriter();
  for (const chunk of chunks) await writer.write(chunk);
  writer.releaseLock();
  await port.close();
}

// ── Main component ────────────────────────────────────────────────────────────

export default function POSPage() {
  // ── State ──
  const [products,       setProducts]      = useState<Product[]>([]);
  const [locations,      setLocations]     = useState<Location[]>([]);
  const [locationId,     setLocationId]    = useState<string>("");
  const [loading,        setLoading]       = useState(true);
  const [search,         setSearch]        = useState("");
  const [cart,           setCart]          = useState<CartItem[]>([]);
  const [phone,          setPhone]         = useState("");
  const [cashierName,    setCashierName]   = useState("");
  const [paymentMethod,  setPaymentMethod] = useState<"cash" | "mpesa_stk" | "mpesa_c2b">("cash");
  const [promoCode,      setPromoCode]     = useState("");
  const [completing,     setCompleting]    = useState(false);
  const [successRef,     setSuccessRef]    = useState<string | null>(null);
  const [errorMsg,       setErrorMsg]      = useState<string | null>(null);

  // Shift state
  const [shift,          setShift]         = useState<Shift | null>(null);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [openingFloat,   setOpeningFloat]  = useState("");
  const [closingFloat,   setClosingFloat]  = useState("");
  const [shiftAction,    setShiftAction]   = useState<"open" | "close">("open");

  // C2B waiting screen
  const [c2bOrderId,     setC2bOrderId]    = useState<string | null>(null);
  const [c2bOrderRef,    setC2bOrderRef]   = useState<string | null>(null);
  const [c2bTotal,       setC2bTotal]      = useState<number>(0);
  const [c2bPaid,        setC2bPaid]       = useState(false);

  // Last sale summary (for receipt printing)
  const [lastSale, setLastSale] = useState<{
    orderRef: string; items: CartItem[]; subtotal: number; discount: number; total: number;
  } | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);

  // ── Load locations ──
  useEffect(() => {
    fetch("/api/admin/locations")
      .then((r) => r.json())
      .then((j: { locations: Location[] }) => {
        setLocations(j.locations ?? []);
        // Default to CBD Store
        const store = j.locations?.find((l) => l.type === "store");
        if (store) setLocationId(store.id);
      })
      .catch(() => {/* ignore */});
  }, []);

  // ── Load active shift for selected location ──
  const loadShift = useCallback(async (locId: string) => {
    if (!locId) return;
    const r = await fetch(`/api/admin/pos/shifts?location_id=${locId}`);
    const j = await r.json() as { shift: Shift | null };
    setShift(j.shift ?? null);
    if (!j.shift) setShowShiftModal(true); // prompt to open shift
  }, []);

  useEffect(() => {
    if (locationId) void loadShift(locationId);
  }, [locationId, loadShift]);

  // ── Load products ──
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/products");
      if (r.ok) {
        const j = await r.json() as { products: Product[] };
        setProducts((j.products ?? []).filter((p) => p.skus.some((s) => s.stock_quantity > 0)));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadProducts(); }, [loadProducts]);

  // ── Barcode scanner listener ──────────────────────────────────────────────
  // USB/BT scanners act like keyboards: rapid key presses ending with Enter.
  // We detect this by measuring inter-key timing: < 50 ms = scanner, not human.
  useEffect(() => {
    let buffer    = "";
    let lastTime  = 0;
    const SCANNER_THRESHOLD_MS = 50; // scanners fire a full barcode in < 30 ms

    function handleKeyDown(e: KeyboardEvent) {
      // Ignore keystrokes that go into a focused input (don't steal from search box etc.)
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const now = Date.now();

      if (e.key === "Enter") {
        if (buffer.length > 2) {
          void lookupBarcode(buffer.trim());
        }
        buffer = "";
        return;
      }

      // If gap is too large — human typing — reset buffer
      if (now - lastTime > 200) buffer = "";
      lastTime = now;

      if (e.key.length === 1) buffer += e.key;
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  async function lookupBarcode(code: string) {
    // Search all loaded SKUs by sku_code
    for (const product of products) {
      const sku = product.skus.find((s) => s.sku_code === code);
      if (sku) {
        addToCart(product, sku);
        return;
      }
    }
    // Not found locally — flash search box with the code for manual lookup
    setSearch(code);
    searchRef.current?.focus();
  }

  // ── Supabase Realtime for C2B ─────────────────────────────────────────────
  useEffect(() => {
    if (!c2bOrderId) return;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel(`c2b-order-${c2bOrderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${c2bOrderId}` },
        (payload) => {
          if ((payload.new as { status: string }).status === "paid") {
            setC2bPaid(true);
          }
        }
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [c2bOrderId]);

  // ── Cart operations ───────────────────────────────────────────────────────

  const filtered = search.trim()
    ? products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.skus.some((s) => s.sku_code.toLowerCase().includes(search.toLowerCase()))
      )
    : products;

  function addToCart(product: Product, sku: SKU) {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.sku_id === sku.id);
      if (idx >= 0) {
        return prev.map((c, i) =>
          i === idx ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, {
        sku_id:       sku.id,
        sku_code:     sku.sku_code,
        product_name: product.name,
        size:         sku.size,
        color:        sku.color,
        unit_price:   Math.round(product.base_price),
        quantity:     1,
      }];
    });
  }

  function updateQty(skuId: string, delta: number) {
    setCart((prev) =>
      prev.map((c) => c.sku_id === skuId ? { ...c, quantity: c.quantity + delta } : c)
          .filter((c) => c.quantity > 0)
    );
  }

  function clearCart() {
    setCart([]);
    setPhone("");
    setPromoCode("");
    setSuccessRef(null);
    setErrorMsg(null);
    setC2bOrderId(null);
    setC2bOrderRef(null);
    setC2bPaid(false);
  }

  // ── Totals ────────────────────────────────────────────────────────────────

  const subtotal = cart.reduce((s, c) => s + c.unit_price * c.quantity, 0);
  // Simple inline discount check (full engine runs server-side)
  // Client shows a rough total; server is authoritative
  const displayTotal = Math.round(subtotal);

  // ── Shift management ──────────────────────────────────────────────────────

  async function openShift() {
    const float = parseFloat(openingFloat) || 0;
    const r = await fetch("/api/admin/pos/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "open", location_id: locationId,
        cashier_name: cashierName || "Staff", opening_float: float,
      }),
    });
    const j = await r.json() as { shift?: Shift; error?: string };
    if (r.ok) {
      setShift(j.shift ?? null);
      setShowShiftModal(false);
      setCashierName(j.shift?.cashier_name ?? cashierName);
    } else {
      setErrorMsg(j.error ?? "Failed to open shift");
    }
  }

  async function closeShift() {
    if (!shift) return;
    const float = parseFloat(closingFloat) || 0;
    const r = await fetch("/api/admin/pos/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close", shift_id: shift.id, closing_float: float }),
    });
    const j = await r.json() as { shift?: { variance: number; expected_float: number }; error?: string };
    if (r.ok) {
      const variance = j.shift?.variance ?? 0;
      const expected = j.shift?.expected_float ?? 0;
      alert(
        `Shift closed.\nExpected float: ${formatKES(expected)}\nActual float: ${formatKES(float)}\nVariance: ${formatKES(variance)}`
      );
      setShift(null);
      setShowShiftModal(false);
      clearCart();
    } else {
      setErrorMsg(j.error ?? "Failed to close shift");
    }
  }

  // ── Complete sale ─────────────────────────────────────────────────────────

  async function completeSale() {
    if (cart.length === 0 || !locationId) return;
    setCompleting(true);
    setErrorMsg(null);

    try {
      const r = await fetch("/api/admin/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          payment_method:  paymentMethod,
          location_id:     locationId,
          cashier_name:    cashierName || shift?.cashier_name || "Staff",
          items:           cart.map((c) => ({
            sku_id: c.sku_id, quantity: c.quantity, unit_price: c.unit_price,
          })),
          promo_code:      promoCode || undefined,
        }),
      });

      const j = await r.json() as {
        order_id?: string;
        order_ref?: string;
        total?: number;
        discount_amount?: number;
        payment_method?: string;
        checkout_request_id?: string;
        customer_message?: string;
        instruction?: string;
        error?: string;
      };

      if (!r.ok) {
        setErrorMsg(j.error ?? "Failed to complete sale.");
        return;
      }

      // Save last sale for receipt printing
      setLastSale({
        orderRef: j.order_ref ?? "",
        items:    [...cart],
        subtotal: Math.round(cart.reduce((s, c) => s + c.unit_price * c.quantity, 0)),
        discount: j.discount_amount ?? 0,
        total:    j.total ?? displayTotal,
      });

      if (paymentMethod === "mpesa_c2b") {
        // Show C2B waiting screen with Realtime subscription
        setC2bOrderId(j.order_id ?? null);
        setC2bOrderRef(j.order_ref ?? null);
        setC2bTotal(j.total ?? 0);
        setC2bPaid(false);
        setCart([]);
      } else {
        setSuccessRef(j.order_ref ?? "N/A");
        setCart([]);
        void loadProducts();
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setCompleting(false);
    }
  }

  // ── Styles ────────────────────────────────────────────────────────────────

  const BTN: React.CSSProperties = {
    fontFamily:     "var(--font-inter)",
    fontSize:       12,
    letterSpacing:  "0.2em",
    textTransform:  "uppercase",
    border:         "none",
    cursor:         "pointer",
    padding:        "10px 16px",
    borderRadius:   4,
  };

  // ── C2B waiting screen ─────────────────────────────────────────────────────

  if (c2bOrderId && !c2bPaid) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 24 }}>
        <div style={{ textAlign: "center", padding: "48px", background: "var(--es-white)", border: "1px solid var(--es-bone)", borderRadius: 12, maxWidth: 480, width: "100%" }}>
          <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--es-gold)", marginBottom: 16 }}>
            Awaiting Payment
          </p>
          <p style={{ fontFamily: "var(--font-bodoni)", fontSize: 40, color: "var(--es-ink)", margin: "0 0 8px" }}>
            {formatKES(c2bTotal)}
          </p>
          <div style={{ background: "var(--es-plum-lt)", border: "2px solid var(--es-plum)", borderRadius: 8, padding: "16px 24px", margin: "24px 0" }}>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "var(--es-plum)", marginBottom: 4, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Tell customer to enter this reference:
            </p>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 28, fontWeight: 700, color: "var(--es-plum)", margin: 0, letterSpacing: "0.05em" }}>
              {c2bOrderRef}
            </p>
          </div>
          <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "var(--es-mute)", lineHeight: 1.6 }}>
            Screen will automatically update when Safaricom confirms the payment.
          </p>
          <button
            onClick={clearCart}
            style={{ marginTop: 24, ...BTN, background: "var(--es-bone)", color: "var(--es-ink)" }}
          >
            Cancel Order
          </button>
        </div>
      </div>
    );
  }

  if (c2bPaid) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 24 }}>
        <div style={{ textAlign: "center", padding: "48px", background: "#e8f5e9", border: "2px solid #66bb6a", borderRadius: 12, maxWidth: 480, width: "100%" }}>
          <p style={{ fontFamily: "var(--font-bodoni)", fontSize: 48, color: "#2e7d32", margin: "0 0 8px" }}>✓ Paid</p>
          <p style={{ fontFamily: "var(--font-inter)", fontSize: 16, color: "#2e7d32", fontWeight: 600 }}>{c2bOrderRef}</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
            {lastSale && (
              <button
                onClick={() => void printReceipt({ ...lastSale, cashierName: cashierName || "Staff", phone })}
                style={{ ...BTN, background: "var(--es-plum)", color: "#fff" }}
              >
                Print Receipt
              </button>
            )}
            <button
              onClick={() => { clearCart(); void loadProducts(); }}
              style={{ ...BTN, background: "#2e7d32", color: "#fff" }}
            >
              New Sale
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Shift modal ───────────────────────────────────────────────────────────

  const ShiftModal = () => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "var(--es-white)", borderRadius: 12, padding: 40, width: 400, maxWidth: "90vw" }}>
        <h2 style={{ fontFamily: "var(--font-bodoni)", fontSize: 28, color: "var(--es-ink)", margin: "0 0 24px" }}>
          {shiftAction === "open" ? "Open Shift" : "Close Shift"}
        </h2>

        {shiftAction === "open" ? (
          <>
            <label style={labelStyle}>Cashier Name</label>
            <input value={cashierName} onChange={(e) => setCashierName(e.target.value)} placeholder="Your name" style={inputStyle} />
            <label style={labelStyle}>Opening Cash Float (KES)</label>
            <input value={openingFloat} onChange={(e) => setOpeningFloat(e.target.value)} type="number" placeholder="0" style={inputStyle} />
            <button onClick={() => void openShift()} style={{ ...BTN, background: "var(--es-plum)", color: "#fff", width: "100%", marginTop: 8 }}>
              Open Shift
            </button>
          </>
        ) : (
          <>
            <label style={labelStyle}>Closing Cash Count (KES)</label>
            <input value={closingFloat} onChange={(e) => setClosingFloat(e.target.value)} type="number" placeholder="0" style={inputStyle} />
            <button onClick={() => void closeShift()} style={{ ...BTN, background: "#c0392b", color: "#fff", width: "100%", marginTop: 8 }}>
              Close Shift
            </button>
          </>
        )}

        <button onClick={() => setShowShiftModal(false)} style={{ ...BTN, background: "none", color: "var(--es-mute)", width: "100%", marginTop: 8 }}>
          Cancel
        </button>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {showShiftModal && <ShiftModal />}

      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--es-gold)", marginBottom: 8 }}>
            In-Store
          </p>
          <h1 style={{ fontFamily: "var(--font-bodoni)", fontSize: 36, fontWeight: 400, color: "var(--es-ink)", margin: 0 }}>
            POS Terminal
          </h1>
        </div>

        {/* Location + Shift controls */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 4, border: "1px solid var(--es-bone)", fontFamily: "var(--font-inter)", fontSize: 13, color: "var(--es-ink)", background: "var(--es-white)" }}
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>

          {shift ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#2e7d32", fontWeight: 600 }}>
                ● {shift.cashier_name}
              </span>
              <button onClick={() => { setShiftAction("close"); setShowShiftModal(true); }} style={{ ...BTN, background: "#c0392b", color: "#fff", padding: "6px 12px" }}>
                Close Shift
              </button>
            </div>
          ) : (
            <button onClick={() => { setShiftAction("open"); setShowShiftModal(true); }} style={{ ...BTN, background: "var(--es-plum)", color: "#fff", padding: "6px 12px" }}>
              Open Shift
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 32, alignItems: "start" }}>
        {/* Left: Product browser */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search or scan barcode…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={searchInputStyle}
          />

          {loading ? (
            <p style={muteStyle}>Loading products…</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, maxHeight: "calc(100vh - 360px)", overflowY: "auto", paddingRight: 4 }}>
              {filtered.map((product) => (
                <div key={product.id} style={productCardStyle}>
                  <p style={{ fontFamily: "var(--font-bodoni)", fontSize: 15, color: "var(--es-ink)", margin: "0 0 4px", lineHeight: 1.3 }}>
                    {product.name}
                  </p>
                  <p style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "var(--es-plum)", margin: "0 0 12px", fontWeight: 600 }}>
                    {formatKES(product.base_price)}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {product.skus.filter((s) => s.stock_quantity > 0).map((sku) => (
                      <button
                        key={sku.id}
                        onClick={() => addToCart(product, sku)}
                        title={`${sku.sku_code} — ${sku.stock_quantity} left`}
                        style={skuBtnStyle}
                      >
                        {sku.size}{sku.color ? ` / ${sku.color}` : ""}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && !loading && (
                <div style={{ gridColumn: "1/-1", padding: "40px", textAlign: "center", ...muteStyle }}>
                  No in-stock products found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Cart */}
        <div style={cartPanelStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <p style={cartHeaderStyle}>Cart ({cart.length})</p>
            {cart.length > 0 && (
              <button onClick={clearCart} style={clearBtnStyle}>Clear</button>
            )}
          </div>

          {successRef && (
            <div style={successBoxStyle}>
              <p style={{ fontFamily: "var(--font-bodoni)", fontSize: 18, color: "#2e7d32", margin: "0 0 4px" }}>Sale Complete</p>
              <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#2e7d32", margin: 0, fontWeight: 600 }}>
                Ref: {successRef}
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "center" }}>
                {lastSale && (
                  <button
                    onClick={() => void printReceipt({ ...lastSale, cashierName: cashierName || "Staff", phone })}
                    style={{ ...BTN, background: "var(--es-plum)", color: "#fff", fontSize: 10 }}
                  >
                    Print Receipt
                  </button>
                )}
                <button onClick={clearCart} style={{ ...BTN, background: "#2e7d32", color: "#fff", fontSize: 10 }}>
                  New Sale
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div style={errorBoxStyle}>{errorMsg}</div>
          )}

          {cart.length === 0 && !successRef ? (
            <div style={{ padding: "40px 0", textAlign: "center", ...muteStyle }}>
              Tap a product or scan a barcode.
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                {cart.map((item) => (
                  <div key={item.sku_id} style={cartItemRowStyle}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={cartItemNameStyle}>{item.product_name}</p>
                      <p style={cartItemSubStyle}>
                        {item.size}{item.color ? ` / ${item.color}` : ""} · {formatKES(item.unit_price)}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                      <button onClick={() => updateQty(item.sku_id, -1)} style={qtyBtnStyle}>−</button>
                      <span style={qtyNumStyle}>{item.quantity}</span>
                      <button onClick={() => updateQty(item.sku_id, 1)}  style={qtyBtnStyle}>+</button>
                    </div>
                    <span style={itemTotalStyle}>{formatKES(item.unit_price * item.quantity)}</span>
                    <button onClick={() => setCart((p) => p.filter((c) => c.sku_id !== item.sku_id))} style={removeBtnStyle}>×</button>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ borderTop: "1px solid var(--es-bone)", paddingTop: 12, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-inter)", fontSize: 13, color: "var(--es-mute)", marginBottom: 4 }}>
                  <span>Subtotal</span><span>{formatKES(subtotal)}</span>
                </div>
                {/* Promo code */}
                <div style={{ marginTop: 8 }}>
                  <input
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Promo code (optional)"
                    style={{ ...inputStyle, marginBottom: 0, fontSize: 12 }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-bodoni)", fontSize: 22, color: "var(--es-ink)", borderTop: "2px solid var(--es-ink)", paddingTop: 16, marginBottom: 20 }}>
                <span>Total</span>
                <span>{formatKES(displayTotal)}</span>
              </div>

              {/* Customer phone */}
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Customer Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0700000000 (optional)" style={inputStyle} />
              </div>

              {/* Payment method */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Payment Method</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {(["cash", "mpesa_stk", "mpesa_c2b"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      style={{
                        flex: 1,
                        padding: "8px 4px",
                        fontFamily: "var(--font-inter)",
                        fontSize: 10,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        border:      `2px solid ${paymentMethod === m ? "var(--es-plum)" : "var(--es-bone)"}`,
                        background:  paymentMethod === m ? "var(--es-plum-lt)" : "transparent",
                        color:       paymentMethod === m ? "var(--es-plum)" : "var(--es-mute)",
                        borderRadius: 4,
                        cursor:      "pointer",
                        fontWeight:  paymentMethod === m ? 600 : 400,
                      }}
                    >
                      {m === "cash" ? "Cash" : m === "mpesa_stk" ? "STK Push" : "Till / C2B"}
                    </button>
                  ))}
                </div>
                {paymentMethod === "mpesa_c2b" && (
                  <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "var(--es-mute)", marginTop: 6, lineHeight: 1.5 }}>
                    Customer pays to your Till. Enter amount & order ref when prompted.
                  </p>
                )}
              </div>

              <button
                onClick={() => void completeSale()}
                disabled={completing || cart.length === 0}
                style={{
                  width: "100%",
                  padding: "16px 0",
                  background: completing || cart.length === 0 ? "var(--es-mute)" : "var(--es-plum)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  fontFamily: "var(--font-inter)",
                  fontSize: 12,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  cursor: completing || cart.length === 0 ? "not-allowed" : "pointer",
                  fontWeight: 600,
                }}
              >
                {completing ? "Processing…" : "Complete Sale"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Style constants ───────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontFamily:    "var(--font-inter)",
  fontSize:      11,
  letterSpacing: "0.3em",
  textTransform: "uppercase",
  color:         "var(--es-mute)",
  display:       "block",
  marginBottom:  6,
};

const inputStyle: React.CSSProperties = {
  display:     "block",
  width:       "100%",
  padding:     "9px 12px",
  border:      "1px solid var(--es-bone)",
  borderRadius: 4,
  fontFamily:  "var(--font-inter)",
  fontSize:    14,
  color:       "var(--es-ink)",
  background:  "var(--es-white)",
  boxSizing:   "border-box",
  outline:     "none",
  marginBottom: 12,
};

const searchInputStyle: React.CSSProperties = {
  ...inputStyle,
  marginBottom: 20,
  fontSize:     14,
};

const muteStyle: React.CSSProperties = {
  fontFamily: "var(--font-inter)",
  fontSize:   14,
  color:      "var(--es-mute)",
};

const productCardStyle: React.CSSProperties = {
  background:   "var(--es-white)",
  borderRadius: 6,
  padding:      "16px",
  border:       "1px solid var(--es-bone)",
};

const skuBtnStyle: React.CSSProperties = {
  fontFamily:    "var(--font-inter)",
  fontSize:      10,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  border:        "none",
  cursor:        "pointer",
  padding:       "6px 10px",
  borderRadius:  3,
  background:    "var(--es-plum-lt)",
  color:         "var(--es-plum)",
};

const cartPanelStyle: React.CSSProperties = {
  width:      380,
  flexShrink: 0,
  background: "var(--es-white)",
  borderRadius: 8,
  padding:    "24px",
  border:     "1px solid var(--es-bone)",
  position:   "sticky",
  top:        24,
};

const cartHeaderStyle: React.CSSProperties = {
  fontFamily:    "var(--font-inter)",
  fontSize:      11,
  letterSpacing: "0.35em",
  textTransform: "uppercase",
  color:         "var(--es-mute)",
  margin:        0,
};

const clearBtnStyle: React.CSSProperties = {
  fontFamily: "var(--font-inter)",
  fontSize:   11,
  color:      "var(--es-mute)",
  background: "none",
  border:     "none",
  cursor:     "pointer",
};

const successBoxStyle: React.CSSProperties = {
  background:   "#e8f5e9",
  border:       "1px solid #a5d6a7",
  borderRadius: 4,
  padding:      "16px",
  marginBottom: 20,
  textAlign:    "center",
};

const errorBoxStyle: React.CSSProperties = {
  background:   "#fde8e8",
  border:       "1px solid #f5c6cb",
  borderRadius: 4,
  padding:      "12px 16px",
  marginBottom: 16,
  fontFamily:   "var(--font-inter)",
  fontSize:     13,
  color:        "#c0392b",
};

const cartItemRowStyle: React.CSSProperties = {
  display:      "flex",
  alignItems:   "center",
  gap:          8,
  padding:      "10px 0",
  borderBottom: "1px solid var(--es-bone)",
};

const cartItemNameStyle: React.CSSProperties = {
  fontFamily:    "var(--font-inter)",
  fontSize:      13,
  color:         "var(--es-ink)",
  margin:        0,
  fontWeight:    600,
  whiteSpace:    "nowrap",
  overflow:      "hidden",
  textOverflow:  "ellipsis",
};

const cartItemSubStyle: React.CSSProperties = {
  fontFamily: "var(--font-inter)",
  fontSize:   11,
  color:      "var(--es-mute)",
  margin:     "2px 0 0",
};

const qtyBtnStyle: React.CSSProperties = {
  width:        26,
  height:       26,
  border:       "1px solid var(--es-bone)",
  background:   "none",
  borderRadius: 3,
  cursor:       "pointer",
  fontFamily:   "var(--font-inter)",
  fontSize:     15,
  color:        "var(--es-ink)",
  display:      "flex",
  alignItems:   "center",
  justifyContent: "center",
  lineHeight:   1,
};

const qtyNumStyle: React.CSSProperties = {
  fontFamily: "var(--font-inter)",
  fontSize:   14,
  color:      "var(--es-ink)",
  width:      20,
  textAlign:  "center",
  fontWeight: 600,
};

const itemTotalStyle: React.CSSProperties = {
  fontFamily: "var(--font-inter)",
  fontSize:   13,
  fontWeight: 600,
  color:      "var(--es-ink)",
  width:      74,
  textAlign:  "right",
  flexShrink: 0,
};

const removeBtnStyle: React.CSSProperties = {
  background: "none",
  border:     "none",
  cursor:     "pointer",
  color:      "#c0392b",
  fontSize:   16,
  padding:    "2px",
  flexShrink: 0,
  lineHeight: 1,
};
