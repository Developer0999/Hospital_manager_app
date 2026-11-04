import axios from "axios";

const getBackendBase = () => {
  const configured = process.env.REACT_APP_API_BASE;
  if (configured) return configured.endsWith("/") ? configured : `${configured}/`;
  return "/api/";
};

const API_BASE = getBackendBase();

const API = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

/* ── AUTH ─────────────────────────────────────────── */
export const loginUser     = (data)        => API.post("/auth/login", data);

/* ── HOSPITAL ─────────────────────────────────────── */
export const getAllHospitals   = ()         => API.get("/hospital");
export const getHospitalById   = (id)       => API.get(`/hospital/${id}`);
export const saveHospital      = (data)     => API.post("/hospital", data);
export const updateHospital    = (id, data) => API.put(`/hospital/${id}`, data);
export const deleteHospital    = (id)       => API.delete(`/hospital/${id}`);

/* ── USERS (doctor / receptionist) ───────────────── */
export const getUsersByHospital      = (hid)         => API.get(`/users/hospital/${hid}`);
export const getUsersByRole          = (hid, role)   => API.get(`/users/hospital/${hid}/role/${role}`);
export const saveUser                = (data)         => API.post("/users", data);
export const updateUser              = (id, data)     => API.put(`/users/${id}`, data);
export const deleteUser              = (id)           => API.delete(`/users/${id}`);

/* ── CUSTOMERS (patients) ─────────────────────────── */
export const getCustomersByHospital = (hid)          => API.get(`/customers/hospital/${hid}`);
export const saveCustomer           = (data)          => API.post("/customers", data);
export const updateCustomer         = (id, data)      => API.put(`/customers/${id}`, data);
export const deleteCustomer         = (id)            => API.delete(`/customers/${id}`);

/* ── APPOINTMENTS ─────────────────────────────────── */
export const getAppointmentsByHospital = (hid)       => API.get(`/appointments/hospital/${hid}`);
export const getAppointmentsByDoctor   = (did)       => API.get(`/appointments/doctor/${did}`);
export const getAppointmentsByCustomer = (cid)       => API.get(`/appointments/customer/${cid}`);
export const saveAppointment           = (data)       => API.post("/appointments", data);
export const updateAppointment         = (id, data)   => API.put(`/appointments/${id}`, data);
export const deleteAppointment         = (id)         => API.delete(`/appointments/${id}`);
