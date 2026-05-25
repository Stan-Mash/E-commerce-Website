"use client";

/**
 * Elite Style Co — POS Terminal v2
 *
 * Fixes:
 *  1. shift_id sent on every sale (critical — was returning 400)
 *  2. All var(--font-bodoni) removed
 *  3. Category filter tabs
 *  4. Stock level badges on size buttons
 *  5. Product images on cards
 *  6. Cash change calculator (amount tendered → change due)
 *  7. Keyboard shortcuts: F1=Cash, F2=STK, F3=C2B, Enter=Complete
 *  8. Hold/park transactions
 *  9. Item-level discounts
 * 10. WhatsApp digital receipt link
 * 11. Receipt: payment method, location, KRA PIN, change given, return policy
 */

import { useState, useEffect, useCallback, useRef } from "react";
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
  id:          string;
  name:        string;
  category:    string;
  base_price:  number;
  image_url?:  string | null;
  skus:        SKU[];
}

interface CartItem {
  sku_id:        string;
  sku_code:      string;
  product_name:  string;
  size:          string;
  color:         string | null;
  unit_price:    number;
  quantity:      number;
  item_discount: number;
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

interface HeldCart {
  id:    string;
  label: string;
  items: CartItem[];
  phone: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const FONT = "'Inter','Urbanist',sans-serif";

function formatKES(n: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency", currency: "KES",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);
}

function whatsappLink(params: {
  phone: string; orderRef: string; items: CartItem[];
  total: number; discount: number; paymentMethod: string;
  locationName: string; changeDue: number;
}): string {
  const pmLabel = params.paymentMethod === "cash" ? "Cash"
    : params.paymentMethod === "mpesa_stk" ? "M-Pesa STK" : "M-Pesa Till";
  const lines = [
    `*Elite Style Co — Receipt*`,
    `Ref: ${params.orderRef}`,
    `Location: ${params.locationName}`,
    ``,
    ...params.items.map(i =>
      `• ${i.quantity}× ${i.product_name} (${i.size}${i.color ? "/" + i.color : ""}) — ${formatKES(i.unit_price * i.quantity - i.item_discount)}`
    ),
    ``,
    params.discount > 0 ? `Discount: -${formatKES(params.discount)}` : null,
    `*Total: ${formatKES(params.total)}*`,
    `Payment: ${pmLabel}`,
    params.changeDue > 0 ? `Change: ${formatKES(params.changeDue)}` : null,
    ``,
    `Thank you for shopping with us!`,
    `www.elitestyleco.co.ke`,
    `Returns within 7 days with receipt.`,
  ].filter(Boolean).join("\n");
  const norm = params.phone.replace(/\D/g, "").replace(/^0/, "254");
  return `https://wa.me/${norm}?text=${encodeURIComponent(lines)}`;
}

// ── ESC/POS thermal receipt ───────────────────────────────────────────────────

async function printReceipt(params: {
  orderRef:      string;
  items:         CartItem[];
  subtotal:      number;
  discount:      number;
  total:         number;
  cashierName:   string;
  phone:         string;
  paymentMethod: string;
  locationName:  string;
  amountPaid:    number;
  changeDue:     number;
}): Promise<void> {
  if (!("serial" in navigator)) {
    alert("Web Serial API not supported.\nUse Chrome or Edge on desktop.");
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let port: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    port = await (navigator as any).serial.requestPort();
    await port.open({ baudRate: 9600 });
  } catch {
    alert("Could not connect to printer. Make sure it is plugged in.");
    return;
  }

  const enc = new TextEncoder();
  const ESC = 0x1b, GS = 0x1d;
  const cmd = (...b: number[]) => new Uint8Array(b);
  const ln  = (s = "") => enc.encode(s + "\n");
  const sep = () => enc.encode("-".repeat(32) + "\n");

  const pmLabel = params.paymentMethod === "cash" ? "CASH"
    : params.paymentMethod === "mpesa_stk" ? "M-PESA STK" : "M-PESA TILL";

  const chunks: Uint8Array[] = [
    cmd(ESC, 0x40),                          // init
    cmd(ESC, 0x61, 0x01),                    // centre
    cmd(GS,  0x21, 0x11), cmd(ESC, 0x45, 0x01),
    ln("ELITE STYLE CO"),
    cmd(GS,  0x21, 0x00), cmd(ESC, 0x45, 0x00),
    ln(params.locationName),
    ln("Nairobi, Kenya"),
    ln("KRA PIN: P000000000A"),
    ln(new Date().toLocaleString("en-KE", { dateStyle: "short", timeStyle: "short" })),
    cmd(0x0a), sep(), cmd(ESC, 0x61, 0x00),  // left
  ];

  for (const item of params.items) {
    const label = `${item.product_name} (${item.size}${item.color ? "/" + item.color : ""})`;
    const amt   = item.unit_price * item.quantity - item.item_discount;
    const p     = formatKES(amt);
    chunks.push(ln(`${item.quantity}x ${label}`));
    chunks.push(ln(`   ${" ".repeat(Math.max(0, 28 - p.length))}${p}`));
    if (item.item_discount > 0) {
      const d = `-${formatKES(item.item_discount)}`;
      chunks.push(ln(`   Discount:${" ".repeat(Math.max(0, 20 - d.length))}${d}`));
    }
  }

  chunks.push(sep());
  if (params.discount > 0) {
    const s = formatKES(params.subtotal), d = `-${formatKES(params.discount)}`;
    chunks.push(ln(`Subtotal:${" ".repeat(Math.max(0, 23 - s.length))}${s}`));
    chunks.push(ln(`Discount:${" ".repeat(Math.max(0, 23 - d.length))}${d}`));
    chunks.push(sep());
  }

  const tot = formatKES(params.total);
  chunks.push(
    cmd(ESC, 0x45, 0x01), cmd(GS, 0x21, 0x11),
    ln(`TOTAL:${" ".repeat(Math.max(0, 26 - tot.length))}${tot}`),
    cmd(GS, 0x21, 0x00), cmd(ESC, 0x45, 0x00),
    cmd(0x0a),
    ln(`Payment: ${pmLabel}`),
  );
  if (params.paymentMethod === "cash" && params.amountPaid > 0) {
    chunks.push(ln(`Tendered: ${formatKES(params.amountPaid)}`));
    chunks.push(ln(`Change:   ${formatKES(params.changeDue)}`));
  }
  chunks.push(
    cmd(0x0a), cmd(ESC, 0x61, 0x01),
    ln(`Ref: ${params.orderRef}`),
    ...(params.phone ? [ln(`Customer: ${params.phone}`)] : []),
    ln(`Cashier: ${params.cashierName}`),
    cmd(0x0a),
    ln("Thank you for shopping with us!"),
    ln("www.elitestyleco.co.ke"),
    cmd(0x0a),
    ln("Returns: 7 days with original receipt."),
    ln("No returns on sale/clearance items."),
    cmd(0x0a), cmd(0x0a), cmd(0x0a),
    cmd(GS, 0x56, 0x00),                     // full cut
  );

  const writer = port.writable!.getWriter();
  for (const c of chunks) await writer.write(c);
  writer.releaseLock();
  await port.close();
}

// ── Shift Modal — standalone component, zero dependency on POSPage state ──────

interface ShiftModalProps {
  action:     "open" | "close";
  locationId: string;
  shiftId:    string | undefined;
  canCancel:  boolean;
  onSuccess:  (cashierName: string) => void;
  onCancel:   () => void;
}

function ShiftModal({ action, locationId, shiftId, canCancel, onSuccess, onCancel }: ShiftModalProps) {
  const [name,    setName]    = useState("");
  const [float,   setFloat]   = useState("0");
  const [busy,    setBusy]    = useState(false);
  const [err,     setErr]     = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const body = action === "open"
        ? { action: "open",  location_id: locationId, cashier_name: name.trim() || "Staff", opening_float: parseFloat(float) || 0 }
        : { action: "close", shift_id: shiftId, closing_float: parseFloat(float) || 0 };

      const r = await fetch("/api/admin/pos/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json() as { shift?: { cashier_name?: string; variance?: number }; error?: string };
      if (!r.ok) { setErr(j.error ?? "Request failed"); return; }
      onSuccess(j.shift?.cashier_name ?? (name.trim() || "Staff"));
    } catch {
      setErr("Network error — try again");
    } finally {
      setBusy(false);
    }
  }

