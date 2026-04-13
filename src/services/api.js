// src/services/api.js

import axios from "axios";
import { createClient } from "@supabase/supabase-js";

/* ==================================================
AXIOS CLIENT
================================================== */

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ==================================================
SUPABASE
================================================== */

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

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

    localStorage.setItem(
      "token",
      data.session.access_token
    );

    const { data: profile } =
      await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .single();

    return {
      token: data.session.access_token,
      user: {
        ...profile,
        email: data.user.email,
      },
    };
  },

  logout: async () => {
    localStorage.removeItem("token");
    await supabase.auth.signOut();
    return true;
  },

  me: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    return {
      ...data,
      email: user.email,
    };
  },
};

/* ==================================================
USERS
================================================== */

export const userAPI = {
  getAll: async () => {
    const { data, error } =
      await supabase
        .from("users")
        .select("*")
        .order("name");

    if (error) throw error;

    return data || [];
  },

  getById: async (id) => {
    const { data, error } =
      await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

    if (error) throw error;

    return data;
  },

  update: async (id, payload) => {
    const { error } =
      await supabase
        .from("users")
        .update(payload)
        .eq("id", id);

    if (error) throw error;

    return true;
  },

  updateRole: async (id, payload) => {
    const { error } =
      await supabase
        .from("users")
        .update(payload)
        .eq("id", id);

    if (error) throw error;

    return true;
  },

  delete: async (id) => {
    const { error } =
      await supabase
        .from("users")
        .delete()
        .eq("id", id);

    if (error) throw error;

    return true;
  },
};

/* ==================================================
ANNOUNCEMENTS
================================================== */

export const announcementAPI = {
  getAll: async () => {
    const { data, error } =
      await supabase
        .from("announcements")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (error) throw error;

    return data || [];
  },

  create: async (payload) => {
    const { error } =
      await supabase
        .from("announcements")
        .insert(payload);

    if (error) throw error;

    return true;
  },

  delete: async (id) => {
    const { error } =
      await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

    if (error) throw error;

    return true;
  },
};

/* ==================================================
LOCATIONS
================================================== */

export const locationAPI = {
  getAll: async () => {
    const { data, error } =
      await supabase
        .from("locations")
        .select("*")
        .order("name");

    if (error) throw error;

    return data || [];
  },

  getLocations: async () => {
    const { data, error } =
      await supabase
        .from("locations")
        .select("*")
        .order("name");

    if (error) throw error;

    return data || [];
  },

  create: async (payload) => {
    const { error } =
      await supabase
        .from("locations")
        .insert(payload);

    if (error) throw error;

    return true;
  },

  update: async (id, payload) => {
    const { error } =
      await supabase
        .from("locations")
        .update(payload)
        .eq("id", id);

    if (error) throw error;

    return true;
  },

  delete: async (id) => {
    const { error } =
      await supabase
        .from("locations")
        .delete()
        .eq("id", id);

    if (error) throw error;

    return true;
  },
};

/* ==================================================
SHIFTS
================================================== */

export const shiftAPI = {
  getActive: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } =
      await supabase
        .from("shifts")
        .select("*")
        .eq("user_id", user.id)
        .is("clock_out_time", null)
        .maybeSingle();

    if (error) throw error;

    return data;
  },

  getAll: async () => {
    const { data, error } =
      await supabase
        .from("shifts")
        .select("*")
        .order("clock_in_time", {
          ascending: false,
        });

    if (error) throw error;

    return data || [];
  },

  getHistory: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } =
      await supabase
        .from("shifts")
        .select("*")
        .eq("user_id", user.id)
        .order("clock_in_time", {
          ascending: false,
        });

    if (error) throw error;

    return data || [];
  },

  clockIn: async (payload = {}) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("No user");

    const { error } =
      await supabase
        .from("shifts")
        .insert({
          user_id: user.id,
          ...payload,
          clock_in_time:
            new Date().toISOString(),
          total_break_seconds: 0,
        });

    if (error) throw error;

    return true;
  },

  clockOut: async () => {
    const active =
      await shiftAPI.getActive();

    if (!active) return true;

    const { error } =
      await supabase
        .from("shifts")
        .update({
          clock_out_time:
            new Date().toISOString(),
          break_started_at: null,
        })
        .eq("id", active.id);

    if (error) throw error;

    return true;
  },

  startBreak: async () => {
    const active =
      await shiftAPI.getActive();

    if (!active) return true;

    const { error } =
      await supabase
        .from("shifts")
        .update({
          break_started_at:
            new Date().toISOString(),
        })
        .eq("id", active.id);

    if (error) throw error;

    return true;
  },

  endBreak: async () => {
    const active =
      await shiftAPI.getActive();

    if (
      !active ||
      !active.break_started_at
    )
      return true;

    const started =
      new Date(
        active.break_started_at
      ).getTime();

    const seconds = Math.floor(
      (Date.now() - started) / 1000
    );

    const total =
      (active.total_break_seconds ||
        0) + seconds;

    const { error } =
      await supabase
        .from("shifts")
        .update({
          break_started_at: null,
          total_break_seconds:
            total,
        })
        .eq("id", active.id);

    if (error) throw error;

    return true;
  },
};

