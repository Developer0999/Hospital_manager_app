import React, { useEffect, useState } from "react";
import {
  getAppointmentsByHospital, getAppointmentsByDoctor,
  getCustomersByHospital, getUsersByRole,
} from "../../api";
import { StatCard, PageTitle, Card, Table, StatusBadge, statsGrid } from "../../components/UI";

export default function DashboardHome({ session }) {
  const [appointments, setAppointments] = useState([]);
  const [patients,     setPatients]     = useState([]);
  const [doctors,      setDoctors]      = useState([]);

  useEffect(() => {
    const hid = session.hospitalId;
    if (session.role === "DOCTOR") {
      getAppointmentsByDoctor(session.userId || session.id)
        .then((r) => setAppointments(r.data)).catch(() => {});
    } else {
      getAppointmentsByHospital(hid)
        .then((r) => setAppointments(r.data)).catch(() => {});
    }
    getCustomersByHospital(hid).then((r) => setPatients(r.data)).catch(() => {});
    getUsersByRole(hid, "DOCTOR").then((r) => setDoctors(r.data)).catch(() => {});
  }, [session]);

  const today      = new Date().toISOString().split("T")[0];
  const todayCount = appointments.filter((a) => a.appointmentDate === today).length;
  const completed  = appointments.filter((a) => a.status === "Completed").length;
  const pending    = appointments.filter((a) => a.status === "Pending").length;
  const confirmed  = appointments.filter((a) => a.status === "Confirmed").length;

  const adminStats = [
    { icon: "👨‍⚕️", title: "Total Patients",    value: patients.length,     color: "#0d6efd" },
    { icon: "📅",    title: "Total Appointments", value: appointments.length, color: "#198754" },
    { icon: "🩺",    title: "Doctors",            value: doctors.length,      color: "#fd7e14" },
    { icon: "✅",    title: "Completed Today",    value: completed,           color: "#8b5cf6" },
  ];
  const doctorStats = [
    { icon: "📅", title: "Today's Appointments", value: todayCount,           color: "#0d6efd" },
    { icon: "✅", title: "Completed",             value: completed,            color: "#198754" },
    { icon: "⏳", title: "Pending",               value: pending,              color: "#fd7e14" },
    { icon: "✔️", title: "Confirmed",             value: confirmed,            color: "#8b5cf6" },
  ];
  const receptionStats = [
    { icon: "🚶", title: "Today's Appointments", value: todayCount,           color: "#0d6efd" },
    { icon: "⏳", title: "Pending",               value: pending,              color: "#fd7e14" },
    { icon: "📅", title: "Total Appointments",   value: appointments.length,  color: "#198754" },
    { icon: "🧑‍⚕️", title: "Total Patients",    value: patients.length,      color: "#8b5cf6" },
  ];

  const stats =
    session.role === "DOCTOR"       ? doctorStats :
    session.role === "RECEPTIONIST" ? receptionStats :
    adminStats;

  const recent = [...appointments]
    .sort((a, b) => (b.appointmentId || 0) - (a.appointmentId || 0))
    .slice(0, 8);

  return (
    <div>
      <PageTitle
        icon="📊"
        title="Dashboard"
        subtitle={
          session.role === "DOCTOR"       ? `Welcome Dr. ${session.ownerName}` :
          session.role === "RECEPTIONIST" ? "Reception Desk Overview" :
          `Welcome, ${session.ownerName || session.hospitalName}!`
        }
      />

      <div style={statsGrid}>
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        <Card>
          <h3 style={{ marginBottom: "18px", fontSize: "16px", color: "#1e293b" }}>
            📅 Recent Appointments
          </h3>
          <Table
            columns={["ID", "Patient", "Doctor", "Date", "Time", "Status"]}
            rows={recent.map((a) => [
              a.appointmentId,
              a.patientName  || "—",
              a.doctorName   || "—",
              a.appointmentDate || "—",
              a.timeSlot     || "—",
              <StatusBadge status={a.status} />,
            ])}
            emptyText="No appointments yet."
          />
        </Card>

        <div>
          {session.role === "DOCTOR" && (
            <Card style={{ marginBottom: "20px" }}>
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ fontSize: "56px", marginBottom: "8px" }}>🩺</div>
                <h3 style={{ fontSize: "16px", color: "#1e293b" }}>{session.ownerName}</h3>
                <p style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>
                  {session.specialization || "Doctor"}
                </p>
                <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "6px" }}>
                  {session.email}
                </p>
              </div>
            </Card>
          )}

          <Card>
            <h3 style={{ marginBottom: "16px", fontSize: "16px", color: "#1e293b" }}>
              🔔 Quick Stats
            </h3>
            {[
              { label: "Pending", value: pending,   color: "#fd7e14" },
              { label: "Confirmed", value: confirmed, color: "#0d6efd" },
              { label: "Completed", value: completed, color: "#198754" },
            ].map((item) => (
              <div key={item.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 14px", background: "#f8fafc",
                borderRadius: "10px", marginBottom: "10px",
              }}>
                <span style={{ fontSize: "14px", color: "#475569" }}>{item.label}</span>
                <span style={{
                  background: item.color, color: "#fff",
                  padding: "4px 14px", borderRadius: "20px",
                  fontWeight: 700, fontSize: "13px",
                }}>{item.value}</span>
              </div>
            ))}
            <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "10px" }}>
              <span style={{ fontSize: "14px", color: "#475569" }}>Patients</span>
              <span style={{ float: "right", fontWeight: 700 }}>{patients.length}</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
