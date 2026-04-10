import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  CheckSquare,
  Users,
  MapPin,
  BarChart3,
  CreditCard,
  User
} from "lucide-react";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menu = [
    {
      section: "CORE",
      items: [
        { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { name: "Schedule", path: "/schedule", icon: Calendar },
        { name: "Holiday Requests", path: "/holiday-requests", icon: FileText },
        { name: "Tasks", path: "/tasks", icon: CheckSquare },
      ],
    },
    {
      section: "MANAGEMENT",
      items: [
        { name: "Employees", path: "/employees", icon: Users },
        { name: "Locations", path: "/locations", icon: MapPin },
      ],
    },
    {
      section: "BUSINESS",
      items: [
        { name: "Reports", path: "/reports", icon: BarChart3 },
        { name: "Performance", path: "/performance", icon: BarChart3 },
        { name: "Billing", path: "/billing", icon: CreditCard },
      ],
    },
    {
      section: "ACCOUNT",
      items: [
        { name: "Profile", path: "/profile", icon: User },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#020617] text-white">

      {/* SIDEBAR */}
      <div className="w-64 relative border-r border-white/5 p-5 flex flex-col justify-between">

        {/* glow strip */}
        <div className="absolute right-0 top-0 h-full w-[2px] bg-gradient-to-b from-indigo-500 via-transparent to-transparent opacity-40" />

        <div>
          <h2 className="text-xl font-semibold mb-6 tracking-tight">
            FieldSync
          </h2>

          {menu.map((group, i) => (
            <div key={i} className="mb-6">

              <p className="text-[11px] text-gray-500 mb-2 tracking-wider">
                {group.section}
              </p>

              {group.items.map((item) => {
                const active = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg mb-1 text-sm transition-all duration-200
                      ${
                        active
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                          : "text-gray-400 hover:bg-white/5 hover:text-white"
                      }
                    `}
                  >
                    <Icon size={16} />
                    {item.name}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* BOTTOM */}
        <div className="space-y-2">

          <button
            onClick={() => navigate("/billing")}
            className="w-full bg-indigo-600 hover:bg-indigo-500 transition rounded-xl py-2 text-sm shadow-lg shadow-indigo-500/20"
          >
            Upgrade Plan
          </button>

          <button
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2 text-sm text-gray-400 hover:text-white transition"
          >
            Logout
          </button>

        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">

        {/* TOP BAR */}
        <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 backdrop-blur-md bg-[#020617]/80">

          <p className="text-sm text-gray-400">
            Welcome back 👋
          </p>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs">
              PRO
            </div>
          </div>

        </div>

        {/* CONTENT */}
        <div className="p-6">
          {children}
        </div>

      </div>
    </div>
  );
}