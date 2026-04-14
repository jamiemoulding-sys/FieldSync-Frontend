import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import supabase from "../lib/supabase";

/* =====================================================
GLOBAL SINGLETON STATE
Prevents multiple hook instances causing lock errors
===================================================== */

let authUserState = null;
let authLoadingState = true;
let subscribers = [];
let initialized = false;
let authListener = null;
let loadingPromise = null;

/* =====================================================
HELPERS
===================================================== */

function emit() {
  subscribers.forEach((fn) =>
    fn({
      user: authUserState,
      loading: authLoadingState,
    })
  );
}

function setGlobalUser(user) {
  authUserState = user;
  emit();
}

function setGlobalLoading(value) {
  authLoadingState = value;
  emit();
}

/* =====================================================
LOAD PROFILE
===================================================== */

async function fetchProfile() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setGlobalUser(null);
      return null;
    }

    const authUser = session.user;

    const {
      data,
      error,
    } = await supabase
      .from("users")
      .select(`
        *,
        companies (
          id,
          name,
          is_pro,
          current_plan,
          subscription_status
        )
      `)
      .eq("id", authUser.id)
      .single();

    if (error) throw error;

    const profile = {
      id: authUser.id,
      email: authUser.email,

      name:
        data.name || "",

      phone:
        data.phone || "",

      role:
        data.role ||
        "employee",

      companyId:
        data.company_id,

      companyName:
        data.companies?.name ||
        "",

      jobTitle:
        data.job_title ||
        "",

      isPro:
        data.companies?.is_pro ||
        false,

      current_plan:
        data.companies
          ?.current_plan ||
        "free",

      subscription_status:
        data.companies
          ?.subscription_status ||
        "free",
    };

    setGlobalUser(profile);

    return profile;
  } catch (err) {
    console.error(err);
    setGlobalUser(null);
    return null;
  }
}

/* =====================================================
INIT ONCE ONLY
===================================================== */

async function initAuth() {
  if (initialized) return;

  initialized = true;

  setGlobalLoading(true);

  await fetchProfile();

  authListener =
    supabase.auth.onAuthStateChange(
      async (event) => {
        if (
          event ===
          "SIGNED_OUT"
        ) {
          setGlobalUser(null);
          setGlobalLoading(false);
          return;
        }

        if (
          event ===
            "SIGNED_IN" ||
          event ===
            "TOKEN_REFRESHED" ||
          event ===
            "USER_UPDATED"
        ) {
          setGlobalLoading(true);
          await fetchProfile();
          setGlobalLoading(false);
        }
      }
    );

  setGlobalLoading(false);
}

/* =====================================================
HOOK
===================================================== */

export function useAuth() {
  const navigate =
    useNavigate();

  const mounted =
    useRef(true);

  const [user, setUser] =
    useState(authUserState);

  const [loading, setLoading] =
    useState(authLoadingState);

  useEffect(() => {
    mounted.current = true;

    const sub = (state) => {
      if (!mounted.current)
        return;

      setUser(state.user);
      setLoading(
        state.loading
      );
    };

    subscribers.push(sub);

    if (!initialized) {
      initAuth();
    }

    return () => {
      mounted.current =
        false;

      subscribers =
        subscribers.filter(
          (x) => x !== sub
        );
    };
  }, []);

  /* =====================================================
  SAFE RELOAD
  Prevent duplicate parallel requests
  ===================================================== */

  const reloadUser =
    useCallback(
      async () => {
        if (
          loadingPromise
        ) {
          return loadingPromise;
        }

        loadingPromise =
          (async () => {
            setGlobalLoading(
              true
            );

            const profile =
              await fetchProfile();

            setGlobalLoading(
              false
            );

            loadingPromise =
              null;

            return profile;
          })();

        return loadingPromise;
      },
      []
    );

  /* =====================================================
  ROUTE USER
  ===================================================== */

  const routeUser =
    useCallback(
      (profile) => {
        if (!profile) {
          navigate(
            "/login"
          );
          return;
        }

        navigate(
          "/dashboard"
        );
      },
      [navigate]
    );

  /* =====================================================
  LOGIN
  ===================================================== */

  const login =
    useCallback(
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

        const profile =
          await reloadUser();

        routeUser(
          profile
        );
      },
      [
        reloadUser,
        routeUser,
      ]
    );

  /* =====================================================
  LOGOUT
  ===================================================== */

  const logout =
    useCallback(
      async () => {
        await supabase.auth.signOut();

        setGlobalUser(
          null
        );

        navigate(
          "/login"
        );
      },
      [navigate]
    );

  return {
    user,
    loading,
    login,
    logout,
    reloadUser,

    isAdmin:
      user?.role ===
      "admin",

    isManager:
      user?.role ===
        "manager" ||
      user?.role ===
        "admin",

    isPaid:
      user?.isPro,
  };
}