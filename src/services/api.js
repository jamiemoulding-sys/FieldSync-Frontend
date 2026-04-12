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

    const authUser = data.user;

    const { data: profile } =
      await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

    return {
      token: data.session?.access_token,

      user: {
        id: authUser.id,
        email: authUser.email,
        name: profile?.name || "",
        phone: profile?.phone || "",
        role: profile?.role || "employee",
        companyId:
          profile?.company_id || null,
        companyName:
          profile?.company_name || "",
        jobTitle:
          profile?.job_title || "",
        isPro:
          profile?.is_pro || false,
        is_pro:
          profile?.is_pro || false,
        current_plan:
          profile?.current_plan ||
          "free",
        subscription_status:
          profile?.subscription_status ||
          "free",
      },
    };
  },

  register: async ({
    email,
    password,
    name,
    companyName,
  }) => {
    const { data, error } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

    if (error) throw error;

    if (data.user) {
      await supabase
        .from("users")
        .insert({
          id: data.user.id,
          email,
          name,
          role: "admin",
          company_name:
            companyName,
          is_pro: false,
          current_plan: "free",
          subscription_status:
            "free",
        });
    }

    return data;
  },

  me: async () => {
    const { data, error } =
      await supabase.auth.getUser();

    if (error) throw error;

    if (!data.user) return null;

    const { data: profile } =
      await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle();

    return {
      id: data.user.id,
      email: data.user.email,
      ...profile,
    };
  },

  updateMe: async (
    payload
  ) => {
    const { data } =
      await supabase.auth.getUser();

    const user =
      data.user;

    if (!user)
      throw new Error(
        "No user found"
      );

    const { error } =
      await supabase
        .from("users")
        .update({
          name:
            payload.name,
          phone:
            payload.phone,
          company_name:
            payload.companyName,
          job_title:
            payload.jobTitle,
          updated_at:
            new Date(),
        })
        .eq(
          "id",
          user.id
        );

    if (error) throw error;

    return payload;
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

  updateRole:
    async (
      id,
      payload
    ) => {
      const { error } =
        await supabase
          .from("users")
          .update({
            role:
              payload.role,
          })
          .eq("id", id);

      if (error)
        throw error;

      return true;
    },

  delete:
    async (id) => {
      const { error } =
        await supabase
          .from("users")
          .delete()
          .eq("id", id);

      if (error)
        throw error;

      return true;
    },
};

/* =========================================================
INVITES
========================================================= */

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
            emailRedirectTo:
              "https://app.zorviatech.co.uk/set-password",
            data: {
              role:
                role ||
                "employee",
            },
          },
        }
      );

    if (error) throw error;

    return {
      success: true,
    };
  },
};

