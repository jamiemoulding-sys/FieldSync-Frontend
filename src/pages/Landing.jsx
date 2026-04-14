import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Users,
  MapPinned,
  Shield,
  Clock3,
  Crown,
  Building2,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  const stats = [
    { label: "Hours Tracked", value: "250k+" },
    { label: "Staff Managed", value: "8,000+" },
    { label: "Tasks Completed", value: "95k+" },
    { label: "Businesses Growing", value: "420+" },
  ];

  const features = [
    {
      icon: <Clock3 size={18} />,
      title: "Live Workforce Tracking",
      text: "See who's clocked in, late, on break or active in real time.",
    },
    {
      icon: <Users size={18} />,
      title: "Smart Scheduling",
      text: "Create shifts in seconds and fill gaps fast.",
    },
    {
      icon: <MapPinned size={18} />,
      title: "GPS Attendance",
      text: "Prevent buddy clock-ins and verify location.",
    },
    {
      icon: <BarChart3 size={18} />,
      title: "Profit Reports",
      text: "Track labour cost, trends and team performance.",
    },
    {
      icon: <Shield size={18} />,
      title: "Secure Roles",
      text: "Admins, managers and staff all get correct access.",
    },
    {
      icon: <Zap size={18} />,
      title: "Built For Growth",
      text: "Scale from 3 staff to 300+ without changing systems.",
    },
  ];

  const pricing = [
    {
      name: "Starter",
      price: "£49",
      included: "5 staff included",
      extra: "+ £7 each extra staff",
      icon: <Users size={18} />,
      featured: false,
      items: [
        "Scheduling",
        "Clock in / out",
        "Holiday requests",
        "Dashboard",
        "Basic reports",
      ],
    },
    {
      name: "Pro",
      price: "£89",
      included: "15 staff included",
      extra: "+ £8 each extra staff",
      icon: <Crown size={18} />,
      featured: true,
      items: [
        "Everything in Starter",
        "Tasks system",
        "Announcements",
        "Advanced reports",
        "Priority support",
      ],
    },
    {
      name: "Business",
      price: "£149",
      included: "30 staff included",
      extra: "+ £10 each extra staff",
      icon: <Building2 size={18} />,
      featured: false,
      items: [
        "Everything in Pro",
        "Multi-site control",
        "Payroll exports",
        "Advanced permissions",
        "Dedicated support",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden">
      {/* BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-indigo-600/20 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-cyan-500/10 blur-3xl rounded-full" />
      </div>

      {/* NAV */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">FieldSync</h1>
          <p className="text-xs text-gray-500">Workforce Operating System</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 rounded-xl text-sm hover:bg-white/5"
          >
            Sign In
          </button>

          <button
            onClick={() => navigate("/signup")}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium"
          >
            Start Trial
          </button>
        </div>
      </div>

      {/* HERO */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-28">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs mb-6">
              Trusted by growing UK businesses
            </div>

            <h1 className="text-5xl md:text-7xl font-semibold leading-tight">
              Replace chaos with
              <br />
              <span className="text-indigo-400">control</span>
            </h1>

            <p className="mt-6 text-lg text-gray-400 max-w-xl leading-relaxed">
              Scheduling, attendance, payroll-ready exports, tasks, staff
              management and live reporting in one platform.
            </p>

            <div className="mt-8 flex gap-4 flex-wrap">
              <button
                onClick={() => navigate("/signup")}
                className="px-7 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-medium flex items-center gap-2"
              >
                Start Free Trial
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => navigate("/login")}
                className="px-7 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10"
              >
                Login
              </button>
            </div>

            <p className="mt-5 text-sm text-green-400">
              Businesses commonly save 10+ admin hours every week
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl p-[1px] bg-gradient-to-b from-white/15 to-transparent"
          >
            <div className="bg-[#020617] border border-white/10 rounded-3xl p-6">
              <div className="grid grid-cols-2 gap-4">
                <Panel title="Clocked In" value="27" />
                <Panel title="Tasks Today" value="84" />
                <Panel title="Late Staff" value="2" />
                <Panel title="Sites" value="11" />
              </div>

              <div className="mt-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-4">
                <div className="flex items-center gap-2 text-indigo-300 text-sm">
                  <TrendingUp size={15} />
                  Labour efficiency up 19%
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* STATS */}
      <div className="relative z-10 border-y border-white/10 bg-white/5">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-3xl font-semibold">{item.value}</p>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-semibold">
            Built to save time & grow revenue
          </h2>
          <p className="text-gray-400 mt-4">
            Everything managers need in one clean system.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl bg-white/5 border border-white/10 p-6"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                {item.icon}
              </div>

              <h3 className="font-medium text-lg">{item.title}</h3>
              <p className="text-sm text-gray-400 mt-2">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* PRICING */}
      <div className="relative z-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-semibold">
              Pricing that scales with you
            </h2>

            <p className="text-gray-400 mt-4">
              14 day free trial • Cancel anytime
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-3xl p-[1px] ${
                  plan.featured
                    ? "bg-gradient-to-b from-indigo-500/40 to-transparent"
                    : "bg-white/10"
                }`}
              >
                <div className="bg-[#020617] border border-white/10 rounded-3xl p-6 h-full">
                  <div className="flex items-center gap-2 text-indigo-400 text-sm">
                    {plan.icon}
                    {plan.name}
                  </div>

                  {plan.featured && (
                    <div className="mt-3 inline-flex px-3 py-1 rounded-full bg-indigo-500/10 text-xs text-indigo-300">
                      Most Popular
                    </div>
                  )}

                  <p className="text-4xl font-bold mt-4">
                    {plan.price}
                    <span className="text-base text-gray-400 font-normal">
                      /month
                    </span>
                  </p>

                  <p className="text-green-400 text-sm mt-2">
                    {plan.included}
                  </p>

                  <p className="text-gray-400 text-sm mt-1">{plan.extra}</p>

                  <div className="space-y-3 mt-6 text-sm text-gray-300">
                    {plan.items.map((item) => (
                      <p key={item} className="flex gap-2">
                        <CheckCircle2
                          size={16}
                          className="text-green-400"
                        />
                        {item}
                      </p>
                    ))}
                  </div>

                  <button
                    onClick={() => navigate("/signup")}
                    className="mt-8 w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-medium"
                  >
                    Start Free Trial
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* VALUE BLOCK */}
          <div className="mt-14 rounded-3xl bg-white/5 border border-white/10 p-8 text-center">
            <Star className="mx-auto text-yellow-400 mb-4" size={24} />
            <h3 className="text-2xl font-semibold">
              Save hours every week with smarter workforce management
            </h3>
            <p className="text-gray-400 mt-3">
              Reduce admin, improve attendance, streamline scheduling and grow
              with confidence.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-4xl font-semibold">Ready to grow faster?</h2>

        <p className="text-gray-400 mt-4">
          Launch your workspace today and run your team properly.
        </p>

        <button
          onClick={() => navigate("/signup")}
          className="mt-8 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-medium"
        >
          Create Workspace
        </button>
      </div>
    </div>
  );
}

function Panel({ title, value }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <p className="text-xs text-gray-400">{title}</p>
      <h3 className="text-2xl font-semibold mt-2">{value}</h3>
    </div>
  );
}