import axios from "axios";

const api = axios.create({
  baseURL: "https://fieldsync-backend.onrender.com/api",
});

// =========================
// 🔐 AUTH TOKEN
// =========================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// =========================
// 🔐 AUTH
// =========================
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
};

// =========================
// ⏱ SHIFTS
// =========================
export const shiftAPI = {
  getActive: () => api.get("/shifts/active"),
  getAllActive: () => api.get("/shifts/active-all"),
  clockIn: (data) => api.post("/shifts/clock-in", data),
  clockOut: () => api.post("/shifts/clock-out"),
  getHistory: () => api.get("/shifts/history"),
};

// =========================
// 👥 USERS
// =========================
export const userAPI = {
  getAll: () => api.get("/users"),
};

// =========================
// 📅 SCHEDULES
// =========================
export const scheduleAPI = {
  getAll: () => api.get("/schedules"),
  getMine: () => api.get("/schedules/my-schedule"),
  create: (data) => api.post("/schedules", data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`),
  getLate: () => api.get("/schedules/late-arrivals"),
};

// =========================
// 📈 PERFORMANCE
// =========================
export const performanceAPI = {
  getAll: () => api.get("/performance"),
};

// =========================
// 🌴 HOLIDAYS
// =========================
export const holidayAPI = {
  getAll: () => api.get("/schedules/holiday-requests"),
  create: (data) => api.post("/schedules/holiday-requests", data),
  update: (id, data) =>
    api.put(`/schedules/holiday-requests/${id}`, data),
  delete: (id) =>
    api.delete(`/schedules/holiday-requests/${id}`),
};

// =========================
// 📍 LOCATIONS
// =========================
export const locationAPI = {
  getLocations: () => api.get("/locations"),
  create: (data) => api.post("/locations", data),
  update: (id, data) => api.put(`/locations/${id}`, data),
  delete: (id) => api.delete(`/locations/${id}`),
};

// =========================
// 📋 TASKS
// =========================
export const taskAPI = {
  getTasks: () => api.get("/tasks/all"),
  create: (data) => api.post("/tasks", data),
  complete: (task_id) =>
    api.post("/tasks/complete", { task_id }),
};

// =========================
// 📊 REPORTS
// =========================
export const reportAPI = {
  getTimesheets: () => api.get("/reports/timesheets"),
};

// =========================
// 📈 ANALYTICS
// =========================
export const analyticsAPI = {
  getShifts: () => api.get("/shifts/analytics"),
};

// =========================
// 🧠 DASHBOARD
// =========================
export const managerAPI = {
  getDashboard: () => api.get("/dashboard"),
  getActiveShifts: () => api.get("/shifts/active-all"),
};

// =========================
// 📤 UPLOADS
// =========================
export const uploadAPI = {
  upload: (formData) =>
    api.post("/uploads", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export default api;