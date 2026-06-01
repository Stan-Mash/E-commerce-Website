"use client";

export default function LogoutButton() {
  return (
    <form method="POST" action="/api/admin/logout" style={{ margin: 0 }}>
      <button
        type="submit"
        className="admin-logout-link"
        style={{
          background: "none",
          border: "none",
          padding: 0,
          fontFamily: "var(--font-inter)",
          fontSize: 11,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "#555555",
          cursor: "pointer",
          transition: "color 0.15s",
        }}
      >
        Logout
      </button>
    </form>
  );
}
