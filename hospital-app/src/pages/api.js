import axios from "axios";

const getBackendBase = () => {
  const configured = process.env.REACT_APP_API_BASE;
  if (configured) return configured.endsWith("/") ? configured : `${configured}/`;
  return "/api/";
};

const BASE = getBackendBase();

const api = axios.create({
  baseURL: BASE,
});

/* =========================================================
   SESSION METHODS
========================================================= */

export const getSession = () => {
  const session = localStorage.getItem("session");
  return session ? JSON.parse(session) : null;
};

export const setSession = (data) => {
  localStorage.setItem("session", JSON.stringify(data));
};

export const clearSession = () => {
  localStorage.removeItem("session");
};

/* =========================================================
   HOSPITAL API
========================================================= */

export const HospitalAPI = {

  register: (data) =>
    api.post("/hospital", data),

  login: (data) =>
    api.post("/auth/login", data),

  getAll: () =>
    api.get("/hospital"),

  getById: (id) =>
    api.get(`/hospital/${id}`),

  update: (id, data) =>
    api.put(`/hospital/${id}`, data),

  delete: (id) =>
    api.delete(`/hospital/${id}`),
};

/* =========================================================
   USER API
========================================================= */

export const UserAPI = {

  login: (data) =>
    api.post("/auth/login", data),

  create: (data, hospitalId) =>
    api.post(`/users?hospitalId=${hospitalId}`, data),

  byHospital: (hospitalId) =>
    api.get(`/users/hospital/${hospitalId}`),

  doctors: (hospitalId) =>
    api.get(`/users/hospital/${hospitalId}/role/DOCTOR`),

  getById: (id) =>
    api.get(`/users/${id}`),

  update: (id, data) =>
    api.put(`/users/${id}`, data),

  delete: (id) =>
    api.delete(`/users/${id}`),
};

/* =========================================================
   CUSTOMER API
========================================================= */

export const CustomerAPI = {

  create: (data, hospitalId) =>
    api.post(`/customers?hospitalId=${hospitalId}`, data),

  byHospital: (hospitalId) =>
    api.get(`/customers/hospital/${hospitalId}`),

  search: (hospitalId, name) =>
    api.get(
      `/customers/hospital/${hospitalId}/search?name=${encodeURIComponent(name)}`
    ),

  getById: (id) =>
    api.get(`/customers/${id}`),

  update: (id, data) =>
    api.put(`/customers/${id}`, data),

  delete: (id) =>
    api.delete(`/customers/${id}`),
};

export const patient = (id) =>
  api.get(`/customers/${id}`);

export const doctor = (id) =>
  api.get(`/users/${id}`);

export const rxInfo = (drId) =>
  api.get(`/prescription/info/${drId}`);

export const PrescriptionInfoAPI = {
  get: (doctorId) => api.get(`/prescription/info/${doctorId}`),
  create: (data) => api.post(`/prescription/info`, data),
  update: (doctorId, data) => api.put(`/prescription/info/${doctorId}`, data),
};

export const medSearch = async (hospitalId, q) => {
  const res = await api.get(`/medicine/hospital/${hospitalId}/search`, { params: { name: q } });
  return res.data;
};

/* =========================================================
   APPOINTMENT API
========================================================= */

export const AppointmentAPI = {

  create: (data, hospitalId, customerId, doctorId) =>
    api.post(
      `/appointments?hospitalId=${hospitalId}&custId=${customerId}&doctorId=${doctorId}`,
      data
    ),

  byHospital: (hospitalId) =>
    api.get(`/appointments/hospital/${hospitalId}`),

  todayHospital: (hospitalId) =>
    api.get(`/appointments/hospital/${hospitalId}/today`),

  byDoctor: (doctorId) =>
    api.get(`/appointments/doctor/${doctorId}`),

  todayDoctor: (doctorId) =>
    api.get(`/appointments/doctor/${doctorId}/today`),

  byCustomer: (customerId) =>
    api.get(`/appointments/customer/${customerId}`),

  getAppointmentsByCustomer: (customerId) =>
    api.get(`/appointments/customer/${customerId}`),

  update: (id, data) =>
    api.put(`/appointments/${id}`, data),

  updateStatus: (id, status) =>
    api.patch(`/appointments/${id}/status?status=${status}`),

  delete: (id) =>
    api.delete(`/appointments/${id}`),
};

/* =========================================================
   MEDICINE API
========================================================= */

export const MedicineAPI = {

  create: (data) =>
    api.post("/medicine", data),

  byHospital: (hospitalId) =>
    api.get(`/medicine/hospital/${hospitalId}`),

  search: (hospitalId, name) =>
    api.get(
      `/medicine/hospital/${hospitalId}/search?name=${encodeURIComponent(name)}`
    ),

  byCategory: (hospitalId, category) =>
    api.get(`/medicine/hospital/${hospitalId}/category/${category}`),

  getById: (id) =>
    api.get(`/medicine/${id}`),

  update: (id, data) =>
    api.put(`/medicine/${id}`, data),

  delete: (id) =>
    api.delete(`/medicine/${id}`),
};

/* =========================================================
   PRESCRIPTION API
========================================================= */

export const PrescriptionAPI = {

  create: (data) =>
    api.post("/prescription", data),

  update: (id, data) =>
    api.put(`/prescription/${id}`, data),

  byHospital: (hospitalId) =>
    api.get(`/prescription/hospital/${hospitalId}`),

  byDoctor: (doctorId) =>
    api.get(`/prescription/doctor/${doctorId}`),

  byCustomer: (customerId) =>
    api.get(`/prescription/customer/${customerId}`),

  byHospitalCustomer: (hospitalId, customerId) =>
    api.get(`/prescription/hospital/${hospitalId}/customer/${customerId}`),

  byAppointment: (appointmentId) =>
    api.get(`/prescription/appointment/${appointmentId}`),

  uploadReport: (id, file) => {
    const form = new FormData();
    form.append("file", file);
    return api.post(`/prescription/${id}/report`, form);
  },

  uploadReports: (id, files) => {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    return api.post(`/prescription/${id}/report`, form);
  },

  downloadReport: (url) =>
    api.get(url.replace(/^\/api(?=\/)/, ""), { responseType: "blob" }),

  getById: (id) =>
    api.get(`/prescription/${id}`),

  delete: (id) =>
    api.delete(`/prescription/${id}`),

  count: (hospitalId) =>
    api.get(`/prescription/hospital/${hospitalId}/count`),
};

/* =========================================================
   BILL API
========================================================= */

export const BillAPI = {

  create: (data, hospitalId, customerId, doctorId, appointmentId) => {

    let url = `/bill?hospitalId=${hospitalId}&custId=${customerId}`;

    if (doctorId) {
      url += `&doctorId=${doctorId}`;
    }

    if (appointmentId) {
      url += `&apptId=${appointmentId}`;
    }

    return api.post(url, data);
  },

  byHospital: (hospitalId) =>
    api.get(`/bill/hospital/${hospitalId}`),

  byCustomer: (customerId) =>
    api.get(`/bill/customer/${customerId}`),

  revenue: (hospitalId) =>
    api.get(`/bill/hospital/${hospitalId}/revenue`),

  update: (id, data) =>
    api.put(`/bill/${id}`, data),

  delete: (id) =>
    api.delete(`/bill/${id}`),
};

export default api;
