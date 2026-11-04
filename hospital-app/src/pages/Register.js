import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { saveHospital, updateHospital } from "../api";

const empty = {
  hospitalName: "", gstNo: "", panNo: "", licenseNo: "",
  address: "", city: "", state: "", pincode: "",
  branchName: "", branchCode: "",
  email: "", contactNo: "", alternateContact: "",
  ownerName: "", message: "", website: "", logo: "",
  password: "", confirmPassword: "",
  registrationDate: "", premium: false, active: true, deleted: false,
  role: "HOSPITAL_ADMIN",
};

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm]     = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [step, setStep]     = useState(1);
  const logoInputRef = useRef(null);
  const isEditing = Boolean(location.state?.editingHospital);

  useEffect(() => {
    if (isEditing && location.state?.hospitalData) {
      setForm({ ...empty, ...location.state.hospitalData });
      setStep(1);
    }
  }, [isEditing, location.state]);

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleLogoSelection = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        setError("Unable to read the selected logo file.");
        return;
      }

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSide = 500;
        let width = image.width;
        let height = image.height;

        if (width > height) {
          if (width > maxSide) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          }
        } else if (height > maxSide) {
          width = Math.round((width * maxSide) / height);
          height = maxSide;
        }

        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", 0.7);
        setForm((prev) => ({ ...prev, logo: compressed }));
      };
      image.onerror = () => setError("Unable to read the selected logo file.");
      image.src = result;
    };
    reader.onerror = () => setError("Unable to read the selected logo file.");
    reader.readAsDataURL(file);
  };

  const next = () => { setError(""); setStep(step + 1); };
  const back = () => setStep(step - 1);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.hospitalName || !form.email || (!isEditing && !form.password)) {
      setError("Hospital Name, Email and Password are required."); return;
    }
    if (!isEditing && form.password !== form.confirmPassword) {
      setError("Passwords do not match."); return;
    }
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      if (isEditing) {
        if (!payload.password) {
          delete payload.password;
        }
        if (!location.state?.hospitalData?.logo && !payload.logo) {
          delete payload.logo;
        }
        const hospitalId = payload.hospitalId || location.state?.hospitalData?.hospitalId;
        if (!hospitalId) {
          throw new Error("Hospital ID is missing for update.");
        }
        await updateHospital(hospitalId, payload);
        const session = JSON.parse(localStorage.getItem("hospital") || "{}");
        const updatedHospitalInfo = {
          ...(session?.hospitalInfo || {}),
          ...payload,
          hospitalId,
          hospitalName: payload.hospitalName,
          email: payload.email,
          contactNo: payload.contactNo,
          address: payload.address,
          city: payload.city,
          state: payload.state,
          pincode: payload.pincode,
          ownerName: payload.ownerName,
          website: payload.website,
          logo: payload.logo || session?.logo || session?.hospitalInfo?.logo || "",
          message: payload.message,
          role: payload.role || session?.role || "HOSPITAL_ADMIN",
          premium: payload.premium ?? session?.premium ?? false,
          active: payload.active ?? session?.active ?? true,
          deleted: payload.deleted ?? session?.deleted ?? false,
        };
        const updatedSession = {
          ...session,
          ...payload,
          hospitalId,
          hospitalName: payload.hospitalName,
          email: payload.email,
          contactNo: payload.contactNo,
          address: payload.address,
          city: payload.city,
          state: payload.state,
          pincode: payload.pincode,
          ownerName: payload.ownerName,
          website: payload.website,
          logo: updatedHospitalInfo.logo,
          message: payload.message,
          hospitalInfo: updatedHospitalInfo,
        };
        localStorage.setItem("hospital", JSON.stringify(updatedSession));
        localStorage.setItem("session", JSON.stringify(updatedSession));
        alert("Hospital details updated successfully.");
        window.location.href = "/admin";
      } else {
        await saveHospital(payload);
        alert("Hospital registered successfully! Please login.");
        navigate("/");
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Operation failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const inp = (name, label, type = "text", placeholder = "") => (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      <input
        name={name} type={type} value={form[name]}
        onChange={handle} placeholder={placeholder}
        style={s.input}
      />
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Header */}
        <div style={s.header}>
          <span style={{ fontSize: "28px" }}>🏥</span>
          <div>
            <h2 style={{ margin: 0, fontSize: "22px" }}>{isEditing ? "Edit Hospital Details" : "Hospital Registration"}</h2>
            <p style={{ margin: 0, fontSize: "13px", opacity: 0.8 }}>{isEditing ? "Update your hospital profile" : `Step ${step} of 3`}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div style={s.progressWrap}>
          {[1,2,3].map((n) => (
            <React.Fragment key={n}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                background: step >= n ? "#2563eb" : "#e2e8f0",
                color: step >= n ? "#fff" : "#94a3b8",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: "bold", fontSize: "14px",
              }}>{n}</div>
              {n < 3 && <div style={{ flex: 1, height: "3px", background: step > n ? "#2563eb" : "#e2e8f0" }} />}
            </React.Fragment>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px", fontSize: "12px", color: "#64748b" }}>
          <span>Hospital Info</span><span>Contact Details</span><span>Account Setup</span>
        </div>

        {error && <div style={s.error}>{error}</div>}

        {/* STEP 1 — Hospital Info */}
        {step === 1 && (
          <div>
            <div style={s.grid2}>
              {inp("hospitalName", "Hospital Name *", "text", "City Hospital")}
              {inp("ownerName", "Owner Name", "text", "Dr. John Doe")}
              {inp("gstNo", "GST Number", "text", "27AAABB1234Z1Z5")}
              {inp("panNo", "PAN Number", "text", "AAABB1234Z")}
              {inp("licenseNo", "License Number", "text", "MH/2024/001")}
              {inp("branchName", "Branch Name", "text", "Main Branch")}
              {inp("branchCode", "Branch Code", "text", "BR001")}
              {inp("registrationDate", "Registration Date", "date")}
            </div>
            <div style={s.field}>
              <label style={s.label}>Address</label>
              <textarea name="address" value={form.address} onChange={handle}
                rows="2" placeholder="Full Hospital Address"
                style={{ ...s.input, resize: "vertical" }} />
            </div>
            <div style={s.grid3}>
              {inp("city", "City", "text", "Mumbai")}
              {inp("state", "State", "text", "Maharashtra")}
              {inp("pincode", "Pincode", "text", "400001")}
            </div>
          </div>
        )}

        {/* STEP 2 — Contact */}
        {step === 2 && (
          <div>
            <div style={s.grid2}>
              {inp("email", "Email *", "email", "hospital@example.com")}
              {inp("contactNo", "Contact Number", "text", "9876543210")}
              {inp("alternateContact", "Alternate Contact", "text", "9876543211")}
              {inp("website", "Website URL", "text", "https://hospital.com")}
            </div>
            <div style={s.field}>
              <label style={s.label}>Hospital Logo</label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoSelection}
                style={{ ...s.input, padding: "8px" }}
              />
              <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  style={{ ...s.btn, background: "#0f766e", padding: "8px 12px", flex: "0 0 auto" }}
                >
                  Browse File
                </button>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  {form.logo ? "Logo selected and ready to save." : "Choose an image from your device."}
                </span>
              </div>
              {form.logo && (
                <div style={{ marginTop: "10px", display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "90px", border: "1px dashed #cbd5e1", borderRadius: "10px", padding: "10px" }}>
                  <img src={form.logo} alt="Hospital logo preview" style={{ maxWidth: "140px", maxHeight: "90px", objectFit: "contain" }} />
                </div>
              )}
            </div>
            <div style={s.field}>
              <label style={s.label}>Hospital Message / Tagline</label>
              <textarea name="message" value={form.message} onChange={handle}
                rows="3" placeholder="Serving health with care..."
                style={{ ...s.input, resize: "vertical" }} />
            </div>
          </div>
        )}

        {/* STEP 3 — Account */}
        {step === 3 && (
          <div>
            <div style={s.grid2}>
              {inp("password", "Password *", "password", "Enter password")}
              {inp("confirmPassword", "Confirm Password *", "password", "Re-enter password")}
            </div>
            <div style={{ display: "flex", gap: "24px", marginTop: "12px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <input type="checkbox" name="premium" checked={form.premium} onChange={handle} />
                Premium Account
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <input type="checkbox" name="active" checked={form.active} onChange={handle} />
                Active
              </label>
            </div>
            <div style={{ marginTop: "20px", padding: "14px", background: "#f0fdf4", borderRadius: "10px" }}>
              <p style={{ fontSize: "13px", color: "#166534", fontWeight: 600, marginBottom: "6px" }}>Summary</p>
              <p style={{ fontSize: "13px", color: "#166534" }}>🏥 {form.hospitalName}</p>
              <p style={{ fontSize: "13px", color: "#166534" }}>📧 {form.email}</p>
              <p style={{ fontSize: "13px", color: "#166534" }}>📍 {form.city}, {form.state}</p>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ display: "flex", gap: "12px", marginTop: "28px" }}>
          {step > 1 && (
            <button onClick={back} style={{ ...s.btn, background: "#64748b", flex: "0 0 120px" }}>
              ← Back
            </button>
          )}
          {step < 3 && (
            <button onClick={next} style={{ ...s.btn, flex: 1 }}>
              Next →
            </button>
          )}
          {step === 3 && (
            <button onClick={submit} style={{ ...s.btn, background: "#059669", flex: 1 }} disabled={loading}>
              {loading ? (isEditing ? "Updating…" : "Registering…") : (isEditing ? "✓ Update Hospital" : "✓ Register Hospital")}
            </button>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          {isEditing ? (
            <button onClick={() => navigate("/admin")} style={{ color: "#2563eb", fontSize: "14px", textDecoration: "none", background: "none", border: "none", cursor: "pointer" }}>
              ← Back to Dashboard
            </button>
          ) : (
            <Link to="/" style={{ color: "#2563eb", fontSize: "14px", textDecoration: "none" }}>
              ← Back to Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh", background: "#f1f5f9",
    display: "flex", alignItems: "flex-start",
    justifyContent: "center", padding: "30px 20px",
  },
  card: {
    background: "#fff", borderRadius: "20px",
    padding: "36px", width: "100%", maxWidth: "820px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
  },
  header: {
    display: "flex", alignItems: "center", gap: "14px",
    marginBottom: "28px", padding: "18px",
    background: "linear-gradient(135deg,#1d4ed8 0%,#1e40af 100%)",
    borderRadius: "12px", color: "#fff",
  },
  progressWrap: {
    display: "flex", alignItems: "center", marginBottom: "8px",
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" },
  field: { marginBottom: "16px" },
  label: { display: "block", fontWeight: 600, color: "#334155", fontSize: "13px", marginBottom: "6px" },
  input: {
    width: "100%", padding: "11px 13px", borderRadius: "9px",
    border: "1px solid #cbd5e1", outline: "none",
    fontSize: "14px", boxSizing: "border-box",
  },
  btn: {
    padding: "13px", borderRadius: "10px",
    background: "#2563eb", color: "#fff", border: "none",
    cursor: "pointer", fontWeight: 700, fontSize: "15px",
  },
  error: {
    background: "#fef2f2", border: "1px solid #fca5a5",
    color: "#dc2626", padding: "12px 14px",
    borderRadius: "10px", fontSize: "13px", marginBottom: "18px",
  },
};
