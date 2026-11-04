import React, { useEffect, useState } from "react";
import { getAppointmentsByHospital, getCustomersByHospital, getUsersByHospital } from "../../api";
import { PageTitle, Card, statsGrid } from "../../components/UI";

export default function ReportsPage({ session }) {
  const [appts,   setAppts]   = useState([]);
  const [patients,setPatients] = useState([]);
  const [users,   setUsers]   = useState([]);

  useEffect(() => {
    const hid = session.hospitalId;
    getAppointmentsByHospital(hid).then((r) => setAppts(r.data)).catch(() => {});
    getCustomersByHospital(hid).then((r)    => setPatients(r.data)).catch(() => {});
    getUsersByHospital(hid).then((r)        => setUsers(r.data)).catch(() => {});
  }, [session.hospitalId]);

  const totalRevenue = appts.filter((a) => a.status === "Completed")
    .reduce((s, a) => s + (parseFloat(a.fees) || 0), 0);

  // Group appointments by date (last 7)
  const byDate = {};
  appts.forEach((a) => {
    if (!a.appointmentDate) return;
    byDate[a.appointmentDate] = (byDate[a.appointmentDate] || 0) + 1;
  });
  const dateRows = Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7);

  // Group by doctor
  const byDoctor = {};
  appts.forEach((a) => {
    if (!a.doctorName) return;
    if (!byDoctor[a.doctorName]) byDoctor[a.doctorName] = { total: 0, completed: 0, revenue: 0 };
    byDoctor[a.doctorName].total++;
    if (a.status === "Completed") {
      byDoctor[a.doctorName].completed++;
      byDoctor[a.doctorName].revenue += parseFloat(a.fees) || 0;
    }
  });

  const summaryCards = [
    { icon: "💰", label: "Total Revenue",   value: `₹${totalRevenue.toLocaleString("en-IN")}`, color: "#198754" },
    { icon: "📅", label: "Appointments",    value: appts.length,                                color: "#0d6efd" },
    { icon: "🧑‍⚕️",label: "Patients",       value: patients.length,                             color: "#fd7e14" },
    { icon: "🩺", label: "Staff",           value: users.length,                                color: "#8b5cf6" },
  ];

  const cardStyle = {
    background: "#fff", borderRadius: "14px", padding: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
    textAlign: "center", cursor: "pointer",
  };

  return (
    <div>
      <PageTitle icon="📈" title="Reports" subtitle="Hospital analytics and reports" />

      <div style={statsGrid}>
        {summaryCards.map((c, i) => (
          <div key={i} style={{ ...cardStyle, borderTop: `4px solid ${c.color}` }}>
            <div style={{ fontSize: "32px" }}>{c.icon}</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", margin: "8px 0 4px" }}>{c.value}</div>
            <div style={{ color: "#64748b", fontSize: "13px" }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Appointments by date */}
        <Card>
          <h3 style={{ marginBottom: "16px", fontSize: "16px" }}>📅 Appointments by Date (Last 7)</h3>
          {dateRows.length === 0 && <p style={{ color: "#94a3b8" }}>No data yet.</p>}
          {dateRows.map(([date, count]) => (
            <div key={date} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ fontSize: "13px", color: "#475569" }}>{date}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ height: "8px", background: "#2563eb", borderRadius: "4px", width: `${Math.min(count * 20, 160)}px` }} />
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{count}</span>
              </div>
            </div>
          ))}
        </Card>

        {/* Doctor performance */}
        <Card>
          <h3 style={{ marginBottom: "16px", fontSize: "16px" }}>🩺 Doctor Performance</h3>
          {Object.keys(byDoctor).length === 0 && <p style={{ color: "#94a3b8" }}>No data yet.</p>}
          {Object.entries(byDoctor).map(([name, stat]) => (
            <div key={name} style={{
              padding: "12px 14px", background: "#f8fafc",
              borderRadius: "10px", marginBottom: "10px",
            }}>
              <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>{name}</div>
              <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#64748b" }}>
                <span>Total: {stat.total}</span>
                <span>Completed: {stat.completed}</span>
                <span>Revenue: ₹{stat.revenue.toLocaleString("en-IN")}</span>
              </div>
            </div>
          ))}
        </Card>

        {/* Status breakdown */}
        <Card>
          <h3 style={{ marginBottom: "16px", fontSize: "16px" }}>📊 Appointment Status Breakdown</h3>
          {["Pending","Confirmed","Completed","Cancelled"].map((status) => {
            const count = appts.filter((a) => a.status === status).length;
            const pct   = appts.length ? Math.round((count / appts.length) * 100) : 0;
            const colors = { Pending: "#fd7e14", Confirmed: "#0d6efd", Completed: "#198754", Cancelled: "#dc3545" };
            return (
              <div key={status} style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "13px", color: "#475569" }}>{status}</span>
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>{count} ({pct}%)</span>
                </div>
                <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px" }}>
                  <div style={{ height: "8px", background: colors[status], borderRadius: "4px", width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </Card>

        {/* Quick actions */}
        <Card>
          <h3 style={{ marginBottom: "16px", fontSize: "16px" }}>📥 Download Reports</h3>
          {[
            { icon: "💰", title: "Revenue Report",       desc: "Completed appointments revenue" },
            { icon: "📅", title: "Appointments Report",  desc: "All appointments details" },
            { icon: "🧑‍⚕️", title: "Patient Report",     desc: "Registered patients list" },
            { icon: "🩺", title: "Doctor Performance",   desc: "Doctor-wise stats" },
          ].map((r) => (
            <div key={r.title} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 14px", background: "#f8fafc",
              borderRadius: "10px", marginBottom: "10px",
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>{r.icon} {r.title}</div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{r.desc}</div>
              </div>
              <button style={{
                background: "#2563eb", color: "#fff", border: "none",
                padding: "7px 14px", borderRadius: "8px",
                cursor: "pointer", fontSize: "12px",
              }} onClick={() => alert("Export feature — connect to your backend PDF/Excel endpoint.")}>
                Export
              </button>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
