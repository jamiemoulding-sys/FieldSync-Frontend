// src/hooks/useAuth.js
// FINAL FULL FIXED VERSION
// Fixes blank white screen after idle/background tab
// Stable auth state + refresh on focus + safe loading

import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../lib/supabase";

/* =====================================================
GLOBAL STATE
===================================================== */

let authUserState = null;
let authLoadingState = true;
let initialized = false;
let subscribers = [];
let loadingPromise = null;
let authSubscription = null;
let visibilityBound = false;

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
FETCH PROFILE
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
      data: userRow,
      error: userError,
    } = await supabase
      .from("users")
      .select(`
        id,
        name,
        phone,
        role,
        company_id,
        job_title
      `)
      .eq("id", authUser.id)
      .single();

    if (userError) throw userError;

    let company = null;

    if (userRow.company_id) {
      const {
        data: companyRow,
      } = await supabase
        .from("companies")
        .select(`
          id,
          name,
          is_pro,
          current_plan,
          subscription_status
        `)
        .eq("id", userRow.company_id)
        .single();

      company = companyRow || null;
    }

    const profile = {
      id: authUser.id,
      email: authUser.email,

      name: userRow.name || "",
      phone: userRow.phone || "",
      role: userRow.role || "employee",

      companyId: userRow.company_id,
      companyName: company?.name || "",

      jobTitle: userRow.job_title || "",

      isPro: company?.is_pro || false,

      current_plan:
        company?.current_plan || "free",

      subscription_status:
        company?.subscription_status ||
        "free",
    };

    setGlobalUser(profile);

    return profile;
  } catch (err) {
    console.error(
      "fetchProfile failed:",
      err
    );

    setGlobalUser(null);
    return null;
  }
}

/* =====================================================
REFRESH SESSION
===================================================== */

async function refreshSession() {
  try {
    setGlobalLoading(true);

    await supabase.auth.refreshSession();

    await fetchProfile();
  } catch (err) {
    console.error(
      "refreshSession failed:",
      err
    );
  } finally {
    setGlobalLoading(false);
  }
}

/* =====================================================
INIT AUTH
===================================================== */

async function initAuth() {
  if (initialized) return;

  initialized = true;

  try {
    setGlobalLoading(true);

    await fetchProfile();
  } finally {
    setGlobalLoading(false);
  }

  /* AUTH LISTENER */
  const {
    data: { subscription },
  } =
    supabase.auth.onAuthStateChange(
      async (event) => {
        try {
          if (
            event === "SIGNED_OUT"
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
          }
        } catch (err) {
          console.error(err);
        } finally {
          setGlobalLoading(false);
        }
      }
    );

  authSubscription =
    subscription;

  /* TAB RETURN FIX */
  if (!visibilityBound) {
    visibilityBound = true;

    document.addEventListener(
      "visibilitychange",
      async () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          await refreshSession();
        }
      }
    );

    window.addEventListener(
      "focus",
      async () => {
        await refreshSession();
      }
    );
  }
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
      if (
        !mounted.current
      )
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
  RELOAD USER
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
            try {
              setGlobalLoading(
                true
              );

              return await fetchProfile();
            } finally {
              setGlobalLoading(
                false
              );

              loadingPromise =
                null;
            }
          })();

        return loadingPromise;
      },
      []
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
      [
        reloadUser,
        navigate,
      ]
    );

  /* =====================================================
  LOGOUT
  ===================================================== */

  const logout =
    useCallback(
      async () => {
        try {
          await supabase.auth.signOut();
        } finally {
          setGlobalUser(
            null
          );

          navigate(
            "/login"
          );
        }
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