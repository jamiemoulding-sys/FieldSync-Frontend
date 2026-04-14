/* =========================================================
src/layout/AppLayout.js
ELITE UPGRADED VERSION
FULL COPY / PASTE FILE

UPGRADES INCLUDED
✅ Premium top navbar
✅ Search bar
✅ Notification bell
✅ Trial banner
✅ Better sidebar
✅ Mobile slide menu
✅ User profile card
✅ Cleaner SaaS layout
========================================================= */

import { useMemo, useState } from "react";
import {
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

import {
  LayoutDashboard,
  Clock,
  ClipboardList,
  CheckSquare,
  Users,
  Calendar,
  MapPin,
  FileText,
  BarChart3,
  User,
  CreditCard,
  Menu,
  ChevronRight,
  Plane,
  Bell,
  Search,
  X,
  Sparkles,
} from "lucide-react";

export default function AppLayout() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    user,
    logout,
  } = useAuth();

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const role =
    user?.role ||
    "employee";

  const isAdmin =
    role === "admin";

  const isManager =
    role === "manager";

  const employeeMenu = [
    {
      label:
        "Dashboard",
      icon:
        LayoutDashboard,
      path:
        "/dashboard",
    },
    {
      label:
        "Clock In / Out",
      icon: Clock,
      path:
        "/work-session",
    },
    {
      label:
        "My Schedule",
      icon:
        Calendar,
      path:
        "/my-schedule",
    },
    {
      label:
        "My Holidays",
      icon:
        Plane,
      path:
        "/my-holidays",
    },
    {
      label:
        "Locations",
      icon:
        MapPin,
      path:
        "/my-locations",
    },
    {
      label:
        "Tasks",
      icon:
        CheckSquare,
      path:
        "/tasks",
    },
    {
      label:
        "Profile",
      icon: User,
      path:
        "/profile",
    },
  ];

  const managerMenu = [
    {
      label:
        "Dashboard",
      icon:
        LayoutDashboard,
      path:
        "/dashboard",
    },
    {
      label:
        "Schedule",
      icon:
        Calendar,
      path:
        "/schedule",
    },
    {
      label:
        "Employees",
      icon:
        Users,
      path:
        "/employees",
    },
    {
      label:
        "Locations",
      icon:
        MapPin,
      path:
        "/locations",
    },
    {
      label:
        "Holiday Requests",
      icon:
        FileText,
      path:
        "/holiday-requests",
    },
    {
      label:
        "Timesheet",
      icon:
        ClipboardList,
      path:
        "/timesheet",
    },
    {
      label:
        "Profile",
      icon: User,
      path:
        "/profile",
    },
  ];

  const adminMenu = [
    ...managerMenu,
    {
      label:
        "Reports",
      icon:
        BarChart3,
      path:
        "/reports",
    },
    {
      label:
        "Billing",
      icon:
        CreditCard,
      path:
        "/billing",
    },
  ];

  const menu =
    useMemo(() => {
      if (isAdmin)
        return adminMenu;

      if (isManager)
        return managerMenu;

      return employeeMenu;
    }, [role]);

  const go = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const pageTitle =
    menu.find(
      (item) =>
        item.path ===
        location.pathname
    )?.label ||
    "Dashboard";

  const trial =
    user?.subscription_status !==
      "active" &&
    role === "admin";

  const Sidebar = () => (
    <div className="h-full flex flex-col justify-between">

      <div>

        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center">
              <Sparkles size={18} />
            </div>

            <div>
              <h1 className="text-xl font-bold">
                FieldSync
              </h1>

              <p className="text-xs text-gray-400">
                Workforce OS
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-2">

          {menu.map((item) => {
            const Icon =
              item.icon;

            const active =
              location.pathname ===
              item.path;

            return (
              <button
                key={item.path}
                onClick={() =>
                  go(
                    item.path
                  )
                }
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition ${
                  active
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={18}
                  />

                  <span>
                    {
                      item.label
                    }
                  </span>
                </div>

                {active && (
                  <ChevronRight
                    size={16}
                  />
                )}
              </button>
            );
          })}

        </div>

      </div>

      <div className="p-4 border-t border-white/5">

        <div className="rounded-2xl bg-white/5 p-4 mb-4">
          <p className="text-sm font-medium">
            {user?.name ||
              "User"}
          </p>

          <p className="text-xs text-gray-400 mt-1 capitalize">
            {role}
          </p>
        </div>

        <button
          onClick={logout}
          className="w-full py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300"
        >
          Sign Out
        </button>

      </div>

    </div>
  );

  return (
    <div className="h-screen bg-[#020617] text-white flex">

      <aside className="hidden lg:block w-80 border-r border-white/5 bg-[#030712]">
        <Sidebar />
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">

        {trial && (
          <div className="px-5 py-3 border-b border-amber-500/20 bg-amber-500/10 text-amber-300 text-sm flex items-center justify-between">
            <span>
              Free trial active —
              unlock premium
              features
            </span>

            <button
              onClick={() =>
                navigate(
                  "/billing"
                )
              }
              className="px-3 py-1 rounded-lg bg-amber-400 text-black font-medium"
            >
              Upgrade
            </button>
          </div>
        )}

        <header className="h-16 border-b border-white/5 px-5 flex items-center justify-between gap-4">

          <div className="flex items-center gap-4">

            <button
              className="lg:hidden"
              onClick={() =>
                setMobileOpen(
                  true
                )
              }
            >
              <Menu size={18} />
            </button>

            <div>
              <h1 className="font-semibold">
                {pageTitle}
              </h1>

              <p className="text-xs text-gray-500">
                Welcome back
              </p>
            </div>

          </div>

          <div className="flex items-center gap-3">

            <div className="hidden md:flex items-center gap-2 px-4 h-11 rounded-xl bg-white/5 border border-white/10 min-w-[260px]">
              <Search
                size={15}
                className="text-gray-500"
              />

              <input
                placeholder="Search..."
                className="bg-transparent outline-none text-sm w-full"
              />
            </div>

            <button className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative">
              <Bell size={17} />

              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
            </button>

            <button
              onClick={() =>
                navigate(
                  "/profile"
                )
              }
              className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center font-semibold"
            >
              {(
                user?.name ||
                "U"
              )
                .charAt(0)
                .toUpperCase()}
            </button>

          </div>

        </header>

        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/70">

            <div className="w-80 h-full bg-[#030712] border-r border-white/5 relative">

              <button
                onClick={() =>
                  setMobileOpen(
                    false
                  )
                }
                className="absolute top-4 right-4 text-gray-400"
              >
                <X size={18} />
              </button>

              <Sidebar />

            </div>

          </div>
        )}

        <section className="flex-1 overflow-y-auto p-5">
          <Outlet />
        </section>

      </main>

    </div>
  );
}