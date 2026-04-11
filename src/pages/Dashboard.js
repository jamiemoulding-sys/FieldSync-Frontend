import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export default function Dashboard() {
  const { user } = useAuth() || {};

  const [stats, setStats] = useState({});
  const [hours, setHours] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [aiFeed, setAiFeed] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [dashRes, msgRes] = await Promise.all([
        api.get("/dashboard"),
        api.get("/announcements"),
      ]);

      const data = dashRes?.data || {};

      setStats(data.stats || {});
      setHours(data.trends?.hours || []);
      setTopUsers(data.topPerformers || []);
      setActivity(data.activity || []);
      setAiFeed(data.aiFeed || []);
      setAnnouncements(msgRes?.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const goTo = (path) => {
    window.location.href = path;
  };

  return (
    <div className="space-y-6">

      {/* GLOBAL ANNOUNCEMENTS */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          {announcements.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border ${
                item.priority === "critical"
                  ? "bg-red-500/10 border-red-500/30"
                  : item.priority === "warning"
                  ? "bg-yellow-500/10 border-yellow-500/30"
                  : "bg-indigo-500/10 border-indigo-500/30"
              }`}
            >
              <div className="flex justify-between items-center gap-3">
                <div>
                  <p className="font-semibold text-sm">
                    📢 {item.title}
                  </p>

                  <p className="text-sm text-gray-300 mt-1">
                    {item.message}
                  </p>
                </div>

                {(user?.role === "admin" ||
                  user?.role === "manager") && (
                  <button
                    onClick={() => goTo("/announcements")}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs"
                  >
                    Manage
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SEND MESSAGE BUTTON */}
      {(user?.role === "admin" ||
        user?.role === "manager") && (
        <button
          onClick={() => goTo("/announcements")}
          className="w-full rounded-2xl py-3 bg-indigo-600 hover:bg-indigo-500 transition font-medium"
        >
          📢 Send Global Message
        </button>
      )}

      {/* TOP SECTION */}
      <div className="grid grid-cols-3 gap-4">

        {/* HERO */}
        <div className="col-span-2 rounded-2xl p-6 border border-white/10 bg-gradient-to-br from-indigo-600/20 to-transparent">

          <h1 className="text-3xl font-semibold">
            👋 Welcome back, {user?.name || "there"}
          </h1>

          <p className="text-sm text-gray-400 mt-2">
            {stats.activeShifts || 0} active • {stats.late || 0} late •{" "}
            {stats.tasks || 0} tasks
          </p>

          <div className="flex gap-3 mt-5">

            <ActionBtn
              label="+ Employee"
              onClick={() => goTo("/employees")}
            />

            <ActionBtn
              label="+ Shift"
              onClick={() => goTo("/schedule")}
            />

            <ActionBtn
              label="Invite"
              onClick={() => goTo("/employees")}
            />

          </div>

        </div>

        {/* INFO PANEL */}
        <Card title="Information Point">

          <div className="space-y-3 text-sm">

            <InfoRow label="🟢 Server" value="Online" />
            <InfoRow label="👥 Users" value={stats.users || 0} />
            <InfoRow
              label="📅 Shifts Today"
              value={stats.shiftsToday || 0}
            />
            <InfoRow
              label="⚠️ Late Staff"
              value={stats.late || 0}
            />
            <InfoRow
              label="📨 Requests"
              value={stats.pendingHolidays || 0}
            />
            <InfoRow label="💳 Status" value="Active" />

          </div>

        </Card>

      </div>

      {/* AI FEED */}
      <Card title="AI Operations Feed">

        <div className="space-y-2">

          {aiFeed.length === 0 && (
            <p className="text-sm text-gray-400">
              No issues detected today
            </p>
          )}

          {aiFeed.map((item, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-sm"
            >
              {item}
            </div>
          ))}

        </div>

      </Card>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4">

        <KPI title="Active Now" value={stats.activeShifts} />
        <KPI title="Hours Today" value={stats.hoursToday} />
        <KPI title="Shifts Today" value={stats.shiftsToday} />
        <KPI title="Issues" value={stats.issues} />

      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-2 gap-4">

        <Card title="Weekly Hours">

          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={hours}>
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                fontSize={10}
              />
              <YAxis stroke="#6b7280" fontSize={10} />
              <Tooltip />
              <Line
                dataKey="hours"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>

        </Card>

        <Card title="Productivity Ranking">

          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={topUsers}>
              <XAxis
                dataKey="name"
                stroke="#6b7280"
                fontSize={10}
              />
              <YAxis stroke="#6b7280" fontSize={10} />
              <Tooltip />
              <Bar dataKey="shifts" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>

        </Card>

      </div>

      {/* LIVE STAFF */}
      <Card title="Live Workforce">

        <div className="space-y-2">

          {activity.length === 0 && (
            <p className="text-sm text-gray-500">
              No recent activity
            </p>
          )}

          {activity.map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5"
            >

              <img
                src={`https://ui-avatars.com/api/?name=${a.name}`}
                className="w-8 h-8 rounded-full"
              />

              <div>
                <p className="text-sm">{a.name}</p>
                <p className="text-xs text-gray-400">
                  {a.action}
                </p>
              </div>

            </div>
          ))}

        </div>

      </Card>

      {/* SIGN OUT */}
      <button
        onClick={logout}
        className="w-full rounded-2xl py-4 bg-red-500 hover:bg-red-600 transition font-medium"
      >
        Sign Out
      </button>

    </div>
  );
}

/* COMPONENTS */

function KPI({ title, value }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="p-4 rounded-2xl bg-[#020617] border border-white/10"
    >
      <p className="text-gray-400 text-xs">{title}</p>
      <h2 className="text-2xl mt-1">{value || 0}</h2>
    </motion.div>
  );
}

function Card({ title, children }) {
  return (
    <div className="p-4 rounded-2xl bg-[#020617]/80 border border-white/10">
      <h3 className="text-xs text-gray-400 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function ActionBtn({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition text-sm"
    >
      {label}
    </button>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between border-b border-white/5 pb-2">
      <span className="text-gray-400">{label}</span>
      <span>{value}</span>
    </div>
  );
}