import React, { useState } from "react";
import { authAPI } from "../services/api";

function Login() {
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

      // ✅ CALL API (UNWRAPPED RESPONSE)
      const data = await authAPI.login({
        email,
        password,
      });

      console.log("LOGIN DATA:", data);

      // ✅ CORRECT TOKEN ACCESS
      const token = data?.token;

      if (!token) {
        console.error("BAD RESPONSE:", data);
        throw new Error("No token returned from backend");
      }

      // ✅ SAVE TOKEN
      localStorage.setItem("token", token);

      // ✅ SAVE USER (OPTIONAL BUT USEFUL)
      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // ✅ REDIRECT
      window.location.href = "/dashboard";

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
        <h2 style={{ marginBottom: 20 }}>Login</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={input}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={input}
        />

        <button type="submit" style={button} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

// 🎨 STYLES
const container = {
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#0f172a",
};

const card = {
  background: "#111827",
  padding: 30,
  borderRadius: 10,
  width: 300,
  display: "flex",
  flexDirection: "column",
};

const input = {
  marginBottom: 10,
  padding: 10,
  borderRadius: 6,
  border: "none",
  background: "#1f2937",
  color: "white",
};

const button = {
  padding: 10,
  background: "#6366f1",
  border: "none",
  borderRadius: 6,
  color: "white",
  cursor: "pointer",
};

export default Login;