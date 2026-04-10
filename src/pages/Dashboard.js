import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

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
  const [activity, setActivity] = useState([]);
  const [topUsers, setTopUsers] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await api.get("/dashboard");
    const data = res?.data || {};

    setStats(data.stats || {});
    setHours(data.trends?.hours || []);
    setActivity(data.activity || []);
    setTopUsers(data.topPerformers || []);
  };

  return (
    <div className="flex h-screen bg-[#020617] text-white overflow-hidden">

      {/* SIDEBAR */}
      <div className="w-64 bg-gradient-to-b from-[#020617] via-[#020617] to-[#0f172a] border-r border-white/5 p-5 flex flex-col justify-between">

        <div>
          <h2 className="text-xl font-semibold mb-6 tracking-wide">FieldSync</h2>

          <Section title="CORE">
            <Nav label="Dashboard" active />
            <Nav label="Work Session" />
            <Nav label="Tasks" />
          </Section>

          <Section title="MANAGEMENT">
            <Nav label="Employees" />
            <Nav label="Schedule" />
            <Nav label="Locations" />
            <Nav label="Holiday Requests" />
            <Nav label="Timesheets" />
          </Section>

          <Section title="BUSINESS">
            <Nav label="Reports" />
            <Nav label="Performance" />
          </Section>

          <Section title="ACCOUNT">
            <Nav label="Profile" />
            <Nav label="Billing" />
          </Section>
        </div>

        <button className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-2 text-gray-400 hover:text-white transition">
          Logout
        </button>
      </div>

      {/* MAIN */}
      <div className="flex-1 overflow-y-auto">

        {/* HERO */}
        <div className="relative h-56 w-full overflow-hidden">

          {/* BG IMAGE */}
          <div
            className="absolute inset-0 bg-cover bg-center scale-105"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1492724441997-5dc865305da7')",
            }}
          />

          {/* OVERLAY */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/90 via-[#020617]/80 to-[#020617]" />

          {/* BLUR */}
          <div className="absolute inset-0 backdrop-blur-sm" />

          {/* CONTENT */}
          <div className="relative z-10 flex flex-col gap-4 px-8 pt-6">

            {/* TOP BAR */}
            <div className="flex justify-between items-center">

              {/* TITLE */}
              <div>
                <h1 className="text-3xl font-semibold">
                  Good morning, {user?.name || "there"} 👋
                </h1>
                <p className="text-gray-400 text-sm">Real-time overview</p>
              </div>

              {/* USER */}
              <div className="bg-white/5 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-lg">
                {user?.email}
              </div>
            </div>

            {/* SEARCH BAR */}
            <div className="w-full max-w-md">
              <input
                placeholder="Search..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 -mt-20 relative z-20">

          {/* KPI */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <KPI title="Users" value={stats.users} />
            <KPI title="Active Staff" value={stats.activeShifts} />
            <KPI title="Tasks" value={stats.tasks} />
            <KPI title="Completed" value={stats.completedTasks} />
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-2 gap-4 mb-6">

            <Card>
              <div className="flex justify-between mb-2">
                <h3 className="text-sm text-gray-400">Weekly Hours</h3>
                <span className="text-xs text-gray-500">
                  {Math.round(
                    hours.reduce((a, b) => a + Number(b.hours || 0), 0)
                  )} hrs
                </span>
              </div>

              <ResponsiveContainer width="100%" height={110}>
                <LineChart data={hours}>
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <div className="flex justify-between mb-2">
                <h3 className="text-sm text-gray-400">Top Performers</h3>
              </div>

              <ResponsiveContainer width="100%" height={110}>
                <BarChart data={topUsers}>
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#34d399" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

          </div>

          {/* ACTIVITY */}
          <Card>
            <h3 className="mb-4 text-sm text-gray-300">Live Activity</h3>

            {activity.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition mb-2"
              >
                <img
                  src={`https://ui-avatars.com/api/?name=${a.name}`}
                  className="w-9 h-9 rounded-full"
                />

                <div>
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-gray-400">{a.action}</p>
                </div>

                <div className="ml-auto w-2 h-2 bg-green-400 rounded-full" />
              </div>
            ))}
          </Card>

        </div>
      </div>
    </div>
  );
}

/* COMPONENTS */

function Nav({ label, active }) {
  return (
    <button
      className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition text-sm
        ${
          active
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
            : "text-gray-400 hover:bg-white/5"
        }
      `}
    >
      {label}
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <p className="text-[11px] text-gray-500 mb-2 tracking-wider">
        {title}
      </p>
      {children}
    </div>
  );
}

function KPI({ title, value }) {
  return (
    <div className="bg-gradient-to-br from-[#0f172a] to-[#020617] border border-white/10 p-4 rounded-xl shadow-md">

      <p className="text-gray-400 text-xs">{title}</p>

      <h2 className="text-2xl font-semibold mt-1">
        {value || 0}
      </h2>

      {/* subtle glow */}
      <div className="h-1 mt-2 bg-gradient-to-r from-indigo-500/40 to-transparent rounded-full" />
    </div>
  );
}

function Card({ children }) {
  return (
    <div className="relative rounded-2xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">

      <div className="bg-[#0f172a]/80 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        {children}
      </div>

    </div>
  );
}