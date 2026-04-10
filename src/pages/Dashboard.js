import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar
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
      <div className="w-64 bg-gradient-to-b from-[#020617] via-[#020617] to-[#0f172a] border-r border-[#1f2937] p-5 flex flex-col justify-between">

        <div>
          <h2 className="text-xl font-semibold mb-6">FieldSync</h2>

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

        <button className="bg-[#111827] border border-[#1f2937] rounded-lg p-2 text-gray-400 hover:text-white">
          Logout
        </button>
      </div>

      {/* MAIN */}
      <div className="flex-1 overflow-y-auto">

        {/* 🔥 HERO HEADER (THIS WAS MISSING) */}
        <div className="relative h-48 w-full overflow-hidden">

          {/* BACKGROUND IMAGE */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1504384308090-c894fdcc538d')"
            }}
          />

          {/* DARK OVERLAY */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#020617]/80 to-transparent" />

          {/* CONTENT */}
          <div className="relative z-10 flex justify-between items-center h-full px-8">

            <div>
              <h1 className="text-2xl font-semibold">
                Good morning, {user?.name || "there"} 👋
              </h1>
              <p className="text-gray-400">Real-time overview</p>
            </div>

            <div className="bg-[#0f172a]/80 backdrop-blur px-4 py-2 rounded-lg border border-[#1f2937]">
              {user?.email}
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="p-6 -mt-12 relative z-20">

          {/* KPI CARDS */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <KPI title="Users" value={stats.users} />
            <KPI title="Active Staff" value={stats.activeShifts} />
            <KPI title="Tasks" value={stats.tasks} />
            <KPI title="Completed" value={stats.completedTasks} />
          </div>

          {/* 🔥 CHARTS (SMALLER + TOP LIKE YOUR SCREENSHOT) */}
          <div className="grid grid-cols-2 gap-4 mb-6">

            <Card>
              <h3 className="mb-2 text-sm text-gray-400">Weekly Hours</h3>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={hours}>
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
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

            <Card>
              <h3 className="mb-2 text-sm text-gray-400">Top Performers</h3>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={topUsers}>
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

          </div>

          {/* ACTIVITY */}
          <Card>
            <h3 className="mb-4">Live Activity</h3>

            {activity.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 border-b border-[#1f2937]"
              >
                <img
                  src={`https://ui-avatars.com/api/?name=${a.name}`}
                  className="w-8 h-8 rounded-full"
                />

                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-sm text-gray-400">{a.action}</p>
                </div>

                <div className="ml-auto w-2 h-2 bg-green-500 rounded-full" />
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
      className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition
        ${active ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-[#111827]"}
      `}
    >
      {label}
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <p className="text-xs text-gray-500 mb-2">{title}</p>
      {children}
    </div>
  );
}

function KPI({ title, value }) {
  return (
    <div className="bg-[#0f172a] border border-[#1f2937] p-4 rounded-xl">
      <p className="text-gray-400 text-sm">{title}</p>
      <h2 className="text-xl font-semibold">{value || 0}</h2>
    </div>
  );
}

function Card({ children }) {
  return (
    <div className="bg-[#0f172a] border border-[#1f2937] p-4 rounded-xl shadow-lg">
      {children}
    </div>
  );
}