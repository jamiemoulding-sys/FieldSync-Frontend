// src/pages/Dashboard.js
// CLEAN COPY / PASTE VERSION
// ✅ Removed any sidebar / layout duplication
// ✅ Dashboard content only
// ✅ Uses AppLayout sidebar only
// ✅ Employee dashboard preserved
// ✅ Admin dashboard preserved
// ✅ Nothing else changed

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

import {
  userAPI,
  shiftAPI,
  holidayAPI,
  billingAPI,
  taskAPI,
  scheduleAPI,
} from "../services/api";

import {
  Loader2,
  Clock3,
  CalendarDays,
  CheckSquare,
  AlertTriangle,
} from "lucide-react";

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

  if (user.role === "employee") {
    return <EmployeeDashboard user={user} />;
  }

  return <AdminDashboard user={user} />;
}

/* ================================================= */
/* EMPLOYEE DASHBOARD */
/* FULL FIXED VERSION */
/* ✅ Negative hours fixed
/* ✅ Negative pay fixed
/* ✅ Route Replay removed (employee)
/* ✅ Leave remaining added
/* ✅ Weekly hours
/* ✅ Overtime
/* ✅ Estimated pay
/* ✅ This week's shifts
/* ✅ Clean professional layout
/* ================================================= */

function EmployeeDashboard({ user }) {
  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(true);

  const [shifts, setShifts] =
    useState([]);

  const [holidays, setHolidays] =
    useState([]);

  const [tasks, setTasks] =
    useState([]);

  const [activeShift, setActiveShift] =
    useState(null);

  useEffect(() => {
    load();

    const t = setInterval(load, 15000);

    return () => clearInterval(t);
  }, []);

  async function load() {
    try {
      const [
        allShifts,
        allHolidays,
        allTasks,
      ] = await Promise.all([
        shiftAPI.getAll(),
        holidayAPI.getAll(),
        taskAPI.getAll(),
      ]);

      const mine =
        (allShifts || []).filter(
          (x) =>
            String(x.user_id) ===
            String(user.id)
        );

      const myHolidays =
        (allHolidays || []).filter(
          (x) =>
            String(x.user_id) ===
            String(user.id)
        );

      const myTasks =
        (allTasks || []).filter((x) =>
          x.assigned_users?.includes(
            user.id
          )
        );

      const live = mine.find(
        (x) =>
          x.clock_in_time &&
          !x.clock_out_time
      );

      setShifts(mine);
      setHolidays(myHolidays);
      setTasks(myTasks);
      setActiveShift(live || null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loading />;

  /* ====================================== */
  /* WEEK START */
  /* ====================================== */

  const now = new Date();

  const startWeek = new Date(now);

  const day =
    startWeek.getDay() || 7;

  startWeek.setDate(
    startWeek.getDate() - day + 1
  );

  startWeek.setHours(0, 0, 0, 0);

  /* ====================================== */
  /* THIS WEEK SHIFTS */
  /* ====================================== */

  const weekShifts = shifts.filter(
    (row) =>
      row.clock_in_time &&
      new Date(
        row.clock_in_time
      ) >= startWeek
  );

  /* ====================================== */
  /* HOURS FIX */
  /* ====================================== */

  const totalHours = weekShifts.reduce(
    (sum, row) => {
      if (!row.clock_in_time)
        return sum;

      const start = new Date(
        row.clock_in_time
      );

      const end = row.clock_out_time
        ? new Date(
            row.clock_out_time
          )
        : new Date();

      const diff =
        (end - start) / 3600000;

      if (
        isNaN(diff) ||
        diff < 0
      )
        return sum;

      return sum + diff;
    },
    0
  );

  const weekHours =
    totalHours.toFixed(1);

  const overtime = Math.max(
    totalHours - 40,
    0
  ).toFixed(1);

  /* ====================================== */
  /* PAY */
  /* ====================================== */

  const hourlyRate = Number(
    user?.profile?.hourly_rate ||
      user?.profile?.hourly_wage ||
      user?.profile?.wage ||
      user?.profile?.pay_rate ||
      0
  );

  const estimatedPay = (
    totalHours * hourlyRate
  ).toFixed(2);

  /* ====================================== */
  /* LEAVE */
  /* ====================================== */

  const allowance =
    Number(
      user?.company
        ?.holiday_allowance
    ) || 20;

  const used = holidays
    .filter(
      (x) =>
        x.status === "approved"
    )
    .reduce(
      (sum, row) =>
        sum +
        Number(row.days || 1),
      0
    );

  const remaining =
    allowance - used;

  /* ====================================== */

  const pending =
    tasks.filter(
      (x) => !x.completed
    ).length;

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div>
        <p className="text-sm text-gray-400">
          Dashboard
        </p>

        <h1 className="text-3xl font-bold mt-1">
          Good morning, {user.name}
        </h1>
      </div>

      {/* CLOCK BUTTON */}

      <button
        onClick={() =>
          navigate("/work-session")
        }
        className="w-full py-5 rounded-3xl bg-indigo-600 text-lg font-semibold"
      >
        {activeShift
          ? "Resume Shift"
          : "Clock In"}
      </button>

      {/* TOP CARDS */}

      <div className="grid md:grid-cols-4 gap-4">

        <SmallCard
          title="Hours This Week"
          value={`${weekHours} hrs`}
          icon={<Clock3 size={18} />}
        />

        <SmallCard
          title="Overtime"
          value={`${overtime} hrs`}
          icon={<Clock3 size={18} />}
        />

        <SmallCard
          title="Pending Tasks"
          value={pending}
          icon={
            <CheckSquare size={18} />
          }
        />

        <SmallCard
          title="Est. Pay"
          value={`£${estimatedPay}`}
          icon={<Clock3 size={18} />}
        />

      </div>

      {/* LEAVE CARD */}

      <div className="rounded-3xl bg-white/5 p-6 border border-white/10">

        <div className="flex items-center justify-between">

          <p className="text-sm text-gray-400">
            Leave Remaining
          </p>

          <span className="text-xs px-3 py-1 rounded-full bg-indigo-600/20 text-indigo-300">
            {user?.company
              ?.holiday_year_type ===
            "tax"
              ? "Tax Year"
              : "Jan-Dec"}
          </span>

        </div>

        <div className="mt-4 flex items-end gap-2">

          <h2 className="text-5xl font-bold">
            {remaining}
          </h2>

          <p className="text-gray-400 mb-2">
            of {allowance} days
          </p>

        </div>

        <p className="text-sm text-gray-400 mt-2">
          {used} used this year
        </p>

        <div className="mt-4 h-3 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-green-500"
            style={{
              width: `${Math.max(
                (remaining /
                  allowance) *
                  100,
                0
              )}%`,
            }}
          />
        </div>

      </div>

      {/* THIS WEEK SHIFTS */}

      <div className="rounded-3xl bg-white/5 p-6">

        <h2 className="text-xl font-semibold mb-4">
          This Week's Shifts
        </h2>

        <div className="space-y-3 max-h-[320px] overflow-y-auto">

          {weekShifts.length ? (
            weekShifts.map((row) => {
              const start =
                new Date(
                  row.clock_in_time
                );

              const end =
                row.clock_out_time
                  ? new Date(
                      row.clock_out_time
                    )
                  : null;

              let hrs = "--";

              if (end) {
                const diff =
                  (end -
                    start) /
                  3600000;

                hrs =
                  diff > 0
                    ? diff.toFixed(1)
                    : "0.0";
              }

              return (
                <div
                  key={row.id}
                  className="grid grid-cols-3 gap-3 text-sm bg-white/5 rounded-2xl p-4"
                >
                  <span>
                    {start.toLocaleDateString(
                      "en-GB"
                    )}
                  </span>

                  <span>
                    {start.toLocaleTimeString(
                      "en-GB",
                      {
                        hour:
                          "2-digit",
                        minute:
                          "2-digit",
                      }
                    )}
                  </span>

                  <span className="text-indigo-300 text-right">
                    {hrs} hrs
                  </span>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-400">
              No shifts completed this week.
            </p>
          )}

        </div>

      </div>

    </div>
  );
}
/* ================================================= */
/* ADMIN DASHBOARD */
/* ================================================= */

function AdminDashboard({ user }) {
  const [loading, setLoading] =
    useState(true);

  const [staff, setStaff] =
    useState([]);

  const [live, setLive] =
    useState([]);

  const [leave, setLeave] =
    useState([]);

  const [plan, setPlan] =
    useState("starter");

  const [shifts, setShifts] =
    useState([]);

  const [schedules, setSchedules] =
    useState([]);

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
        allShifts,
        roster,
      ] = await Promise.all([
        userAPI.getAll(),
        shiftAPI.getActiveAll(),
        holidayAPI.getAll(),
        billingAPI.getStatus(),
        shiftAPI.getAll(),
        scheduleAPI.getAll(),
      ]);

      setStaff(users || []);
      setLive(active || []);
      setLeave(holidays || []);
      setPlan(
        billing?.plan || "starter"
      );
      setShifts(allShifts || []);
      setSchedules(roster || []);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loading />;

  const aiAlerts =
    buildAIAlerts(shifts, staff);

  const todayWages =
    estimateWages(shifts, staff, 1);

  const weekWages =
    estimateWages(shifts, staff, 7);

  return (
    <div className="space-y-6">

      <div>
        <p className="text-sm text-gray-400">
          Dashboard
        </p>

        <h1 className="text-4xl font-bold mt-1">
          Good morning, {user.name}
        </h1>
      </div>

      <div className="grid md:grid-cols-5 gap-4">

        <Card
          title="Employees"
          value={staff.length}
          sub="Total"
        />

        <Card
          title="Clocked In"
          value={live.length}
          sub="Now"
        />

        <Card
          title="Leave"
          value={
            leave.filter(
              (x) =>
                x.status ===
                "approved"
            ).length
          }
          sub="Approved"
        />

        <Card
          title="Plan"
          value={plan}
          sub="Subscription"
        />

        <Card
          title="AI Alerts"
          value={aiAlerts.length}
          sub="Detected"
        />

      </div>

      <div className="grid md:grid-cols-2 gap-4">

        <Panel title="Live Attendance">
          <AttendanceTable
            staff={staff}
            live={live}
            schedules={schedules}
          />
        </Panel>

        <Panel title="Live Staff Map">
          <LiveMap live={live} />
        </Panel>

      </div>

      <div className="grid md:grid-cols-2 gap-4">

        <MoneyCard
          title="Today's Wages"
          value={todayWages}
        />

        <MoneyCard
          title="Weekly Wages"
          value={weekWages}
        />

      </div>

    </div>
  );
}

/* ================================================= */

function AttendanceTable({
  staff,
  live,
  schedules,
}) {
  function timeOnly(v) {
    if (!v) return "--";

    if (String(v).includes("T")) {
      return new Date(v)
        .toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
    }

    return String(v).slice(0, 5);
  }

  function getStatus(emp) {
    const active = live.find(
      (x) =>
        String(x.user_id) ===
        String(emp.id)
    );

    const sched =
      schedules.find(
        (x) =>
          String(x.user_id) ===
          String(emp.id)
      );

    if (active) {
      const clocked =
        active.clock_in_time
          ? new Date(
              active.clock_in_time
            )
          : null;

      if (sched?.start_time) {
        const startToday =
          new Date();

        const [h, m] =
          sched.start_time
            .slice(0, 5)
            .split(":");

        startToday.setHours(
          Number(h),
          Number(m),
          0,
          0
        );

        const late =
          clocked &&
          clocked > startToday;

        return {
          status: late
            ? "Late"
            : "On Shift",
          color: late
            ? "text-amber-400"
            : "text-green-400",
          clock: timeOnly(
            active.clock_in_time
          ),
          schedule: `${timeOnly(
            sched.start_time
          )}-${timeOnly(
            sched.end_time
          )}`,
        };
      }

      return {
        status: "Unscheduled",
        color: "text-blue-400",
        clock: timeOnly(
          active.clock_in_time
        ),
        schedule: "--",
      };
    }

    if (sched?.start_time) {
      const now =
        new Date();

      const startToday =
        new Date();

      const [h, m] =
        sched.start_time
          .slice(0, 5)
          .split(":");

      startToday.setHours(
        Number(h),
        Number(m),
        0,
        0
      );

      const minsLate = Math.floor(
        (now - startToday) /
          60000
      );

      if (minsLate >= 60) {
        return {
          status: "Absent",
          color: "text-red-400",
          clock: "--",
          schedule: `${timeOnly(
            sched.start_time
          )}-${timeOnly(
            sched.end_time
          )}`,
        };
      }

      if (minsLate > 0) {
        return {
          status: `Late ${minsLate}m`,
          color: "text-amber-400",
          clock: "--",
          schedule: `${timeOnly(
            sched.start_time
          )}-${timeOnly(
            sched.end_time
          )}`,
        };
      }

      return {
        status: "Scheduled",
        color: "text-indigo-300",
        clock: "--",
        schedule: `${timeOnly(
          sched.start_time
        )}-${timeOnly(
          sched.end_time
        )}`,
      };
    }

    return {
      status: "Off",
      color: "text-gray-500",
      clock: "--",
      schedule: "--",
    };
  }

  return (
    <div className="space-y-2 max-h-[390px] overflow-y-auto pr-1">
      {staff.map((emp) => {
        const row =
          getStatus(emp);

        return (
          <div
            key={emp.id}
            className="grid grid-cols-4 gap-2 text-sm bg-white/5 rounded-xl p-3 items-center"
          >
            <span className="truncate font-medium">
              {emp.name}
            </span>

            <span className="text-center">
              {row.clock}
            </span>

            <span className="text-center text-xs">
              {row.schedule}
            </span>

            <span
              className={`text-right font-medium ${row.color}`}
            >
              {row.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function estimateWages(
  shifts,
  staff,
  days
) {
  let total = 0;

  shifts.forEach((row) => {
    if (!row.clock_in_time)
      return;

    const start = new Date(
      row.clock_in_time
    );

    const end =
      row.clock_out_time
        ? new Date(
            row.clock_out_time
          )
        : new Date();

    const emp = staff.find(
      (x) =>
        String(x.id) ===
        String(row.user_id)
    );

    const rate = Number(
      emp?.hourly_rate || 0
    );

    total +=
      ((end - start) /
        3600000) *
      rate;
  });

  return total.toFixed(2);
}

function buildAIAlerts(
  shifts,
  staff
) {
  const alerts = [];

  if (
    shifts.filter(
      (x) => !x.clock_out_time
    ).length > 5
  ) {
    alerts.push(
      "Multiple open shifts detected."
    );
  }

  if (
    staff.filter(
      (x) => !x.hourly_rate
    ).length
  ) {
    alerts.push(
      "Some staff missing wage rates."
    );
  }

  return alerts;
}

function LiveMap({ live }) {
  const points = live.filter(
    (x) =>
      x.latitude &&
      x.longitude
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

        {points.map((row) => (
          <Marker
            key={row.id}
            position={[
              Number(row.latitude),
              Number(row.longitude),
            ]}
          >
            <Popup>
              {row.users?.name ||
                "Staff"}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

/* ================================================= */

function SmallCard({
  title,
  value,
  icon,
}) {
  return (
    <div className="rounded-2xl bg-white/5 p-5">
      <p>{title}</p>
      <h2 className="text-2xl font-bold mt-3">
        {value}
      </h2>
    </div>
  );
}

function Card({
  title,
  value,
  sub,
}) {
  return (
    <div className="rounded-3xl bg-white/5 p-5">
      <p>{title}</p>
      <h2 className="text-4xl font-bold mt-3">
        {value}
      </h2>
      <p>{sub}</p>
    </div>
  );
}

function MoneyCard({
  title,
  value,
}) {
  return (
    <div className="rounded-3xl bg-white/5 p-6">
      <p>{title}</p>
      <h2 className="text-4xl font-bold mt-4">
        £{value}
      </h2>
    </div>
  );
}

function Panel({
  title,
  children,
}) {
  return (
    <div className="rounded-3xl bg-white/5 p-6">
      <h2 className="font-semibold text-xl mb-5">
        {title}
      </h2>
      {children}
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