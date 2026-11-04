import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getHospitalById, loginUser } from "../api";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) { setError("Email and Password are required."); return; }
    setLoading(true);
    try {
      const res = await loginUser(form);
      const data = res.data;

      if (!data.role) data.role = "HOSPITAL_ADMIN";

      const hospitalRes = await getHospitalById(data.hospitalId);
      const sessionData = {
        ...data,
        hospitalInfo: hospitalRes.data,
      };

      localStorage.setItem("hospital", JSON.stringify(sessionData));
      localStorage.setItem("session", JSON.stringify(sessionData));
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Left panel */}
      <div style={styles.left}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "72px", marginBottom: "16px" }}>🏥</div>
          <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "12px" }}>
            Hospital Appointment System
          </h1>
          <p style={{ opacity: 0.85, fontSize: "16px", lineHeight: 1.6, maxWidth: "380px" }}>
            Manage appointments, patients, doctors and billing — all in one place.
          </p>
          <div style={{ marginTop: "40px", display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}>
            {["Appointments", "Patients", "Doctors", "Billing", "Reports"].map((t) => (
              <span key={t} style={styles.chip}>✓ {t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={styles.right}>
        <div style={styles.card}>
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div style={{ fontSize: "40px" }}>🔐</div>
            <h2 style={{ fontSize: "24px", color: "#1e293b", margin: "10px 0 4px" }}>Welcome Back</h2>
            <p style={{ color: "#64748b", fontSize: "14px" }}>Login to your hospital account</p>
          </div>

          {error && (
            <div style={styles.errorBox}>{error}</div>
          )}

          <form onSubmit={submit}>
            <div style={styles.fieldWrap}>
              <label style={styles.label}>Email Address</label>
              <input
                name="email" type="email" value={form.email}
                onChange={handle} style={styles.input}
                placeholder="hospital@example.com"
              />
            </div>
            <div style={styles.fieldWrap}>
              <label style={styles.label}>Password</label>
              <input
                name="password" type="password" value={form.password}
                onChange={handle} style={styles.input}
                placeholder="Enter password"
              />
            </div>

            <button type="submit" style={styles.btn} disabled={loading}>
              {loading ? "Logging in…" : "Login →"}
            </button>
          </form>

          <hr style={{ margin: "24px 0", borderColor: "#e2e8f0" }} />

          <Link to="/register" style={{ textDecoration: "none" }}>
            <button style={{ ...styles.btn, background: "#059669" }}>
              🏥 Register New Hospital
            </button>
          </Link>

          <div style={{ marginTop: "20px", padding: "14px", background: "#f8fafc", borderRadius: "10px" }}>
            <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px", fontWeight: 600 }}>
              Demo Credentials
            </p>
            <p style={{ fontSize: "12px", color: "#94a3b8" }}>Admin: Anandi@gmail.com / Admin123</p>
            <p style={{ fontSize: "12px", color: "#94a3b8" }}>Doctor: tushar@gmail.com / tushar123</p>
            <p style={{ fontSize: "12px", color: "#94a3b8" }}>Reception: Ashwini@gmail.com / Ashwni123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh", display: "flex",
    background: "#f1f5f9",
  },
  left: {
    flex: 1, background: "linear-gradient(135deg,#1d4ed8 0%,#1e40af 100%)",
    color: "#fff", display: "flex", alignItems: "center",
    justifyContent: "center", padding: "40px",
  },
  chip: {
    background: "rgba(255,255,255,0.15)", padding: "6px 14px",
    borderRadius: "20px", fontSize: "13px",
  },
  right: {
    width: "480px", display: "flex", alignItems: "center",
    justifyContent: "center", padding: "40px 30px",
  },
  card: {
    background: "#fff", borderRadius: "20px",
    padding: "36px 32px", width: "100%",
    boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
  },
  fieldWrap: { marginBottom: "18px" },
  label: { display: "block", fontWeight: 600, color: "#334155", fontSize: "13px", marginBottom: "6px" },
  input: {
    width: "100%", padding: "12px 14px", borderRadius: "10px",
    border: "1px solid #cbd5e1", outline: "none",
    fontSize: "14px", boxSizing: "border-box",
    transition: "border 0.2s",
  },
  btn: {
    width: "100%", padding: "13px", borderRadius: "10px",
    background: "#2563eb", color: "#fff", border: "none",
    cursor: "pointer", fontWeight: 700, fontSize: "15px",
  },
  errorBox: {
    background: "#fef2f2", border: "1px solid #fca5a5",
    color: "#dc2626", padding: "12px 14px", borderRadius: "10px",
    fontSize: "13px", marginBottom: "16px",
  },
};
