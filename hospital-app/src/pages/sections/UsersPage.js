import React, { useEffect, useState } from "react";
import { getUsersByHospital, saveUser, updateUser, deleteUser } from "../../api";
import {
  PageTitle, Card, Table, Modal, Field, StatusBadge,
  inputStyle, btnPrimary, btnWarning, btnDanger, statsGrid,
} from "../../components/UI";

const emptyForm = (hid) => ({
  userId: "", hospitalId: hid,
  userName: "", userCode: "",
  email: "", password: "", contact: "", contact2: "",
  role: "DOCTOR", address: "",
  specialization: "", education: "", location: "",
  timing: "", timingStart: "", timingEnd: "",
  fees: "", licenseNo: "",
  active: true,
});

const timeOptions = [
  "06:00 AM", "06:30 AM", "07:00 AM", "07:30 AM",
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM",
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM",
  "08:00 PM", "08:30 PM", "09:00 PM", "09:30 PM",
  "10:00 PM",
];

const parseTiming = (timing = "") => {
  const [start = "", end = ""] = timing.split(/\s*[-–]\s*/);
  return { timingStart: start, timingEnd: end };
};

const buildTiming = (start, end) => (start && end ? `${start} - ${end}` : "");

const normalizeForm = (data, hid) => {
  const timingParts = parseTiming(data.timing);
  return {
    ...emptyForm(hid),
    ...data,
    ...timingParts,
    hospitalId: data.hospitalId || hid,
    password: "",
    fees: data.fees ?? "",
    active: data.active !== false,
  };
};

