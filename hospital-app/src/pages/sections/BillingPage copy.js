import React, { useEffect, useMemo, useState } from "react";
import { getAppointmentsByHospital, updateAppointment } from "../../api";
import { PageTitle, Card, StatusBadge, inputStyle, btnPrimary, btnSuccess, btnWarning, btnDanger, statsGrid } from "../../components/UI";

const currency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const defaultFilters = {
  startDate: "",
  endDate: "",
  preset: "all",
  doctor: "",
  department: "",
  paymentStatus: "",
  paymentMethod: "",
  patientName: "",
  patientId: "",
  invoiceNumber: "",
};

const quickRanges = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
  { key: "custom", label: "Custom" },
];

const normalizeBill = (appointment, index) => {
  const fees = Number(appointment.fees || appointment.amount || appointment.billAmount || 0);
  const discount = Number(appointment.discount || 0);
  const tax = Number(appointment.tax || 0);
  const insuranceAmount = Number(appointment.insuranceAmount || 0);
  const refundAmount = Number(appointment.refundAmount || 0);
  const paymentStatus = appointment.paymentStatus || (appointment.status === "Completed" ? "Paid" : appointment.status === "Cancelled" ? "Cancelled" : "Pending");
  const paymentMethod = appointment.paymentMethod || (paymentStatus === "Paid" ? "Cash" : "");
  const paidAmount = paymentStatus === "Paid" ? fees - discount + tax - refundAmount : paymentStatus === "Partial" ? Math.round(fees * 0.6) : 0;
  const pendingAmount = Math.max(0, fees - discount + tax - refundAmount - paidAmount);

  return {
    id: appointment.appointmentId || appointment.id || `bill-${index + 1}`,
    appointmentId: appointment.appointmentId || appointment.id || `bill-${index + 1}`,
    invoiceNumber: appointment.invoiceNumber || `INV-${String(appointment.appointmentId || index + 1).padStart(4, "0")}`,
    patientName: appointment.patientName || appointment.custName || "—",
    patientId: appointment.patientId || appointment.custId || "—",
    doctorName: appointment.doctorName || appointment.docName || "—",
    department: appointment.department || appointment.specialization || "General Medicine",
    appointmentDate: appointment.appointmentDate || appointment.date || appointment.createdAt || "",
    serviceName: appointment.serviceName || appointment.department || "Consultation",
    fees,
    discount,
    tax,
    insuranceAmount,
    refundAmount,
    paymentStatus,
    paymentMethod,
    paidAmount,
    pendingAmount,
    status: appointment.status || "Pending",
    notes: appointment.notes || "",
    contact: appointment.contact || appointment.patientContact || "",
  };
};

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getDateRangeBounds = (preset, startDate, endDate) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  switch (preset) {
    case "today": return { startDate: today.toISOString().slice(0, 10), endDate: today.toISOString().slice(0, 10) };
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return { startDate: yesterday.toISOString().slice(0, 10), endDate: yesterday.toISOString().slice(0, 10) };
    }
    case "week": return { startDate: startOfWeek.toISOString().slice(0, 10), endDate: today.toISOString().slice(0, 10) };
    case "month": return { startDate: startOfMonth.toISOString().slice(0, 10), endDate: today.toISOString().slice(0, 10) };
    case "year": return { startDate: startOfYear.toISOString().slice(0, 10), endDate: today.toISOString().slice(0, 10) };
    case "custom": return { startDate, endDate };
    default: return { startDate: "", endDate: "" };
  }
};

const LineChart = ({ data, color = "#2563eb" }) => {
  if (!data.length) {
    return <div style={{ color: "#64748b", padding: "24px 0", textAlign: "center" }}>No trend data yet.</div>;
  }
  const width = 320;
  const height = 160;
  const padding = 20;
  const maxVal = Math.max(...data.map((item) => item.value), 1);
  const points = data.map((item, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - (item.value / maxVal) * (height - padding * 2);
    return { x, y, label: item.label, value: item.value };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "180px" }}>
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#cbd5e1" />
      <path d={path} fill="none" stroke={color} strokeWidth="3" />
      {points.map((point) => (
        <g key={point.label}>
          <circle cx={point.x} cy={point.y} r="4" fill={color} />
          <text x={point.x} y={height - 4} textAnchor="middle" fontSize="10" fill="#64748b">{point.label}</text>
        </g>
      ))}
    </svg>
  );
};

