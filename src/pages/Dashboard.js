// src/pages/Dashboard.js
// FINAL PREMIUM PATCHED VERSION
// ✅ Nothing removed
// ✅ Daily + Weekly wages fixed
// ✅ Rolling AI insights with names + patterns
// ✅ Real manager alerts
// ✅ Full copy + paste ready

import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  userAPI,
  shiftAPI,
  holidayAPI,
  billingAPI,
} from "../services/api";

import { Loader2 } from "lucide-react";

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
  const [allShifts, setAllShifts] = useState([]);

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
        shifts,
      ] = await Promise.all([
        userAPI.getAll(),
        shiftAPI.getActiveAll(),
        holidayAPI.getAll(),
        billingAPI.getStatus(),
        shiftAPI.getAll(),
      ]);

      setStaff(users || []);
      setLive(active || []);
      setLeave(holidays || []);
      setPlan(billing?.plan || "free");
      setAllShifts(shifts || []);
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

  const gpsActive = live.filter(
    (x) => x.latitude && x.longitude
  ).length;

  const attendance = employees
    ? Math.round((clockedIn / employees) * 100)
    : 0;

  const pieData = [
    { name: "Present", value: clockedIn },
    { name: "Absent", value: absent },
    { name: "Leave", value: onLeave },
  ];

  const todayWages = getTodayWages(
    allShifts,
    staff
  );

  const weekWages = getWeekWages(
    allShifts,
    staff
  );

  const insights = buildInsights(
    allShifts,
    leave,
    staff
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white">

      <main className="px-8 py-7 space-y-5">

        {/* HEADER */}
        <div>
          <p className="text-sm text-gray-400">
            Dashboard
          </p>

          <h1 className="text-4xl font-bold mt-1">
            Good morning, {user.name}
          </h1>

          <p className="text-gray-400 mt-1">
            Live workforce intelligence powered by FieldSync AI.
          </p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-5 gap-4">

          <Card title="Employees" value={employees} sub="Active" />
          <Card title="Clocked In" value={clockedIn} sub="Now" />
          <Card title="On Leave" value={onLeave} sub="Today" />
          <Card title="GPS Active" value={gpsActive} sub="Live" />
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

          <Panel title="AI Workforce Insights">

            <div className="space-y-3">

              {insights.map((item, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-white/5 p-4"
                >
                  <p className="font-medium">
                    {item.title}
                  </p>

                  <p className="text-sm text-gray-400 mt-1">
                    {item.detail}
                  </p>
                </div>
              ))}

            </div>

          </Panel>

        </div>

      </main>
    </div>
  );
}

/* ================================================= */

function buildInsights(
  shifts,
  holidays,
  staff
) {
  const output = [];

  const late = {};
  const overtime = {};
  const sickness = {};

  shifts.forEach((row) => {
    if (!row.clock_in_time) return;

    const start = new Date(
      row.clock_in_time
    );

    const end = row.clock_out_time
      ? new Date(row.clock_out_time)
      : new Date();

    const hours =
      (end - start) / 3600000;

    if (
      start.getDay() === 1 &&
      start.getHours() >= 9
    ) {
      late[row.user_id] =
        (late[row.user_id] || 0) + 1;
    }

    if (hours > 10) {
      overtime[row.user_id] =
        (overtime[row.user_id] || 0) + 1;
    }
  });

  holidays.forEach((row) => {
    const reason = String(
      row.reason || ""
    ).toLowerCase();

    if (!reason.includes("sick"))
      return;

    sickness[row.user_id] =
      (sickness[row.user_id] || 0) + 1;
  });

  Object.entries(late).forEach(
    ([id, count]) => {
      if (count >= 3) {
        const person = staff.find(
          (x) => x.id === id
        );

        output.push({
          title: "Repeated Monday Lateness",
          detail: `${person?.name || "Staff"} has been late ${count} Mondays.`,
        });
      }
    }
  );

  Object.entries(overtime).forEach(
    ([id, count]) => {
      if (count >= 3) {
        const person = staff.find(
          (x) => x.id === id
        );

        output.push({
          title: "Overtime Risk",
          detail: `${person?.name || "Staff"} worked 10+ hour shifts ${count} times.`,
        });
      }
    }
  );

  Object.entries(sickness).forEach(
    ([id, count]) => {
      if (count >= 2) {
        const person = staff.find(
          (x) => x.id === id
        );

        output.push({
          title: "Recurring Absence Pattern",
          detail: `${person?.name || "Staff"} has reported sickness ${count} times.`,
        });
      }
    }
  );

  if (!output.length) {
    output.push({
      title: "No Risk Patterns",
      detail:
        "No unusual lateness, sickness or overtime trends detected.",
    });
  }

  return output.slice(0, 5);
}

/* ================================================= */

function getTodayWages(shifts, staff) {
  const today = new Date()
    .toISOString()
    .split("T")[0];

  let total = 0;

  shifts.forEach((row) => {
    if (!row.clock_in_time) return;

    const date =
      new Date(row.clock_in_time)
        .toISOString()
        .split("T")[0];

    if (date !== today) return;

    const user = staff.find(
      (u) => u.id === row.user_id
    );

    const rate = Number(
      user?.hourly_rate || 0
    );

    const start = new Date(
      row.clock_in_time
    );

    const end = row.clock_out_time
      ? new Date(row.clock_out_time)
      : new Date();

    total +=
      ((end - start) / 3600000) * rate;
  });

  return total.toFixed(2);
}

function getWeekWages(shifts, staff) {
  const weekAgo = new Date();
  weekAgo.setDate(
    weekAgo.getDate() - 7
  );

  let total = 0;

  shifts.forEach((row) => {
    if (!row.clock_in_time) return;

    const start = new Date(
      row.clock_in_time
    );

    if (start < weekAgo) return;

    const user = staff.find(
      (u) => u.id === row.user_id
    );

    const rate = Number(
      user?.hourly_rate || 0
    );

    const end = row.clock_out_time
      ? new Date(row.clock_out_time)
      : new Date();

    total +=
      ((end - start) / 3600000) * rate;
  });

  return total.toFixed(2);
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

function Card({ title, value, sub }) {
  return (
    <div className="rounded-3xl bg-white/5 p-5">
      <p className="text-sm text-gray-400">{title}</p>
      <h2 className="text-4xl font-bold mt-3">{value}</h2>
      <p className="text-sm text-gray-500 mt-2">{sub}</p>
    </div>
  );
}

function MoneyCard({ title, value }) {
  return (
    <div className="rounded-3xl bg-white/5 p-6">
      <p className="text-sm text-gray-400">{title}</p>
      <h2 className="text-4xl font-bold mt-4">£{value}</h2>
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