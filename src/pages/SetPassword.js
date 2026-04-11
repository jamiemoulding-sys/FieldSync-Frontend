import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default function SetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  /* 🔥 READ INVITE TOKEN */
  useEffect(() => {
    const hash = window.location.hash;

    if (hash) {
      supabase.auth.getSession();
    }
  }, []);

  const submit = async () => {
    try {
      if (password !== confirm) {
        return alert("Passwords do not match");
      }

      setLoading(true);

      const { error } =
        await supabase.auth.updateUser({
          password,
        });

      if (error) throw error;

      alert("Account activated");

      navigate("/login");

    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8">

        <h1 className="text-3xl font-semibold text-center mb-6">
          Set Password
        </h1>

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          className="w-full p-3 rounded-xl bg-white/10 mb-4"
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirm}
          onChange={(e)=>setConfirm(e.target.value)}
          className="w-full p-3 rounded-xl bg-white/10 mb-6"
        />

        <button
          onClick={submit}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-indigo-600"
        >
          {loading ? "Saving..." : "Activate Account"}
        </button>

      </div>
    </div>
  );
}