  const inp: React.CSSProperties = {
    display: "block", width: "100%", padding: "11px 14px",
    border: "1px solid #e0e0e0", borderRadius: 6,
    fontFamily: FONT, fontSize: 14, color: "#111",
    outline: "none", boxSizing: "border-box", marginBottom: 16,
  };

  return (
    <div
      onKeyDown={e => e.stopPropagation()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
    >
      <div style={{ background: "#fff", borderRadius: 12, padding: 40, width: 400, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <h2 style={{ fontFamily: FONT, fontSize: 22, fontWeight: 800, color: "#111", margin: "0 0 24px" }}>
          {action === "open" ? "Open Shift" : "Close Shift"}
        </h2>
        <form onSubmit={submit}>
          {action === "open" && (
            <>
              <label style={{ fontFamily: FONT, fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: 6 }}>
                Cashier Name
              </label>
              <input
                ref={nameRef}
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); (e.currentTarget.form?.elements[1] as HTMLInputElement)?.focus(); } }}
                placeholder="Your name"
                style={inp}
              />
            </>
          )}
          <label style={{ fontFamily: FONT, fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: 6 }}>
            {action === "open" ? "Opening Cash Float (KES)" : "Closing Cash Count (KES)"}
          </label>
          <input
            value={float}
            onChange={e => setFloat(e.target.value)}
            type="number"
            placeholder="0"
            style={inp}
            ref={action === "close" ? nameRef : undefined}
          />
          {err && <p style={{ fontFamily: FONT, fontSize: 12, color: "#c0392b", margin: "-8px 0 12px" }}>{err}</p>}
          <button
            type="submit"
            disabled={busy}
            style={{ fontFamily: FONT, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", background: busy ? "#ccc" : action === "open" ? "#7c3aed" : "#c0392b", color: "#fff", border: "none", borderRadius: 4, padding: "13px 0", cursor: busy ? "not-allowed" : "pointer", width: "100%", fontWeight: 700 }}
          >
            {busy ? "Please wait…" : action === "open" ? "Open Shift" : "Close Shift"}
          </button>
        </form>
        {canCancel && (
          <button onClick={onCancel} style={{ fontFamily: FONT, fontSize: 12, background: "none", color: "#888", border: "none", cursor: "pointer", width: "100%", marginTop: 8, padding: "10px 0" }}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function POSPage() {
  const [products,        setProducts]       = useState<Product[]>([]);
  const [locations,       setLocations]      = useState<Location[]>([]);
  const [locationId,      setLocationId]     = useState<string>("");
  const [loading,         setLoading]        = useState(true);
  const [search,          setSearch]         = useState("");
  const [categoryFilter,  setCategoryFilter] = useState("All");
  const [cart,            setCart]           = useState<CartItem[]>([]);
  const [phone,           setPhone]          = useState("");
  const [cashierName,     setCashierName]    = useState("");
  const [paymentMethod,   setPaymentMethod]  = useState<"cash" | "mpesa_stk" | "mpesa_c2b">("cash");
  const [promoCode,       setPromoCode]      = useState("");
  const [amountTendered,  setAmountTendered] = useState("");
  const [completing,      setCompleting]     = useState(false);
  const [successRef,      setSuccessRef]     = useState<string | null>(null);
  const [errorMsg,        setErrorMsg]       = useState<string | null>(null);

  // Shift
  const [shift,           setShift]          = useState<Shift | null>(null);
  const [showShiftModal,  setShowShiftModal]  = useState(false);
  const [openingFloat,    setOpeningFloat]   = useState("");
  const [closingFloat,    setClosingFloat]   = useState("");
  const [shiftAction,     setShiftAction]    = useState<"open" | "close">("open");

  // Hold/park
  const [heldCarts,       setHeldCarts]      = useState<HeldCart[]>([]);
  const [showHeld,        setShowHeld]       = useState(false);

  // C2B waiting screen
  const [c2bOrderId,      setC2bOrderId]     = useState<string | null>(null);
  const [c2bOrderRef,     setC2bOrderRef]    = useState<string | null>(null);
  const [c2bTotal,        setC2bTotal]       = useState(0);
  const [c2bPaid,         setC2bPaid]        = useState(false);

  // Last sale summary
  const [lastSale, setLastSale] = useState<{
    orderRef: string; items: CartItem[]; subtotal: number;
    discount: number; total: number; paymentMethod: string;
    amountPaid: number; changeDue: number;
  } | null>(null);

  const searchRef    = useRef<HTMLInputElement>(null);
  const nameRef      = useRef<HTMLInputElement>(null);
  const floatRef     = useRef<HTMLInputElement>(null);
  const closeRef     = useRef<HTMLInputElement>(null);

  // Focus the first field whenever the shift modal opens
  useEffect(() => {
    if (!showShiftModal) return;
    const t = setTimeout(() => {
      if (shiftAction === "open") nameRef.current?.focus();
      else closeRef.current?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, [showShiftModal, shiftAction]);

  // ── Load locations ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/admin/locations")
      .then(r => r.json())
      .then((j: { locations: Location[] }) => {
        setLocations(j.locations ?? []);
        const store = j.locations?.find(l => l.type === "store");
        if (store) setLocationId(store.id);
      })
      .catch(() => {});
  }, []);

  // ── Load active shift ───────────────────────────────────────────────────────
  const loadShift = useCallback(async (locId: string) => {
    if (!locId) return;
    const r = await fetch(`/api/admin/pos/shifts?location_id=${locId}`);
    const j = await r.json() as { shift: Shift | null };
    setShift(j.shift ?? null);
    if (!j.shift) setShowShiftModal(true);
  }, []);

  useEffect(() => {
    if (locationId) void loadShift(locationId);
  }, [locationId, loadShift]);

  // ── Load products ───────────────────────────────────────────────────────────
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/products");
      if (r.ok) {
        const j = await r.json() as { products: Product[] };
        setProducts((j.products ?? []).filter(p => p.skus.some(s => s.stock_quantity > 0)));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadProducts(); }, [loadProducts]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  const completeSaleRef = useRef<() => Promise<void>>();
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "F1") { e.preventDefault(); setPaymentMethod("cash"); }
      if (e.key === "F2") { e.preventDefault(); setPaymentMethod("mpesa_stk"); }
      if (e.key === "F3") { e.preventDefault(); setPaymentMethod("mpesa_c2b"); }
      if (e.key === "Enter") { e.preventDefault(); void completeSaleRef.current?.(); }
      if (e.key === "Escape") { setSuccessRef(null); setErrorMsg(null); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Barcode scanner ─────────────────────────────────────────────────────────
  useEffect(() => {
    let buf = "", last = 0;
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const now = Date.now();
      if (e.key === "Enter") { if (buf.length > 2) void lookupBarcode(buf.trim()); buf = ""; return; }
      if (now - last > 200) buf = "";
      last = now;
      if (e.key.length === 1) buf += e.key;
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  async function lookupBarcode(code: string) {
    for (const product of products) {
      const sku = product.skus.find(s => s.sku_code === code);
      if (sku) { addToCart(product, sku); return; }
    }
    setSearch(code);
    searchRef.current?.focus();
  }

  // ── Supabase Realtime for C2B ───────────────────────────────────────────────
  useEffect(() => {
    if (!c2bOrderId) return;
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const ch = sb.channel(`c2b-${c2bOrderId}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${c2bOrderId}` },
        (p) => { if ((p.new as { status: string }).status === "paid") setC2bPaid(true); }
      ).subscribe();
    return () => { void sb.removeChannel(ch); };
  }, [c2bOrderId]);

  // ── Cart helpers ────────────────────────────────────────────────────────────
  const categories = ["All", ...Array.from(new Set(products.map(p => p.category))).sort()];

  const filtered = products.filter(p => {
    const matchCat = categoryFilter === "All" || p.category === categoryFilter;
    const q = search.trim().toLowerCase();
    const matchQ = !q || p.name.toLowerCase().includes(q)
      || p.skus.some(s => s.sku_code.toLowerCase().includes(q));
    return matchCat && matchQ;
  });

  function addToCart(product: Product, sku: SKU) {
    setCart(prev => {
      const idx = prev.findIndex(c => c.sku_id === sku.id);
      if (idx >= 0) return prev.map((c, i) => i === idx ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, {
        sku_id: sku.id, sku_code: sku.sku_code, product_name: product.name,
        size: sku.size, color: sku.color,
        unit_price: Math.round(product.base_price), quantity: 1, item_discount: 0,
      }];
    });
  }

  function updateQty(skuId: string, delta: number) {
    setCart(prev =>
      prev.map(c => c.sku_id === skuId ? { ...c, quantity: c.quantity + delta } : c)
          .filter(c => c.quantity > 0)
    );
  }

  function updateItemDisc(skuId: string, val: string) {
    setCart(prev => prev.map(c =>
      c.sku_id === skuId ? { ...c, item_discount: Math.max(0, parseFloat(val) || 0) } : c
    ));
  }

  function clearCart() {
    setCart([]); setPhone(""); setPromoCode(""); setAmountTendered("");
    setSuccessRef(null); setErrorMsg(null);
    setC2bOrderId(null); setC2bOrderRef(null); setC2bPaid(false);
  }

  function holdCart() {
    if (cart.length === 0) return;
    setHeldCarts(prev => [...prev, {
      id: Date.now().toString(),
      label: `${cart[0]?.product_name ?? "Item"}${cart.length > 1 ? ` +${cart.length - 1}` : ""}`,
      items: [...cart], phone,
    }]);
    clearCart();
  }

  function restoreHeld(h: HeldCart) {
    setCart(h.items); setPhone(h.phone);
    setHeldCarts(prev => prev.filter(x => x.id !== h.id));
    setShowHeld(false);
  }

  // ── Totals ──────────────────────────────────────────────────────────────────
  const subtotal      = cart.reduce((s, c) => s + c.unit_price * c.quantity, 0);
  const itemDiscounts = cart.reduce((s, c) => s + c.item_discount, 0);
  const displayTotal  = Math.round(subtotal - itemDiscounts);
  const tenderedAmt   = parseFloat(amountTendered) || 0;
  const changeDue     = paymentMethod === "cash" && tenderedAmt > displayTotal
    ? tenderedAmt - displayTotal : 0;

  // ── Shift management ────────────────────────────────────────────────────────
  async function openShift() {
    const name  = nameRef.current?.value.trim()  || "Staff";
    const float = parseFloat(floatRef.current?.value ?? "0") || 0;
    const r = await fetch("/api/admin/pos/shifts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "open", location_id: locationId,
        cashier_name: name,
        opening_float: float,
      }),
    });
    const j = await r.json() as { shift?: Shift; error?: string };
    if (r.ok) { setShift(j.shift ?? null); setShowShiftModal(false); setCashierName(j.shift?.cashier_name ?? name); }
    else setErrorMsg(j.error ?? "Failed to open shift");
  }

  async function closeShift() {
    if (!shift) return;
    const float = parseFloat(closeRef.current?.value ?? "0") || 0;
    const r = await fetch("/api/admin/pos/shifts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close", shift_id: shift.id, closing_float: float }),
    });
    const j = await r.json() as { shift?: { variance: number; expected_float: number }; error?: string };
    if (r.ok) {
      alert(`Shift closed.\nExpected: ${formatKES(j.shift?.expected_float ?? 0)}\nActual: ${formatKES(float)}\nVariance: ${formatKES(j.shift?.variance ?? 0)}`);
      setShift(null); setShowShiftModal(false); clearCart();
    } else setErrorMsg(j.error ?? "Failed to close shift");
  }

  // ── Complete sale ───────────────────────────────────────────────────────────
  async function completeSale() {
    if (cart.length === 0 || !locationId || !shift) return;
    if (paymentMethod === "mpesa_stk" && !phone.trim()) {
      setErrorMsg("Phone number required for M-Pesa STK Push."); return;
    }
    setCompleting(true); setErrorMsg(null);
    try {
      const r = await fetch("/api/admin/pos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          payment_method: paymentMethod,
          location_id:    locationId,
          shift_id:       shift.id,          // ← CRITICAL: was missing before
          cashier_name:   cashierName || shift.cashier_name || "Staff",
          items: cart.map(c => ({
            sku_id:     c.sku_id,
            quantity:   c.quantity,
            unit_price: Math.round(c.unit_price - c.item_discount / Math.max(c.quantity, 1)),
          })),
          promo_code: promoCode || undefined,
        }),
      });

