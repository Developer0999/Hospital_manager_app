

import React from "react";

/* ── ROLE CONFIG ───────────────────────────────────── */
export const ROLE_CONFIG = {
  HOSPITAL_ADMIN: {
    sidebarTitle: "Admin Panel",
    badgeLabel:   "Admin",
    badgeColor:   "#0d6efd",
    menu: [
      { key: "dashboard",    icon: "📊", label: "Dashboard"     },
      { key: "appointments", icon: "📅", label: "Appointments"  },
      { key: "patients",     icon: "🧑‍⚕️", label: "Patients"     },
      { key: "users",        icon: "👥", label: "Staff / Users" },
      { key: "doctors",      icon: "🩺", label: "Doctors"       },
      { key: "medicine",     icon: "💊", label: "Medicine"      },
      // { key: "prescription", icon: "🧾", label: "Prescriptions" },
       { key: "prescriptionContain", icon: "🧾", label: "prescriptionContain" },
      { key: "billing",      icon: "💳", label: "Billing"       },
      { key: "reports",      icon: "📈", label: "Reports"       },
      { key: "settings",     icon: "⚙️", label: "Settings"      },
    ],
  },
  DOCTOR: {
    sidebarTitle: "Doctor Panel",
    badgeLabel:   "Doctor",
    badgeColor:   "#198754",
    menu: [
      { key: "dashboard",    icon: "📊", label: "My Dashboard"    },
      { key: "appointments", icon: "📅", label: "My Appointments" },
      { key: "patients",     icon: "🧑‍⚕️", label: "My Patients"    },
      { key: "schedule",     icon: "🗓️", label: "My Schedule"     },
      { key: "medicine",     icon: "💊", label: "Medicine"        },
      // { key: "prescription", icon: "🧾", label: "Prescriptions"   },
          { key: "prescriptionContain", icon: "🧾", label: "prescriptionContain" },
    ],
  },
  RECEPTIONIST: {
    sidebarTitle: "Reception",
    badgeLabel:   "Receptionist",
    badgeColor:   "#fd7e14",
    menu: [
      { key: "dashboard",    icon: "📊", label: "Dashboard"        },
      { key: "appointments", icon: "📅", label: "Book Appointment" },
      { key: "patients",     icon: "🧑‍⚕️", label: "Register Patient" },
      { key: "search",       icon: "🔍", label: "Patient Search"   },
    ],
  },
};

/* ── HEADER ────────────────────────────────────────── */
export function Header({ session, sidebarOpen, onToggleSidebar }) {
  const cfg = ROLE_CONFIG[session?.role] || ROLE_CONFIG.HOSPITAL_ADMIN;
  const isSmallScreen = typeof window !== "undefined" && window.innerWidth < 768;
  return (
    <div style={{
      height: "65px", background: "linear-gradient(135deg,#1d4ed8 0%,#1e40af 100%)",
      color: "#fff", display: "flex", justifyContent: "space-between",
      alignItems: "center", padding: isSmallScreen ? "0 12px" : "0 20px",
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
      boxShadow: "0 2px 16px rgba(0,0,0,0.18)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <button onClick={onToggleSidebar}
          style={{
            width: "38px", height: "38px", borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.12)",
            color: "#fff", fontSize: "18px", cursor: "pointer", marginRight: "8px",
          }}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? "×" : "☰"}
        </button>
        <span style={{ fontSize: "28px" }}>🏥</span>
        <div>
          <div style={{ fontWeight: "bold", fontSize: "17px", letterSpacing: "0.3px" }}>
            {session?.hospitalName || "Hospital"}
          </div>
          <div style={{ fontSize: "12px", opacity: 0.75 }}>{session?.email}</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
        <span style={{ fontSize: "13px", opacity: 0.85 }}>📞 {session?.contactNo}</span>
        <span style={{
          background: cfg.badgeColor,
          padding: "5px 16px", borderRadius: "20px",
          fontSize: "12px", fontWeight: "bold", letterSpacing: "0.5px",
        }}>
          {cfg.badgeLabel}
        </span>
        <div style={{
          width: "36px", height: "36px", borderRadius: "50%",
          background: "rgba(255,255,255,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: "bold", fontSize: "15px",
        }}>
          {(session?.ownerName || "U")[0].toUpperCase()}
        </div>
      </div>
    </div>
  );
}

