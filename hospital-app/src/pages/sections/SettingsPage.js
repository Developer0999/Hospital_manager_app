import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageTitle, Card } from "../../components/UI";

export default function SettingsPage({ session }) {
  const navigate = useNavigate();

  const editHospital = () => {
    const hospitalInfo = session?.hospitalInfo || {};
    const hospitalData = {
      ...session,
      ...hospitalInfo,
      hospitalId: session?.hospitalId || hospitalInfo?.hospitalId || "",
      hospitalName: session?.hospitalName || hospitalInfo?.hospitalName || session?.name || "",
      address: session?.address || hospitalInfo?.address || "",
      city: session?.city || hospitalInfo?.city || "",
      state: session?.state || hospitalInfo?.state || "",
      pincode: session?.pincode || hospitalInfo?.pincode || "",
      email: session?.email || hospitalInfo?.email || "",
      contactNo: session?.contactNo || hospitalInfo?.contactNo || "",
      ownerName: session?.ownerName || hospitalInfo?.ownerName || "",
      message: session?.message || hospitalInfo?.message || "",
      website: session?.website || hospitalInfo?.website || "",
      logo: session?.logo || hospitalInfo?.logo || "",
      role: session?.role || hospitalInfo?.role || "HOSPITAL_ADMIN",
      registrationDate: session?.registrationDate || hospitalInfo?.registrationDate || "",
      premium: !!(session?.premium ?? hospitalInfo?.premium),
      active: session?.active !== false && hospitalInfo?.active !== false,
      deleted: !!(session?.deleted ?? hospitalInfo?.deleted),
    };
    navigate("/register", { state: { editingHospital: true, hospitalData } });
  };

  const hospitalSummary = useMemo(() => [
    ["Hospital Name", session.hospitalName],
    ["Email", session.email],
    ["Contact", session.contactNo],
    ["Role", session.role],
    ["Hospital ID", session.hospitalId],
  ], [session]);

  return (
    <div>
      <PageTitle icon="⚙️" title="Settings" subtitle="Account and system information" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h3 style={{ margin: 0 }}>🏥 Hospital Account</h3>
            <button onClick={editHospital} style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontWeight: 600 }}>
              Edit
            </button>
          </div>
          {hospitalSummary.map(([label, val]) => (
            <div key={label} style={{ marginBottom: "14px", paddingBottom: "14px", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "3px" }}>{label}</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{val || "—"}</div>
            </div>
          ))}
        </Card>

        <Card>
          <h3 style={{ marginBottom: "18px" }}>👤 Logged-in User</h3>
          {[
            ["Name",  session.ownerName],
            ["Email", session.email],
            ["Role",  session.role],
          ].map(([label, val]) => (
            <div key={label} style={{ marginBottom: "14px", paddingBottom: "14px", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "3px" }}>{label}</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{val || "—"}</div>
            </div>
          ))}
          <div style={{ marginTop: "20px", padding: "14px", background: "#f0fdf4", borderRadius: "10px" }}>
            <p style={{ fontSize: "13px", color: "#166534" }}>
              ✅ You are currently logged in as <b>{session.role}</b>.
            </p>
          </div>
        </Card>

        <Card>
          <h3 style={{ marginBottom: "18px" }}>🔔 API Endpoints (Reference)</h3>
          {[
            ["/api/auth/login",         "POST — Login"],
            ["/api/hospital",           "GET/POST — Hospitals"],
            ["/api/users",              "GET/POST — Staff Users"],
            ["/api/customers",          "GET/POST — Patients"],
            ["/api/appointments",       "GET/POST — Appointments"],
          ].map(([url, label]) => (
            <div key={url} style={{ marginBottom: "10px" }}>
              <div style={{ fontSize: "12px", color: "#2563eb", fontFamily: "monospace" }}>{url}</div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>{label}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
