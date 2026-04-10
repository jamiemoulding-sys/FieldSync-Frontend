import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Home, Users, Calendar, BarChart2, User, CreditCard
} from "lucide-react";

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
  const [topUsers, setTopUsers] = useState([]);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await api.get("/dashboard");
    const data = res?.data || {};

    setStats(data.stats || {});
    setHours(data.trends?.hours || []);
    setTopUsers(data.topPerformers || []);
    setActivity(data.activity || []);
  };

  return (
    <div className="flex h-screen">

      {/* SIDEBAR */}
      <div className="w-64 bg-gradient-to-b from-[#020617] to-[#0f172a] border-r border-border p-5">

        <h2 className="text-xl font-bold mb-6">FieldSync</h2>

        <Nav icon={<Home size={16} />} label="Dashboard" active />
        <Nav icon={<Users size={16} />} label="Employees" />
        <Nav icon={<Calendar size={16} />} label="Schedule" />

        <div className="my-4 border-t border-border" />

        <Nav icon={<BarChart2 size={16} />} label="Reports" />
        <Nav icon={<User size={16} />} label="Profile" />
        <Nav icon={<CreditCard size={16} />} label="Billing" />
      </div>

      {/* MAIN */}
      <div className="flex-1 p-6 overflow-y-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold">
              Good morning, {user?.name || "there"} 👋
            </h1>
            <p className="text-gray-400">Here’s your overview</p>
          </div>

          <div className="bg-card px-3 py-2 rounded-lg border border-border">
            {user?.email}
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="flex gap-3 mb-6">
          <ActionBtn text="Add Employee" />
          <ActionBtn text="Start Shift" />
          <ActionBtn text="Create Task" />
        </div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <KPI title="Users" value={stats.users} />
          <KPI title="Active" value={stats.activeShifts} />
          <KPI title="Tasks" value={stats.tasks} />
          <KPI title="Completed" value={stats.completedTasks} />
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-[1.5fr_1fr] gap-4 mb-6">

          <Card>
            <h3 className="mb-3">Weekly Hours</h3>

            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={hours}>
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Line
                  dataKey="hours"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="mb-3">Top Performers</h3>

            <ResponsiveContainer width="100%" height={180}>
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
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 p-3 border-b border-border"
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
            </motion.div>
          ))}
        </Card>

      </div>
    </div>
  );
}

/* COMPONENTS */

function Nav({ icon, label, active }) {
  return (
    <button
      className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg mb-1 transition
        ${active ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-card"}
      `}
    >
      {icon}
      {label}
    </button>
  );
}

function KPI({ title, value }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-card p-4 rounded-xl border border-border"
    >
      <p className="text-gray-400 text-sm">{title}</p>
      <h2 className="text-xl font-semibold">{value || 0}</h2>
    </motion.div>
  );
}

function Card({ children }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="bg-card p-4 rounded-xl border border-border shadow-lg"
    >
      {children}
    </motion.div>
  );
}

function ActionBtn({ text }) {
  return (
    <button className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm">
      {text}
    </button>
  );
}