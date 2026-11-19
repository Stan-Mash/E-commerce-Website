"use client";

// Elite Style Co - POS terminal.
// Supports cash / M-Pesa STK / C2B, held carts, item discounts, stock badges,
// a thermal receipt, and a WhatsApp receipt link.
// Keyboard: F1=Cash, F2=STK, F3=C2B, Enter=Complete.

import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import { CheckCircle2, Printer } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

function adminFetch(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...init, credentials: "include" });
}

// Types

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
  slug:        string;
  category:    string;
  base_price:  number;
  status:      string;
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

// Helpers

const FONT = "'Inter','Urbanist',sans-serif";
const TILL_NUMBER = process.env.NEXT_PUBLIC_MPESA_PAYBILL ?? "";

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
    `*Elite Style Co. Receipt*`,
    `Ref: ${params.orderRef}`,
    `Location: ${params.locationName}`,
    ``,
    ...params.items.map(i =>
      `• ${i.quantity}× ${i.product_name} (${i.size}${i.color ? "/" + i.color : ""}): ${formatKES(i.unit_price * i.quantity - i.item_discount)}`
    ),
    ``,
    params.discount > 0 ? `Discount: -${formatKES(params.discount)}` : null,
    `*Total: ${formatKES(params.total)}*`,
    `Payment: ${pmLabel}`,
    params.changeDue > 0 ? `Change: ${formatKES(params.changeDue)}` : null,
    ``,
    `Thank you for shopping with us!`,
    `www.elitestyleco.co.ke`,
    `Returns within 14 days with receipt.`,
  ].filter(Boolean).join("\n");
  const norm = params.phone.replace(/\D/g, "").replace(/^0/, "254");
  return `https://wa.me/${norm}?text=${encodeURIComponent(lines)}`;
}

// ESC/POS thermal receipt

interface ReceiptParams {
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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function writeESCPOS(port: any, params: ReceiptParams): Promise<void> {
  const enc = new TextEncoder();
  const ESC = 0x1b, GS = 0x1d;
  const cmd = (...b: number[]) => new Uint8Array(b);
  const ln  = (s = "") => enc.encode(s + "\n");
  const sep = () => enc.encode("-".repeat(32) + "\n");

  const pmLabel = params.paymentMethod === "cash" ? "CASH"
    : params.paymentMethod === "mpesa_stk" ? "M-PESA STK" : "M-PESA TILL";

  const chunks: Uint8Array[] = [
    cmd(ESC, 0x40),
    cmd(ESC, 0x61, 0x01),
    cmd(GS,  0x21, 0x11), cmd(ESC, 0x45, 0x01),
    ln("ELITE STYLE CO"),
    cmd(GS,  0x21, 0x00), cmd(ESC, 0x45, 0x00),
    ln(params.locationName),
    ln("Nairobi, Kenya"),
    ln("KRA PIN: P000000000A"),
    ln(new Date().toLocaleString("en-KE", { dateStyle: "short", timeStyle: "short" })),
    cmd(0x0a), sep(), cmd(ESC, 0x61, 0x00),
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
    ln("Returns: 14 days with original receipt."),
    ln("No returns on sale/clearance items."),
    cmd(0x0a), cmd(0x0a), cmd(0x0a),
    cmd(GS, 0x56, 0x00),
  );

  const writer = port.writable!.getWriter();
  for (const c of chunks) await writer.write(c);
  writer.releaseLock();
}

function browserPrintReceipt(params: ReceiptParams): void {
  const pmLabel = params.paymentMethod === "cash" ? "CASH"
    : params.paymentMethod === "mpesa_stk" ? "M-PESA STK" : "M-PESA TILL";
  const rows = params.items.map(i => {
    const amt  = i.unit_price * i.quantity - i.item_discount;
    const name = `${i.quantity}x ${i.product_name} (${i.size}${i.color ? "/" + i.color : ""})`;
    return `<div style="display:flex;justify-content:space-between;margin:2px 0"><span>${name}</span><span style="white-space:nowrap;margin-left:8px">${formatKES(amt)}</span></div>`;
  }).join("");
  const discRow = params.discount > 0 ? `
    <div style="display:flex;justify-content:space-between"><span>Subtotal:</span><span>${formatKES(params.subtotal)}</span></div>
    <div style="display:flex;justify-content:space-between"><span>Discount:</span><span>-${formatKES(params.discount)}</span></div>
    <hr style="border:none;border-top:1px dashed #000;margin:6px 0">` : "";
  const cashRow = params.paymentMethod === "cash" && params.amountPaid > 0 ? `
    <div style="display:flex;justify-content:space-between"><span>Tendered:</span><span>${formatKES(params.amountPaid)}</span></div>
    <div style="display:flex;justify-content:space-between"><span>Change:</span><span>${formatKES(params.changeDue)}</span></div>` : "";
  const ts = new Date().toLocaleString("en-KE", { dateStyle: "short", timeStyle: "short" });
  const html = `<!DOCTYPE html><html><head><title>Receipt ${params.orderRef}</title>
<style>@page{size:80mm auto;margin:4mm}body{font-family:'Courier New',monospace;font-size:12px;width:72mm;margin:0}hr{border:none;border-top:1px dashed #000;margin:6px 0}.c{text-align:center}@media print{.no-print{display:none}}</style>
</head><body>
<div class="c" style="font-size:16px;font-weight:bold">ELITE STYLE CO</div>
<div class="c">${params.locationName}</div><div class="c">Nairobi, Kenya</div>
<div class="c">${ts}</div><hr>
${rows}<hr>${discRow}
<div style="display:flex;justify-content:space-between;font-weight:bold;font-size:14px"><span>TOTAL:</span><span>${formatKES(params.total)}</span></div>
<div>Payment: ${pmLabel}</div>${cashRow}<hr>
<div class="c">Ref: ${params.orderRef}</div>
${params.phone ? `<div class="c">Customer: ${params.phone}</div>` : ""}
<div class="c">Cashier: ${params.cashierName}</div>
<br><div class="c">Thank you for shopping with us!</div>
<div class="c">www.elitestyleco.co.ke</div>
<div class="c">Returns: 14 days with original receipt.</div>
<br><button class="no-print" onclick="window.print()" style="display:block;margin:12px auto;padding:8px 24px;font-size:13px;cursor:pointer">Print</button>
</body></html>`;
  const w = window.open("", "_blank", "width=400,height=680,toolbar=0,menubar=0,scrollbars=1");
  if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 400); }
}