/* ==================================================
INVITES
================================================== */

export const inviteAPI = {
  send: async ({ email, role }) => {
    const { error } =
      await supabase.auth.signInWithOtp({
        email,
        options: {
          data: {
            role:
              role || "employee",
          },
        },
      });

    if (error) throw error;

    return true;
  },
};

/* ==================================================
TASKS
================================================== */

export const taskAPI = {
  getAll: async () => {
    const { data, error } =
      await supabase
        .from("tasks")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (error) throw error;

    return data || [];
  },

  getMine: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } =
      await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id);

    if (error) throw error;

    return data || [];
  },

  create: async (payload) => {
    const { error } =
      await supabase
        .from("tasks")
        .insert(payload);

    if (error) throw error;

    return true;
  },

  update: async (id, payload) => {
    const { error } =
      await supabase
        .from("tasks")
        .update(payload)
        .eq("id", id);

    if (error) throw error;

    return true;
  },

  delete: async (id) => {
    const { error } =
      await supabase
        .from("tasks")
        .delete()
        .eq("id", id);

    if (error) throw error;

    return true;
  },
};

/* ==================================================
HOLIDAYS
================================================== */

export const holidayAPI = {
  getAll: async () => {
    const { data, error } =
      await supabase
        .from("holiday_requests")
        .select("*, users(name)")
        .order("created_at", {
          ascending: false,
        });

    if (error) throw error;

    return (
      data?.map((x) => ({
        ...x,
        name: x.users?.name,
      })) || []
    );
  },

  getMine: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } =
      await supabase
        .from("holiday_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

    if (error) throw error;

    return data || [];
  },

  create: async (payload) => {
    const { error } =
      await supabase
        .from("holiday_requests")
        .insert(payload);

    if (error) throw error;

    return true;
  },

  update: async (id, payload) => {
    const { error } =
      await supabase
        .from("holiday_requests")
        .update(payload)
        .eq("id", id);

    if (error) throw error;

    return true;
  },
};

/* ==================================================
SCHEDULE
================================================== */

export const scheduleAPI = {
  getAll: async () => {
    const { data, error } =
      await supabase
        .from("schedules")
        .select("*, users(name)")
        .order("date");

    if (error) throw error;

    return (
      data?.map((x) => ({
        ...x,
        name: x.users?.name,
      })) || []
    );
  },

  getMine: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } =
      await supabase
        .from("schedules")
        .select("*")
        .eq("user_id", user.id)
        .order("date");

    if (error) throw error;

    return data || [];
  },

  create: async (payload) => {
    const { error } =
      await supabase
        .from("schedules")
        .insert(payload);

    if (error) throw error;

    return true;
  },

  delete: async (id) => {
    const { error } =
      await supabase
        .from("schedules")
        .delete()
        .eq("id", id);

    if (error) throw error;

    return true;
  },
};

/* ==================================================
REPORTS
================================================== */

export const reportAPI = {
  getSummary: async () => {
    const users =
      await userAPI.getAll();

    const { data: shifts } =
      await supabase
        .from("shifts")
        .select("*");

    const { data: tasks } =
      await supabase
        .from("tasks")
        .select("*");

    return {
      totalUsers: users.length,
      totalShifts:
        shifts?.length || 0,
      totalTasks:
        tasks?.length || 0,
      completedTasks:
        tasks?.filter(
          (x) => x.completed
        ).length || 0,
      activeUsers:
        shifts?.filter(
          (x) => !x.clock_out_time
        ).length || 0,
      hoursWorked: 0,
    };
  },

  getTimesheets: async () => {
    const { data, error } =
      await supabase
        .from("shifts")
        .select(
          "*, users(name,email)"
        )
        .order("clock_in_time", {
          ascending: false,
        });

    if (error) throw error;

    return data || [];
  },
};

/* ==================================================
PERFORMANCE
================================================== */

export const performanceAPI = {
  getAll: async () => [],
};

/* ==================================================
MANAGER
================================================== */

export const managerAPI = {
  getDashboard:
    reportAPI.getSummary,
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
    const user =
      await authAPI.me();

    return {
      plan:
        user?.current_plan ||
        null,
      status:
        user?.subscription_status ||
        null,
      next_payment:
        user?.trial_ends_at ||
        null,
    };
  },
};

/* ==================================================
DEFAULT
================================================== */

export default api;