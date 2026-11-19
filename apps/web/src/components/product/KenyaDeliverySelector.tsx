"use client";

import { useState } from "react";

// ── Speedman delivery zones (from official price list) ────────────────────────

interface Zone {
  name: string;
  road: string;
  fee: number;
}

const ALL_ZONES: Zone[] = [
  // Ngong Road
  { name: "Upper Hill",         road: "Ngong Road",     fee: 250 },
  { name: "KNH",                road: "Ngong Road",     fee: 200 },
  { name: "Community",          road: "Ngong Road",     fee: 200 },
  { name: "Valley Road",        road: "Ngong Road",     fee: 200 },
  { name: "Kenyatta Market",    road: "Ngong Road",     fee: 300 },
  { name: "Nairobi Hospital",   road: "Ngong Road",     fee: 300 },
  { name: "Hurlingham",         road: "Ngong Road",     fee: 300 },
  { name: "Kilimani",           road: "Ngong Road",     fee: 300 },
  { name: "Adams Arcade",       road: "Ngong Road",     fee: 300 },
  { name: "Woodly Estate",      road: "Ngong Road",     fee: 300 },
  { name: "Jamhuri Estate",     road: "Ngong Road",     fee: 300 },
  { name: "Junction Mall",      road: "Ngong Road",     fee: 350 },
  { name: "Lavington",          road: "Ngong Road",     fee: 300 },
  { name: "Kibera",             road: "Ngong Road",     fee: 300 },
  { name: "Dagorretti Corner",  road: "Ngong Road",     fee: 400 },
  { name: "Wanye/Kibera",       road: "Ngong Road",     fee: 350 },
  { name: "Karen",              road: "Ngong Road",     fee: 500 },
  { name: "Ngong",              road: "Ngong Road",     fee: 700 },

  // Langata Road
  { name: "T.Mall",             road: "Langata Road",   fee: 300 },
  { name: "Madaraka",           road: "Langata Road",   fee: 300 },
  { name: "Strathmore",         road: "Langata Road",   fee: 300 },
  { name: "Mbagathi",           road: "Langata Road",   fee: 300 },
  { name: "Highrise",           road: "Langata Road",   fee: 300 },
  { name: "Wilson",             road: "Langata Road",   fee: 350 },
  { name: "Langata",            road: "Langata Road",   fee: 300 },
  { name: "Carnivore",          road: "Langata Road",   fee: 300 },
  { name: "Pit Shop",           road: "Langata Road",   fee: 350 },
  { name: "Galleria",           road: "Langata Road",   fee: 350 },
  { name: "Ongata Rongai",      road: "Langata Road",   fee: 700 },

  // Limuru Road
  { name: "Ojijo Road",         road: "Limuru Road",    fee: 200 },
  { name: "Parklands",          road: "Limuru Road",    fee: 250 },
  { name: "Mp Shah",            road: "Limuru Road",    fee: 250 },
  { name: "Aga Khan",           road: "Limuru Road",    fee: 250 },
  { name: "Oshwal",             road: "Limuru Road",    fee: 250 },
  { name: "Highridge",          road: "Limuru Road",    fee: 250 },
  { name: "Mpaka Road",         road: "Limuru Road",    fee: 250 },
  { name: "Gigiri",             road: "Limuru Road",    fee: 400 },
  { name: "UNEP",               road: "Limuru Road",    fee: 400 },
  { name: "Village Market",     road: "Limuru Road",    fee: 400 },
  { name: "Runda",              road: "Limuru Road",    fee: 400 },
  { name: "Mathare (Limuru)",   road: "Limuru Road",    fee: 400 },
  { name: "Ngarai",             road: "Limuru Road",    fee: 500 },
  { name: "Ndenderu",           road: "Limuru Road",    fee: 600 },
  { name: "Limuru Town",        road: "Limuru Road",    fee: 700 },

  // Kiambu Road
  { name: "DCI",                road: "Kiambu Road",    fee: 300 },
  { name: "Balozi Estate",      road: "Kiambu Road",    fee: 300 },
  { name: "Ridgeways",          road: "Kiambu Road",    fee: 300 },
  { name: "Fourways",           road: "Kiambu Road",    fee: 300 },
  { name: "Thindigua",          road: "Kiambu Road",    fee: 400 },
  { name: "Delta",              road: "Kiambu Road",    fee: 400 },
  { name: "Quickmart",          road: "Kiambu Road",    fee: 400 },
  { name: "Muthithi",           road: "Kiambu Road",    fee: 400 },
  { name: "Edenville",          road: "Kiambu Road",    fee: 400 },
  { name: "Kamiti Road",        road: "Kiambu Road",    fee: 500 },
  { name: "Kiringiti",          road: "Kiambu Road",    fee: 500 },
  { name: "Kiambu Town",        road: "Kiambu Road",    fee: 600 },

  // Waiyaki Way
  { name: "Chiromo",            road: "Waiyaki Way",    fee: 250 },
  { name: "State House",        road: "Waiyaki Way",    fee: 300 },
  { name: "Riverside",          road: "Waiyaki Way",    fee: 300 },
  { name: "Waterlands",         road: "Waiyaki Way",    fee: 300 },
  { name: "Safaricom HQ",       road: "Waiyaki Way",    fee: 300 },
  { name: "ABC",                road: "Waiyaki Way",    fee: 350 },
  { name: "Kangemi",            road: "Waiyaki Way",    fee: 300 },
  { name: "Loresho",            road: "Waiyaki Way",    fee: 400 },
  { name: "Mountain View",      road: "Waiyaki Way",    fee: 400 },
  { name: "Westgate",           road: "Waiyaki Way",    fee: 300 },
  { name: "Gen.Mathenge",       road: "Waiyaki Way",    fee: 300 },
  { name: "Kitusuru",           road: "Waiyaki Way",    fee: 400 },
  { name: "Spring Valley",      road: "Waiyaki Way",    fee: 400 },
  { name: "Peponi Road",        road: "Waiyaki Way",    fee: 300 },
  { name: "Thingiri Ridge",     road: "Waiyaki Way",    fee: 350 },
  { name: "Lower Kabete",       road: "Waiyaki Way",    fee: 350 },
  { name: "Kabete Garden",      road: "Waiyaki Way",    fee: 350 },
  { name: "Westfield Apts",     road: "Waiyaki Way",    fee: 350 },
  { name: "Uthiru",             road: "Waiyaki Way",    fee: 500 },
  { name: "Kinoo",              road: "Waiyaki Way",    fee: 600 },
  { name: "Kikuyu",             road: "Waiyaki Way",    fee: 700 },

  // Jogoo Road
  { name: "City Stadium",       road: "Jogoo Road",     fee: 250 },
  { name: "Gikomba",            road: "Jogoo Road",     fee: 200 },
  { name: "Madaraka (Jogoo)",   road: "Jogoo Road",     fee: 300 },
  { name: "Bahati",             road: "Jogoo Road",     fee: 300 },
  { name: "Makongeni",          road: "Jogoo Road",     fee: 300 },
  { name: "Mbotela",            road: "Jogoo Road",     fee: 300 },
  { name: "Hamza",              road: "Jogoo Road",     fee: 300 },
  { name: "Jericho",            road: "Jogoo Road",     fee: 300 },

  // Thika Road
  { name: "Ngara",              road: "Thika Road",     fee: 200 },
  { name: "Desai Road",         road: "Thika Road",     fee: 200 },
  { name: "Pangani",            road: "Thika Road",     fee: 250 },
  { name: "Muthaiga Square",    road: "Thika Road",     fee: 250 },
  { name: "Survey/NYS",         road: "Thika Road",     fee: 300 },
  { name: "Drive In",           road: "Thika Road",     fee: 300 },
  { name: "KSMS",               road: "Thika Road",     fee: 300 },
  { name: "Roasters",           road: "Thika Road",     fee: 300 },
  { name: "Allsops",            road: "Thika Road",     fee: 300 },
  { name: "Mountain Mall",      road: "Thika Road",     fee: 300 },
  { name: "Garden Estate",      road: "Thika Road",     fee: 300 },
  { name: "USIU",               road: "Thika Road",     fee: 300 },
  { name: "Thome",              road: "Thika Road",     fee: 400 },
  { name: "Garden City",        road: "Thika Road",     fee: 300 },
  { name: "EABL",               road: "Thika Road",     fee: 300 },
  { name: "Ngumba",             road: "Thika Road",     fee: 300 },
  { name: "Messo Estate",       road: "Thika Road",     fee: 350 },
  { name: "Safari Park",        road: "Thika Road",     fee: 300 },
  { name: "TRM",                road: "Thika Road",     fee: 300 },
  { name: "Lumumba Drive",      road: "Thika Road",     fee: 300 },
  { name: "Zimmerman",          road: "Thika Road",     fee: 400 },
  { name: "Kahawa Sukari",      road: "Thika Road",     fee: 500 },
  { name: "Kahawa Wendani",     road: "Thika Road",     fee: 500 },
  { name: "Githurai 44/45",     road: "Thika Road",     fee: 500 },
  { name: "ICIPE",              road: "Thika Road",     fee: 400 },
  { name: "Suntown",            road: "Thika Road",     fee: 350 },
  { name: "Hill View Estate",   road: "Thika Road",     fee: 400 },
  { name: "St. Francis",        road: "Thika Road",     fee: 400 },
  { name: "Mwiki",              road: "Thika Road",     fee: 500 },
  { name: "Maji Mazuri",        road: "Thika Road",     fee: 500 },
  { name: "Clay Works",         road: "Thika Road",     fee: 350 },
  { name: "Ruiru Bypass",       road: "Thika Road",     fee: 500 },
  { name: "Kenyatta Road",      road: "Thika Road",     fee: 600 },
  { name: "Juja",               road: "Thika Road",     fee: 600 },
  { name: "JKUAT",              road: "Thika Road",     fee: 600 },
  { name: "Thika Town",         road: "Thika Road",     fee: 800 },

  // Juja Road
  { name: "Kariakor",           road: "Juja Road",      fee: 200 },
  { name: "Pumwani",            road: "Juja Road",      fee: 250 },
  { name: "Eastleigh",          road: "Juja Road",      fee: 250 },
  { name: "Huruma",             road: "Juja Road",      fee: 300 },
  { name: "Mathare",            road: "Juja Road",      fee: 300 },

  // Mombasa Road
  { name: "Nyayo Stadium",      road: "Mombasa Road",   fee: 200 },
  { name: "Bunyala/Lusaka",     road: "Mombasa Road",   fee: 200 },
  { name: "South B/C",          road: "Mombasa Road",   fee: 300 },
  { name: "Nairobi West",       road: "Mombasa Road",   fee: 300 },
  { name: "Capital Center",     road: "Mombasa Road",   fee: 300 },
  { name: "Next Gen Mall",      road: "Mombasa Road",   fee: 300 },
  { name: "Airtel/Panari",      road: "Mombasa Road",   fee: 300 },
  { name: "Olesereni",          road: "Mombasa Road",   fee: 350 },
  { name: "Sameer",             road: "Mombasa Road",   fee: 350 },
  { name: "G.M",                road: "Mombasa Road",   fee: 350 },
  { name: "Imara Daima",        road: "Mombasa Road",   fee: 300 },
  { name: "Cabanas",            road: "Mombasa Road",   fee: 300 },
  { name: "Southfield Mall",    road: "Mombasa Road",   fee: 350 },
  { name: "Airport North Road", road: "Mombasa Road",   fee: 350 },
  { name: "Gateway Mall",       road: "Mombasa Road",   fee: 500 },
  { name: "Mlolongo",           road: "Mombasa Road",   fee: 500 },
  { name: "Syokimau",           road: "Mombasa Road",   fee: 500 },
  { name: "JKIA",               road: "Mombasa Road",   fee: 500 },
  { name: "Kitengela",          road: "Mombasa Road",   fee: 700 },

  // Outerring Road
  { name: "Lucky Summer",       road: "Outerring Road", fee: 300 },
  { name: "Baba Dogo",          road: "Outerring Road", fee: 300 },
  { name: "Kariobangi",         road: "Outerring Road", fee: 300 },
  { name: "Pioneer Estate",     road: "Outerring Road", fee: 300 },
  { name: "Donholm",            road: "Outerring Road", fee: 300 },
  { name: "Buru Buru",          road: "Outerring Road", fee: 300 },
  { name: "Fedha",              road: "Outerring Road", fee: 300 },
  { name: "Tasia",              road: "Outerring Road", fee: 300 },
  { name: "Savannah",           road: "Outerring Road", fee: 350 },
  { name: "Pipeline",           road: "Outerring Road", fee: 350 },
  { name: "Mtindwa",            road: "Outerring Road", fee: 300 },
  { name: "Umoja 1/2",          road: "Outerring Road", fee: 300 },
  { name: "Kamarock",           road: "Outerring Road", fee: 300 },
  { name: "Obama",              road: "Outerring Road", fee: 350 },
  { name: "Baraka",             road: "Outerring Road", fee: 300 },
  { name: "Embakasi",           road: "Outerring Road", fee: 350 },
  { name: "Nyayo Estate",       road: "Outerring Road", fee: 350 },
  { name: "Siaka",              road: "Outerring Road", fee: 350 },
  { name: "Kayole",             road: "Outerring Road", fee: 350 },

  // Industrial Area
  { name: "Kenya Wines",        road: "Industrial Area", fee: 300 },
  { name: "Likoni Road",        road: "Industrial Area", fee: 300 },
  { name: "DT Dobie",          road: "Industrial Area", fee: 300 },
  { name: "G.K Prison",        road: "Industrial Area", fee: 300 },
  { name: "Road A/B/C",        road: "Industrial Area", fee: 300 },
];

