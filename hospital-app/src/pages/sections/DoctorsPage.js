import React, { useEffect, useState } from "react";
import { getUsersByRole } from "../../api";
import { PageTitle, Card, Table, StatusBadge } from "../../components/UI";

export default function DoctorsPage({ session }) {
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    getUsersByRole(session.hospitalId, "DOCTOR")
      .then((r) => setDoctors(r.data))
      .catch(() => {});
  }, [session.hospitalId]);

  return (
    <div>
      <PageTitle icon="🩺" title="Doctors" subtitle="All doctors registered in your hospital" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px", marginBottom: "24px" }}>
        {doctors.map((d) => (
          <div key={d.userId} style={{
            background: "#fff", borderRadius: "16px", padding: "24px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
            textAlign: "center",
          }}>
            <div style={{
              width: "64px", height: "64px", borderRadius: "50%",
              background: "#dbeafe", margin: "0 auto 14px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "28px", fontWeight: "bold", color: "#2563eb",
            }}>
              {(d.userName || "D")[0].toUpperCase()}
            </div>
            <h3 style={{ margin: "0 0 4px", fontSize: "16px", color: "#1e293b" }}>{d.userName}</h3>
            <p style={{ color: "#2563eb", fontSize: "13px", fontWeight: 600, margin: "0 0 8px" }}>
              {d.specialization || "General"}
            </p>
            <p style={{ color: "#64748b", fontSize: "12px", margin: "0 0 4px" }}>{d.education || "—"}</p>
            <p style={{ color: "#64748b", fontSize: "12px", margin: "0 0 4px" }}>⏰ {d.timing || "—"}</p>
            <p style={{ color: "#64748b", fontSize: "12px", margin: "0 0 12px" }}>
              {d.fees ? `₹${d.fees} / visit` : "—"}
            </p>
            <StatusBadge status={d.active ? "Active" : "Inactive"} />
          </div>
        ))}
        {doctors.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px", color: "#94a3b8" }}>
            No doctors found. Add doctors via Staff / Users menu.
          </div>
        )}
      </div>

      <Card>
        <h3 style={{ marginBottom: "16px" }}>📋 Doctor List</h3>
        <Table
          columns={["ID", "Name", "Specialization", "Education", "Contact", "Timing", "Fees", "Location", "Status"]}
          rows={doctors.map((d) => [
            d.userId, d.userName,
            d.specialization || "—", d.education || "—",
            d.contact || "—", d.timing || "—",
            d.fees ? `₹${d.fees}` : "—",
            d.location || "—",
            <StatusBadge status={d.active ? "Active" : "Inactive"} />,
          ])}
        />
      </Card>
    </div>
  );
}
