import { useState } from "react";
import api from "../services/api";
import { motion } from "framer-motion";
import {
  Crown,
  Check,
  Shield,
  Zap,
  BarChart3,
  Building2,
  Users,
  RefreshCw,
} from "lucide-react";

export default function Billing() {
  const [loadingPlan, setLoadingPlan] =
    useState(null);

  const handleUpgrade = async (
    plan
  ) => {
    try {
      setLoadingPlan(plan);

      const res = await api.post(
        "/billing/create-checkout-session",
        { plan }
      );

      if (!res.data?.url) {
        alert("Something went wrong");
        return;
      }

      window.location.href =
        res.data.url;

    } catch (err) {
      console.error(err);
      alert("Payment failed");

    } finally {
      setLoadingPlan(null);
    }
  };

  const plans = [
    {
      key: "starter",
      title: "Starter",
      price: "£49",
      extra: "+ £7 per extra employee",
      badge: "Best for small teams",
      icon: <Users size={18} />,
      featured: false,
      features: [
        "Up to 5 employees included",
        "Staff scheduling",
        "Clock in / out",
        "GPS attendance",
        "Holiday requests",
        "Basic dashboard",
        "Email support",
      ],
    },

    {
      key: "pro",
      title: "Pro",
      price: "£89",
      extra: "+ £8 per extra employee",
      badge: "Most Popular",
      icon: <Crown size={18} />,
      featured: true,
      features: [
        "Up to 10 employees included",
        "Everything in Starter",
        "Task management",
        "Announcements",
        "Reports & analytics",
        "Performance rankings",
        "CSV exports",
        "Priority support",
      ],
    },

    {
      key: "business",
      title: "Business",
      price: "£149",
      extra: "+ £10 per extra employee",
      badge: "For growing companies",
      icon: <Building2 size={18} />,
      featured: false,
      features: [
        "Up to 20 employees included",
        "Everything in Pro",
        "Multi-location management",
        "Payroll exports",
        "Advanced permissions",
        "Department controls",
        "Dedicated support",
      ],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10">

      {/* HERO */}
      <div className="rounded-3xl p-[1px] bg-gradient-to-r from-indigo-500/30 via-purple-500/20 to-transparent">

        <div className="bg-[#020617] border border-white/10 rounded-3xl p-8 text-center">

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm mb-4">
            <Crown size={15} />
            FieldSync Pricing
          </div>

          <h1 className="text-4xl font-semibold text-white">
            Manage Staff. Save Time. Grow Faster.
          </h1>

          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            Simple monthly pricing with
            employees included in every
            plan. Scale when your business
            grows.
          </p>

        </div>

      </div>

      {/* TOP FEATURES */}
      <div className="grid md:grid-cols-3 gap-4">

        <FeatureCard
          icon={<BarChart3 size={18} />}
          title="Reports & Analytics"
          text="Track productivity, staffing and attendance."
        />

        <FeatureCard
          icon={<Zap size={18} />}
          title="Automation"
          text="Reduce admin with smart workflows."
        />

        <FeatureCard
          icon={<Shield size={18} />}
          title="Secure Payments"
          text="Subscriptions powered by Stripe."
        />

      </div>

      {/* PRICING */}
      <div className="grid lg:grid-cols-3 gap-6">

        {plans.map((plan) => (
          <motion.div
            key={plan.key}
            whileHover={{ y: -4 }}
            className={`rounded-3xl p-[1px] ${
              plan.featured
                ? "bg-gradient-to-b from-indigo-500/40 to-transparent"
                : "bg-white/10"
            }`}
          >
            <div className="bg-[#020617] border border-white/10 rounded-3xl p-6 h-full flex flex-col">

              <div className="flex items-center gap-2 text-indigo-400 text-sm">
                {plan.icon}
                {plan.badge}
              </div>

              <h2 className="text-2xl font-semibold text-white mt-3">
                {plan.title}
              </h2>

              <p className="text-4xl font-bold text-white mt-4">
                {plan.price}
                <span className="text-base text-gray-400 font-normal">
                  /month
                </span>
              </p>

              <p className="text-sm text-gray-400 mt-2">
                {plan.extra}
              </p>

              <div className="space-y-3 mt-6 flex-1">

                {plan.features.map(
                  (item) => (
                    <Benefit
                      key={item}
                      text={item}
                    />
                  )
                )}

              </div>

              <button
                onClick={() =>
                  handleUpgrade(
                    plan.key
                  )
                }
                disabled={
                  loadingPlan !==
                    null
                }
                className={`w-full mt-6 py-3 rounded-2xl text-white font-medium flex items-center justify-center gap-2 transition ${
                  plan.featured
                    ? "bg-indigo-600 hover:bg-indigo-500"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                {loadingPlan ===
                plan.key ? (
                  <>
                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />
                    Redirecting...
                  </>
                ) : (
                  <>
                    <Crown size={16} />
                    Choose {plan.title}
                  </>
                )}
              </button>

            </div>
          </motion.div>
        ))}

      </div>

      <p className="text-center text-sm text-gray-500">
        Secure checkout powered by Stripe.
        Cancel anytime.
      </p>

    </div>
  );
}

/* COMPONENTS */

function FeatureCard({
  icon,
  title,
  text,
}) {
  return (
    <div className="rounded-2xl bg-[#020617] border border-white/10 p-5">
      <div className="text-indigo-400">
        {icon}
      </div>

      <h3 className="text-white font-medium mt-3">
        {title}
      </h3>

      <p className="text-sm text-gray-400 mt-2">
        {text}
      </p>
    </div>
  );
}

function Benefit({ text }) {
  return (
    <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
      <div className="w-7 h-7 rounded-full bg-green-500/15 text-green-400 flex items-center justify-center">
        <Check size={14} />
      </div>

      <span className="text-sm text-white">
        {text}
      </span>
    </div>
  );
}