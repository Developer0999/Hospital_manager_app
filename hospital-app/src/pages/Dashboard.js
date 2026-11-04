import React, { useEffect, useState } from "react";
import { useNavigate }    from "react-router-dom";
import { Header, Sidebar, Footer } from "../components/Layout";

import DashboardHome  from "./sections/DashboardHome";
import AppointmentPage from "./sections/AppointmentPage";
import PatientPage    from "./sections/PatientPage";
import UsersPage      from "./sections/UsersPage";
import DoctorsPage    from "./sections/DoctorsPage";
import BillingPage    from "./sections/BillingPage";
import ReportsPage    from "./sections/ReportsPage";
import SchedulePage   from "./sections/SchedulePage";
import PatientSearch  from "./sections/PatientSearch";
import SettingsPage   from "./sections/SettingsPage";
import MedicinePage   from "./sections/MedicinePage";
import PrescriptionPage from "./sections/PrescriptionPage";
import PrescriptionPageContain from "./sections/PrescriptionPageContain";
export default function Dashboard() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [page, setPage]       = useState("dashboard");
  const [initialPrescriptionPatient, setInitialPrescriptionPatient] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateSize = () => setIsMobile(window.innerWidth <= 900);
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
    else setSidebarOpen(true);
  }, [isMobile]);

  useEffect(() => {
    const raw = localStorage.getItem("hospital");
    if (!raw) { navigate("/"); return; }
    const data = JSON.parse(raw);
    // normalise role
    const r = (data.role || "").toUpperCase().replace(/\s/g, "_");
    if (r === "DOCTOR")        data.role = "DOCTOR";
    else if (r === "RECEPTIONIST") data.role = "RECEPTIONIST";
    else                       data.role = "HOSPITAL_ADMIN";
    setSession(data);
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("hospital");
    localStorage.removeItem("session");
    navigate("/");
  };

  if (!session) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#64748b" }}>Loading…</p>
    </div>
  );

  const renderPage = () => {
    switch (page) {
      case "appointments": return <AppointmentPage session={session} onOpenPatients={() => setPage("patients")} onOpenPrescription={(patient) => { setInitialPrescriptionPatient(patient); setPage("prescription"); }} />;
      case "patients":     return <PatientPage     session={session} />;
      case "users":        return <UsersPage        session={session} />;
      case "doctors":      return <DoctorsPage      session={session} />;
      case "billing":      return <BillingPage      session={session} />;
      case "reports":      return <ReportsPage      session={session} />;
      case "schedule":     return <SchedulePage     session={session} />;
      case "search":       return <PatientSearch    session={session} />;
      case "settings":     return <SettingsPage     session={session} />;
      case "medicine":     return <MedicinePage     session={session} />;
      case "prescription": return <PrescriptionPage session={session} initialPatient={initialPrescriptionPatient} onClearInitialPatient={() => setInitialPrescriptionPatient(null)} onOpenPatients={() => setPage("patients")} />;
      case "prescriptionContain": return <PrescriptionPageContain session={session} />;
      default:             return <DashboardHome    session={session} />;
    }
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", background: "#f1f5f9", minHeight: "100vh" }}>
      <Header session={session} sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((open) => !open)} />
      <div style={{ display: "flex", paddingTop: "65px", paddingBottom: "54px", position: "relative" }}>
        {isMobile && sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)}
               style={{ position: "fixed", top: "65px", left: 0, right: 0, bottom: "54px", background: "rgba(0,0,0,0.35)", zIndex: 1050 }} />
        )}
        <Sidebar
          session={session}
          activePage={page}
          onNavigate={(key) => { setPage(key); if (isMobile) setSidebarOpen(false); }}
          onLogout={() => { logout(); if (isMobile) setSidebarOpen(false); }}
          sidebarOpen={sidebarOpen}
          isMobile={isMobile}
        />
        <div style={{
          marginLeft: isMobile ? 0 : (sidebarOpen ? "245px" : 0),
          padding: isMobile ? "16px" : "28px",
          width: "100%",
          minHeight: "calc(100vh - 119px)",
          transition: "margin-left 0.2s ease, padding 0.2s ease",
          boxSizing: "border-box",
        }}>
          {renderPage()}
        </div>
      </div>
      <Footer />
    </div>
  );
}
