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

  const Sidebar = () => (
    <div className="h-full flex flex-col justify-between">

      <div>

        <div className="p-5 border-b border-white/5">
          <h1 className="text-2xl font-bold">
            FieldSync
          </h1>

          <p className="text-xs text-gray-400 mt-1">
            Workforce OS
          </p>
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
                    ? "bg-indigo-600 text-white"
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

        <div className="mb-4 text-sm">
          {user?.name}
        </div>

        <button
          onClick={logout}
          className="w-full py-3 rounded-xl bg-red-500/20 text-red-300"
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

      <main className="flex-1 flex flex-col">

        <header className="h-16 border-b border-white/5 px-5 flex items-center gap-4">

          <button
            className="lg:hidden"
            onClick={() =>
              setMobileOpen(
                !mobileOpen
              )
            }
          >
            <Menu size={18} />
          </button>

          <h1 className="font-semibold">
            {pageTitle}
          </h1>

        </header>

        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/70">
            <div className="w-80 h-full bg-[#030712]">
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