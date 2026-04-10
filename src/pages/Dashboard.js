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

import { motion } from "framer-motion";

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
    <div className="space-y-6">

      {/* HERO */}
      <div className="relative h-44 rounded-2xl overflow-hidden group">

        <div
          className="absolute inset-0 bg-cover bg-center scale-105 group-hover:scale-110 transition duration-700"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1492724441997-5dc865305da7')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/80 to-[#020617]" />
        <div className="absolute inset-0 backdrop-blur-sm" />

        <div className="relative z-10 p-6 flex flex-col gap-2">

          <h1 className="text-2xl font-semibold tracking-tight">
            Good morning, {user?.name || "there"} 👋
          </h1>

          <p className="text-gray-400 text-sm">
            Here's what's happening today
          </p>

          <input
            placeholder="Search anything..."
            className="mt-2 max-w-xs bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4">
        <KPI title="Users" value={stats.users} />
        <KPI title="Active Staff" value={stats.activeShifts} />
        <KPI title="Tasks" value={stats.tasks} />
        <KPI title="Completed" value={stats.completedTasks} />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-2 gap-4">

        <GlowCard>
          <ChartWrapper title="Weekly Hours" value="Live">
            <ResponsiveContainer width="100%" height={90}>
              <LineChart data={hours}>
                <XAxis dataKey="date" stroke="#6b7280" fontSize={10} />
                <YAxis stroke="#6b7280" fontSize={10} />
                <Tooltip />
                <Line
                  dataKey="hours"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </GlowCard>

        <GlowCard>
          <ChartWrapper title="Top Performers">
            <ResponsiveContainer width="100%" height={90}>
              <BarChart data={topUsers}>
                <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
                <YAxis stroke="#6b7280" fontSize={10} />
                <Tooltip />
                <Bar dataKey="completed" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </GlowCard>

      </div>

      {/* ACTIVITY */}
      <GlowCard>
        <div className="flex justify-between mb-3">
          <h3 className="text-sm text-gray-300">Live Activity</h3>
          <span className="text-xs text-green-400">● Live</span>
        </div>

        <div className="space-y-2">
          {activity.map((a, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.015 }}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition"
            >
              {/* avatar */}
              <img
                src={`https://ui-avatars.com/api/?name=${a.name}`}
                className="w-8 h-8 rounded-full"
              />

              <div>
                <p className="text-sm font-medium">{a.name}</p>
                <p className="text-xs text-gray-400">{a.action}</p>
              </div>

              {/* live pulse */}
              <div className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-ping" />
            </motion.div>
          ))}
        </div>
      </GlowCard>

    </div>
  );
}

/* KPI CARD */

function KPI({ title, value }) {
  const data = [1, 3, 2, 4, 3, 5];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="relative rounded-2xl p-[1px] bg-gradient-to-b from-indigo-500/20 to-transparent"
    >
      <div className="bg-[#020617] border border-white/10 rounded-2xl p-4 shadow-[0_0_30px_rgba(99,102,241,0.15)]">

        <p className="text-gray-400 text-xs mb-1">{title}</p>

        <h2 className="text-xl font-semibold">{value || 0}</h2>

        {/* sparkline */}
        <ResponsiveContainer width="100%" height={25}>
          <LineChart data={data.map((v) => ({ v }))}>
            <Line
              dataKey="v"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>

      </div>
    </motion.div>
  );
}

/* CARD */

function GlowCard({ children }) {
  return (
    <div className="relative rounded-2xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
      <div className="bg-[#020617]/80 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-[0_0_50px_rgba(99,102,241,0.2)]">
        {children}
      </div>
    </div>
  );
}

/* CHART HEADER */

function ChartWrapper({ title, value, children }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <h3 className="text-xs text-gray-400">{title}</h3>
        {value && <span className="text-xs text-gray-500">{value}</span>}
      </div>
      {children}
    </div>
  );
}