// src/pages/Billing.js
// BILLING V4
// ✅ Cancel Anytime explained
// ✅ Current month access explained
// ✅ Delete company account section
// ✅ Better trust / conversions
// ✅ Stripe portal kept
// ✅ Logout added
// ✅ Premium UI
// ✅ Copy / paste ready

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  billingAPI,
} from "../services/api";

import {
  useAuth,
} from "../hooks/useAuth";

import { motion } from "framer-motion";

import {
  Crown,
  Users,
  Building2,
  Sparkles,
  Check,
  Loader2,
  RefreshCw,
  ArrowUpRight,
  Clock3,
  Shield,
  AlertTriangle,
  Trash2,
  LogOut,
  PoundSterling,
} from "lucide-react";

export default function Billing() {
  const navigate =
    useNavigate();

  const { logout } =
    useAuth();

  const [loading, setLoading] =
    useState(true);

  const [data, setData] =
    useState(null);

  const [loadingPlan, setLoadingPlan] =
    useState("");

  const [portalLoading, setPortalLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadBilling();
  }, []);

  async function loadBilling() {
    try {
      setLoading(true);
      setError("");

      const res =
        await billingAPI.getStatus();

      setData(res || {});
    } catch (err) {
      setError(
        err?.message ||
          "Failed to load billing"
      );
    } finally {
      setLoading(false);
    }
  }

  async function upgrade(plan) {
    try {
      setLoadingPlan(plan);

      const res =
        await billingAPI.checkout({
          plan,
        });

      if (res?.url) {
        window.location.href =
          res.url;
      }
    } catch {
      setError(
        "Checkout unavailable"
      );
    } finally {
      setLoadingPlan("");
    }
  }

  async function openPortal() {
    try {
      setPortalLoading(true);

      const res =
        await billingAPI.portal();

      if (res?.url) {
        window.location.href =
          res.url;
      }
    } catch {
      setError(
        "Portal unavailable"
      );
    } finally {
      setPortalLoading(false);
    }
  }

  function deleteCompany() {
    const ok =
      window.confirm(
        "Delete company account permanently?\n\nThis should remove all users, schedules and data."
      );

    if (!ok) return;

    alert(
      "Connect this button to your backend delete endpoint."
    );
  }

  const currentPlan =
    data?.plan ||
    "starter";

  const status =
    data?.status ||
    "inactive";

  const trialEnd =
    data?.trial_end ||
    data?.trial_ends_at ||
    null;

  const trialActive =
    trialEnd &&
    new Date(trialEnd) >
      new Date();

  const daysLeft =
    trialActive
      ? Math.ceil(
          (new Date(
            trialEnd
          ) -
            new Date()) /
            86400000
        )
      : 0;

  const plans = [
    {
      key: "starter",
      title: "Starter",
      price: "£49",
      staff: "Up to 5 staff",
      extra:
        "+£7 per extra staff",
      icon: <Users size={18} />,
      features: [
        "Scheduling",
        "Clock in/out",
        "Holiday requests",
        "Timesheets",
        "Basic reports",
      ],
    },
    {
      key: "pro",
      title: "Pro",
      price: "£89",
      staff: "Up to 15 staff",
      extra:
        "+£6 per extra staff",
      icon: <Crown size={18} />,
      featured: true,
      features: [
        "Everything in Starter",
        "Performance tools",
        "Advanced reports",
        "No-show visibility",
        "Priority support",
      ],
    },
    {
      key: "business",
      title: "Business",
      price: "£149",
      staff: "Up to 30 staff",
      extra:
        "+£5 per extra staff",
      icon: (
        <Building2 size={18} />
      ),
      features: [
        "Everything in Pro",
        "Multi-location",
        "Best value scale",
        "Premium support",
        "Deep analytics",
      ],
    },
  ];

  if (loading) {
    return (
      <Center
        loading
        text="Loading billing..."
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* HERO */}

      <div className="rounded-3xl p-[1px] bg-gradient-to-r from-indigo-500/30 via-purple-500/20 to-transparent">

        <div className="rounded-3xl border border-white/10 bg-[#020617] p-8">

          <div className="flex justify-between gap-4 flex-wrap">

            <div>
              <div className="inline-flex gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm items-center">
                <Sparkles size={14} />
                Billing V4
              </div>

              <h1 className="text-4xl font-semibold mt-4">
                Plans built to
                save time & money
              </h1>

              <p className="text-gray-400 mt-4 max-w-2xl">
                Reduce admin time,
                stop missed shifts,
                track attendance and
                automate schedules.
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">

              <button
                onClick={loadBilling}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 flex gap-2 items-center"
              >
                <RefreshCw
                  size={16}
                />
                Refresh
              </button>

              <button
                onClick={
                  openPortal
                }
                className="px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 flex gap-2 items-center"
              >
                {portalLoading ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <ArrowUpRight
                    size={16}
                  />
                )}
                Manage Billing
              </button>

              <button
                onClick={logout}
                className="px-4 py-3 rounded-2xl bg-red-500/20 text-red-300 hover:bg-red-500/30 flex gap-2 items-center"
              >
                <LogOut
                  size={16}
                />
                Logout
              </button>

            </div>

          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-6">

            <InfoCard
              title="Current Plan"
              value={currentPlan.toUpperCase()}
            />

            <InfoCard
              title="Status"
              value={status}
            />

            <InfoCard
              title="Trial"
              value={
                trialActive
                  ? `${daysLeft} days left`
                  : "Inactive"
              }
            />

          </div>

          {trialActive && (
            <div className="mt-5 rounded-2xl bg-green-500/10 border border-green-500/30 p-4 text-green-300 text-sm flex gap-2">
              <Clock3 size={16} />
              Your selected plan is{" "}
              <b>
                {currentPlan}
              </b>
              . Trial currently gives
              full premium access.
            </div>
          )}

        </div>
      </div>

      {error && (
        <ErrorBox
          text={error}
        />
      )}

      {/* SAVINGS */}

      <div className="grid md:grid-cols-3 gap-4">

        <SaveCard
          icon={
            <Clock3 size={18} />
          }
          title="Admin Time"
          text="Save 8–20 hours monthly handling rota changes, holidays and payroll prep."
        />

        <SaveCard
          icon={
            <PoundSterling size={18} />
          }
          title="Reduce Wage Loss"
          text="Avoid paying missed shifts, no-shows and untracked late starts."
        />

        <SaveCard
          icon={
            <Shield size={18} />
          }
          title="Better Control"
          text="Live attendance and location clock-ins improve accountability."
        />

      </div>

      {/* PLANS */}

      <div className="grid lg:grid-cols-3 gap-6">

        {plans.map((plan) => {
          const current =
            currentPlan ===
            plan.key;

          return (
            <motion.div
              key={plan.key}
              whileHover={{
                y: -4,
              }}
              className={`rounded-3xl p-[1px] ${
                plan.featured
                  ? "bg-gradient-to-b from-indigo-500/40 to-transparent"
                  : "bg-white/10"
              }`}
            >
              <div className="rounded-3xl border border-white/10 bg-[#020617] p-6">

                <div className="flex gap-2 text-indigo-400 text-sm items-center">
                  {plan.icon}
                  {plan.title}
                </div>

                <p className="text-4xl font-bold mt-4">
                  {plan.price}
                  <span className="text-base text-gray-400 font-normal">
                    /month
                  </span>
                </p>

                <p className="text-green-400 text-sm mt-2">
                  {plan.staff}
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  {plan.extra}
                </p>

                <div className="space-y-2 mt-5">

                  {plan.features.map(
                    (
                      item,
                      i
                    ) => (
                      <div
                        key={i}
                        className="flex gap-2 text-sm text-gray-300"
                      >
                        <Check
                          size={14}
                          className="text-green-400 mt-0.5"
                        />
                        {item}
                      </div>
                    )
                  )}

                </div>

                <button
                  disabled={
                    current ||
                    loadingPlan
                  }
                  onClick={() =>
                    upgrade(
                      plan.key
                    )
                  }
                  className={`w-full mt-6 py-3 rounded-2xl font-medium ${
                    current
                      ? "bg-green-600"
                      : "bg-indigo-600 hover:bg-indigo-500"
                  }`}
                >
                  {loadingPlan ===
                  plan.key
                    ? "Loading..."
                    : current
                    ? "Current Plan"
                    : "Choose Plan"}
                </button>

              </div>
            </motion.div>
          );
        })}

      </div>

      {/* CANCEL ANYTIME */}

      <div className="rounded-3xl border border-white/10 bg-[#020617] p-6">

        <h2 className="text-xl font-semibold">
          Cancel Anytime
        </h2>

        <p className="text-gray-400 mt-3 text-sm">
          If you cancel during an
          active month, you keep
          access until the end of
          the billing period.
        </p>

        <p className="text-gray-400 mt-2 text-sm">
          Example: Pay on the 1st,
          cancel on the 10th, still
          use the app until next
          renewal date.
        </p>

        <button
          onClick={openPortal}
          className="mt-5 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15"
        >
          Manage / Cancel Subscription
        </button>

      </div>

      {/* DANGER ZONE */}

      <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">

        <div className="flex gap-3 items-center">

          <AlertTriangle
            size={20}
            className="text-red-400"
          />

          <h2 className="text-xl font-semibold text-red-300">
            Danger Zone
          </h2>

        </div>

        <p className="text-sm text-gray-400 mt-3">
          Permanently delete your
          company account and all
          related data.
        </p>

        <button
          onClick={
            deleteCompany
          }
          className="mt-5 px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 flex gap-2 items-center"
        >
          <Trash2
            size={16}
          />
          Delete Account
        </button>

      </div>

    </div>
  );
}

/* COMPONENTS */

function InfoCard({
  title,
  value,
}) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <p className="text-xs text-gray-400">
        {title}
      </p>
      <p className="font-semibold mt-2">
        {value}
      </p>
    </div>
  );
}

function SaveCard({
  icon,
  title,
  text,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#020617] p-5">
      <div className="text-indigo-400">
        {icon}
      </div>
      <h3 className="font-medium mt-3">
        {title}
      </h3>
      <p className="text-sm text-gray-400 mt-2">
        {text}
      </p>
    </div>
  );
}

function ErrorBox({
  text,
}) {
  return (
    <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-red-300 text-sm">
      {text}
    </div>
  );
}

function Center({
  text,
  loading,
}) {
  return (
    <div className="h-[60vh] flex items-center justify-center gap-2 text-gray-400">
      {loading && (
        <Loader2
          size={16}
          className="animate-spin"
        />
      )}
      {text}
    </div>
  );
}