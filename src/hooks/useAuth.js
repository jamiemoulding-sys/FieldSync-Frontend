import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));

        console.log('✅ TOKEN DECODED:', decoded);

        // ✅ FORCE USER TO BE PRO
        setUser({
          ...decoded,
          is_pro: true,
          isPro: true
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
  };

  // ✅ FORCE FULL ACCESS
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