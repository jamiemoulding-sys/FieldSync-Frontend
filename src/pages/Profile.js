import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import { motion } from "framer-motion";

export default function Profile() {
  const { user, updateUser, logout } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    try {
      setSaving(true);

      const res = await api.put("/auth/me", {
        name,
        phone,
      });

      updateUser(res.data);

      alert("Profile updated");

    } catch (err) {
      console.error(err);
      alert("Failed to save profile");

    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">
          My Profile
        </h1>

        <p className="text-gray-400 text-sm">
          Manage your account settings
        </p>
      </div>

      {/* PROFILE CARD */}
      <div className="rounded-2xl p-[1px] bg-gradient-to-b from-indigo-500/20 to-transparent">

        <div className="bg-[#020617] border border-white/10 rounded-2xl p-6">

          <div className="flex items-center gap-4">

            {/* AVATAR */}
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl font-semibold">
              {(name || user?.email || "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            {/* INFO */}
            <div>
              <p className="text-lg font-medium">
                {name || "Unnamed User"}
              </p>

              <p className="text-sm text-gray-400">
                {user?.email}
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* FORM */}
      <div className="grid md:grid-cols-2 gap-4">

        <Field
          label="Full Name"
          value={name}
          onChange={setName}
          placeholder="Your full name"
        />

        <Field
          label="Phone Number"
          value={phone}
          onChange={setPhone}
          placeholder="Phone number"
        />

        <ReadOnly
          label="Email"
          value={user?.email}
        />

        <ReadOnly
          label="Role"
          value={user?.role}
        />

        <ReadOnly
          label="Plan"
          value={user?.isPro ? "Pro" : "Trial"}
        />

      </div>

      {/* ACTIONS */}
      <div className="flex gap-3">

        <button
          onClick={saveProfile}
          disabled={saving}
          className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        <button
          onClick={logout}
          className="px-5 py-3 rounded-xl bg-red-500 hover:bg-red-600 transition"
        >
          Sign Out
        </button>

      </div>

    </div>
  );
}

/* COMPONENTS */

function Field({
  label,
  value,
  onChange,
  placeholder,
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-2xl p-[1px] bg-gradient-to-b from-white/10 to-transparent"
    >
      <div className="bg-[#020617] border border-white/10 rounded-2xl p-4">

        <p className="text-gray-400 text-xs mb-2">
          {label}
        </p>

        <input
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          placeholder={placeholder}
          className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
        />

      </div>
    </motion.div>
  );
}

function ReadOnly({ label, value }) {
  return (
    <div className="rounded-2xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
      <div className="bg-[#020617] border border-white/10 rounded-2xl p-4">

        <p className="text-gray-400 text-xs mb-2">
          {label}
        </p>

        <p className="text-sm">
          {value || "-"}
        </p>

      </div>
    </div>
  );
}