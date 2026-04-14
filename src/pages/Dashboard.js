// src/pages/Dashboard.js
// FINAL 100% REAL DATA VERSION
// No fake charts / launch ready / copy-paste ready

import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  shiftAPI,
  scheduleAPI,
  holidayAPI,
  reportAPI,
  billingAPI,
} from "../services/api";

import {
  Users,
  Clock3,
  CalendarDays,
  CreditCard,
  Activity,
  Briefcase,
  Plane,
  CheckCircle2,
  RefreshCw,
  Loader2,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/* ================================================= */

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return <Loading />;

  if (user.role === "admin") return <AdminDashboard />;
  if (user.role === "manager") return <ManagerDashboard />;

  return <EmployeeDashboard />;
}

/* ================================================= */
/* EMPLOYEE */
/* ================================================= */

function EmployeeDashboard() {
  const [loading, setLoading] = useState(true);
  const [shift, setShift] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [worked, setWorked] = useState(0);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let timer;

    if (shift?.clock_in_time) {
      timer = setInterval(() => {
        const start = new Date(
          shift.clock_in_time
        ).getTime();

        const now = Date.now();

        const breakSecs =
          shift.total_break_seconds || 0;

        setWorked(
          Math.floor(
            (now - start) / 1000 - breakSecs
          )
        );
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [shift]);

  async function load() {
    try {
      setLoading(true);

      const [a, b, c] =
        await Promise.all([
          shiftAPI.getActive(),
          scheduleAPI.getMine(),
          holidayAPI.getMine(),
        ]);

      setShift(a || null);
      setSchedule(
        Array.isArray(b) ? b : []
      );
      setHolidays(
        Array.isArray(c) ? c : []
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <Title
        title="Welcome Back"
        sub="Your personal workspace"
      />

      <div className="grid md:grid-cols-4 gap-4">
        <Card
          title="Status"
          value={
            shift ? "Clocked In" : "Offline"
          }
          icon={<Clock3 size={16} />}
        />

        <Card
          title="Worked Today"
          value={format(worked)}
          icon={<Activity size={16} />}
        />

        <Card
          title="Upcoming Shifts"
          value={schedule.length}
          icon={<CalendarDays size={16} />}
        />

        <Card
          title="Leave Requests"
          value={holidays.length}
          icon={<Plane size={16} />}
        />
      </div>

      <Panel title="Upcoming Schedule">
        {schedule.length === 0 ? (
          <p className="text-gray-400">
            No shifts scheduled
          </p>
        ) : (
          <div className="space-y-3">
            {schedule
              .slice(0, 5)
              .map((item) => (
                <div
                  key={item.id}
                  className="border border-white/10 rounded-xl p-4"
                >
                  <p className="font-medium">
                    {item.date}
                  </p>

                  <p className="text-sm text-gray-400">
                    {item.start_time?.slice(
                      11,
                      16
                    )}{" "}
                    -{" "}
                    {item.end_time?.slice(
                      11,
                      16
                    )}
                  </p>
                </div>
              ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ================================================= */
/* MANAGER */
/* ================================================= */

function ManagerDashboard() {
  const [loading, setLoading] =
    useState(true);

  const [stats, setStats] =
    useState({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);

      const data =
        await reportAPI.getSummary();

      setStats(data || {});
    } finally {
      setLoading(false);
    }
  }

  const taskData = [
    {
      name: "Open",
      value:
        (stats.tasks || 0) -
        (stats.completedTasks || 0),
    },
    {
      name: "Done",
      value:
        stats.completedTasks || 0,
    },
  ];

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <Title
        title="Manager Dashboard"
        sub="Team operations"
      />

      <div className="grid md:grid-cols-4 gap-4">
        <Card
          title="Employees"
          value={stats.users || 0}
          icon={<Users size={16} />}
        />

        <Card
          title="Tasks"
          value={stats.tasks || 0}
          icon={<Briefcase size={16} />}
        />

        <Card
          title="Live Staff"
          value={stats.activeUsers || 0}
          icon={<Clock3 size={16} />}
        />

        <Card
          title="Completed"
          value={
            stats.completedTasks || 0
          }
          icon={
            <CheckCircle2 size={16} />
          }
        />
      </div>

      <Panel title="Task Status">
        <ChartBox>
          <ResponsiveContainer>
            <BarChart data={taskData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="value"
                fill="#6366f1"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </Panel>
    </div>
  );
}

/* ================================================= */
/* ADMIN */
/* ================================================= */

function AdminDashboard() {
  const [loading, setLoading] =
    useState(true);

  const [stats, setStats] =
    useState({});

  const [plan, setPlan] =
    useState("free");

  const [updated, setUpdated] =
    useState("");

  useEffect(() => {
    load();

    const timer =
      setInterval(load, 15000);

    return () =>
      clearInterval(timer);
  }, []);

  async function load() {
    try {
      setLoading(true);

      const [summary, bill] =
        await Promise.all([
          reportAPI.getSummary(),
          billingAPI.getStatus(),
        ]);

      setStats(summary || {});
      setPlan(
        bill?.plan || "free"
      );

      setUpdated(
        new Date().toLocaleTimeString()
      );
    } finally {
      setLoading(false);
    }
  }

  const attendance =
    stats.users > 0
      ? Math.round(
          ((stats.activeUsers || 0) /
            stats.users) *
            100
        )
      : 0;

  const pieData = [
    {
      name: "Present",
      value: attendance,
    },
    {
      name: "Away",
      value: 100 - attendance,
    },
  ];

  const workloadData = [
    {
      name: "Tasks",
      value: stats.tasks || 0,
    },
    {
      name: "Completed",
      value:
        stats.completedTasks || 0,
    },
    {
      name: "Live",
      value:
        stats.activeUsers || 0,
    },
  ];

  const trendData = [
    {
      day: "Users",
      value: stats.users || 0,
    },
    {
      day: "Tasks",
      value: stats.tasks || 0,
    },
    {
      day: "Shifts",
      value: stats.shifts || 0,
    },
    {
      day: "Done",
      value:
        stats.completedTasks || 0,
    },
  ];

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <Title
        title="Admin Dashboard"
        sub="Real business analytics"
      />

      <div className="grid md:grid-cols-4 gap-4">
        <Card
          title="Staff"
          value={stats.users || 0}
          icon={<Users size={16} />}
        />

        <Card
          title="Tasks"
          value={stats.tasks || 0}
          icon={<Briefcase size={16} />}
        />

        <Card
          title="Clocked In"
          value={
            stats.activeUsers || 0
          }
          icon={<Clock3 size={16} />}
        />

        <Card
          title="Plan"
          value={plan}
          icon={<CreditCard size={16} />}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Panel title="Business Activity">
          <ChartBox>
            <ResponsiveContainer>
              <AreaChart
                data={trendData}
              >
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area
                  dataKey="value"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartBox>
        </Panel>

        <Panel title="Operations">
          <ChartBox>
            <ResponsiveContainer>
              <BarChart
                data={workloadData}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill="#22c55e"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Panel>

        <Panel title="Attendance">
          <ChartBox>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={55}
                  outerRadius={80}
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#1e293b" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>

          <p className="text-center text-2xl font-semibold">
            {attendance}%
          </p>
        </Panel>
      </div>

      <Panel title="Live Updates">
        <div className="text-sm text-gray-400 flex items-center gap-2">
          <RefreshCw size={14} />
          Last refresh {updated}
        </div>
      </Panel>
    </div>
  );
}

/* ================================================= */
/* COMPONENTS */
/* ================================================= */

function Loading() {
  return (
    <div className="text-gray-400 flex items-center gap-2">
      <Loader2
        size={16}
        className="animate-spin"
      />
      Loading dashboard...
    </div>
  );
}

function Title({
  title,
  sub,
}) {
  return (
    <div>
      <h1 className="text-3xl font-semibold">
        {title}
      </h1>

      <p className="text-sm text-gray-400 mt-1">
        {sub}
      </p>
    </div>
  );
}

function Card({
  title,
  value,
  icon,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#020617] p-5">
      <div className="flex justify-between">
        <p className="text-xs text-gray-400">
          {title}
        </p>

        <div className="text-indigo-400">
          {icon}
        </div>
      </div>

      <h2 className="text-2xl font-semibold mt-3 capitalize">
        {value}
      </h2>
    </div>
  );
}

function Panel({
  title,
  children,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#020617] p-6">
      <h2 className="font-semibold mb-4">
        {title}
      </h2>

      {children}
    </div>
  );
}

function ChartBox({
  children,
}) {
  return (
    <div style={{ height: 260 }}>
      {children}
    </div>
  );
}

function format(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor(
    (sec % 3600) / 60
  );
  const s = sec % 60;

  return `${String(h).padStart(
    2,
    "0"
  )}:${String(m).padStart(
    2,
    "0"
  )}:${String(s).padStart(
    2,
    "0"
  )}`;
}