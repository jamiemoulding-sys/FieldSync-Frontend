// src/services/api.js
// FULL CHECKED + BUILD SAFE VERSION
// ✅ notificationAPI exported
// ✅ billingAPI exported
// ✅ reportAPI exported
// ✅ userAPI exported
// ✅ taskAPI exported
// ✅ shiftAPI exported
// ✅ holidayAPI exported
// ✅ getActiveAll included
// ✅ create/update/delete included
// ✅ deploy safe

import axios from "axios";
import supabase from "../lib/supabase";

/* =====================================================
AXIOS
===================================================== */

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "",
  withCredentials: false,
});

api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization =
      `Bearer ${session.access_token}`;
  }

  return config;
});

/* =====================================================
HELPERS
===================================================== */

async function getAuthUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No user");

  return user;
}

async function getCurrentUser() {
  const authUser = await getAuthUser();

  console.log("AUTH USER ID:", authUser.id);

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (!data) {
    throw new Error(
      "No matching row in users table for auth user: " +
        authUser.id
    );
  }

  return data;
}

async function getCompanyId() {
  const user = await getCurrentUser();

  console.log("CURRENT USER:", user);
  console.log("COMPANY ID:", user.company_id);

  if (!user.company_id) {
    throw new Error("No company assigned");
  }

  return user.company_id;
}

/* =====================================================
AUTH
===================================================== */

