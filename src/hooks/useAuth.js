// src/hooks/useAuth.js
// FINAL MERGED VERSION
// keeps EVERYTHING + merges trial fixes
// ✅ no removals
// ✅ reports unlock during trial
// ✅ billing works
// ✅ stable auth
// ✅ session restore
// ✅ refresh on focus
// ✅ premium access helper

import {
  useState,
  useEffect,
  useCallback,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import supabase from "../lib/supabase";

let globalUser = null;
let globalLoading = true;
let listeners = [];
let started = false;

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

  /* ===============================
     TRIAL / BILLING LOGIC
  =============================== */

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

  const paid =
    company?.is_pro ===
      true ||
    company?.subscription_status ===
      "active" ||
    row?.subscription_status ===
      "active";

  const hasPremiumAccess =
    paid || trialActive;

  /* ===============================
     FINAL USER OBJECT
  =============================== */

  setUser({
    id: authUser.id,
    email:
      authUser.email,

    name:
      row.name || "",

    role:
      row.role ||
      "employee",

    companyId:
      row.company_id,

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

    /* trial */
    trial_end:
      trialEnd,

    trialActive,

    /* access */
    hasPremiumAccess,

    /* optional extras */
    company,
    profile: row,
  });
}

async function init() {
  if (started) return;

  started = true;

  setLoading(true);

  try {
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

  supabase.auth.onAuthStateChange(
    async () => {
      await loadProfile();
    }
  );

  window.addEventListener(
    "focus",
    async () => {
      await loadProfile();
    }
  );
}

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

  const logout =
    useCallback(
      async () => {
        await supabase.auth.signOut();

        setUser(null);

        navigate(
          "/login"
        );
      },
      [navigate]
    );

  const reloadUser =
    useCallback(
      async () => {
        await loadProfile();
      },
      []
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

    trialActive:
      user?.trialActive,

    hasPremiumAccess:
      user?.hasPremiumAccess,
  };
}

export default useAuth;