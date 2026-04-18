// src/pages/Schedule.jsx
// COMPLETE FINAL VERSION
// COPY / PASTE READY
// ✅ Nothing removed
// ✅ Global calendar
// ✅ Individual employee calendar
// ✅ Bulk scheduling restored
// ✅ Preset shift hours
// ✅ Holidays replace shifts
// ✅ Holiday allowance warnings
// ✅ KPI cards
// ✅ Wage totals
// ✅ Auto refresh
// ✅ Premium layout

import { useEffect, useState } from "react";
import {
  userAPI,
  scheduleAPI,
  holidayAPI,
} from "../services/api";

import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Loader2,
  Plus,
  Plane,
  CalendarDays,
  AlertTriangle,
  PoundSterling,
  Users,
  Clock3,
} from "lucide-react";

export default function Schedule() {
  const [users, setUsers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [holidays, setHolidays] = useState([]);

  const [loading, setLoading] = useState(true);

  const [selectedDay, setSelectedDay] =
    useState(null);

  const [viewMode, setViewMode] =
    useState("global");

  const [selectedUser, setSelectedUser] =
    useState("");

  const [form, setForm] = useState({
    user_id: "",
    date: "",
    start: "",
    end: "",
  });

  const [month, setMonth] = useState(
    new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    )
  );

  const shiftPresets = [
    {
      label: "8:00 - 16:00",
      start: "08:00",
      end: "16:00",
    },
    {
      label: "9:00 - 17:00",
      start: "09:00",
      end: "17:00",
    },
    {
      label: "10:00 - 18:00",
      start: "10:00",
      end: "18:00",
    },
    {
      label: "12:00 - 20:00",
      start: "12:00",
      end: "20:00",
    },
  ];

  useEffect(() => {
    load();

    const timer = setInterval(
      load,
      30000
    );

    return () =>
      clearInterval(timer);
  }, []);

  async function load() {
    try {
      setLoading(true);

      const [u, s, h] =
        await Promise.all([
          userAPI.getAll(),
          scheduleAPI.getAll(),
          holidayAPI.getAll(),
        ]);

      const safeUsers =
        Array.isArray(u) ? u : [];

      const safeSchedules =
        Array.isArray(s) ? s : [];

      const safeHoliday =
        Array.isArray(h) ? h : [];

      const mapped =
        safeSchedules.map((row) => {
          const emp =
            safeUsers.find(
              (x) =>
                x.id === row.user_id
            ) || {};

          return {
            ...row,
            name:
              emp.name ||
              "Unknown",
            hourly_rate:
              emp.hourly_rate || 0,
            contracted_hours:
              emp.contracted_hours || 0,
          };
        });

      const leaveMapped =
        safeHoliday.map((row) => ({
          ...row,
          name:
            safeUsers.find(
              (u) =>
                u.id === row.user_id
            )?.name ||
            "Unknown",
        }));

      setUsers(safeUsers);
      setSchedules(mapped);
      setHolidays(leaveMapped);
    } finally {
      setLoading(false);
    }
  }

  function dateStr(day) {
    const y =
      day.getFullYear();

    const m = String(
      day.getMonth() + 1
    ).padStart(2, "0");

    const d = String(
      day.getDate()
    ).padStart(2, "0");

    return `${y}-${m}-${d}`;
  }

  function holidaysForDay(day) {
    const ds = dateStr(day);

    let rows =
      holidays.filter(
        (x) =>
          x.status ===
            "approved" &&
          x.start_date <= ds &&
          x.end_date >= ds
      );

    if (
      viewMode ===
        "individual" &&
      selectedUser
    ) {
      rows = rows.filter(
        (x) =>
          x.user_id ===
          selectedUser
      );
    }

    return rows;
  }

  function shiftsForDay(day) {
    const ds = dateStr(day);

    let rows =
      schedules.filter(
        (x) =>
          x.date === ds
      );

    if (
      viewMode ===
        "individual" &&
      selectedUser
    ) {
      rows = rows.filter(
        (x) =>
          x.user_id ===
          selectedUser
      );
    }

    const leaveIds =
      holidaysForDay(day).map(
        (x) => x.user_id
      );

    return rows.filter(
      (x) =>
        !leaveIds.includes(
          x.user_id
        )
    );
  }

  async function createShift() {
    if (
      !form.user_id ||
      !form.date ||
      !form.start ||
      !form.end
    ) {
      return alert(
        "Fill all fields"
      );
    }

    await scheduleAPI.create({
      user_id: form.user_id,
      date: form.date,
      start_time: `${form.date}T${form.start}:00`,
      end_time: `${form.date}T${form.end}:00`,
    });

    load();
  }

  async function bulkAdd() {
    if (
      !form.date ||
      !form.start ||
      !form.end
    ) {
      return alert(
        "Choose date + hours"
      );
    }

    for (const u of users) {
      await scheduleAPI.create({
        user_id: u.id,
        date: form.date,
        start_time: `${form.date}T${form.start}:00`,
        end_time: `${form.date}T${form.end}:00`,
      });
    }

    load();
  }

  async function removeShift(id) {
    if (
      !window.confirm(
        "Delete shift?"
      )
    )
      return;

    await scheduleAPI.delete(id);
    load();
  }

  function applyPreset(v) {
    const found =
      shiftPresets.find(
        (x) =>
          x.label === v
      );

    if (!found) return;

    setForm({
      ...form,
      start: found.start,
      end: found.end,
    });
  }

  function usedHolidayDays(id) {
    return holidays
      .filter(
        (x) =>
          x.user_id === id &&
          x.status ===
            "approved"
      )
      .reduce(
        (sum, h) => {
          const start =
            new Date(
              h.start_date
            );

          const end =
            new Date(
              h.end_date
            );

          const days =
            (end -
              start) /
              86400000 +
            1;

          return sum + days;
        },
        0
      );
  }

  function nextMonth() {
    const d =
      new Date(month);

    d.setMonth(
      d.getMonth() + 1
    );

    setMonth(d);
    setSelectedDay(null);
  }

  function prevMonth() {
    const d =
      new Date(month);

    d.setMonth(
      d.getMonth() - 1
    );

    setMonth(d);
    setSelectedDay(null);
  }

  const monthStart =
    new Date(
      month.getFullYear(),
      month.getMonth(),
      1
    );

  const monthEnd =
    new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0
    );

  const firstDay =
    (monthStart.getDay() +
      6) %
    7;

  const days = [];

  for (
    let i = 0;
    i < firstDay;
    i++
  ) {
    days.push(null);
  }

  for (
    let i = 1;
    i <=
    monthEnd.getDate();
    i++
  ) {
    days.push(
      new Date(
        month.getFullYear(),
        month.getMonth(),
        i
      )
    );
  }

  const totalHours =
    schedules.reduce(
      (sum, s) => {
        if (
          !s.start_time ||
          !s.end_time
        )
          return sum;

        return (
          sum +
          (new Date(
            s.end_time
          ) -
            new Date(
              s.start_time
            )) /
            3600000
        );
      },
      0
    );

  const wageTotal =
    schedules.reduce(
      (sum, s) => {
        if (
          !s.start_time ||
          !s.end_time
        )
          return sum;

        const hours =
          (new Date(
            s.end_time
          ) -
            new Date(
              s.start_time
            )) /
          3600000;

        return (
          sum +
          hours *
            Number(
              s.hourly_rate ||
                0
            )
        );
      },
      0
    );

  const weekdayNames = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ];

  const selectedShifts =
    selectedDay
      ? shiftsForDay(
          selectedDay
        )
      : [];

  const selectedLeave =
    selectedDay
      ? holidaysForDay(
          selectedDay
        )
      : [];

  if (loading) {
    return (
      <div className="text-gray-400 flex gap-2 items-center">
        <Loader2
          size={16}
          className="animate-spin"
        />
        Loading schedule...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold">
            Schedule
          </h1>

          <p className="text-sm text-gray-400">
            Premium rota management
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={
              prevMonth
            }
            className="p-2 rounded-xl bg-[#0f172a]"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={
              nextMonth
            }
            className="p-2 rounded-xl bg-[#0f172a]"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">

        <Card
          title="Shifts"
          value={
            schedules.length
          }
          icon={
            <Users size={16} />
          }
        />

        <Card
          title="Hours"
          value={totalHours.toFixed(
            1
          )}
          icon={
            <Clock3 size={16} />
          }
        />

        <Card
          title="On Holiday"
          value={
            holidays.filter(
              (x) =>
                x.status ===
                "approved"
            ).length
          }
          icon={
            <Plane size={16} />
          }
        />

        <Card
          title="Wage Cost"
          value={`£${wageTotal.toFixed(
            2
          )}`}
          icon={
            <PoundSterling size={16} />
          }
        />

      </div>

      <div className="grid md:grid-cols-3 gap-3">

        <button
          onClick={() =>
            setViewMode(
              "global"
            )
          }
          className={`rounded-xl p-3 ${
            viewMode ===
            "global"
              ? "bg-indigo-600"
              : "bg-[#0f172a]"
          }`}
        >
          Global Calendar
        </button>

        <button
          onClick={() =>
            setViewMode(
              "individual"
            )
          }
          className={`rounded-xl p-3 ${
            viewMode ===
            "individual"
              ? "bg-indigo-600"
              : "bg-[#0f172a]"
          }`}
        >
          Individual Calendar
        </button>

        <select
          value={
            selectedUser
          }
          onChange={(e) =>
            setSelectedUser(
              e.target.value
            )
          }
          className="rounded-xl px-4 py-3 bg-[#0f172a]"
        >
          <option value="">
            Select Staff
          </option>

          {users.map(
            (u) => (
              <option
                key={u.id}
                value={u.id}
              >
                {u.name}
              </option>
            )
          )}
        </select>

      </div>

      <div className="rounded-2xl border border-white/10 bg-[#020617] p-5 grid md:grid-cols-6 gap-3">

        <select
          value={
            form.user_id
          }
          onChange={(e) =>
            setForm({
              ...form,
              user_id:
                e.target.value,
            })
          }
          className="px-4 py-3 rounded-xl bg-[#0f172a]"
        >
          <option value="">
            Staff
          </option>

          {users.map(
            (u) => (
              <option
                key={u.id}
                value={u.id}
              >
                {u.name}
              </option>
            )
          )}
        </select>

        <input
          type="date"
          value={form.date}
          onChange={(e) =>
            setForm({
              ...form,
              date:
                e.target.value,
            })
          }
          className="px-4 py-3 rounded-xl bg-[#0f172a]"
        />

        <select
          onChange={(e) =>
            applyPreset(
              e.target.value
            )
          }
          className="px-4 py-3 rounded-xl bg-[#0f172a]"
        >
          <option>
            Preset Shift
          </option>

          {shiftPresets.map(
            (p) => (
              <option
                key={
                  p.label
                }
              >
                {p.label}
              </option>
            )
          )}
        </select>

        <input
          type="time"
          value={form.start}
          onChange={(e) =>
            setForm({
              ...form,
              start:
                e.target.value,
            })
          }
          className="px-4 py-3 rounded-xl bg-[#0f172a]"
        />

        <input
          type="time"
          value={form.end}
          onChange={(e) =>
            setForm({
              ...form,
              end:
                e.target.value,
            })
          }
          className="px-4 py-3 rounded-xl bg-[#0f172a]"
        />

        <div className="grid grid-cols-2 gap-2">

          <button
            onClick={
              createShift
            }
            className="rounded-xl bg-indigo-600"
          >
            <Plus
              size={16}
              className="mx-auto"
            />
          </button>

          <button
            onClick={
              bulkAdd
            }
            className="rounded-xl bg-emerald-600"
          >
            All
          </button>

        </div>

      </div>

      <div className="text-lg font-medium">
        {month.toLocaleString(
          "default",
          {
            month:
              "long",
          }
        )}{" "}
        {month.getFullYear()}
      </div>

      <div className="grid grid-cols-7 gap-2 text-xs text-gray-400">
        {weekdayNames.map(
          (d) => (
            <div
              key={d}
              className="text-center py-2"
            >
              {d}
            </div>
          )
        )}
      </div>

      <div className="grid grid-cols-7 gap-2">

        {days.map(
          (
            day,
            i
          ) => {
            if (!day) {
              return (
                <div
                  key={i}
                />
              );
            }

            const shifts =
              shiftsForDay(
                day
              );

            const leave =
              holidaysForDay(
                day
              );

            return (
              <button
                key={dateStr(
                  day
                )}
                onClick={() =>
                  setSelectedDay(
                    day
                  )
                }
                className="rounded-xl border border-white/10 bg-[#020617] p-2 text-left min-h-[130px]"
              >
                <div className="text-xs text-gray-500 mb-2">
                  {day.getDate()}
                </div>

                <div className="space-y-1">

                  {shifts
                    .slice(
                      0,
                      3
                    )
                    .map(
                      (
                        s
                      ) => (
                        <div
                          key={
                            s.id
                          }
                          className="text-xs px-2 py-1 rounded bg-indigo-500/20 text-indigo-300"
                        >
                          {
                            s.name
                          }
                        </div>
                      )
                    )}

                  {leave.map(
                    (
                      h
                    ) => (
                      <div
                        key={
                          h.id
                        }
                        className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-300"
                      >
                        {
                          h.name
                        }
                      </div>
                    )
                  )}

                </div>
              </button>
            );
          }
        )}

      </div>

      {selectedDay && (
        <div className="rounded-2xl border border-white/10 bg-[#020617] p-6 space-y-5">

          <h2 className="font-semibold">
            {selectedDay.toLocaleDateString(
              "en-GB"
            )}
          </h2>

          <div>
            <div className="mb-3 font-medium">
              Working Staff
            </div>

            {selectedShifts.map(
              (
                s
              ) => (
                <div
                  key={s.id}
                  className="rounded-xl bg-[#0f172a] p-3 flex justify-between items-center mb-2"
                >
                  <div>
                    <p>
                      {
                        s.name
                      }
                    </p>

                    <p className="text-xs text-gray-400">
                      {s.start_time?.slice(
                        11,
                        16
                      )}{" "}
                      -
                      {" "}
                      {s.end_time?.slice(
                        11,
                        16
                      )}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      removeShift(
                        s.id
                      )
                    }
                    className="text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            )}
          </div>

          <div>
            <div className="mb-3 font-medium">
              On Holiday
            </div>

            {selectedLeave.map(
              (
                h
              ) => {
                const emp =
                  users.find(
                    (
                      x
                    ) =>
                      x.id ===
                      h.user_id
                  ) ||
                  {};

                const used =
                  usedHolidayDays(
                    h.user_id
                  );

                const allowance =
                  Number(
                    emp.holiday_days ||
                      28
                  );

                const over =
                  used >
                  allowance;

                return (
                  <div
                    key={
                      h.id
                    }
                    className="rounded-xl bg-green-500/10 text-green-300 p-3 mb-2"
                  >
                    <div>
                      {
                        h.name
                      }
                    </div>

                    <div className="text-xs mt-1">
                      Used{" "}
                      {
                        used
                      }{" "}
                      /{" "}
                      {
                        allowance
                      }{" "}
                      days
                    </div>

                    {over && (
                      <div className="text-xs text-red-400 mt-1 flex gap-1 items-center">
                        <AlertTriangle size={12} />
                        Exceeded allowance
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>

        </div>
      )}

    </div>
  );
}

function Card({
  title,
  value,
  icon,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#020617] p-4">
      <div className="flex justify-between">
        <p className="text-xs text-gray-400">
          {title}
        </p>

        <div className="text-indigo-400">
          {icon}
        </div>
      </div>

      <h2 className="text-2xl font-semibold mt-2">
        {value}
      </h2>
    </div>
  );
}