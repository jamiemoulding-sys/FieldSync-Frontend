import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default function SetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSetPassword = async () => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      alert("Password set successfully");
      navigate("/login");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white px-6">
      <div className="w-full max-w-md bg-white/5 p-8 rounded-2xl border border-white/10">
        <h1 className="text-3xl font-semibold mb-6">
          Set Your Password
        </h1>

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 rounded-xl bg-white/10 mb-4"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <button
          onClick={handleSetPassword}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-indigo-600"
        >
          {loading
            ? "Saving..."
            : "Activate Account"}
        </button>
      </div>
    </div>
  );
}