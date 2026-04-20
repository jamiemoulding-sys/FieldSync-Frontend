// src/pages/Billing.js
// TRUE MERGED FINAL VERSION
// ✅ Original logic preserved
// ✅ Stripe checkout preserved
// ✅ Portal preserved
// ✅ Trial countdown preserved
// ✅ Current plan logic preserved
// ✅ Cancelled handling preserved
// ✅ New founders pricing banner
// ✅ Extra staff pricing added
// ✅ ROI / money saved section
// ✅ Stronger SaaS conversion copy
// ✅ Premium upgraded UI
// ✅ Copy / paste ready

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { billingAPI } from "../services/api";
import { motion } from "framer-motion";

import {
  Crown,
  Shield,
  Zap,
  BarChart3,
  Building2,
  Users,
  RefreshCw,
  CreditCard,
  Sparkles,
  Check,
  Loader2,
  AlertCircle,
  Clock3,
  ArrowUpRight,
  TrendingUp,
  PoundSterling,
  Timer,
  MapPin,
  Briefcase,
} from "lucide-react";

export default function Billing() {
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
      setError("");

      const data =
        await billingAPI.getStatus();

      setSubscription(
        data || null
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to load billing"
      );
    } finally {
      setLoading(false);
    }
  }

  async function upgrade(plan) {
    try {
      setLoadingPlan(plan);
      setError("");

      const res =
        await billingAPI.checkout({
          plan,
        });

      if (res?.url) {
        window.location.href =
          res.url;
      }
    } catch (err) {
      console.error(err);

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
      setError("");

      const res =
        await billingAPI.portal();

      if (res?.url) {
        window.location.href =
          res.url;
      }
    } catch (err) {
      console.error(err);

      setError(
        "Billing portal unavailable"
      );
    } finally {
      setPortalLoading(false);
    }
  }

  const plans = [
    {
      key: "starter",
      title: "Starter",
      price: "£49",
      badge: "Small Teams",
      icon: <Users size={18} />,
      featured: false,
      staff: "5 staff included",
      extra: "+ £7 per extra staff",
      features: [
        "Scheduling",
        "Clock in / out",
        "Holiday requests",
        "Reports",
        "Timesheets",
        "Notifications",
      ],
    },
    {
      key: "pro",
      title: "Pro",
      price: "£89",
      badge: "Most Popular",
      icon: <Crown size={18} />,
      featured: true,
      staff: "15 staff included",
      extra: "+ £8 per extra staff",
      features: [
        "Everything in Starter",
        "Advanced reports",
        "Premium scheduling",
        "Priority support",
        "Team analytics",
        "Auto reminders",
      ],
    },
    {
      key: "business",
      title: "Business",
      price: "£149",
      badge: "Scale Fast",
      icon: (
        <Building2 size={18} />
      ),
      featured: false,
      staff: "30 staff included",
      extra: "+ £10 per extra staff",
      features: [
        "Everything in Pro",
        "Multi-site tools",
        "Dedicated support",
        "Enterprise tools",
        "Custom workflows",
        "Priority onboarding",
      ],
    },
  ];

  const currentPlan =
    subscription?.plan ||
    subscription?.current_plan ||
    "";

  const currentStatus =
    subscription?.status ||
    subscription?.subscription_status ||
    "inactive";

  const trialEnd =
    subscription?.trial_end ||
    subscription?.trial_ends_at ||
    null;

  const trialActive =
    trialEnd &&
    new Date(trialEnd) >
      new Date();

  const hasPremiumAccess =
    currentStatus ===
      "active" ||
    trialActive;

  const trialDaysLeft =
    trialActive
      ? Math.ceil(
          (new Date(
            trialEnd
          ) -
            new Date()) /
            86400000
        )
      : 0;

  const headerText = useMemo(() => {
    if (trialActive) {
      return `14 DAY TRIAL ACTIVE • ${trialDaysLeft} DAYS LEFT`;
    }

    if (
      currentStatus ===
        "active" &&
      currentPlan
    ) {
      return `${currentPlan.toUpperCase()} ACTIVE`;
    }

    if (
      currentStatus ===
      "canceled"
    ) {
      return "Subscription Cancelled";
    }

    return "No Active Plan";
  }, [
    trialActive,
    trialDaysLeft,
    currentPlan,
    currentStatus,
  ]);

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

        <div className="rounded-3xl border border-white/10 bg-[#020617] p-8 text-center">

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm mb-4">
            <Sparkles size={15} />
            Subscription
          </div>

          <h1 className="text-4xl font-semibold">
            Billing &
            Subscription
          </h1>

          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            Affordable workforce
            management built for
            growing companies.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-green-500/10 text-green-400 font-medium flex-wrap justify-center">
            <CreditCard size={16} />
            {headerText}
          </div>

          {trialActive && (
            <div className="mt-4 text-sm text-indigo-300 flex justify-center items-center gap-2">
              <Clock3 size={14} />
              Full premium access
              during trial.
            </div>
          )}

          {trialActive &&
            trialDaysLeft <= 3 && (
              <div className="mt-4 text-sm text-yellow-300">
                Trial ending soon —
                upgrade now to keep
                access.
              </div>
            )}

          <div className="mt-6 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 text-yellow-300 text-sm">
            First 6 months signups
            lock in these prices for
            life while subscription
            remains active.
          </div>

          <div className="mt-6 flex justify-center gap-3 flex-wrap">

            <button
              onClick={
                loadBilling
              }
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 inline-flex items-center gap-2"
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
              disabled={
                portalLoading
              }
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 inline-flex items-center gap-2"
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

          </div>

        </div>
      </div>

      {error && (
        <Alert text={error} />
      )}

      {/* WHY CHOOSE */}
      <div className="grid md:grid-cols-4 gap-4">

        <Feature
          icon={
            <Timer size={18} />
          }
          title="Save Admin Time"
          text="Reduce rota, payroll and chasing staff admin every week."
        />

        <Feature
          icon={
            <PoundSterling size={18} />
          }
          title="Reduce Lost Money"
          text="Less lateness, missed shifts and no-shows."
        />

        <Feature
          icon={
            <MapPin size={18} />
          }
          title="Easy Locations"
          text="Add job sites fast with map links for staff."
        />

        <Feature
          icon={
            <TrendingUp size={18} />
          }
          title="Grow Faster"
          text="Automated systems let you scale easier."
        />

      </div>

      {/* PLANS */}
      <div className="grid lg:grid-cols-3 gap-6">

        {plans.map((plan) => {
          const isCurrent =
            currentPlan ===
              plan.key &&
            currentStatus ===
              "active";

          return (
            <motion.div
              key={plan.key}
              whileHover={{
                y: -5,
              }}
              className={`rounded-3xl p-[1px] ${
                plan.featured
                  ? "bg-gradient-to-b from-indigo-500/40 to-transparent"
                  : "bg-white/10"
              }`}
            >

              <div className="rounded-3xl border border-white/10 bg-[#020617] p-6 h-full">

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
                    /month
                  </span>
                </p>

                <p className="text-green-400 text-sm mt-2">
                  {plan.staff}
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  {plan.extra}
                </p>

                <div className="mt-5 space-y-2">

                  {plan.features.map(
                    (
                      item,
                      i
                    ) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm text-gray-300"
                      >
                        <Check
                          size={
                            14
                          }
                          className="text-green-400"
                        />

                        {item}
                      </div>
                    )
                  )}

                </div>

                <button
                  disabled={
                    isCurrent ||
                    !!loadingPlan
                  }
                  onClick={() =>
                    !isCurrent &&
                    upgrade(
                      plan.key
                    )
                  }
                  className={`w-full mt-6 py-3 rounded-2xl font-medium flex items-center justify-center gap-2 ${
                    isCurrent
                      ? "bg-green-600"
                      : plan.featured
                      ? "bg-indigo-600 hover:bg-indigo-500"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >

                  {loadingPlan ===
                  plan.key ? (
                    <>
                      <Loader2
                        size={
                          16
                        }
                        className="animate-spin"
                      />
                      Redirecting...
                    </>
                  ) : isCurrent ? (
                    <>
                      <Check
                        size={
                          16
                        }
                      />
                      Current Plan
                    </>
                  ) : (
                    <>
                      <Crown
                        size={
                          16
                        }
                      />
                      Choose Plan
                    </>
                  )}

                </button>

              </div>

            </motion.div>
          );
        })}

      </div>

      {/* ROI SECTION */}
      <div className="grid md:grid-cols-3 gap-4">

        <ROI
          icon={
            <Briefcase size={18} />
          }
          title="Save 10+ Admin Hours"
          text="Managers save time weekly using auto schedules & tracking."
        />

        <ROI
          icon={
            <Clock3 size={18} />
          }
          title="Reduce Late Starts"
          text="Staff see live schedules and locations instantly."
        />

        <ROI
          icon={
            <BarChart3 size={18} />
          }
          title="Better Decisions"
          text="Reports show labour usage, attendance and trends."
        />

      </div>

    </div>
  );
}

/* COMPONENTS */

function Feature({
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

function ROI({
  icon,
  title,
  text,
}) {
  return (
    <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
      <div className="text-green-400">
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
    <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-300 text-sm flex gap-2">
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