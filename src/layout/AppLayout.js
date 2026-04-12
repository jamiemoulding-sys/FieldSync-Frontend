import { useMemo, useState } from "react";
import {
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  motion,
  AnimatePresence,
} from "framer-motion";

import { useAuth } from "../hooks/useAuth";

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
  Bell,
  Megaphone,
  Search,
  Menu,
  Sparkles,
  ChevronRight,
  Crown,
  ShieldCheck,
  Rocket,
  ClipboardList,
} from "lucide-react";

export default function AppLayout() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    user,
    loading,
    logout,
  } = useAuth();

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState("");

  const role =
    user?.role ||
    "employee";

  const isPro =
    user?.isPro ||
    user?.is_pro ||
    false;

  const currentPlan =
    user?.current_plan ||
    "free";

  const subStatus =
    user?.subscription_status ||
    "free";

  const isTrial =
    subStatus ===
    "trialing";

  const menu = [
    {
      title: "CORE",
      items: [
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
            "Work Session",
          icon: Clock,
          path:
            "/work-session",
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
            "Tasks",
          icon:
            CheckSquare,
          path:
            "/tasks",
        },
      ],
    },

    {
      title:
        "MANAGEMENT",
      items: [
        {
          label:
            "Employees",
          icon:
            Users,
          path:
            "/employees",
          roles: [
            "manager",
            "admin",
          ],
        },
        {
          label:
            "Schedule",
          icon:
            Calendar,
          path:
            "/schedule",
          roles: [
            "manager",
            "admin",
          ],
        },
        {
          label:
            "Locations",
          icon:
            MapPin,
          path:
            "/locations",
          roles: [
            "manager",
            "admin",
          ],
        },
        {
          label:
            "Holiday Requests",
          icon:
            FileText,
          path:
            "/holiday-requests",
          roles: [
            "manager",
            "admin",
          ],
        },
        {
          label:
            "Announcements",
          icon:
            Megaphone,
          path:
            "/announcements",
          roles: [
            "manager",
            "admin",
          ],
        },
      ],
    },

    {
      title:
        "BUSINESS",
      items: [
        {
          label:
            "Reports",
          icon:
            BarChart3,
          path:
            "/reports",
          roles: [
            "admin",
          ],
        },
        {
          label:
            "Performance",
          icon:
            Sparkles,
          path:
            "/performance",
          roles: [
            "manager",
            "admin",
          ],
        },
      ],
    },

    {
      title:
        "ACCOUNT",
      items: [
        {
          label:
            "Profile",
          icon: User,
          path:
            "/profile",
        },
        {
          label:
            isPro
              ? "Manage Billing"
              : "Upgrade Plan",
          icon:
            CreditCard,
          path:
            "/billing",
          roles: [
            "admin",
          ],
        },
      ],
    },
  ];

  const filteredMenu =
    useMemo(() => {
      return menu
        .map(
          (group) => ({
            ...group,
            items:
              group.items.filter(
                (
                  item
                ) => {
                  const roleAllowed =
                    !item.roles ||
                    item.roles.includes(
                      role
                    );

                  const searchMatch =
                    item.label
                      .toLowerCase()
                      .includes(
                        search.toLowerCase()
                      );

                  return (
                    roleAllowed &&
                    searchMatch
                  );
                }
              ),
          })
        )
        .filter(
          (group) =>
            group.items
              .length >
            0
        );
    }, [
      role,
      search,
      isPro,
    ]);

  const pageTitle =
    menu
      .flatMap(
        (g) =>
          g.items
      )
      .find(
        (item) =>
          item.path ===
          location.pathname
      )?.label ||
    "Dashboard";

  const initials = (
    user?.name ||
    user?.email ||
    "U"
  )
    .charAt(0)
    .toUpperCase();

  if (loading)
    return null;

  if (!user)
    return null;

  const go = (
    path
  ) => {
    navigate(path);
    setMobileOpen(
      false
    );
  };

  const Sidebar = () => (
    <div className="h-full flex flex-col justify-between">

      <div className="overflow-y-auto">

        <div className="px-5 pt-5 pb-6">
          <div className="rounded-2xl p-[1px] bg-gradient-to-r from-indigo-500/40 to-cyan-500/20">
            <div className="rounded-2xl bg-[#0b1120] px-4 py-4">

              <div className="flex items-center justify-between">

                <div>
                  <h1 className="text-2xl font-bold">
                    FieldSync
                  </h1>

                  <p className="text-xs text-gray-400 mt-1">
                    Workforce OS
                  </p>
                </div>

                {isPro && (
                  <div className="text-yellow-400">
                    <Crown
                      size={20}
                    />
                  </div>
                )}

              </div>

            </div>
          </div>
        </div>

        <div className="px-4 pb-5">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs text-gray-400 uppercase">
                  Plan
                </p>

                <h3 className="text-lg font-semibold capitalize mt-1">
                  {currentPlan}
                </h3>
              </div>

              {isPro ? (
                <div className="text-green-400">
                  <ShieldCheck
                    size={20}
                  />
                </div>
              ) : (
                <div className="text-indigo-400">
                  <Rocket
                    size={20}
                  />
                </div>
              )}

            </div>

            <p className="text-xs text-gray-400 mt-2 capitalize">
              {subStatus}
            </p>

            {isTrial && (
              <div className="mt-3 text-xs rounded-xl bg-indigo-500/10 text-indigo-300 px-3 py-2">
                14 Day Trial Active
              </div>
            )}

            {!isPro &&
              role ===
                "admin" && (
                <button
                  onClick={() =>
                    go(
                      "/billing"
                    )
                  }
                  className="mt-4 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2"
                >
                  <Crown
                    size={16}
                  />
                  Upgrade Now
                </button>
              )}

          </div>
        </div>

        <div className="px-4 pb-6">
          {filteredMenu.map(
            (group) => (
              <div
                key={
                  group.title
                }
                className="mb-6"
              >
                <p className="text-[11px] uppercase tracking-[0.22em] text-gray-500 px-3 mb-2">
                  {
                    group.title
                  }
                </p>

                <div className="space-y-1">

                  {group.items.map(
                    (
                      item
                    ) => {
                      const Icon =
                        item.icon;

                      const active =
                        location.pathname ===
                        item.path;

                      return (
                        <motion.button
                          key={
                            item.path
                          }
                          whileHover={{
                            x: 4,
                          }}
                          whileTap={{
                            scale:
                              0.98,
                          }}
                          onClick={() =>
                            go(
                              item.path
                            )
                          }
                          className={`w-full flex items-center justify-between px-3 py-3 rounded-2xl transition ${
                            active
                              ? "bg-indigo-600 text-white"
                              : "text-gray-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              size={
                                18
                              }
                            />

                            <span className="text-sm font-medium">
                              {
                                item.label
                              }
                            </span>
                          </div>

                          {active && (
                            <ChevronRight
                              size={
                                16
                              }
                            />
                          )}
                        </motion.button>
                      );
                    }
                  )}

                </div>
              </div>
            )
          )}
        </div>
      </div>

      <div className="p-4 border-t border-white/5">

        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center font-semibold">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.name ||
                  user?.email}
              </p>

              <p className="text-xs text-gray-400 uppercase">
                {role}
              </p>
            </div>

          </div>

          <button
            onClick={
              logout
            }
            className="mt-4 w-full py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300"
          >
            Sign Out
          </button>

        </div>

      </div>
    </div>
  );

  return (
    <div className="h-screen bg-[#020617] text-white flex overflow-hidden">

      <aside className="hidden lg:block w-80 border-r border-white/5 bg-[#030712]">
        <Sidebar />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              onClick={() =>
                setMobileOpen(
                  false
                )
              }
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            />

            <motion.aside
              initial={{
                x: -320,
              }}
              animate={{
                x: 0,
              }}
              exit={{
                x: -320,
              }}
              className="fixed left-0 top-0 h-full w-80 bg-[#030712] z-50 lg:hidden"
            >
              <Sidebar />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col min-w-0">

        <header className="h-16 border-b border-white/5 px-4 md:px-6 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <button
              onClick={() =>
                setMobileOpen(
                  true
                )
              }
              className="lg:hidden"
            >
              <Menu
                size={18}
              />
            </button>

            <h1 className="font-semibold">
              {pageTitle}
            </h1>

          </div>

          <div className="hidden md:flex items-center gap-2">

            <Search
              size={16}
            />

            <input
              value={
                search
              }
              onChange={(
                e
              ) =>
                setSearch(
                  e.target
                    .value
                )
              }
              placeholder="Search..."
              className="bg-white/5 px-3 py-2 rounded-xl outline-none"
            />

          </div>

          <button className="p-2">
            <Bell
              size={18}
            />
          </button>

        </header>

        <section className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </section>

      </main>
    </div>
  );
}