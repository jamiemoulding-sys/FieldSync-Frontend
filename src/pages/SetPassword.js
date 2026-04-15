import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../lib/supabase";
import api from "../services/api";

export default function SetPassword() {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirm, setConfirm] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [ready, setReady] =
    useState(false);

  useEffect(() => {
    loadInvite();
  }, []);

  async function loadInvite() {
    try {
      /* HANDLE TOKEN FROM INVITE URL */
      const hash =
        window.location.hash;

      if (
        hash.includes(
          "access_token"
        )
      ) {
        const params =
          new URLSearchParams(
            hash.replace("#", "")
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

      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (
        !session?.user
      ) {
        navigate("/login");
        return;
      }

      setEmail(
        session.user.email ||
          ""
      );

      setReady(true);
    } catch {
      navigate("/login");
    }
  }

  async function submit(e) {
    e.preventDefault();

    if (
      !password ||
      !confirm
    ) {
      return alert(
        "Fill all fields"
      );
    }

    if (
      password.length < 6
    ) {
      return alert(
        "Password must be at least 6 characters"
      );
    }

    if (
      password !== confirm
    ) {
      return alert(
        "Passwords do not match"
      );
    }

    try {
      setLoading(true);

      const { error } =
        await supabase.auth.updateUser(
          {
            password,
          }
        );

      if (error)
        throw error;

      await api.post(
        "/auth/set-password",
        {
          email,
        }
      );

      alert(
        "Account activated"
      );

      navigate("/login");
    } catch (err) {
      alert(
        err?.message ||
          "Failed to activate account"
      );
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center">
        Loading invite...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl bg-[#0f172a] p-8 space-y-4"
      >
        <h1 className="text-2xl font-semibold">
          Set Password
        </h1>

        <p className="text-sm text-gray-400">
          {email}
        </p>

        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          className="w-full px-4 py-3 rounded-xl bg-white/5"
        />

        <input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) =>
            setConfirm(
              e.target.value
            )
          }
          className="w-full px-4 py-3 rounded-xl bg-white/5"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-indigo-600"
        >
          {loading
            ? "Saving..."
            : "Activate Account"}
        </button>
      </form>
    </div>
  );
}