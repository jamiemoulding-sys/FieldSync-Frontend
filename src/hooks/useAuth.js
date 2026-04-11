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
     LOAD USER FROM API
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
            token === "null"
          ) {
            setUser(null);
            return;
          }

          /* TRY LIVE API FIRST */
          try {
            const res =
              await api.get(
                "/auth/me"
              );

            const liveUser =
              res.data;

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
            /* fallback below */
          }

          /* FALLBACK SAVED USER */
          const savedUser =
            localStorage.getItem(
              "user"
            );

          if (
            savedUser &&
            savedUser !==
              "undefined" &&
            savedUser !==
              "null"
          ) {
            const parsed =
              JSON.parse(
                savedUser
              );

            setUser(
              parsed
            );

            return;
          }

          /* FALLBACK TOKEN */
          const decoded =
            decodeToken(
              token
            );

          if (!decoded) {
            throw new Error(
              "Invalid token"
            );
          }

          const userData = {
            id:
              decoded.id,
            email:
              decoded.email,
            name:
              decoded.name ||
              "",
            phone:
              decoded.phone ||
              "",
            companyName:
              decoded.companyName ||
              "",
            jobTitle:
              decoded.jobTitle ||
              "",
            role:
              decoded.role ||
              "employee",
            companyId:
              decoded.companyId ||
              null,

            isPro:
              decoded.isPro ||
              false,

            is_pro:
              decoded.is_pro ||
              false,

            current_plan:
              decoded.current_plan ||
              null,

            subscription_status:
              decoded.subscription_status ||
              null,
          };

          localStorage.setItem(
            "user",
            JSON.stringify(
              userData
            )
          );

          setUser(
            userData
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

  const login = (
    data
  ) => {
    if (!data?.token)
      return;

    localStorage.setItem(
      "token",
      data.token
    );

    if (data.user) {
      localStorage.setItem(
        "user",
        JSON.stringify(
          data.user
        )
      );

      setUser(
        data.user
      );
    } else {
      loadUser();
    }

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
          {
            ...prev,
            ...data,
          };

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
  };
}