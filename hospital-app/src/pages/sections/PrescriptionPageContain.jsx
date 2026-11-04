import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../AuthContext";
import { AppointmentAPI, PrescriptionAPI, PrescriptionInfoAPI, UserAPI, patient, doctor, rxInfo as getRxInfo, medSearch } from "../api";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const todayISO = () => new Date().toISOString().split("T")[0];
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const ROUTES = ["Oral", "Topical", "Injection", "Inhalation", "Sublingual", "Rectal", "Nasal", "Optic"];
const EMPTY_MED = { medicineId: "", medicineName: "", morning: false, afternoon: false, night: false, days: "", note: "", route: "Oral" };

const parseBlocks = (raw) => {
  try {
    const data = JSON.parse(raw || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const serializeBlocks = (blocks) => JSON.stringify(
  (blocks || [])
    .map(b => ({ heading: b.heading?.trim() || "", value: b.value?.trim() || "" }))
    .filter(b => b.heading || b.value)
);

const blocksToPlainText = (blocks) =>
  (blocks || [])
    .map(b => [b.heading?.trim(), b.value?.trim()].filter(Boolean).join(b.heading && b.value ? ": " : ""))
    .filter(Boolean)
    .join("\n");

const numericId = (value) => {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
};

const getStoredUser = () => {
  for (const key of ["hospital", "session"]) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore malformed legacy session data.
    }
  }
  return null;
};

const DEFAULT_LOGO = "/logos/HospitalLogo.png";
const normalizeLogoSrc = (src) => {
  const value = (src || "").trim();
  if (!value) return "";
  if (/^(https?:|data:|blob:|\/)/i.test(value)) return value;
  const fileName = value.split(/[\\/]/).pop();
  return fileName ? `/logos/${encodeURIComponent(fileName)}` : "";
};

/* ══════════════════════════════════════════════════════════════════════════
   MEDICINE ROW  —  checkboxes for morning / afternoon / night
══════════════════════════════════════════════════════════════════════════ */
function MedRow({ row, idx, hospitalId, onChange, onRemove, editing }) {
  const [query, setQuery]   = useState(row.medicineName || "");
  const [sugs,  setSugs]    = useState([]);
  const [open,  setOpen]    = useState(false);
  const debounceRef = useRef();

  useEffect(() => { setQuery(row.medicineName || ""); }, [row.medicineName]);

  const search = (val) => {
    setQuery(val);
    onChange(idx, "medicineName", val);
    clearTimeout(debounceRef.current);
    if (val.length >= 2) {
      debounceRef.current = setTimeout(async () => {
        try {
          const data = await medSearch(hospitalId, val);
          console.log("Medicine search results:", data);
          setSugs((data?.medicines || data || []).slice(0, 8));
          setOpen(true);
        } catch { setSugs([]); }
      }, 280);
    } else { setOpen(false); setSugs([]); }
  };

  const pick = (m) => {
    setQuery(m.medicineName || m.name);
    onChange(idx, "medicineName", m.medicineName || m.name);
    onChange(idx, "medicineId",   m.medicineId   || m.id || "");
    setOpen(false); setSugs([]);
  };

  const cb = (field) => (
    <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", cursor: editing ? "pointer" : "default" }}>
      <input
        type="checkbox"
        checked={!!row[field]}
        onChange={e => editing && onChange(idx, field, e.target.checked)}
        disabled={!editing}
        style={{ width: "16px", height: "16px", accentColor: "#1d4ed8", cursor: editing ? "pointer" : "default" }}
      />
    </label>
  );

  const cell = { border: "1px solid #94a3b8", padding: "7px 6px", textAlign: "center", fontSize: "13px", verticalAlign: "middle" };
  const inp  = { border: "none", outline: "none", background: "transparent", width: "100%", fontSize: "13px", fontFamily: "inherit" };

  if (!editing) return (
    <tr style={{ background: idx % 2 === 0 ? "#fff" : "#f8fafc" }}>
      <td style={{ ...cell, color: "#64748b", width: "28px" }}>{idx + 1}</td>
      <td style={{ ...cell, textAlign: "left", fontWeight: "600" }}>{row.medicineName || "—"}</td>
      <td style={cell}>{row.morning   ? "✓" : ""}</td>
      <td style={cell}>{row.afternoon ? "✓" : ""}</td>
      <td style={cell}>{row.night     ? "✓" : ""}</td>
      <td style={cell}>{row.days || "—"}</td>
      <td style={cell}>{row.route || "Oral"}</td>
      <td style={{ ...cell, textAlign: "left" }}>{row.note || ""}</td>
    </tr>
  );

  return (
    <tr style={{ background: idx % 2 === 0 ? "#fff" : "#f0f9ff" }}>
      <td style={{ ...cell, color: "#64748b", width: "28px" }}>{idx + 1}</td>
      <td style={{ ...cell, textAlign: "left", minWidth: "190px", position: "relative" }}>
        <input value={query} onChange={e => search(e.target.value)} placeholder="Type to search medicine…"
          style={{ ...inp, fontWeight: "600" }} />
        {open && sugs.length > 0 && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #cbd5e1", borderRadius: "10px", zIndex: 300, boxShadow: "0 8px 24px rgba(0,0,0,0.13)", maxHeight: "200px", overflowY: "auto" }}>
            {sugs.map((m, i) => (
              <div key={i} onMouseDown={() => pick(m)}
                style={{ padding: "8px 14px", cursor: "pointer", fontSize: "13px", borderBottom: "1px solid #f1f5f9" }}
                onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <strong>{m.medicineName || m.name}</strong>
                {m.type && <span style={{ color: "#94a3b8", fontSize: "11px" }}> — {m.type}</span>}
              </div>
            ))}
          </div>
        )}
      </td>
      <td style={cell}>{cb("morning")}</td>
      <td style={cell}>{cb("afternoon")}</td>
      <td style={cell}>{cb("night")}</td>
      <td style={{ ...cell, width: "52px" }}>
        <input value={row.days} onChange={e => onChange(idx, "days", e.target.value)} placeholder="—"
          style={{ ...inp, textAlign: "center", width: "44px" }} />
      </td>
      <td style={{ ...cell, width: "90px" }}>
        <select value={row.route} onChange={e => onChange(idx, "route", e.target.value)}
          style={{ ...inp, cursor: "pointer", fontSize: "12px" }}>
          {ROUTES.map(r => <option key={r}>{r}</option>)}
        </select>
      </td>
      <td style={{ ...cell, minWidth: "110px" }}>
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          <input value={row.note} onChange={e => onChange(idx, "note", e.target.value)} placeholder="Note"
            style={{ ...inp, fontSize: "12px", flex: 1 }} />
          <button onMouseDown={() => onRemove(idx)}
            style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "5px", padding: "2px 7px", cursor: "pointer", fontSize: "11px", flexShrink: 0 }}>✕</button>
        </div>
      </td>
    </tr>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   EDITABLE INLINE FIELD
