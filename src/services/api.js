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