const BarChart = ({ data, color = "#0ea5e9" }) => {
  if (!data.length) {
    return <div style={{ color: "#64748b", padding: "24px 0", textAlign: "center" }}>No chart data.</div>;
  }
  const width = 320;
  const height = 180;
  const padding = 24;
  const maxVal = Math.max(...data.map((item) => item.value), 1);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "180px" }}>
      {data.map((item, index) => {
        const barWidth = 34;
        const gap = 16;
        const x = padding + index * (barWidth + gap);
        const barHeight = (item.value / maxVal) * (height - padding * 2);
        const y = height - padding - barHeight;
        return (
          <g key={item.label}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx="6" fill={color} />
            <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" fontSize="10" fill="#64748b">{item.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

const PieChart = ({ data }) => {
  if (!data.length) {
    return <div style={{ color: "#64748b", padding: "24px 0", textAlign: "center" }}>No payment method data.</div>;
  }
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let offset = 0;
  const gradientParts = data.map((item) => {
    const start = offset;
    const end = offset + (item.value / total) * 360;
    offset = end;
    return `${item.color} ${start}deg ${end}deg`;
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
      <div style={{ width: 150, height: 150, borderRadius: "50%", background: `conic-gradient(${gradientParts.join(",")})`, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        {data.map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: item.color }} />
              {item.label}
            </span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function BillingPage({ session }) {
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortKey, setSortKey] = useState("appointmentDate");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("monthly");
  const [detailBill, setDetailBill] = useState(null);
  const [editBill, setEditBill] = useState(null);
  const [editDraft, setEditDraft] = useState({});

  const role = String(session?.role || session?.userRole || "").toUpperCase();
  const isAdmin = role.includes("ADMIN") || role.includes("HOSPITAL_ADMIN");

  const load = async () => {
    if (!session?.hospitalId) {
      setAppts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await getAppointmentsByHospital(session.hospitalId);
      setAppts((response?.data || []).map(normalizeBill));
    } catch (error) {
      console.error(error);
      setAppts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [session?.hospitalId]);
  useEffect(() => { setPage(1); setSelectedIds([]); }, [search, filters.startDate, filters.endDate, filters.preset, filters.doctor, filters.department, filters.paymentStatus, filters.paymentMethod, filters.patientName, filters.patientId, filters.invoiceNumber]);

  const effectiveFilters = useMemo(() => getDateRangeBounds(filters.preset, filters.startDate, filters.endDate), [filters.preset, filters.startDate, filters.endDate]);

  const filteredBills = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    const patientTerm = filters.patientName.trim().toLowerCase();
    const patientIdTerm = filters.patientId.trim().toLowerCase();
    const invoiceTerm = filters.invoiceNumber.trim().toLowerCase();
    return appts.filter((bill) => {
      const billDate = parseDate(bill.appointmentDate);
      const startDate = effectiveFilters.startDate ? parseDate(effectiveFilters.startDate) : null;
      const endDate = effectiveFilters.endDate ? parseDate(effectiveFilters.endDate) : null;
      const inRange = !billDate || (!startDate && !endDate) || (startDate && endDate && billDate >= startDate && billDate <= endDate) || (startDate && !endDate && billDate >= startDate) || (!startDate && endDate && billDate <= endDate);
      const matchesDoctor = !filters.doctor || (bill.doctorName || "").toLowerCase().includes(filters.doctor.toLowerCase());
      const matchesDepartment = !filters.department || (bill.department || "").toLowerCase().includes(filters.department.toLowerCase());
      const matchesPaymentStatus = !filters.paymentStatus || bill.paymentStatus === filters.paymentStatus;
      const matchesPaymentMethod = !filters.paymentMethod || bill.paymentMethod === filters.paymentMethod;
      const matchesPatientName = !patientTerm || (bill.patientName || "").toLowerCase().includes(patientTerm);
      const matchesPatientId = !patientIdTerm || String(bill.patientId || "").toLowerCase().includes(patientIdTerm);
      const matchesInvoice = !invoiceTerm || String(bill.invoiceNumber || "").toLowerCase().includes(invoiceTerm);
      const matchesSearch = !searchTerm || [bill.patientName, bill.doctorName, bill.department, bill.invoiceNumber, bill.serviceName].some((value) => String(value || "").toLowerCase().includes(searchTerm));
      return inRange && matchesDoctor && matchesDepartment && matchesPaymentStatus && matchesPaymentMethod && matchesPatientName && matchesPatientId && matchesInvoice && matchesSearch;
    });
  }, [appts, effectiveFilters, filters, search]);

  const sortBills = useMemo(() => {
    const sorted = [...filteredBills];
    sorted.sort((a, b) => {
      const aValue = a[sortKey] ?? "";
      const bValue = b[sortKey] ?? "";
      const comparison = typeof aValue === "number" ? aValue - bValue : String(aValue).localeCompare(String(bValue));
      return sortDir === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [filteredBills, sortKey, sortDir]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(sortBills.length / pageSize));
  const visibleBills = useMemo(() => sortBills.slice((page - 1) * pageSize, page * pageSize), [sortBills, page]);

  const summary = useMemo(() => {
    const totalBills = filteredBills.length;
    const totalRevenue = filteredBills.reduce((sum, bill) => sum + bill.fees, 0);
    const paidAmount = filteredBills.reduce((sum, bill) => sum + (bill.paymentStatus === "Paid" ? bill.fees - bill.discount + bill.tax - bill.refundAmount : bill.paidAmount), 0);
    const pendingAmount = filteredBills.reduce((sum, bill) => sum + bill.pendingAmount, 0);
    const discountGiven = filteredBills.reduce((sum, bill) => sum + bill.discount, 0);
    const taxCollected = filteredBills.reduce((sum, bill) => sum + bill.tax, 0);
    const insuranceAmount = filteredBills.reduce((sum, bill) => sum + bill.insuranceAmount, 0);
    const refundAmount = filteredBills.reduce((sum, bill) => sum + bill.refundAmount, 0);
    return {
      totalBills,
      totalRevenue,
      paidAmount,
      pendingAmount,
      discountGiven,
      taxCollected,
      insuranceAmount,
      refundAmount,
      averageBillValue: totalBills ? totalRevenue / totalBills : 0,
    };
  }, [filteredBills]);

  const summaryCards = [
    { label: "Total Bills", value: summary.totalBills, color: "#2563eb" },
    { label: "Total Revenue", value: currency(summary.totalRevenue), color: "#16a34a" },
    { label: "Paid Amount", value: currency(summary.paidAmount), color: "#0ea5e9" },
    { label: "Pending Amount", value: currency(summary.pendingAmount), color: "#f59e0b" },
    { label: "Discount Given", value: currency(summary.discountGiven), color: "#8b5cf6" },
    { label: "Tax Collected", value: currency(summary.taxCollected), color: "#14b8a6" },
    { label: "Insurance Amount", value: currency(summary.insuranceAmount), color: "#ec4899" },
    { label: "Refund Amount", value: currency(summary.refundAmount), color: "#ef4444" },
    { label: "Average Bill Value", value: currency(summary.averageBillValue), color: "#64748b" },
  ];

  const analytics = useMemo(() => {
    const revenueSeries = [];
    const visitSeries = [];
    const paymentData = [
      { label: "Cash", value: 0, color: "#2563eb" },
      { label: "UPI", value: 0, color: "#14b8a6" },
      { label: "Card", value: 0, color: "#f59e0b" },
      { label: "Insurance", value: 0, color: "#ec4899" },
      { label: "Net Banking", value: 0, color: "#8b5cf6" },
    ];
    const departmentData = [
      { label: "General Medicine", value: 0, color: "#2563eb" },
      { label: "Dental", value: 0, color: "#0ea5e9" },
      { label: "Orthopedic", value: 0, color: "#14b8a6" },
      { label: "Pediatrics", value: 0, color: "#f59e0b" },
      { label: "Gynecology", value: 0, color: "#ec4899" },
      { label: "Others", value: 0, color: "#64748b" },
    ];
    const doctorData = [];
    const serviceData = [];
    const monthlyComparison = [];

    const months = new Map();
    filteredBills.forEach((bill) => {
      const date = parseDate(bill.appointmentDate) || new Date();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      months.set(monthKey, { label: monthLabel, value: (months.get(monthKey)?.value || 0) + bill.fees });

      const periodKey = activeTab === "daily" ? date.toISOString().slice(0, 10) : activeTab === "weekly" ? `W${Math.ceil((date.getDate() + 6 - date.getDay()) / 7)}` : activeTab === "monthly" ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` : activeTab === "quarterly" ? `Q${Math.floor(date.getMonth() / 3) + 1}` : activeTab === "yearly" ? `${date.getFullYear()}` : `${date.toISOString().slice(0, 10)}`;
      const bucket = revenueSeries.find((item) => item.label === periodKey);
      if (bucket) bucket.value += bill.fees; else revenueSeries.push({ label: periodKey, value: bill.fees });
      const visitBucket = visitSeries.find((item) => item.label === periodKey);
      if (visitBucket) visitBucket.value += 1; else visitSeries.push({ label: periodKey, value: 1 });

      const paymentMethod = bill.paymentMethod || "Cash";
      const paymentIndex = paymentData.findIndex((item) => item.label === paymentMethod);
      if (paymentIndex >= 0) paymentData[paymentIndex].value += 1;

      const dept = ["General Medicine", "Dental", "Orthopedic", "Pediatrics", "Gynecology"].includes(bill.department) ? bill.department : "Others";
      const deptIndex = departmentData.findIndex((item) => item.label === dept);
      if (deptIndex >= 0) departmentData[deptIndex].value += bill.fees;

      const existingDoctor = doctorData.find((item) => item.label === bill.doctorName);
      if (existingDoctor) existingDoctor.value += bill.fees; else doctorData.push({ label: bill.doctorName, value: bill.fees });
      const existingService = serviceData.find((item) => item.label === bill.serviceName);
      if (existingService) existingService.value += bill.fees; else serviceData.push({ label: bill.serviceName, value: bill.fees });
    });

    const sortedMonths = Array.from(months.entries()).sort(([a], [b]) => (a > b ? 1 : -1)).slice(-6);
    sortedMonths.forEach(([, value]) => monthlyComparison.push({ label: value.label, value: value.value }));

    return {
      revenueSeries: revenueSeries.sort((a, b) => a.label.localeCompare(b.label)),
      visitSeries: visitSeries.sort((a, b) => a.label.localeCompare(b.label)),
      paymentData,
      departmentData,
      doctorData: doctorData.sort((a, b) => b.value - a.value).slice(0, 5),
      serviceData: serviceData.sort((a, b) => b.value - a.value).slice(0, 5),
      monthlyComparison,
    };
  }, [filteredBills, activeTab]);

  const kpis = [
    { label: "Today's Revenue", value: currency(filteredBills.filter((bill) => bill.appointmentDate && new Date(bill.appointmentDate).toDateString() === new Date().toDateString()).reduce((sum, bill) => sum + bill.fees, 0)) },
    { label: "Yesterday's Revenue", value: currency(filteredBills.filter((bill) => {
      const date = parseDate(bill.appointmentDate);
      if (!date) return false;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return date.toDateString() === yesterday.toDateString();
    }).reduce((sum, bill) => sum + bill.fees, 0)) },
    { label: "Weekly Revenue", value: currency(filteredBills.filter((bill) => {
      const date = parseDate(bill.appointmentDate);
      if (!date) return false;
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() - 7);
      return date >= start && date <= today;
    }).reduce((sum, bill) => sum + bill.fees, 0)) },
    { label: "Monthly Revenue", value: currency(filteredBills.filter((bill) => {
      const date = parseDate(bill.appointmentDate);
      if (!date) return false;
      return date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear();
    }).reduce((sum, bill) => sum + bill.fees, 0)) },
    { label: "Yearly Revenue", value: currency(filteredBills.filter((bill) => {
      const date = parseDate(bill.appointmentDate);
      if (!date) return false;
      return date.getFullYear() === new Date().getFullYear();
    }).reduce((sum, bill) => sum + bill.fees, 0)) },
    { label: "Total Patients", value: filteredBills.length },
    { label: "New Patients", value: filteredBills.filter((bill) => bill.paymentStatus === "Paid").length },
    { label: "Returning Patients", value: Math.max(0, filteredBills.length - filteredBills.filter((bill) => bill.paymentStatus === "Paid").length) },
    { label: "Total Appointments", value: filteredBills.length },
    { label: "Pending Bills", value: filteredBills.filter((bill) => bill.paymentStatus === "Pending").length },
    { label: "Paid Bills", value: filteredBills.filter((bill) => bill.paymentStatus === "Paid").length },
    { label: "Average Billing Amount", value: currency(summary.averageBillValue) },
  ];

  const toggleSelect = (id) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const selectAllVisible = () => {
    const visibleIds = visibleBills.map((bill) => bill.id);
    setSelectedIds((current) => (current.length === visibleIds.length ? [] : visibleIds));
  };

  const exportCsv = (records, filename) => {
    const rows = ["invoiceNumber,patientName,patientId,doctorName,department,appointmentDate,fees,paymentStatus,paymentMethod"].concat(records.map((bill) => [bill.invoiceNumber, bill.patientName, bill.patientId, bill.doctorName, bill.department, bill.appointmentDate, bill.fees, bill.paymentStatus, bill.paymentMethod].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))); 
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSelected = () => {
    const selectedBills = sortBills.filter((bill) => selectedIds.includes(bill.id));
    if (!selectedBills.length) {
      alert("Select at least one bill first.");
      return;
    }
    exportCsv(selectedBills, "selected-bills.csv");
  };

  const handleExportReport = (type) => exportCsv(filteredBills, `${type.toLowerCase().replace(/\s+/g, "-")}.csv`);

  const markPaid = async (bill) => {
    try {
      await updateAppointment(bill.appointmentId, { ...bill, status: "Completed", paymentStatus: "Paid" });
      await load();
    } catch (error) {
      alert("Error: " + (error.message || "Unable to update bill"));
    }
  };

  const saveEdit = async () => {
    try {
      await updateAppointment(editBill.appointmentId, { ...editBill, ...editDraft, status: editDraft.paymentStatus === "Paid" ? "Completed" : editDraft.status || editBill.status });
      await load();
      setEditBill(null);
      setEditDraft({});
    } catch (error) {
      alert("Error: " + (error.message || "Unable to save changes"));
    }
  };

  const deleteBill = (bill) => {
    if (!isAdmin) {
      alert("Admin access is required to delete billing records.");
      return;
    }
    if (!window.confirm(`Delete billing record ${bill.invoiceNumber}?`)) return;
    setAppts((current) => current.filter((item) => item.id !== bill.id));
    setSelectedIds((current) => current.filter((id) => id !== bill.id));
  };

  const printInvoice = (bill) => {
    const content = `<!DOCTYPE html><html><head><title>${bill.invoiceNumber}</title><style>body{font-family:Arial;padding:24px;line-height:1.5} .box{border:1px solid #ddd;padding:16px;border-radius:10px}</style></head><body><div class='box'><h2>Hospital Invoice</h2><p><strong>Invoice:</strong> ${bill.invoiceNumber}</p><p><strong>Patient:</strong> ${bill.patientName}</p><p><strong>Doctor:</strong> ${bill.doctorName}</p><p><strong>Department:</strong> ${bill.department}</p><p><strong>Date:</strong> ${formatDate(bill.appointmentDate)}</p><p><strong>Amount:</strong> ${currency(bill.fees)}</p><p><strong>Payment Status:</strong> ${bill.paymentStatus}</p><p><strong>Payment Method:</strong> ${bill.paymentMethod || "—"}</p></div></body></html>`;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 300);
    }
  };

  const billBadge = (bill) => {
    const styles = { Paid: { background: "#16a34a", color: "#fff" }, Pending: { background: "#f59e0b", color: "#fff" }, Partial: { background: "#0ea5e9", color: "#fff" }, Cancelled: { background: "#ef4444", color: "#fff" } };
    const style = styles[bill.paymentStatus] || styles.Pending;
    return <span style={{ padding: "4px 10px", borderRadius: "999px", background: style.background, color: style.color, fontSize: "12px", fontWeight: 600 }}>{bill.paymentStatus}</span>;
  };

  return (
    <div style={{ padding: "16px", background: "#f8fafc", minHeight: "100vh" }}>
      <PageTitle icon="💳" title="Hospital Billing Management" subtitle="Advanced billing, analytics, reporting and collections overview" />

      <Card style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
          <div style={{ flex: 1, minWidth: "220px" }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Quick search patient, doctor or invoice…" style={{ ...inputStyle, maxWidth: "360px" }} />
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button style={{ ...btnPrimary, padding: "8px 12px", fontSize: "12px" }} onClick={() => handleExportSelected()}>Export Selected</button>
            <button style={{ ...btnSuccess, padding: "8px 12px", fontSize: "12px" }} onClick={() => exportCsv(filteredBills, "filtered-bills.csv")}>Export All</button>
          </div>
        </div>

        <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: "16px" }}>
          {quickRanges.map((range) => (
            <button key={range.key} onClick={() => setFilters((current) => ({ ...current, preset: range.key, startDate: range.key === "custom" ? current.startDate : "", endDate: range.key === "custom" ? current.endDate : "" }))} style={{ padding: "10px 12px", borderRadius: "10px", border: filters.preset === range.key ? "2px solid #2563eb" : "1px solid #e2e8f0", background: filters.preset === range.key ? "#eff6ff" : "#fff", cursor: "pointer", fontWeight: 600 }}>
              {range.label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
            <span>Start Date</span>
            <input type="date" value={filters.startDate} onChange={(e) => setFilters((current) => ({ ...current, startDate: e.target.value, preset: "custom" }))} style={inputStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
            <span>End Date</span>
            <input type="date" value={filters.endDate} onChange={(e) => setFilters((current) => ({ ...current, endDate: e.target.value, preset: "custom" }))} style={inputStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
            <span>Doctor</span>
            <input value={filters.doctor} onChange={(e) => setFilters((current) => ({ ...current, doctor: e.target.value }))} placeholder="Doctor name" style={inputStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
            <span>Department</span>
            <input value={filters.department} onChange={(e) => setFilters((current) => ({ ...current, department: e.target.value }))} placeholder="Department" style={inputStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
            <span>Payment Status</span>
            <select value={filters.paymentStatus} onChange={(e) => setFilters((current) => ({ ...current, paymentStatus: e.target.value }))} style={inputStyle}>
              <option value="">All</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Partial">Partial</option>
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
            <span>Payment Method</span>
            <select value={filters.paymentMethod} onChange={(e) => setFilters((current) => ({ ...current, paymentMethod: e.target.value }))} style={inputStyle}>
              <option value="">All</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Net Banking">Net Banking</option>
              <option value="Insurance">Insurance</option>
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
            <span>Patient Name</span>
            <input value={filters.patientName} onChange={(e) => setFilters((current) => ({ ...current, patientName: e.target.value }))} placeholder="Patient name" style={inputStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
            <span>Patient ID</span>
            <input value={filters.patientId} onChange={(e) => setFilters((current) => ({ ...current, patientId: e.target.value }))} placeholder="Patient ID" style={inputStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
            <span>Invoice Number</span>
            <input value={filters.invoiceNumber} onChange={(e) => setFilters((current) => ({ ...current, invoiceNumber: e.target.value }))} placeholder="Invoice number" style={inputStyle} />
          </label>
        </div>
      </Card>

      <div style={statsGrid}>
        {summaryCards.map((card, index) => (
          <div key={index} style={{ background: "#fff", borderRadius: "14px", padding: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.07)", borderTop: `4px solid ${card.color}` }}>
            <div style={{ fontSize: "20px", fontWeight: 700 }}>{card.value}</div>
            <div style={{ color: "#64748b", marginTop: "4px", fontSize: "13px" }}>{card.label}</div>
          </div>
        ))}
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
          <h3 style={{ margin: 0 }}>Dashboard Analytics</h3>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[
              { key: "daily", label: "Daily" },
              { key: "weekly", label: "Weekly" },
              { key: "monthly", label: "Monthly" },
              { key: "quarterly", label: "Quarterly" },
              { key: "yearly", label: "Yearly" },
              { key: "custom", label: "Custom Range" },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: "8px 12px", borderRadius: "999px", border: activeTab === tab.key ? "1px solid #2563eb" : "1px solid #e2e8f0", background: activeTab === tab.key ? "#eff6ff" : "#fff", cursor: "pointer", fontWeight: 600 }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", marginBottom: "20px" }}>
          {kpis.map((kpi) => (
            <div key={kpi.label} style={{ background: "#f8fafc", borderRadius: "12px", padding: "14px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "18px", fontWeight: 700 }}>{kpi.value}</div>
              <div style={{ color: "#64748b", fontSize: "12px", marginTop: "4px" }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px" }}>
            <h4 style={{ marginTop: 0 }}>Revenue Trend</h4>
            <LineChart data={analytics.revenueSeries} />
          </div>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px" }}>
            <h4 style={{ marginTop: 0 }}>Payment Method Distribution</h4>
            <PieChart data={analytics.paymentData} />
          </div>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px" }}>
            <h4 style={{ marginTop: 0 }}>Department Revenue</h4>
            <BarChart data={analytics.departmentData} color="#14b8a6" />
          </div>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px" }}>
            <h4 style={{ marginTop: 0 }}>Patient Visit Trend</h4>
            <LineChart data={analytics.visitSeries} color="#8b5cf6" />
          </div>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px" }}>
            <h4 style={{ marginTop: 0 }}>Top Doctors by Revenue</h4>
            <BarChart data={analytics.doctorData} color="#ec4899" />
          </div>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px" }}>
            <h4 style={{ marginTop: 0 }}>Top Services by Revenue</h4>
            <BarChart data={analytics.serviceData} color="#f59e0b" />
          </div>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px" }}>
            <h4 style={{ marginTop: 0 }}>Monthly Revenue Comparison</h4>
            <BarChart data={analytics.monthlyComparison} color="#2563eb" />
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
          <h3 style={{ margin: 0 }}>Billing Records</h3>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button style={{ ...btnWarning, padding: "8px 12px", fontSize: "12px" }} onClick={() => handleExportReport("Daily Revenue Report")}>Daily Report</button>
            <button style={{ ...btnWarning, padding: "8px 12px", fontSize: "12px" }} onClick={() => handleExportReport("Weekly Report")}>Weekly Report</button>
            <button style={{ ...btnWarning, padding: "8px 12px", fontSize: "12px" }} onClick={() => handleExportReport("Monthly Report")}>Monthly Report</button>
            <button style={{ ...btnWarning, padding: "8px 12px", fontSize: "12px" }} onClick={() => handleExportReport("Outstanding Due Report")}>Outstanding Report</button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "980px" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ padding: "10px", textAlign: "left" }}><input type="checkbox" checked={selectedIds.length === visibleBills.length && visibleBills.length > 0} onChange={selectAllVisible} /></th>
                <th style={{ padding: "10px", textAlign: "left" }}><button style={{ background: "transparent", border: "none", cursor: "pointer", fontWeight: 700 }} onClick={() => { setSortKey("invoiceNumber"); setSortDir((current) => (current === "asc" ? "desc" : "asc")); }}>Invoice</button></th>
                <th style={{ padding: "10px", textAlign: "left" }}><button style={{ background: "transparent", border: "none", cursor: "pointer", fontWeight: 700 }} onClick={() => { setSortKey("patientName"); setSortDir((current) => (current === "asc" ? "desc" : "asc")); }}>Patient</button></th>
                <th style={{ padding: "10px", textAlign: "left" }}>Doctor</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Dept</th>
                <th style={{ padding: "10px", textAlign: "left" }}><button style={{ background: "transparent", border: "none", cursor: "pointer", fontWeight: 700 }} onClick={() => { setSortKey("fees"); setSortDir((current) => (current === "asc" ? "desc" : "asc")); }}>Amount</button></th>
                <th style={{ padding: "10px", textAlign: "left" }}>Status</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>Loading billing records…</td></tr>
              ) : visibleBills.length === 0 ? (
                <tr><td colSpan="8" style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>No matching bills found.</td></tr>
              ) : visibleBills.map((bill) => (
                <tr key={bill.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px" }}><input type="checkbox" checked={selectedIds.includes(bill.id)} onChange={() => toggleSelect(bill.id)} /></td>
                  <td style={{ padding: "10px", fontWeight: 600 }}>{bill.invoiceNumber}</td>
                  <td style={{ padding: "10px" }}>{bill.patientName}<div style={{ color: "#64748b", fontSize: "12px" }}>{bill.patientId}</div></td>
                  <td style={{ padding: "10px" }}>{bill.doctorName}</td>
                  <td style={{ padding: "10px" }}>{bill.department}</td>
                  <td style={{ padding: "10px" }}>{currency(bill.fees)}</td>
                  <td style={{ padding: "10px" }}>{billBadge(bill)}</td>
                  <td style={{ padding: "10px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      <button style={{ ...btnPrimary, padding: "6px 10px", fontSize: "11px" }} onClick={() => setDetailBill(bill)}>View</button>
                      <button style={{ ...btnSuccess, padding: "6px 10px", fontSize: "11px" }} onClick={() => setEditBill(bill)}>Edit</button>
                      {bill.paymentStatus !== "Paid" && <button style={{ ...btnSuccess, padding: "6px 10px", fontSize: "11px" }} onClick={() => markPaid(bill)}>Mark Paid</button>}
                      <button style={{ ...btnWarning, padding: "6px 10px", fontSize: "11px" }} onClick={() => printInvoice(bill)}>Print</button>
                      {isAdmin && <button style={{ ...btnDanger, padding: "6px 10px", fontSize: "11px" }} onClick={() => deleteBill(bill)}>Delete</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ color: "#64748b", fontSize: "13px" }}>Showing {visibleBills.length} of {sortBills.length} results</div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button disabled={page === 1} style={{ ...btnPrimary, padding: "8px 10px", fontSize: "12px", opacity: page === 1 ? 0.6 : 1 }} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
            <span style={{ alignSelf: "center", color: "#475569" }}>{page} / {totalPages}</span>
            <button disabled={page === totalPages} style={{ ...btnPrimary, padding: "8px 10px", fontSize: "12px", opacity: page === totalPages ? 0.6 : 1 }} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</button>
          </div>
        </div>
      </Card>

      {detailBill && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", zIndex: 1000 }} onClick={() => setDetailBill(null)}>
          <div style={{ background: "#fff", width: "100%", maxWidth: "620px", borderRadius: "16px", padding: "20px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0 }}>Billing Details</h3>
              <button style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "18px" }} onClick={() => setDetailBill(null)}>✕</button>
            </div>
            <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
              {[
                ["Invoice", detailBill.invoiceNumber],
                ["Patient", detailBill.patientName],
                ["Patient ID", detailBill.patientId],
                ["Doctor", detailBill.doctorName],
                ["Department", detailBill.department],
                ["Date", formatDate(detailBill.appointmentDate)],
                ["Amount", currency(detailBill.fees)],
                ["Discount", currency(detailBill.discount)],
                ["Tax", currency(detailBill.tax)],
                ["Insurance", currency(detailBill.insuranceAmount)],
                ["Refund", currency(detailBill.refundAmount)],
                ["Status", detailBill.paymentStatus],
                ["Method", detailBill.paymentMethod || "—"],
              ].map(([label, value]) => (
                <div key={label} style={{ background: "#f8fafc", borderRadius: "10px", padding: "10px" }}>
                  <div style={{ color: "#64748b", fontSize: "12px" }}>{label}</div>
                  <div style={{ fontWeight: 600, marginTop: "4px" }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {editBill && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", zIndex: 1000 }} onClick={() => setEditBill(null)}>
          <div style={{ background: "#fff", width: "100%", maxWidth: "520px", borderRadius: "16px", padding: "20px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0 }}>Edit Billing Record</h3>
              <button style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "18px" }} onClick={() => setEditBill(null)}>✕</button>
            </div>
            <div style={{ display: "grid", gap: "12px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
                <span>Payment Status</span>
                <select value={editDraft.paymentStatus || editBill.paymentStatus} onChange={(e) => setEditDraft((current) => ({ ...current, paymentStatus: e.target.value }))} style={inputStyle}>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Partial">Partial</option>
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
                <span>Payment Method</span>
                <select value={editDraft.paymentMethod || editBill.paymentMethod || ""} onChange={(e) => setEditDraft((current) => ({ ...current, paymentMethod: e.target.value }))} style={inputStyle}>
                  <option value="">Select</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Insurance">Insurance</option>
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
                <span>Notes</span>
                <textarea value={editDraft.notes || editBill.notes || ""} onChange={(e) => setEditDraft((current) => ({ ...current, notes: e.target.value }))} style={{ ...inputStyle, minHeight: "90px" }} />
              </label>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
              <button style={{ ...btnWarning, padding: "8px 12px", fontSize: "12px" }} onClick={() => setEditBill(null)}>Cancel</button>
              <button style={{ ...btnSuccess, padding: "8px 12px", fontSize: "12px" }} onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
