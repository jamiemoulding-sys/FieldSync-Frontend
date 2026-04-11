import {
  useState,
  useEffect,
  useCallback,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import api from "../services/api";

export function useAuth() {
  const navigate =
    useNavigate();

  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  /* =========================
     TOKEN DECODE
  ========================= */

  const decodeToken = (
    token
  ) => {
    try {
      const payload =
        token.split(".")[1];

      const base64 =
        payload
          .replace(
            /-/g,
            "+"
          )
          .replace(
            /_/g,
            "/"
          );

      return JSON.parse(
        atob(base64)
      );
    } catch {
      return null;
    }
  };

  /* =========================
     NORMALISE USER
  ========================= */

  const formatUser = (
    raw = {}
  ) => {
    const paid =
      raw.is_pro ||
      raw.isPro ||
      raw.subscription_status ===
        "active" ||
      raw.subscription_status ===
        "trialing" ||
      !!raw.current_plan;

    return {
      id: raw.id,
      email:
        raw.email || "",
      name:
        raw.name || "",
      phone:
        raw.phone || "",
      role:
        raw.role ||
        "employee",

      companyId:
        raw.companyId ||
        raw.company_id ||
        null,

      companyName:
        raw.companyName ||
        raw.company_name ||
        "",

      jobTitle:
        raw.jobTitle ||
        raw.job_title ||
        "",

      isPro: paid,
      is_pro: paid,

      current_plan:
        raw.current_plan ||
        null,

      subscription_status:
        raw.subscription_status ||
        "free",
    };
  };

  /* =========================
     LOAD USER
  ========================= */

  const loadUser =
    useCallback(
      async () => {
        try {
          setLoading(true);

          const token =
            localStorage.getItem(
              "token"
            );

          if (
            !token ||
            token ===
              "undefined" ||
            token ===
              "null"
          ) {
            setUser(null);
            return;
          }

          /* LIVE API */
          try {
            const res =
              await api.get(
                "/auth/me"
              );

            const liveUser =
              formatUser(
                res.data
              );

            localStorage.setItem(
              "user",
              JSON.stringify(
                liveUser
              )
            );

            setUser(
              liveUser
            );

            return;
          } catch {
            /* fallback */
          }

          /* SAVED USER */
          const saved =
            localStorage.getItem(
              "user"
            );

          if (
            saved &&
            saved !==
              "undefined" &&
            saved !==
              "null"
          ) {
            const parsed =
              formatUser(
                JSON.parse(
                  saved
                )
              );

            setUser(
              parsed
            );

            return;
          }

          /* TOKEN FALLBACK */
          const decoded =
            decodeToken(
              token
            );

          if (!decoded) {
            throw new Error(
              "Invalid token"
            );
          }

          const tokenUser =
            formatUser(
              decoded
            );

          localStorage.setItem(
            "user",
            JSON.stringify(
              tokenUser
            )
          );

          setUser(
            tokenUser
          );

        } catch (err) {
          console.error(
            "AUTH ERROR:",
            err
          );

          localStorage.removeItem(
            "token"
          );

          localStorage.removeItem(
            "user"
          );

          setUser(null);

        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  /* =========================
     LOGIN
  ========================= */

  const login = async (
    data
  ) => {
    if (!data?.token)
      return;

    localStorage.setItem(
      "token",
      data.token
    );

    if (data.user) {
      const fresh =
        formatUser(
          data.user
        );

      localStorage.setItem(
        "user",
        JSON.stringify(
          fresh
        )
      );

      setUser(fresh);
    }

    await loadUser();

    navigate(
      "/dashboard"
    );
  };

  /* =========================
     UPDATE USER
  ========================= */

  const updateUser = (
    data
  ) => {
    setUser(
      (prev) => {
        const updated =
          formatUser({
            ...prev,
            ...data,
          });

        localStorage.setItem(
          "user",
          JSON.stringify(
            updated
          )
        );

        return updated;
      }
    );
  };

  /* =========================
     REFRESH AFTER BILLING
  ========================= */

  const refreshSubscription =
    async () => {
      await loadUser();
    };

  /* =========================
     LOGOUT
  ========================= */

  const logout = () => {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    setUser(null);

    navigate(
      "/login"
    );
  };

  return {
    user,
    loading,

    login,
    logout,

    updateUser,
    reloadUser:
      loadUser,

    refreshSubscription,

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