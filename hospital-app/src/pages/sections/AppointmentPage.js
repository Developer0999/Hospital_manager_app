import React, { useEffect, useState, useMemo } from "react";
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
import { buildAppointmentMessage, buildWhatsAppUrl, normalizeWhatsAppPhone } from "./whatsappUtils";

const emptyForm = (hid) => ({
  appointmentId: "", hospitalId: hid,
  doctorId: "", customerId: "",
  patientName: "", custContact: "", doctorName: "", department: "",
  appointmentDate: "", timeSlot: "", sessionNumber: "", visitType: "", reason: "",
  status: "Pending", fees: "",
});

const TIME_SLOTS = Array.from({ length: 25 }, (_, index) => {
  const totalMinutes = index * 30;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const period = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
});
const VISIT_TYPES = ["Treatment Completed", "Checkup", "General", "Follow-up", "Consultation", "Emergency", "Other"];
const SESSION_OPTIONS = Array.from({ length: 10 }, (_, index) => `Session ${index + 1}`);

const getSessionVisitLabel = (appointment) => {
  const session = appointment.sessionNumber ? `Session ${appointment.sessionNumber}` : "";
  const visitType = appointment.visitType || "";
  return [session, visitType].filter(Boolean).join(" / ") || "Not set — edit appointment";
};