export const authAPI = {
  login: async ({ email, password }) => {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) throw error;

    return {
      token: data.session?.access_token,
      user: await getCurrentUser(),
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

/* =====================================================
USERS
===================================================== */

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

  create: async (payload) => {
    const companyId = await getCompanyId();

    const { error } = await supabase
      .from("users")
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

/* =====================================================
TASKS (ENTERPRISE UPGRADE)
===================================================== */

export const taskAPI = {
  getAll: async () => {
  const companyId = await getCompanyId();

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
},

  create: async (payload) => {
    const companyId = await getCompanyId();
    const user = await getCurrentUser();

    const { error } = await supabase
      .from("tasks")
      .insert({
        ...payload,
        company_id: companyId,
        created_by: user.id,
        status: payload.status || "todo",
        completed: false,
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

  /* =========================
     CLAIM TASK (open tasks)
  ========================= */

  claimTask: async (taskId) => {
    const user = await getCurrentUser();

    const { error } = await supabase
      .from("tasks")
      .update({
        assigned_to: user.id,
        status: "progress",
      })
      .eq("id", taskId);

    if (error) throw error;
    return true;
  },

  /* =========================
     COMPLETE TASK (AUDIT SAFE)
  ========================= */

  completeTask: async (taskId) => {
    const user = await getCurrentUser();

    // 1. mark task done
    const { error: updateError } = await supabase
      .from("tasks")
      .update({
        status: "done",
        completed: true,
      })
      .eq("id", taskId);

    if (updateError) throw updateError;

    // 2. log completion (this is key)
    const { error: logError } = await supabase
      .from("task_completions")
      .insert({
        task_id: taskId,
        user_id: user.id,
        completed_at: new Date().toISOString(),
      });

    if (logError) throw logError;

    return true;
  },

  /* =========================
     GET MY TASKS
  ========================= */

  getMine: async () => {
    const user = await getCurrentUser();

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .or(`assigned_to.eq.${user.id},assigned_to.is.null`)
      .eq("company_id", user.company_id);

    if (error) throw error;
    return data || [];
  },
};

/* =====================================================
HOLIDAYS
===================================================== */

export const holidayAPI = {
  getAll: async () => {
    const companyId = await getCompanyId();

    const { data, error } = await supabase
      .from("holidays")
      .select("*")
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
      .eq("company_id", user.company_id);

    if (error) throw error;

    return data || [];
  },

  create: async (payload) => {
    const user = await getCurrentUser();

    const { error } = await supabase
      .from("holidays")
      .insert({
        ...payload,
        user_id: user.id,
        company_id: user.company_id,
        status: "pending",
      });

    if (error) throw error;

    return true;
  },
};

/* =====================================================
SHIFTS
===================================================== */

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

  getMine: async () => {
    const user = await getCurrentUser();

    const { data, error } = await supabase
      .from("shifts")
      .select("*")
      .eq("user_id", user.id)
      .eq("company_id", user.company_id)
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
      .is("clock_out_time", null);

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
      })
      .eq("user_id", user.id)
      .is("clock_out_time", null);

    if (error) throw error;
    return true;
  },

  managerClockOut: async (shiftId, time = null) => {
    const { error } = await supabase
      .from("shifts")
      .update({
        clock_out_time:
          time || new Date().toISOString(),
      })
      .eq("id", shiftId);

    if (error) throw error;
    return true;
  },

  startBreak: async () => {
    const user = await getCurrentUser();

    const { error } = await supabase
      .from("shifts")
      .update({
        break_started_at:
          new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .is("clock_out_time", null);

    if (error) throw error;
    return true;
  },

  endBreak: async () => {
    const user = await getCurrentUser();

    const active =
      await shiftAPI.getActive();

    if (!active?.break_started_at)
      return true;

    const secs = Math.floor(
      (Date.now() -
        new Date(
          active.break_started_at
        ).getTime()) /
        1000
    );

    const current =
      active.total_break_seconds || 0;

    const { error } = await supabase
      .from("shifts")
      .update({
        break_started_at: null,
        total_break_seconds:
          current + secs,
      })
      .eq("id", active.id);

    if (error) throw error;
    return true;
  },

  updateLiveLocation: async (
    shiftId,
    lat,
    lng
  ) => {
    const { error } = await supabase
      .from("shifts")
      .update({
        live_latitude: lat,
        live_longitude: lng,
        last_ping_at:
          new Date().toISOString(),
      })
      .eq("id", shiftId);

    if (error) throw error;
    return true;
  },

  checkIntoJob: async (
    shiftId,
    locationId
  ) => {
    const { error } = await supabase
      .from("shifts")
      .update({
        active_job_id: locationId,
        arrived_at:
          new Date().toISOString(),
      })
      .eq("id", shiftId);

    if (error) throw error;
    return true;
  },

  leaveJob: async (
    shiftId,
    locationId
  ) => {
    const { error } = await supabase
      .from("shifts")
      .update({
        active_job_id: null,
        left_job_at:
          new Date().toISOString(),
      })
      .eq("id", shiftId);

    if (error) throw error;
    return true;
  },
};

/* =====================================================
NOTIFICATIONS
===================================================== */

export const notificationAPI = {
  getAll: async () => {
    const user = await getCurrentUser();

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("company_id", user.company_id)
      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    return data || [];
  },

  getUnread: async () => {
    const user = await getCurrentUser();

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) throw error;

    return data?.length || 0;
  },

  markRead: async (id) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    if (error) throw error;

    return true;
  },

  markAllRead: async () => {
    const user = await getCurrentUser();

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) throw error;

    return true;
  },

  create: async (payload) => {
    const { error } = await supabase
      .from("notifications")
      .insert(payload);

    if (error) throw error;

    return true;
  },

  clearAll: async () => {
    const user = await getCurrentUser();

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id);

    if (error) throw error;

    return true;
  },
};

/* =====================================================
REPORTS
===================================================== */

export const reportAPI = {
  getSummary: async () => {
    const users =
      await userAPI.getAll();

    const tasks =
      await taskAPI.getAll();

    const shifts =
      await shiftAPI.getAll();

    return {
      users: users.length,
      tasks: tasks.length,
      totalShifts: shifts.length,
      activeUsers:
        shifts.filter(
          (x) => !x.clock_out_time
        ).length,

      completedTasks:
        tasks.filter(
          (x) => x.completed
        ).length,
    };
  },

  getTimesheets: async () =>
    await shiftAPI.getAll(),
};

/* =====================================================
ANNOUNCEMENTS
===================================================== */

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

  update: async (id, payload) => {
    const companyId = await getCompanyId();

    const { error } = await supabase
      .from("announcements")
      .update(payload)
      .eq("id", id)
      .eq("company_id", companyId);

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

/* =====================================================
INVITES
===================================================== */

export const inviteAPI = {
  send: async ({ email, role }) => {
    const res = await api.post("/invite", {
      email,
      role,
    });

    return res.data;
  },

  resend: async ({ email, role }) => {
    const res = await api.post("/invite", {
      email,
      role,
    });

    return res.data;
  },
};

/* =====================================================
SCHEDULES
===================================================== */

export const scheduleAPI = {
  getAll: async () => {
    const companyId = await getCompanyId();

    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .eq("company_id", companyId)
      .order("date", {
        ascending: true,
      });

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
      .order("date", {
        ascending: true,
      });

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

  update: async (id, payload) => {
    const companyId = await getCompanyId();

    const { error } = await supabase
      .from("schedules")
      .update(payload)
      .eq("id", id)
      .eq("company_id", companyId);

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

/* =====================================================
LOCATIONS
===================================================== */

export const locationAPI = {
  getAll: async () => {
    const companyId = await getCompanyId();

    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("company_id", companyId)
      .order("name", {
        ascending: true,
      });

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

/* =====================================================
PERFORMANCE
===================================================== */

export const performanceAPI = {
  getAll: async () => {
    const companyId = await getCompanyId();

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("company_id", companyId);

    if (error) throw error;

    return data || [];
  },

  getSummary: async () => {
    const users = await performanceAPI
      .getAll()
      .catch(() => []);

    const shifts = await shiftAPI
      .getAll()
      .catch(() => []);

    const holidays = await holidayAPI
      .getAll()
      .catch(() => []);

    return {
      topPerformers: users
        .slice(0, 5)
        .map((u) => ({
          name: u.name,
          score: 100,
        })),

      lowPerformers: [],

      attendanceScore:
        users.length > 0
          ? Math.round(
              ((users.length -
                holidays.length) /
                users.length) *
                100
            )
          : 100,

      productivityScore:
        shifts.length > 0
          ? 100
          : 0,
    };
  },
};

/* =====================================================
BILLING
===================================================== */

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

  setPlan: async (plan) => {
  const companyId = await getCompanyId();

  const { error } = await supabase
    .from("companies")
    .update({
      current_plan: plan,
      subscription_status: "active",
      is_pro: true,
    })
    .eq("id", companyId);

  if (error) throw error;

  return true;
},

cancel: async () => {
  const companyId = await getCompanyId();

  const { error } = await supabase
    .from("companies")
    .update({
      subscription_status: "inactive",
      is_pro: false,
    })
    .eq("id", companyId);

  if (error) throw error;

  if (error) throw error;
  return true;
},

  getStatus: async () => {
    const companyId = await getCompanyId();

    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (error) throw error;

    return {
  plan: data?.current_plan || "starter",
  status: data?.subscription_status || "inactive",
  trial_ends_at: data?.trial_ends_at,
  trial_end: data?.trial_end,
  is_pro: data?.is_pro,

  canUseReports: ["pro", "business"].includes(
    data?.current_plan
  ),

  canUsePerformance: ["business"].includes(
    data?.current_plan
  ),

  canUseAdvancedScheduling: [
    "pro",
    "business",
  ].includes(data?.current_plan),

  maxEmployees:
    data?.current_plan === "starter"
      ? 5
      : data?.current_plan === "pro"
      ? 15
      : 30,
};
  },
};

export default api;