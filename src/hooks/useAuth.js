import { useState, useEffect } from "react";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = () => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || token === "undefined" || token === "null") {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // ✅ PRIORITY = saved user object
      if (savedUser) {
        const parsed = JSON.parse(savedUser);

        setUser(parsed);
        setLoading(false);
        return;
      }

      // fallback to token decode
      const payload = token.split(".")[1];

      const base64 = payload
        .replace(/-/g, "+")
        .replace(/_/g, "/");

      const decoded = JSON.parse(atob(base64));

      setUser({
        id: decoded.id,
        email: decoded.email,
        name: decoded.name || "User",
        role: decoded.role || "employee",
        companyId: decoded.companyId || null,
        isPro: decoded.isPro || false,
      });

    } catch (err) {
      console.error("❌ Auth error:", err);

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setUser(null);
    }

    setLoading(false);
  };

  const login = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem(
      "user",
      JSON.stringify(data.user)
    );

    setUser(data.user);

    window.location.href = "/";
  };

  const updateUser = (data) => {
    localStorage.setItem(
      "user",
      JSON.stringify(data)
    );

    setUser(data);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);

    window.location.href = "/login";
  };

  return {
    user,
    loading,
    login,
    logout,
    updateUser,
  };
}