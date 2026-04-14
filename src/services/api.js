// src/services/api.js
// FULL FIXED COPY/PASTE VERSION
// Multi-company safe + legacy methods restored + clock fixes + dashboard stats fixed

import axios from "axios";
import supabase from "../lib/supabase";

/* ==================================================
AXIOS
================================================== */

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "",
  withCredentials: false,
});

api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});

/* ==================================================
HELPERS
================================================== */

async function getCurrentAuthUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No user");

  return user;
}

async function getCurrentUser() {
  const authUser = await getCurrentAuthUser();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (error) throw error;

  return data;
}

async function getCompanyId() {
  const user = await getCurrentUser();

  if (!user.company_id) {
    throw new Error("No company assigned");
  }

  return user.company_id;
}

/* ==================================================
AUTH
================================================== */

export const authAPI = {
  login: async ({ email, password }) => {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) throw error;

    const profile = await getCurrentUser();

    return {
      token: data.session.access_token,
      user: profile,
    };
  },

  logout: async () => {
    await supabase.auth.signOut();
    return true;
  },

  me: async () => {
    try {
      return await getCurrentUser();
    } catch {
      return null;
    }
  },
};

/* ==================================================
USERS
================================================== */

export const userAPI = {
  getAll: async () => {
    const companyId = await getCompanyId();

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("company_id", companyId)
      .order("name");

    if (error) throw error;

    return data || [];
  },

  getById: async (id) => {
    const companyId = await getCompanyId();

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .eq("company_id", companyId)
      .single();

    if (error) throw error;

    return data;
  },

  update: async (id, payload) => {
    const companyId = await getCompanyId();

    const { error } = await supabase
      .from("users")
      .update(payload)
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) throw error;

    return true;
  },

  delete: async (id) => {
    const companyId = await getCompanyId();

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) throw error;

    return true;
  },
};

/* ==================================================
LOCATIONS
================================================== */

export const locationAPI = {
  getAll: async () => {
    const companyId = await getCompanyId();

    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("company_id", companyId)
      .order("name");

    if (error) throw error;

    return data || [];
  },

  getLocations: async () => {
    return await locationAPI.getAll();
  },

  create: async (payload) => {
    const companyId = await getCompanyId();

    const { error } = await supabase
      .from("locations")
      .insert({
        ...payload,
        company_id: companyId,
      });

    if (error) throw error;

    return true;
  },

  update: async (id, payload) => {
    const companyId = await getCompanyId();

    const { error } = await supabase
      .from("locations")
      .update(payload)
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) throw error;

    return true;
  },

  delete: async (id) => {
    const companyId = await getCompanyId();

    const { error } = await supabase
      .from("locations")
      .delete()
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) throw error;

    return true;
  },
};

/* ==================================================
TASKS
================================================== */

export const taskAPI = {
  getAll: async () => {
    const companyId = await getCompanyId();

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    return data || [];
  },

  getTasks: async () => {
    return await taskAPI.getAll();
  },

  create: async (payload) => {
    const companyId = await getCompanyId();

    const { error } = await supabase
      .from("tasks")
      .insert({
        ...payload,
        company_id: companyId,
      });

    if (error) throw error;

    return true;
  },

  update: async (id, payload) => {
    const companyId = await getCompanyId();

    const { error } = await supabase
      .from("tasks")
      .update(payload)
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) throw error;

    return true;
  },

  complete: async (id) => {
    const companyId = await getCompanyId();

    const { error } = await supabase
      .from("tasks")
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) throw error;

    return true;
  },

  delete: async (id) => {
    const companyId = await getCompanyId();

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) throw error;

    return true;
  },
};

/* ==================================================
SHIFTS
================================================== */

