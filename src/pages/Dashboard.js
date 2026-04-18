// src/pages/Dashboard.js
// TRUE ELITE FINAL v3 FIXED
// ✅ Nothing removed
// ✅ Bugs fixed only
// ✅ Live map kept
// ✅ Charts width bug fixed
// ✅ Leaflet marker fix
// ✅ Safe loading
// ✅ Real data only
// ✅ Existing sections preserved

import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

import {
  shiftAPI,
  holidayAPI,
  reportAPI,
  billingAPI,
  taskAPI,
  userAPI,
} from "../services/api";

import {
  Users,
  Clock3,
  Briefcase,
  Plane,
  CreditCard,
  PoundSterling,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import {
  ResponsiveContainer,
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

import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* FIX LEAFLET ICON */
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ================================================= */

export default function Dashboard() {
  const { user, loading } = useAuth();

  if (loading || !user) return <Loading />;

  if (user.role === "admin") {
    return <MainDashboard user={user} admin />;
  }

  if (user.role === "manager") {
    return <MainDashboard user={user} />;
  }

  return <EmployeeDashboard user={user} />;
}

/* ================================================= */
/* EMPLOYEE */
/* ================================================= */

function EmployeeDashboard({ user }) {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [shift, setShift] = useState(null);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  async function load() {
    try {
      const [a, b, c] = await Promise.all([
        shiftAPI.getActive(),
        taskAPI.getAll(),
        holidayAPI.getMine(),
      ]);

      setShift(a || null);
      setTasks(Array.isArray(b) ? b : []);
      setHolidays(Array.isArray(c) ? c : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <Header
        title={`Welcome ${user.name}`}
        sub="Employee workspace"
      />

      <div className="grid md:grid-cols-4 gap-4">
        <Card
          title="Status"
          value={shift ? "Clocked In" : "Off Duty"}
          icon={<Clock3 size={16} />}
        />

        <Card
          title="Tasks"
          value={tasks.length}
          icon={<Briefcase size={16} />}
        />

        <Card
          title="Completed"
          value={tasks.filter((x) => x.completed).length}
          icon={<CheckCircle2 size={16} />}
        />

        <Card
          title="Holiday Requests"
          value={holidays.length}
          icon={<Plane size={16} />}
        />
      </div>

      <QuickActions
        items={[
          ["/tasks", "My Tasks"],
          ["/holidays", "My Holidays"],
          ["/timesheet", "My Hours"],
        ]}
      />
    </div>
  );
}

/* ================================================= */
/* ADMIN / MANAGER */
/* ================================================= */

function MainDashboard({ user, admin }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [staff, setStaff] = useState([]);
  const [live, setLive] = useState([]);
  const [plan, setPlan] = useState("free");
  const [updated, setUpdated] = useState("");

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  async function load() {
    try {
      const req = [
        reportAPI.getSummary(),
        userAPI.getAll(),
        shiftAPI.getActiveAll(),
      ];

      if (admin) req.push(billingAPI.getStatus());

      const res = await Promise.all(req);

      setStats(res[0] || {});
      setStaff(Array.isArray(res[1]) ? res[1] : []);
      setLive(Array.isArray(res[2]) ? res[2] : []);

      if (admin) {
        setPlan(res[3]?.plan || "free");
      }

      setUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loading />;

  const attendance =
    Number(stats.users) > 0
      ? Math.round(
          ((Number(stats.activeUsers) || 0) /
            Number(stats.users)) *
            100
        )
      : 0;

  const paid = staff.filter(
    (x) => Number(x.hourly_rate || 0) > 0
  ).length;

  const missingRates = staff.length - paid;

  const overContract = staff.filter(
    (x) =>
      Number(x.contracted_hours || 0) > 0 &&
      Number(x.week_hours || 0) >
        Number(x.contracted_hours || 0)
  ).length;

  const wageData = [
    {
      name: "Today",
      value: Number(stats.todayWages || 0),
    },
    {
      name: "Week",
      value: Number(stats.weekWages || 0),
    },
  ];

  const pieData = [
    { name: "Present", value: attendance },
    { name: "Away", value: 100 - attendance },
  ];

  return (
    <div className="space-y-6">
      <Header
        title={user.companyName}
        sub="Enterprise control centre"
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
          title="Clocked In"
          value={stats.activeUsers || 0}
          icon={<Clock3 size={16} />}
        />

        <Card
          title={admin ? "Plan" : "Completed"}
          value={
            admin
              ? plan
              : stats.completedTasks || 0
          }
          icon={
            admin ? (
              <CreditCard size={16} />
            ) : (
              <CheckCircle2 size={16} />
            )
          }
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card
          title="Today's Wages"
          value={
            paid
              ? `£${Number(
                  stats.todayWages || 0
                ).toFixed(2)}`
              : "No rates set"
          }
          icon={<PoundSterling size={16} />}
        />

        <Card
          title="Weekly Wages"
          value={
            paid
              ? `£${Number(
                  stats.weekWages || 0
                ).toFixed(2)}`
              : "No rates set"
          }
          icon={<CreditCard size={16} />}
        />
      </div>

      {missingRates > 0 && (
        <Warning>
          {missingRates} staff missing hourly
          rates.
        </Warning>
      )}

      {overContract > 0 && (
        <Warning>
          {overContract} staff above contracted
          hours.
        </Warning>
      )}

      <div className="grid lg:grid-cols-2 gap-4 min-w-0">
        <Panel title="Wage Trend">
          <ChartBox>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wageData}>
                <CartesianGrid stroke="#1e293b" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill="#6366f1"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Panel>

        <Panel title="Attendance">
          <ChartBox>
            <ResponsiveContainer width="100%" height="100%">
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

          <p className="text-center text-3xl font-bold mt-2">
            {attendance}%
          </p>
        </Panel>
      </div>

      <Panel title="Live Staff Map">
        <LiveMap live={live} />
      </Panel>

      <QuickActions
        items={[
          ["/employees", "Employees"],
          ["/schedule", "Schedule"],
          ["/timesheet", "Timesheets"],
          ["/holidays-admin", "Leave"],
        ]}
      />

      <Panel title="Live Updates">
        <div className="text-sm text-gray-400 flex gap-2 items-center">
          <RefreshCw size={14} />
          Last refresh {updated}
        </div>
      </Panel>
    </div>
  );
}

/* ================================================= */
/* MAP */
/* ================================================= */

/* ============================================== */
/* REPLACE ONLY LiveMap() */
/* Fixes:
   ✅ No marker when nobody clocked in
   ✅ Click marker shows FULL employee name
   ✅ Cleaner map fallback
============================================== */

function LiveMap({ live }) {
  const points = (live || []).filter(
    (x) =>
      x.latitude &&
      x.longitude &&
      !isNaN(Number(x.latitude)) &&
      !isNaN(Number(x.longitude))
  );

  const defaultCenter = [51.8892, 0.9042]; // Colchester

  const center = points.length
    ? [
        Number(points[0].latitude),
        Number(points[0].longitude),
      ]
    : defaultCenter;

  return (
    <div className="h-[420px] w-full rounded-2xl overflow-hidden border border-white/10">
      <MapContainer
        center={center}
        zoom={points.length ? 12 : 9}
        scrollWheelZoom={true}
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
        />

        {points.map((staff) => (
          <Marker
            key={staff.id}
            position={[
              Number(staff.latitude),
              Number(staff.longitude),
            ]}
          >
            <Popup>
              <div className="font-semibold">
                {staff.users?.name ||
                  staff.name ||
                  "Unknown Staff"}
              </div>

              <div className="text-xs text-gray-500 mt-1">
                Currently clocked in
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {!points.length && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/60 px-4 py-2 rounded-xl text-sm text-white">
            No staff currently clocked in
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================= */
/* UI */
/* ================================================= */

function QuickActions({ items }) {
  return (
    <Panel title="Quick Actions">
      <div className="grid md:grid-cols-4 gap-3">
        {items.map(([to, label]) => (
          <Link
            key={to}
            to={to}
            className="rounded-2xl bg-white/5 hover:bg-white/10 p-4 text-center"
          >
            {label}
          </Link>
        ))}
      </div>
    </Panel>
  );
}

function ChartBox({ children }) {
  return (
    <div className="h-[260px] w-full min-w-0">
      {children}
    </div>
  );
}

function Header({ title, sub }) {
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

function Card({ title, value, icon }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#020617] p-5">
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

function Panel({ title, children }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#020617] p-6">
      <h2 className="font-semibold mb-4 text-lg">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Warning({ children }) {
  return (
    <div className="rounded-xl px-4 py-3 bg-amber-500/10 text-amber-300 text-sm flex gap-2 items-center">
      <AlertTriangle size={16} />
      {children}
    </div>
  );
}

function Loading() {
  return (
    <div className="text-gray-400 flex gap-2 items-center">
      <Loader2
        size={16}
        className="animate-spin"
      />
      Loading dashboard...
    </div>
  );
}