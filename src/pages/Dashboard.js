// src/pages/Dashboard.js
// FULL PRO DASHBOARD REBUILD
// Preserves roles + adds:
// ✅ Modern SaaS graphs
// ✅ Live moving staff map
// ✅ Auto refresh
// ✅ Better cards
// ✅ Cleaner dark UI
// ✅ Employee / Manager / Admin dashboards
// ✅ Same file style + expandable

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
  MapPin,
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
  CartesianGrid,
} from "recharts";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

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
  const [loading, setLoading] =
    useState(true);

  const [shift, setShift] =
    useState(null);

  const [schedule, setSchedule] =
    useState([]);

  const [holidays, setHolidays] =
    useState([]);

  const [tasks, setTasks] =
    useState([]);

  const [worked, setWorked] =
    useState(0);

  const [updated, setUpdated] =
    useState("");

  useEffect(() => {
    load();

    const timer =
      setInterval(load, 30000);

    return () =>
      clearInterval(timer);
  }, []);

  useEffect(() => {
    let timer;

    if (shift?.clock_in_time) {
      timer = setInterval(() => {
        const start =
          new Date(
            shift.clock_in_time
          ).getTime();

        const now = Date.now();

        const secs = Math.floor(
          (now - start) / 1000 -
            (shift.total_break_seconds ||
              0)
        );

        setWorked(
          secs > 0 ? secs : 0
        );
      }, 1000);
    }

    return () =>
      clearInterval(timer);
  }, [shift]);

  async function load() {
    try {
      const [
        a,
        b,
        c,
        d,
      ] = await Promise.all([
        shiftAPI.getActive(),
        scheduleAPI.getMine(),
        holidayAPI.getMine(),
        taskAPI.getAll(),
      ]);

      setShift(a || null);
      setSchedule(b || []);
      setHolidays(c || []);
      setTasks(d || []);

      setUpdated(
        new Date().toLocaleTimeString()
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <Title
        title={`Welcome ${user.name}`}
        sub="Employee workspace"
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
          title="Tasks"
          value={tasks.length}
          icon={
            <Briefcase size={16} />
          }
        />

        <Card
          title="Holiday Requests"
          value={holidays.length}
          icon={<Plane size={16} />}
        />
      </div>

      <Panel title="My Tasks">
        {tasks
          .slice(0, 5)
          .map((x) => (
            <Row
              key={x.id}
              title={x.title}
              sub={
                x.completed
                  ? "Completed"
                  : "Open"
              }
            />
          ))}
      </Panel>

      <Panel title="Live Updates">
        <MiniRefresh
          updated={updated}
        />
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

  const [staff, setStaff] =
    useState([]);

  useEffect(() => {
    load();

    const timer =
      setInterval(load, 15000);

    return () =>
      clearInterval(timer);
  }, []);

  async function load() {
    try {
      const [
        summary,
        active,
      ] = await Promise.all([
        reportAPI.getSummary(),
        shiftAPI.getActiveAll(),
      ]);

      setStats(summary || {});
      setStaff(active || []);
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

      <StatsRow stats={stats} />

      <Panel title="Task Performance">
        <ModernBarChart
          data={taskData}
        />
      </Panel>

      <Panel title="Live Staff Map">
        <LiveMap staff={staff} />
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

  const [staff, setStaff] =
    useState([]);

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
      const [
        summary,
        bill,
        active,
      ] = await Promise.all([
        reportAPI.getSummary(),
        billingAPI.getStatus(),
        shiftAPI.getActiveAll(),
      ]);

      setStats(summary || {});
      setPlan(
        bill?.plan || "free"
      );
      setStaff(active || []);

      setUpdated(
        new Date().toLocaleTimeString()
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loading />;

  const areaData = [
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
      value:
        stats.shifts || 0,
    },
    {
      name: "Done",
      value:
        stats.completedTasks ||
        0,
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
      value:
        100 - attendance,
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
        <Panel title="Business Growth">
          <ModernAreaChart
            data={areaData}
          />
        </Panel>

        <Panel title="Attendance">
          <ModernPieChart
            data={pieData}
            value={attendance}
          />
        </Panel>
      </div>

      <Panel title="Live Staff Map">
        <LiveMap staff={staff} />
      </Panel>

      <Panel title="Live Updates">
        <MiniRefresh
          updated={updated}
        />
      </Panel>
    </div>
  );
}

/* ================================================= */
/* MODERN CHARTS */
/* ================================================= */

function ModernAreaChart({
  data,
}) {
  return (
    <ChartBox>
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient
              id="blue"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#6366f1"
                stopOpacity={0.9}
              />
              <stop
                offset="100%"
                stopColor="#6366f1"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke="#1e293b"
          />

          <XAxis
            dataKey="name"
            stroke="#64748b"
          />

          <YAxis
            stroke="#64748b"
          />

          <Tooltip
            contentStyle={{
              background:
                "#0f172a",
              border:
                "1px solid #334155",
              borderRadius:
                "14px",
            }}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke="#818cf8"
            strokeWidth={3}
            fill="url(#blue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}

function ModernBarChart({
  data,
}) {
  return (
    <ChartBox>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid
            stroke="#1e293b"
          />
          <XAxis
            dataKey="name"
            stroke="#64748b"
          />
          <YAxis
            stroke="#64748b"
          />
          <Tooltip
            contentStyle={{
              background:
                "#0f172a",
              border:
                "1px solid #334155",
              borderRadius:
                "14px",
            }}
          />
          <Bar
            dataKey="value"
            fill="#6366f1"
            radius={[
              12, 12, 0, 0,
            ]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}

function ModernPieChart({
  data,
  value,
}) {
  return (
    <>
      <ChartBox>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={70}
              outerRadius={95}
            >
              <Cell fill="#22c55e" />
              <Cell fill="#1e293b" />
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartBox>

      <p className="text-center text-3xl font-bold">
        {value}%
      </p>
    </>
  );
}

/* ================================================= */
/* LIVE MAP */
/* ================================================= */

function LiveMap({ staff }) {
  return (
    <div className="h-[420px] rounded-2xl overflow-hidden border border-white/10">
      <MapContainer
        center={[51.5072, -0.1276]}
        zoom={9}
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {staff.map((x) =>
          x.latitude &&
          x.longitude ? (
            <Marker
              key={x.id}
              position={[
                Number(
                  x.latitude
                ),
                Number(
                  x.longitude
                ),
              ]}
            >
              <Popup>
                {x.users?.name ||
                  "Staff"}
              </Popup>
            </Marker>
          ) : null
        )}
      </MapContainer>
    </div>
  );
}

/* ================================================= */

function StatsRow({
  stats,
}) {
  return (
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
        icon={<MapPin size={16} />}
      />
      <Card
        title="Completed"
        value={
          stats.completedTasks || 0
        }
        icon={
          <CheckCircle2
            size={16}
          />
        }
      />
    </div>
  );
}

function Loading() {
  return (
    <div className="text-gray-400 flex items-center gap-2">
      <Loader2
        size={18}
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
      <h1 className="text-3xl font-bold">
        {title}
      </h1>
      <p className="text-gray-400 mt-1">
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
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f172a] to-[#020617] p-5 shadow-xl">
      <div className="flex justify-between">
        <p className="text-xs text-gray-400">
          {title}
        </p>
        <div className="text-indigo-400">
          {icon}
        </div>
      </div>

      <h2 className="text-3xl font-bold mt-3">
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
    <div className="rounded-3xl border border-white/10 bg-[#020617] p-6 shadow-xl">
      <h2 className="font-semibold mb-4 text-lg">
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
    <div className="w-full h-[320px]">
      {children}
    </div>
  );
}

function MiniRefresh({
  updated,
}) {
  return (
    <div className="text-sm text-gray-400 flex items-center gap-2">
      <RefreshCw size={14} />
      Last refresh {updated}
    </div>
  );
}

function Row({
  title,
  sub,
}) {
  return (
    <div className="border border-white/10 rounded-2xl p-4 mb-3">
      <p className="font-medium">
        {title}
      </p>
      <p className="text-sm text-gray-400 mt-1">
        {sub}
      </p>
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