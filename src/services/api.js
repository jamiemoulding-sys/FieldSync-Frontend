// src/services/api.js

import axios from "axios";
import { createClient } from "@supabase/supabase-js";

/* =========================================
AXIOS API CLIENT
========================================= */

const api = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL || "",
  withCredentials: true,
});

/* =========================================
SUPABASE
========================================= */

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

/* =========================================
ANNOUNCEMENTS
========================================= */

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

/* =========================================
SHIFTS
========================================= */

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

  clockIn: async ({
    location_id,
    latitude,
    longitude,
  }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("No user");

    const { error } =
      await supabase
        .from("shifts")
        .insert({
          user_id: user.id,
          location_id,
          latitude,
          longitude,
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
    ) {
      return true;
    }

    const started =
      new Date(
        active.break_started_at
      ).getTime();

    const seconds = Math.floor(
      (Date.now() - started) / 1000
    );

    const total =
      (active.total_break_seconds || 0) +
      seconds;

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

/* =========================================
INVITES
========================================= */

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

/* =========================================
TASKS
========================================= */

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
    } =
      await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } =
      await supabase
        .from("tasks")
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
        .from("tasks")
        .insert(payload);

    if (error) throw error;

    return true;
  },

  update: async (
    id,
    payload
  ) => {
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

/* =========================================
LOCATIONS
========================================= */

export const locationAPI = {
  getLocations:
    async () => {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "locations"
          )
          .select("*")
          .order("name");

      if (error)
        throw error;

      return data || [];
    },

  create: async (
    payload
  ) => {
    const { error } =
      await supabase
        .from(
          "locations"
        )
        .insert(payload);

    if (error)
      throw error;

    return true;
  },

  update: async (
    id,
    payload
  ) => {
    const { error } =
      await supabase
        .from(
          "locations"
        )
        .update(payload)
        .eq("id", id);

    if (error)
      throw error;

    return true;
  },

  delete: async (id) => {
    const { error } =
      await supabase
        .from(
          "locations"
        )
        .delete()
        .eq("id", id);

    if (error)
      throw error;

    return true;
  },
};



/* =========================================
PERFORMANCE
========================================= */

export const performanceAPI = {
  getAll: async () => [],
};

/* =========================================
AUTH
========================================= */

export const authAPI = {
  login: async ({
    email,
    password,
  }) => {
    const {
      data,
      error,
    } =
      await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

    if (error) throw error;

    const {
      data: profile,
    } = await supabase
      .from("users")
      .select("*")
      .eq(
        "id",
        data.user.id
      )
      .single();

    return {
      token:
        data.session
          .access_token,
      user: {
        ...profile,
        email:
          data.user.email,
      },
    };
  },

  me: async () => {
    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) return null;

    const {
      data,
    } = await supabase
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

/* =========================================
USERS
========================================= */

export const userAPI = {
  getAll: async () => {
    const {
      data,
      error,
    } = await supabase
      .from("users")
      .select("*")
      .order("name");

    if (error) throw error;

    return data || [];
  },

  updateRole: async (
    id,
    payload
  ) => {
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

/* =========================================
HOLIDAY
========================================= */

export const holidayAPI = {
  getAll: async () => {
    const { data } =
      await supabase
        .from(
          "holiday_requests"
        )
        .select(
          "*, users(name)"
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        );

    return (
      data?.map((x) => ({
        ...x,
        name:
          x.users?.name,
      })) || []
    );
  },

  create: async (
    payload
  ) => {
    await supabase
      .from(
        "holiday_requests"
      )
      .insert(payload);

    return true;
  },

  update: async (
    id,
    payload
  ) => {
    await supabase
      .from(
        "holiday_requests"
      )
      .update(payload)
      .eq("id", id);

    return true;
  },
};

/* =========================================
SCHEDULE
========================================= */

export const scheduleAPI = {
  getAll: async () => {
    const { data } =
      await supabase
        .from("schedules")
        .select(
          "*, users(name)"
        )
        .order("date");

    return (
      data?.map((x) => ({
        ...x,
        name:
          x.users?.name,
      })) || []
    );
  },

  create: async (
    payload
  ) => {
    await supabase
      .from("schedules")
      .insert(payload);

    return true;
  },

  delete: async (id) => {
    await supabase
      .from("schedules")
      .delete()
      .eq("id", id);

    return true;
  },
};

/* =========================================
REPORTS
========================================= */

export const reportAPI = {
  getSummary: async () => {
    const users =
      await userAPI.getAll();

    const shifts =
      await supabase
        .from("shifts")
        .select("*");

    const tasks =
      await supabase
        .from("tasks")
        .select("*");

    const active =
      shifts.data?.filter(
        (x) =>
          !x.clock_out_time
      ) || [];

    return {
      totalUsers:
        users.length,
      totalShifts:
        shifts.data
          ?.length || 0,
      totalTasks:
        tasks.data
          ?.length || 0,
      completedTasks:
        tasks.data?.filter(
          (x) =>
            x.completed
        ).length || 0,
      activeUsers:
        active.length,
      hoursWorked: 0,
    };
  },

  getTimesheets:
    async () => {
      const { data } =
        await supabase
          .from("shifts")
          .select(
            "*, users(name,email)"
          )
          .order(
            "clock_in_time",
            {
              ascending:
                false,
            }
          );

      return data || [];
    },
};

/* =========================================
MANAGER
========================================= */

export const managerAPI = {
  getDashboard:
    reportAPI.getSummary,
};

/* =========================================
BILLING (REAL STRIPE)
========================================= */

export const billingAPI = {
  getStatus:
    async () => {
      const res =
        await api.get(
          "/billing/status"
        );

      return res.data;
    },

  checkout:
    async ({
      plan,
    } = {}) => {
      const res =
        await api.post(
          "/billing/create-checkout-session",
          { plan }
        );

      return res.data;
    },

  portal:
    async () => {
      const res =
        await api.post(
          "/billing/customer-portal"
        );

      return res.data;
    },
};

/* =========================================
DEFAULT
========================================= */

export default api;