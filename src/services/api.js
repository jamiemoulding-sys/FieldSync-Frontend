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
      token:
        data.session?.access_token,

      user: {
        id: authUser.id,
        email: authUser.email,
        name:
          profile?.name || "",
        phone:
          profile?.phone || "",
        role:
          profile?.role ||
          "employee",
        companyId:
          profile?.company_id ||
          null,
        companyName:
          profile?.company_name ||
          "",
        jobTitle:
          profile?.job_title ||
          "",
        isPro:
          profile?.is_pro ||
          false,
        is_pro:
          profile?.is_pro ||
          false,
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
          current_plan:
            "free",
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

    const authUser =
      data.user;

    if (!authUser) return null;

    const { data: profile } =
      await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

    return {
      id: authUser.id,
      email:
        authUser.email,
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
    return data;
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
          .select("*");

      if (error)
        throw error;

      return data;
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

      return data;
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
   SCHEDULE
========================================================= */

export const scheduleAPI = {
  getAll:
    async () => {
      const {
        data,
        error,
      } =
        await supabase
          .from("schedules")
          .select("*");

      if (error)
        throw error;

      return data;
    },

  getMine:
    async () => {
      const {
        data,
        error,
      } =
        await supabase
          .from("schedules")
          .select("*");

      if (error)
        throw error;

      return data;
    },

  create:
    async (row) => {
      const {
        data,
        error,
      } =
        await supabase
          .from("schedules")
          .insert(row)
          .select();

      if (error)
        throw error;

      return data;
    },

  update:
    async (id, row) => {
      const { error } =
        await supabase
          .from("schedules")
          .update(row)
          .eq("id", id);

      if (error)
        throw error;

      return true;
    },

  delete:
    async (id) => {
      const { error } =
        await supabase
          .from("schedules")
          .delete()
          .eq("id", id);

      if (error)
        throw error;

      return true;
    },

  getLate:
    async () => [],
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
   ANNOUNCEMENTS
========================================================= */

export const announcementAPI = {
  getAll:
    async () => {
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

      if (error)
        throw error;

      return data;
    },

  create:
    async (row) => {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "announcements"
          )
          .insert(row)
          .select();

      if (error)
        throw error;

      return data;
    },

  delete:
    async (id) => {
      const { error } =
        await supabase
          .from(
            "announcements"
          )
          .delete()
          .eq("id", id);

      if (error)
        throw error;

      return true;
    },
};

/* =========================================================
   REPORTS
========================================================= */

export const reportAPI = {
  getSummary:
    async () => ({
      users: 0,
      tasks: 0,
    }),

  getTimesheets:
    async () => [],
};

/* =========================================================
   PERFORMANCE
========================================================= */

export const performanceAPI = {
  getAll:
    async () => [],
};

/* =========================================================
   MANAGER DASHBOARD
========================================================= */

export const managerAPI = {
  getDashboard:
    async () => {
      const {
        count:
          totalUsers,
      } =
        await supabase
          .from("users")
          .select("*", {
            count:
              "exact",
            head: true,
          });

      const {
        count:
          totalTasks,
      } =
        await supabase
          .from("tasks")
          .select("*", {
            count:
              "exact",
            head: true,
          });

      return {
        totalUsers:
          totalUsers || 0,
        tasks:
          totalTasks || 0,
        late: 0,
      };
    },
};

/* =========================================================
   SHIFTS
========================================================= */

export const shiftAPI = {
  getActive:
    async () => [],

  getAllActive:
    async () => [],

  clockIn:
    async () => true,

  clockOut:
    async () => true,

  getHistory:
    async () => [],

  updateLocation:
    async () => true,
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