══════════════════════════════════════════════════════════════════════════ */
function E({ value, onChange, placeholder = "—", style = {}, multiline = false, editing = true, rows = 3 }) {
  const base = { border: "none", outline: "none", background: "transparent", fontFamily: "inherit", fontSize: "inherit", color: "inherit", padding: 0, width: "100%" };
  const edit = { ...base, borderBottom: "1.5px dashed #93c5fd" };
  if (!editing) return <span style={style}>{value || placeholder}</span>;
  if (multiline) return <textarea value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...style, ...edit, resize: "none" }} />;
  return <input value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...style, ...edit }} />;
}

/* ══════════════════════════════════════════════════════════════════════════
   THE PRESCRIPTION — single A4 template (Classic, beautiful)
══════════════════════════════════════════════════════════════════════════ */
function Prescription({ pat, doc, rxInfo, form, setField, medicines, allMeds, hospitalId, onMedChange, onMedRemove, onAddMed, editing, template }) {

  const border  = "2px solid #1e293b";
  const thinBdr = "1px solid #94a3b8";
  const logoSrc = normalizeLogoSrc(rxInfo?.logoUrl) || DEFAULT_LOGO;
  const handleLogoError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = DEFAULT_LOGO;
  };

  const renderJsonBlocks = (rawJson, title) => {
    const blocks = parseBlocks(rawJson);
    if (!blocks.length) return null;
    return (
      <div style={{ marginTop: "14px", padding: "12px 14px", border: "1px dashed #cbd5e1", borderRadius: "12px", background: "#f8fafc" }}>
        <div style={{ fontWeight: "700", marginBottom: "10px" }}>{title}</div>
        {blocks.map((block, idx) => (
          <div key={idx} style={{ marginBottom: idx === blocks.length - 1 ? 0 : "12px" }}>
            {block.heading && <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>{block.heading}</div>}
            <div style={{ fontSize: "13px", color: "#475569", whiteSpace: "pre-wrap" }}>{block.value || "—"}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderPatientNotesSection = () => (
    <div style={{ marginTop: "14px", padding: "14px", border: "1px solid #cbd5e1", borderRadius: "12px", background: "#f8fafc" }}>
      {(editing || form.patientNotes) && (
        <div style={{ marginBottom: "10px" }}>
          <div style={{ fontWeight: "700", marginBottom: "6px" }}>Patient Notes</div>
          <E value={form.patientNotes} onChange={v => setField("patientNotes", v)} editing={editing} multiline rows={3}
            placeholder="Add patient follow-up notes, summary, or reminders…" style={{ fontSize: "13px" }} />
        </div>
      )}
      {(form.reportUrl || form.reportName) && (
        <div>
          <div style={{ fontWeight: "700", marginBottom: "6px" }}>Report</div>
          {form.reportUrl ? (
            <a href={form.reportUrl} target="_blank" rel="noreferrer noopener" style={{ color: "#1d4ed8" }}>
              {form.reportName || "Open uploaded report"}
            </a>
          ) : (
            <div style={{ color: "#475569" }}>{form.reportName || "No report attached"}</div>
          )}
        </div>
      )}
    </div>
  );

  /* ── MODERN BLUE ── */
  if (template === "TEMPLATE_2") {
    const accent = "#1d4ed8";
    return (
      <div style={{ width: "210mm", minHeight: "297mm", background: "#fff", margin: "0 auto", fontFamily: "'Georgia', serif", fontSize: "13px", boxSizing: "border-box", boxShadow: "0 4px 32px rgba(0,0,0,0.13)" }}>
        {/* Header */}
        <div style={{ background: accent, color: "#fff", padding: "18px 24px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "26px", fontWeight: "800", letterSpacing: "-0.5px" }}>{rxInfo?.hospitalName || doc?.hospitalName || "Clinic Name"}</div>
              <div style={{ fontSize: "12px", opacity: 0.85, marginTop: "2px" }}>{rxInfo?.hospitalAddress || ""}</div>
              <div style={{ fontSize: "12px", opacity: 0.8 }}>{rxInfo?.hospitalEmail || ""} &nbsp;|&nbsp; {rxInfo?.hospitalPhone || doc?.contact || ""}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <img src={logoSrc} onError={handleLogoError} style={{ height: "60px", borderRadius: "8px" }} alt="logo" />
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.25)", marginTop: "12px", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: "20px", fontWeight: "700" }}>Dr. {doc?.userName || "—"}</div>
              <div style={{ fontSize: "12px", opacity: 0.85 }}>{doc?.qualification || ""}{doc?.specialization ? ` · ${doc.specialization}` : ""}</div>
            </div>
            <div style={{ fontSize: "12px", opacity: 0.8, textAlign: "right" }}>
              <div>Reg No: {doc?.regNo || rxInfo?.regNo || "—"}</div>
              <div>{doc?.contact || ""}</div>
            </div>
          </div>
        </div>

        {/* Patient strip */}
        <div style={{ background: "#eff6ff", padding: "10px 24px", borderBottom: "1px solid #bfdbfe", display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "13px" }}>
          <span><b>Patient:</b> {pat?.custName || "—"}</span>
          <span><b>Age:</b> {pat?.age || "—"}</span>
          <span><b>Gender:</b> {pat?.gender || "—"}</span>
          <span><b>Mobile:</b> {pat?.custContact || "—"}</span>
          <span><b>Blood Group:</b> {pat?.bloodGroup || "—"}</span>
          <span style={{ marginLeft: "auto" }}><b>Date:</b> {fmtDate(form.prescriptionDate)}</span>
        </div>

        <div style={{ display: "flex", minHeight: "540px" }}>
          {/* LEFT sidebar */}
          <div style={{ width: "170px", borderRight: "1px solid #bfdbfe", padding: "14px 12px", background: "#f8fafc", flexShrink: 0, fontSize: "13px" }}>
            <div style={{ fontWeight: "800", fontSize: "13px", color: accent, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px", paddingBottom: "6px", borderBottom: `2px solid ${accent}` }}>Instructions</div>
            <E value={form.instructions} onChange={v => setField("instructions", v)} multiline rows={7} editing={editing} placeholder="Write instructions…" style={{ fontSize: "13px", lineHeight: "1.6" }} />
            
            <div style={{ marginTop: "14px", borderTop: "1px solid #cbd5e1", paddingTop: "12px" }}>
              <div style={{ fontWeight: "700", fontSize: "12px", color: accent, marginBottom: "8px" }}>VITALS</div>
              {[["bloodPressure","BP"],["weight","Weight"],["temperature","Temp"],["pulseRate","Pulse"],["oxygenLevel","O2 Sat"]].map(([f, l]) => (
                <div key={f} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", gap: "4px" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", flexShrink: 0 }}>{l}:</span>
                  <E value={form[f]} onChange={v => setField(f, v)} editing={editing} placeholder="—" style={{ fontSize: "12px", fontWeight: "600", textAlign: "right", width: "70px" }} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: "12px", borderTop: "1px solid #cbd5e1", paddingTop: "10px" }}>
              <div style={{ fontWeight: "700", fontSize: "12px", color: accent, marginBottom: "6px" }}>COMPLAINTS</div>
              <E value={form.complaints} onChange={v => setField("complaints", v)} multiline rows={3} editing={editing} placeholder="Chief complaints…" style={{ fontSize: "12px" }} />
            </div>
          </div>

          {/* RIGHT main */}
          <div style={{ flex: 1, padding: "14px 18px" }}>
            <div style={{ fontWeight: "800", fontSize: "15px", color: accent, borderBottom: `2px solid ${accent}`, paddingBottom: "6px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px" }}>℞</span> Prescription
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: accent, color: "#fff" }}>
                  {["#", "Medicine Name", "Mrng", "Aft", "Night", "Days", "Route", "Note"].map(h => (
                    <th key={h} style={{ padding: "8px 6px", textAlign: "center", fontWeight: "700", fontSize: "12px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {medicines.map((row, i) => <MedRow key={i} row={row} idx={i} hospitalId={hospitalId} onChange={onMedChange} onRemove={onMedRemove} editing={editing} />)}
                {editing && (
                  <tr><td colSpan={8} style={{ padding: "8px", textAlign: "center", background: "#f0f9ff" }}>
                    <button onClick={onAddMed} style={{ background: "#059669", color: "#fff", border: "none", borderRadius: "7px", padding: "6px 18px", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}>+ Add Medicine</button>
                  </td></tr>
                )}
                {!editing && [...Array(Math.max(0, 5 - medicines.length))].map((_, i) => (
                  <tr key={"e" + i}>{[...Array(8)].map((_, j) => <td key={j} style={{ border: "1px solid #e2e8f0", padding: "10px" }}>&nbsp;</td>)}</tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: "14px" }}>
              <span style={{ fontWeight: "700", fontSize: "13px" }}>Diagnosis: </span>
              <E value={form.diagnosis} onChange={v => setField("diagnosis", v)} editing={editing} placeholder="Enter diagnosis…" style={{ fontSize: "13px" }} />
            </div>
            {renderJsonBlocks(rxInfo?.instructionsJson, "Additional Instructions")}
            {(editing || form.followUpDate) && (
              <div style={{ marginTop: "8px" }}>
                <span style={{ fontWeight: "700", fontSize: "13px" }}>Follow Up: </span>
                {editing
                  ? <input type="date" value={form.followUpDate || ""} onChange={e => setField("followUpDate", e.target.value)} style={{ border: "none", borderBottom: "1.5px dashed #93c5fd", outline: "none", fontSize: "13px" }} />
                  : <span>{fmtDate(form.followUpDate)}</span>}
              </div>
            )}
            
            <div style={{ textAlign: "right", marginTop: "50px" }}>
              <div style={{ display: "inline-block", textAlign: "center" }}>
                <div style={{ width: "140px", borderTop: `2px solid ${accent}`, paddingTop: "6px", fontWeight: "700", color: accent }}>Dr. {doc?.userName || "—"}</div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>Signature & Stamp</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: `2px solid ${accent}`, display: "flex", minHeight: "64px", background: "#eff6ff" }}>
          <div style={{ width: "170px", borderRight: "1px solid #bfdbfe", padding: "10px 12px", fontSize: "12px" }}>
            <div style={{ fontWeight: "700", color: accent, marginBottom: "3px" }}>Location</div>
            <div style={{ color: "#475569" }}>{rxInfo?.location || rxInfo?.hospitalAddress || ""}</div>
          </div>
          <div style={{ flex: 1, padding: "10px 18px", fontSize: "12px" }}>
            <div style={{ fontWeight: "700", color: accent, marginBottom: "3px" }}>Medical Instructions</div>
            <E value={form.medicalInstructions} onChange={v => setField("medicalInstructions", v)} editing={editing} placeholder="Footer instructions…" style={{ color: "#475569" }} />
          </div>
        </div>
      </div>
    );
  }

  /* ── MINIMAL SERIF ── */
  if (template === "TEMPLATE_3") {
    return (
      <div style={{ width: "210mm", minHeight: "297mm", background: "#fff", margin: "0 auto", fontFamily: "'Georgia', serif", fontSize: "13px", padding: "28px 32px", boxSizing: "border-box", boxShadow: "0 4px 32px rgba(0,0,0,0.10)" }}>
        <div style={{ borderBottom: "3px double #1e293b", paddingBottom: "14px", marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "22px", fontWeight: "700" }}>{rxInfo?.hospitalName || "Clinic"}</div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>{rxInfo?.hospitalAddress}</div>
            </div>
            <div style={{ textAlign: "right", fontSize: "12px", color: "#64748b" }}>
              <div>{rxInfo?.hospitalPhone || doc?.contact}</div>
              <div>{rxInfo?.hospitalEmail}</div>
            </div>
          </div>
          <div style={{ marginTop: "10px", padding: "8px 12px", background: "#f8fafc", borderLeft: "4px solid #1e293b" }}>
            <div style={{ fontWeight: "700", fontSize: "16px" }}>Dr. {doc?.userName || "—"}</div>
            <div style={{ fontSize: "12px", color: "#475569" }}>{doc?.qualification} — {doc?.specialization}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "13px", marginBottom: "12px", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: "4px" }}>
          <div><b>Patient:</b> {pat?.custName || "—"}</div>
          <div><b>Age/Sex:</b> {pat?.age || "—"} / {pat?.gender || "—"}</div>
          <div><b>Contact:</b> {pat?.custContact || "—"}</div>
          <div><b>Blood Group:</b> {pat?.bloodGroup || "—"}</div>
          <div style={{ gridColumn: "1/-1" }}><b>Address:</b> {pat?.custAddress || "—"}</div>
          <div><b>Date:</b> {fmtDate(form.prescriptionDate)}</div>
        </div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px", fontSize: "32px", fontWeight: "700" }}>℞</div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "14px" }}>
          <thead><tr style={{ borderBottom: "2px solid #1e293b", background: "#f8fafc" }}>
            {["#","Medicine","Mrng","Aft","Night","Days","Route","Note"].map(h => <th key={h} style={{ padding: "7px 6px", textAlign: "center", fontSize: "12px" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {medicines.map((row, i) => <MedRow key={i} row={row} idx={i} hospitalId={hospitalId} onChange={onMedChange} onRemove={onMedRemove} editing={editing} />)}
            {editing && <tr><td colSpan={8} style={{ padding: "8px", textAlign: "center" }}>
              <button onClick={onAddMed} style={{ background: "#1e293b", color: "#fff", border: "none", borderRadius: "6px", padding: "5px 16px", cursor: "pointer", fontSize: "12px" }}>+ Add Medicine</button>
            </td></tr>}
          </tbody>
        </table>
        {(editing || form.complaints) && <div style={{ marginBottom: "8px" }}><b>Complaints:</b> <E value={form.complaints} onChange={v => setField("complaints", v)} editing={editing} placeholder="…" /></div>}
        {(editing || form.diagnosis) && <div style={{ marginBottom: "8px" }}><b>Diagnosis:</b> <E value={form.diagnosis} onChange={v => setField("diagnosis", v)} editing={editing} placeholder="…" /></div>}
        {(editing || form.instructions) && <div style={{ marginBottom: "8px" }}><b>Instructions:</b> <E value={form.instructions} onChange={v => setField("instructions", v)} multiline rows={3} editing={editing} placeholder="…" /></div>}
        {renderJsonBlocks(rxInfo?.instructionsJson, "Additional Instructions")}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12px", marginBottom: "10px", padding: "8px 12px", border: "1px dashed #e2e8f0", borderRadius: "4px" }}>
          {[["bloodPressure","BP"],["weight","Wt"],["temperature","Temp"],["pulseRate","Pulse"],["oxygenLevel","O2"]].map(([f,l]) => (
            <span key={f}>{l}: <E value={form[f]} onChange={v => setField(f, v)} editing={editing} placeholder="—" style={{ fontWeight: "700", width: "60px" }} /></span>
          ))}
        </div>
        {(editing || form.followUpDate) && <div style={{ marginBottom: "8px" }}><b>Follow-up:</b> {editing ? <input type="date" value={form.followUpDate || ""} onChange={e => setField("followUpDate", e.target.value)} style={{ border: "none", borderBottom: "1.5px dashed #93c5fd", outline: "none", fontSize: "13px" }} /> : fmtDate(form.followUpDate)}</div>}
        <div style={{ borderTop: "2px solid #1e293b", marginTop: "30px", paddingTop: "12px", display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: "12px", color: "#64748b" }}><E value={form.medicalInstructions} onChange={v => setField("medicalInstructions", v)} editing={editing} placeholder="Footer instructions…" />{renderJsonBlocks(rxInfo?.footerJson, "Footer Details")}</div>
          <div style={{ textAlign: "right", fontFamily: "Arial,sans-serif" }}>
            <div style={{ fontWeight: "700" }}>Dr. {doc?.userName}</div>
            <div style={{ marginTop: "4px" }}>____________________</div>
            <div style={{ fontSize: "11px" }}>Signature & Stamp</div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     TEMPLATE 1 — CLASSIC (default) — A4, full structured layout
  ══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ width: "210mm", minHeight: "297mm", background: "#fff", margin: "0 auto", border: "2.5px solid #1e293b", fontFamily: "'Georgia', serif", fontSize: "13px", boxSizing: "border-box", boxShadow: "0 4px 32px rgba(0,0,0,0.13)", display: "flex", flexDirection: "column" }}>

      {/* ── HEADER ── */}
      <div style={{ borderBottom: "2.5px solid #1e293b", padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Logo */}
          <div style={{ width: "80px", height: "80px", border: "2px solid #1e293b", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
            <img src={logoSrc} onError={handleLogoError} style={{ width: "100%", height: "100%", objectFit: "contain" }} alt="logo" />
          </div>
          {/* Hospital info center */}
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: "26px", fontWeight: "800", letterSpacing: "-0.5px", lineHeight: 1.2 }}>{rxInfo?.hospitalName || "Clinic Name"}</div>
            <div style={{ fontSize: "13px", color: "#475569", marginTop: "2px" }}>{rxInfo?.hospitalAddress || ""}</div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              {rxInfo?.hospitalEmail && <span>✉ {rxInfo.hospitalEmail}</span>}
              {rxInfo?.hospitalEmail && rxInfo?.hospitalPhone && <span> &nbsp;|&nbsp; </span>}
              {rxInfo?.hospitalPhone && <span>☎ {rxInfo.hospitalPhone}</span>}
            </div>
          </div>
          {/* Doctor contact right */}
          <div style={{ textAlign: "right", fontSize: "12px", flexShrink: 0, color: "#475569" }}>
            <div style={{ fontWeight: "700", color: "#1e293b", marginBottom: "2px" }}>Doctor Contact</div>
            <div>{doc?.contact || rxInfo?.doctorPhone || "—"}</div>
            <div>{doc?.email || ""}</div>
          </div>
        </div>
        {/* Doctor name strip */}
        <div style={{ textAlign: "center", marginTop: "12px", paddingTop: "10px", borderTop: "1.5px solid #e2e8f0" }}>
          <div style={{ fontWeight: "800", fontSize: "19px", color: "#1e293b" }}>
            Dr. {doc?.userName || "—"}
            {doc?.qualification ? <span style={{ fontWeight: "400", fontSize: "14px" }}> ({doc.qualification})</span> : ""}
          </div>
          <div style={{ fontSize: "13px", color: "#64748b", fontStyle: "italic" }}>{doc?.specialization || ""}</div>
          {(doc?.regNo || rxInfo?.regNo) && <div style={{ fontSize: "11px", color: "#94a3b8" }}>Reg. No: {doc?.regNo || rxInfo?.regNo}</div>}
        </div>
      </div>

      {/* ── PATIENT INFO ── */}
      <div style={{ borderBottom: "2.5px solid #1e293b", padding: "8px 20px", background: "#f8fafc", fontSize: "13px" }}>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "3px" }}>
          <span><b>Patient:</b> {pat?.custName || "—"}</span>
          <span><b>Age:</b> {pat?.age || "—"}</span>
          <span><b>Gender:</b> {pat?.gender || "—"}</span>
          <span><b>Mobile:</b> {pat?.custContact || "—"}</span>
          <span><b>Blood Group:</b> {pat?.bloodGroup || "—"}</span>
        </div>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          <span><b>Address:</b> {pat?.custAddress || "—"}</span>
          <span style={{ marginLeft: "auto" }}><b>Date:</b> {fmtDate(form.prescriptionDate)}</span>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ display: "flex", flex: 1, minHeight: "480px" }}>

        {/* LEFT PANEL */}
        <div style={{ width: "200px", borderRight: "2.5px solid #1e293b", padding: "14px 12px", display: "flex", flexDirection: "column", gap: "0", flexShrink: 0 }}>

          {/* Instructions */}
          <div style={{ fontWeight: "800", fontSize: "14px", borderBottom: "2px solid #1e293b", paddingBottom: "5px", marginBottom: "10px", letterSpacing: "0.3px" }}>Instructions</div>
          <div style={{ fontSize: "14px", lineHeight: "1.7", flex: "0 0 auto" }}>
            <E value={form.instructions} onChange={v => setField("instructions", v)} multiline rows={8} editing={editing} placeholder="Write instructions here…" style={{ fontSize: "14px", lineHeight: "1.7",'min-height': "381%" }} />
          </div>

          <div style={{ flex: 1 }} />

          {/* Vitals */}
          <div style={{ borderTop: "1.5px solid #1e293b", marginTop: "10px", paddingTop: "10px" }}>
            <div style={{ fontWeight: "700", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", color: "#475569" }}>Vitals</div>
            {[
              ["bloodPressure", "Blood Pressure"],
              ["weight",        "Weight"],
              ["temperature",   "Temperature"],
              ["pulseRate",     "Pulse"],
              ["oxygenLevel",   "O2 Level"],
            ].map(([f, l]) => (
              <div key={f} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "7px", gap: "6px" }}>
                <span style={{ fontSize: "12px", color: "#374151", flexShrink: 0 }}>{l}:</span>
                <E value={form[f]} onChange={v => setField(f, v)} editing={editing} placeholder="—"
                  style={{ fontSize: "13px", fontWeight: "600", textAlign: "right", width: "80px" }} />
              </div>
            ))}
          </div>

          {/* Complaints */}
          <div style={{ borderTop: "1.5px solid #1e293b", marginTop: "10px", paddingTop: "10px" }}>
            <div style={{ fontWeight: "700", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px", color: "#475569" }}>Complaints</div>
            <E value={form.complaints} onChange={v => setField("complaints", v)} multiline rows={3} editing={editing} placeholder="Chief complaints…" style={{ fontSize: "13px" }} />
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column" }}>
          <div style={{ fontWeight: "800", fontSize: "16px", borderBottom: "2px solid #1e293b", paddingBottom: "5px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "22px" }}>℞</span> Prescription
          </div>

          {/* Medicine table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#1e293b", color: "#fff" }}>
                  {["#", "Medicine Name", "Mrng", "Aft", "Night", "Days", "Route", "Note"].map(h => (
                    <th key={h} style={{ padding: "8px 7px", textAlign: "center", fontSize: "12px", fontWeight: "700", fontFamily: "'Georgia',serif" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {medicines.map((row, i) => (
                  <MedRow key={i} row={row} idx={i} hospitalId={hospitalId} onChange={onMedChange} onRemove={onMedRemove} editing={editing} />
                ))}
                {editing && (
                  <tr>
                    <td colSpan={8} style={{ padding: "8px", textAlign: "center", border: "1px solid #94a3b8", background: "#f8fafc" }}>
                      <button onClick={onAddMed}
                        style={{ background: "#059669", color: "#fff", border: "none", borderRadius: "7px", padding: "6px 20px", cursor: "pointer", fontSize: "13px", fontWeight: "700", fontFamily: "Georgia,serif" }}>
                        + Add Medicine
                      </button>
                    </td>
                  </tr>
                )}
                {!editing && [...Array(Math.max(0, 5 - medicines.length))].map((_, i) => (
                  <tr key={"e" + i}>
                    {[...Array(8)].map((_, j) => <td key={j} style={{ border: "1px solid #94a3b8", padding: "11px" }}>&nbsp;</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Diagnosis */}
          <div style={{ marginTop: "14px", fontSize: "14px" }}>
            <b>Diagnosis: </b>
            <E value={form.diagnosis} onChange={v => setField("diagnosis", v)} editing={editing} placeholder="Enter diagnosis…" style={{ fontSize: "14px" }} />
          </div>

          {/* Follow up */}
          {(editing || form.followUpDate) && (
            <div style={{ marginTop: "8px", fontSize: "13px" }}>
              <b>Follow Up: </b>
              {editing
                ? <input type="date" value={form.followUpDate || ""} onChange={e => setField("followUpDate", e.target.value)}
                    style={{ border: "none", borderBottom: "1.5px dashed #93c5fd", outline: "none", fontSize: "13px", fontFamily: "Georgia,serif" }} />
                : fmtDate(form.followUpDate)}
            </div>
          )}

          {renderJsonBlocks(rxInfo?.instructionsJson, "Additional Instructions")}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ borderTop: "2.5px solid #1e293b", display: "flex", minHeight: "70px", marginTop: "auto" }}>
        <div style={{ width: "200px", borderRight: "2.5px solid #1e293b", padding: "10px 12px", fontSize: "12px" }}>
          <div style={{ fontWeight: "700", marginBottom: "3px" }}>Location</div>
          <div style={{ color: "#475569", lineHeight: "1.5" }}>{rxInfo?.hospitalAddress || ""}</div>
        </div>
        <div style={{ flex: 1, padding: "10px 16px", fontSize: "12px" }}>
          <div style={{ fontWeight: "700", marginBottom: "3px" }}>Medical Instructions</div>
          <E value={form.medicalInstructions} onChange={v => setField("medicalInstructions", v)} editing={editing} placeholder="Footer medical instructions…" multiline rows={2} style={{ color: "#475569", fontSize: "12px" }} />
          {renderJsonBlocks(rxInfo?.footerJson, "Footer Details")}
        </div>
      </div>
       
    </div>

  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════ */
export default function PrescriptionPage({ session, initialPatient, onClearInitialPatient }) {
  const auth = useAuth() || {};
  const user = session || auth.user || getStoredUser() || {};
  const role = (user?.role || "").toUpperCase().replace(/\s/g, "_");
  const hid  = user?.hospitalId || (role === "HOSPITAL_ADMIN" ? user?.id : undefined);
  const uid  = user?.userId || user?.id || user?.doctorId || user?.doctorUserId;
  const loggedDoctorId = role === "DOCTOR" ? numericId(uid) : null;

  const [view,       setView]       = useState("list");
  const [editingId,  setEditingId]  = useState(null);
  const [template,   setTemplate]   = useState("TEMPLATE_1");
  const [medicines,  setMedicines]  = useState([{ ...EMPTY_MED }]);
  const [prescList,  setPrescList]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [previewData,setPreviewData]= useState(null);
  const [history,    setHistory]    = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [reportFile, setReportFile] = useState(null);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // resolved from APIs
  const [pat,    setPat]    = useState(null);
  const [doc,    setDoc]    = useState(null);
  const [rxInfo, setRxInfo] = useState(null);
  const [infoLocation, setInfoLocation] = useState("");
  const [infoRegNo, setInfoRegNo] = useState("");
  const [infoInstructions, setInfoInstructions] = useState([{ heading: "", value: "" }]);
  const [infoFooter, setInfoFooter] = useState([{ heading: "", value: "" }]);
  const [infoSaving, setInfoSaving] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);

  // ids
  const [patId, setPatId] = useState(null);
  const [docId, setDocId] = useState(loggedDoctorId ? String(loggedDoctorId) : null);

  const [form, setFormState] = useState({
    complaints: "", diagnosis: "", bloodPressure: "", weight: "",
    temperature: "", pulseRate: "", oxygenLevel: "", instructions: "",
    medicalInstructions: "", patientNotes: "", reportUrl: "", reportName: "",
    followUpDate: "", prescriptionDate: todayISO(),
  });
  const setField = (f, v) => setFormState(s => ({ ...s, [f]: v }));

  const printRef = useRef();

  /* load list */
  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const fn = role === "DOCTOR" ? PrescriptionAPI.byDoctor(uid) : PrescriptionAPI.byHospital(hid);
      const res = await fn;
      setPrescList(res.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [hid, uid, role]);

  useEffect(() => { loadList(); }, [loadList]);

  useEffect(() => {
    if (role !== "HOSPITAL_ADMIN" || !hid) {
      setDoctors([]);
      return;
    }

    let cancelled = false;
    setDoctorsLoading(true);
    UserAPI.doctors(hid)
      .then(res => {
        if (cancelled) return;
        const list = res.data || [];
        setDoctors(list);
        setDocId(current => current || (list[0]?.userId ? String(list[0].userId) : null));
      })
      .catch(err => {
        console.error("Failed to load doctors for prescription defaults:", err);
        if (!cancelled) setDoctors([]);
      })
      .finally(() => {
        if (!cancelled) setDoctorsLoading(false);
      });

    return () => { cancelled = true; };
  }, [hid, role]);

  /* fetch patient when patId changes */
  useEffect(() => {
    if (!patId) { setPat(null); setHistory([]); return; }
    patient(patId).then(d => setPat(d?.data || d)).catch(() => setPat(null));
    setHistoryLoading(true);
    AppointmentAPI.getAppointmentsByCustomer(patId)
      .then(res => setHistory(res.data || []))
      .catch(err => {
        console.error("Failed to load appointment history:", err);
        setHistory([]);
      })
      .finally(() => setHistoryLoading(false));
  }, [patId]);

  /* auto-load own profile if doctor */
  useEffect(() => {
    if (loggedDoctorId && String(docId || "") !== String(loggedDoctorId)) {
      setDocId(String(loggedDoctorId));
    }
  }, [loggedDoctorId, docId]);

  /* fetch doctor when docId changes */
  useEffect(() => {
    const id = loggedDoctorId || docId;
    if (!id) {
      setDoc(null); setRxInfo(null);
      setInfoLocation(""); setInfoRegNo("");
      setInfoInstructions([{ heading: "", value: "" }]);
      setInfoFooter([{ heading: "", value: "" }]);
      return;
    }
    doctor(id).then(d => setDoc(d?.data || d)).catch(() => setDoc(null));
    getRxInfo(id).then(d => {
      const data = d?.data || d;
      setRxInfo(data);
      setInfoLocation(data?.location || "");
      setInfoRegNo(data?.regNo || "");
      const instructions = parseBlocks(data?.instructionsJson);
      const footer = parseBlocks(data?.footerJson);
      setInfoInstructions(instructions.length ? instructions : [{ heading: "", value: "" }]);
      setInfoFooter(footer.length ? footer : [{ heading: "", value: "" }]);
    }).catch(() => {
      setRxInfo(null);
      setInfoLocation(""); setInfoRegNo("");
      setInfoInstructions([{ heading: "", value: "" }]);
      setInfoFooter([{ heading: "", value: "" }]);
    });
  }, [docId, loggedDoctorId]);

  /* handle handoff from appointments */
  useEffect(() => {
    if (initialPatient?.custId) {
      setPatId(String(initialPatient.custId));
      if (loggedDoctorId) setDocId(String(loggedDoctorId));
      else if (initialPatient.doctorId) setDocId(String(initialPatient.doctorId));
      resetForm(initialPatient.appointmentId);
      setView("create");
      onClearInitialPatient?.();
    }
  }, [initialPatient]);

  const resetForm = (appointmentId = "") => {
    setFormState({
      complaints: "", diagnosis: "", bloodPressure: "", weight: "",
      temperature: "", pulseRate: "", oxygenLevel: "",
      instructions: rxInfo?.defaultInstructions || "Take medicine after food.\nDrink warm water.\nComplete full course.",
      medicalInstructions: rxInfo?.defaultFooter || "Follow up after 7 days if symptoms continue.",
      patientNotes: "", reportUrl: "", reportName: "",
      followUpDate: "", prescriptionDate: todayISO(), appointmentId,
    });
    setMedicines([{ ...EMPTY_MED }]);
    setTemplate("TEMPLATE_1");
    setReportFile(null);
    setStatusMessage("");
  };

  const openCreate = () => {
    setEditingId(null);
    setPatId(null); setDocId(loggedDoctorId ? String(loggedDoctorId) : null);
    setPat(null);
    resetForm();
    setView("create");
  };

  const openEdit = (p) => {
    setEditingId(p.prescriptionId);
    setPatId(String(p.customerId || ""));
    setDocId(loggedDoctorId ? String(loggedDoctorId) : String(p.doctorId || ""));
    setTemplate(p.templateType || "TEMPLATE_1");
    setFormState({
      complaints: p.complaints || "", diagnosis: p.diagnosis || "",
      bloodPressure: p.bloodPressure || "", weight: p.weight || "",
      temperature: p.temperature || "", pulseRate: p.pulseRate || "",
      oxygenLevel: p.oxygenLevel || "", instructions: p.instructions || "",
      medicalInstructions: p.medicalInstructions || "", patientNotes: p.patientNotes || "",
      reportUrl: p.reportUrl || "", reportName: p.reportName || "",
      followUpDate: p.followUpDate || "",
      prescriptionDate: p.prescriptionDate || todayISO(),
    });
    setReportFile(null);
    try { setMedicines(JSON.parse(p.medicinesJson || "[]") || [{ ...EMPTY_MED }]); }
    catch { setMedicines([{ ...EMPTY_MED }]); }
    setView("create");
  };

  const selectedDoctor = doctors.find(d => String(d.userId) === String(docId));
  const resolveDoctorId = () =>
    loggedDoctorId ||
    numericId(docId) ||
    numericId(doc?.userId) ||
    numericId(doc?.id) ||
    numericId(rxInfo?.doctorId) ||
    numericId(selectedDoctor?.userId) ||
    numericId(doctors[0]?.userId);

  const sameText = (a, b) =>
    String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();

  const findSessionDoctor = (list) => {
    const sessionId = numericId(user?.userId || user?.id || user?.doctorId || user?.doctorUserId);
    if (sessionId) {
      const byId = list.find(d => numericId(d.userId) === sessionId || numericId(d.id) === sessionId);
      if (byId) return byId;
    }

    return list.find(d =>
      sameText(d.email, user?.email) ||
      sameText(d.userName, user?.userName) ||
      sameText(d.userName, user?.ownerName) ||
      sameText(d.contact, user?.contactNo)
    );
  };

  const resolveDoctorIdForSave = async () => {
    const currentId = resolveDoctorId();
    if (currentId) return currentId;
    if (!hid) return null;

    const list = doctors.length ? doctors : (await UserAPI.doctors(hid)).data || [];
    if (!doctors.length) setDoctors(list);

    const matched = role === "DOCTOR" ? findSessionDoctor(list) : list[0];
    const matchedId = numericId(matched?.userId || matched?.id);
    if (matchedId) {
      setDocId(String(matchedId));
      setDoc(matched);
      return matchedId;
    }
    return null;
  };

  const savePrescriptionInfo = async () => {
    setInfoSaving(true);
    try {
      const doctorId = await resolveDoctorIdForSave();
      if (!doctorId) {
        alert("No doctor account was found for this login. Please add this doctor in Staff / Users first.");
        return;
      }

      const payload = {
        doctorId,
        hospitalId: hid,
        hospitalName: rxInfo?.hospitalName || "",
        hospitalAddress: rxInfo?.hospitalAddress || "",
        hospitalPhone: rxInfo?.hospitalPhone || "",
        hospitalEmail: rxInfo?.hospitalEmail || "",
        location: infoLocation,
        regNo: infoRegNo,
        defaultInstructions: blocksToPlainText(infoInstructions),
        defaultFooter: blocksToPlainText(infoFooter),
        instructionsJson: serializeBlocks(infoInstructions),
        footerJson: serializeBlocks(infoFooter),
      };

      try {
        await PrescriptionInfoAPI.update(doctorId, payload);
      } catch (updateErr) {
        const status = updateErr?.response?.status;
        if (status === 404 || status === 405 || status === 500) {
          await PrescriptionInfoAPI.create(payload);
        } else {
          throw updateErr;
        }
      }

      const updated = await PrescriptionInfoAPI.get(doctorId);
      const info = updated.data || updated;
      setRxInfo(info);
      setInfoLocation(info?.location || "");
      setInfoRegNo(info?.regNo || "");
      const instructions = parseBlocks(info?.instructionsJson);
      const footer = parseBlocks(info?.footerJson);
      setInfoInstructions(instructions.length ? instructions : [{ heading: "", value: "" }]);
      setInfoFooter(footer.length ? footer : [{ heading: "", value: "" }]);
      // notify other pages/components that prescription defaults updated
      try { window.dispatchEvent(new CustomEvent('rxinfo:updated', { detail: { doctorId } })); } catch (e) { /* ignore */ }
      alert("Prescription defaults saved.");
    } catch (err) {
      console.error("Failed to save prescription defaults:", err);
      const message = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Unknown error";
      alert(`Failed to save prescription defaults: ${message}`);
    } finally {
      setInfoSaving(false);
    }
  };

  const addMed    = () => setMedicines(m => [...m, { ...EMPTY_MED }]);
  const removeMed = (i) => setMedicines(m => m.filter((_, idx) => idx !== i));
  const updateMed = (i, f, v) => setMedicines(m => m.map((row, idx) => idx === i ? { ...row, [f]: v } : row));

  const buildPayload = () => ({
    ...form,
    prescriptionId: editingId,
    templateType: template,
    hospitalId: hid,
    doctorId: loggedDoctorId || docId || "",
    customerId: patId || "",
    patientName: pat?.custName || "",
    patientAge: pat?.age || "",
    patientGender: pat?.gender || "",
    patientContact: pat?.custContact || "",
    patientAddress: pat?.custAddress || "",
    bloodGroup: pat?.bloodGroup || "",
    doctorName: doc?.userName || "",
    doctorQualification: doc?.qualification || "",
    doctorSpecialization: doc?.specialization || "",
    doctorContact: doc?.contact || "",
    hospitalName: rxInfo?.hospitalName || "",
    hospitalAddress: rxInfo?.hospitalAddress || "",
    hospitalContact: rxInfo?.hospitalPhone || "",
    hospitalEmail: rxInfo?.hospitalEmail || "",
    medicinesJson: JSON.stringify(medicines.filter(m => m.medicineName?.trim())),
  });

  const save = async () => {
    if (!patId) { alert("No patient loaded"); return; }
    if (medicines.filter(m => m.medicineName?.trim()).length === 0) { alert("Add at least one medicine"); return; }
    setSaving(true);
    try {
      const payload = buildPayload();
      let result;
      if (editingId) result = await PrescriptionAPI.update(editingId, payload);
      else           result = await PrescriptionAPI.create(payload);
      const prescriptionId = editingId || result?.data?.prescriptionId || result?.data?.id || payload.prescriptionId;
      if (reportFile && prescriptionId) {
        try {
          await PrescriptionAPI.uploadReport(prescriptionId, reportFile);
        } catch (uploadError) {
          console.warn("Report upload failed", uploadError);
          alert("Saved, but report upload failed.");
        }
      }
      alert(editingId ? "Updated!" : "Saved!");
      setView("list"); loadList();
    } catch (e) { alert(e.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  
  
  const btn = (bg, c = "#fff", p = "8px 18px", extra = {}) => ({
    background: bg, color: c, border: "none", padding: p, borderRadius: "8px",
    cursor: "pointer", fontWeight: "700", fontSize: "13px", fontFamily: "Georgia,serif", ...extra
  });
  const selectedDoctorText = doc?.userName
    ? `${doc.userName}${doc.specialization ? ` - ${doc.specialization}` : ""}`
    : selectedDoctor?.userName
      ? `${selectedDoctor.userName}${selectedDoctor.specialization ? ` - ${selectedDoctor.specialization}` : ""}`
      : (user?.userName || user?.ownerName || (resolveDoctorId() ? `Doctor #${resolveDoctorId()}` : ""));

  /* ── LIST ── */
  

  /* ── CREATE / EDIT ── */
  return (
    <div>
      {/* Toolbar */}
      <div style={{ marginBottom: "16px", display: "flex", gap: "10px", alignItems: "center", background: "#fff", padding: "12px 18px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
        <button style={btn("#64748b")} onClick={() => setView("list")}>← Back</button>
        <span style={{ marginLeft: "auto", color: "#64748b", fontSize: "13px" }}>Prescription Defaults</span>
      </div>

      {(role === "DOCTOR" || role === "HOSPITAL_ADMIN") && (
        <div style={{ marginBottom: "18px", background: "#fff", borderRadius: "14px", padding: "18px", boxShadow: "0 1px 12px rgba(15,23,42,0.08)" }}>
          <div style={{ fontWeight: "700", marginBottom: "14px", fontSize: "15px" }}>Prescription Defaults</div>
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontWeight: "600", marginBottom: "6px" }}>Doctor</div>
            <input
              value={doctorsLoading ? "Loading doctor..." : selectedDoctorText}
              readOnly
              placeholder="Logged-in doctor"
              style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "10px", fontSize: "13px", background: "#f8fafc", color: "#475569", cursor: "not-allowed" }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <div style={{ fontWeight: "600", marginBottom: "6px" }}>Location</div>
              <input
                value={infoLocation}
                onChange={e => setInfoLocation(e.target.value)}
                placeholder="Clinic / branch location"
                style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "10px", fontSize: "13px" }}
              />
            </div>
            <div>
              <div style={{ fontWeight: "600", marginBottom: "6px" }}>Registration No.</div>
              <input
                value={infoRegNo}
                onChange={e => setInfoRegNo(e.target.value)}
                placeholder="Doctor registration number"
                style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "10px", fontSize: "13px" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
            <div style={{ background: "#f8fafc", borderRadius: "14px", padding: "16px", border: "1px solid #cbd5e1" }}>
              <div style={{ fontWeight: "700", marginBottom: "12px" }}>Instructions</div>
              {infoInstructions.map((item, idx) => (
                <div key={idx} style={{ marginBottom: "12px" }}>
                  <input
                    value={item.heading}
                    onChange={e => setInfoInstructions(ins => ins.map((it, i) => i === idx ? { ...it, heading: e.target.value } : it))}
                    placeholder="Heading"
                    style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "10px", fontSize: "13px", marginBottom: "8px" }}
                  />
                  <textarea
                    value={item.value}
                    onChange={e => setInfoInstructions(ins => ins.map((it, i) => i === idx ? { ...it, value: e.target.value } : it))}
                    placeholder="Value"
                    rows={3}
                    style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "10px", fontSize: "13px", resize: "vertical" }}
                  />
                  <button
                    type="button"
                    onClick={() => setInfoInstructions(ins => ins.filter((_, i) => i !== idx) || [{ heading: "", value: "" }])}
                    style={{ marginTop: "8px", background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "12px" }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setInfoInstructions(ins => [...ins, { heading: "", value: "" }])}
                style={{ background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontSize: "13px" }}
              >
                + Add Instruction
              </button>
            </div>

            <div style={{ background: "#f8fafc", borderRadius: "14px", padding: "16px", border: "1px solid #cbd5e1" }}>
              <div style={{ fontWeight: "700", marginBottom: "12px" }}>Footer</div>
              {infoFooter.map((item, idx) => (
                <div key={idx} style={{ marginBottom: "12px" }}>
                  <input
                    value={item.heading}
                    onChange={e => setInfoFooter(foot => foot.map((it, i) => i === idx ? { ...it, heading: e.target.value } : it))}
                    placeholder="Footer heading"
                    style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "10px", fontSize: "13px", marginBottom: "8px" }}
                  />
                  <textarea
                    value={item.value}
                    onChange={e => setInfoFooter(foot => foot.map((it, i) => i === idx ? { ...it, value: e.target.value } : it))}
                    placeholder="Footer value"
                    rows={3}
                    style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "10px", fontSize: "13px", resize: "vertical" }}
                  />
                  <button
                    type="button"
                    onClick={() => setInfoFooter(foot => foot.filter((_, i) => i !== idx) || [{ heading: "", value: "" }])}
                    style={{ marginTop: "8px", background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "12px" }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setInfoFooter(foot => [...foot, { heading: "", value: "" }])}
                style={{ background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontSize: "13px" }}
              >
                + Add Footer Row
              </button>
            </div>
          </div>

          <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
            
            <button
              type="button"
              onClick={savePrescriptionInfo}
              disabled={infoSaving}
              style={{ background: "#0f766e", color: "#fff", border: "none", borderRadius: "10px", padding: "10px 18px", cursor: "pointer", fontSize: "13px" }}
            >
              {infoSaving ? "Saving…" : "Save Defaults"}
            </button>
            
          </div>
        </div>
      )}

    </div>
  );
}
