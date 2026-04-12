import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

/* =========================================================
AUTH
========================================================= */

export const authAPI = {
  login: async ({ email, password }) => {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) throw error;

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

  me: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } =
      await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

    return {
      ...profile,
      email: user.email,
    };
  },
};

/* =========================================================
USERS
========================================================= */

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
};

/* =========================================================
LOCATIONS
========================================================= */

export const locationAPI = {
  getLocations: async () => {
    const { data, error } =
      await supabase
        .from("locations")
        .select("*")
        .order("name");

    if (error) throw error;

    return data || [];
  },
};

/* =========================================================
SHIFTS / CLOCKING
========================================================= */

export const shiftAPI = {
  getActive: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    const { data, error } =
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
        })
        .select()
        .single();

    if (error) throw error;

    return data;
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
        })
        .eq("id", active.id);

    if (error) throw error;

    return true;
  },

  startBreak: async () => {
    const active =
      await shiftAPI.getActive();

    const { error } =
      await supabase
        .from("shifts")
        .update({
          break_started_at:
            new Date().toISOString(),
        })
        .eq("id", active.id);

    if (error) throw error;
  },

  endBreak: async () => {
    const active =
      await shiftAPI.getActive();

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
          total_break_seconds: total,
        })
        .eq("id", active.id);

    if (error) throw error;
  },
};

/* =========================================================
EMPLOYEE SCHEDULE
========================================================= */

export const scheduleAPI = {
  getMine: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } =
      await supabase
        .from("schedules")
        .select("*")
        .eq("user_id", user.id)
        .order("date");

    if (error) throw error;

    return data || [];
  },
};

/* =========================================================
HOLIDAYS
========================================================= */

export const holidayAPI = {
  getMine: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } =
      await supabase
        .from("holiday_requests")
        .insert({
          ...payload,
          user_id: user.id,
          status: "pending",
        });

    if (error) throw error;

    return true;
  },
};

export default supabase;