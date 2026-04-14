// src/pages/Profile.js
// FINAL 100% PRODUCTION VERSION
// safer / faster / polished / copy-paste ready

import {
  useMemo,
  useState,
  useEffect,
} from "react";

import { useAuth } from "../hooks/useAuth";
import { motion } from "framer-motion";
import supabase from "../lib/supabase";

import {
  User,
  Phone,
  Building2,
  Briefcase,
  Mail,
  Shield,
  Crown,
  Save,
  LogOut,
  CheckCircle2,
  Camera,
  Clock3,
  Loader2,
} from "lucide-react";

export default function Profile() {
  const {
    user,
    reloadUser,
    logout,
  } = useAuth();

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [company, setCompany] =
    useState("");

  const [jobTitle, setJobTitle] =
    useState("");

  const [lastSignIn, setLastSignIn] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [success, setSuccess] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);

      const {
        data: authData,
      } =
        await supabase.auth.getUser();

      const authUser =
        authData?.user;

      if (!authUser) return;

      if (
        authUser.last_sign_in_at
      ) {
        setLastSignIn(
          new Date(
            authUser.last_sign_in_at
          ).toLocaleString()
        );
      }

      const {
        data,
        error,
      } = await supabase
        .from("users")
        .select(`
          name,
          phone,
          job_title,
          company_id,
          companies (
            name
          )
        `)
        .eq("id", authUser.id)
        .single();

      if (error) throw error;

      setName(data?.name || "");
      setPhone(data?.phone || "");
      setJobTitle(
        data?.job_title || ""
      );

      setCompany(
        data?.companies?.name ||
          ""
      );
    } catch (err) {
      console.error(err);
      setError(
        "Failed to load profile"
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    try {
      setSaving(true);
      setSuccess("");
      setError("");

      const {
        data: authData,
      } =
        await supabase.auth.getUser();

      const authUser =
        authData?.user;

      if (!authUser) {
        throw new Error(
          "Not logged in"
        );
      }

      const { error } =
        await supabase
          .from("users")
          .update({
            name:
              name.trim(),
            phone:
              phone.trim(),
            job_title:
              jobTitle.trim(),
          })
          .eq(
            "id",
            authUser.id
          );

      if (error) throw error;

      if (
        user?.companyId &&
        company.trim()
      ) {
        await supabase
          .from("companies")
          .update({
            name:
              company.trim(),
          })
          .eq(
            "id",
            user.companyId
          );
      }

      if (reloadUser) {
        await reloadUser();
      }

      setSuccess(
        "Profile updated successfully"
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to save profile"
      );
    } finally {
      setSaving(false);
    }
  }

  const profileScore =
    useMemo(() => {
      return (
        [
          name,
          phone,
          company,
          jobTitle,
        ].filter(
          (x) =>
            x &&
            x.trim()
        ).length * 25
      );
    }, [
      name,
      phone,
      company,
      jobTitle,
    ]);

  const initials = (
    name ||
    user?.email ||
    "U"
  )
    .charAt(0)
    .toUpperCase();

  if (loading) {
    return (
      <div className="text-gray-400 flex items-center gap-2">
        <Loader2
          size={16}
          className="animate-spin"
        />
        Loading profile...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* HERO */}
      <div className="rounded-3xl p-[1px] bg-gradient-to-r from-indigo-500/30 via-purple-500/20 to-transparent">
        <div className="bg-[#020617] border border-white/10 rounded-3xl p-6 md:p-8">

          <div className="flex justify-between gap-6 flex-wrap items-center">

            <div className="flex items-center gap-5">

              <div className="relative">

                <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-semibold">
                  {initials}
                </div>

                <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                  <Camera size={14} />
                </button>

              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-semibold">
                  {name ||
                    "Unnamed User"}
                </h1>

                <p className="text-gray-400 mt-1">
                  {user?.email}
                </p>

                <div className="flex gap-2 mt-3 flex-wrap">

                  <Badge
                    icon={
                      <Shield size={13} />
                    }
                    text={
                      user?.role?.toUpperCase() ||
                      "USER"
                    }
                  />

                  <Badge
                    icon={
                      <Crown size={13} />
                    }
                    text={
                      user?.isPro
                        ? "PRO"
                        : "FREE"
                    }
                  />

                </div>
              </div>

            </div>

            <div className="min-w-[240px]">

              <p className="text-sm text-gray-400">
                Profile Strength
              </p>

              <h2 className="text-4xl font-bold mt-2">
                {profileScore}%
              </h2>

              <div className="h-2 bg-white/5 rounded-full overflow-hidden mt-4">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{
                    width: `${profileScore}%`,
                  }}
                />
              </div>

              <p className="text-xs text-gray-500 mt-4 flex items-center gap-2">
                <Clock3 size={12} />
                Last Sign In:
                {" "}
                {lastSignIn || "-"}
              </p>

            </div>

          </div>

        </div>
      </div>

      {success && (
        <Alert
          green
          text={success}
        />
      )}

      {error && (
        <Alert
          red
          text={error}
        />
      )}

      {/* FORM */}
      <div className="grid md:grid-cols-2 gap-4">

        <Field
          icon={<User size={16} />}
          label="Full Name"
          value={name}
          onChange={setName}
          placeholder="Your full name"
        />

        <Field
          icon={<Phone size={16} />}
          label="Phone Number"
          value={phone}
          onChange={setPhone}
          placeholder="Phone number"
        />

        <Field
          icon={
            <Building2 size={16} />
          }
          label="Company Name"
          value={company}
          onChange={setCompany}
          placeholder="Company name"
        />

        <Field
          icon={
            <Briefcase size={16} />
          }
          label="Job Title"
          value={jobTitle}
          onChange={setJobTitle}
          placeholder="Owner / Manager / Staff"
        />

        <ReadOnly
          icon={<Mail size={16} />}
          label="Email"
          value={user?.email}
        />

        <ReadOnly
          icon={<Crown size={16} />}
          label="Plan"
          value={
            user?.isPro
              ? "Pro"
              : "Free"
          }
        />

      </div>

      {/* ACTIONS */}
      <div className="flex gap-3 flex-wrap">

        <button
          onClick={saveProfile}
          disabled={saving}
          className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium flex items-center gap-2"
        >
          {saving ? (
            <Loader2
              size={16}
              className="animate-spin"
            />
          ) : (
            <Save size={16} />
          )}

          {saving
            ? "Saving..."
            : "Save Changes"}
        </button>

        <button
          onClick={logout}
          className="px-5 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-medium flex items-center gap-2"
        >
          <LogOut size={16} />
          Sign Out
        </button>

      </div>

    </div>
  );
}

