import React from "react";

/* ── STATUS BADGE ──────────────────────────────────── */
export const StatusBadge = ({ status }) => {
  const map = {
    Confirmed: "#198754", Completed: "#0d6efd",
    Pending: "#fd7e14",   Cancelled: "#dc3545",
    Active: "#198754",    Inactive: "#6c757d",
    "On Leave": "#fd7e14",
  };
  return (
    <span style={{
      padding: "4px 12px", borderRadius: "20px",
      background: map[status] || "#6c757d",
      color: "#fff", fontSize: "12px", fontWeight: 500,
    }}>
      {status}
    </span>
  );
};

/* ── STAT CARD ─────────────────────────────────────── */
export const StatCard = ({ icon, title, value, color }) => (
  <div style={{
    background: "#fff", borderRadius: "16px", padding: "22px 24px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
    display: "flex", alignItems: "center", gap: "18px",
    borderLeft: `5px solid ${color}`,
  }}>
    <div style={{ fontSize: "36px" }}>{icon}</div>
    <div>
      <div style={{ fontSize: "26px", fontWeight: "bold", color: "#0f172a" }}>{value}</div>
      <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>{title}</div>
    </div>
  </div>
);

/* ── PAGE TITLE ────────────────────────────────────── */
export const PageTitle = ({ icon, title, subtitle }) => {
  const isSmallScreen = typeof window !== "undefined" && window.innerWidth < 640;
  return (
    <div style={{ marginBottom: "24px" }}>
      <h1 style={{ margin: 0, fontSize: isSmallScreen ? "22px" : "28px", color: "#1e293b" }}>{icon} {title}</h1>
      {subtitle && <p style={{ color: "#64748b", marginTop: "6px", fontSize: isSmallScreen ? "12px" : "14px" }}>{subtitle}</p>}
    </div>
  );
};

/* ── CARD ──────────────────────────────────────────── */
export const Card = ({ children, style }) => (
  <div style={{
    background: "#fff", borderRadius: "16px", padding: "24px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.07)", marginBottom: "20px",
    ...style,
  }}>
    {children}
  </div>
);

/* ── TABLE ─────────────────────────────────────────── */
export const Table = ({ columns, rows, emptyText = "No records found." }) => {
  const isSmallScreen = typeof window !== "undefined" && window.innerWidth < 768;
  return (
    <div style={{ overflowX: "auto", borderRadius: "12px", background: "#fff" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
        <thead>
          <tr style={{ background: "#f1f5f9" }}>
            {columns.map((c) => (
              <th key={c} style={{
                padding: isSmallScreen ? "10px 8px" : "12px 14px", textAlign: "left",
                borderBottom: "1px solid #e2e8f0",
                fontSize: isSmallScreen ? "11px" : "13px", color: "#475569", fontWeight: 600,
              }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} style={{
              padding: "30px", textAlign: "center", color: "#94a3b8", fontSize: "14px",
            }}>{emptyText}</td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
              {row.map((cell, j) => (
                <td key={j} style={{
                  padding: isSmallScreen ? "10px 8px" : "12px 14px",
                  borderBottom: "1px solid #f1f5f9",
                  fontSize: isSmallScreen ? "12px" : "14px", color: "#1e293b",
                }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ── MODAL ─────────────────────────────────────────── */
export const Modal = ({ open, onClose, title, children, width = "680px" }) => {
  if (!open) return null;
  const isSmallScreen = typeof window !== "undefined" && window.innerWidth < 640;
  const modalWidth = isSmallScreen ? "95vw" : width;
  const modalPadding = isSmallScreen ? "16px" : "24px";
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9000, padding: "16px",
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: "16px",
        width: "100%", maxWidth: modalWidth,
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: `12px ${modalPadding}`, borderBottom: "1px solid #e2e8f0",
          background: "#f8fafc", borderRadius: "16px 16px 0 0",
        }}>
          <h3 style={{ margin: 0, fontSize: isSmallScreen ? "16px" : "18px", color: "#1e293b" }}>{title}</h3>
          <span onClick={onClose} style={{
            cursor: "pointer", fontSize: "20px", color: "#64748b",
            width: "32px", height: "32px", display: "flex",
            alignItems: "center", justifyContent: "center",
            borderRadius: "50%", background: "#e2e8f0",
          }}>✕</span>
        </div>
        <div style={{ padding: modalPadding }}>{children}</div>
      </div>
    </div>
  );
};

/* ── FORM FIELD ────────────────────────────────────── */
export const Field = ({ label, required, children }) => (
  <div style={{ marginBottom: "14px" }}>
    <label style={{
      display: "block", marginBottom: "6px",
      fontWeight: 600, color: "#334155", fontSize: "13px",
    }}>
      {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
    </label>
    {children}
  </div>
);

/* ── INPUT STYLES (export as an object for reuse) ─── */
export const inputStyle = {
  width: "100%", padding: "10px 12px",
  borderRadius: "9px", border: "1px solid #cbd5e1",
  outline: "none", fontSize: "14px",
  boxSizing: "border-box", background: "#fff",
  minHeight: "40px",
};

export const btnPrimary = {
  background: "#2563eb", color: "#fff", border: "none",
  padding: "10px 22px", borderRadius: "10px",
  cursor: "pointer", fontWeight: 600, fontSize: "14px",
  minHeight: "40px", display: "flex", alignItems: "center", justifyContent: "center",
  whiteSpace: "nowrap",
};

export const btnWarning = {
  background: "#fbbf24", border: "none", padding: "6px 12px",
  borderRadius: "7px", cursor: "pointer", fontSize: "12px", fontWeight: 500,
  minHeight: "32px", display: "flex", alignItems: "center", justifyContent: "center",
};

export const btnDanger = {
  background: "#ef4444", color: "#fff", border: "none",
  padding: "6px 12px", borderRadius: "7px",
  cursor: "pointer", fontSize: "12px", fontWeight: 500,
  minHeight: "32px", display: "flex", alignItems: "center", justifyContent: "center",
};

export const btnSuccess = {
  background: "#22c55e", color: "#fff", border: "none",
  padding: "6px 12px", borderRadius: "7px",
  cursor: "pointer", fontSize: "12px", fontWeight: 500,
  minHeight: "32px", display: "flex", alignItems: "center", justifyContent: "center",
};

export const btnInfo = {
  background: "#0d6efd", color: "#fff", border: "none",
  padding: "6px 12px", borderRadius: "7px",
  cursor: "pointer", fontSize: "12px", fontWeight: 500,
  minHeight: "36px", display: "flex", alignItems: "center", justifyContent: "center",
};

export const responsiveBtnGroup = {
  display: "flex", gap: "6px", flexWrap: "wrap",
  '@media (max-width: 640px)': {
    gap: "4px",
  },
};

/* ── STATS GRID STYLE ──────────────────────────────── */
export const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "12px", marginBottom: "24px",
};

export const pageContentStyle = {
  padding: "16px",
  '@media (min-width: 768px)': {
    padding: "28px",
  },
};