      const j = await r.json() as {
        order_id?: string; order_ref?: string; total?: number;
        discount_amount?: number; checkout_request_id?: string;
        customer_message?: string; instruction?: string; error?: string;
      };

      if (!r.ok) { setErrorMsg(j.error ?? "Failed to complete sale."); return; }

      const sale = {
        orderRef:      j.order_ref ?? "",
        items:         [...cart],
        subtotal,
        discount:      (j.discount_amount ?? 0) + itemDiscounts,
        total:         j.total ?? displayTotal,
        paymentMethod,
        amountPaid:    tenderedAmt || (j.total ?? displayTotal),
        changeDue,
      };
      setLastSale(sale);

      if (paymentMethod === "mpesa_c2b") {
        setC2bOrderId(j.order_id ?? null);
        setC2bOrderRef(j.order_ref ?? null);
        setC2bTotal(j.total ?? 0);
        setC2bPaid(false);
        setCart([]);
      } else {
        setSuccessRef(j.order_ref ?? "N/A");
        setCart([]); setAmountTendered("");
        void loadProducts();
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setCompleting(false);
    }
  }

  // Wire completeSale into ref so keyboard shortcut always calls the latest version
  completeSaleRef.current = completeSale;

  const locationName = locations.find(l => l.id === locationId)?.name ?? "Store";

