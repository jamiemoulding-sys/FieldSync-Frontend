import React, { useState } from "react";
import { authAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";

function Login() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      return alert("Please enter email and password");
    }

    try {
      setLoading(true);

      const data = await authAPI.login({
        email,
        password,
      });

      console.log("LOGIN DATA:", data);

      if (!data?.token) {
        throw new Error("No token returned");
      }

      // ✅ Uses auth hook now
      login(data);

    } catch (err) {
      console.error("LOGIN ERROR:", err);

      const message =
        err?.response?.data?.error ||
        err?.message ||
        "Login failed";

      alert(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={container}>
      <form onSubmit={handleLogin} style={card}>
        <h2 style={title}>Welcome Back</h2>

        <p style={subtitle}>
          Sign in to continue
        </p>

        <input
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={input}
        />

        <input
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={input}
        />

        <button
          type="submit"
          style={button}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

      </form>
    </div>
  );
}

/* STYLES */

const container = {
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background:
    "linear-gradient(135deg,#0f172a,#111827,#1e1b4b)",
};

const card = {
  background: "#111827",
  padding: 35,
  borderRadius: 16,
  width: 340,
  display: "flex",
  flexDirection: "column",
  boxShadow:
    "0 20px 50px rgba(0,0,0,0.35)",
};

const title = {
  marginBottom: 5,
  color: "white",
};

const subtitle = {
  marginBottom: 20,
  color: "#9ca3af",
  fontSize: 14,
};

const input = {
  marginBottom: 12,
  padding: 12,
  borderRadius: 8,
  border: "1px solid #374151",
  background: "#1f2937",
  color: "white",
  outline: "none",
};

const button = {
  padding: 12,
  background: "#6366f1",
  border: "none",
  borderRadius: 8,
  color: "white",
  cursor: "pointer",
  fontWeight: "600",
};

export default Login;