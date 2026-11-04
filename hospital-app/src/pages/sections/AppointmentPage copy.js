import React, { useEffect, useState } from "react";
import {
  AppointmentAPI,
  UserAPI,
  CustomerAPI,
  PrescriptionAPI,
} from "../api";
import {
  PageTitle, Card, Table, Modal, Field, StatusBadge,
  inputStyle, btnPrimary, btnWarning, btnDanger, btnSuccess, btnInfo, statsGrid,
} from "../../components/UI";

const emptyForm = (hid) => ({
  appointmentId: "", hospitalId: hid,
  doctorId: "", customerId: "",
  patientName: "", doctorName: "", department: "",
  appointmentDate: "", timeSlot: "", reason: "",
  status: "Pending", fees: "",
});

const TIME_SLOTS = [
  "09:00 AM","10:00 AM","11:00 AM","12:00 PM",
  "01:00 PM","02:00 PM","03:00 PM","04:00 PM","05:00 PM","06:00 PM",
];

export default function AppointmentPage({ session, onOpenPatients, onOpenPrescription }) {
  const [appts,               setAppts]   = useState([]);
  const [doctors,             setDoctors] = useState([]);
  const [patients,            setPatients]= useState([]);
  const [form,                setForm]    = useState(emptyForm(session.hospitalId));
  const [patientQuery,        setPatientQuery] = useState("");
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);
  const [doctorQuery,         setDoctorQuery] = useState("");
  const [showDoctorSuggestions, setShowDoctorSuggestions] = useState(false);
  const [doctorNavIndex,      setDoctorNavIndex] = useState(-1);
  const [modal,               setModal]   = useState(false);
  const [historyModal,        setHistoryModal] = useState(false);
  const [historyPatient,      setHistoryPatient] = useState("");
  const [historyPatientId,    setHistoryPatientId] = useState("");
  const [historyRecords,      setHistoryRecords] = useState([]);
  const [historyPrescriptions, setHistoryPrescriptions] = useState([]);
  const [uploadedFiles,       setUploadedFiles] = useState({}); // {prescriptionId: [files]}
  const [expandedAppts,       setExpandedAppts] = useState({}); // {appointmentId: true/false}
  const [search,              setSearch]  = useState("");
  const [startDate,           setStartDate] = useState("");
  const [endDate,             setEndDate]   = useState("");
  const [statusFilter,        setStatusFilter] = useState("All");
  const [viewingFromHistory,  setViewingFromHistory] = useState(false); // Track if viewing prescription from history
  const [historyState,        setHistoryState] = useState(null); // Save history state when opening prescription

  const load = () => {
    if (session.role === "DOCTOR") {
      AppointmentAPI.byDoctor(session.userId || session.id)
        .then((r) => setAppts(r.data)).catch(() => {});
    } else {
      AppointmentAPI.byHospital(session.hospitalId)
        .then((r) => setAppts(r.data)).catch(() => {});
    }
  };

  useEffect(() => {
    load();
    UserAPI.doctors(session.hospitalId).then((r) => setDoctors(r.data)).catch(() => {});
    CustomerAPI.byHospital(session.hospitalId).then((r) => setPatients(r.data)).catch(() => {});
  // eslint-disable-next-line
  }, [session]);

  const handle = (e) => {
    const { name, value } = e.target;
    let updated = { ...form, [name]: value };
    if (name === "doctorId") {
      const doc = doctors.find((d) => String(d.userId) === String(value));
      if (doc) {
        updated.doctorName  = doc.userName;
        updated.department  = doc.specialization || "";
        updated.fees        = doc.fees || "";
      }
    }
    setForm(updated);
  };

  const handlePatientSearch = (value) => {
    setPatientQuery(value);
    setShowPatientSuggestions(true);
    setForm((f) => ({ ...f, customerId: "", patientName: value }));
  };

  const selectPatient = (cust) => {
    setForm((f) => ({ ...f, customerId: cust.custId, patientName: cust.custName }));
    setPatientQuery(`${cust.custName} (${cust.custContact})`);
    setShowPatientSuggestions(false);
  };

  const doctorQueryLower = doctorQuery.trim().toLowerCase();
  const doctorSuggestions = doctors
    .filter((d) => {
      if (!doctorQueryLower) return false;
      return (d.userName || "").toLowerCase().includes(doctorQueryLower) ||
             (d.specialization || "").toLowerCase().includes(doctorQueryLower) ||
             String(d.userId || "").includes(doctorQueryLower);
    })
    .slice(0, 8);

  const chooseDoctor = (doc) => {
    setForm((f) => ({
      ...f,
      doctorId: doc.userId,
      doctorName: doc.userName,
      department: doc.specialization || "",
      fees: doc.fees || "",
    }));
    setDoctorQuery(`${doc.userName} — ${doc.specialization || "General"}`);
    setShowDoctorSuggestions(false);
    setDoctorNavIndex(-1);
  };

  const handleDoctorSearch = (value) => {
    setDoctorQuery(value);
    setShowDoctorSuggestions(true);
    setForm((f) => ({ ...f, doctorId: "", doctorName: "", department: "", fees: "" }));
  };

  const handleDoctorKeyDown = (e) => {
    if (!doctorSuggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setDoctorNavIndex((idx) => Math.min(doctorSuggestions.length - 1, idx + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDoctorNavIndex((idx) => Math.max(0, idx - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (doctorNavIndex >= 0) {
        chooseDoctor(doctorSuggestions[doctorNavIndex]);
      } else if (doctorSuggestions.length === 1) {
        chooseDoctor(doctorSuggestions[0]);
      }
    }
  };

  const openNew  = () => {
    const nextForm = emptyForm(session.hospitalId);
    if (session.role === "DOCTOR") {
      const doctorName = session.userName || session.ownerName || "";
      nextForm.doctorId = session.userId || session.id;
      nextForm.doctorName = doctorName;
      nextForm.department = session.specialization || "";
      nextForm.fees = session.fees || "";
      setDoctorQuery(`${doctorName}${session.specialization ? ` — ${session.specialization}` : ""}`);
    } else {
      setDoctorQuery("");
    }
    setForm(nextForm);
    setPatientQuery("");
    setShowPatientSuggestions(false);
    setShowDoctorSuggestions(false);
    setDoctorNavIndex(-1);
    setModal(true);
  };

  const openEdit = (a) => {
    setForm(a);
    setPatientQuery(a.patientName || "");
    setDoctorQuery(a.doctorName ? `${a.doctorName} — ${a.department || "General"}` : "");
    setShowPatientSuggestions(false);
    setShowDoctorSuggestions(false);
    setModal(true);
  };

  const save = async () => {
    if (!form.patientName || !form.appointmentDate) {
      alert("Patient and Date are required."); return;
    }
    try {
      if (form.appointmentId) {
        await AppointmentAPI.update(form.appointmentId, form);
      } else {
        await AppointmentAPI.create(form, session.hospitalId, form.customerId, form.doctorId);
      }
      setModal(false);
      load();
    } catch (e) { alert("Error: " + e.message); }
  };

  const quickStatus = async (a, status) => {
    try { await AppointmentAPI.update(a.appointmentId, { ...a, status }); load(); }
    catch (e) { alert("Error: " + e.message); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete appointment?")) return;
    try { await AppointmentAPI.delete(id); load(); }
    catch (e) { alert("Error: " + e.message); }
  };

  const openPrescriptionForAppointment = (appointment) => {
    if (!onOpenPrescription) return;
    const customerId = appointment.customerId || appointment.custId;
    const patientName = appointment.patientName || appointment.custName || "";
    if (!customerId) {
      alert("This appointment does not have a linked patient yet.");
      return;
    }
    const doctorId = appointment.doctorId || appointment.userId || appointment.doctorUserId || "";
    const doctorName = appointment.doctorName || appointment.userName || "";
    const doctorSpecialization = appointment.department || appointment.specialization || "";
    onOpenPrescription({
      appointmentId: appointment.appointmentId || "",
      custId: customerId,
      custName: patientName,
      custContact: appointment.custContact || "",
      doctorId,
      doctorName,
      doctorSpecialization,
    });
  };

  useEffect(() => {
    if (!patientQuery.trim()) return;
    const exactPatient = patients.find((p) => {
      const display = `${p.custName || ""}${p.custContact ? ` (${p.custContact})` : ""}`.trim().toLowerCase();
      return display === patientQuery.trim().toLowerCase();
    });
    if (exactPatient) {
      setShowPatientSuggestions(false);
      setForm((f) => ({ ...f, customerId: exactPatient.custId, patientName: exactPatient.custName }));
    }
  }, [patientQuery, patients]);

  useEffect(() => {
    if (!doctorQuery.trim()) return;
    const exactDoctor = doctors.find((d) => {
      const display = `${d.userName || ""} — ${d.specialization || "General"}`.trim().toLowerCase();
      return display === doctorQuery.trim().toLowerCase();
    });
    if (exactDoctor) {
      setShowDoctorSuggestions(false);
      setForm((f) => ({
        ...f,
        doctorId: exactDoctor.userId,
        doctorName: exactDoctor.userName,
        department: exactDoctor.specialization || "",
        fees: exactDoctor.fees || "",
      }));
    }
  }, [doctorQuery, doctors]);

  useEffect(() => {
    if (!form.doctorId) return;
    const doc = doctors.find((d) => String(d.userId) === String(form.doctorId));
    if (doc) {
      setDoctorQuery(`${doc.userName} — ${doc.specialization || "General"}`);
    }
  }, [form.doctorId, doctors]);

  const viewPatientHistory = async (appointment) => {
    console.log("Viewing history for appointment:", appointment);
    const customerId = appointment.customerId || appointment.custId || form.customerId;
    const name = appointment.patientName || appointment.custName || "Patient";
    if (!customerId) {
      alert("Cannot load history without a selected patient.");
      return;
    }
    setHistoryPatient(name);
    setHistoryPatientId(customerId);
    setHistoryModal(true);
    setExpandedAppts({});
    setUploadedFiles({});
    try {
      const [apptResp, prescResp] = await Promise.all([
        AppointmentAPI.byCustomer(customerId),
        PrescriptionAPI.byCustomer(customerId).catch(() => ({ data: [] })),
      ]);
      setHistoryRecords(apptResp.data || []);
      setHistoryPrescriptions(prescResp.data || []);
    } catch (e) {
      console.error(e);
      setHistoryRecords([]);
      setHistoryPrescriptions([]);
      alert("Failed to load patient history.");
    }
  };

  const openPrescriptionFromHistory = (prescription) => {
    if (!onOpenPrescription) {
      alert("Prescription viewer not available");
      return;
    }
    // Save current history state
    setHistoryState({
      historyModal,
      historyPatient,
      historyPatientId,
      historyRecords,
      historyPrescriptions,
      uploadedFiles,
      expandedAppts,
    });
    setViewingFromHistory(true);
    setHistoryModal(false);
    
    // Open prescription in edit mode
    onOpenPrescription({
      prescriptionId: prescription.prescriptionId,
      custId: prescription.customerId,
      custName: prescription.patientName,
      custContact: prescription.patientContact || "",
      doctorId: prescription.doctorId,
      doctorName: prescription.doctorName,
      doctorSpecialization: prescription.doctorSpecialization || "",
      appointmentId: prescription.appointmentId || "",
      editingPrescription: prescription,
    });
  };

  const backToHistory = () => {
    if (historyState) {
      setHistoryModal(historyState.historyModal);
      setHistoryPatient(historyState.historyPatient);
      setHistoryPatientId(historyState.historyPatientId);
      setHistoryRecords(historyState.historyRecords);
      setHistoryPrescriptions(historyState.historyPrescriptions);
      setUploadedFiles(historyState.uploadedFiles);
      setExpandedAppts(historyState.expandedAppts);
      setViewingFromHistory(false);
      setHistoryState(null);
    }
  };

  const canWrite = session.role !== "DOCTOR";

  // Helper functions for report handling
  const addReportFiles = (prescriptionId, fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    const next = files.map(file => ({
      name: file.name,
      url: URL.createObjectURL(file),
      saved: false,
      file,
    }));
    setUploadedFiles(prev => ({
      ...prev,
      [prescriptionId]: [...(prev[prescriptionId] || []), ...next],
    }));
  };

  const uploadReports = async (prescriptionId) => {
    const files = uploadedFiles[prescriptionId] || [];
    const pendingFiles = files.filter(f => !f.saved && f.file).map(f => f.file);
    if (pendingFiles.length === 0) {
      alert("No files to upload");
      return;
    }
    try {
      await PrescriptionAPI.uploadReports(prescriptionId, pendingFiles);
      setUploadedFiles(prev => ({
        ...prev,
        [prescriptionId]: files.map(f => ({ ...f, saved: true })),
      }));
      // Reload prescriptions to get updated data
      const prescResp = await PrescriptionAPI.byCustomer(historyPatientId);
      setHistoryPrescriptions(prescResp.data || []);
      alert("Reports uploaded successfully");
    } catch (e) {
      console.error(e);
      alert("Failed to upload reports: " + e.message);
    }
  };

  const removeReportFile = (prescriptionId, index) => {
    setUploadedFiles(prev => ({
      ...prev,
      [prescriptionId]: prev[prescriptionId]?.filter((_, i) => i !== index) || [],
    }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const query = patientQuery.trim().toLowerCase();
  const patientSuggestions = patients
    .filter((p) => {
      return query && (
        p.custName?.toLowerCase().includes(query) ||
        p.custContact?.toLowerCase().includes(query)
      );
    })
    .slice(0, 8);

  const filtered = appts.filter((a) => {
    const matchesText =
      (a.patientName || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.doctorName  || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.status      || "").toLowerCase().includes(search.toLowerCase());
    if (!matchesText) return false;
    if (statusFilter !== "All" && a.status !== statusFilter) return false;
    if (startDate && a.appointmentDate && a.appointmentDate < startDate) return false;
    if (endDate && a.appointmentDate && a.appointmentDate > endDate) return false;
    return true;
  });

  const summaryCards = [
    { label: "Total",     value: appts.length,                                      color: "#0d6efd" },
    { label: "Today",     value: appts.filter((a) => a.appointmentDate === today).length, color: "#198754" },
    { label: "Pending",   value: appts.filter((a) => a.status === "Pending").length,  color: "#fd7e14" },
    { label: "Completed", value: appts.filter((a) => a.status === "Completed").length, color: "#8b5cf6" },
  ];

  return (
    <div>
      <PageTitle icon="📅" title="Appointments" subtitle="Manage all hospital appointments" />

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
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient, doctor, status…"
            style={{ ...inputStyle, width: "300px" }}
          />
          {canWrite && (
            <button style={btnPrimary} onClick={openNew}>+ New Appointment</button>
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "18px", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <label style={{ fontSize: "13px", color: "#475569" }}>Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ ...inputStyle, width: "170px" }} />
            <span style={{ color: "#64748b" }}>to</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ ...inputStyle, width: "170px" }} />
            <button style={{ ...btnInfo, padding: "8px 14px" }} onClick={() => { setStartDate(""); setEndDate(""); }}>Clear</button>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              style={{ ...btnInfo, background: statusFilter === "All" ? "#1d4ed8" : "#eff6ff", color: statusFilter === "All" ? "#fff" : "#1d4ed8" }}
              onClick={() => setStatusFilter("All")}
            >All</button>
            {['Pending','Confirmed','Completed','Cancelled'].map((status) => (
              <button
                key={status}
                style={{ ...btnInfo, background: statusFilter === status ? "#1d4ed8" : "#eff6ff", color: statusFilter === status ? "#fff" : "#1d4ed8" }}
                onClick={() => setStatusFilter(status)}
              >{status}</button>
            ))}
            <button style={{ ...btnInfo, padding: "8px 14px" }} onClick={() => { setStartDate(today); setEndDate(today); setStatusFilter("All"); }}>Today</button>
          </div>
        </div>

        <Table
          columns={["ID", "Patient", "Doctor", "Dept", "Date", "Time", "Fees", "Status", "Action"]}
          rows={filtered.map((a) => [
            a.appointmentId,
            a.patientName  || "—",
            a.doctorName   || "—",
            a.department   || "—",
            a.appointmentDate || "—",
            a.timeSlot     || "—",
            a.fees ? `₹${a.fees}` : "—",
            <StatusBadge status={a.status} />,
            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
              {/* Doctor can mark done */}
              {session.role === "DOCTOR" && a.status === "Confirmed" && (
                <button style={btnSuccess} onClick={() => quickStatus(a, "Completed")}>✓ Done</button>
              )}
              {/* Admin/Receptionist can confirm pending */}
              {canWrite && a.status === "Pending" && (
                <button style={btnInfo} onClick={() => quickStatus(a, "Confirmed")}>Confirm</button>
              )}
              {canWrite && (
                <button style={btnWarning} onClick={() => openEdit(a)}>Edit</button>
              )}
              {canWrite && (
                <button style={btnDanger} onClick={() => del(a.appointmentId)}>Del</button>
              )}
              {onOpenPrescription && (
                <button style={btnInfo} onClick={() => openPrescriptionForAppointment(a)}>Prescription</button>
              )}
              {canWrite || (
                <button style={btnInfo} onClick={() => viewPatientHistory(a)}>History</button>
              )}
            </div>,
          ])}
        />
      </Card>

      <Modal open={historyModal} onClose={() => setHistoryModal(false)}
             title={`📋 Patient History - ${historyPatient}`}
             width="900px">
        <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {historyRecords.length === 0 ? (
            <p style={{ color: "#64748b", margin: 0, padding: "20px", textAlign: "center" }}>
              No appointment history found for this patient.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Appointment List */}
              <div>
                <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  📅 Appointments ({historyRecords.length})
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {historyRecords.map((h) => (
                    <div key={h.appointmentId} style={{
                      background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px",
                      padding: "12px", cursor: "pointer", transition: "all 0.2s",
                    }} onClick={() => setExpandedAppts(prev => ({ ...prev, [h.appointmentId]: !prev[h.appointmentId] }))}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", fontSize: "13px" }}>
                        <div><b>📆 Date:</b> {formatDate(h.appointmentDate)}</div>
                        <div><b>⏰ Time:</b> {h.timeSlot || "—"}</div>
                        <div><b>👨‍⚕️ Doctor:</b> {h.doctorName || "—"}</div>
                        <div><b>Status:</b> <StatusBadge status={h.status} /></div>
                      </div>
                      {h.reason && <div style={{ fontSize: "12px", color: "#475569", marginTop: "8px", fontStyle: "italic" }}>📝 Reason: {h.reason}</div>}
                      {h.fees && <div style={{ fontSize: "12px", color: "#475569", marginTop: "4px" }}>💰 Fees: ₹{h.fees}</div>}
                      <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px" }}>
                        {expandedAppts[h.appointmentId] ? "▼ Click to collapse" : "▶ Click to view prescriptions & reports"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prescriptions List */}
              {historyPrescriptions.length > 0 && (
                <div>
                  <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    💊 Prescriptions & Services ({historyPrescriptions.length})
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {historyPrescriptions.map((prescription) => {
                      const medicines = (() => {
                        try {
                          const parsed = JSON.parse(prescription.medicinesJson || "[]");
                          return Array.isArray(parsed) ? parsed : [];
                        } catch {
                          return [];
                        }
                      })();
                      
                      return (
                        <div key={prescription.prescriptionId} style={{
                          background: "#fff", border: "2px solid #dbeafe", borderRadius: "10px",
                          padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        }}>
                          {/* Header */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "12px", marginBottom: "12px", paddingBottom: "12px", borderBottom: "1.5px solid #eff6ff", alignItems: "center" }}>
                            <div><b>📆 Date:</b> {formatDate(prescription.prescriptionDate)}</div>
                            <div><b>👨‍⚕️ Doctor:</b> {prescription.doctorName || "—"}</div>
                            <div><b>ID:</b> {prescription.prescriptionId || "—"}</div>
                            {onOpenPrescription && (
                              <button onClick={() => openPrescriptionFromHistory(prescription)}
                                style={{
                                  padding: "6px 12px", background: "#3b82f6", color: "#fff",
                                  border: "none", borderRadius: "6px", cursor: "pointer",
                                  fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap",
                                  transition: "background 0.2s",
                                }}
                                onMouseEnter={e => e.target.style.background = "#1d4ed8"}
                                onMouseLeave={e => e.target.style.background = "#3b82f6"}>
                                👁️ View Rx
                              </button>
                            )}
                          </div>

                          {/* Complaints & Diagnosis */}
                          {(prescription.complaints || prescription.diagnosis) && (
                            <div style={{ marginBottom: "12px", fontSize: "13px" }}>
                              {prescription.complaints && (
                                <div style={{ marginBottom: "6px" }}>
                                  <b>🔍 Complaints:</b> <span style={{ color: "#475569" }}>{prescription.complaints}</span>
                                </div>
                              )}
                              {prescription.diagnosis && (
                                <div>
                                  <b>📋 Diagnosis:</b> <span style={{ color: "#475569" }}>{prescription.diagnosis}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Medicines/Services */}
                          {medicines.length > 0 && (
                            <div style={{ marginBottom: "12px" }}>
                              <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "8px", textTransform: "uppercase" }}>
                                💉 Medicines & Services
                              </div>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                                <thead>
                                  <tr style={{ background: "#f0f9ff", borderBottom: "1px solid #bfdbfe" }}>
                                    <th style={{ padding: "6px", textAlign: "left", fontWeight: 600, color: "#1e40af" }}>Medicine</th>
                                    <th style={{ padding: "6px", textAlign: "center", fontWeight: 600, color: "#1e40af", width: "40px" }}>M</th>
                                    <th style={{ padding: "6px", textAlign: "center", fontWeight: 600, color: "#1e40af", width: "40px" }}>A</th>
                                    <th style={{ padding: "6px", textAlign: "center", fontWeight: 600, color: "#1e40af", width: "40px" }}>N</th>
                                    <th style={{ padding: "6px", textAlign: "left", fontWeight: 600, color: "#1e40af", width: "60px" }}>Days</th>
                                    <th style={{ padding: "6px", textAlign: "left", fontWeight: 600, color: "#1e40af" }}>Notes</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {medicines.map((med, i) => (
                                    <React.Fragment key={i}>
                                      <tr style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                        <td style={{ padding: "6px", textAlign: "left", fontWeight: 600 }}>{med.medicineName || "—"}</td>
                                        <td style={{ padding: "6px", textAlign: "center" }}>{med.morning ? "✓" : "—"}</td>
                                        <td style={{ padding: "6px", textAlign: "center" }}>{med.afternoon ? "✓" : "—"}</td>
                                        <td style={{ padding: "6px", textAlign: "center" }}>{med.night ? "✓" : "—"}</td>
                                        <td style={{ padding: "6px", textAlign: "left" }}>{med.days || "—"}</td>
                                        <td style={{ padding: "6px", textAlign: "left", fontSize: "11px", color: "#475569", maxWidth: "200px", wordBreak: "break-word" }}>{med.note || "—"}</td>
                                      </tr>
                                    </React.Fragment>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* Instructions & Notes */}
                          {(prescription.medicalInstructions || prescription.patientNotes) && (
                            <div style={{ marginBottom: "12px", fontSize: "13px" }}>
                              {prescription.medicalInstructions && (
                                <div style={{ marginBottom: "6px", padding: "8px", background: "#fef3c7", borderLeft: "3px solid #f59e0b", borderRadius: "4px" }}>
                                  <b>📌 Instructions:</b> <span style={{ color: "#475569" }}>{prescription.medicalInstructions}</span>
                                </div>
                              )}
                              {prescription.patientNotes && (
                                <div style={{ padding: "8px", background: "#dbeafe", borderLeft: "3px solid #3b82f6", borderRadius: "4px" }}>
                                  <b>📝 Patient Notes:</b> <span style={{ color: "#475569" }}>{prescription.patientNotes}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Report Upload Section */}
                          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1.5px solid #eff6ff" }}>
                            <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "8px", textTransform: "uppercase" }}>
                              📤 Report Upload
                            </div>
                            
                            {/* Upload Area */}
                            <label style={{
                              display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
                              padding: "12px", border: "2px dashed #bfdbfe", borderRadius: "8px",
                              background: "#f0f9ff", cursor: "pointer", transition: "all 0.2s",
                            }}
                            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.background = "#eff6ff"; }}
                            onDragLeave={e => { e.currentTarget.style.borderColor = "#bfdbfe"; e.currentTarget.style.background = "#f0f9ff"; }}
                            onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#bfdbfe"; e.currentTarget.style.background = "#f0f9ff"; addReportFiles(prescription.prescriptionId, e.dataTransfer.files); }}>
                              <span style={{ fontSize: "20px" }}>📄</span>
                              <div style={{ fontSize: "12px", fontWeight: 600, color: "#1e40af" }}>Drag & drop or click to upload reports</div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>PDF, JPG, PNG accepted</div>
                              <input type="file" accept="application/pdf,image/*" multiple
                                onChange={e => { addReportFiles(prescription.prescriptionId, e.target.files); e.target.value = ""; }}
                                style={{ display: "none" }} />
                            </label>

                            {/* Uploaded Files List */}
                            {(uploadedFiles[prescription.prescriptionId]?.length > 0) && (
                              <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Attached Files</div>
                                {uploadedFiles[prescription.prescriptionId]?.map((f, i) => (
                                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "6px 10px" }}>
                                    <span style={{ fontSize: "14px" }}>{f.name.endsWith(".pdf") ? "📄" : "🖼️"}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: "12px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                                      <div style={{ fontSize: "10px", color: f.saved ? "#059669" : "#f59e0b" }}>{f.saved ? "✓ Saved" : "⏳ Pending"}</div>
                                    </div>
                                    <a href={f.url} target="_blank" rel="noreferrer"
                                      style={{ fontSize: "10px", color: "#1d4ed8", textDecoration: "none", background: "#eff6ff", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
                                      Open
                                    </a>
                                    {!f.saved && (
                                      <button onClick={() => removeReportFile(prescription.prescriptionId, i)}
                                        style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "4px", width: "20px", height: "20px", cursor: "pointer", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Existing Report */}
                            {(prescription.reportUrl || prescription.reportFilesJson) && uploadedFiles[prescription.prescriptionId]?.every(f => f.saved) && (
                              <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", padding: "6px 10px" }}>
                                <span style={{ fontSize: "14px" }}>📄</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: "12px", fontWeight: 600 }}>{prescription.reportName || "Uploaded report"}</div>
                                  <div style={{ fontSize: "10px", color: "#059669" }}>✓ Saved</div>
                                </div>
                                {prescription.reportUrl && (
                                  <a href={prescription.reportUrl} target="_blank" rel="noreferrer"
                                    style={{ fontSize: "10px", color: "#1d4ed8", textDecoration: "none", background: "#eff6ff", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
                                    Open
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Upload Button */}
                            {uploadedFiles[prescription.prescriptionId]?.some(f => !f.saved) && (
                              <button onClick={() => uploadReports(prescription.prescriptionId)}
                                style={{
                                  marginTop: "8px", width: "100%", padding: "8px", background: "#3b82f6",
                                  color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer",
                                  fontSize: "12px", fontWeight: 600, transition: "background 0.2s",
                                }}
                                onMouseEnter={e => e.target.style.background = "#1d4ed8"}
                                onMouseLeave={e => e.target.style.background = "#3b82f6"}>
                                ☁️ Upload Reports
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No Prescriptions Message */}
              {historyPrescriptions.length === 0 && (
                <div style={{ padding: "20px", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: "8px", textAlign: "center", fontSize: "13px", color: "#78350f" }}>
                  ⚠️ No prescriptions found for this patient.
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      <Modal open={modal} onClose={() => setModal(false)}
             title={form.appointmentId ? "Edit Appointment" : "New Appointment"}
             width="720px">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <Field label="Patient" required>
            <div style={{ position: "relative" }}>
              <input
                value={patientQuery}
                onChange={(e) => handlePatientSearch(e.target.value)}
                onFocus={() => {
                  if (!form.customerId || !patientQuery.trim()) {
                    setShowPatientSuggestions(true);
                  }
                }}
                onBlur={() => setTimeout(() => setShowPatientSuggestions(false), 120)}
                placeholder="Type patient name or contact..."
                style={inputStyle}
                autoComplete="off"
              />
              {showPatientSuggestions && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0,
                  background: "#fff", border: "1px solid #cbd5e1",
                  borderRadius: "8px", boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
                  zIndex: 20, maxHeight: "220px", overflowY: "auto",
                }}>
                  {patientSuggestions.length > 0 ? (
                    patientSuggestions.map((p) => (
                      <div
                        key={p.custId}
                        onMouseDown={() => selectPatient(p)}
                        style={{ padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}
                      >
                        <div style={{ fontWeight: 600 }}>{p.custName}</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>{p.custContact}</div>
                      </div>
                    ))
                  ) : (
                    <div
                      onMouseDown={() => onOpenPatients && onOpenPatients()}
                      style={{ padding: "10px 12px", cursor: onOpenPatients ? "pointer" : "default", color: onOpenPatients ? "#2563eb" : "#64748b" }}
                    >
                      No patients found. Click to add a new patient.
                    </div>
                  )}
                </div>
              )}
            </div>
          </Field>

          <Field label="Doctor" required>
            <select
              name="doctorId"
              value={form.doctorId}
              onChange={handle}
              disabled={session.role === "DOCTOR"}
              style={inputStyle}
            >
              <option value="">-- Select doctor --</option>
              {doctors.map((doc) => (
                <option key={doc.userId} value={doc.userId}>
                  {doc.userName} — {doc.specialization || "General"}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Department">
            <input name="department" value={form.department} onChange={handle} style={inputStyle} />
          </Field>

          <Field label="Consultation Fees">
            <input type="number" name="fees" value={form.fees} onChange={handle} style={inputStyle} />
          </Field>

          <Field label="Appointment Date" required>
            <input type="date" name="appointmentDate" value={form.appointmentDate} onChange={handle} style={inputStyle} />
          </Field>

          <Field label="Time Slot">
            <select name="timeSlot" value={form.timeSlot} onChange={handle} style={inputStyle}>
              <option value="">-- Select --</option>
              {TIME_SLOTS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>

          <Field label="Status">
            <select name="status" value={form.status} onChange={handle} style={inputStyle}>
              <option>Pending</option>
              <option>Confirmed</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          </Field>
        </div>

        <Field label="Reason / Notes">
          <textarea name="reason" value={form.reason} onChange={handle}
            rows="3" style={{ ...inputStyle, resize: "vertical" }}
            placeholder="Reason for visit..." />
        </Field>

        <div style={{ display: "flex", gap: "12px" }}>
          <button style={btnPrimary} onClick={save}>
            {form.appointmentId ? "Update" : "Book Appointment"}
          </button>
          <button style={{ ...btnPrimary, background: "#64748b" }} onClick={() => setModal(false)}>
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
