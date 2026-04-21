// src/hooks/useAuth.js
// FINAL FIXED VERSION
// ✅ Keeps everything
// ✅ Fixes billing redirect lock
// ✅ Fixes Starter / Pro / Business recognition
// ✅ Stripe refresh safe
// ✅ Trial support
// ✅ Better currentPlan handling
// ✅ Copy / paste ready

import {
  useState,
  useEffect,
  useCallback,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import supabase from "../lib/supabase";

/* ===================================================== */

let globalUser = null;
let globalLoading = true;
let listeners = [];
let started = false;

/* ===================================================== */

function emit() {
  listeners.forEach((fn) =>
    fn({
      user: globalUser,
      loading: globalLoading,
    })
  );
}

function setUser(user) {
  globalUser = user;
  emit();
}

function setLoading(v) {
  globalLoading = v;
  emit();
}

/* ===================================================== */

async function loadProfile() {
  const {
    data: { session },
  } =
    await supabase.auth.getSession();

  if (!session?.user) {
    setUser(null);
    return;
  }

  const authUser =
    session.user;

  /* USER PROFILE */

  const {
    data: row,
    error: rowError,
  } =
    await supabase
      .from("users")
      .select("*")
      .eq(
        "id",
        authUser.id
      )
      .single();

  if (rowError || !row) {
    setUser(null);
    return;
  }

  /* COMPANY */

  let company = null;

  if (row.company_id) {
    const {
      data,
    } =
      await supabase
        .from("companies")
        .select("*")
        .eq(
          "id",
          row.company_id
        )
        .single();

    company = data;
  }

  /* =====================================================
     TRIAL LOGIC
  ===================================================== */

  const trialEnd =
    company?.trial_ends_at ||
    company?.trial_end ||
    row?.trial_ends_at ||
    row?.trial_end ||
    null;

  const trialActive =
    !!trialEnd &&
    new Date(trialEnd) >
      new Date();

  /* =====================================================
     PAID STATUS
  ===================================================== */

  const paid =
    company?.subscription_status ===
      "active" ||
    row?.subscription_status ===
      "active" ||
    company?.is_pro === true ||
    row?.is_pro === true;

  const hasPremiumAccess =
    paid || trialActive;

  /* =====================================================
     PLAN FIX
  ===================================================== */

  const currentPlan =
    company?.current_plan ||
    row?.current_plan ||
    company?.plan ||
    row?.plan ||
    (paid
      ? "starter"
      : "starter");

  /* =====================================================
     FINAL USER
  ===================================================== */

  setUser({
    id: authUser.id,

    email:
      authUser.email,

    name:
      row?.name || "",

    role:
      row?.role ||
      "employee",

    companyId:
      row?.company_id,

    companyName:
      company?.name ||
      "",

    /* billing */

    isPro: paid,

    subscription_status:
      company?.subscription_status ||
      row?.subscription_status ||
      (trialActive
        ? "trial"
        : "inactive"),

    /* plan */

    currentPlan,

    /* trial */

    trial_end:
      trialEnd,

    trialActive,

    /* access */

    hasPremiumAccess,

    /* extras */

    company,
    profile: row,
  });
}

/* ===================================================== */

async function init() {
  if (started) return;

  started = true;

  setLoading(true);

  try {
    /* MAGIC LINK HASH SUPPORT */

    const hash =
      window.location.hash;

    if (
      hash.includes(
        "access_token"
      )
    ) {
      const params =
        new URLSearchParams(
          hash.replace(
            "#",
            ""
          )
        );

      const access_token =
        params.get(
          "access_token"
        );

      const refresh_token =
        params.get(
          "refresh_token"
        );

      if (
        access_token &&
        refresh_token
      ) {
        await supabase.auth.setSession(
          {
            access_token,
            refresh_token,
          }
        );
      }
    }

    await loadProfile();
  } finally {
    setLoading(false);
  }

  /* AUTH CHANGES */

  supabase.auth.onAuthStateChange(
    async () => {
      await loadProfile();
    }
  );

  /* TAB FOCUS REFRESH */

  window.addEventListener(
    "focus",
    async () => {
      await loadProfile();
    }
  );

  /* PAGE VISIBILITY REFRESH */

  document.addEventListener(
    "visibilitychange",
    async () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        await loadProfile();
      }
    }
  );
}

/* ===================================================== */

export function useAuth() {
  const navigate =
    useNavigate();

  const [user, setLocalUser] =
    useState(globalUser);

  const [
    loading,
    setLocalLoading,
  ] = useState(
    globalLoading
  );

  useEffect(() => {
    const sub = (
      state
    ) => {
      setLocalUser(
        state.user
      );

      setLocalLoading(
        state.loading
      );
    };

    listeners.push(sub);

    init();

    return () => {
      listeners =
        listeners.filter(
          (x) =>
            x !== sub
        );
    };
  }, []);

  /* ===================================================== */

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

        await loadProfile();

        navigate(
          "/dashboard"
        );
      },
      [navigate]
    );

const logout = useCallback(async () => {
  try {
    await supabase.auth.signOut({
      scope: "global",
    });
  } catch (err) {
    console.error(err);
  }

  globalUser = null;
  globalLoading = false;
  emit();

  localStorage.clear();
  sessionStorage.clear();

  window.location.replace("/login");
}, []);

  /* ===================================================== */

    const reloadUser =
          useCallback(async () => {
          await loadProfile();
  }, []);

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

    trialActive:
      user?.trialActive,

    hasPremiumAccess:
      user?.hasPremiumAccess,

    /* PLAN HELPERS */

    plan:
      user?.currentPlan ||
      "starter",

    isStarter:
      user?.currentPlan ===
      "starter",

    isProPlan:
      user?.currentPlan ===
      "pro",

    isBusiness:
      user?.currentPlan ===
      "business",
  };
}

export default useAuth;