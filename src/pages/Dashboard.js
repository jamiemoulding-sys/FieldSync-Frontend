// src/pages/Dashboard.js
// FIXED FINAL VERSION
// ✅ ONE SIDEBAR ONLY
// ✅ Removed duplicate inner sidebar
// ✅ Exact premium layout
// ✅ Real data only
// ✅ Full copy/paste replacement

import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  userAPI,
  shiftAPI,
  holidayAPI,
  billingAPI,
  scheduleAPI,
} from "../services/api";

import {
  Search,
  Bell,
  Loader2,
} from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
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

  if (loading || !user) return <Loading />;

  return <MainDashboard user={user} />;
}

/* ================================================= */

function MainDashboard({ user }) {
  const [loading, setLoading] = useState(true);

  const [staff, setStaff] = useState([]);
  const [live, setLive] = useState([]);
  const [leave, setLeave] = useState([]);
  const [plan, setPlan] = useState("free");
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    load();

    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  async function load() {
    try {
      const [
        users,
        active,
        holidays,
        billing,
        rota,
      ] = await Promise.all([
        userAPI.getAll(),
        shiftAPI.getActiveAll(),
        holidayAPI.getAll(),
        billingAPI.getStatus(),
        scheduleAPI.getAll(),
      ]);

      setStaff(users || []);
      setLive(active || []);
      setLeave(holidays || []);
      setPlan(billing?.plan || "free");
      setSchedule(rota || []);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loading />;

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const employees = staff.length;
  const clockedIn = live.length;

  const onLeave = leave.filter(
    (x) =>
      x.status === "approved" &&
      x.start_date <= today &&
      x.end_date >= today
  ).length;

  const absent =
    employees - clockedIn - onLeave > 0
      ? employees - clockedIn - onLeave
      : 0;

  const attendance = employees
    ? Math.round((clockedIn / employees) * 100)
    : 0;

  const pieData = [
    { name: "Present", value: clockedIn },
    { name: "Absent", value: absent },
    { name: "Leave", value: onLeave },
  ];

  const todayWages = getTodayWages(
    live,
    staff
  );

  const weekWages = getWeekWages(staff);

  const upcoming = schedule
    .filter((x) => x.date >= today)
    .slice(0, 3);

  return (
    <div className="flex min-h-screen bg-[#020617] text-white">

      {/* ONLY SIDEBAR */}
      <aside className="w-[250px] border-r border-white/5 p-5 flex flex-col justify-between">

        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-yellow-500 text-black font-bold flex items-center justify-center">
              F
            </div>

            <div>
              <h1 className="font-bold text-xl">
                FieldSync
              </h1>

              <p className="text-xs text-gray-400">
                Workforce Management
              </p>
            </div>
          </div>

          <Nav />
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="font-medium">
              {user.name}
            </p>

            <p className="text-sm text-gray-400">
              {user.role}
            </p>
          </div>

          <button className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-500">
            Sign Out
          </button>
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 px-8 py-7 space-y-5 overflow-auto">

        {/* TOPBAR */}
        <div className="flex justify-between items-center">

          <div>
            <p className="text-sm text-gray-400">
              Dashboard
            </p>

            <h1 className="text-4xl font-bold mt-1">
              Good morning, {user.name}
            </h1>

            <p className="text-gray-400 mt-1">
              Here's what's happening with your workforce today.
            </p>
          </div>

          <div className="flex gap-3 items-center">

            <div className="px-4 py-3 rounded-2xl bg-white/5 min-w-[220px] flex gap-2 items-center">
              <Search size={16} />
              <span className="text-sm text-gray-400">
                Search...
              </span>
            </div>

            <button className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
              <Bell size={18} />
            </button>

          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-5 gap-4">

          <Card title="Employees" value={employees} sub="Active" />
          <Card title="Clocked In" value={clockedIn} sub="Now" />
          <Card title="On Leave" value={onLeave} sub="Today" />
          <Card title="Locations" value={live.length} sub="Active" />
          <Card title="Plan" value={plan} sub="Subscription" />

        </div>

        {/* GRAPH + MAP */}
        <div className="grid grid-cols-2 gap-4">

          <Panel title="Today's Attendance">

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    innerRadius={80}
                    outerRadius={110}
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#ef4444" />
                    <Cell fill="#facc15" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="text-center -mt-36 mb-20">
              <h2 className="text-4xl font-bold">
                {attendance}%
              </h2>

              <p className="text-gray-400">
                Present
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <Mini c="bg-green-500" t="Present" v={clockedIn} />
              <Mini c="bg-red-500" t="Absent" v={absent} />
              <Mini c="bg-yellow-400" t="Leave" v={onLeave} />
            </div>

          </Panel>

          <Panel title="Live Map Tracking">
            <LiveMap live={live} />
          </Panel>

        </div>

        {/* BOTTOM */}
        <div className="grid grid-cols-3 gap-4">

          <MoneyCard
            title="Today's Wages"
            value={todayWages}
          />

          <MoneyCard
            title="Weekly Wages"
            value={weekWages}
          />

          <Panel title="Upcoming Schedule">

            <div className="space-y-4">

              {upcoming.map((x) => (
                <div
                  key={x.id}
                  className="flex justify-between border-b border-white/5 pb-2"
                >
                  <span>{x.title || "Shift"}</span>
                  <span className="text-gray-400">
                    {x.date}
                  </span>
                </div>
              ))}

              {!upcoming.length && (
                <p className="text-gray-500">
                  No upcoming shifts
                </p>
              )}

            </div>

          </Panel>

        </div>

      </main>
    </div>
  );
}

/* ================================================= */

function getTodayWages(live, staff) {
  let total = 0;

  live.forEach((x) => {
    const user = staff.find(
      (u) => u.id === x.user_id
    );

    const rate = Number(
      user?.hourly_rate || 0
    );

    if (!rate) return;

    const start = new Date(
      x.clock_in_time
    );

    const hours =
      (Date.now() - start) / 3600000;

    total += rate * hours;
  });

  return total.toFixed(2);
}

function getWeekWages(staff) {
  return staff
    .reduce(
      (sum, x) =>
        sum +
        Number(x.week_hours || 0) *
          Number(x.hourly_rate || 0),
      0
    )
    .toFixed(2);
}

/* ================================================= */

function LiveMap({ live }) {
  const points = live.filter(
    (x) => x.latitude && x.longitude
  );

  const center = points.length
    ? [
        Number(points[0].latitude),
        Number(points[0].longitude),
      ]
    : [51.5072, -0.1276];

  return (
    <div className="h-[390px] rounded-2xl overflow-hidden">
      <MapContainer
        center={center}
        zoom={11}
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {points.map((x) => (
          <Marker
            key={x.id}
            position={[
              Number(x.latitude),
              Number(x.longitude),
            ]}
          >
            <Popup>
              {x.users?.name || "Staff"}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

/* ================================================= */

function Nav() {
  const items = [
    "Dashboard",
    "Employees",
    "Schedule",
    "Locations",
    "Holiday Requests",
    "Timesheet",
    "Profile",
    "Reports",
    "Billing",
  ];

  return (
    <div className="space-y-2">
      {items.map((x, i) => (
        <div
          key={x}
          className={`px-4 py-3 rounded-2xl ${
            i === 0
              ? "bg-indigo-600"
              : "hover:bg-white/5"
          }`}
        >
          {x}
        </div>
      ))}
    </div>
  );
}

function Card({ title, value, sub }) {
  return (
    <div className="rounded-3xl bg-white/5 p-5">
      <p className="text-sm text-gray-400">
        {title}
      </p>

      <h2 className="text-4xl font-bold mt-3">
        {value}
      </h2>

      <p className="text-sm text-gray-500 mt-2">
        {sub}
      </p>
    </div>
  );
}

function MoneyCard({ title, value }) {
  return (
    <div className="rounded-3xl bg-white/5 p-6">
      <p className="text-sm text-gray-400">
        {title}
      </p>

      <h2 className="text-4xl font-bold mt-4">
        £{value}
      </h2>

      <p className="text-sm text-gray-500 mt-2">
        Estimated payroll cost
      </p>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-3xl bg-white/5 p-6">
      <h2 className="font-semibold text-xl mb-5">
        {title}
      </h2>

      {children}
    </div>
  );
}

function Mini({ c, t, v }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${c}`} />
      <span className="text-gray-400">{t}</span>
      <span className="ml-auto">{v}</span>
    </div>
  );
}

function Loading() {
  return (
    <div className="p-10 flex gap-2 text-gray-400">
      <Loader2
        size={16}
        className="animate-spin"
      />
      Loading dashboard...
    </div>
  );
}