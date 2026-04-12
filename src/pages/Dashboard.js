import {
  useState,
  useEffect,
} from "react";

import {
  useAuth,
} from "../hooks/useAuth";

import {
  managerAPI,
  shiftAPI,
  taskAPI,
  announcementAPI,
} from "../services/api";

import { motion } from "framer-motion";

import {
  Users,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  ArrowUpRight,
  Calendar,
  Timer,
  Coffee,
  Briefcase,
} from "lucide-react";

export default function Dashboard() {
  const { user } =
    useAuth();

  const [stats, setStats] =
    useState({
      staff: 0,
      active: 0,
      working: 0,
      onBreak: 0,
      tasks: 0,
      late: 0,
      breakMinutes: 0,
    });

  const [announcements, setAnnouncements] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadDashboard();

    const interval =
      setInterval(
        loadDashboard,
        30000
      );

    return () =>
      clearInterval(interval);
  }, []);

  const loadDashboard =
    async () => {
      try {
        setLoading(true);

        const [
          dashboard,
          activeShifts,
          tasks,
          notes,
        ] =
          await Promise.all([
            managerAPI.getDashboard(),
            shiftAPI.getAllActive(),
            taskAPI.getTasks(),
            announcementAPI.getAll(),
          ]);

        const shifts =
          Array.isArray(
            activeShifts
          )
            ? activeShifts
            : [];

        const onBreak =
          shifts.filter(
            (s) =>
              s.break_started_at
          ).length;

        const working =
          shifts.length -
          onBreak;

        const totalBreakSeconds =
          shifts.reduce(
            (
              total,
              item
            ) =>
              total +
              (item.total_break_seconds ||
                0),
            0
          );

        setStats({
          staff:
            dashboard
              ?.totalUsers ||
            dashboard
              ?.staff ||
            0,

          active:
            shifts.length,

          working,

          onBreak,

          tasks:
            Array.isArray(
              tasks
            )
              ? tasks.filter(
                  (t) =>
                    !t.completed
                ).length
              : 0,

          late:
            dashboard
              ?.late ||
            0,

          breakMinutes:
            Math.floor(
              totalBreakSeconds /
                60
            ),
        });

        setAnnouncements(
          Array.isArray(
            notes
          )
            ? notes.slice(
                0,
                4
              )
            : []
        );
      } catch {
        console.log(
          "dashboard fallback"
        );
      } finally {
        setLoading(false);
      }
    };

  const cards = [
    {
      title:
        "Total Staff",
      value:
        stats.staff,
      icon:
        <Users size={18} />,
      color:
        "from-indigo-500 to-indigo-600",
    },
    {
      title:
        "Clocked In",
      value:
        stats.active,
      icon:
        <Clock3 size={18} />,
      color:
        "from-emerald-500 to-emerald-600",
    },
    {
      title:
        "Working",
      value:
        stats.working,
      icon:
        <Briefcase
          size={18}
        />,
      color:
        "from-cyan-500 to-cyan-600",
    },
    {
      title:
        "On Break",
      value:
        stats.onBreak,
      icon:
        <Coffee size={18} />,
      color:
        "from-amber-500 to-amber-600",
    },
    {
      title:
        "Open Tasks",
      value:
        stats.tasks,
      icon:
        <CheckCircle2
          size={18}
        />,
      color:
        "from-sky-500 to-sky-600",
    },
    {
      title:
        "Late Today",
      value:
        stats.late,
      icon:
        <AlertCircle
          size={18}
        />,
      color:
        "from-red-500 to-red-600",
    },
    {
      title:
        "Break Mins",
      value:
        stats.breakMinutes,
      icon:
        <Timer size={18} />,
      color:
        "from-pink-500 to-pink-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* TOP */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <p className="text-sm text-gray-400">
            Welcome back
          </p>

          <h1 className="text-3xl font-semibold">
            {user?.name ||
              "User"}
          </h1>
        </div>

        <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-sm flex items-center gap-2">
          <Calendar
            size={16}
          />
          {new Date().toLocaleDateString(
            "en-GB"
          )}
        </div>
      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(
          (
            item,
            i
          ) => (
            <motion.div
              key={
                item.title
              }
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay:
                  i *
                  0.05,
              }}
              className="rounded-3xl p-[1px] bg-gradient-to-b from-white/10 to-transparent"
            >
              <div className="rounded-3xl border border-white/10 bg-[#020617] p-5">
                <div className="flex justify-between items-center">
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center`}
                  >
                    {
                      item.icon
                    }
                  </div>

                  <ArrowUpRight
                    size={16}
                    className="text-gray-500"
                  />
                </div>

                <h2 className="text-3xl font-semibold mt-5">
                  {loading
                    ? "--"
                    : item.value}
                </h2>

                <p className="text-sm text-gray-400 mt-1">
                  {
                    item.title
                  }
                </p>
              </div>
            </motion.div>
          )
        )}
      </div>

      {/* LOWER GRID */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* LIVE */}
        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-[#020617] p-6">
          <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
            <Timer
              size={18}
            />
            Live Activity
          </h2>

          <div className="space-y-4">
            <Row
              title="Staff clocked in"
              value={`${stats.active}`}
            />

            <Row
              title="Currently working"
              value={`${stats.working}`}
            />

            <Row
              title="Currently on break"
              value={`${stats.onBreak}`}
            />

            <Row
              title="Tasks pending"
              value={`${stats.tasks}`}
            />

            <Row
              title="Late arrivals"
              value={`${stats.late}`}
            />

            <Row
              title="Break mins today"
              value={`${stats.breakMinutes}`}
            />

            <Row
              title="Total users"
              value={`${stats.staff}`}
            />
          </div>
        </div>

        {/* NOTES */}
        <div className="rounded-3xl border border-white/10 bg-[#020617] p-6">
          <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
            <Megaphone
              size={18}
            />
            Announcements
          </h2>

          <div className="space-y-3">
            {announcements.length >
            0 ? (
              announcements.map(
                (
                  item,
                  i
                ) => (
                  <div
                    key={
                      i
                    }
                    className="rounded-2xl bg-white/5 border border-white/10 p-4"
                  >
                    <p className="text-sm">
                      {item.title ||
                        item.message ||
                        "Update"}
                    </p>
                  </div>
                )
              )
            ) : (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-sm text-gray-400">
                No announcements yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  title,
  value,
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
      <p className="text-sm text-gray-400">
        {title}
      </p>

      <p className="font-medium">
        {value}
      </p>
    </div>
  );
}