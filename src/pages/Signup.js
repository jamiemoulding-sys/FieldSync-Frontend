/* =========================================================
src/pages/Signup.js
LAUNCH READY PRO VERSION

UPGRADES INCLUDED
✅ Better validation
✅ Strong password rules
✅ Prevent duplicate submits
✅ Cleaner error handling
✅ Email verification friendly
✅ Auto lowercase email
✅ Better conversion UI
✅ Faster signup flow
✅ Mobile polished
========================================================= */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import supabase from "../lib/supabase";

import {
  Mail,
  Lock,
  Building2,
  ArrowRight,
  Loader2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
  });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]:
        e.target.value,
    });
  }

  function validPassword(pw) {
    return (
      pw.length >= 8 &&
      /[A-Z]/.test(pw) &&
      /[0-9]/.test(pw)
    );
  }

  async function handleSignup(e) {
    e.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    const email =
      form.email
        .trim()
        .toLowerCase();

    const company =
      form.companyName.trim();

    if (
      !email ||
      !form.password ||
      !form.confirmPassword ||
      !company
    ) {
      return setError(
        "Please fill all fields"
      );
    }

    if (
      !validPassword(
        form.password
      )
    ) {
      return setError(
        "Password must be 8+ chars, include 1 capital letter and 1 number"
      );
    }

    if (
      form.password !==
      form.confirmPassword
    ) {
      return setError(
        "Passwords do not match"
      );
    }

    try {
      setLoading(true);

      /* CREATE AUTH USER */
      const {
        data,
        error,
      } =
        await supabase.auth.signUp(
          {
            email,
            password:
              form.password,
            options: {
              emailRedirectTo:
                window.location.origin +
                "/login",
            },
          }
        );

      if (error) throw error;

      const authUser =
        data?.user;

      if (!authUser) {
        throw new Error(
          "Could not create account"
        );
      }

      /* CREATE COMPANY */
      const {
        data: companyRow,
        error:
          companyError,
      } =
        await supabase
          .from("companies")
          .insert({
            name: company,
            owner_id:
              authUser.id,
            is_pro: false,
            current_plan:
              "free",
            subscription_status:
              "free",
          })
          .select()
          .single();

      if (companyError)
        throw companyError;

      /* CREATE USER PROFILE */
      const {
        error:
          profileError,
      } =
        await supabase
          .from("users")
          .insert({
            id: authUser.id,
            email,
            name: "Owner",
            phone: "",
            role: "admin",
            company_id:
              companyRow.id,
            job_title:
              "Owner",
          });

      if (profileError)
        throw profileError;

      setSuccess(
        "Workspace created successfully."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(
        err?.message ||
          "Signup failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center px-6 relative overflow-hidden">

      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-cyan-500/10" />

      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="relative z-10 w-full max-w-md rounded-3xl p-[1px] bg-gradient-to-b from-white/15 to-transparent"
      >
        <div className="bg-[#020617]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-8">

          <div className="text-center mb-8">

            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto mb-5">
              <Sparkles size={28} />
            </div>

            <h1 className="text-3xl font-semibold">
              Create Workspace
            </h1>

            <p className="text-sm text-gray-400 mt-2">
              Launch your team on
              FieldSync
            </p>

          </div>

          {error && (
            <div className="mb-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-300 px-4 py-3 text-sm flex items-center gap-2">
              <CheckCircle2
                size={16}
              />
              {success}
            </div>
          )}

          <form
            onSubmit={
              handleSignup
            }
            className="space-y-4"
          >

            <Input
              icon={
                <Mail size={16} />
              }
              type="email"
              name="email"
              placeholder="Email"
              value={
                form.email
              }
              onChange={
                handleChange
              }
            />

            <Input
              icon={
                <Lock size={16} />
              }
              type="password"
              name="password"
              placeholder="Password"
              value={
                form.password
              }
              onChange={
                handleChange
              }
            />

            <Input
              icon={
                <Lock size={16} />
              }
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={
                form.confirmPassword
              }
              onChange={
                handleChange
              }
            />

            <Input
              icon={
                <Building2 size={16} />
              }
              type="text"
              name="companyName"
              placeholder="Company Name"
              value={
                form.companyName
              }
              onChange={
                handleChange
              }
            />

            <button
              type="submit"
              disabled={
                loading
              }
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 py-4 rounded-2xl font-medium flex items-center justify-center gap-2 transition"
            >
              {loading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <ArrowRight size={16} />
              )}

              {loading
                ? "Creating..."
                : "Create Account"}
            </button>

          </form>

          <div className="mt-6 text-center text-sm text-gray-400">

            Already have an account?{" "}

            <Link
              to="/login"
              className="text-indigo-400 hover:text-indigo-300"
            >
              Sign in
            </Link>

          </div>

        </div>
      </motion.div>

    </div>
  );
}

function Input({
  icon,
  ...props
}) {
  return (
    <div className="relative">

      <div className="absolute left-4 top-4 text-gray-500">
        {icon}
      </div>

      <input
        {...props}
        required
        className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500"
      />

    </div>
  );
}