/* ── Status colour map ─────────────────────────────────────────────────── */
const STATUS_STYLES = {
  Pending:   { background: "#fef9c3", color: "#854d0e", border: "1px solid #fde047" },
  Confirmed: { background: "#dbeafe", color: "#1e40af", border: "1px solid #93c5fd" },
  Completed: { background: "#dcfce7", color: "#166534", border: "1px solid #86efac" },
  Cancelled: { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" },
};

const statusBadge = (status) => {
  const s = STATUS_STYLES[status] || { background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" };
  return (
    <span style={{
      ...s,
      padding: "4px 12px", borderRadius: 20, fontSize: 11,
      fontWeight: 700, display: "inline-block",
    }}>
      {status || "—"}
    </span>
  );
};

const rowBg = (status) => {
  if (status === "Completed") return "#f0fdf4";
  if (status === "Cancelled") return "#fff5f5";
  if (status === "Confirmed") return "#eff6ff";
  return "#fff"; // Pending
};

export default function AppointmentPage({ session, onOpenPatients, onOpenPrescription }) {
  const todayDate = new Date().toISOString().split("T")[0];

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
  const [whatsAppConfirmation, setWhatsAppConfirmation] = useState(null);
  const [historyModal,        setHistoryModal] = useState(false);
  const [historyPatient,      setHistoryPatient] = useState("");
  const [historyPatientId,    setHistoryPatientId] = useState("");
  const [historyRecords,      setHistoryRecords] = useState([]);
  const [historyPrescriptions, setHistoryPrescriptions] = useState([]);
  const [uploadedFiles,       setUploadedFiles] = useState({});
  const [expandedAppts,       setExpandedAppts] = useState({});
  const [search,              setSearch]  = useState("");
  // Default: filter to today's appointments
  const [startDate,           setStartDate] = useState(todayDate);
  const [endDate,             setEndDate]   = useState(todayDate);
  const [statusFilter,        setStatusFilter] = useState("All");
  const [viewingFromHistory,  setViewingFromHistory] = useState(false);
  const [historyState,        setHistoryState] = useState(null);

  const getHospitalContactValue = () => {
    const contact = session?.hospitalInfo?.contactNo || session?.hospitalContact || session?.contactNo || "";
    return String(contact || "").trim();
  };

  const resolveCustomerContact = (appointment, fallbackForm = null) => {
    const directContact = appointment?.custContact || appointment?.patientContact || appointment?.contact || fallbackForm?.custContact || "";
    if (directContact) return directContact;

    const customerId = appointment?.customerId || appointment?.custId || appointment?.customer || "";
    const patientName = appointment?.patientName || appointment?.custName || "";

    const matchedPatient = patients.find((p) => {
      const sameId = customerId && String(p.custId) === String(customerId);
      const sameName = patientName && String(p.custName || "").trim().toLowerCase() === String(patientName).trim().toLowerCase();
      return sameId || sameName;
    });

    return matchedPatient?.custContact || "";
  };

  const resolveWhatsAppPhone = () => {
    return getHospitalContactValue();
  };

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
    if (name === "sessionOrVisit") {
      setForm((f) => ({
        ...f,
        sessionNumber: SESSION_OPTIONS.includes(value) ? value.slice("Session ".length) : "",
        visitType: VISIT_TYPES.includes(value) ? value : "",
      }));
      return;
    }

    let updated = { ...form, [name]: value };
    if (name === "appointmentDate") updated.timeSlot = "";
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
    setForm((f) => ({ ...f, customerId: "", patientName: value, custContact: "" }));
  };

  const selectPatient = (cust) => {
    setForm((f) => ({ ...f, customerId: cust.custId, patientName: cust.custName, custContact: cust.custContact || "" }));
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

  const openNew = () => {
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
    setForm({
      ...a,
      sessionNumber: a.sessionNumber == null ? "" : String(a.sessionNumber),
      visitType: a.visitType || "",
      custContact: resolveCustomerContact(a) || a.custContact || "",
    });
    setPatientQuery(a.patientName || "");
    setDoctorQuery(a.doctorName ? `${a.doctorName} — ${a.department || "General"}` : "");
    setShowPatientSuggestions(false);
    setShowDoctorSuggestions(false);
    setModal(true);
  };

  const selectedDoctor = useMemo(
    () => doctors.find((d) => String(d.userId) === String(form.doctorId)),
    [doctors, form.doctorId]
  );

  const unavailableSlots = useMemo(() => {
    if (!form.doctorId || !form.appointmentDate) return [];
    return appts
      .filter((a) =>
        String(a.doctorId) === String(form.doctorId) &&
        a.appointmentDate === form.appointmentDate &&
        a.status !== "Cancelled" &&
        String(a.appointmentId) !== String(form.appointmentId)
      )
      .map((a) => a.timeSlot || "")
      .filter(Boolean);
  }, [appts, form.doctorId, form.appointmentDate, form.appointmentId]);

  const availableSlots = TIME_SLOTS;

  useEffect(() => {
    if (!form.timeSlot) return;
    if (!form.doctorId || !form.appointmentDate) {
      setForm((f) => ({ ...f, timeSlot: "" }));
      return;
    }
    if (!availableSlots.includes(form.timeSlot) || unavailableSlots.includes(form.timeSlot)) {
      setForm((f) => ({ ...f, timeSlot: "" }));
    }
  }, [form.doctorId, form.appointmentDate, availableSlots, unavailableSlots, form.timeSlot]);

  const openWhatsAppChat = (appointment, mode = "booking") => {
    const contactNumber = resolveCustomerContact(appointment) || resolveWhatsAppPhone() || "";
    const normalizedPhone = normalizeWhatsAppPhone(contactNumber);
    if (!normalizedPhone) {
      alert("Contact number is missing. Please add a phone number before sending WhatsApp.");
      return;
    }

    const message = buildAppointmentMessage(appointment, mode, getHospitalContactValue());
    const url = buildWhatsAppUrl(normalizedPhone, message);
    if (!url) {
      alert("Unable to create WhatsApp link.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const sendWhatsAppMessage = (appointment, mode = "booking") => {
    openWhatsAppChat(appointment, mode);
  };

  const save = async () => {
    if (!form.patientName || !form.appointmentDate) {
      alert("Patient and Date are required."); return;
    }
    if (!form.doctorId) {
      alert("Please select a doctor before booking a slot."); return;
    }
    if (!form.timeSlot) {
      alert("Please select a time slot."); return;
    }
    if (!form.sessionNumber && !form.visitType) {
      alert("Please select a session or visit type."); return;
    }
    if (unavailableSlots.includes(form.timeSlot)) {
      alert("This time slot is already booked for the selected doctor and date."); return;
    }
    try {
      const isNewAppointment = !form.appointmentId;
      let savedAppointment = null;
      if (!isNewAppointment) {
        await AppointmentAPI.update(form.appointmentId, form);
        savedAppointment = { ...form };
      } else {
        const response = await AppointmentAPI.create(form, session.hospitalId, form.customerId, form.doctorId);
        savedAppointment = response?.data || { ...form };
      }

      if (savedAppointment && isNewAppointment) {
        const customerContact = resolveCustomerContact({
          ...savedAppointment,
          patientName: savedAppointment.patientName || form.patientName,
          doctorName: savedAppointment.doctorName || form.doctorName,
          department: savedAppointment.department || form.department,
          appointmentDate: savedAppointment.appointmentDate || form.appointmentDate,
          timeSlot: savedAppointment.timeSlot || form.timeSlot,
          reason: savedAppointment.reason || form.reason,
          fees: savedAppointment.fees || form.fees,
          custContact: savedAppointment.custContact || form.custContact || patients.find((p) => String(p.custId) === String(form.customerId))?.custContact || "",
        }, form);

        setWhatsAppConfirmation({
          ...savedAppointment,
          patientName: savedAppointment.patientName || form.patientName,
          doctorName: savedAppointment.doctorName || form.doctorName,
          department: savedAppointment.department || form.department,
          appointmentDate: savedAppointment.appointmentDate || form.appointmentDate,
          timeSlot: savedAppointment.timeSlot || form.timeSlot,
          reason: savedAppointment.reason || form.reason,
          fees: savedAppointment.fees || form.fees,
          custContact: customerContact,
        });
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
    // Open prescription in edit mode with all previous data
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

  const canWrite = session.role !== "DOCTOR" ;

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
    if (pendingFiles.length === 0) { alert("No files to upload"); return; }
    try {
      await PrescriptionAPI.uploadReports(prescriptionId, pendingFiles);
      setUploadedFiles(prev => ({
        ...prev,
        [prescriptionId]: files.map(f => ({ ...f, saved: true })),
      }));
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
    } catch { return dateStr; }
  };

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
    { label: "Total",     value: appts.length,                                           color: "#0d6efd" },
    { label: "Today",     value: appts.filter((a) => a.appointmentDate === todayDate).length, color: "#198754" },
    { label: "Pending",   value: appts.filter((a) => a.status === "Pending").length,     color: "#fd7e14" },
    { label: "Completed", value: appts.filter((a) => a.status === "Completed").length,   color: "#8b5cf6" },
  ];
  const reminderOptions = [
    { label: "Reminder", value: "reminder" },
    { label: "1 Day Before", value: "reminder-1day" },
    { label: "2 Hours Before", value: "reminder-2hours" },
  ];

  const clearDateFilter = () => { setStartDate(""); setEndDate(""); };
  const setTodayFilter  = () => { setStartDate(todayDate); setEndDate(todayDate); setStatusFilter("All"); };

  return (
    <div>
      <PageTitle icon="📅" title="Appointments" subtitle="Manage all hospital appointments" />

      <div style={statsGrid}>
        {summaryCards.map((c, i) => (
          <div key={i} style={{
            background: "#fff", borderRadius: "14px", padding: "20px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
            textAlign: "center", borderTop: `4px solid ${c.color}`,
            cursor: "pointer",
          }} onClick={() => {
            if (c.label === "Today") { setTodayFilter(); }
            else if (c.label === "Pending") { clearDateFilter(); setStatusFilter("Pending"); }
            else if (c.label === "Completed") { clearDateFilter(); setStatusFilter("Completed"); }
            else { clearDateFilter(); setStatusFilter("All"); }
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
            <button style={{ ...btnInfo, padding: "8px 14px" }} onClick={clearDateFilter}>Clear</button>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            {["All", "Pending", "Confirmed", "Completed", "Cancelled"].map((status) => {
              const active = statusFilter === status;
              const s = STATUS_STYLES[status];
              return (
                <button key={status}
                  style={{
                    padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                    cursor: "pointer", transition: "all 0.15s",
                    border: active ? "2px solid #1d4ed8" : (s ? s.border : "1px solid #e2e8f0"),
                    background: active ? "#1d4ed8" : (s ? s.background : "#f1f5f9"),
                    color: active ? "#fff" : (s ? s.color : "#475569"),
                  }}
                  onClick={() => setStatusFilter(status)}>
                  {status}
                </button>
              );
            })}
            <button style={{ ...btnInfo, padding: "8px 14px", background: "#f0fdf4", color: "#166534", border: "1px solid #86efac" }}
              onClick={setTodayFilter}>📅 Today</button>
          </div>
        </div>

        {/* Active filter indicator */}
        {(startDate || endDate || statusFilter !== "All") && (
          <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center", fontSize: 12 }}>
            <span style={{ color: "#64748b" }}>Showing:</span>
            {(startDate || endDate) && (
              <span style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 6, padding: "2px 10px", fontWeight: 600 }}>
                {startDate === endDate && startDate ? (startDate === todayDate ? "Today" : startDate) : `${startDate || "…"} → ${endDate || "…"}`}
              </span>
            )}
            {statusFilter !== "All" && (
              <span style={{ ...(STATUS_STYLES[statusFilter] || {}), borderRadius: 6, padding: "2px 10px", fontWeight: 600 }}>
                {statusFilter}
              </span>
            )}
            <button onClick={() => { clearDateFilter(); setStatusFilter("All"); }}
              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12, padding: "0 4px" }}>
              ✕ Clear all
            </button>
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["ID", "Patient", "Session / Visit Type", "Contact", "Doctor", "Dept", "Date", "Time", "Fees", "Status", "Action"].map(c => (
                  <th key={c} style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, color: "#475569", fontWeight: 700, borderBottom: "2px solid #e2e8f0" }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                    No appointments found
                  </td>
                </tr>
              ) : filtered.map((a) => (
                <tr key={a.appointmentId}
                  style={{ borderBottom: "1px solid #f1f5f9", background: rowBg(a.status), transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.filter = "brightness(0.97)"}
                  onMouseLeave={e => e.currentTarget.style.filter = "none"}>
                  <td style={{ padding: "11px 14px", color: "#94a3b8", fontSize: 13 }}>{a.appointmentId}</td>
                  <td style={{ padding: "11px 14px", fontWeight: 600 }}>{a.patientName || "—"}</td>
                  <td style={{ padding: "11px 14px", fontSize: 13 }}>{getSessionVisitLabel(a)}</td>
                  <td style={{ padding: "11px 14px", fontSize: 13, color: "#64748b" }}>
                    {resolveCustomerContact(a) ? (
                      <button
                        type="button"
                        onClick={() => openWhatsAppChat(a, "reminder")}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          color: "#2563eb",
                          cursor: "pointer",
                          textDecoration: "underline",
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {resolveCustomerContact(a)}
                      </button>
                    ) : "—"}
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: 13 }}>{a.doctorName || "—"}</td>
                  <td style={{ padding: "11px 14px", fontSize: 13, color: "#64748b" }}>{a.department || "—"}</td>
                  <td style={{ padding: "11px 14px", fontSize: 13 }}>{a.appointmentDate || "—"}</td>
                  <td style={{ padding: "11px 14px", fontSize: 13 }}>{a.timeSlot || "—"}</td>
                  <td style={{ padding: "11px 14px", fontSize: 13 }}>{a.fees ? `₹${a.fees}` : "—"}</td>
                  <td style={{ padding: "11px 14px" }}>{statusBadge(a.status)}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                      {/* {session.role === "DOCTOR" && a.status === "Confirmed" && (
                        <button style={btnSuccess} onClick={() => quickStatus(a, "Completed")}>✓ Done</button>
                      )} */}
                      {canWrite && a.status === "Pending" && (
                        <button style={btnInfo} onClick={() => quickStatus(a, "Confirmed")}>Confirm</button>
                      )}
                      
                      { canWrite && a.status !== "Completed" &&(
                       
                          <button style={btnWarning} onClick={() => openEdit(a)}>Edit</button>
                        
                      )}
                      {canWrite && a.status !== "Completed" && (
                        <button style={btnDanger} onClick={() => del(a.appointmentId)}>Del</button>
                      )}
                      <select
                        aria-label="Reminder type"
                        defaultValue="reminder"
                        onChange={(e) => sendWhatsAppMessage(a, e.target.value)}
                        style={{
                          padding: "6px 8px",
                          borderRadius: 6,
                          border: "1px solid #cbd5e1",
                          background: "#fff7ed",
                          color: "#92400e",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {reminderOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {onOpenPrescription && session.role === "DOCTOR" || session.role === "HOSPITAL_ADMIN" && a.status === "Confirmed" && (
                        <button style={btnInfo} onClick={() => openPrescriptionForAppointment(a)}>💊 Rx</button>
                      )}
                      <button style={{ ...btnInfo, background: "#f0fdf4", color: "#166534" }} onClick={() => viewPatientHistory(a)}>📋 History</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── PATIENT HISTORY MODAL ── */}
      <Modal open={historyModal} onClose={() => setHistoryModal(false)}
             title={`📋 Patient History — ${historyPatient}`}
             width="900px">
        <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {historyRecords.length === 0 ? (
            <p style={{ color: "#64748b", margin: 0, padding: "20px", textAlign: "center" }}>
              No appointment history found for this patient.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                📅 Appointments & Prescriptions
              </h3>
              
              {/* Interleaved Appointments and Prescriptions */}
              {historyRecords.map((h) => {
                // Find prescription for this appointment
                const appointmentPrescription = historyPrescriptions.find(
                  (p) => String(p.appointmentId) === String(h.appointmentId)
                );
                
                const medicines = (() => {
                  if (!appointmentPrescription) return [];
                  try {
                    const parsed = JSON.parse(appointmentPrescription.medicinesJson || "[]");
                    return Array.isArray(parsed) ? parsed : [];
                  } catch { return []; }
                })();

                return (
                  <div key={h.appointmentId} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {/* APPOINTMENT CARD */}
                    <div style={{
                      background: rowBg(h.status),
                      border: `1px solid ${STATUS_STYLES[h.status]?.border?.replace("1px solid ", "") || "#e2e8f0"}`,
                      borderRadius: "8px", padding: "12px", transition: "all 0.2s",
                    }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", fontSize: "13px" }}>
                        <div><b>📆 Date:</b> {formatDate(h.appointmentDate)}</div>
                        <div><b>⏰ Time:</b> {h.timeSlot || "—"}</div>
                        <div><b>👨‍⚕️ Doctor:</b> {h.doctorName || "—"}</div>
                        <div><b>Status:</b> {statusBadge(h.status)}</div>
                      </div>
                      {h.reason && <div style={{ fontSize: "12px", color: "#475569", marginTop: "8px", fontStyle: "italic" }}>📝 Reason: {h.reason}</div>}
                      {h.fees && <div style={{ fontSize: "12px", color: "#475569", marginTop: "4px" }}>💰 Fees: ₹{h.fees}</div>}
                    </div>

                    {/* PRESCRIPTION CARD */}
                    {appointmentPrescription ? (
                      <div style={{
                        background: "#fff", border: "2px solid #dbeafe", borderRadius: "10px",
                        padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginLeft: "20px",
                      }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "12px", marginBottom: "12px", paddingBottom: "12px", borderBottom: "1.5px solid #eff6ff", alignItems: "center" }}>
                          <div><b>💊 Prescription ID:</b> {appointmentPrescription.prescriptionId || "—"}</div>
                          <div><b>📆 Date:</b> {formatDate(appointmentPrescription.prescriptionDate)}</div>
                          <div><b>👨‍⚕️ Doctor:</b> {appointmentPrescription.doctorName || "—"}</div>
                          {onOpenPrescription && (
                            <button onClick={() => openPrescriptionFromHistory(appointmentPrescription)}
                              style={{
                                padding: "6px 14px", background: "#6366f1", color: "#fff",
                                border: "none", borderRadius: "6px", cursor: "pointer",
                                fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap",
                              }}>
                              ✏️ Edit Rx
                            </button>
                          )}
                        </div>

                        {(appointmentPrescription.complaints || appointmentPrescription.diagnosis) && (
                          <div style={{ marginBottom: "12px", fontSize: "13px" }}>
                            {appointmentPrescription.complaints && (
                              <div style={{ marginBottom: "6px" }}>
                                <b>🔍 Complaints:</b> <span style={{ color: "#475569" }}>{appointmentPrescription.complaints}</span>
                              </div>
                            )}
                            {appointmentPrescription.diagnosis && (
                              <div>
                                <b>📋 Diagnosis:</b> <span style={{ color: "#475569" }}>{appointmentPrescription.diagnosis}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {medicines.length > 0 && (
                          <div style={{ marginBottom: "12px" }}>
                            <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "8px", textTransform: "uppercase" }}>
                              💉 Medicines ({medicines.length})
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
                                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                    <td style={{ padding: "6px", fontWeight: 600 }}>{med.medicineName || "—"}</td>
                                    <td style={{ padding: "6px", textAlign: "center" }}>{med.morning ? "✓" : "—"}</td>
                                    <td style={{ padding: "6px", textAlign: "center" }}>{med.afternoon ? "✓" : "—"}</td>
                                    <td style={{ padding: "6px", textAlign: "center" }}>{med.night ? "✓" : "—"}</td>
                                    <td style={{ padding: "6px" }}>{med.days || "—"}</td>
                                    <td style={{ padding: "6px", fontSize: "11px", color: "#475569", maxWidth: "200px", wordBreak: "break-word" }}>{med.note || "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {(appointmentPrescription.medicalInstructions || appointmentPrescription.patientNotes) && (
                          <div style={{ marginBottom: "12px", fontSize: "13px" }}>
                            {appointmentPrescription.medicalInstructions && (
                              <div style={{ marginBottom: "6px", padding: "8px", background: "#fef3c7", borderLeft: "3px solid #f59e0b", borderRadius: "4px" }}>
                                <b>📌 Instructions:</b> <span style={{ color: "#475569" }}>{appointmentPrescription.medicalInstructions}</span>
                              </div>
                            )}
                            {appointmentPrescription.patientNotes && (
                              <div style={{ padding: "8px", background: "#dbeafe", borderLeft: "3px solid #3b82f6", borderRadius: "4px" }}>
                                <b>📝 Patient Notes:</b> <span style={{ color: "#475569" }}>{appointmentPrescription.patientNotes}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Report Upload */}
                        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1.5px solid #eff6ff" }}>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "8px", textTransform: "uppercase" }}>
                            📤 Reports
                          </div>
                          <label style={{
                            display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
                            padding: "12px", border: "2px dashed #bfdbfe", borderRadius: "8px",
                            background: "#f0f9ff", cursor: "pointer",
                          }}
                          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#3b82f6"; }}
                          onDragLeave={e => { e.currentTarget.style.borderColor = "#bfdbfe"; }}
                          onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#bfdbfe"; addReportFiles(appointmentPrescription.prescriptionId, e.dataTransfer.files); }}>
                            <span style={{ fontSize: "20px" }}>📄</span>
                            <div style={{ fontSize: "12px", fontWeight: 600, color: "#1e40af" }}>Drag & drop or click to upload</div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>PDF, JPG, PNG</div>
                            <input type="file" accept="application/pdf,image/*" multiple
                              onChange={e => { addReportFiles(appointmentPrescription.prescriptionId, e.target.files); e.target.value = ""; }}
                              style={{ display: "none" }} />
                          </label>

                          {(uploadedFiles[appointmentPrescription.prescriptionId]?.length > 0) && (
                            <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                              {uploadedFiles[appointmentPrescription.prescriptionId]?.map((f, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "6px 10px" }}>
                                  <span>{f.name.endsWith(".pdf") ? "📄" : "🖼️"}</span>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: "12px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                                    <div style={{ fontSize: "10px", color: f.saved ? "#059669" : "#f59e0b" }}>{f.saved ? "✓ Saved" : "⏳ Pending"}</div>
                                  </div>
                                  <a href={f.url} target="_blank" rel="noreferrer"
                                    style={{ fontSize: "10px", color: "#1d4ed8", textDecoration: "none", background: "#eff6ff", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
                                    Open
                                  </a>
                                  {!f.saved && (
                                    <button onClick={() => removeReportFile(appointmentPrescription.prescriptionId, i)}
                                      style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "4px", width: "20px", height: "20px", cursor: "pointer", fontSize: "10px" }}>✕</button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {appointmentPrescription.reportUrl && !uploadedFiles[appointmentPrescription.prescriptionId]?.some(f => !f.saved) && (
                            <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", padding: "6px 10px" }}>
                              <span>📄</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "12px", fontWeight: 600 }}>{appointmentPrescription.reportName || "Uploaded report"}</div>
                                <div style={{ fontSize: "10px", color: "#059669" }}>✓ Saved</div>
                              </div>
                              <a href={appointmentPrescription.reportUrl} target="_blank" rel="noreferrer"
                                style={{ fontSize: "10px", color: "#1d4ed8", textDecoration: "none", background: "#eff6ff", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
                                Open
                              </a>
                            </div>
                          )}

                          {uploadedFiles[appointmentPrescription.prescriptionId]?.some(f => !f.saved) && (
                            <button onClick={() => uploadReports(appointmentPrescription.prescriptionId)}
                              style={{ marginTop: "8px", width: "100%", padding: "8px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
                              ☁️ Upload Reports
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginLeft: "20px", padding: "12px", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: "8px", fontSize: "12px", color: "#78350f" }}>
                        ⚠️ No prescription for this appointment
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* ── NEW / EDIT APPOINTMENT MODAL ── */}
      <Modal open={modal} onClose={() => setModal(false)}
             title={form.appointmentId ? "Edit Appointment" : "New Appointment"}
             width="720px">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <Field label="Patient" required>
            <div style={{ position: "relative" }}>
              <input
                value={patientQuery}
                onChange={(e) => handlePatientSearch(e.target.value)}
                onFocus={() => { if (!form.customerId || !patientQuery.trim()) setShowPatientSuggestions(true); }}
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
                      <div key={p.custId} onMouseDown={() => selectPatient(p)}
                        style={{ padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ fontWeight: 600 }}>{p.custName}</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>{p.custContact}</div>
                      </div>
                    ))
                  ) : (
                    <div onMouseDown={() => onOpenPatients && onOpenPatients()}
                      style={{ padding: "10px 12px", cursor: onOpenPatients ? "pointer" : "default", color: onOpenPatients ? "#2563eb" : "#64748b" }}>
                      No patients found. Click to add a new patient.
                    </div>
                  )}
                </div>
              )}
            </div>
          </Field>

          <Field label="Doctor" required>
            <select name="doctorId" value={form.doctorId} onChange={handle}
              disabled={session.role === "DOCTOR"} style={inputStyle}>
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

          <Field label="Time Slot" required>
            <select
              name="timeSlot"
              value={form.timeSlot}
              onChange={handle}
              disabled={!form.appointmentDate || !form.doctorId}
              style={inputStyle}
            >
              <option value="">-- Select time --</option>
              {availableSlots.map((t) => (
                <option key={t} value={t} disabled={unavailableSlots.includes(t)}>
                  {t}{unavailableSlots.includes(t) ? " — Booked" : ""}
                </option>
              ))}
            </select>
            {(!form.appointmentDate || !form.doctorId) && (
              <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                Select an appointment date and doctor to choose a time.
              </div>
            )}
          </Field>

          <Field label="Session / Visit Type" required>
            <select
              name="sessionOrVisit"
              value={form.sessionNumber ? `Session ${form.sessionNumber}` : (form.visitType || "")}
              onChange={handle}
              style={inputStyle}
            >
              <option value="">-- Select session or visit type --</option>
              <optgroup label="Sessions">
                {SESSION_OPTIONS.map((session) => <option key={session} value={session}>{session}</option>)}
              </optgroup>
              <optgroup label="Visit Types">
                {VISIT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </optgroup>
            </select>
            {form.appointmentId && !form.sessionNumber && !form.visitType && (
              <div style={{ marginTop: 6, fontSize: 12, color: "#b45309" }}>
                No session or visit type was saved for this appointment. Select one and update to save it.
              </div>
            )}
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

      <Modal
        open={Boolean(whatsAppConfirmation)}
        onClose={() => setWhatsAppConfirmation(null)}
        title="Send WhatsApp Message?"
        width="440px"
      >
        <p style={{ margin: "0 0 20px", color: "#475569", lineHeight: 1.5 }}>
          Appointment booked successfully. Would you like to open WhatsApp with an appointment message for the patient?
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button
            style={{ ...btnPrimary, background: "#64748b" }}
            onClick={() => setWhatsAppConfirmation(null)}
          >
            No
          </button>
          <button
            style={btnSuccess}
            onClick={() => {
              sendWhatsAppMessage(whatsAppConfirmation, "booking");
              setWhatsAppConfirmation(null);
            }}
          >
            Yes, Open WhatsApp
          </button>
        </div>
      </Modal>
    </div>
  );
}