  // ── C2B waiting screen ──────────────────────────────────────────────────────
  if (c2bOrderId && !c2bPaid) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
        <div style={{ textAlign: "center", padding: 48, background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, maxWidth: 480, width: "100%" }}>
          <div style={{ width: 64, height: 64, margin: "0 auto 20px", borderRadius: "50%", background: "#fff8e1", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#c9a961" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <p style={{ fontFamily: FONT, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#c9a961", marginBottom: 10 }}>
            Awaiting M-Pesa Payment
          </p>
          <p style={{ fontFamily: FONT, fontSize: 44, fontWeight: 900, color: "#111", margin: "0 0 6px" }}>
            {formatKES(c2bTotal)}
          </p>
          <div style={{ background: "#f3e8ff", border: "2px solid #7c3aed", borderRadius: 8, padding: "14px 24px", margin: "20px 0" }}>
            <p style={{ fontFamily: FONT, fontSize: 10, color: "#7c3aed", marginBottom: 4, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700 }}>
              Customer Reference Number
            </p>
            <p style={{ fontFamily: FONT, fontSize: 28, fontWeight: 900, color: "#7c3aed", margin: 0 }}>
              {c2bOrderRef}
            </p>
          </div>
          <p style={{ fontFamily: FONT, fontSize: 13, color: "#888", lineHeight: 1.7 }}>
            Ask customer to pay to your Till and enter<br/>
            <strong>{c2bOrderRef}</strong> as the reference.<br/>
            This screen updates automatically when paid.
          </p>
          <button onClick={clearCart} style={{ marginTop: 20, fontFamily: FONT, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", background: "#f1f1f1", color: "#555", border: "none", borderRadius: 4, padding: "10px 20px", cursor: "pointer" }}>
            Cancel Order
          </button>
        </div>
      </div>
    );
  }

  if (c2bPaid) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
        <div style={{ textAlign: "center", padding: 48, background: "#e8f5e9", border: "2px solid #66bb6a", borderRadius: 12, maxWidth: 480, width: "100%" }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>✅</div>
          <p style={{ fontFamily: FONT, fontSize: 28, fontWeight: 900, color: "#2e7d32", margin: "0 0 4px" }}>Payment Confirmed</p>
          <p style={{ fontFamily: FONT, fontSize: 15, color: "#2e7d32", fontWeight: 700 }}>{c2bOrderRef}</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
            {lastSale && <>
              <button
                onClick={() => void printReceipt({ ...lastSale, cashierName: cashierName || "Staff", phone, locationName })}
                style={{ fontFamily: FONT, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 4, padding: "10px 18px", cursor: "pointer" }}
              >Print Receipt</button>
              {phone && (
                <a
                  href={whatsappLink({ ...lastSale, phone, locationName })}
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: FONT, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", background: "#25D366", color: "#fff", border: "none", borderRadius: 4, padding: "10px 18px", textDecoration: "none", display: "inline-block" }}
                >WhatsApp Receipt</a>
              )}
            </>}
            <button
              onClick={() => { clearCart(); void loadProducts(); }}
              style={{ fontFamily: FONT, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", background: "#2e7d32", color: "#fff", border: "none", borderRadius: 4, padding: "10px 18px", cursor: "pointer" }}
            >New Sale</button>
          </div>
        </div>
      </div>
    );
  }

  // (shift modal rendered as standalone component below)

  // ── Held carts drawer ───────────────────────────────────────────────────────
  const HeldDrawer = () => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "flex-end", zIndex: 150 }} onClick={() => setShowHeld(false)}>
      <div style={{ width: 360, background: "#fff", height: "100%", overflowY: "auto", padding: 28, boxShadow: "-8px 0 40px rgba(0,0,0,0.12)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ fontFamily: FONT, fontSize: 16, fontWeight: 800, color: "#111", margin: 0 }}>
            Held ({heldCarts.length})
          </h3>
          <button onClick={() => setShowHeld(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888", lineHeight: 1 }}>×</button>
        </div>
        {heldCarts.length === 0 ? (
          <p style={{ fontFamily: FONT, fontSize: 13, color: "#aaa", textAlign: "center", marginTop: 40 }}>No held transactions.</p>
        ) : heldCarts.map(h => (
          <div key={h.id} style={{ border: "1px solid #e8e8e8", borderRadius: 8, padding: 16, marginBottom: 12 }}>
            <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: "#111", margin: "0 0 4px" }}>{h.label}</p>
            <p style={{ fontFamily: FONT, fontSize: 12, color: "#888", margin: "0 0 12px" }}>
              {h.items.length} item{h.items.length !== 1 ? "s" : ""} · {formatKES(h.items.reduce((s, c) => s + c.unit_price * c.quantity, 0))}
            </p>
            <button onClick={() => restoreHeld(h)} style={{ fontFamily: FONT, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 4, padding: "8px 16px", cursor: "pointer" }}>
              Restore
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div>
      {showShiftModal && (
        <ShiftModal
          action={shiftAction}
          locationId={locationId}
          shiftId={shift?.id}
          canCancel={!!shift}
          onSuccess={name => {
            if (shiftAction === "open") {
              void loadShift(locationId);
              setCashierName(name);
            } else {
              setShift(null);
              clearCart();
            }
            setShowShiftModal(false);
          }}
          onCancel={() => setShowShiftModal(false)}
        />
      )}
      {showHeld && <HeldDrawer />}

      {/* Header */}
      <div style={{ marginBottom: 18, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontFamily: FONT, fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", color: "#c9a961", marginBottom: 4 }}>
            In-Store
          </p>
          <h1 style={{ fontFamily: FONT, fontSize: 26, fontWeight: 900, color: "#111", margin: "0 0 4px", letterSpacing: "-0.03em" }}>
            POS Terminal
          </h1>
          <p style={{ fontFamily: FONT, fontSize: 11, color: "#aaa", margin: 0 }}>
            F1 = Cash · F2 = STK · F3 = Till · Enter = Complete Sale
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {heldCarts.length > 0 && (
            <button onClick={() => setShowHeld(true)} style={{ fontFamily: FONT, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", background: "#fff8e1", color: "#92680a", border: "1px solid #f0c040", borderRadius: 4, padding: "7px 12px", cursor: "pointer", fontWeight: 700 }}>
              ⏸ Held ({heldCarts.length})
            </button>
          )}
          <select
            value={locationId}
            onChange={e => setLocationId(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 4, border: "1px solid #e0e0e0", fontFamily: FONT, fontSize: 13, color: "#111", background: "#fff" }}
          >
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          {shift ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: FONT, fontSize: 12, color: "#2e7d32", fontWeight: 700 }}>
                ● {shift.cashier_name}
              </span>
              <button onClick={() => { setShiftAction("close"); setShowShiftModal(true); }} style={{ fontFamily: FONT, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", background: "#fde8e8", color: "#c0392b", border: "1px solid #f5c6cb", borderRadius: 4, padding: "7px 12px", cursor: "pointer" }}>
                End Shift
              </button>
            </div>
          ) : (
            <button onClick={() => { setShiftAction("open"); setShowShiftModal(true); }} style={{ fontFamily: FONT, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 4, padding: "8px 16px", cursor: "pointer", fontWeight: 700 }}>
              Open Shift
            </button>
          )}
        </div>
      </div>

      {!shift && (
        <div style={{ background: "#fff8e1", border: "1px solid #f0c040", borderRadius: 6, padding: "10px 16px", marginBottom: 16, fontFamily: FONT, fontSize: 13, color: "#92680a" }}>
          ⚠️ No open shift — open a shift before processing any sales.
        </div>
      )}

      <div style={{ display: "flex", gap: 20, alignItems: "start" }}>

        {/* ── Product browser ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search products or scan barcode…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, marginBottom: 10, fontSize: 14 }}
          />
          {/* Category tabs */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  fontFamily: FONT, fontSize: 10, fontWeight: categoryFilter === cat ? 700 : 500,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  padding: "5px 14px", borderRadius: 20,
                  border: `1px solid ${categoryFilter === cat ? "#7c3aed" : "#e0e0e0"}`,
                  background: categoryFilter === cat ? "#7c3aed" : "#fff",
                  color: categoryFilter === cat ? "#fff" : "#666",
                  cursor: "pointer",
                }}
              >{cat}</button>
            ))}
          </div>

          {loading ? (
            <p style={{ fontFamily: FONT, fontSize: 14, color: "#aaa" }}>Loading products…</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: 12, maxHeight: "calc(100vh - 300px)", overflowY: "auto", paddingRight: 4 }}>
              {filtered.map(product => (
                <div key={product.id} style={{ background: "#fff", borderRadius: 8, border: "1px solid #e8e8e8", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image_url} alt={product.name} style={{ width: "100%", height: 110, objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: 70, background: "#f7f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                    </div>
                  )}
                  <div style={{ padding: "10px 10px 12px" }}>
                    <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "#111", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {product.name}
                    </p>
                    <p style={{ fontFamily: FONT, fontSize: 11, color: "#7c3aed", margin: "0 0 8px", fontWeight: 600 }}>
                      {formatKES(product.base_price)}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {product.skus.filter(s => s.stock_quantity > 0).map(sku => (
                        <button
                          key={sku.id}
                          onClick={() => addToCart(product, sku)}
                          title={sku.sku_code}
                          style={{
                            fontFamily: FONT, fontSize: 9, letterSpacing: "0.08em",
                            textTransform: "uppercase", border: "none", cursor: "pointer",
                            padding: "4px 7px", borderRadius: 3, fontWeight: 700,
                            background: sku.stock_quantity <= 3 ? "#fff3cd" : "#f3e8ff",
                            color: sku.stock_quantity <= 3 ? "#856404" : "#7c3aed",
                          }}
                        >
                          {sku.size}{sku.color ? `/${sku.color}` : ""}
                          <span style={{ fontSize: 7, opacity: 0.7, marginLeft: 2 }}>({sku.stock_quantity})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && !loading && (
                <div style={{ gridColumn: "1/-1", padding: "48px 0", textAlign: "center", fontFamily: FONT, fontSize: 14, color: "#bbb" }}>
                  No in-stock products found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Cart panel ── */}
        <div style={{ width: 370, flexShrink: 0, background: "#fff", borderRadius: 10, padding: 22, border: "1px solid #e8e8e8", position: "sticky", top: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <p style={{ fontFamily: FONT, fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "#888", margin: 0 }}>
              Cart ({cart.length})
            </p>
            <div style={{ display: "flex", gap: 6 }}>
              {cart.length > 0 && <>
                <button onClick={holdCart} style={{ fontFamily: FONT, fontSize: 9, color: "#c9a961", background: "none", border: "1px solid #c9a961", cursor: "pointer", padding: "3px 8px", borderRadius: 3, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Hold
                </button>
                <button onClick={clearCart} style={{ fontFamily: FONT, fontSize: 9, color: "#aaa", background: "none", border: "none", cursor: "pointer" }}>
                  Clear
                </button>
              </>}
            </div>
          </div>

          {successRef && (
            <div style={{ background: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: 6, padding: 14, marginBottom: 14, textAlign: "center" }}>
              <p style={{ fontFamily: FONT, fontSize: 15, fontWeight: 800, color: "#2e7d32", margin: "0 0 2px" }}>✓ Sale Complete</p>
              <p style={{ fontFamily: FONT, fontSize: 12, color: "#2e7d32", margin: "0 0 8px", fontWeight: 600 }}>Ref: {successRef}</p>
              {lastSale?.changeDue != null && lastSale.changeDue > 0 && (
                <p style={{ fontFamily: FONT, fontSize: 20, fontWeight: 900, color: "#111", margin: "0 0 10px" }}>
                  Change: {formatKES(lastSale.changeDue)}
                </p>
              )}
              <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                {lastSale && (
                  <button onClick={() => void printReceipt({ ...lastSale, cashierName: cashierName || "Staff", phone, locationName })}
                    style={{ fontFamily: FONT, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 3, padding: "7px 12px", cursor: "pointer" }}>
                    Print
                  </button>
                )}
                {lastSale && phone && (
                  <a href={whatsappLink({ ...lastSale, phone, locationName })} target="_blank" rel="noopener noreferrer"
                    style={{ fontFamily: FONT, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", background: "#25D366", color: "#fff", border: "none", borderRadius: 3, padding: "7px 12px", textDecoration: "none", display: "inline-block" }}>
                    WhatsApp
                  </a>
                )}
                <button onClick={clearCart} style={{ fontFamily: FONT, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", background: "#2e7d32", color: "#fff", border: "none", borderRadius: 3, padding: "7px 12px", cursor: "pointer" }}>
                  New Sale
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div style={{ background: "#fde8e8", border: "1px solid #f5c6cb", borderRadius: 4, padding: "10px 12px", marginBottom: 10, fontFamily: FONT, fontSize: 12, color: "#c0392b" }}>
              {errorMsg}
            </div>
          )}

          {cart.length === 0 && !successRef && (
            <div style={{ padding: "40px 0", textAlign: "center", fontFamily: FONT, fontSize: 13, color: "#ccc" }}>
              Tap a product or scan a barcode.
            </div>
          )}

          {cart.length > 0 && <>
            {/* Items */}
            <div style={{ marginBottom: 10, maxHeight: 290, overflowY: "auto" }}>
              {cart.map(item => (
                <div key={item.sku_id} style={{ padding: "9px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: FONT, fontSize: 12, color: "#111", margin: 0, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.product_name}
                      </p>
                      <p style={{ fontFamily: FONT, fontSize: 10, color: "#888", margin: "2px 0 0" }}>
                        {item.size}{item.color ? `/${item.color}` : ""} · {formatKES(item.unit_price)}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                      <button onClick={() => updateQty(item.sku_id, -1)} style={qtyBtnStyle}>−</button>
                      <span style={{ fontFamily: FONT, fontSize: 13, color: "#111", width: 18, textAlign: "center", fontWeight: 700 }}>{item.quantity}</span>
                      <button onClick={() => updateQty(item.sku_id, 1)}  style={qtyBtnStyle}>+</button>
                    </div>
                    <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "#111", width: 64, textAlign: "right", flexShrink: 0 }}>
                      {formatKES(item.unit_price * item.quantity - item.item_discount)}
                    </span>
                    <button onClick={() => setCart(p => p.filter(c => c.sku_id !== item.sku_id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#e74c3c", fontSize: 15, padding: "1px 2px", lineHeight: 1, flexShrink: 0 }}>×</button>
                  </div>
                  {/* Item-level discount */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
                    <span style={{ fontFamily: FONT, fontSize: 9, color: "#bbb", letterSpacing: "0.1em", textTransform: "uppercase" }}>Disc KES</span>
                    <input
                      type="number" min="0"
                      value={item.item_discount || ""}
                      onChange={e => updateItemDisc(item.sku_id, e.target.value)}
                      placeholder="0"
                      style={{ width: 60, padding: "3px 6px", border: "1px solid #e8e8e8", borderRadius: 3, fontFamily: FONT, fontSize: 11, color: "#111", background: "#fafafa" }}
                    />
                    {item.item_discount > 0 && (
                      <span style={{ fontFamily: FONT, fontSize: 9, color: "#e74c3c" }}>-{formatKES(item.item_discount)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ borderTop: "1px solid #e8e8e8", paddingTop: 10, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT, fontSize: 12, color: "#888", marginBottom: 3 }}>
                <span>Subtotal</span><span>{formatKES(subtotal)}</span>
              </div>
              {itemDiscounts > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT, fontSize: 12, color: "#e74c3c", marginBottom: 3 }}>
                  <span>Item Discounts</span><span>−{formatKES(itemDiscounts)}</span>
                </div>
              )}
              <input
                value={promoCode}
                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Promo code (optional)"
                style={{ ...inputStyle, marginTop: 8, marginBottom: 0, fontSize: 12 }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT, fontSize: 20, fontWeight: 900, color: "#111", borderTop: "2px solid #111", paddingTop: 12, marginBottom: 14, letterSpacing: "-0.02em" }}>
              <span>Total</span><span>{formatKES(displayTotal)}</span>
            </div>

            {/* Customer phone */}
            <label style={labelStyle}>Customer Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0700 000 000 (optional)" style={inputStyle} />

            {/* Payment method */}
            <label style={labelStyle}>Payment Method</label>
            <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
              {(["cash", "mpesa_stk", "mpesa_c2b"] as const).map(m => (
                <button key={m} onClick={() => setPaymentMethod(m)} style={{
                  flex: 1, padding: "7px 2px", fontFamily: FONT, fontSize: 8,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  border: `2px solid ${paymentMethod === m ? "#7c3aed" : "#e0e0e0"}`,
                  background: paymentMethod === m ? "#7c3aed" : "transparent",
                  color: paymentMethod === m ? "#fff" : "#888",
                  borderRadius: 4, cursor: "pointer", fontWeight: paymentMethod === m ? 700 : 400,
                }}>
                  {m === "cash" ? "Cash\n[F1]" : m === "mpesa_stk" ? "STK\n[F2]" : "Till\n[F3]"}
                </button>
              ))}
            </div>

            {/* Cash change calculator */}
            {paymentMethod === "cash" && (
              <div style={{ background: "#fafafa", borderRadius: 6, padding: "10px 12px", marginBottom: 12, border: "1px solid #f0f0f0" }}>
                <label style={labelStyle}>Amount Tendered (KES)</label>
                <input
                  type="number"
                  value={amountTendered}
                  onChange={e => setAmountTendered(e.target.value)}
                  placeholder={String(displayTotal)}
                  style={inputStyle}
                />
                {tenderedAmt > 0 && tenderedAmt < displayTotal && (
                  <p style={{ fontFamily: FONT, fontSize: 11, color: "#e74c3c", margin: "-8px 0 4px" }}>
                    ⚠ Short by {formatKES(displayTotal - tenderedAmt)}
                  </p>
                )}
                {changeDue > 0 && (
                  <div style={{ background: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: 4, padding: "8px 12px" }}>
                    <p style={{ fontFamily: FONT, fontSize: 9, color: "#2e7d32", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 2px" }}>Change Due</p>
                    <p style={{ fontFamily: FONT, fontSize: 22, fontWeight: 900, color: "#2e7d32", margin: 0 }}>{formatKES(changeDue)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Complete Sale */}
            <button
              onClick={() => void completeSale()}
              disabled={completing || !shift}
              style={{
                width: "100%", padding: "14px 0",
                background: completing || !shift ? "#ccc" : "#7c3aed",
                color: "#fff", border: "none", borderRadius: 6,
                fontFamily: FONT, fontSize: 11, letterSpacing: "0.25em",
                textTransform: "uppercase", cursor: !shift || completing ? "not-allowed" : "pointer",
                fontWeight: 700,
              }}
            >
              {completing ? "Processing…" : !shift ? "Open a Shift First" : "Complete Sale [Enter]"}
            </button>
          </>}
        </div>
      </div>
    </div>
  );
}

// ── Shared style constants ────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontFamily: FONT, fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase",
  color: "#999", display: "block", marginBottom: 5,
};

const inputStyle: React.CSSProperties = {
  display: "block", width: "100%", padding: "9px 11px",
  border: "1px solid #e0e0e0", borderRadius: 4,
  fontFamily: FONT, fontSize: 13, color: "#111", background: "#fff",
  boxSizing: "border-box", outline: "none", marginBottom: 10,
};

const qtyBtnStyle: React.CSSProperties = {
  width: 24, height: 24, border: "1px solid #e0e0e0", background: "none",
  borderRadius: 3, cursor: "pointer", fontFamily: FONT, fontSize: 14, color: "#111",
  display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
};
