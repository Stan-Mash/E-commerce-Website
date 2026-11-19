"use client";

import { LogOut } from "lucide-react";

export default function LogoutButton() {
  return (
    <form method="POST" action="/api/admin/logout" style={{ margin: 0 }}>
      <button
        type="submit"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          background: "none",
          border: "none",
          padding: "9px 8px",
          borderRadius: 7,
          fontFamily: "var(--font-inter)",
          fontSize: 13,
          color: "#555",
          cursor: "pointer",
          transition: "all 0.12s",
          textAlign: "left",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.color = "#dc2626";
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.07)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.color = "#555";
          (e.currentTarget as HTMLButtonElement).style.background = "none";
        }}
      >
        <LogOut size={16} style={{ flexShrink: 0 }} />
        Sign out
      </button>
    </form>
  );
}
