import axios from "axios";

/* ==================================
   🌍 BASE URL
================================== */

const BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://fieldsync-backend-clean-t7vn.onrender.com/api";

/* ==================================
   🚀 AXIOS INSTANCE
================================== */

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ==================================
   🔐 REQUEST INTERCEPTOR
================================== */

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (
      token &&
      token !== "undefined" &&
      token !== "null"
    ) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ==================================
   🚨 RESPONSE INTERCEPTOR
================================== */

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status =
      error?.response?.status;

    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error.message ||
      "Request failed";

    console.error(
      "API ERROR:",
      message
    );

    /* AUTO LOGOUT */
    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (
        window.location.pathname !==
        "/login"
      ) {
        window.location.href =
          "/login";
      }
    }

    return Promise.reject({
      ...error,
      message,
    });
  }
);

/* ==================================
   📦 RESPONSE UNWRAP
================================== */

const unwrap = async (promise) => {
  const res = await promise;
  return res?.data;
};

/* ==================================
   🔐 AUTH
================================== */

export const authAPI = {
  login: (data) =>
    unwrap(
      api.post("/auth/login", data)
    ),

  register: (data) =>
    unwrap(
      api.post(
        "/auth/register",
        data
      )
    ),

  me: () =>
    unwrap(api.get("/auth/me")),

  updateMe: (data) =>
    unwrap(
      api.put("/auth/me", data)
    ),
};

/* ==================================
   👥 USERS
================================== */

export const userAPI = {
  getAll: () =>
    unwrap(api.get("/users")),

  create: (data) =>
    unwrap(
      api.post(
        "/auth/register",
        data
      )
    ),

  updateRole: (id, data) =>
    unwrap(
      api.put(
        `/users/${id}/role`,
        data
      )
    ),

  delete: (id) =>
    unwrap(
      api.delete(`/users/${id}`)
    ),
};

/* ==================================
   📧 INVITES
================================== */

export const inviteAPI = {
  send: (data) =>
    unwrap(
      api.post("/invite", data)
    ),
};

/* ==================================
   ⏱ SHIFTS
================================== */

export const shiftAPI = {
  getActive: () =>
    unwrap(
      api.get("/shifts/active")
    ),

  getAllActive: () =>
    unwrap(
      api.get(
        "/shifts/active-all"
      )
    ),

  clockIn: (data) =>
    unwrap(
      api.post(
        "/shifts/clock-in",
        data
      )
    ),

  clockOut: () =>
    unwrap(
      api.post(
        "/shifts/clock-out"
      )
    ),

  getHistory: () =>
    unwrap(
      api.get(
        "/shifts/history"
      )
    ),

  updateLocation: (data) =>
    unwrap(
      api.post(
        "/shifts/update-location",
        data
      )
    ),
};

/* ==================================
   📅 SCHEDULE
================================== */

export const scheduleAPI = {
  getAll: () =>
    unwrap(
      api.get("/schedules")
    ),

  getMine: () =>
    unwrap(
      api.get(
        "/schedules/my-schedule"
      )
    ),

  create: (data) =>
    unwrap(
      api.post(
        "/schedules",
        data
      )
    ),

  update: (id, data) =>
    unwrap(
      api.put(
        `/schedules/${id}`,
        data
      )
    ),

  delete: (id) =>
    unwrap(
      api.delete(
        `/schedules/${id}`
      )
    ),

  getLate: () =>
    unwrap(
      api.get(
        "/schedules/late-arrivals"
      )
    ),
};

/* ==================================
   🌴 HOLIDAYS
================================== */

export const holidayAPI = {
  getAll: () =>
    unwrap(
      api.get(
        "/schedules/holiday-requests"
      )
    ),

  create: (data) =>
    unwrap(
      api.post(
        "/schedules/holiday-requests",
        data
      )
    ),

  update: (id, data) =>
    unwrap(
      api.put(
        `/schedules/holiday-requests/${id}`,
        data
      )
    ),

  delete: (id) =>
    unwrap(
      api.delete(
        `/schedules/holiday-requests/${id}`
      )
    ),
};

/* ==================================
   📈 PERFORMANCE
================================== */

export const performanceAPI = {
  getAll: () =>
    unwrap(
      api.get("/performance")
    ),
};

/* ==================================
   📍 LOCATIONS
================================== */

export const locationAPI = {
  getLocations: () =>
    unwrap(
      api.get("/locations")
    ),

  create: (data) =>
    unwrap(
      api.post(
        "/locations",
        data
      )
    ),

  update: (id, data) =>
    unwrap(
      api.put(
        `/locations/${id}`,
        data
      )
    ),

  delete: (id) =>
    unwrap(
      api.delete(
        `/locations/${id}`
      )
    ),
};

/* ==================================
   📋 TASKS
================================== */

export const taskAPI = {
  getTasks: () =>
    unwrap(
      api.get("/tasks/all")
    ),

  create: (data) =>
    unwrap(
      api.post("/tasks", data)
    ),

  complete: (task_id) =>
    unwrap(
      api.post(
        "/tasks/complete",
        { task_id }
      )
    ),

  delete: (id) =>
    unwrap(
      api.delete(`/tasks/${id}`)
    ),
};

/* ==================================
   📊 REPORTS (FIXED)
================================== */

export const reportAPI = {
  getSummary: () =>
    unwrap(api.get("/reports")),

  getTimesheets: () =>
    unwrap(
      api.get(
        "/reports/timesheets"
      )
    ),
};

/* ==================================
   🧠 DASHBOARD
================================== */

export const managerAPI = {
  getDashboard: () =>
    unwrap(
      api.get("/dashboard")
    ),
};

/* ==================================
   📢 ANNOUNCEMENTS
================================== */

export const announcementAPI = {
  getAll: () =>
    unwrap(
      api.get(
        "/announcements"
      )
    ),

  create: (data) =>
    unwrap(
      api.post(
        "/announcements",
        data
      )
    ),

  delete: (id) =>
    unwrap(
      api.delete(
        `/announcements/${id}`
      )
    ),
};

/* ==================================
   💳 BILLING
================================== */

export const billingAPI = {
  checkout: (plan) =>
    unwrap(
      api.post(
        "/billing/create-checkout-session",
        { plan }
      )
    ),

  portal: () =>
    unwrap(
      api.post("/billing/portal")
    ),
};

/* ==================================
   📤 UPLOADS
================================== */

export const uploadAPI = {
  upload: (formData) =>
    unwrap(
      api.post(
        "/uploads",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      )
    ),
};

export default api;