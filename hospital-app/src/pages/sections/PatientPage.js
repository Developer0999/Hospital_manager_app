import React, { useEffect, useState } from "react";
import {
  getCustomersByHospital,
  saveCustomer, updateCustomer, deleteCustomer,
} from "../../api";
import {
  PageTitle, Card, Table, Modal, Field, StatusBadge,
  inputStyle, btnPrimary, btnWarning, btnDanger, statsGrid,
} from "../../components/UI";

const emptyForm = (hid) => ({
  custId: "", hospitalId: hid,
  custName: "", custContact: "", custEmail: "",
  custAddress: "", custMessage: "",
  age: "", gender: "Male", disease: "", active: true,
});

export default function PatientPage({ session }) {
  const [patients, setPatients] = useState([]);
  const [form,     setForm]     = useState(emptyForm(session.hospitalId));
  const [modal,    setModal]    = useState(false);
  const [search,   setSearch]   = useState("");

  const load = () =>
    getCustomersByHospital(session.hospitalId)
      .then((r) => setPatients(r.data))
      .catch(() => {});

  useEffect(() => { load(); }, [session.hospitalId]); // eslint-disable-line

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const openNew  = () => { setForm(emptyForm(session.hospitalId)); setModal(true); };
  const openEdit = (p) => { setForm(p); setModal(true); };

  const save = async () => {
    if (!form.custName || !form.custContact) {
      alert("Name and Contact are required."); return;
    }
    try {
      if (form.custId) { await updateCustomer(form.custId, form); }
      else             { await saveCustomer(form); }
      setModal(false); load();
    } catch (e) { alert("Error: " + e.message); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete patient?")) return;
    try { await deleteCustomer(id); load(); }
    catch (e) { alert("Error: " + e.message); }
  };

  const canEdit = session.role !== "DOCTOR";

  const filtered = patients.filter((p) =>
    (p.custName    || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.custContact || "").includes(search) ||
    (p.disease     || "").toLowerCase().includes(search.toLowerCase())
  );

  const summaryCards = [
    { label: "Total Patients", value: patients.length,                              color: "#0d6efd" },
    { label: "Active",         value: patients.filter((p) => p.active).length,      color: "#198754" },
    { label: "Inactive",       value: patients.filter((p) => !p.active).length,     color: "#dc3545" },
    { label: "New (no disease)",value: patients.filter((p) => !p.disease).length,   color: "#fd7e14" },
  ];

  return (
    <div>
      <PageTitle icon="🧑‍⚕️" title="Patients" subtitle="Hospital patient records" />

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
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, contact, disease…"
            style={{ ...inputStyle, width: "300px" }} />
          {canEdit && (
            <button style={btnPrimary} onClick={openNew}>+ Register Patient</button>
          )}
        </div>

        <Table
          columns={["ID", "Name", "Age", "Gender", "Contact", "Email", "Disease", "Status", ...(canEdit ? ["Action"] : [])]}
          rows={filtered.map((p) => {
            const cells = [
              p.custId,
              p.custName,
              p.age || "—",
              p.gender || "—",
              p.custContact,
              p.custEmail || "—",
              p.disease || "—",
              <StatusBadge status={p.active ? "Active" : "Inactive"} />,
            ];
            if (canEdit) cells.push(
              <div style={{ display: "flex", gap: "5px" }}>
                <button style={btnWarning} onClick={() => openEdit(p)}>Edit</button>
                <button style={btnDanger}  onClick={() => del(p.custId)}>Del</button>
              </div>
            );
            return cells;
          })}
        />
      </Card>

      <Modal open={modal} onClose={() => setModal(false)}
             title={form.custId ? "Edit Patient" : "Register New Patient"}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <Field label="Full Name"     required>
            <input name="custName"    value={form.custName}    onChange={handle} style={inputStyle} />
          </Field>
          <Field label="Contact"       required>
            <input name="custContact" value={form.custContact} onChange={handle} style={inputStyle} />
          </Field>
          <Field label="Email">
            <input type="email" name="custEmail" value={form.custEmail} onChange={handle} style={inputStyle} />
          </Field>
          <Field label="Age">
            <input type="number" name="age" value={form.age} onChange={handle} style={inputStyle} />
          </Field>
          <Field label="Gender">
            <select name="gender" value={form.gender} onChange={handle} style={inputStyle}>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </Field>
          <Field label="Disease / Complaint">
            <input name="disease" value={form.disease} onChange={handle} style={inputStyle} />
          </Field>
        </div>
        <Field label="Address">
          <textarea name="custAddress" value={form.custAddress} onChange={handle}
            rows="2" style={{ ...inputStyle, resize: "vertical" }} />
        </Field>
        <Field label="Message / Notes">
          <textarea name="custMessage" value={form.custMessage} onChange={handle}
            rows="2" style={{ ...inputStyle, resize: "vertical" }} />
        </Field>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <input type="checkbox" name="active" checked={form.active} onChange={handle} />
          <label style={{ fontSize: "14px" }}>Active</label>
        </div>
        <button style={btnPrimary} onClick={save}>
          {form.custId ? "Update Patient" : "Save Patient"}
        </button>
      </Modal>
    </div>
  );
}
