// src/services/api.js

import axios from "axios";
import supabase from "../lib/supabase";

/* ==================================================
AXIOS CLIENT
================================================== */

const api = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL || "",
  withCredentials: false,
});

/* ==================================================
LIVE TOKEN FIX
(no stale localStorage token)
================================================== */

api.interceptors.request.use(
  async (config) => {
    const {
      data: { session },
    } =
      await supabase.auth.getSession();

    if (
      session?.access_token
    ) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    return config;
  }
);

/* ==================================================
AUTH
================================================== */

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
    } =
      await supabase
        .from("users")
        .select("*")
        .eq(
          "id",
          data.user.id
        )
        .maybeSingle();

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

  logout: async () => {
    await supabase.auth.signOut();
    return true;
  },

  me: async () => {
    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) return null;

    const {
      data,
    } =
      await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

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
    const {
      data,
      error,
    } =
      await supabase
        .from("users")
        .select("*")
        .order("name");

    if (error) throw error;

    return data || [];
  },

  getById: async (id) => {
    const {
      data,
      error,
    } =
      await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) throw error;

    return data;
  },

  update: async (
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

/* ==================================================
ANNOUNCEMENTS
================================================== */

export const announcementAPI = {
  getAll: async () => {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "announcements"
        )
        .select("*")
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        );

    if (error) throw error;

    return data || [];
  },

  create: async (
    payload
  ) => {
    const { error } =
      await supabase
        .from(
          "announcements"
        )
        .insert(payload);

    if (error) throw error;

    return true;
  },

  delete: async (id) => {
    const { error } =
      await supabase
        .from(
          "announcements"
        )
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
    const {
      data,
      error,
    } =
      await supabase
        .from("locations")
        .select("*")
        .order("name");

    if (error) throw error;

    return data || [];
  },

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
          .order(
            "name"
          );

      if (error)
        throw error;

      return data || [];
    },

  create: async (
    payload
  ) => {
    const { error } =
      await supabase
        .from("locations")
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
    } =
      await supabase.auth.getUser();

    if (!user) return null;

    const {
      data,
      error,
    } =
      await supabase
        .from("shifts")
        .select("*")
        .eq(
          "user_id",
          user.id
        )
        .is(
          "clock_out_time",
          null
        )
        .maybeSingle();

    if (error) throw error;

    return data;
  },

  getAll: async () => {
    const {
      data,
      error,
    } =
      await supabase
        .from("shifts")
        .select("*")
        .order(
          "clock_in_time",
          {
            ascending:
              false,
          }
        );

    if (error) throw error;

    return data || [];
  },

  getHistory:
    async () => {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user)
        return [];

      const {
        data,
        error,
      } =
        await supabase
          .from("shifts")
          .select("*")
          .eq(
            "user_id",
            user.id
          )
          .order(
            "clock_in_time",
            {
              ascending:
                false,
            }
          );

      if (error)
        throw error;

      return data || [];
    },

  clockIn: async (
    payload = {}
  ) => {
    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user)
      throw new Error(
        "No user"
      );

    const { error } =
      await supabase
        .from("shifts")
        .insert({
          user_id:
            user.id,
          ...payload,
          clock_in_time:
            new Date().toISOString(),
          total_break_seconds: 0,
        });

    if (error) throw error;

    return true;
  },

  clockOut:
    async () => {
      const active =
        await shiftAPI.getActive();

      if (!active)
        return true;

      const { error } =
        await supabase
          .from("shifts")
          .update({
            clock_out_time:
              new Date().toISOString(),
            break_started_at:
              null,
          })
          .eq(
            "id",
            active.id
          );

      if (error)
        throw error;

      return true;
    },
};

/* ==================================================
INVITES
================================================== */

export const inviteAPI = {
  send: async ({
    email,
    role,
  }) => {
    const { error } =
      await supabase.auth.signInWithOtp(
        {
          email,
          options: {
            data: {
              role:
                role ||
                "employee",
            },
          },
        }
      );

    if (error) throw error;

    return true;
  },
};

/* ==================================================
TASKS
================================================== */

export const taskAPI = {
  getAll: async () => {
    const {
      data,
      error,
    } =
      await supabase
        .from("tasks")
        .select("*")
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        );

    if (error) throw error;

    return data || [];
  },

  getMine:
    async () => {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user)
        return [];

      const {
        data,
        error,
      } =
        await supabase
          .from("tasks")
          .select("*")
          .eq(
            "user_id",
            user.id
          );

      if (error)
        throw error;

      return data || [];
    },

  create: async (
    payload
  ) => {
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

/* ==================================================
HOLIDAYS FIXED
(real table = holidays)
================================================== */

export const holidayAPI = {
  getAll: async () => {
    const {
      data,
      error,
    } =
      await supabase
        .from("holidays")
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

    if (error) throw error;

    return (
      data?.map((x) => ({
        ...x,
        name:
          x.users?.name,
      })) || []
    );
  },

  getMine:
    async () => {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user)
        return [];

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "holidays"
          )
          .select("*")
          .eq(
            "user_id",
            user.id
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );

      if (error)
        throw error;

      return data || [];
    },

  create: async (
    payload
  ) => {
    const { error } =
      await supabase
        .from("holidays")
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
        .from("holidays")
        .update(payload)
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
      totalUsers:
        users.length,

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
          (x) =>
            !x.clock_out_time
        ).length || 0,

      hoursWorked: 0,
    };
  },

  getTimesheets:
    async () => {
      const {
        data,
        error,
      } =
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

      if (error)
        throw error;

      return data || [];
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
    return {
      topPerformers: [],
      lowPerformers: [],
      attendanceScore: 0,
      productivityScore: 0,
    };
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
BILLING
================================================== */

export const billingAPI = {
  checkout: async ({
    plan,
  }) => {
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
          "/billing/portal"
        );

      return res.data;
    },

  getStatus:
    async () => {
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