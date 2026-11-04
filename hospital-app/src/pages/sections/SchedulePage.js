import React, { useEffect, useState } from "react";
import { getAppointmentsByDoctor } from "../../api";
import { PageTitle, Card, Table, StatusBadge } from "../../components/UI";

export default function SchedulePage({ session }) {
  const [appts, setAppts] = useState([]);

  useEffect(() => {
    getAppointmentsByDoctor(session.userId || session.id)
      .then((r) => setAppts(r.data))
      .catch(() => {});
  }, [session]);

  const today = new Date().toISOString().split("T")[0];
  const todayAppts   = appts.filter((a) => a.appointmentDate === today);
  const upcomingAppts = appts.filter((a) => a.appointmentDate > today && a.status !== "Cancelled");

  return (
    <div>
      <PageTitle icon="🗓️" title="My Schedule" subtitle="Your appointments and availability" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
        <Card style={{ margin: 0 }}>
          <div style={{ textAlign: "center", padding: "10px" }}>
            <div style={{ fontSize: "52px" }}>🩺</div>
            <h3 style={{ margin: "10px 0 4px", fontSize: "18px" }}>{session.ownerName}</h3>
            <p style={{ color: "#2563eb", fontWeight: 600, fontSize: "14px" }}>
              {session.specialization || "Doctor"}
            </p>
            <p style={{ color: "#64748b", fontSize: "13px", marginTop: "6px" }}>{session.email}</p>
          </div>
        </Card>

        <Card style={{ margin: 0 }}>
          <h3 style={{ marginBottom: "16px" }}>📊 Quick Stats</h3>
          {[
            { label: "Today's Appointments", value: todayAppts.length, color: "#0d6efd" },
            { label: "Upcoming",             value: upcomingAppts.length, color: "#198754" },
            { label: "Total Appointments",   value: appts.length, color: "#8b5cf6" },
            { label: "Completed",            value: appts.filter((a) => a.status === "Completed").length, color: "#fd7e14" },
          ].map((s) => (
            <div key={s.label} style={{
              display: "flex", justifyContent: "space-between",
              padding: "10px 14px", background: "#f8fafc",
              borderRadius: "10px", marginBottom: "10px",
            }}>
              <span style={{ fontSize: "14px", color: "#475569" }}>{s.label}</span>
              <span style={{
                background: s.color, color: "#fff",
                padding: "3px 12px", borderRadius: "16px",
                fontWeight: 700, fontSize: "13px",
              }}>{s.value}</span>
            </div>
          ))}
        </Card>
      </div>

      <Card>
        <h3 style={{ marginBottom: "16px" }}>📅 Today's Appointments — {today}</h3>
        <Table
          columns={["ID", "Patient", "Time Slot", "Department", "Fees", "Status"]}
          rows={todayAppts.map((a) => [
            a.appointmentId,
            a.patientName || "—",
            a.timeSlot    || "—",
            a.department  || "—",
            a.fees ? `₹${a.fees}` : "—",
            <StatusBadge status={a.status} />,
          ])}
          emptyText="No appointments today."
        />
      </Card>

      <Card>
        <h3 style={{ marginBottom: "16px" }}>📆 Upcoming Appointments</h3>
        <Table
          columns={["ID", "Patient", "Date", "Time Slot", "Fees", "Status"]}
          rows={upcomingAppts.slice(0, 10).map((a) => [
            a.appointmentId,
            a.patientName    || "—",
            a.appointmentDate || "—",
            a.timeSlot       || "—",
            a.fees ? `₹${a.fees}` : "—",
            <StatusBadge status={a.status} />,
          ])}
          emptyText="No upcoming appointments."
        />
      </Card>
    </div>
  );
}
