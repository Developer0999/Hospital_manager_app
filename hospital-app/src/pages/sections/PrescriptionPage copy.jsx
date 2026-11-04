import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useAuth } from "../AuthContext";
import { AppointmentAPI, PrescriptionAPI, PrescriptionInfoAPI, patient, doctor, rxInfo as getRxInfo, medSearch } from "../api";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const todayISO = () => new Date().toISOString().split("T")[0];
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const blocksToPlainText = (blocks) =>
  (blocks || [])
    .map(b => [b.heading?.trim(), b.value?.trim()].filter(Boolean).join(b.heading && b.value ? ": " : ""))
    .filter(Boolean)
    .join("\n");

const parseBlocks = (raw) => {
  try {
    const data = JSON.parse(raw || "[]");
    return Array.isArray(data) ? data : [];
  } catch { return []; }
};

const parseReportFiles = (prescription) => {
  try {
    const files = JSON.parse(prescription?.reportFilesJson || "[]");
    if (Array.isArray(files) && files.length) return files;
  } catch {}
  return prescription?.reportUrl
    ? [{ name: prescription.reportName || "Uploaded report", url: prescription.reportUrl, saved: true }]
    : [];
};

const normalizeRxInfo = (info) => {
  if (!info) return info;
  const normalized = { ...info };
  if (!normalized.defaultInstructions && normalized.instructionsJson)
    normalized.defaultInstructions = blocksToPlainText(parseBlocks(normalized.instructionsJson));
  if (!normalized.defaultFooter && normalized.footerJson)
    normalized.defaultFooter = blocksToPlainText(parseBlocks(normalized.footerJson));
  return normalized;
};

const normalizeLogoSrc = (src) => {
  const value = (src || "").trim();
  if (!value) return "";
  if (/^(https?:|data:|blob:|\/)/i.test(value)) return value;
  const fileName = value.split(/[\\/]/).pop();
  return fileName ? `/logos/${encodeURIComponent(fileName)}` : "";
};

const DEFAULT_LOGO = "/logos/HospitalLogo.png";
const EMPTY_MED = { medicineId: "", medicineName: "", morning: false, afternoon: false, night: false, days: "", note: "", route: "Oral" };

const getStoredUser = () => {
  for (const key of ["hospital", "session"]) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return null;
};

const useViewportWidth = () => {
  const [width, setWidth] = useState(() => (typeof window === "undefined" ? 1366 : window.innerWidth));
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
};

const A4_WIDTH  = 794;
const A4_HEIGHT = 1123;
const FIXED_OVERHEAD = 340;
const MED_ROW_HEIGHT = 36;
const MED_NOTE_ROW_HEIGHT = 28;
const BODY_AVAILABLE = A4_HEIGHT - FIXED_OVERHEAD;

/* ══════════════════════════════════════════════════════════════════════════
   MEDICINE ROW
══════════════════════════════════════════════════════════════════════════ */
function MedRow({ row, idx, hospitalId, onChange, onRemove, onAddMed, isLast, editing }) {
  const [query, setQuery] = useState(row.medicineName || "");
  const [sugs,  setSugs]  = useState([]);
  const [open,  setOpen]  = useState(false);
  const debounceRef = useRef();
  const medRef  = useRef();
  const noteRef = useRef();

  useEffect(() => { setQuery(row.medicineName || ""); }, [row.medicineName]);
  useEffect(() => {
    if (medRef.current) { medRef.current.style.height = "auto"; medRef.current.style.height = medRef.current.scrollHeight + "px"; }
  }, [query]);
  useEffect(() => {
    if (noteRef.current) { noteRef.current.style.height = "auto"; noteRef.current.style.height = noteRef.current.scrollHeight + "px"; }
  }, [row.note]);

  const search = (val) => {
    setQuery(val);
    onChange(idx, "medicineName", val);
    clearTimeout(debounceRef.current);
    if (val.length >= 2) {
      debounceRef.current = setTimeout(async () => {
        try {
          const data = await medSearch(hospitalId, val);
          setSugs((data?.medicines || data || []).slice(0, 8));
          setOpen(true);
        } catch { setSugs([]); }
      }, 280);
    } else { setOpen(false); setSugs([]); }
  };

  const pick = (m) => {
    setQuery(m.medicineName || m.name);
    onChange(idx, "medicineName", m.type ? `${m.type}-${m.medicineName || m.name} ` : m.medicineName || m.name);
    onChange(idx, "medicineId", m.medicineId || m.id || "");
    setOpen(false); setSugs([]);
    if (editing && isLast) onAddMed?.();
  };

  const cb = (field) => (
    <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: editing ? "pointer" : "default" }}>
      <input type="checkbox" checked={!!row[field]}
        onChange={e => editing && onChange(idx, field, e.target.checked)}
        disabled={!editing}
        style={{ width: 15, height: 15, accentColor: "#1d4ed8", cursor: editing ? "pointer" : "default" }} />
    </label>
  );

  const cell = { border: "1px solid #94a3b8", padding: "4px 3px", textAlign: "center", fontSize: "11px", verticalAlign: "middle", wordBreak: "break-word" };
  const inp  = { border: "none", outline: "none", background: "transparent", width: "100%", fontSize: "11px", fontFamily: "inherit", wordBreak: "break-word", boxSizing: "border-box" };

  if (!editing) return (
    <>
      <tr style={{ background: idx % 2 === 0 ? "#fff" : "#f8fafc" }}>
        <td style={{ ...cell, color: "#64748b" }}>{idx + 1}</td>
        <td style={{ ...cell, textAlign: "left", fontWeight: 600 }}>{row.medicineName || "—"}</td>
        <td style={cell}>{row.morning   ? "✓" : "—"}</td>
        <td style={cell}>{row.afternoon ? "✓" : "—"}</td>
        <td style={cell}>{row.night     ? "✓" : "—"}</td>
        <td style={cell}>{row.days || "—"}</td>
      </tr>
      {row.note ? (
        <tr style={{ background: idx % 2 === 0 ? "#fff" : "#f8fafc" }}>
          <td colSpan={6} style={{ ...cell, borderTop: "none", textAlign: "left", color: "#475569", fontStyle: "italic", fontSize: "11px" }}>
            ↳ {row.note}
          </td>
        </tr>
      ) : null}
    </>
  );

  return (
    <>
      <tr style={{ background: idx % 2 === 0 ? "#fff" : "#f0f9ff" }}>
        <td style={{ ...cell, color: "#64748b", width: 24 }}>{idx + 1}</td>
        <td style={{ ...cell, textAlign: "left", minWidth: 140, position: "relative" }}>
          <textarea ref={medRef} value={query} onChange={e => search(e.target.value)}
            placeholder="Search medicine…" rows={1}
            style={{ ...inp, fontWeight: 600, resize: "none", overflow: "hidden" }} />
          {open && sugs.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #cbd5e1", borderRadius: 10, zIndex: 300, boxShadow: "0 8px 24px rgba(0,0,0,0.13)", maxHeight: 180, overflowY: "auto" }}>
              {sugs.map((m, i) => (
                <div key={i} onMouseDown={() => pick(m)}
                  style={{ padding: "7px 12px", cursor: "pointer", fontSize: 12, borderBottom: "1px solid #f1f5f9" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <strong>{m.medicineName || m.name}</strong>
                  {m.type && <span style={{ color: "#94a3b8", fontSize: 11 }}> — {m.type}</span>}
                </div>
              ))}
            </div>
          )}
        </td>
        <td style={cell}>{cb("morning")}</td>
        <td style={cell}>{cb("afternoon")}</td>
        <td style={cell}>{cb("night")}</td>
        <td style={{ ...cell, width: 48 }}>
          <input value={row.days} onChange={e => onChange(idx, "days", e.target.value)}
            placeholder="—" style={{ ...inp, textAlign: "center", width: 40 }} />
        </td>
        <td style={{ ...cell, width: 36, textAlign: "center" }}>
          <button onMouseDown={() => onRemove(idx)}
            style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 11, padding: "2px 5px" }}>✕</button>
        </td>
      </tr>
      <tr>
        <td colSpan={7} style={{ padding: "0 4px 4px 28px", borderBottom: "1px solid #e2e8f0" }}>
          <textarea ref={noteRef} value={row.note || ""} onChange={e => onChange(idx, "note", e.target.value)}
            placeholder="Note (optional)" rows={1}
            style={{ ...inp, fontSize: 11, color: "#475569", resize: "none", overflow: "hidden", fontStyle: "italic" }} />
        </td>
      </tr>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   EDITABLE INLINE FIELD
