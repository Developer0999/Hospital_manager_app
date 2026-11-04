import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../AuthContext";
import { MedicineAPI } from "../api";

const CATEGORIES = ["Antibiotic","Analgesic","Antiviral","Antifungal","Vitamin","Supplement",
  "Antacid","Antihistamine","Antidiabetic","Antihypertensive","Cardiac","Steroid",
  "Syrup","Drops","Cream/Ointment","Injection","Other"];
const TYPES = ["Tablet","Capsule","Syrup","Injection","Drop","Cream","Ointment","Powder","Gel","Inhaler","Patch","Other"];

const EMPTY = { medicineName:"", genericName:"", category:"Tablet", type:"Tablet",
  manufacturer:"", composition:"", price:"", unit:"mg", active:true };

const S = {
  page:    { padding:"0" },
  card:    { background:"#fff", borderRadius:"16px", padding:"24px", boxShadow:"0 2px 10px rgba(0,0,0,0.07)", marginBottom:"20px" },
  th:      { padding:"11px 14px", textAlign:"left", fontSize:"12px", color:"#475569", fontWeight:"700", borderBottom:"2px solid #e2e8f0", background:"#f8fafc" },
  td:      { padding:"11px 14px", fontSize:"14px", color:"#1e293b", borderBottom:"1px solid #f1f5f9" },
  input:   { width:"100%", padding:"9px 12px", borderRadius:"8px", border:"1px solid #cbd5e1", fontSize:"14px", boxSizing:"border-box", outline:"none" },
  label:   { display:"block", fontWeight:"600", fontSize:"12px", color:"#475569", marginBottom:"5px" },
  btn:     (bg,c="#fff")=>({ background:bg, color:c, border:"none", padding:"9px 18px", borderRadius:"8px", cursor:"pointer", fontWeight:"600", fontSize:"13px" }),
  badge:   (color)=>({ background:color+"22", color:color, padding:"3px 10px", borderRadius:"20px", fontSize:"11px", fontWeight:"600" }),
  overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" },
  modal:   { background:"#fff", borderRadius:"16px", padding:"28px", width:"100%", maxWidth:"680px", maxHeight:"90vh", overflowY:"auto" },
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
export default function MedicinePage() {
  const auth              = useAuth() || {};
  const user              = auth.user;
  const hid               = user?.hospitalId || getStoredUser()?.hospitalId;
  const [list, setList]   = useState([]);
  const [search, setSearch]   = useState("");
  const [catFilter, setCat]   = useState("All");
  const [showModal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await MedicineAPI.byHospital(hid); setList(r.data || []); }
    catch(e){ console.error(e); } finally { setLoading(false); }
  }, [hid]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm({...EMPTY, hospitalId: hid}); setModal(true); };
  const openEdit = (m) => {
    setEditing(m);
    setForm({ medicineName:m.medicineName||"", genericName:m.genericName||"", category:m.category||"",
      type:m.type||"", manufacturer:m.manufacturer||"", composition:m.composition||"",
      price:m.price||"", unit:m.unit||"mg", active:m.active!==false, hospitalId:hid });
    setModal(true);
  };

  const save = async () => {
    if (!form.medicineName.trim()) { alert("Medicine name is required"); return; }
    setSaving(true);
   // alert("Note:hospitalId."+hid);
    try {
      if (editing) await MedicineAPI.update(editing.medicineId, form);
      else         await MedicineAPI.create({ ...form, hospitalId: hid });
      setModal(false); load();
    } catch(e){ alert(e.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm("Deactivate this medicine?")) return;
    await MedicineAPI.delete(id); load();
  };

  const h = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const categories = ["All", ...new Set(list.map(m => m.category).filter(Boolean))];
  const filtered   = list.filter(m =>
    (catFilter === "All" || m.category === catFilter) &&
    (m.medicineName||"").toLowerCase().includes(search.toLowerCase())
  );

  const catCount = {};
  list.forEach(m => { catCount[m.category] = (catCount[m.category]||0)+1; });

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ marginBottom:"24px", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <h1 style={{ margin:0, fontSize:"28px", color:"#1e293b" }}>💊 Medicine Master</h1>
          <p style={{ color:"#64748b", marginTop:"6px", margin:0 }}>Manage hospital medicine database</p>
        </div>
        <button style={S.btn("#2563eb")} onClick={openAdd}>+ Add Medicine</button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:"14px", marginBottom:"20px" }}>
        {[
          { label:"Total",    value:list.length,                      color:"#2563eb" },
          { label:"Tablets",  value:list.filter(m=>m.type==="Tablet").length,  color:"#059669" },
          { label:"Syrups",   value:list.filter(m=>m.type==="Syrup").length,   color:"#d97706" },
          { label:"Injections",value:list.filter(m=>m.type==="Injection").length, color:"#dc2626" },
        ].map((s,i) => (
          <div key={i} style={{ ...S.card, textAlign:"center", marginBottom:0, borderTop:`4px solid ${s.color}` }}>
            <div style={{ fontSize:"24px", fontWeight:"700", color:"#1e293b" }}>{s.value}</div>
            <div style={{ fontSize:"12px", color:"#64748b", marginTop:"4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ ...S.card, padding:"16px 20px", display:"flex", gap:"12px", flexWrap:"wrap", alignItems:"center", marginBottom:"16px" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="🔍  Search medicine name..."
          style={{ ...S.input, width:"280px", flex:"0 0 auto" }} />
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", flex:1 }}>
          {categories.map(c => (
            <button key={c} onClick={()=>setCat(c)}
              style={{ padding:"6px 14px", borderRadius:"20px", border:"none", cursor:"pointer", fontSize:"12px", fontWeight:"600",
                background: catFilter===c ? "#2563eb" : "#f1f5f9",
                color:      catFilter===c ? "#fff"    : "#475569" }}>
              {c} {c!=="All" && catCount[c] ? `(${catCount[c]})` : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={S.card}>
        <div style={{ marginBottom:"14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontWeight:"600", color:"#1e293b" }}>
            {filtered.length} medicine{filtered.length!==1?"s":""} found
          </span>
        </div>
        {loading ? (
          <p style={{ textAlign:"center", color:"#94a3b8", padding:"40px" }}>Loading...</p>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  {["#","Medicine Name","Generic","Category","Type","Manufacturer","Composition","Price","Unit","Status","Actions"].map(c=>(
                    <th key={c} style={S.th}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={11} style={{ ...S.td, textAlign:"center", color:"#94a3b8", padding:"40px" }}>No medicines found. Add your first medicine.</td></tr>
                ) : filtered.map((m, i) => (
                  <tr key={m.medicineId} style={{ background: i%2===0?"#fff":"#fafafa" }}>
                    <td style={S.td}>{i+1}</td>
                    <td style={{ ...S.td, fontWeight:"600" }}>{m.medicineName}</td>
                    <td style={S.td}>{m.genericName||"—"}</td>
                    <td style={S.td}>
                      <span style={S.badge("#2563eb")}>{m.category||"—"}</span>
                    </td>
                    <td style={S.td}>
                      <span style={S.badge("#7c3aed")}>{m.type||"—"}</span>
                    </td>
                    <td style={S.td}>{m.manufacturer||"—"}</td>
                    <td style={{ ...S.td, maxWidth:"160px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.composition||"—"}</td>
                    <td style={S.td}>{m.price ? `₹${m.price}` : "—"}</td>
                    <td style={S.td}>{m.unit||"—"}</td>
                    <td style={S.td}>
                      <span style={S.badge(m.active!==false?"#059669":"#dc2626")}>
                        {m.active!==false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={S.td}>
                      <div style={{ display:"flex", gap:"6px" }}>
                        <button style={{ ...S.btn("#f59e0b","#000"), padding:"5px 10px", fontSize:"12px" }} onClick={()=>openEdit(m)}>Edit</button>
                        <button style={{ ...S.btn("#ef4444"),       padding:"5px 10px", fontSize:"12px" }} onClick={()=>del(m.medicineId)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
              <h2 style={{ margin:0, fontSize:"20px", color:"#1e293b" }}>
                {editing ? "✏️ Edit Medicine" : "➕ Add Medicine"}
              </h2>
              <button onClick={()=>setModal(false)} style={{ background:"none", border:"none", fontSize:"22px", cursor:"pointer", color:"#64748b" }}>✕</button>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
              <div style={{ gridColumn:"1/-1" }}>
                <label style={S.label}>Medicine Name *</label>
                <input name="medicineName" value={form.medicineName} onChange={h} style={S.input} placeholder="e.g. Paracetamol 500mg" />
              </div>
              <div>
                <label style={S.label}>Generic Name</label>
                <input name="genericName" value={form.genericName} onChange={h} style={S.input} placeholder="e.g. Paracetamol" />
              </div>
              <div>
                <label style={S.label}>Composition</label>
                <input name="composition" value={form.composition} onChange={h} style={S.input} placeholder="e.g. Paracetamol 500mg" />
              </div>
              <div>
                <label style={S.label}>Category</label>
                <select name="category" value={form.category} onChange={h} style={S.input}>
                  {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Type / Form</label>
                <select name="type" value={form.type} onChange={h} style={S.input}>
                  {TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Manufacturer</label>
                <input name="manufacturer" value={form.manufacturer} onChange={h} style={S.input} placeholder="Company name" />
              </div>
              <div>
                <label style={S.label}>Unit</label>
                <select name="unit" value={form.unit} onChange={h} style={S.input}>
                  {["mg","ml","mcg","g","IU","%","Other"].map(u=><option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Price (₹)</label>
                <input name="price" type="number" value={form.price} onChange={h} style={S.input} placeholder="0.00" />
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"10px", paddingTop:"20px" }}>
                <input type="checkbox" name="active" checked={form.active} onChange={h} id="activeChk" />
                <label htmlFor="activeChk" style={{ fontWeight:"600", fontSize:"14px", cursor:"pointer" }}>Active</label>
              </div>
            </div>

            <div style={{ display:"flex", gap:"12px", marginTop:"20px" }}>
              <button style={{ ...S.btn("#2563eb"), flex:1, padding:"11px" }} onClick={save} disabled={saving}>
                {saving ? "Saving..." : editing ? "Update Medicine" : "Add Medicine"}
              </button>
              <button style={S.btn("#64748b")} onClick={()=>setModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