export const shiftAPI = {
  getAll: async () => {
    const companyId = await getCompanyId();

    const { data, error } = await supabase
      .from("shifts")
      .select("*, users(name,email)")
      .eq("company_id", companyId)
      .order("clock_in_time", {
        ascending: false,
      });

    if (error) throw error;

    return data || [];
  },

  getActive: async () => {
    const user = await getCurrentUser();

    const { data, error } = await supabase
      .from("shifts")
      .select("*")
      .eq("user_id", user.id)
      .eq("company_id", user.company_id)
      .is("clock_out_time", null)
      .maybeSingle();

    if (error) throw error;

    return data;
  },

  getActiveAll: async () => {
    const companyId = await getCompanyId();

    const { data, error } = await supabase
      .from("shifts")
      .select("*, users(name,email)")
      .eq("company_id", companyId)
      .is("clock_out_time", null)
      .order("clock_in_time");

    if (error) throw error;

    return data || [];
  },

  clockIn: async (payload = {}) => {
    const user = await getCurrentUser();

    const { error } = await supabase
      .from("shifts")
      .insert({
        ...payload,
        user_id: user.id,
        company_id: user.company_id,
        clock_in_time: new Date().toISOString(),
        total_break_seconds: 0,
      });

    if (error) throw error;

    return true;
  },

  clockOut: async () => {
    const user = await getCurrentUser();

    const { error } = await supabase
      .from("shifts")
      .update({
        clock_out_time: new Date().toISOString(),
        break_started_at: null,
      })
      .eq("user_id", user.id)
      .eq("company_id", user.company_id)
      .is("clock_out_time", null);

    if (error) throw error;

    return true;
  },

  startBreak: async () => {
    const user = await getCurrentUser();

    const { error } = await supabase
      .from("shifts")
      .update({
        break_started_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("company_id", user.company_id)
      .is("clock_out_time", null);

    if (error) throw error;

    return true;
  },

  endBreak: async () => {
    const active = await shiftAPI.getActive();

    if (!active?.break_started_at) return true;

    const extraSeconds = Math.floor(
      (Date.now() -
        new Date(active.break_started_at).getTime()) /
        1000
    );

    const { error } = await supabase
      .from("shifts")
      .update({
        break_started_at: null,
        total_break_seconds:
          (active.total_break_seconds || 0) +
          extraSeconds,
      })
      .eq("id", active.id);

    if (error) throw error;

    return true;
  },

  managerClockOut: async (
    shiftId,
    clockOutTime
  ) => {
    const companyId = await getCompanyId();

    const { error } = await supabase
      .from("shifts")
      .update({
        clock_out_time:
          clockOutTime ||
          new Date().toISOString(),
        break_started_at: null,
      })
      .eq("id", shiftId)
      .eq("company_id", companyId);

    if (error) throw error;

    return true;
  },
};

/* ==================================================
REPORTS
================================================== */

export const reportAPI = {
  getSummary: async () => {
    const users = await userAPI.getAll();
    const tasks = await taskAPI.getAll();
    const shifts = await shiftAPI.getAll();

    const activeUsers = shifts.filter(
      (x) => !x.clock_out_time
    ).length;

    return {
      users: users.length,
      tasks: tasks.length,
      shifts: shifts.length,
      activeUsers,
      completedTasks: tasks.filter(
        (x) => x.completed
      ).length,
    };
  },

  getTimesheets: async () => {
    const companyId = await getCompanyId();

    const { data, error } = await supabase
      .from("shifts")
      .select("*, users(name,email)")
      .eq("company_id", companyId)
      .order("clock_in_time", {
        ascending: false,
      });

    if (error) throw error;

    return data || [];
  },
};

/* ==================================================
ANNOUNCEMENTS
================================================== */

export const announcementAPI = {
  getAll: async () => {
    const companyId = await getCompanyId();

    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    return data || [];
  },

  create: async (payload) => {
    const companyId = await getCompanyId();

    const { error } = await supabase
      .from("announcements")
      .insert({
        ...payload,
        company_id: companyId,
      });

    if (error) throw error;

    return true;
  },

  delete: async (id) => {
    const companyId = await getCompanyId();

    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) throw error;

    return true;
  },
};

/* ==================================================
SCHEDULE
================================================== */

export const scheduleAPI = {
  getAll: async () => {
    const companyId = await getCompanyId();

    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .eq("company_id", companyId)
      .order("date");

    if (error) throw error;

    return data || [];
  },

  getMine: async () => {
    const user = await getCurrentUser();

    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .eq("user_id", user.id)
      .eq("company_id", user.company_id)
      .order("date");

    if (error) throw error;

    return data || [];
  },

  create: async (payload) => {
    const companyId = await getCompanyId();

    const { error } = await supabase
      .from("schedules")
      .insert({
        ...payload,
        company_id: companyId,
      });

    if (error) throw error;

    return true;
  },

  delete: async (id) => {
    const companyId = await getCompanyId();

    const { error } = await supabase
      .from("schedules")
      .delete()
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) throw error;

    return true;
  },
};

/* ==================================================
HOLIDAYS
================================================== */

export const holidayAPI = {
  getAll: async () => {
    const companyId = await getCompanyId();

    const { data, error } = await supabase
      .from("holidays")
      .select("*, users(name)")
      .eq("company_id", companyId)
      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    return data || [];
  },

  getMine: async () => {
    const user = await getCurrentUser();

    const { data, error } = await supabase
      .from("holidays")
      .select("*")
      .eq("user_id", user.id)
      .eq("company_id", user.company_id)
      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    return data || [];
  },

  create: async (payload) => {
    const user = await getCurrentUser();

    const { error } = await supabase
      .from("holidays")
      .insert({
        ...payload,
        user_id: payload.user_id || user.id,
        company_id: user.company_id,
      });

    if (error) throw error;

    return true;
  },

  update: async (id, payload) => {
    const companyId = await getCompanyId();

    const { error } = await supabase
      .from("holidays")
      .update(payload)
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) throw error;

    return true;
  },

  delete: async (id) => {
    const companyId = await getCompanyId();

    const { error } = await supabase
      .from("holidays")
      .delete()
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) throw error;

    return true;
  },
};

/* ==================================================
PERFORMANCE
================================================== */

export const performanceAPI = {
  getAll: async () => {
    return [];
  },

  getSummary: async () => {
    const users = await userAPI.getAll();
    const tasks = await taskAPI.getAll();

    return {
      topPerformers: users.slice(0, 5),
      lowPerformers: [],
      attendanceScore: 0,
      productivityScore: tasks.length,
    };
  },
};

/* ==================================================
INVITES
================================================== */

export const inviteAPI = {
  send: async ({ email, role }) => {
    const user = await getCurrentUser();

    const { error } =
      await supabase.auth.signInWithOtp({
        email,
        options: {
          data: {
            role: role || "employee",
            company_id: user.company_id,
          },
        },
      });

    if (error) throw error;

    return true;
  },
};

/* ==================================================
BILLING
================================================== */

export const billingAPI = {
  checkout: async ({ plan }) => {
    const res = await api.post(
      "/billing/create-checkout-session",
      { plan }
    );

    return res.data;
  },

  portal: async () => {
    const res = await api.post(
      "/billing/portal"
    );

    return res.data;
  },

  getStatus: async () => {
    const user = await authAPI.me();

    return {
      plan: user?.current_plan || null,
      status:
        user?.subscription_status || null,
      next_payment:
        user?.trial_ends_at || null,
    };
  },
};

export default api;