/* =========================================================
LOCATIONS
========================================================= */

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

  create:
    async (payload) => {
      const {
        data: authData,
      } =
        await supabase.auth.getUser();

      const userId =
        authData?.user?.id;

      const {
        data: profile,
      } =
        await supabase
          .from("users")
          .select(
            "company_id"
          )
          .eq("id", userId)
          .single();

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "locations"
          )
          .insert({
            ...payload,
            company_id:
              profile.company_id,
          })
          .select()
          .single();

      if (error)
        throw error;

      return data;
    },

  update:
    async (
      id,
      payload
    ) => {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "locations"
          )
          .update(payload)
          .eq("id", id)
          .select()
          .single();

      if (error)
        throw error;

      return data;
    },

  delete:
    async (id) => {
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

/* =========================================================
TASKS
========================================================= */

export const taskAPI = {
  getTasks:
    async () => {
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

      if (error)
        throw error;

      return data || [];
    },

  create:
    async (task) => {
      const {
        data,
        error,
      } =
        await supabase
          .from("tasks")
          .insert(task)
          .select();

      if (error)
        throw error;

      return data;
    },

  complete:
    async (id) => {
      const { error } =
        await supabase
          .from("tasks")
          .update({
            completed: true,
          })
          .eq("id", id);

      if (error)
        throw error;

      return true;
    },

  delete:
    async (id) => {
      const { error } =
        await supabase
          .from("tasks")
          .delete()
          .eq("id", id);

      if (error)
        throw error;

      return true;
    },
};

/* =========================================================
SHIFTS
========================================================= */

export const shiftAPI = {
  getActive:
    async () => {
      const {
        data: authData,
      } =
        await supabase.auth.getUser();

      const userId =
        authData?.user?.id;

      if (!userId)
        return null;

      const {
        data,
        error,
      } =
        await supabase
          .from("shifts")
          .select("*")
          .eq(
            "user_id",
            userId
          )
          .is(
            "clock_out_time",
            null
          )
          .order(
            "clock_in_time",
            {
              ascending:
                false,
            }
          )
          .maybeSingle();

      if (error)
        throw error;

      return data || null;
    },

  getAllActive:
    async () => {
      const {
        data,
        error,
      } =
        await supabase
          .from("shifts")
          .select("*")
          .is(
            "clock_out_time",
            null
          );

      if (error)
        throw error;

      return data || [];
    },

  clockIn:
    async ({
      location_id,
      latitude,
      longitude,
    }) => {
      const {
        data: authData,
      } =
        await supabase.auth.getUser();

      const userId =
        authData?.user?.id;

      const {
        data: profile,
      } =
        await supabase
          .from("users")
          .select(
            "company_id"
          )
          .eq("id", userId)
          .single();

      const {
        data,
        error,
      } =
        await supabase
          .from("shifts")
          .insert({
            user_id:
              userId,
            company_id:
              profile.company_id,
            location_id,
            latitude,
            longitude,

            /* FIXED */
            clock_in_time:
              new Date(),
          })
          .select()
          .single();

      if (error)
        throw error;

      return data;
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
            /* FIXED */
            clock_out_time:
              new Date(),
          })
          .eq(
            "id",
            active.id
          );

      if (error)
        throw error;

      return true;
    },

  updateLocation:
    async ({
      latitude,
      longitude,
    }) => {
      const active =
        await shiftAPI.getActive();

      if (!active)
        return true;

      const { error } =
        await supabase
          .from("shifts")
          .update({
            latitude,
            longitude,
          })
          .eq(
            "id",
            active.id
          );

      if (error)
        throw error;

      return true;
    },

  getHistory:
    async () => {
      const {
        data: authData,
      } =
        await supabase.auth.getUser();

      const userId =
        authData?.user?.id;

      if (!userId)
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
            userId
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

/* =========================================================
SCHEDULE
========================================================= */

export const scheduleAPI = {
  getAll:
    async () => [],

  getMine:
    async () => [],

  create:
    async () => true,

  update:
    async () => true,

  delete:
    async () => true,

  getLate:
    async () => [],
};

/* =========================================================
ANNOUNCEMENTS
========================================================= */

export const announcementAPI = {
  getAll:
    async () => [],

  create:
    async () => true,

  delete:
    async () => true,
};

/* =========================================================
MANAGER DASHBOARD
========================================================= */

export const managerAPI = {
  getDashboard:
    async () => ({
      totalUsers: 0,
      tasks: 0,
      liveUsers: 0,
      late: 0,
    }),
};

/* =========================================================
HOLIDAYS
========================================================= */

export const holidayAPI = {
  getAll:
    async () => [],

  create:
    async () => true,

  update:
    async () => true,

  delete:
    async () => true,
};

/* =========================================================
PERFORMANCE
========================================================= */

export const performanceAPI = {
  getAll:
    async () => [],
};

/* =========================================================
REPORTS
========================================================= */

export const reportAPI = {
  getSummary:
    async () => ({
      users: 0,
      tasks: 0,
      activeUsers: 0,
    }),

  getTimesheets:
    async () => [],
};

/* =========================================================
BILLING
========================================================= */

export const billingAPI = {
  checkout:
    async () => ({
      success: true,
    }),

  portal:
    async () => ({
      success: true,
    }),
};

/* =========================================================
LOGOUT
========================================================= */

export const logoutAPI =
  async () => {
    await supabase.auth.signOut();

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );
  };

export default supabase;