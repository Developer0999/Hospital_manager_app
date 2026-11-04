import React, { useEffect, useState } from "react";
import { getAppointmentsByHospital, updateAppointment } from "../../api";
import { PageTitle, Card, Table, StatusBadge, inputStyle, btnPrimary, btnSuccess, statsGrid } from "../../components/UI";

export default function BillingPage({ session }) {
  const [appts,  setAppts]  = useState([]);
  const [search, setSearch] = useState("");

  const load = () =>
    getAppointmentsByHospital(session.hospitalId)
      .then((r) => setAppts(r.data))
      .catch(() => {});

  useEffect(() => { load(); }, [session.hospitalId]); // eslint-disable-line

  const totalRevenue = appts.reduce((s, a) => s + (parseFloat(a.fees) || 0), 0);
  const collected    = appts.filter((a) => a.status === "Completed")
                            .reduce((s, a) => s + (parseFloat(a.fees) || 0), 0);
  const pending      = totalRevenue - collected;

  const billStatus = (a) => a.status === "Completed" ? "Paid" : a.status === "Cancelled" ? "Cancelled" : "Pending";

  const billBadge = (a) => {
    const s = billStatus(a);
    const colors = { Paid: "#198754", Pending: "#fd7e14", Cancelled: "#dc3545" };
    return (
      <span style={{
        padding: "4px 12px", borderRadius: "20px",
        background: colors[s] || "#6c757d",
        color: "#fff", fontSize: "12px",
      }}>{s}</span>
    );
  };

  const markPaid = async (a) => {
    try {
      await updateAppointment(a.appointmentId, { ...a, status: "Completed" });
      load();
    } catch (e) { alert("Error: " + e.message); }
  };

  const filtered = appts.filter((a) =>
    (a.patientName || "").toLowerCase().includes(search.toLowerCase()) ||
    (a.doctorName  || "").toLowerCase().includes(search.toLowerCase())
  );

  const summaryCards = [
    { label: "Total Revenue",  value: `₹${totalRevenue.toLocaleString("en-IN")}`, color: "#198754" },
    { label: "Collected",      value: `₹${collected.toLocaleString("en-IN")}`,    color: "#0d6efd" },
    { label: "Pending",        value: `₹${pending.toLocaleString("en-IN")}`,      color: "#fd7e14" },
    { label: "Total Bills",    value: appts.length,                                color: "#8b5cf6" },
  ];

  return (
    <div>
      <PageTitle icon="💳" title="Billing" subtitle="Patient billing and payment overview" />

      <div style={statsGrid}>
        {summaryCards.map((c, i) => (
          <div key={i} style={{
            background: "#fff", borderRadius: "14px", padding: "20px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
            textAlign: "center", borderTop: `4px solid ${c.color}`,
          }}>
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>{c.value}</div>
            <div style={{ color: "#64748b", marginTop: "6px", fontSize: "13px" }}>{c.label}</div>
          </div>
        ))}
      </div>

      <Card>
        <div style={{ marginBottom: "18px" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient or doctor…"
            style={{ ...inputStyle, width: "300px" }} />
        </div>

        <Table
          columns={["Appt ID", "Patient", "Doctor", "Date", "Fees", "Appointment Status", "Bill Status", "Action"]}
          rows={filtered.map((a) => [
            a.appointmentId,
            a.patientName || "—",
            a.doctorName  || "—",
            a.appointmentDate || "—",
            a.fees ? `₹${a.fees}` : "—",
            <StatusBadge status={a.status} />,
            billBadge(a),
            <div style={{ display: "flex", gap: "5px" }}>
              {a.status !== "Completed" && a.status !== "Cancelled" && (
                <button style={btnSuccess} onClick={() => markPaid(a)}>Mark Paid</button>
              )}
              <button
                style={{ ...btnPrimary, padding: "6px 10px", fontSize: "12px" }}
                onClick={() => {
                  const text = `Bill Receipt\n-----------\nPatient : ${a.patientName}\nDoctor  : ${a.doctorName}\nDate    : ${a.appointmentDate}\nFees    : ₹${a.fees || 0}\nStatus  : ${billStatus(a)}\n-----------\nHospital Appointment System`;
                  alert(text);
                }}
              >
                Receipt
              </button>
            </div>,
          ])}
        />
      </Card>
    </div>
  );
}
