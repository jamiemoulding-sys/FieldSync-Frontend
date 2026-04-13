import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../lib/supabase";
import api from "../services/api";

export default function SetPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user?.email) {
        setEmail(session.user.email);
      }
    };

    loadSession();
  }, []);

  const submit = async () => {
    try {
      if (!password || !confirm) {
        return alert("Fill all fields");
      }

      if (password.length < 6) {
        return alert("Password must be at least 6 characters");
      }

      if (password !== confirm) {
        return alert("Passwords do not match");
      }

      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      await api.post("/auth/set-password", {
        email,
        password,
      });

      alert("Account activated");
      navigate("/login");

    } catch (err) {
      alert(err?.message || "Failed to activate account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* your existing JSX stays same */}
    </div>
  );
}