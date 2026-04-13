/* =========================================================
   src/hooks/useAuth.js
   FULL PERMANENT FIX
   Uses shared Supabase client only
========================================================= */

import {
  useState,
  useEffect,
  useCallback,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import supabase from "../lib/supabase";

export function useAuth() {
  const navigate =
    useNavigate();

  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  /* =====================================
     FORMAT USER
  ===================================== */

  const formatUser = (
    authUser,
    profile = {}
  ) => {
    return {
      id: authUser.id,

      email:
        authUser.email || "",

      name:
        profile.name ||
        authUser.user_metadata
          ?.name ||
        "",

      phone:
        profile.phone || "",

      role:
        profile.role ||
        "employee",

      companyId:
        profile.company_id ||
        null,

      company_id:
        profile.company_id ||
        null,

      companyName:
        profile.company_name ||
        "",

      jobTitle:
        profile.job_title ||
        "",

      isPro:
        profile.is_pro ||
        false,

      is_pro:
        profile.is_pro ||
        false,

      current_plan:
        profile.current_plan ||
        "free",

      subscription_status:
        profile.subscription_status ||
        "free",
    };
  };

  /* =====================================
     LOAD USER
  ===================================== */

  const loadUser =
    useCallback(
      async () => {
        try {
          setLoading(true);

          const {
            data: {
              session,
            },
          } =
            await supabase.auth.getSession();

          if (
            !session?.user
          ) {
            setUser(null);
            return;
          }

          const authUser =
            session.user;

          const {
            data: profile,
            error,
          } =
            await supabase
              .from("users")
              .select("*")
              .eq(
                "id",
                authUser.id
              )
              .maybeSingle();

          if (error) {
            console.error(
              "PROFILE ERROR:",
              error
            );
          }

          const finalUser =
            formatUser(
              authUser,
              profile || {}
            );

          setUser(
            finalUser
          );
        } catch (err) {
          console.error(
            "AUTH LOAD ERROR:",
            err
          );

          setUser(null);
        } finally {
          setLoading(false);
        }
      },
      []
    );

  /* =====================================
     AUTH LISTENER
  ===================================== */

  useEffect(() => {
    loadUser();

    const {
      data:
        listener,
    } =
      supabase.auth.onAuthStateChange(
        (
          event
        ) => {
          if (
            event ===
              "SIGNED_IN" ||
            event ===
              "TOKEN_REFRESHED"
          ) {
            loadUser();
          }

          if (
            event ===
            "SIGNED_OUT"
          ) {
            setUser(null);
          }
        }
      );

    return () => {
      listener
        ?.subscription
        ?.unsubscribe();
    };
  }, [loadUser]);

  /* =====================================
     LOGIN
  ===================================== */

  const login =
    async (
      email,
      password
    ) => {
      const {
        error,
      } =
        await supabase.auth.signInWithPassword(
          {
            email,
            password,
          }
        );

      if (error)
        throw error;

      await loadUser();

      navigate(
        "/dashboard"
      );
    };

  /* =====================================
     SIGNUP
  ===================================== */

  const signup =
    async ({
      email,
      password,
      name,
    }) => {
      const {
        error,
      } =
        await supabase.auth.signUp(
          {
            email,
            password,
            options: {
              data: {
                name,
              },
            },
          }
        );

      if (error)
        throw error;

      navigate(
        "/login"
      );
    };

  /* =====================================
     LOGOUT
  ===================================== */

  const logout =
    async () => {
      await supabase.auth.signOut();

      setUser(null);

      navigate(
        "/login"
      );
    };

  /* =====================================
     UPDATE USER
  ===================================== */

  const updateUser =
    async (
      updates
    ) => {
      if (!user)
        return;

      const {
        error,
      } =
        await supabase
          .from("users")
          .update(
            updates
          )
          .eq(
            "id",
            user.id
          );

      if (error)
        throw error;

      await loadUser();
    };

  return {
    user,
    loading,

    login,
    signup,
    logout,

    updateUser,
    reloadUser:
      loadUser,

    isAdmin:
      user?.role ===
      "admin",

    isManager:
      user?.role ===
        "manager" ||
      user?.role ===
        "admin",

    isEmployee:
      user?.role ===
      "employee",

    isPaid:
      user?.isPro,

    currentPlan:
      user?.current_plan,

    subscriptionStatus:
      user?.subscription_status,
  };
}