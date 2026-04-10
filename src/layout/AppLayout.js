import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

import {
  LayoutDashboard,
  Clock,
  CheckSquare,
  Users,
  Calendar,
  MapPin,
  FileText,
  BarChart3,
  User,
  CreditCard,
} from "lucide-react";

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const menu = [
    {
      title: "CORE",
      items: [
        { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
        { label: "Work Session", icon: Clock, path: "/work-session" },
        { label: "Tasks", icon: CheckSquare, path: "/tasks" },
      ],
    },
    {
      title: "MANAGEMENT",
      items: [
        { label: "Employees", icon: Users, path: "/employees" },
        { label: "Schedule", icon: Calendar, path: "/schedule" },
        { label: "Locations", icon: MapPin, path: "/locations" },
        { label: "Holiday Requests", icon: FileText, path: "/holiday-requests" },
      ],
    },
    {
      title: "BUSINESS",
      items: [
        { label: "Reports", icon: BarChart3, path: "/reports" },
        { label: "Performance", icon: BarChart3, path: "/performance" },
      ],
    },
    {
      title: "ACCOUNT",
      items: [
        { label: "Profile", icon: User, path: "/profile" },
        { label: "Billing", icon: CreditCard, path: "/billing" },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-[#020617] text-white">

      {/* SIDEBAR */}
      <div className="w-64 relative bg-[#020617] border-r border-white/5 p-5 flex flex-col justify-between">

        {/* glow line */}
        <div className="absolute right-0 top-0 h-full w-[2px] bg-gradient-to-b from-indigo-500 via-transparent to-transparent opacity-40" />

        <div>
          <h2 className="text-xl font-semibold mb-6">FieldSync</h2>

          {menu.map((group, i) => (
            <div key={i} className="mb-6">
              <p className="text-xs text-gray-500 mb-2 tracking-wider">
                {group.title}
              </p>

              {group.items.map((item) => {
                const active = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <motion.button
                    key={item.path}
                    whileHover={{ x: 4 }}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg mb-1 text-sm transition
                      ${
                        active
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                          : "text-gray-400 hover:bg-white/5"
                      }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>

        {/* bottom */}
        <button
          onClick={() => navigate("/billing")}
          className="bg-indigo-600 hover:bg-indigo-500 rounded-xl p-2 text-sm transition"
        >
          Upgrade Plan
        </button>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">

        {/* TOPBAR */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#020617]/80 backdrop-blur-xl">

          <input
            placeholder="Search..."
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm w-72 outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div className="flex items-center gap-3">
            <div className="bg-white/5 px-3 py-1 rounded-lg text-sm">
              PRO
            </div>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>

      </div>
    </div>
  );
}