export default function UsersPage({ session }) {
  const [users,  setUsers]  = useState([]);
  const [form,   setForm]   = useState(emptyForm(session.hospitalId));
  const [modal,  setModal]  = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const load = () =>
    getUsersByHospital(session.hospitalId)
      .then((r) => setUsers(r.data))
      .catch(() => {});

  useEffect(() => { load(); }, [session.hospitalId]); // eslint-disable-line

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "timingStart" || name === "timingEnd") {
      const nextForm = { ...form, [name]: value };
      nextForm.timing = buildTiming(nextForm.timingStart, nextForm.timingEnd);
      setForm(nextForm);
      return;
    }
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const openNew  = () => { setForm(emptyForm(session.hospitalId)); setModal(true); };
  const openEdit = (u) => { setForm(normalizeForm(u, session.hospitalId)); setModal(true); };

  const save = async () => {
    if (!form.userName || !form.email) { alert("Name and Email are required."); return; }
    if (!form.userId && !form.password) { alert("Password is required for new users."); return; }
    if ((form.timingStart && !form.timingEnd) || (!form.timingStart && form.timingEnd)) {
      alert("Please select both start time and end time.");
      return;
    }
    try {
      const { timingStart, timingEnd, ...payload } = form;
      if (form.userId) { await updateUser(form.userId, payload); }
      else             { await saveUser(payload); }
      setModal(false); load();
    } catch (e) { alert("Error: " + (e.response?.data?.message || e.message)); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try { await deleteUser(id); load(); }
    catch (e) { alert("Error: " + e.message); }
  };

  const role  = (u) => u.role || "—";
  const roleColor = { DOCTOR: "#198754", RECEPTIONIST: "#fd7e14", ADMIN: "#0d6efd" };

  const filtered = users
    .filter((u) => filter === "ALL" || u.role === filter)
    .filter((u) =>
      (u.userName || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email    || "").toLowerCase().includes(search.toLowerCase())
    );

  const summaryCards = [
    { label: "Total Staff",      value: users.length,                                           color: "#0d6efd" },
    { label: "Doctors",          value: users.filter((u) => u.role === "DOCTOR").length,        color: "#198754" },
    { label: "Receptionists",    value: users.filter((u) => u.role === "RECEPTIONIST").length,  color: "#fd7e14" },
    { label: "Active",           value: users.filter((u) => u.active).length,                  color: "#8b5cf6" },
  ];

  return (
    <div>
      <PageTitle icon="👥" title="Staff / Users" subtitle="Manage doctors, receptionists and admins" />

      <div style={statsGrid}>
        {summaryCards.map((c, i) => (
          <div key={i} style={{
            background: "#fff", borderRadius: "14px", padding: "20px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
            textAlign: "center", borderTop: `4px solid ${c.color}`,
          }}>
            <div style={{ fontSize: "26px", fontWeight: "bold" }}>{c.value}</div>
            <div style={{ color: "#64748b", marginTop: "6px", fontSize: "13px" }}>{c.label}</div>
          </div>
        ))}
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "18px", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email…"
              style={{ ...inputStyle, width: "220px" }} />
            <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ ...inputStyle, width: "160px" }}>
              <option value="ALL">All Roles</option>
              <option value="DOCTOR">Doctors</option>
              <option value="RECEPTIONIST">Receptionists</option>
              <option value="ADMIN">Sub-Admins</option>
            </select>
          </div>
          <button style={btnPrimary} onClick={openNew}>+ Add Staff</button>
        </div>

        <Table
          columns={["ID", "Name", "Role", "Email", "Contact", "Specialization", "Timing", "Fees", "Status", "Action"]}
          rows={filtered.map((u) => [
            u.userId,
            u.userName,
            <span style={{
              padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 600,
              background: (roleColor[u.role] || "#6c757d") + "22",
              color: roleColor[u.role] || "#6c757d",
            }}>{role(u)}</span>,
            u.email,
            u.contact || "—",
            u.specialization || "—",
            u.timing || "—",
            u.fees ? `₹${u.fees}` : "—",
            <StatusBadge status={u.active ? "Active" : "Inactive"} />,
            <div style={{ display: "flex", gap: "5px" }}>
              <button style={btnWarning} onClick={() => openEdit(u)}>Edit</button>
              <button style={btnDanger}  onClick={() => del(u.userId)}>Del</button>
            </div>,
          ])}
        />
      </Card>

      <Modal open={modal} onClose={() => setModal(false)}
             title={form.userId ? "Edit Staff Member" : "Add New Staff Member"}
             width="780px">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <Field label="Hospital ID" required>
            <input name="hospitalId" value={form.hospitalId} readOnly style={{ ...inputStyle, background: "#f8fafc" }} />
          </Field>
          <Field label="Full Name" required>
            <input name="userName" value={form.userName} onChange={handle} style={inputStyle} placeholder="Dr. Amit Sharma" />
          </Field>
          <Field label="User Code">
            <input name="userCode" value={form.userCode} onChange={handle} style={inputStyle} placeholder="DOC001" />
          </Field>
          <Field label="Email" required>
            <input type="email" name="email" value={form.email} onChange={handle} style={inputStyle} />
          </Field>
          <Field label={form.userId ? "New Password (leave blank to keep)" : "Password *"}>
            <input type="password" name="password" value={form.password} onChange={handle} style={inputStyle} />
          </Field>
          <Field label="Role" required>
            <select name="role" value={form.role} onChange={handle} style={inputStyle}>
              <option value="DOCTOR">Doctor</option>
              <option value="RECEPTIONIST">Receptionist</option>
              <option value="ADMIN">Sub-Admin</option>
            </select>
          </Field>
          <Field label="Contact">
            <input name="contact" value={form.contact} onChange={handle} style={inputStyle} />
          </Field>
          <Field label="Alt. Contact">
            <input name="contact2" value={form.contact2} onChange={handle} style={inputStyle} />
          </Field>
          <Field label="Specialization">
            <input name="specialization" value={form.specialization} onChange={handle} style={inputStyle} placeholder="Cardiology" />
          </Field>
          <Field label="Education">
            <input name="education" value={form.education} onChange={handle} style={inputStyle} placeholder="MBBS, MD" />
          </Field>
          <Field label="Location / Chamber">
            <input name="location" value={form.location} onChange={handle} style={inputStyle} placeholder="Room 101" />
          </Field>
          <Field label="Timing">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <select name="timingStart" value={form.timingStart} onChange={handle} style={inputStyle}>
                <option value="">Start Time</option>
                {timeOptions.map((time) => <option key={time} value={time}>{time}</option>)}
              </select>
              <select name="timingEnd" value={form.timingEnd} onChange={handle} style={inputStyle}>
                <option value="">End Time</option>
                {timeOptions.map((time) => <option key={time} value={time}>{time}</option>)}
              </select>
            </div>
          </Field>
          <Field label="Consultation Fees (₹)">
            <input type="number" name="fees" value={form.fees} onChange={handle} style={inputStyle} />
          </Field>
          <Field label="License No">
            <input name="licenseNo" value={form.licenseNo} onChange={handle} style={inputStyle} />
          </Field>
        </div>
        <Field label="Address">
          <textarea name="address" value={form.address} onChange={handle}
            rows="2" style={{ ...inputStyle, resize: "vertical" }} />
        </Field>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
          <input type="checkbox" name="active" checked={form.active} onChange={handle} />
          <label style={{ fontSize: "14px" }}>Active</label>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button style={btnPrimary} onClick={save}>
            {form.userId ? "Update Staff" : "Save Staff"}
          </button>
          <button style={{ ...btnPrimary, background: "#64748b" }} onClick={() => setModal(false)}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
