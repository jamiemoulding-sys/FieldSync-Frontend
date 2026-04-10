import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = () => {
      const token = localStorage.getItem('token');

      if (!token || token === "undefined" || token === "null") {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const payload = token.split('.')[1];

        // 🔥 FIX: base64url decode
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(atob(base64));

        console.log('✅ TOKEN DECODED:', decoded);

        setUser({
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role || 'employee',
          companyId: decoded.companyId || null,

          // 💰 APP FLAGS
          isPro: true,
          is_pro: true
        });

      } catch (err) {
        console.error('❌ Token error:', err);
        localStorage.removeItem('token');
        setUser(null);
      }

      setLoading(false);
    };

    loadUser();
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = "/login";
  };

  // 🔒 OPTIONAL FLAGS
  const hasAccess = true;
  const isTrialActive = true;

  return {
    user,
    loading,
    logout,
    hasAccess,
    isTrialActive
  };
}