/* COMPONENTS */

function Field({
  icon,
  label,
  value,
  onChange,
  placeholder,
}) {
  return (
    <motion.div
      whileHover={{
        y: -3,
      }}
      className="rounded-2xl p-[1px] bg-gradient-to-b from-white/10 to-transparent"
    >
      <div className="bg-[#020617] border border-white/10 rounded-2xl p-4">

        <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
          {icon}
          {label}
        </div>

        <input
          value={value}
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
          placeholder={
            placeholder
          }
          className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
        />

      </div>
    </motion.div>
  );
}

function ReadOnly({
  icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
      <div className="bg-[#020617] border border-white/10 rounded-2xl p-4">

        <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
          {icon}
          {label}
        </div>

        <p className="text-white text-sm">
          {value || "-"}
        </p>

      </div>
    </div>
  );
}

function Badge({
  icon,
  text,
}) {
  return (
    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs flex items-center gap-2">
      {icon}
      {text}
    </div>
  );
}

function Alert({
  text,
  red,
  green,
}) {
  return (
    <div
      className={`rounded-2xl p-4 text-sm flex items-center gap-2 border ${
        red
          ? "bg-red-500/10 border-red-500/30 text-red-300"
          : "bg-green-500/10 border-green-500/30 text-green-300"
      }`}
    >
      <CheckCircle2 size={16} />
      {text}
    </div>
  );
}