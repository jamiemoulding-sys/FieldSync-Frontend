// src/pages/Dashboard.js
// FULL COMPLETE VERSION
// Original structure kept + fixes added

import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  shiftAPI,
  scheduleAPI,
  holidayAPI,
  reportAPI,
  billingAPI,
  taskAPI,
} from "../services/api";

import {
  Users,
  Clock3,
  CalendarDays,
  CreditCard,
  Briefcase,
  Plane,
  CheckCircle2,
  RefreshCw,
  Loader2,
  TimerReset,
  Activity,
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
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) return <Loading />;

  if (user.role === "admin") {
    return <AdminDashboard user={user} />;
  }

  if (user.role === "manager") {
    return <ManagerDashboard user={user} />;
  }

  return <EmployeeDashboard user={user} />;
}

/* ================================================= */
/* EMPLOYEE */
/* ================================================= */

function EmployeeDashboard({ user }) {
  const [loading, setLoading] = useState(true);
  const [shift, setShift] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [worked, setWorked] = useState(0);
  const [updated, setUpdated] = useState("");

  useEffect(() => {
    load();

    const refresh = setInterval(load, 30000);

    return () => clearInterval(refresh);
  }, []);

  useEffect(() => {
    let timer;

    if (shift?.clock_in_time) {
      timer = setInterval(() => {
        const start = new Date(
          shift.clock_in_time
        ).getTime();

        const now = Date.now();

        const breaks =
          shift.total_break_seconds || 0;

        const secs = Math.floor(
          (now - start) / 1000 - breaks
        );

        setWorked(Math.max(0, secs));
      }, 1000);
    } else {
      setWorked(0);
    }

    return () => clearInterval(timer);
  }, [shift]);

  async function load() {
    try {
      const [a, b, c, d] =
        await Promise.all([
          shiftAPI.getActive(),
          scheduleAPI.getMine(),
          holidayAPI.getMine(),
          taskAPI.getAll(),
        ]);

      setShift(a || null);

      setSchedule(
        Array.isArray(b) ? b : []
      );

      // FIX: Supabase may return {data}
      setHolidays(
        Array.isArray(c)
          ? c
          : c?.data || []
      );

      setTasks(
        Array.isArray(d) ? d : []
      );

      setUpdated(
        new Date().toLocaleTimeString()
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loading />;

  // FIX: Monday-Friday only
  const weekSchedule = schedule
    .filter((row) => {
      const day = new Date(
        row.date
      ).getDay();

      return day >= 1 && day <= 5;
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <Title
        title={`Welcome ${
          user.name || ""
        }`}
        sub={`${
          user.companyName ||
          "Company"
        } workspace`}
      />

      <div className="grid md:grid-cols-4 gap-4">
        <Card
          title="Status"
          value={
            shift
              ? "Clocked In"
              : "Off Duty"
          }
          icon={<Clock3 size={16} />}
        />

        <Card
          title="Worked Today"
          value={format(worked)}
          icon={
            <TimerReset size={16} />
          }
        />

        <Card
          title="Working Week"
          value={weekSchedule.length}
          icon={
            <CalendarDays
              size={16}
            />
          }
        />

        <Card
          title="Holiday Requests"
          value={holidays.length}
          icon={<Plane size={16} />}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Working Week">
          {weekSchedule.length ===
          0 ? (
            <p className="text-gray-400">
              No shifts booked
            </p>
          ) : (
            <div className="space-y-3">
              {weekSchedule.map(
                (row) => (
                  <div
                    key={row.id}
                    className="border border-white/10 rounded-xl p-3"
                  >
                    <p className="font-medium">
                      {row.date}
                    </p>

                    <p className="text-sm text-gray-400 mt-1">
                      {row.start_time?.slice(
                        11,
                        16
                      )}{" "}
                      -{" "}
                      {row.end_time?.slice(
                        11,
                        16
                      )}
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </Panel>

        <Panel title="Holiday Requests">
          {holidays.length === 0 ? (
            <p className="text-gray-400">
              No requests sent
            </p>
          ) : (
            <div className="space-y-3">
              {holidays
                .slice(0, 5)
                .map((row) => (
                  <div
                    key={row.id}
                    className="border border-white/10 rounded-xl p-3"
                  >
                    <p className="font-medium">
                      {row.start_date} →{" "}
                      {row.end_date}
                    </p>

                    <p className="text-xs text-gray-400 mt-1 capitalize">
                      {row.status ||
                        "pending"}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="My Tasks">
        {tasks.length === 0 ? (
          <p className="text-gray-400">
            No tasks assigned
          </p>
        ) : (
          <div className="space-y-3">
            {tasks
              .slice(0, 5)
              .map((task) => (
                <div
                  key={task.id}
                  className="border border-white/10 rounded-xl p-3"
                >
                  <p className="font-medium">
                    {task.title}
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    {task.completed
                      ? "Completed"
                      : "Open"}
                  </p>
                </div>
              ))}
          </div>
        )}
      </Panel>

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
/* MANAGER */
/* ================================================= */

function ManagerDashboard({
  user,
}) {
  const [loading, setLoading] =
    useState(true);

  const [stats, setStats] =
    useState({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const data =
        await reportAPI.getSummary();

      setStats(data || {});
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loading />;

  const taskData = [
    {
      name: "Open",
      value:
        (stats.tasks || 0) -
        (stats.completedTasks ||
          0),
    },
    {
      name: "Done",
      value:
        stats.completedTasks ||
        0,
    },
  ];

  return (
    <div className="space-y-6">
      <Title
        title={user.companyName}
        sub="Manager workspace"
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
          icon={
            <Briefcase size={16} />
          }
        />

        <Card
          title="Live Staff"
          value={
            stats.activeUsers || 0
          }
          icon={<Clock3 size={16} />}
        />

        <Card
          title="Completed"
          value={
            stats.completedTasks ||
            0
          }
          icon={
            <CheckCircle2
              size={16}
            />
          }
        />
      </div>

      <Panel title="Task Status">
        <ChartBox>
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={taskData}
            >
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

function AdminDashboard({
  user,
}) {
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

  if (loading) return <Loading />;

  const chartData = [
    {
      name: "Users",
      value: stats.users || 0,
    },
    {
      name: "Tasks",
      value: stats.tasks || 0,
    },
    {
      name: "Shifts",
      value: stats.shifts || 0,
    },
    {
      name: "Done",
      value:
        stats.completedTasks || 0,
    },
  ];

  const attendance =
    stats.users > 0
      ? Math.round(
          ((stats.activeUsers ||
            0) /
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

  return (
    <div className="space-y-6">
      <Title
        title={user.companyName}
        sub="Admin workspace"
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
          icon={
            <Briefcase size={16} />
          }
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
          icon={
            <CreditCard
              size={16}
            />
          }
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Business Activity">
          <ChartBox>
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart
                data={chartData}
              >
                <XAxis dataKey="name" />
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

        <Panel title="Attendance">
          <ChartBox>
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={85}
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

      <h2 className="text-2xl font-semibold mt-3">
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
    <div className="w-full min-w-0 h-[300px]">
      {children}
    </div>
  );
}

function format(sec) {
  const h = Math.floor(
    sec / 3600
  );

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