══════════════════════════════════════════════════════════════════════════ */
function E({ value, onChange, placeholder = "—", style = {}, multiline = false, editing = true, rows = 3 }) {
  const textareaRef = useRef(null);
  const base = { border: "none", outline: "none", background: "transparent", fontFamily: "inherit", fontSize: "inherit", color: "inherit", padding: 0, width: "100%" };
  const edit = { ...base, borderBottom: "1.5px dashed #93c5fd" };
  useEffect(() => {
    if (!multiline || !textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [value, multiline]);
  if (!editing) return <span style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", ...style }}>{value || placeholder}</span>;
  if (multiline) return (
    <textarea
      ref={textareaRef}
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{ ...style, ...edit, resize: "none", overflow: "hidden", minHeight: `${rows * 17}px`, display: "block", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
    />
  );
  return <input value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...style, ...edit }} />;
}

/* ══════════════════════════════════════════════════════════════════════════
   SINGLE A4 PAGE SHELL
══════════════════════════════════════════════════════════════════════════ */
function A4Page({ children, pageNum, totalPages, pat, doc, rxInfo, form, editing, setField, user, isFirst, isLast, locationValue, onLocationChange }) {
  const hospitalInfo = user?.hospitalInfo || {};
  const hospitalAddress = [hospitalInfo.address, hospitalInfo.city, hospitalInfo.state, hospitalInfo.pincode].filter(Boolean).join(", ");
  const templateHospital = {
    logo: normalizeLogoSrc(rxInfo?.logoUrl || hospitalInfo.logo) || DEFAULT_LOGO,
    name: rxInfo?.hospitalName || rxInfo?.hospital_name || hospitalInfo.hospitalName || user?.hospitalName || "Clinic Name",
    address: rxInfo?.hospitalAddress || hospitalAddress || "",
    email: rxInfo?.hospitalEmail || hospitalInfo.email || user?.email || "",
    phone: rxInfo?.hospitalPhone || hospitalInfo.contactNo || user?.contactNo || "",
  };
  const handleLogoError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = DEFAULT_LOGO;
  };

  return (
    <div style={{
      width: A4_WIDTH, minHeight: A4_HEIGHT, background: "#fff",
      margin: "0 auto 24px", border: "2.5px solid #1e293b",
      fontFamily: "'Georgia', serif", fontSize: 13,
      boxSizing: "border-box", boxShadow: "0 4px 32px rgba(0,0,0,0.13)",
      display: "flex", flexDirection: "column", overflow: "hidden",
      pageBreakAfter: "always", position: "relative"
    }}>
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: "none", zIndex: 0, opacity: 0.08
      }}>
        <img src={templateHospital.logo} onError={handleLogoError} style={{ width: "70%", maxWidth: 520, height: "auto", objectFit: "contain" }} alt="" />
      </div>
      {/* ── HEADER ── */}
      <div style={{ borderBottom: "2.5px solid #1e293b", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ width: "113px", height: "113px",  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
            <img src={templateHospital.logo} onError={handleLogoError} style={{ width: "100%", height: "100%", objectFit: "contain" }} alt="logo" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.2, overflowWrap: "anywhere" }}>{templateHospital.name}</div>
            <div style={{ fontSize: 10, color: "#475569", marginTop: 2, overflowWrap: "anywhere" }}>{templateHospital.address}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>
              {templateHospital.email && <span>✉ {templateHospital.email}</span>}
              {templateHospital.email && templateHospital.phone && <span> | </span>}
              {templateHospital.phone && <span>☎ {templateHospital.phone}</span>}
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 9, flexShrink: 0, color: "#475569", maxWidth: 100, overflowWrap: "anywhere" }}>
            <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: 2 }}>Doctor Contact</div>
            <div style={{ fontSize: 8 }}>{doc?.contact || rxInfo?.doctorPhone || "—"}</div>
            <div style={{ fontSize: 8 }}>{doc?.email || ""}</div>
          </div>
        </div>
        <div style={{ textAlign: "center", paddingTop: 6, borderTop: "1.5px solid #e2e8f0" }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#1e293b" }}>
            Dr. {doc?.userName || "—"}
            {doc?.qualification ? <span style={{ fontWeight: 400, fontSize: 11 }}> ({doc.qualification})</span> : ""}
          </div>
          <div style={{ fontSize: 10, color: "#64748b", fontStyle: "italic" }}>{doc?.specialization || ""}</div>
          {(doc?.regNo || rxInfo?.regNo) && <div style={{ fontSize: 9, color: "#94a3b8" }}>Reg: {doc?.regNo || rxInfo?.regNo}</div>}
        </div>
      </div>

      {/* ── PATIENT INFO (first page only) ── */}
      {isFirst && (
        <div style={{ borderBottom: "2.5px solid #1e293b", padding: "6px 12px", background: "#f8fafc", fontSize: 10 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 2 }}>
            <span><b>Patient:</b> {pat?.custName || "—"}</span>
            <span><b>Age:</b> {pat?.age || "—"}</span>
            <span><b>Gender:</b> {pat?.gender || "—"}</span>
            <span><b>Contact:</b> {pat?.custContact || "—"}</span>
            <span><b>Blood Group:</b> {pat?.bloodGroup || "—"}</span>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span><b>Address:</b> {pat?.custAddress || "—"}</span>
            <span style={{ marginLeft: "auto", whiteSpace: "nowrap" }}><b>Date:</b> {fmtDate(form.prescriptionDate)}</span>
          </div>
        </div>
      )}

      {!isFirst && (
        <div style={{ borderBottom: "1px solid #e2e8f0", padding: "4px 12px", background: "#f8fafc", fontSize: 9, color: "#64748b", display: "flex", justifyContent: "space-between" }}>
          <span><b>Patient:</b> {pat?.custName || "—"} | <b>Date:</b> {fmtDate(form.prescriptionDate)}</span>
          <span>Page {pageNum} of {totalPages}</span>
        </div>
      )}

      {/* ── BODY ── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div style={{
          width: 140, flexShrink: 0, borderRight: "2.5px solid #1e293b",
          padding: "10px 8px", boxSizing: "border-box",
          display: "flex", flexDirection: "column", overflow: "hidden"
        }}>
          <div style={{ fontWeight: 800, fontSize: 11, borderBottom: "2px solid #1e293b", paddingBottom: 3, marginBottom: 6, letterSpacing: "0.2px" }}>
            Instructions
          </div>
          {editing ? (
            <textarea
              value={form.instructions || rxInfo?.defaultInstructions || ""}
              onChange={e => setField("instructions", e.target.value)}
              placeholder="Write instructions…"
              style={{
                flex: 1, border: "none", outline: "none", background: "transparent",
                fontFamily: "'Georgia', serif", fontSize: 11, lineHeight: 1.5,
                resize: "none", width: "100%", boxSizing: "border-box",
                overflowY: "auto", wordBreak: "break-word"
              }}
            />
          ) : (
            <div style={{
              flex: 1, fontSize: 11, lineHeight: 1.5, overflowY: "hidden",
              wordBreak: "break-word", whiteSpace: "pre-wrap",
              width: "100%", boxSizing: "border-box"
            }}>
              {form.instructions || rxInfo?.defaultInstructions || ""}
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0, padding: "10px 10px", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
          {isFirst && (
            <div style={{ fontWeight: 800, fontSize: 13, borderBottom: "2px solid #1e293b", paddingBottom: 3, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 16 }}>℞</span> Prescription
              {totalPages > 1 && <span style={{ fontSize: 9, fontWeight: 400, color: "#64748b", marginLeft: "auto" }}>Page 1 of {totalPages}</span>}
            </div>
          )}

          {children}

          {isLast && (
            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
              {(editing || form.followUpDate) && (
                <div style={{ fontSize: 10 }}>
                  <b>Follow Up: </b>
                  {editing
                    ? <input type="date" value={form.followUpDate || ""} onChange={e => setField("followUpDate", e.target.value)}
                        style={{ border: "none", borderBottom: "1.5px dashed #93c5fd", color: "#c91212", outline: "none", fontSize: 10, fontFamily: "Georgia,serif" }} />
                    : <span style={{ color: "#c91212" }}>{fmtDate(form.followUpDate)}</span>}
                </div>
              )}

              <div style={{ display: "flex", gap: 8, fontSize: 9, padding: "4px 8px", border: "1px dashed #e2e8f0", borderRadius: 3, flexWrap: "wrap" }}>
                {[["bloodPressure","BP"],["weight","Wt"],["temperature","T"],["pulseRate","Pulse"],["oxygenLevel","O2"]].map(([f, l]) => (
                  <span key={f} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {l}:
                    <E value={form[f]} onChange={v => setField(f, v)} editing={editing} placeholder="—" style={{ fontWeight: 700, width: 40, fontSize: 9 }} />
                  </span>
                ))}
              </div>

              <div style={{ textAlign: "right", marginTop: 10 }}>
                <div style={{ display: "inline-block", textAlign: "center" }}>
                  <div style={{ width: 120, borderTop: "2px solid #1e293b", paddingTop: 2, fontWeight: 700, fontSize: 10 }}>
                    Dr. {doc?.userName || "—"}
                  </div>
                  <div style={{ fontSize: 8, color: "#64748b" }}>Signature & Stamp</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ borderTop: "2.5px solid #1e293b", display: "flex", alignItems: "stretch", minHeight: 56, marginTop: "auto", overflow: "visible" }}>
        <div style={{ width: 140, flexShrink: 0, borderRight: "2.5px solid #1e293b", padding: "6px 8px", fontSize: 9, boxSizing: "border-box", overflowWrap: "anywhere" }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>Location</div>
          {editing ? (
            <E value={locationValue} onChange={onLocationChange} editing={editing}
              placeholder="Clinic / branch location" multiline rows={2}
              style={{ color: "#475569", lineHeight: 1.4, fontSize: 9 }} />
          ) : (
            <div style={{ color: "#475569", lineHeight: 1.4, whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 9 }}>{locationValue || rxInfo?.location || rxInfo?.hospitalAddress || ""}</div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0, padding: "6px 10px", fontSize: 9 }}>
          <div style={{ fontWeight: 700, marginBottom: 2, fontSize: 10 }}>Ashwini Medical</div>
          {isLast ? (
            <E value={form.medicalInstructions || rxInfo?.defaultFooter || ""} onChange={v => setField("medicalInstructions", v)}
              editing={editing} placeholder="Footer medical instructions…" multiline rows={2} style={{ color: "#475569", fontSize: 9 }} />
          ) : (
            <div style={{ color: "#475569", fontSize: 9 }}>{form.medicalInstructions || rxInfo?.defaultFooter || ""}</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PRESCRIPTION (multi-page A4 aware)
══════════════════════════════════════════════════════════════════════════ */
function Prescription({ pat, doc, rxInfo, form, setField, medicines, hospitalId, onMedChange, onMedRemove, onAddMed, editing, user = {}, locationValue, onLocationChange }) {
  const rowsPerPage = Math.max(4, Math.floor(BODY_AVAILABLE / (MED_ROW_HEIGHT + MED_NOTE_ROW_HEIGHT)));

  const displayMeds = editing ? medicines : medicines.filter(m => m.medicineName?.trim());
  const pages = [];
  if (displayMeds.length === 0) {
    pages.push([]);
  } else {
    for (let i = 0; i < displayMeds.length; i += rowsPerPage) {
      pages.push(displayMeds.slice(i, i + rowsPerPage));
    }
  }
  const totalPages = pages.length;

  const tableHead = (
    <thead>
      <tr style={{ borderBottom: "2px solid #1e293b", background: "#f8fafc" }}>
        {["#", "Medicine", "M", "A", "N", "Days", editing ? "" : null].filter(Boolean).map(h => (
          <th key={h} style={{ padding: "5px 3px", textAlign: "center", fontSize: 10, wordBreak: "break-word" }}>{h}</th>
        ))}
      </tr>
    </thead>
  );

  return (
    <>
      {pages.map((pageMeds, pageIdx) => {
        const isFirst = pageIdx === 0;
        const isLast  = pageIdx === totalPages - 1;
        const globalOffset = pageIdx * rowsPerPage;

        return (
          <A4Page key={pageIdx} pageNum={pageIdx + 1} totalPages={totalPages}
            pat={pat} doc={doc} rxInfo={rxInfo} form={form} setField={setField}
            editing={editing} user={user} isFirst={isFirst} isLast={isLast}
            locationValue={locationValue} onLocationChange={onLocationChange}>

            <div style={{ overflowX: "auto", maxWidth: "100%" }}>
              <table style={{ width: "100%", minWidth: 420, borderCollapse: "collapse", marginBottom: 10, tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "4%" }} />
                  <col style={{ width: editing ? "44%" : "48%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "13%" }} />
                  {editing && <col style={{ width: "8%" }} />}
                </colgroup>
                {tableHead}
                <tbody>
                  {pageMeds.map((row, i) => (
                    <MedRow key={globalOffset + i} row={row} idx={globalOffset + i}
                      hospitalId={hospitalId}
                      onChange={onMedChange} onRemove={onMedRemove} onAddMed={onAddMed}
                      editing={editing} isLast={globalOffset + i === medicines.length - 1} />
                  ))}
                  {editing && isLast && (
                    <tr>
                      <td colSpan={7} style={{ padding: "6px", textAlign: "center" }}>
                        <button onClick={onAddMed}
                          style={{ background: "#1e293b", color: "#fff", border: "none", borderRadius: 6, padding: "4px 14px", cursor: "pointer", fontSize: 11 }}>
                          + Add Medicine
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </A4Page>
        );
      })}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════ */
export default function PrescriptionPage({ session, initialPatient, onClearInitialPatient, onBackToAppointments }) {
  const auth = useAuth() || {};
  const viewportWidth = useViewportWidth();
  const user = session || auth.user || getStoredUser() || {};
  const role = (user?.role || "").toUpperCase().replace(/\s/g, "_");
  const hid  = user?.hospitalId || (role === "HOSPITAL_ADMIN" ? user?.id : undefined);
  const uid  = user?.userId || user?.id;
  const loggedDoctorId = role === "DOCTOR" ? uid : null;

  const [view,       setView]       = useState("create");
  const [editingId,  setEditingId]  = useState(null);
  const [medicines,  setMedicines]  = useState([{ ...EMPTY_MED }]);
  const [prescList,  setPrescList]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [previewData,setPreviewData]= useState(null);
  const [history,    setHistory]    = useState([]);
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Track if we came from appointment page
  const [cameFromAppointment, setCameFromAppointment] = useState(false);
  // Track appointment id for status update
  const [currentAppointmentId, setCurrentAppointmentId] = useState(null);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [updatingAppointment, setUpdatingAppointment] = useState(false);

  const [pat,    setPat]    = useState(null);
  const [doc,    setDoc]    = useState(null);
  const [rxInfo, setRxInfo] = useState(null);
  const [patId,  setPatId]  = useState(null);
  const [docId,  setDocId]  = useState(loggedDoctorId ? String(loggedDoctorId) : null);

  const [locationValue, setLocationValue] = useState("");

  const updateRxInfoField = useCallback((field, value) => {
    setRxInfo(prev => (prev ? { ...prev, [field]: value } : { [field]: value }));
  }, []);

  const handleLogoSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      updateRxInfoField("logoUrl", dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const [form, setFormState] = useState({
    complaints: "", diagnosis: "", bloodPressure: "", weight: "",
    temperature: "", pulseRate: "", oxygenLevel: "", instructions: "",
    medicalInstructions: "", patientNotes: "", reportUrl: "", reportName: "", reportFilesJson: "",
    followUpDate: "", prescriptionDate: todayISO(),
  });
  const setField = (f, v) => setFormState(s => ({ ...s, [f]: v }));

  const loadRxInfo = useCallback(async (doctorId) => {
    if (!doctorId) return null;
    try {
      const resp = await PrescriptionInfoAPI.get(doctorId);
      const info = normalizeRxInfo(resp?.data || resp || null);
      const storedUser = getStoredUser();
      const hospitalInfo = storedUser?.hospitalInfo || storedUser || {};
      const freshLogo = hospitalInfo.logo || storedUser?.logo || "";
      const enrichedInfo = {
        ...info,
        logoUrl: info?.logoUrl || freshLogo || "",
        hospitalName: info?.hospitalName || hospitalInfo.hospitalName || storedUser?.hospitalName || "",
        hospitalAddress: info?.hospitalAddress || [hospitalInfo.address, hospitalInfo.city, hospitalInfo.state, hospitalInfo.pincode].filter(Boolean).join(", ") || "",
        hospitalEmail: info?.hospitalEmail || hospitalInfo.email || storedUser?.email || "",
        hospitalPhone: info?.hospitalPhone || hospitalInfo.contactNo || storedUser?.contactNo || "",
      };
      setRxInfo(enrichedInfo);
      setLocationValue(enrichedInfo?.location || enrichedInfo?.hospitalAddress || "");
      return enrichedInfo;
    } catch { setRxInfo(null); return null; }
  }, []);

  const applyRxInfoDefaults = useCallback((current) => ({
    ...current,
    instructions: current.instructions || rxInfo?.defaultInstructions || "",
    medicalInstructions: current.medicalInstructions || rxInfo?.defaultFooter || "",
  }), [rxInfo]);

  const printRef = useRef();

  const getPrintData = useCallback(() => {
    const medicineRows = medicines.filter(m => m.medicineName?.trim());
    return {
      ...form,
      _pat: pat,
      _doc: doc,
      _rxInfo: {
        ...(rxInfo || {}),
        location: locationValue || rxInfo?.location || rxInfo?.hospitalAddress || "",
      },
      medicines: medicineRows,
    };
  }, [form, medicines, pat, doc, rxInfo, locationValue]);

  const printData = useMemo(() => previewData || getPrintData(), [previewData, getPrintData]);

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
    if (!patId) { setPat(null); setHistory([]); setPatientPrescriptions([]); return; }
    patient(patId).then(d => setPat(d?.data || d)).catch(() => setPat(null));
    setHistoryLoading(true);
    Promise.all([
      AppointmentAPI.getAppointmentsByCustomer(patId).catch(() => ({ data: [] })),
      PrescriptionAPI.byCustomer(patId).catch(() => ({ data: [] })),
    ])
      .then(([apptRes, prescriptionRes]) => {
        setHistory(apptRes.data || []);
        setPatientPrescriptions(prescriptionRes.data || []);
      })
      .catch(() => {
        setHistory([]);
        setPatientPrescriptions([]);
      })
      .finally(() => setHistoryLoading(false));
  }, [patId]);

  // Keep the "current appointment" object in sync with the history list,
  // so the inline Current Appointment card always reflects fresh data.
  useEffect(() => {
    if (!currentAppointmentId) { setCurrentAppointment(null); return; }
    const found = history.find(a => String(a.appointmentId) === String(currentAppointmentId));
    if (found) setCurrentAppointment(found);
  }, [history, currentAppointmentId]);

  useEffect(() => {
    if (loggedDoctorId && String(docId || "") !== String(loggedDoctorId)) setDocId(String(loggedDoctorId));
  }, [loggedDoctorId, docId]);

  useEffect(() => {
    const id = loggedDoctorId || docId;
    if (!id) { setDoc(null); setRxInfo(null); return; }
    doctor(id).then(d => setDoc(d?.data || d)).catch(() => setDoc(null));
    loadRxInfo(id);
  }, [docId, loggedDoctorId, loadRxInfo]);

  useEffect(() => {
    if (view !== "create" || editingId) return;
    setFormState(current => applyRxInfoDefaults(current));
  }, [rxInfo, view, editingId, applyRxInfoDefaults]);

  useEffect(() => {
    const handler = (e) => {
      const did = e?.detail?.doctorId;
      const id = loggedDoctorId || docId;
      if (!did || !id || String(did) !== String(id)) return;
      loadRxInfo(id);
    };
    window.addEventListener("rxinfo:updated", handler);
    return () => window.removeEventListener("rxinfo:updated", handler);
  }, [docId, loggedDoctorId, loadRxInfo]);

  useEffect(() => {
    if (!initialPatient) return;

    const editingPrescription = initialPatient.editingPrescription;
    if (editingPrescription) {
      const patientId = initialPatient.custId || editingPrescription.customerId || "";
      const doctorId = loggedDoctorId ? loggedDoctorId : (initialPatient.doctorId || editingPrescription.doctorId || "");
      if (patientId) setPatId(String(patientId));
      if (doctorId) setDocId(String(doctorId));
      openEdit(editingPrescription, { appointmentId: initialPatient.appointmentId || editingPrescription.appointmentId || null });
      onClearInitialPatient?.();
      return;
    }

    if (initialPatient.custId) {
      setPatId(String(initialPatient.custId));
      if (loggedDoctorId) setDocId(String(loggedDoctorId));
      else if (initialPatient.doctorId) setDocId(String(initialPatient.doctorId));
      resetForm(initialPatient.appointmentId);
      setCurrentAppointmentId(initialPatient.appointmentId || null);
      setCameFromAppointment(true);
      setView("create");
      onClearInitialPatient?.();
    }
  }, [initialPatient]);

  useEffect(() => {
    if (!initialPatient?.custId) {
      resetForm();
    }
  }, []);

  const resetForm = (appointmentId = "") => {
    setFormState(applyRxInfoDefaults({
      complaints: "", diagnosis: "", bloodPressure: "", weight: "",
      temperature: "", pulseRate: "", oxygenLevel: "", instructions: "",
      medicalInstructions: "", patientNotes: "", reportUrl: "", reportName: "", reportFilesJson: "",
      followUpDate: "", prescriptionDate: todayISO(), appointmentId,
    }));
    setMedicines([{ ...EMPTY_MED }]);
    setUploadedFiles([]);
  };

  const openCreate = () => {
    setEditingId(null);
    setPatId(null); setDocId(loggedDoctorId ? String(loggedDoctorId) : null);
    setPat(null);
    setPreviewData(null);
    resetForm();
    setView("create");
  };

  const openEdit = (p, opts = {}) => {
    setPreviewData(null);
    setEditingId(p.prescriptionId);
    setPatId(String(p.customerId || ""));
    setDocId(loggedDoctorId ? String(loggedDoctorId) : String(p.doctorId || ""));
    setFormState({
      complaints: p.complaints || "", diagnosis: p.diagnosis || "",
      bloodPressure: p.bloodPressure || "", weight: p.weight || "",
      temperature: p.temperature || "", pulseRate: p.pulseRate || "",
      oxygenLevel: p.oxygenLevel || "", instructions: p.instructions || "",
      medicalInstructions: p.medicalInstructions || "", patientNotes: p.patientNotes || "",
      reportUrl: p.reportUrl || "", reportName: p.reportName || "", reportFilesJson: p.reportFilesJson || "",
      followUpDate: p.followUpDate || "", prescriptionDate: p.prescriptionDate || todayISO(),
    });
    setUploadedFiles(parseReportFiles(p).map(file => ({ ...file, saved: true })));
    try { setMedicines(JSON.parse(p.medicinesJson || "[]") || [{ ...EMPTY_MED }]); }
    catch { setMedicines([{ ...EMPTY_MED }]); }
    // Preserve / set the appointment context so the Current Appointment
    // card and "Back to Appointments" button keep working from here too.
    const apptId = opts.appointmentId || p.appointmentId || currentAppointmentId || null;
    if (apptId) {
      setCurrentAppointmentId(apptId);
      setCameFromAppointment(true);
    }
    setView("create");
  };

  const openPreview = (p) => {
    const d = { ...p };
    try { d.medicines = JSON.parse(p.medicinesJson || "[]"); } catch { d.medicines = []; }
    setPreviewData(d);
    if (p.customerId) patient(p.customerId).then(r => setPreviewData(prev => ({ ...(prev || {}), _pat: r?.data || r }))).catch(() => {});
    if (p.doctorId) {
      doctor(p.doctorId).then(r => setPreviewData(prev => ({ ...(prev || {}), _doc: r?.data || r }))).catch(() => {});
      PrescriptionInfoAPI.get(p.doctorId).then(r => {
        const info = normalizeRxInfo(r?.data || r || {});
        setPreviewData(prev => ({
          ...(prev || {}), _rxInfo: info,
          instructions: prev?.instructions || info?.defaultInstructions || "",
          medicalInstructions: prev?.medicalInstructions || info?.defaultFooter || "",
        }));
      }).catch(() => {});
    }
    setView("preview");
  };

  /* Open a past appointment's prescription directly in EDIT mode (instead of
     read-only preview), so the doctor can keep working on it from here. */
  const loadPrescriptionForAppointment = async (appt) => {
    if (!appt?.appointmentId) { alert("Unable to open prescription: appointment id missing."); return; }
    setHistoryLoading(true);
    try {
      const resp = await PrescriptionAPI.byAppointment(appt.appointmentId);
      const prescriptions = resp.data || [];
      //if (prescriptions.length === 0) { alert("No prescription found for this appointment yet."); return; }
      openEdit(prescriptions[0], { appointmentId: appt.appointmentId });
    } catch (err) { console.error(err); alert("Unable to load prescription for this appointment."); }
    finally { setHistoryLoading(false); }
  };

  /* ── Quick inline update for the appointment currently being worked on ── */
  const updateCurrentAppointment = async (changes, appointment = null) => {
    const appointmentId = appointment?.appointmentId || currentAppointmentId;
    if (!appointmentId) return;
    setUpdatingAppointment(true);
    try {
      if (Object.keys(changes).length === 1 && changes.status) {
        await AppointmentAPI.updateStatus(appointmentId, changes.status);
      } else {
        const payload = appointment ? { ...appointment, ...changes } : { ...(currentAppointment || {}), ...changes };
        await AppointmentAPI.update(appointmentId, payload);
      }
      // Refresh history so the Current Appointment card reflects the change.
      if (patId) {
        const apptRes = await AppointmentAPI.getAppointmentsByCustomer(patId).catch(() => ({ data: [] }));
        setHistory(apptRes.data || []);
      }
    } catch (e) {
      console.error("Failed to update appointment:", e);
      alert("Failed to update appointment details.");
    } finally {
      setUpdatingAppointment(false);
    }
  };

  const promptUpdateAppointment = async (appt = null) => {
    const appointmentId = appt?.appointmentId || currentAppointmentId;
    if (!appointmentId) return;
    alert(`Auto-marking appointment as Completed on save.`);
    await updateCurrentAppointment({ status: "Completed" }, appt);
  };

  const addMed    = (med = null) => setMedicines(m => [...m, med ? { ...EMPTY_MED, ...med } : { ...EMPTY_MED }]);
  const removeMed = (i)          => setMedicines(m => m.filter((_, idx) => idx !== i));
  const updateMed = (i, f, v)    => setMedicines(m => m.map((row, idx) => idx === i ? { ...row, [f]: v } : row));

  const addReportFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    const next = files.map(file => ({
      name: file.name,
      url: URL.createObjectURL(file),
      saved: false,
      file,
    }));
    setUploadedFiles(prev => [...prev, ...next]);
    setField("reportName", files[files.length - 1].name);
  };

  const buildPayload = () => ({
    ...form,
    prescriptionId: editingId,
    templateType: "TEMPLATE_1",
    hospitalId: hid,
    doctorId: loggedDoctorId || docId || "",
    customerId: patId || "",
    appointmentId: currentAppointmentId || form.appointmentId || "",
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
    hospitalName: rxInfo?.hospitalName || rxInfo?.hospital_name || user?.hospitalInfo?.hospitalName || user?.hospitalName || "",
    hospitalAddress: rxInfo?.hospitalAddress || [user?.hospitalInfo?.address, user?.hospitalInfo?.city, user?.hospitalInfo?.state, user?.hospitalInfo?.pincode].filter(Boolean).join(", "),
    hospitalContact: rxInfo?.hospitalPhone || user?.hospitalInfo?.contactNo || user?.contactNo || "",
    hospitalEmail: rxInfo?.hospitalEmail || user?.hospitalInfo?.email || "",
    medicinesJson: JSON.stringify(medicines.filter(m => m.medicineName?.trim())),
  });

  /* Save patient prescription */
  const save = async (andPrint = false) => {
    if (!patId) { alert("No patient loaded"); return; }
   // if (medicines.filter(m => m.medicineName?.trim()).length === 0) { alert("Add at least one medicine"); return; }
    setSaving(true);
    try {
      const payload = buildPayload();
      let result;
      if (editingId) result = await PrescriptionAPI.update(editingId, payload);
      else           result = await PrescriptionAPI.create(payload);
      const prescriptionId = editingId || result?.data?.prescriptionId || result?.data?.id;
      const pendingReports = uploadedFiles.filter(f => !f.saved && f.file).map(f => f.file);
      if (pendingReports.length > 0 && prescriptionId) {
        try { await PrescriptionAPI.uploadReports(prescriptionId, pendingReports); }
        catch { alert("Saved, but report upload failed."); }
      }
      // Auto-mark appointment as Completed on save
      if (currentAppointmentId) {
        await promptUpdateAppointment();
      }
      if (andPrint) {
        handlePrint();
      } else {
        alert(editingId ? "Updated!" : "Saved!");
        setView("list");
        loadList();
      }
    } catch (e) { alert(e.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  /* Save doctor defaults */
  const saveDefaults = async () => {
    const doctorId = loggedDoctorId || docId;
    if (!doctorId) { alert("No doctor selected — open this from your account or pick a doctor first."); return; }
    setSaving(true);
    try {
      const payload = {
        doctorId,
        hospitalId: hid,
        hospitalName: rxInfo?.hospitalName || "",
        hospitalAddress: rxInfo?.hospitalAddress || "",
        hospitalPhone: rxInfo?.hospitalPhone || "",
        hospitalEmail: rxInfo?.hospitalEmail || "",
        location: locationValue,
        regNo: rxInfo?.regNo || doc?.regNo || "",
        logoUrl: rxInfo?.logoUrl || "",
        defaultInstructions: form.instructions || "",
        defaultFooter: form.medicalInstructions || "",
      };
      try {
        await PrescriptionInfoAPI.update(doctorId, payload);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 404 || status === 405 || status === 500) await PrescriptionInfoAPI.create(payload);
        else throw err;
      }
      await loadRxInfo(doctorId);
      try { window.dispatchEvent(new CustomEvent('rxinfo:updated', { detail: { doctorId } })); } catch (e) { /* ignore */ }
      alert("Defaults saved.");
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to save defaults");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this prescription?")) return;
    await PrescriptionAPI.delete(id); loadList();
  };

  const handlePrint = async (completeAppointment = false) => {
    if (completeAppointment && currentAppointmentId) {
      await promptUpdateAppointment();
    }

    if (!printRef.current) {
      alert("Nothing to print yet.");
      return;
    }

    const printHtml = `<!DOCTYPE html><html><head><title>Prescription</title>
      <style>
        *{box-sizing:border-box;} body{background:#fff;margin:0;padding:20px;}
        @page{size:A4;margin:10mm;} @media print{body{padding:0;} button{display:none!important;}}
      </style></head><body>${printRef.current.innerHTML}</body></html>`;

    const printWindow = window.open("", "_blank", "width=950,height=750");
    if (!printWindow) {
      const fallback = window.open("", "_blank");
      if (fallback) {
        fallback.document.write(printHtml);
        fallback.document.close();
        setTimeout(() => {
          fallback.focus();
          fallback.print();
          fallback.close();
        }, 250);
      } else {
        window.print();
      }
      return;
    }

    printWindow.document.write(printHtml);
    printWindow.document.close();
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      } catch {}
    }, 250);
  };

  const btn = (bg, c = "#fff", p = "8px 18px", extra = {}) => ({
    background: bg, color: c, border: "none", padding: p, borderRadius: 8,
    cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "Georgia,serif", ...extra
  });

  const patientHistoryItems = (() => {
    const usedPrescriptionIds = new Set();
    const byAppointment = new Map(
      patientPrescriptions
        .filter(p => p.appointmentId)
        .map(p => [String(p.appointmentId), p])
    );
    const appointmentItems = history.map(appt => {
      const prescription = byAppointment.get(String(appt.appointmentId || ""));
      if (prescription?.prescriptionId) usedPrescriptionIds.add(prescription.prescriptionId);
      return { appointment: appt, prescription };
    });
    const prescriptionOnlyItems = patientPrescriptions
      .filter(p => p.prescriptionId && !usedPrescriptionIds.has(p.prescriptionId))
      .map(p => ({ appointment: null, prescription: p }));
    return [...appointmentItems, ...prescriptionOnlyItems];
  })();

  /* ── common prescription props ── */
  const rxProps = (isEditing, data = {}) => ({
    pat:        isEditing ? pat  : (data._pat  || { custName: data.patientName, age: data.patientAge, gender: data.patientGender, custContact: data.patientContact, custAddress: data.patientAddress, bloodGroup: data.bloodGroup }),
    doc:        isEditing ? doc  : (data._doc  || { userName: data.doctorName, qualification: data.doctorQualification, specialization: data.doctorSpecialization, contact: data.doctorContact }),
    rxInfo:     isEditing ? rxInfo : (data._rxInfo || { hospitalName: data.hospitalName, hospitalAddress: data.hospitalAddress, hospitalPhone: data.hospitalContact, hospitalEmail: data.hospitalEmail }),
    form:       isEditing ? form : data,
    setField:   isEditing ? setField : () => {},
    medicines:  isEditing ? medicines : (data.medicines || []),
    hospitalId: hid,
    onMedChange: isEditing ? updateMed : () => {},
    onMedRemove: isEditing ? removeMed : () => {},
    onAddMed:    isEditing ? addMed    : () => {},
    editing:    isEditing,
    user,
    locationValue: isEditing ? locationValue : (data._rxInfo?.location || data.hospitalAddress || ""),
    onLocationChange: isEditing ? setLocationValue : () => {},
  });

      
  /* ════════════════════ LIST VIEW ════════════════════ */
  if (view === "list") return (
    <div style={{ padding: viewportWidth <= 640 ? "16px 12px" : "24px 28px", minHeight: "100vh", background: "#f1f5f9" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: viewportWidth <= 640 ? 22 : 28, fontFamily: "Georgia,serif", color: "#1e293b" }}>💊 Prescriptions</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: viewportWidth <= 640 ? 12 : 13 }}>Create and manage patient prescriptions</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {cameFromAppointment && onBackToAppointments && (
            <button style={btn("#6366f1", "#fff", viewportWidth <= 640 ? "6px 10px" : "8px 18px", { fontSize: viewportWidth <= 640 ? 11 : 13 })} onClick={onBackToAppointments}>← Appointments</button>
          )}
          <button style={btn("#64748b", "#fff", viewportWidth <= 640 ? "6px 10px" : "8px 18px", { fontSize: viewportWidth <= 640 ? 11 : 13 })} onClick={openCreate}>← Back</button>
          {(role === "DOCTOR" || role === "HOSPITAL_ADMIN") && (
            <button style={btn("#1d4ed8", "#fff", viewportWidth <= 640 ? "6px 10px" : "8px 18px", { fontSize: viewportWidth <= 640 ? 11 : 13 })} onClick={openCreate}>+ New</button>
          )}
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, padding: viewportWidth <= 640 ? 12 : 20, boxShadow: "0 2px 10px rgba(0,0,0,0.07)", overflowX: "auto" }}>
        {loading ? <p style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>Loading…</p> : (
          <div style={{ overflowX: viewportWidth <= 640 ? "auto" : "visible", fontSize: viewportWidth <= 640 ? 12 : 13 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: viewportWidth <= 640 ? "500px" : "auto" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["#", "Date", "Patient", "Doctor", "Diagnosis", "Meds", "Status", "Actions"].map(c => (
                    <th key={c} style={{ padding: viewportWidth <= 640 ? "8px 6px" : "12px 14px", textAlign: "left", fontSize: viewportWidth <= 640 ? 11 : 12, color: "#475569", fontWeight: 700, borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap" }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prescList.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No prescriptions yet</td></tr>
                ) : prescList.map((p, i) => {
                  let mc = 0; try { mc = JSON.parse(p.medicinesJson || "[]").length; } catch {}
                  return (
                    <tr key={p.prescriptionId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: viewportWidth <= 640 ? "8px 6px" : "11px 14px", color: "#94a3b8", fontSize: viewportWidth <= 640 ? 11 : 13 }}>{i + 1}</td>
                      <td style={{ padding: viewportWidth <= 640 ? "8px 6px" : "11px 14px", fontSize: viewportWidth <= 640 ? 11 : 13, whiteSpace: "nowrap" }}>{p.prescriptionDate || "—"}</td>
                      <td style={{ padding: viewportWidth <= 640 ? "8px 6px" : "11px 14px", fontWeight: 600, maxWidth: viewportWidth <= 640 ? 80 : 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.patientName || "—"}</td>
                      <td style={{ padding: viewportWidth <= 640 ? "8px 6px" : "11px 14px", fontSize: viewportWidth <= 640 ? 11 : 13, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.doctorName || "—"}</td>
                      <td style={{ padding: viewportWidth <= 640 ? "8px 6px" : "11px 14px", fontSize: viewportWidth <= 640 ? 11 : 13, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.diagnosis || "—"}</td>
                      <td style={{ padding: viewportWidth <= 640 ? "8px 6px" : "11px 14px" }}>
                        <span style={{ background: "#ede9fe", color: "#7c3aed", padding: "3px 8px", borderRadius: 20, fontSize: viewportWidth <= 640 ? 10 : 12, fontWeight: 600, whiteSpace: "nowrap" }}>{mc} meds</span>
                      </td>
                      <td style={{ padding: viewportWidth <= 640 ? "8px 6px" : "11px 14px" }}>
                        <span style={{ padding: "3px 8px", borderRadius: 20, fontSize: viewportWidth <= 640 ? 10 : 12, fontWeight: 600, background: p.status === "Active" ? "#dcfce7" : "#fee2e2", color: p.status === "Active" ? "#166534" : "#991b1b", whiteSpace: "nowrap" }}>
                          {p.status || "Active"}
                        </span>
                      </td>
                      <td style={{ padding: viewportWidth <= 640 ? "8px 6px" : "11px 14px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button style={btn("#1d4ed8", "#fff", viewportWidth <= 640 ? "4px 8px" : "5px 10px", { fontSize: viewportWidth <= 640 ? 10 : 11 })} onClick={() => openPreview(p)}>👁</button>
                          {(role === "DOCTOR" || role === "HOSPITAL_ADMIN") && <>
                            <button style={btn("#f59e0b", "#000", viewportWidth <= 640 ? "4px 8px" : "5px 10px", { fontSize: viewportWidth <= 640 ? 10 : 11 })} onClick={() => openEdit(p)}>✏️</button>
                            <button style={btn("#ef4444", "#fff", viewportWidth <= 640 ? "4px 8px" : "5px 10px", { fontSize: viewportWidth <= 640 ? 10 : 11 })} onClick={() => del(p.prescriptionId)}>🗑</button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  /* ════════════════════ PREVIEW VIEW ════════════════════ */
  if (view === "preview") {
    return (
      <div style={{ background: "#f1f5f9", minHeight: "100vh", padding: viewportWidth <= 640 ? "12px 16px" : "20px 28px" }}>
        <div style={{ marginBottom: 16, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", background: "#fff", padding: viewportWidth <= 640 ? "10px 12px" : "12px 18px", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
          <button style={btn("#64748b", "#fff", viewportWidth <= 640 ? "6px 10px" : "8px 18px", { fontSize: viewportWidth <= 640 ? 11 : 13 })} onClick={() => setView("list")}>← Back</button>
          {cameFromAppointment && onBackToAppointments && (
            <button style={btn("#6366f1", "#fff", viewportWidth <= 640 ? "6px 10px" : "8px 18px", { fontSize: viewportWidth <= 640 ? 11 : 13 })} onClick={onBackToAppointments}>🏥 Appointments</button>
          )}
          <button style={btn("#1d4ed8", "#fff", viewportWidth <= 640 ? "6px 10px" : "8px 18px", { fontSize: viewportWidth <= 640 ? 11 : 13 })} onClick={handlePrint}>🖨️ Print</button>
          {(role === "DOCTOR" || role === "HOSPITAL_ADMIN") && (
            <button style={btn("#059669", "#fff", viewportWidth <= 640 ? "6px 10px" : "8px 18px", { fontSize: viewportWidth <= 640 ? 11 : 13 })} onClick={() => openEdit(previewData)}>✏️ Edit</button>
          )}
          <span style={{ marginLeft: "auto", color: "#64748b", fontSize: viewportWidth <= 640 ? 11 : 13 }}>📖 Preview</span>
        </div>

        <div style={{ background: "#e2e8f0", padding: viewportWidth <= 640 ? "12px" : 28, borderRadius: 14, overflowX: "auto" }} ref={printRef}>
          <Prescription {...rxProps(false, previewData)} />
        </div>
      </div>
    );
  }

  /* ════════════════════ CREATE / EDIT VIEW ════════════════════ */
  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh", padding: viewportWidth <= 640 ? "16px 12px" : "20px 28px" }}>

      {/* Toolbar - RESPONSIVE */}
      <div style={{ 
        marginBottom: 14, 
        display: "flex", 
        gap: 10, 
        alignItems: "center", 
        flexWrap: "wrap", 
        background: "#fff", 
        padding: viewportWidth <= 640 ? "10px 12px" : "12px 18px", 
        borderRadius: 12, 
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)" 
      }}>
        {/* Back to Appointments button — shown when navigated from appointment page */}
        {cameFromAppointment && onBackToAppointments && (
          <button style={btn("#6366f1", "#fff", viewportWidth <= 640 ? "6px 12px" : "8px 18px", { fontSize: viewportWidth <= 640 ? 12 : 13 })}>
            🏥 Back to Appointments
          </button>
        )}

        <button style={btn("#64748b", "#fff", viewportWidth <= 640 ? "6px 12px" : "8px 18px", { fontSize: viewportWidth <= 640 ? 12 : 13 })} onClick={() => setView("list")}>📋 History</button>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flex: viewportWidth <= 640 ? "1 1 100%" : "none" }}>
          {pat?.custName && (
            <span style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "5px 12px", color: "#1d4ed8", fontWeight: 600, fontSize: viewportWidth <= 640 ? 12 : 13, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              👤 {pat.custName}
            </span>
          )}
          {doc?.userName && (
            <span style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "5px 12px", color: "#166534", fontWeight: 600, fontSize: viewportWidth <= 640 ? 12 : 13, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              👨‍⚕️ Dr. {doc.userName}
            </span>
          )}
          {!patId && viewportWidth > 640 && (
            <span style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, padding: "5px 12px", color: "#92400e", fontWeight: 600, fontSize: 13 }}>
              ✏️ Default template
            </span>
          )}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={btn("#475569", "#fff", viewportWidth <= 640 ? "6px 12px" : "8px 18px", { fontSize: viewportWidth <= 640 ? 12 : 13 })} onClick={() => handlePrint(false)}>🖨️</button>
          {patId && !editingId && (
            <button style={btn("#7c3aed", "#fff", viewportWidth <= 640 ? "6px 12px" : "8px 22px", { fontSize: viewportWidth <= 640 ? 12 : 13 })} onClick={() => save(true)} disabled={saving}>
              {saving ? "Saving…" : (viewportWidth <= 640 ? "Save & 🖨️" : "💾 Save & Print")}
            </button>
          )}
          {patId && editingId && (
            <button style={btn("#059669", "#fff", viewportWidth <= 640 ? "6px 12px" : "8px 22px", { fontSize: viewportWidth <= 640 ? 12 : 13 })} onClick={() => save(false)} disabled={saving}>
              {saving ? "Updating…" : "Update"}
            </button>
          )}
          {!patId && (
            <button style={btn("#059669", "#fff", viewportWidth <= 640 ? "6px 12px" : "8px 22px", { fontSize: viewportWidth <= 640 ? 12 : 13 })} onClick={saveDefaults} disabled={saving}>
              {saving ? "Saving…" : "Save Defaults"}
            </button>
          )}
        </div>
      </div>

      {/* Editing hint */}
      <div style={{ marginBottom: 14, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "8px 16px", fontSize: 12, color: "#1d4ed8", display: "flex", alignItems: "center", gap: 8 }}>
        <span>✏️</span>
        <span><b>Editing mode</b> — Click any field on the prescription to edit. Instructions, Footer, and Location are all editable directly on the page. Medicines are added in rows; new pages are created automatically when medicines exceed one page.</span>
      </div>

      {/* ── Current Appointment card (only when we have an active appointment context) ── */}
      {currentAppointmentId && (
        <div style={{ marginBottom: 14, background: "#fff", border: "1px solid #c7d2fe", borderRadius: 12, padding: "12px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span style={{ fontSize: 18 }}>📌</span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>
              Current Appointment {currentAppointment ? `— ${fmtDate(currentAppointment.appointmentDate || currentAppointment.date)}` : ""}
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              {currentAppointment ? (
                <>
                  Status: <b style={{ color: currentAppointment.status === "Completed" ? "#166534" : currentAppointment.status === "Cancelled" ? "#991b1b" : "#92400e" }}>{currentAppointment.status || "—"}</b>
                  {(currentAppointment.notes || currentAppointment.description) && <> &nbsp;|&nbsp; Notes: {currentAppointment.notes || currentAppointment.description}</>}
                </>
              ) : "Loading appointment details…"}
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              style={btn("#4f46e5", "#fff", "6px 14px", { fontSize: 12 })}
              disabled={updatingAppointment || !currentAppointment}
              onClick={() => currentAppointment && promptUpdateAppointment(currentAppointment)}
            >
              {updatingAppointment ? "Updating…" : "✏️ Update Appointment"}
            </button>
          </div>
        </div>
      )}

      {/* TWO-COLUMN LAYOUT - RESPONSIVE */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: viewportWidth <= 768 ? "1fr" : "auto minmax(320px, 380px)", 
        gap: 20, 
        alignItems: "start" 
      }}>

        {/* Left: A4 prescription */}
        <div style={{ minWidth: 0 }}>
          <div style={{ 
            background: "#d1d5db", 
            padding: viewportWidth <= 768 ? "16px 10px" : "24px 20px", 
            borderRadius: 14, 
            overflowX: "auto",
            transform: viewportWidth <= 768 ? "scale(0.8)" : "scale(1)",
            transformOrigin: "top left",
            width: viewportWidth <= 768 ? "125%" : "auto"
          }}>
            <Prescription {...rxProps(true)} />
          </div>
          <div style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", opacity: 0, pointerEvents: "none" }}>
            <div ref={printRef}>
              <Prescription {...rxProps(false, printData)} />
            </div>
          </div>
        </div>

        {/* Right: Side panel */}
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: 16,
          width: viewportWidth <= 768 ? "100%" : "auto"
        }}>

          {/* Patient Notes - RESPONSIVE */}
          <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 12px rgba(15,23,42,0.08)", overflow: "hidden" }}>
            <div style={{ padding: viewportWidth <= 768 ? "12px 14px" : "14px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: viewportWidth <= 768 ? 14 : 16 }}>📝</span>
              <div style={{ fontWeight: 700, fontSize: viewportWidth <= 768 ? 13 : 15, color: "#1e293b" }}>Patient Notes</div>
            </div>
            <div style={{ padding: viewportWidth <= 768 ? "12px 14px" : "14px 18px" }}>
              <textarea
                value={form.patientNotes || ""}
                onChange={e => setField("patientNotes", e.target.value)}
                rows={viewportWidth <= 768 ? 5 : 8}
                placeholder="Write follow-up notes, summary, clinical observations…"
                style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px", fontSize: viewportWidth <= 768 ? 12 : 13, resize: "vertical", lineHeight: 1.6, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }}
              />
            </div>
          </div>

        
          {/* Upload Report - RESPONSIVE */}
          <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 12px rgba(15,23,42,0.08)", overflow: "hidden" }}>
            <div style={{ padding: viewportWidth <= 768 ? "12px 14px" : "14px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: viewportWidth <= 768 ? 14 : 16 }}>📎</span>
              <div style={{ fontWeight: 700, fontSize: viewportWidth <= 768 ? 13 : 15, color: "#1e293b" }}>Upload Report</div>
            </div>
            <div style={{ padding: viewportWidth <= 768 ? "12px 14px" : "14px 18px" }}>
              <label style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                border: "2px dashed #cbd5e1", borderRadius: 10, padding: viewportWidth <= 768 ? "16px 10px" : "20px 12px",
                cursor: "pointer", background: "#f8fafc", transition: "border-color 0.2s", textAlign: "center"
              }}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#1d4ed8"; }}
                onDragLeave={e => { e.currentTarget.style.borderColor = "#cbd5e1"; }}
                onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#cbd5e1"; addReportFiles(e.dataTransfer.files); }}
              >
                <span style={{ fontSize: viewportWidth <= 768 ? 24 : 28, marginBottom: 6 }}>📤</span>
                <div style={{ fontSize: viewportWidth <= 768 ? 12 : 13, fontWeight: 600, color: "#475569" }}>Drag & drop or click to upload</div>
                <div style={{ fontSize: viewportWidth <= 768 ? 10 : 11, color: "#94a3b8", marginTop: 4 }}>PDF, JPG, PNG accepted</div>
                <input type="file" accept="application/pdf,image/*" multiple
                  onChange={e => { addReportFiles(e.target.files); e.target.value = ""; }}
                  style={{ display: "none" }} />
              </label>

              {uploadedFiles.length > 0 && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: viewportWidth <= 768 ? 11 : 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Attached Files</div>
                  {uploadedFiles.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: viewportWidth <= 768 ? "6px 10px" : "8px 12px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: viewportWidth <= 768 ? 16 : 18 }}>{f.name.endsWith(".pdf") ? "📄" : "🖼️"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: viewportWidth <= 768 ? 12 : 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                        <div style={{ fontSize: viewportWidth <= 768 ? 10 : 11, color: f.saved ? "#059669" : "#f59e0b" }}>{f.saved ? "✓ Saved" : "⏳ Pending"}</div>
                      </div>
                      <a href={f.url} target="_blank" rel="noreferrer"
                        style={{ fontSize: viewportWidth <= 768 ? 10 : 11, color: "#1d4ed8", textDecoration: "none", background: "#eff6ff", padding: "3px 8px", borderRadius: 6, fontWeight: 600, whiteSpace: "nowrap" }}>
                        Open
                      </a>
                      {!f.saved && (
                        <button onClick={() => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))}
                          style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, width: 24, height: 24, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {form.reportUrl && uploadedFiles.length === 0 && (
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: viewportWidth <= 768 ? "6px 10px" : "8px 12px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: viewportWidth <= 768 ? 16 : 18 }}>📄</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: viewportWidth <= 768 ? 12 : 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{form.reportName || "Uploaded report"}</div>
                    <div style={{ fontSize: viewportWidth <= 768 ? 10 : 11, color: "#059669" }}>✓ Saved</div>
                  </div>
                  <a href={form.reportUrl} target="_blank" rel="noreferrer"
                    style={{ fontSize: viewportWidth <= 768 ? 10 : 11, color: "#1d4ed8", textDecoration: "none", background: "#eff6ff", padding: "3px 8px", borderRadius: 6, fontWeight: 600, whiteSpace: "nowrap" }}>
                    Open
                  </a>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Appointment History - RESPONSIVE */}
      <div style={{ marginTop: 20, background: "#fff", borderRadius: 14, boxShadow: "0 1px 12px rgba(15,23,42,0.08)", overflow: "hidden" }}>
        <div style={{ padding: viewportWidth <= 640 ? "12px 14px" : "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: viewportWidth <= 640 ? 14 : 16 }}>🗂️</span>
          <div style={{ fontWeight: 700, fontSize: viewportWidth <= 640 ? 13 : 15, color: "#1e293b" }}>Appointment History</div>
          {pat?.custName && <span style={{ marginLeft: "auto", fontSize: viewportWidth <= 640 ? 11 : 12, color: "#64748b", whiteSpace: "nowrap" }}>for {pat.custName}</span>}
        </div>

        <div style={{ padding: viewportWidth <= 640 ? "12px 14px" : "14px 20px", overflowX: viewportWidth <= 640 ? "auto" : "visible" }}>
          {historyLoading ? (
            <div style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
              Loading appointment history…
            </div>
          ) : !patId ? (
            <div style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>👤</div>
              Select a patient to view appointment history
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📅</div>
              No previous appointments found for this patient
            </div>
          ) : (
            <div style={{ overflowX: "auto", minWidth: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: viewportWidth <= 640 ? 11 : 13, minWidth: viewportWidth <= 640 ? "600px" : "auto" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Date", "Doctor", "Department", "Status", "Notes", "Prescription"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: viewportWidth <= 640 ? "8px 6px" : "10px 14px", fontWeight: 700, fontSize: viewportWidth <= 640 ? 11 : 12, color: "#475569", borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((appt, idx) => {
                    const isCurrent = currentAppointmentId && String(appt.appointmentId) === String(currentAppointmentId);
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9", background: isCurrent ? "#eef2ff" : "transparent" }}
                        onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = "#fafafa"; }}
                        onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = "transparent"; }}>
                        <td
                          style={{ padding: viewportWidth <= 640 ? "8px 6px" : "10px 14px", whiteSpace: "nowrap", cursor: "pointer", color: "#1d4ed8", fontWeight: isCurrent ? 700 : 400, textDecoration: "underline", textDecorationStyle: "dotted", fontSize: viewportWidth <= 640 ? 11 : 13 }}
                          onClick={() => loadPrescriptionForAppointment(appt)}
                          title="Open this appointment's prescription in edit mode"
                        >
                          {appt.appointmentDate || appt.date || "—"} {isCurrent && "📌"}
                        </td>
                        <td style={{ padding: viewportWidth <= 640 ? "8px 6px" : "10px 14px", maxWidth: viewportWidth <= 640 ? 70 : 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appt.doctorName || appt.doctor || "—"}</td>
                        <td style={{ padding: viewportWidth <= 640 ? "8px 6px" : "10px 14px", color: "#64748b", maxWidth: viewportWidth <= 640 ? 60 : 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appt.department || appt.type || "—"}</td>
                        <td style={{ padding: viewportWidth <= 640 ? "8px 6px" : "10px 14px" }}>
                          <span style={{
                            padding: "2px 8px", borderRadius: 20, fontSize: viewportWidth <= 640 ? 10 : 11, fontWeight: 600, whiteSpace: "nowrap",
                            background: appt.status === "Completed" ? "#dcfce7" : appt.status === "Cancelled" ? "#fee2e2" : "#fef3c7",
                            color:      appt.status === "Completed" ? "#166534" : appt.status === "Cancelled" ? "#991b1b" : "#92400e",
                          }}>
                            {appt.status || "—"}
                          </span>
                        </td>
                        <td style={{ padding: viewportWidth <= 640 ? "8px 6px" : "10px 14px", maxWidth: viewportWidth <= 640 ? 80 : 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#64748b" }}>
                          {appt.notes || appt.description || "—"}
                        </td>
                        <td style={{ padding: viewportWidth <= 640 ? "8px 6px" : "10px 14px" }}>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            <button style={btn("#1d4ed8", "#fff", viewportWidth <= 640 ? "4px 8px" : "5px 12px", { fontSize: viewportWidth <= 640 ? 10 : 12 })}
                              onClick={() => loadPrescriptionForAppointment(appt)}>
                              {viewportWidth <= 640 ? "Rx" : "✏️ Edit Rx"}
                            </button>
                            <button style={btn(isCurrent ? "#4f46e5" : "#94a3b8", "#fff", viewportWidth <= 640 ? "4px 6px" : "5px 10px", { fontSize: viewportWidth <= 640 ? 9 : 11, whiteSpace: "nowrap" })}
                              onClick={() => {
                                setCurrentAppointmentId(appt.appointmentId);
                                setCameFromAppointment(true);
                                promptUpdateAppointment(appt);
                              }}>
                              {isCurrent ? "📌" : "Set"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}