// ── Types ─────────────────────────────────────────────────────────────────────

export type DeliveryTier = "pickup" | "errand" | "nairobi" | "countrywide";

export interface DeliverySelection {
  tier: DeliveryTier;
  zoneName?: string | undefined;
  road?: string | undefined;
  fee: number;
  etaLabel: string;
}

interface Props {
  value: DeliverySelection | null;
  onChange: (sel: DeliverySelection) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function KenyaDeliverySelector({ value, onChange }: Props) {
  const [search, setSearch] = useState("");

  const activeTier = value?.tier ?? null;

  function select(tier: DeliveryTier, fee: number, etaLabel: string, zoneName?: string, road?: string) {
    onChange({
      tier, fee, etaLabel,
      ...(zoneName ? { zoneName } : {}),
      ...(road     ? { road }     : {}),
    });
  }

  const filteredZones = search.length >= 2
    ? ALL_ZONES.filter(
        (z) =>
          z.name.toLowerCase().includes(search.toLowerCase()) ||
          z.road.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 20)
    : [];

  const tierBtn = (
    tier: DeliveryTier,
    label: string,
    sub: string,
    feeLabel: string,
    fee: number,
    etaLabel: string
  ) => {
    const active = activeTier === tier;
    return (
      <button
        type="button"
        onClick={() => select(tier, fee, etaLabel)}
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          padding: "13px 16px",
          border: active ? "1.5px solid #1a1510" : "1px solid #e0dbd4",
          background: active ? "#1a1510" : "transparent",
          cursor: "pointer", textAlign: "left", width: "100%",
          transition: "border-color 0.18s, background 0.18s",
        }}
      >
        <span>
          <span style={{ display: "block", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-inter,sans-serif)", color: active ? "#f5f0eb" : "#1a1510", marginBottom: 2 }}>
            {label}
          </span>
          <span style={{ display: "block", fontSize: 11, fontFamily: "var(--font-inter,sans-serif)", color: active ? "#aaa" : "#888" }}>
            {sub}
          </span>
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-inter,sans-serif)", color: active ? "#c9a961" : "#1a1510", flexShrink: 0, marginLeft: 12, marginTop: 1 }}>
          {feeLabel}
        </span>
      </button>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>

      {/* In-Store Pickup */}
      {tierBtn("pickup", "In-Store Pickup", "Shop 35, 4th Floor Wing B, Stanbank House, Moi Ave · Mon–Sat 9am–6pm", "FREE", 0, "During store hours")}

      {/* CBD Errand Person */}
      {tierBtn("errand", "CBD Errand Person", "Within Nairobi CBD — we send someone to you directly", "KES 100", 100, "Within CBD hours")}

      {/* Nairobi delivery search */}
      <div style={{ marginTop: 8 }}>
        <p style={{ fontSize: 9, letterSpacing: "0.42em", textTransform: "uppercase", color: "#9a9080", marginBottom: 8, fontFamily: "var(--font-inter,sans-serif)", fontWeight: 600 }}>
          Nairobi Delivery · via Speedman
        </p>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (activeTier === "nairobi") {
              select("nairobi", 0, "");
            }
          }}
          placeholder="Type your estate or road (e.g. Westlands, Thika Road)"
          style={{
            width: "100%", boxSizing: "border-box",
            border: activeTier === "nairobi" && value?.zoneName ? "1px solid #1a1510" : "1px solid #e0dbd4",
            padding: "10px 12px", fontSize: 12, outline: "none",
            background: "transparent", fontFamily: "var(--font-inter,sans-serif)", color: "#1a1510",
          }}
        />

        {/* Dropdown results */}
        {filteredZones.length > 0 && (
          <div style={{ border: "1px solid #e8e0d4", borderTop: "none", maxHeight: 220, overflowY: "auto", background: "#fff" }}>
            {filteredZones.map((z) => (
              <button
                key={`${z.road}-${z.name}`}
                type="button"
                onClick={() => {
                  setSearch(`${z.name} (${z.road})`);
                  select("nairobi", z.fee, "Same day", z.name, z.road);
                }}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  width: "100%", padding: "9px 12px",
                  background: value?.zoneName === z.name ? "#f8f5f0" : "#fff",
                  border: "none", borderBottom: "1px solid #f0ece4",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <span>
                  <span style={{ display: "block", fontSize: 13, fontFamily: "var(--font-inter,sans-serif)", color: "#1a1510" }}>{z.name}</span>
                  <span style={{ display: "block", fontSize: 10, fontFamily: "var(--font-inter,sans-serif)", color: "#aaa", letterSpacing: "0.1em" }}>{z.road}</span>
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-inter,sans-serif)", color: "#1a1510", flexShrink: 0, marginLeft: 8 }}>
                  KES {z.fee}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Confirmed selection */}
        {activeTier === "nairobi" && value?.zoneName && (
          <p style={{ fontSize: 11, color: "#1abc9c", fontFamily: "var(--font-inter,sans-serif)", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
            <span>✓</span>
            <span>{value.zoneName} ({value.road}) · <strong>KES {value.fee}</strong> · Same day</span>
          </p>
        )}
      </div>
    </div>
  );
}
