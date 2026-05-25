export function SaleBand() {
  return (
    <section
      style={{
        background: "#f1e9f5",
        padding: "40px 64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 24,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 28 }}>
        <span
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: 10,
            letterSpacing: ".5em",
            color: "#3d1a4a",
            background: "transparent",
            border: "1px solid #3d1a4a",
            padding: "8px 14px",
            textTransform: "uppercase",
          }}
        >
          PRIVATE PREVIEW
        </span>
        <span
          style={{
            fontFamily: "'Inter','Urbanist',sans-serif",
            fontSize: 22,
            fontWeight: 800,
            color: "#0a0a0a",
            letterSpacing: "-.03em",
          }}
        >
          The Equinox Edit —{" "}
          <span style={{ color: "#3d1a4a" }}>10 days only, by invitation.</span>
        </span>
      </div>
      <button className="es-btn-plum">RESERVE ACCESS →</button>
    </section>
  );
}
