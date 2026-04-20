// src/pages/Billing.js
// BILLING V3
// ✅ Clearer trial wording
// ✅ Better conversions
// ✅ Shows what happens after trial
// ✅ Savings examples
// ✅ Extra staff pricing explained
// ✅ Premium modern UI
// ✅ Keeps checkout / portal logic
// ✅ Copy / paste ready

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { billingAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { motion } from "framer-motion";

import {
  Crown,
  Sparkles,
  Users,
  Building2,
  BarChart3,
  Check,
  Loader2,
  RefreshCw,
  ArrowUpRight,
  Clock3,
  PoundSterling,
  AlertCircle,
  Zap,
} from "lucide-react";

export default function Billing() {
  const { logout } = useAuth();

  const [subscription, setSubscription] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

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

      const data =
        await billingAPI.getStatus();

      setSubscription(data);
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
        "Billing portal unavailable"
      );
    } finally {
      setPortalLoading(false);
    }
  }

  const currentPlan =
    subscription?.plan ||
    "starter";

  const status =
    subscription?.status ||
    "inactive";

  const trialEnd =
    subscription?.trial_end ||
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
      icon: <Users size={18} />,
      badge: "Best for small teams",
      staff: "Up to 5 staff",
      extra:
        "+£7 per extra staff",
      features: [
        "Scheduling",
        "Clock in / out",
        "Holiday requests",
        "Timesheets",
        "Basic reports",
      ],
    },
    {
      key: "pro",
      title: "Pro",
      price: "£89",
      icon: <Crown size={18} />,
      badge: "Most Popular",
      staff: "Up to 15 staff",
      extra:
        "+£6 per extra staff",
      featured: true,
      features: [
        "Everything in Starter",
        "Performance tracking",
        "Advanced reports",
        "No-show visibility",
        "Priority support",
      ],
    },
    {
      key: "business",
      title: "Business",
      price: "£149",
      icon: (
        <Building2 size={18} />
      ),
      badge: "Scale teams fast",
      staff: "Up to 30 staff",
      extra:
        "+£5 per extra staff",
      features: [
        "Everything in Pro",
        "Multi-site support",
        "Deep analytics",
        "Priority onboarding",
        "Best value at scale",
      ],
    },
  ];

  const trialText =
    useMemo(() => {
      if (!trialActive)
        return null;

      return `${daysLeft} days of FULL premium access remaining`;
    }, [trialActive, daysLeft]);

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
              <div className="inline-flex px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm gap-2 items-center">
                <Sparkles size={14} />
                Billing & Plans
              </div>

              <h1 className="text-4xl font-semibold mt-4">
                Grow faster.
                Save hours.
              </h1>

              <p className="text-gray-400 mt-4 max-w-2xl">
                Automate staff
                scheduling, reduce
                no-shows, track live
                attendance and cut
                admin time every week.
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">

              <button
                onClick={loadBilling}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 flex items-center gap-2"
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
                className="px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2"
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

                Manage
              </button>

              <button
                onClick={logout}
                className="px-4 py-3 rounded-2xl bg-red-500/20 text-red-300 hover:bg-red-500/30"
              >
                Logout
              </button>

            </div>

          </div>

          <div className="mt-6 grid md:grid-cols-3 gap-4">

            <MiniBox
              title="Selected Plan"
              value={
                currentPlan.toUpperCase()
              }
            />

            <MiniBox
              title="Status"
              value={status}
            />

            <MiniBox
              title="Trial"
              value={
                trialActive
                  ? trialText
                  : "Inactive"
              }
            />

          </div>

          {trialActive && (
            <div className="mt-5 rounded-2xl bg-green-500/10 border border-green-500/30 p-4 text-green-300 text-sm flex gap-2">
              <Clock3 size={16} />
              You selected{" "}
              <b>
                {currentPlan}
              </b>{" "}
              plan, but trial gives
              full access to all
              premium features until
              it ends.
            </div>
          )}

        </div>
      </div>

      {error && (
        <Alert text={error} />
      )}

      {/* SAVINGS */}

      <div className="grid md:grid-cols-3 gap-4">

        <Saving
          icon={
            <Clock3 size={18} />
          }
          title="Save Admin Time"
          text="Typical business saves 8–20 admin hours monthly with rota changes, leave requests and timesheets."
        />

        <Saving
          icon={
            <PoundSterling size={18} />
          }
          title="Reduce Lost Wages"
          text="Prevent paying missed shifts, late starts or buddy clock-ins with tracked clocking."
        />

        <Saving
          icon={
            <Zap size={18} />
          }
          title="Increase Efficiency"
          text="Auto-updated schedules reduce confusion, texting staff and last-minute changes."
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

                <div className="flex items-center gap-2 text-indigo-400 text-sm">
                  {plan.icon}
                  {plan.badge}
                </div>

                <h2 className="text-2xl font-semibold mt-3">
                  {plan.title}
                </h2>

                <p className="text-4xl font-bold mt-4">
                  {plan.price}
                  <span className="text-base text-gray-400 font-normal">
                    /mo
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
                  onClick={() =>
                    upgrade(
                      plan.key
                    )
                  }
                  disabled={
                    loadingPlan ||
                    current
                  }
                  className={`w-full mt-6 py-3 rounded-2xl font-medium ${
                    current
                      ? "bg-green-600"
                      : plan.featured
                      ? "bg-indigo-600 hover:bg-indigo-500"
                      : "bg-white/10 hover:bg-white/20"
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

      {/* AFTER TRIAL */}

      {trialActive && (
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5 text-sm text-yellow-200">
          When your trial ends,
          access will switch to your
          selected{" "}
          <b>
            {currentPlan}
          </b>{" "}
          plan automatically unless
          upgraded.
        </div>
      )}

    </div>
  );
}

/* COMPONENTS */

function MiniBox({
  title,
  value,
}) {
  return (
    <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
      <p className="text-xs text-gray-400">
        {title}
      </p>

      <p className="font-semibold mt-2">
        {value}
      </p>
    </div>
  );
}

function Saving({
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

function Alert({
  text,
}) {
  return (
    <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-red-300 text-sm flex gap-2">
      <AlertCircle size={16} />
      {text}
    </div>
  );
}

function Center({
  text,
  loading,
}) {
  return (
    <div className="h-[60vh] flex items-center justify-center text-gray-400 gap-2">
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