/* ── SIDEBAR ───────────────────────────────────────── */
export function Sidebar({ session, activePage, onNavigate, onLogout, sidebarOpen = true, isMobile = false }) {
  const cfg = ROLE_CONFIG[session?.role] || ROLE_CONFIG.HOSPITAL_ADMIN;
  return (
    <div style={{
      width: sidebarOpen ? "245px" : "0px",
      background: "#0f172a", color: "#fff",
      minHeight: "calc(100vh - 119px)", padding: sidebarOpen ? "20px 14px" : "0px",
      position: isMobile ? "fixed" : "fixed",
      top: "65px", bottom: "54px", left: 0,
      overflowY: "auto",
      transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
      transition: "transform 0.2s ease, width 0.2s ease, padding 0.2s ease",
      zIndex: 1100,
      visibility: sidebarOpen ? "visible" : "hidden",
    }}>
      {/* Profile */}
      <div style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "14px", background: "rgba(255,255,255,0.06)",
        borderRadius: "12px", marginBottom: "22px",
      }}>
        <div style={{
          width: "42px", height: "42px", borderRadius: "50%",
          background: cfg.badgeColor,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: "bold", fontSize: "17px", flexShrink: 0,
        }}>
          {(session?.ownerName || "U")[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: "bold", fontSize: "14px", color: "#f1f5f9" }}>
            {session?.ownerName || "User"}
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
            {cfg.sidebarTitle}
          </div>
        </div>
      </div>

      {/* Menu label */}
      {sidebarOpen && (
        <div style={{
          fontSize: "10px", color: "#475569", letterSpacing: "0.1em",
          textTransform: "uppercase", padding: "0 8px", marginBottom: "8px",
        }}>
          Navigation
        </div>
      )}

      {/* Menu items */}
      {cfg.menu.map((item) => {
        const active = activePage === item.key;
        return (
          <div
            key={item.key}
            onClick={() => onNavigate(item.key)}
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "11px 12px", borderRadius: "10px",
              cursor: "pointer", fontSize: "14px",
              marginBottom: "3px", transition: "all 0.15s",
              background: active ? "rgba(59,130,246,0.22)" : "transparent",
              color: active ? "#93c5fd" : "#94a3b8",
              borderLeft: active ? "3px solid #3b82f6" : "3px solid transparent",
              fontWeight: active ? 600 : 400,
            }}
          >
            <span style={{ fontSize: "17px", width: "22px", textAlign: "center" }}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        );
      })}

      {/* Logout */}
      <div
        onClick={onLogout}
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "11px 14px", borderRadius: "10px",
          background: "rgba(220,38,38,0.15)", color: "#fca5a5",
          cursor: "pointer", marginTop: "20px", fontSize: "14px",
          border: "1px solid rgba(220,38,38,0.3)",
        }}
      >
        🚪 <span>Logout</span>
      </div>
    </div>
  );
}

/* ── FOOTER ────────────────────────────────────────── */
export function Footer() {
  return (
    <div style={{
      height: "54px", background: "linear-gradient(135deg,#1d4ed8 0%,#1e40af 100%)",
      color: "#fff", display: "flex", alignItems: "center",
      justifyContent: "center", position: "fixed",
      bottom: 0, left: 0, right: 0, fontSize: "13px", fontWeight: 500,
      letterSpacing: "0.3px", zIndex: 900,
    }}>
      © 2026 Hospital Appointment System — All rights reserved
    </div>
  );
}