// Shift modal

interface ShiftModalProps {
  shiftAction:  "open" | "close";
  cashierName:  string;
  shift:        Shift | null;
  errorMsg:     string | null;
  onOpen:       (name: string, float: number) => void;
  onClose:      (float: number) => void;
  onCancel:     () => void;
}

const ShiftModalComponent = memo(function ShiftModalComponent({ shiftAction, cashierName, shift, errorMsg, onOpen, onClose, onCancel }: ShiftModalProps) {
  const [nameVal,    setNameVal]    = useState(cashierName);
  const [floatVal,   setFloatVal]   = useState("");
  const [closingVal, setClosingVal] = useState("");

  const cashierRef = useRef<HTMLInputElement>(null);
  const floatRef   = useRef<HTMLInputElement>(null);
  const closingRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (shiftAction === "open") cashierRef.current?.focus();
    else                        closingRef.current?.focus();
  }, [shiftAction]);

  const submitOpen  = () => { onOpen(nameVal.trim() || "Staff", parseFloat(floatVal) || 0); };
  const submitClose = () => { onClose(parseFloat(closingVal) || 0); };

  return (
    <div
      onKeyDown={e => { e.stopPropagation(); e.nativeEvent?.stopImmediatePropagation?.(); }}
      onKeyUp={e => { e.stopPropagation(); e.nativeEvent?.stopImmediatePropagation?.(); }}
      onKeyPress={e => { e.stopPropagation(); e.nativeEvent?.stopImmediatePropagation?.(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
    >
      <div style={{ background: "#fff", borderRadius: 12, padding: 40, width: 400, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <h2 style={{ fontFamily: FONT, fontSize: 22, fontWeight: 800, color: "#111", margin: "0 0 24px" }}>
          {shiftAction === "open" ? "Open Shift" : "Close Shift"}
        </h2>
        {errorMsg && (
          <div style={{ background: "#fde8e8", border: "1px solid #f5c6cb", borderRadius: 4, padding: "10px 12px", marginBottom: 16, fontFamily: FONT, fontSize: 13, color: "#c0392b" }}>
            {errorMsg}
          </div>
        )}
        {shiftAction === "open" ? (
          <div>
            <label style={labelStyle}>Cashier Name</label>
            <input ref={cashierRef} value={nameVal} onChange={e => setNameVal(e.target.value)}
              placeholder="Your name" style={inputStyle}
              onKeyDown={e => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); if (e.key === "Enter") { e.preventDefault(); submitOpen(); } if (e.key === "Tab") { e.preventDefault(); floatRef.current?.focus(); } }} />
            <label style={labelStyle}>Opening Cash Float (KES)</label>
            <input ref={floatRef} value={floatVal} onChange={e => setFloatVal(e.target.value)}
              type="number" placeholder="0" style={inputStyle}
              onKeyDown={e => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); if (e.key === "Enter") { e.preventDefault(); submitOpen(); } if (e.key === "Tab") { e.preventDefault(); cashierRef.current?.focus(); } }} />
            <button type="button" onClick={submitOpen} style={{ fontFamily: FONT, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 4, padding: "13px 0", cursor: "pointer", width: "100%", marginTop: 4, fontWeight: 700 }}>
              Open Shift
            </button>
          </div>
        ) : (
          <div>
            <label style={labelStyle}>Closing Cash Count (KES)</label>
            <input ref={closingRef} value={closingVal} onChange={e => setClosingVal(e.target.value)}
              type="number" placeholder="0" style={inputStyle}
              onKeyDown={e => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); if (e.key === "Enter") { e.preventDefault(); submitClose(); } }} />
            <button type="button" onClick={submitClose} style={{ fontFamily: FONT, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", background: "#c0392b", color: "#fff", border: "none", borderRadius: 4, padding: "13px 0", cursor: "pointer", width: "100%", marginTop: 4, fontWeight: 700 }}>
              Close Shift
            </button>
          </div>
        )}
        {shift && (
          <button type="button" onClick={onCancel} style={{ fontFamily: FONT, fontSize: 12, background: "none", color: "#888", border: "none", cursor: "pointer", width: "100%", marginTop: 8, padding: "10px 0" }}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
});

// Main component

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
  const [c2bRefCode,      setC2bRefCode]     = useState("");
  const [completing,      setCompleting]     = useState(false);
  const [successRef,      setSuccessRef]     = useState<string | null>(null);
  const [errorMsg,        setErrorMsg]       = useState<string | null>(null);

  // Shift
  const [shift,           setShift]          = useState<Shift | null>(null);
  const [showShiftModal,  setShowShiftModal]  = useState(false);
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

  const [variantPickerProduct, setVariantPickerProduct] = useState<Product | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [printerPort, setPrinterPort] = useState<any>(null);

  const connectPrinter = useCallback(async () => {
    if (!("serial" in navigator)) { setErrorMsg("Web Serial not supported. Use Chrome or Edge."); return; }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = await (navigator as any).serial.requestPort();
      await p.open({ baudRate: 9600 });
      setPrinterPort(p);
    } catch { /* user cancelled */ }
  }, []);

  const disconnectPrinter = useCallback(async () => {
    if (!printerPort) return;
    try { await printerPort.close(); } catch {}
    setPrinterPort(null);
  }, [printerPort]);

  const handlePrint = useCallback(async (params: ReceiptParams) => {
    if (printerPort) {
      try { await writeESCPOS(printerPort, params); return; }
      catch { setPrinterPort(null); }
    }
    browserPrintReceipt(params);
  }, [printerPort]);

  const searchRef = useRef<HTMLInputElement>(null);
  const showShiftModalRef = useRef(false);
  useEffect(() => { showShiftModalRef.current = showShiftModal; }, [showShiftModal]);

  // Load locations
  useEffect(() => {
    adminFetch("/api/admin/locations")
      .then(r => r.json())
      .then((j: { locations: Location[] }) => {
        setLocations(j.locations ?? []);
        const store = j.locations?.find(l => l.type === "store");
        if (store) setLocationId(store.id);
      })
      .catch(() => {});
  }, []);

  // Load active shift
  const loadShift = useCallback((locId: string) => {
    if (!locId) return;
    adminFetch(`/api/admin/pos/shifts?location_id=${locId}`)
      .then(r => r.json())
      .then((j: { shift: Shift | null }) => {
        setShift(j.shift ?? null);
        if (!j.shift) setShowShiftModal(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { if (locationId) void loadShift(locationId); }, [locationId, loadShift]);

  // Load products — active status only, deduplicated by slug
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminFetch("/api/admin/products");
      if (r.ok) {
        const j = await r.json() as { products: (Product & { status: string; slug: string })[] };
        const seen = new Set<string>();
        const deduped = (j.products ?? [])
          .filter(p => p.status === "active")
          .filter(p => p.skus.some(s => s.stock_quantity > 0))
          .filter(p => {
            const key = p.slug || p.id;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        setProducts(deduped);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadProducts(); }, [loadProducts]);

  // Keyboard shortcuts
  const completeSaleRef = useRef<() => Promise<void>>(undefined);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (showShiftModalRef.current) return;
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function lookupBarcode(code: string) {
    for (const product of products) {
      const sku = product.skus.find(s => s.sku_code === code);
      if (sku) { addToCart(product, sku); return; }
    }
    setSearch(code);
    searchRef.current?.focus();
  }

  // Barcode scanner
  useEffect(() => {
    let buf = "", last = 0;
    function onKeyDown(e: KeyboardEvent) {
      if (showShiftModalRef.current) return;
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

  // Supabase Realtime for C2B
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

  // Cart helpers
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
    setCart([]); setPhone(""); setPromoCode(""); setAmountTendered(""); setC2bRefCode("");
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

  // Totals
  const subtotal      = cart.reduce((s, c) => s + c.unit_price * c.quantity, 0);
  const itemDiscounts = cart.reduce((s, c) => s + c.item_discount, 0);
  const displayTotal  = Math.round(subtotal - itemDiscounts);
  const tenderedAmt   = parseFloat(amountTendered) || 0;
  const changeDue     = paymentMethod === "cash" && tenderedAmt > displayTotal
    ? tenderedAmt - displayTotal : 0;

  // Shift management
  async function openShift(cashierNameVal: string, openingFloatVal: number) {
    const r = await adminFetch("/api/admin/pos/shifts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "open", location_id: locationId, cashier_name: cashierNameVal || "Staff", opening_float: openingFloatVal }),
    });
    const j = await r.json() as { shift?: Shift; error?: string };
    if (r.ok) { setShift(j.shift ?? null); setShowShiftModal(false); setCashierName(j.shift?.cashier_name ?? cashierNameVal); setErrorMsg(null); }
    else setErrorMsg(j.error ?? "Failed to open shift");
  }

  async function closeShift(closingFloatVal: number) {
    if (!shift) return;
    const r = await adminFetch("/api/admin/pos/shifts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close", shift_id: shift.id, closing_float: closingFloatVal }),
    });
    const j = await r.json() as { shift?: { variance: number; expected_float: number }; error?: string };
    if (r.ok) {
      alert(`Shift closed.\nExpected: ${formatKES(j.shift?.expected_float ?? 0)}\nActual: ${formatKES(closingFloatVal)}\nVariance: ${formatKES(j.shift?.variance ?? 0)}`);
      setShift(null); setShowShiftModal(false); clearCart();
    } else setErrorMsg(j.error ?? "Failed to close shift");
  }

  // Complete sale
  async function completeSale() {
    if (cart.length === 0 || !locationId || !shift) return;
    if (paymentMethod === "mpesa_stk" && !phone.trim()) {
      setErrorMsg("Phone number required for M-Pesa STK Push."); return;
    }
    setCompleting(true); setErrorMsg(null);
    try {
      const r = await adminFetch("/api/admin/pos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone, payment_method: paymentMethod,
          location_id: locationId, shift_id: shift.id,
          cashier_name: cashierName || shift.cashier_name || "Staff",
          items: cart.map(c => ({
            sku_id: c.sku_id, quantity: c.quantity,
            unit_price: Math.round(c.unit_price - c.item_discount / Math.max(c.quantity, 1)),
          })),
          promo_code: promoCode || undefined,
          c2b_ref: paymentMethod === "mpesa_c2b" && c2bRefCode ? c2bRefCode.trim() : undefined,
        }),
      });

      const j = await r.json() as {
        order_id?: string; order_ref?: string; total?: number;
        discount_amount?: number; checkout_request_id?: string;
        customer_message?: string; instruction?: string; error?: string;
      };

      if (!r.ok) { setErrorMsg(j.error ?? "Failed to complete sale."); return; }

      const sale = {
        orderRef: j.order_ref ?? "",
        items: [...cart], subtotal,
        discount: (j.discount_amount ?? 0) + itemDiscounts,
        total: j.total ?? displayTotal,
        paymentMethod,
        amountPaid: tenderedAmt || (j.total ?? displayTotal),
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
        setCart([]); setAmountTendered(""); setC2bRefCode("");
        void loadProducts();
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setCompleting(false);
    }
  }

  async function markC2bPaid() {
    if (!c2bOrderId) return;
    if (!window.confirm("Only mark as paid after verifying the customer's M-Pesa payment.\n\nProceed?")) return;
    const r = await adminFetch(`/api/admin/orders/pending-buy-goods`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: c2bOrderId, action: "confirm" }),
    });
    if (r.ok) setC2bPaid(true);
    else alert("Could not mark order as paid. Please try again.");
  }

  useEffect(() => { completeSaleRef.current = completeSale; });

  const locationName = locations.find(l => l.id === locationId)?.name ?? "Store";

  const handleOpenShift  = useCallback((name: string, float: number) => { void openShift(name, float); }, [locationId]); // eslint-disable-line react-hooks/exhaustive-deps
  const handleCloseShift = useCallback((float: number) => { void closeShift(float); }, [shift]);                         // eslint-disable-line react-hooks/exhaustive-deps
  const handleCancelShift = useCallback(() => setShowShiftModal(false), []);

  // C2B waiting screen
  if (c2bOrderId && !c2bPaid) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", background: "var(--es-paper)" }}>
        <div style={{ textAlign: "center", padding: 48, background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, maxWidth: 520, width: "100%" }}>
          <div style={{ width: 64, height: 64, margin: "0 auto 20px", borderRadius: "50%", background: "#fff8e1", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#c9a961" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <p style={{ fontFamily: FONT, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#c9a961", marginBottom: 10 }}>
            Awaiting M-Pesa Payment
          </p>
          <p style={{ fontFamily: FONT, fontSize: 48, fontWeight: 900, color: "#111", margin: "0 0 6px", letterSpacing: "-0.03em" }}>
            {formatKES(c2bTotal)}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: TILL_NUMBER ? "1fr 1fr" : "1fr", gap: 10, margin: "24px 0 20px" }}>
            {TILL_NUMBER && (
              <div style={{ background: "#e8f5e9", border: "2px solid #66bb6a", borderRadius: 8, padding: "14px 16px" }}>
                <p style={{ fontFamily: FONT, fontSize: 9, color: "#2e7d32", margin: "0 0 6px", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700 }}>Pay to Till</p>
                <p style={{ fontFamily: FONT, fontSize: 28, fontWeight: 900, color: "#2e7d32", margin: 0 }}>{TILL_NUMBER}</p>
              </div>
            )}
            <div style={{ background: "#f3e8ff", border: "2px solid #7c3aed", borderRadius: 8, padding: "14px 16px" }}>
              <p style={{ fontFamily: FONT, fontSize: 9, color: "#7c3aed", margin: "0 0 6px", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700 }}>Account Ref</p>
              <p style={{ fontFamily: FONT, fontSize: 28, fontWeight: 900, color: "#7c3aed", margin: 0, wordBreak: "break-all" }}>{c2bOrderRef}</p>
            </div>
          </div>
          <p style={{ fontFamily: FONT, fontSize: 13, color: "#666", lineHeight: 1.8, margin: "0 0 24px" }}>
            Customer pays via <strong>M-Pesa Buy Goods</strong>{TILL_NUMBER ? <> · Till <strong>{TILL_NUMBER}</strong></> : ""}<br/>
            Use <strong>{c2bOrderRef}</strong> as account reference.<br/>
            <span style={{ color: "#aaa", fontSize: 12 }}>Screen updates automatically once payment is received.</span>
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => void markC2bPaid()} style={{ fontFamily: FONT, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", background: "#2e7d32", color: "#fff", border: "none", borderRadius: 4, padding: "11px 20px", cursor: "pointer", fontWeight: 700 }}>
              ✓ Mark as Paid
            </button>
            <button onClick={clearCart} style={{ fontFamily: FONT, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", background: "#f1f1f1", color: "#555", border: "none", borderRadius: 4, padding: "11px 20px", cursor: "pointer" }}>
              Cancel Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (c2bPaid) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", background: "var(--es-paper)" }}>
        <div style={{ textAlign: "center", padding: 48, background: "#e8f5e9", border: "2px solid #66bb6a", borderRadius: 12, maxWidth: 480, width: "100%" }}>
          <div style={{ marginBottom: 8, color: "#2e7d32" }}><CheckCircle2 size={56} aria-hidden="true" /></div>
          <p style={{ fontFamily: FONT, fontSize: 28, fontWeight: 900, color: "#2e7d32", margin: "0 0 4px" }}>Payment Confirmed</p>
          <p style={{ fontFamily: FONT, fontSize: 15, color: "#2e7d32", fontWeight: 700 }}>{c2bOrderRef}</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
            {lastSale && <>
              <button onClick={() => void handlePrint({ ...lastSale, cashierName: cashierName || "Staff", phone, locationName })}
                style={{ fontFamily: FONT, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 4, padding: "10px 18px", cursor: "pointer" }}>
                Print Receipt
              </button>
              {phone && (
                <a href={whatsappLink({ ...lastSale, phone, locationName })} target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: FONT, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", background: "#25D366", color: "#fff", border: "none", borderRadius: 4, padding: "10px 18px", textDecoration: "none", display: "inline-block" }}>
                  WhatsApp Receipt
                </a>
              )}
            </>}
            <button onClick={() => { clearCart(); void loadProducts(); }}
              style={{ fontFamily: FONT, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", background: "#2e7d32", color: "#fff", border: "none", borderRadius: 4, padding: "10px 18px", cursor: "pointer" }}>
              New Sale
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main render — full-height locked layout
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", fontFamily: FONT, background: "#f7f7f8" }}>

      {/* Modals */}
      {showShiftModal && (
        <ShiftModalComponent shiftAction={shiftAction} cashierName={cashierName} shift={shift}
          errorMsg={errorMsg} onOpen={handleOpenShift} onClose={handleCloseShift} onCancel={handleCancelShift} />
      )}

      {showHeld && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "flex-end", zIndex: 150 }} onClick={() => setShowHeld(false)}>
          <div style={{ width: 360, maxWidth: "100%", background: "#fff", height: "100%", overflowY: "auto", padding: 28, boxShadow: "-8px 0 40px rgba(0,0,0,0.12)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontFamily: FONT, fontSize: 16, fontWeight: 800, color: "#111", margin: 0 }}>Held ({heldCarts.length})</h3>
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
      )}

      {variantPickerProduct && (
        <div onClick={() => setVariantPickerProduct(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, maxWidth: 540, width: "100%", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }}>
            <div style={{ display: "flex", gap: 16, padding: "20px 24px", borderBottom: "1px solid #f5f5f5", alignItems: "center" }}>
              {variantPickerProduct.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={variantPickerProduct.image_url} alt={variantPickerProduct.name} style={{ width: 68, height: 68, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
              ) : (
                <div style={{ width: 68, height: 68, background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/></svg>
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: FONT, fontSize: 16, fontWeight: 800, color: "#111", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{variantPickerProduct.name}</p>
                <p style={{ fontFamily: FONT, fontSize: 20, fontWeight: 900, color: "#7c3aed", margin: 0, letterSpacing: "-0.02em" }}>{formatKES(variantPickerProduct.base_price)}</p>
              </div>
              <button onClick={() => setVariantPickerProduct(null)} style={{ background: "#f5f5f5", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, color: "#666", fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ fontFamily: FONT, fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "#bbb", margin: "0 0 14px" }}>Select Size / Colour</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, maxHeight: 300, overflowY: "auto" }}>
                {variantPickerProduct.skus.filter(s => s.stock_quantity > 0).map(sku => (
                  <button key={sku.id} onClick={() => { addToCart(variantPickerProduct, sku); setVariantPickerProduct(null); }}
                    style={{ fontFamily: FONT, border: `1.5px solid ${sku.stock_quantity <= 3 ? "#fde8e8" : "#ede9fe"}`, borderRadius: 10, padding: "12px 8px", cursor: "pointer", background: sku.stock_quantity <= 3 ? "#fffaf9" : "#faf8ff", textAlign: "center" }}>
                    {sku.size !== "ONE SIZE" && <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: "#111", margin: "0 0 2px" }}>{sku.size}</p>}
                    {sku.color && <p style={{ fontFamily: FONT, fontSize: 12, color: "#555", margin: "0 0 8px", textTransform: "capitalize" }}>{sku.color}</p>}
                    {!sku.color && sku.size === "ONE SIZE" && <p style={{ fontFamily: FONT, fontSize: 12, color: "#555", margin: "0 0 8px" }}>One Size</p>}
                    <span style={{ display: "inline-block", fontFamily: FONT, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: sku.stock_quantity <= 3 ? "#c0392b" : "#2e7d32", background: sku.stock_quantity <= 3 ? "#fde8e8" : "#e8f5e9", padding: "2px 8px", borderRadius: 20 }}>
                      {sku.stock_quantity} left
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POS Toolbar — replaces the old h1 header */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#fff", borderBottom: "1px solid #e8e8e8", flexShrink: 0, flexWrap: "wrap" }}>
        {/* Keyboard hints */}
        {[["F1", "Cash"], ["F2", "STK Push"], ["F3", "Till"], ["↵", "Complete"]].map(([k, v]) => (
          <span key={k} style={{ fontFamily: FONT, fontSize: 10, background: "#f3f3f5", border: "1px solid #e0e0e0", borderRadius: 4, padding: "3px 8px", color: "#666", whiteSpace: "nowrap" }}>
            <strong style={{ color: "#111" }}>{k}</strong> {v}
          </span>
        ))}

        <div style={{ flex: 1 }} />

        {/* Printer */}
        <button onClick={() => printerPort ? void disconnectPrinter() : void connectPrinter()}
          title={printerPort ? "Disconnect printer" : "Connect receipt printer"}
          style={{ fontFamily: FONT, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", background: printerPort ? "#e8f5e9" : "#f5f5f5", color: printerPort ? "#2e7d32" : "#888", border: `1px solid ${printerPort ? "#a5d6a7" : "#ddd"}`, borderRadius: 4, padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          <Printer size={12} aria-hidden="true" />
          {printerPort ? "On" : "Off"}
        </button>

        {/* Held orders */}
        <button onClick={() => setShowHeld(true)}
          style={{ fontFamily: FONT, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", background: heldCarts.length > 0 ? "#fff8e1" : "#f5f5f5", color: heldCarts.length > 0 ? "#92680a" : "#aaa", border: `1px solid ${heldCarts.length > 0 ? "#f0c040" : "#ddd"}`, borderRadius: 4, padding: "5px 10px", cursor: "pointer", fontWeight: heldCarts.length > 0 ? 700 : 400 }}>
          {heldCarts.length > 0 ? `⏸ Held (${heldCarts.length})` : "Held (0)"}
        </button>

        {/* Location */}
        {locations.length > 1 ? (
          <select value={locationId} onChange={e => setLocationId(e.target.value)}
            style={{ padding: "5px 8px", borderRadius: 4, border: "1px solid #e0e0e0", fontFamily: FONT, fontSize: 12, color: "#111", background: "#fff" }}>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        ) : (
          <span style={{ fontFamily: FONT, fontSize: 11, color: "#999" }}>{locationName}</span>
        )}

        {/* Shift */}
        {shift ? (
          <>
            <span style={{ fontFamily: FONT, fontSize: 11, color: "#2e7d32", fontWeight: 700 }}>● {shift.cashier_name}</span>
            <button onClick={() => { setShiftAction("close"); setShowShiftModal(true); }}
              style={{ fontFamily: FONT, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", background: "#fde8e8", color: "#c0392b", border: "1px solid #f5c6cb", borderRadius: 4, padding: "5px 10px", cursor: "pointer" }}>
              End Shift
            </button>
          </>
        ) : (
          <button onClick={() => { setShiftAction("open"); setShowShiftModal(true); }}
            style={{ fontFamily: FONT, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 4, padding: "6px 14px", cursor: "pointer", fontWeight: 700 }}>
            Open Shift
          </button>
        )}
      </div>

      {!shift && (
        <div style={{ background: "#fff8e1", border: "none", borderBottom: "1px solid #f0c040", padding: "8px 16px", fontFamily: FONT, fontSize: 12, color: "#92680a", flexShrink: 0 }}>
          No open shift — open a shift before processing sales.
        </div>
      )}

      {/* Body: product grid + cart */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

        {/* ── Product panel ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "12px 12px 0 16px" }}>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: 10, flexShrink: 0 }}>
            <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input ref={searchRef} type="text" placeholder="Search or scan barcode…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 32, marginBottom: 0, fontSize: 13, background: "#fff", borderColor: "#e0e0e0", borderRadius: 6 }} />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
            )}
          </div>

          {/* Category tabs */}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10, flexShrink: 0 }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)}
                style={{ fontFamily: FONT, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${categoryFilter === cat ? "#7c3aed" : "#e8e8e8"}`, background: categoryFilter === cat ? "#7c3aed" : "#fff", color: categoryFilter === cat ? "#fff" : "#999", cursor: "pointer" }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Product grid — compact 4-5 columns, scrollable */}
          <div style={{ flex: 1, overflowY: "auto", paddingBottom: 12 }}>
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160 }}>
                <p style={{ fontFamily: FONT, fontSize: 13, color: "#ccc" }}>Loading products…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 160, gap: 10 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <p style={{ fontFamily: FONT, fontSize: 13, color: "#ccc", margin: 0 }}>No products found</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                {filtered.map(product => {
                  const inStockSkus = product.skus.filter(s => s.stock_quantity > 0);
                  const totalStock  = inStockSkus.reduce((s, k) => s + k.stock_quantity, 0);
                  const lowStock    = inStockSkus.some(s => s.stock_quantity <= 3);
                  return (
                    <div key={product.id}
                      onClick={() => {
                        if (inStockSkus.length === 1 && inStockSkus[0]) addToCart(product, inStockSkus[0]);
                        else setVariantPickerProduct(product);
                      }}
                      style={{ background: "#fff", borderRadius: 8, border: "1px solid #ececec", overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "box-shadow 0.12s" }}
                    >
                      {/* Thumbnail — square aspect ratio */}
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.image_url} alt={product.name} style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", aspectRatio: "1/1", background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/></svg>
                        </div>
                      )}

                      <div style={{ padding: "8px 10px 10px" }}>
                        <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: "#111", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {product.name}
                        </p>
                        <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 900, color: "#7c3aed", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                          {formatKES(product.base_price)}
                        </p>

                        {/* Variant pills (up to 4) */}
                        {inStockSkus.length > 1 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 5 }}>
                            {inStockSkus.slice(0, 4).map(sku => (
                              <span key={sku.id} style={{ fontFamily: FONT, fontSize: 9, background: "#f3f3f5", border: "1px solid #e0e0e0", borderRadius: 3, padding: "1px 5px", color: "#555" }}>
                                {sku.size === "ONE SIZE" ? sku.color || "OS" : sku.size}
                              </span>
                            ))}
                            {inStockSkus.length > 4 && (
                              <span style={{ fontFamily: FONT, fontSize: 9, color: "#aaa" }}>+{inStockSkus.length - 4}</span>
                            )}
                          </div>
                        )}

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontFamily: FONT, fontSize: 9, color: lowStock ? "#c0392b" : "#aaa" }}>
                            {lowStock ? `${totalStock} left` : `${inStockSkus.length} size${inStockSkus.length !== 1 ? "s" : ""}`}
                          </span>
                          <span style={{ fontFamily: FONT, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#fff", background: "#7c3aed", padding: "3px 8px", borderRadius: 12 }}>
                            {inStockSkus.length === 1 ? "Add" : "Pick"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Cart panel — full height, pinned footer ── */}
        <div style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", background: "#fff", borderLeft: "1px solid #e8e8e8", overflow: "hidden" }}>

          {/* Cart header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
            <span style={{ fontFamily: FONT, fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#888" }}>
              Cart ({cart.reduce((s, c) => s + c.quantity, 0)})
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {cart.length > 0 && <>
                <button onClick={holdCart} style={{ fontFamily: FONT, fontSize: 9, color: "#c9a961", background: "none", border: "1px solid #c9a961", cursor: "pointer", padding: "3px 8px", borderRadius: 3, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Hold ⏸
                </button>
                <button onClick={clearCart} style={{ fontFamily: FONT, fontSize: 9, color: "#aaa", background: "none", border: "none", cursor: "pointer" }}>
                  Clear
                </button>
              </>}
            </div>
          </div>

          {/* Success / error banners */}
          {successRef && (
            <div style={{ background: "#e8f5e9", borderBottom: "1px solid #a5d6a7", padding: "12px 16px", flexShrink: 0 }}>
              <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 800, color: "#2e7d32", margin: "0 0 2px" }}>✓ Sale Complete</p>
              <p style={{ fontFamily: FONT, fontSize: 11, color: "#2e7d32", margin: "0 0 6px", fontWeight: 600 }}>Ref: {successRef}</p>
              {lastSale?.changeDue != null && lastSale.changeDue > 0 && (
                <p style={{ fontFamily: FONT, fontSize: 18, fontWeight: 900, color: "#111", margin: "0 0 8px" }}>
                  Change: {formatKES(lastSale.changeDue)}
                </p>
              )}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {lastSale && (
                  <button onClick={() => void handlePrint({ ...lastSale, cashierName: cashierName || "Staff", phone, locationName })}
                    style={{ fontFamily: FONT, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 3, padding: "6px 12px", cursor: "pointer" }}>
                    Print
                  </button>
                )}
                {lastSale && phone && (
                  <a href={whatsappLink({ ...lastSale, phone, locationName })} target="_blank" rel="noopener noreferrer"
                    style={{ fontFamily: FONT, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", background: "#25D366", color: "#fff", border: "none", borderRadius: 3, padding: "6px 12px", textDecoration: "none", display: "inline-block" }}>
                    WhatsApp
                  </a>
                )}
                <button onClick={clearCart} style={{ fontFamily: FONT, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", background: "#2e7d32", color: "#fff", border: "none", borderRadius: 3, padding: "6px 12px", cursor: "pointer" }}>
                  New Sale
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div style={{ background: "#fde8e8", borderBottom: "1px solid #f5c6cb", padding: "8px 16px", fontFamily: FONT, fontSize: 12, color: "#c0392b", flexShrink: 0 }}>
              {errorMsg}
              <button onClick={() => setErrorMsg(null)} style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "#c0392b", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
            </div>
          )}

          {/* Cart line items — scrollable middle */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 16px", minHeight: 0 }}>
            {cart.length === 0 && !successRef && (
              <div style={{ padding: "32px 0", textAlign: "center", fontFamily: FONT, fontSize: 12, color: "#ccc" }}>
                Tap a product or scan a barcode.
              </div>
            )}
            {cart.map(item => (
              <div key={item.sku_id} style={{ padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: FONT, fontSize: 12, color: "#111", margin: 0, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.product_name}</p>
                    <p style={{ fontFamily: FONT, fontSize: 10, color: "#888", margin: "1px 0 0" }}>{item.size}{item.color ? `/${item.color}` : ""} · {formatKES(item.unit_price)}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                    <button onClick={() => updateQty(item.sku_id, -1)} style={qtyBtnStyle}>−</button>
                    <span style={{ fontFamily: FONT, fontSize: 12, color: "#111", width: 16, textAlign: "center", fontWeight: 700 }}>{item.quantity}</span>
                    <button onClick={() => updateQty(item.sku_id, 1)}  style={qtyBtnStyle}>+</button>
                  </div>
                  <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "#111", width: 58, textAlign: "right", flexShrink: 0 }}>
                    {formatKES(item.unit_price * item.quantity - item.item_discount)}
                  </span>
                  <button onClick={() => setCart(p => p.filter(c => c.sku_id !== item.sku_id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#e74c3c", fontSize: 14, padding: "1px 2px", lineHeight: 1, flexShrink: 0 }}>×</button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <span style={{ fontFamily: FONT, fontSize: 9, color: "#bbb", letterSpacing: "0.1em", textTransform: "uppercase" }}>Disc KES</span>
                  <input type="number" min="0" value={item.item_discount || ""} onChange={e => updateItemDisc(item.sku_id, e.target.value)} placeholder="0"
                    style={{ width: 52, padding: "2px 5px", border: "1px solid #e8e8e8", borderRadius: 3, fontFamily: FONT, fontSize: 10, color: "#111", background: "#fafafa" }} />
                  {item.item_discount > 0 && <span style={{ fontFamily: FONT, fontSize: 9, color: "#e74c3c" }}>−{formatKES(item.item_discount)}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Cart footer — always pinned at bottom */}
          {cart.length > 0 && (
            <div style={{ flexShrink: 0, borderTop: "2px solid #e8e8e8", padding: "12px 16px", background: "#fff" }}>
              {/* Subtotal + discounts */}
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT, fontSize: 11, color: "#888", marginBottom: 2 }}>
                <span>Subtotal</span><span>{formatKES(subtotal)}</span>
              </div>
              {itemDiscounts > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT, fontSize: 11, color: "#e74c3c", marginBottom: 2 }}>
                  <span>Item Discounts</span><span>−{formatKES(itemDiscounts)}</span>
                </div>
              )}

              {/* Promo code */}
              <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Promo code (optional)"
                style={{ ...inputStyle, marginTop: 6, marginBottom: 6, fontSize: 11, padding: "7px 10px" }} />

              {/* Total */}
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT, fontSize: 18, fontWeight: 900, color: "#111", borderTop: "2px solid #111", paddingTop: 8, marginBottom: 10, letterSpacing: "-0.02em" }}>
                <span>Total</span><span>{formatKES(displayTotal)}</span>
              </div>

              {/* Customer phone */}
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0700 000 000 (optional)"
                style={{ ...inputStyle, marginBottom: 8, fontSize: 12, padding: "7px 10px" }} />

              {/* Payment method */}
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                {(["cash", "mpesa_stk", "mpesa_c2b"] as const).map(m => (
                  <button key={m} onClick={() => setPaymentMethod(m)} style={{
                    flex: 1, padding: "7px 4px", fontFamily: FONT,
                    border: `2px solid ${paymentMethod === m ? "#7c3aed" : "#e0e0e0"}`,
                    background: paymentMethod === m ? "#7c3aed" : "transparent",
                    color: paymentMethod === m ? "#fff" : "#888",
                    borderRadius: 4, cursor: "pointer", lineHeight: 1.3,
                  }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {m === "cash" ? "Cash" : m === "mpesa_stk" ? "STK" : "Till"}
                    </div>
                    <div style={{ fontSize: 8, opacity: 0.7 }}>
                      {m === "cash" ? "F1" : m === "mpesa_stk" ? "F2" : "F3"}
                    </div>
                  </button>
                ))}
              </div>

              {paymentMethod === "mpesa_stk" && (
                <p style={{ fontFamily: FONT, fontSize: 9, color: "#c0392b", margin: "0 0 8px", letterSpacing: "0.02em" }}>
                  STK Push requires a Paybill shortcode. If using Buy Goods till, select Till instead.
                </p>
              )}

              {/* Cash denominations + change calculator */}
              {paymentMethod === "cash" && (
                <div style={{ background: "#fafafa", borderRadius: 6, padding: "8px 10px", marginBottom: 8, border: "1px solid #f0f0f0" }}>
                  <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
                    {[500, 1000, 2000, 5000].map(d => (
                      <button key={d} onClick={() => setAmountTendered(String(d))}
                        style={{ flex: 1, padding: "5px 2px", fontFamily: FONT, fontSize: 9, fontWeight: 700, background: amountTendered === String(d) ? "#111" : "#fff", color: amountTendered === String(d) ? "#fff" : "#555", border: "1px solid #e0e0e0", borderRadius: 4, cursor: "pointer" }}>
                        {d >= 1000 ? `${d / 1000}k` : d}
                      </button>
                    ))}
                    <button onClick={() => setAmountTendered(String(displayTotal))}
                      style={{ flex: 1, padding: "5px 2px", fontFamily: FONT, fontSize: 9, fontWeight: 700, background: amountTendered === String(displayTotal) ? "#111" : "#fff", color: amountTendered === String(displayTotal) ? "#fff" : "#555", border: "1px solid #e0e0e0", borderRadius: 4, cursor: "pointer" }}>
                      Exact
                    </button>
                  </div>
                  <input type="number" value={amountTendered} onChange={e => setAmountTendered(e.target.value)} placeholder={`Amount tendered (${formatKES(displayTotal)})`}
                    style={{ ...inputStyle, marginBottom: 0, fontSize: 11, padding: "7px 10px" }} />
                  {tenderedAmt > 0 && tenderedAmt < displayTotal && (
                    <p style={{ fontFamily: FONT, fontSize: 10, color: "#e74c3c", margin: "4px 0 0" }}>
                      Short by {formatKES(displayTotal - tenderedAmt)}
                    </p>
                  )}
                  {changeDue > 0 && (
                    <div style={{ background: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: 4, padding: "6px 10px", marginTop: 6 }}>
                      <p style={{ fontFamily: FONT, fontSize: 9, color: "#2e7d32", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 1px" }}>Change Due</p>
                      <p style={{ fontFamily: FONT, fontSize: 20, fontWeight: 900, color: "#2e7d32", margin: 0 }}>{formatKES(changeDue)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* C2B reference code */}
              {paymentMethod === "mpesa_c2b" && (
                <input value={c2bRefCode} onChange={e => setC2bRefCode(e.target.value.toUpperCase())}
                  placeholder="M-Pesa confirmation code (optional)"
                  style={{ ...inputStyle, marginBottom: 8, fontSize: 11, padding: "7px 10px" }} />
              )}

              {/* Complete Sale */}
              <button onClick={() => void completeSale()} disabled={completing || !shift}
                style={{
                  width: "100%", padding: "13px 0",
                  background: completing || !shift ? "#ccc" : "#7c3aed",
                  color: "#fff", border: "none", borderRadius: 6,
                  fontFamily: FONT, fontSize: 11, letterSpacing: "0.2em",
                  textTransform: "uppercase", cursor: !shift || completing ? "not-allowed" : "pointer",
                  fontWeight: 700,
                }}>
                {completing ? "Processing…" : !shift ? "Open a Shift First" : "Complete Sale [Enter]"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Shared style constants

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
  width: 22, height: 22, border: "1px solid #e0e0e0", background: "none",
  borderRadius: 3, cursor: "pointer", fontFamily: FONT, fontSize: 13, color: "#111",
  display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
};
