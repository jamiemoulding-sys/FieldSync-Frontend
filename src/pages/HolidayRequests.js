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
  AlertTriangle,
  PoundSterling,
  Users,
  Clock3,
  CalendarDays,
  Rows3,
} from "lucide-react";

export default function Schedule() {
  const [users, setUsers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [holidays, setHolidays] = useState([]);

  const [loading, setLoading] = useState(true);

  const [selectedDay, setSelectedDay] =
    useState(null);

  const [viewMode, setViewMode] =
    useState("month");

  const [calendarType, setCalendarType] =
    useState("global");

  const [selectedUser, setSelectedUser] =
    useState("");

  const [selectedStaff, setSelectedStaff] =
    useState([]);

  const [form, setForm] = useState({
    from: "",
    to: "",
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
    load(true);

    const timer = setInterval(() => {
      load(false);
    }, 60000);

    return () =>
      clearInterval(timer);
  }, []);

  async function load(showLoader = false) {
    try {
      if (showLoader) setLoading(true);

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
              row.name ||
              "Unknown",
            hourly_rate: Number(
              emp.hourly_rate || 0
            ),
          };
        });

      const leaveMapped =
        safeHoliday.map((row) => {
          const emp =
            safeUsers.find(
              (x) =>
                x.id === row.user_id
            ) || {};

          return {
            ...row,
            name:
              emp.name ||
              row.name ||
              "Unknown",
          };
        });

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

  function approvedHolidayRows() {
    return holidays.filter(
      (x) =>
        x.status === "approved"
    );
  }

  function holidaysForDay(day) {
    const ds = dateStr(day);

    let rows =
      approvedHolidayRows().filter(
        (x) =>
          x.start_date <= ds &&
          x.end_date >= ds
      );

    if (
      calendarType ===
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
      calendarType ===
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

  function isOnHoliday(
    userId,
    date
  ) {
    return approvedHolidayRows().some(
      (h) =>
        h.user_id === userId &&
        h.start_date <= date &&
        h.end_date >= date
    );
  }

  function overlaps(
    aStart,
    aEnd,
    bStart,
    bEnd
  ) {
    return (
      aStart < bEnd &&
      bStart < aEnd
    );
  }

  function hasConflict(
    userId,
    date
  ) {
    if (
      isOnHoliday(
        userId,
        date
      )
    )
      return true;

    const existing =
      schedules.filter(
        (x) =>
          x.user_id ===
            userId &&
          x.date === date
      );

    const newStart =
      new Date(
        `${date}T${form.start}:00`
      );

    const newEnd =
      new Date(
        `${date}T${form.end}:00`
      );

    for (const row of existing) {
      const start =
        new Date(
          row.start_time
        );

      const end =
        new Date(
          row.end_time
        );

      if (
        overlaps(
          newStart,
          newEnd,
          start,
          end
        )
      ) {
        return true;
      }
    }

    return false;
  }

  function getDatesBetween(
    start,
    end
  ) {
    const arr = [];
    let d = new Date(start);

    while (
      d <= new Date(end)
    ) {
      arr.push(dateStr(d));
      d.setDate(
        d.getDate() + 1
      );
    }

    return arr;
  }

  async function createShiftRange(
    monToFri = false
  ) {
    if (
      !selectedStaff.length ||
      !form.from ||
      !form.to ||
      !form.start ||
      !form.end
    ) {
      return alert(
        "Fill all fields"
      );
    }

    const dates =
      getDatesBetween(
        form.from,
        form.to
      );

    for (const date of dates) {
      const weekday =
        new Date(
          date
        ).getDay();

      if (
        monToFri &&
        (weekday === 0 ||
          weekday === 6)
      ) {
        continue;
      }

      for (const id of selectedStaff) {
        if (
          !hasConflict(
            id,
            date
          )
        ) {
          await scheduleAPI.create(
            {
              user_id: id,
              date,
              start_time: `${date}T${form.start}:00`,
              end_time: `${date}T${form.end}:00`,
            }
          );
        }
      }
    }

    load(false);
  }

  async function removeShift(id) {
    if (
      !window.confirm(
        "Delete shift?"
      )
    )
      return;

    await scheduleAPI.delete(id);
    load(false);
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

  const weekDays = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ];

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
    schedules
      .filter((s) => {
        const d =
          new Date(
            s.date
          );

        return (
          d.getMonth() ===
            month.getMonth() &&
          d.getFullYear() ===
            month.getFullYear()
        );
      })
      .reduce(
        (sum, s) => {
          const hrs =
            (new Date(
              s.end_time
            ) -
              new Date(
                s.start_time
              )) /
            3600000;

          return (
            sum +
            hrs *
              Number(
                s.hourly_rate ||
                  0
              )
          );
        },
        0
      );

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
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold">
            Schedule
          </h1>

          <p className="text-sm text-gray-400">
            Smart rota management
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

      {/* KPI */}
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
            approvedHolidayRows()
              .length
          }
          icon={
            <Plane size={16} />
          }
        />

        <Card
          title="Month Wage"
          value={`£${wageTotal.toFixed(
            2
          )}`}
          icon={
            <PoundSterling size={16} />
          }
        />
      </div>

      {/* VIEW TOGGLE */}
      <div className="grid md:grid-cols-4 gap-3">
        <button
          onClick={() =>
            setViewMode(
              "month"
            )
          }
          className={`rounded-xl p-3 ${
            viewMode ===
            "month"
              ? "bg-indigo-600"
              : "bg-[#0f172a]"
          }`}
        >
          <CalendarDays
            size={16}
            className="inline mr-2"
          />
          Month
        </button>

        <button
          onClick={() =>
            setViewMode(
              "week"
            )
          }
          className={`rounded-xl p-3 ${
            viewMode ===
            "week"
              ? "bg-indigo-600"
              : "bg-[#0f172a]"
          }`}
        >
          <Rows3
            size={16}
            className="inline mr-2"
          />
          Week
        </button>

        <button
          onClick={() =>
            setCalendarType(
              "global"
            )
          }
          className={`rounded-xl p-3 ${
            calendarType ===
            "global"
              ? "bg-emerald-600"
              : "bg-[#0f172a]"
          }`}
        >
          Global
        </button>

        <select
          value={
            selectedUser
          }
          onChange={(e) => {
            setSelectedUser(
              e.target.value
            );
            setCalendarType(
              "individual"
            );
          }}
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

      {/* ADD SHIFT */}
      <div className="rounded-2xl border border-white/10 bg-[#020617] p-5 space-y-4">
        <div className="grid md:grid-cols-5 gap-3">
          <input
            type="date"
            value={form.from}
            onChange={(e) =>
              setForm({
                ...form,
                from:
                  e.target.value,
              })
            }
            className="px-4 py-3 rounded-xl bg-[#0f172a]"
          />

          <input
            type="date"
            value={form.to}
            onChange={(e) =>
              setForm({
                ...form,
                to:
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
        </div>

        <div className="grid md:grid-cols-4 gap-2">
          {users.map(
            (u) => (
              <label
                key={u.id}
                className="rounded-xl bg-[#0f172a] px-3 py-2 flex gap-2 items-center"
              >
                <input
                  type="checkbox"
                  checked={selectedStaff.includes(
                    u.id
                  )}
                  onChange={() => {
                    if (
                      selectedStaff.includes(
                        u.id
                      )
                    ) {
                      setSelectedStaff(
                        selectedStaff.filter(
                          (
                            x
                          ) =>
                            x !==
                            u.id
                        )
                      );
                    } else {
                      setSelectedStaff(
                        [
                          ...selectedStaff,
                          u.id,
                        ]
                      );
                    }
                  }}
                />
                {u.name}
              </label>
            )
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <button
            onClick={() =>
              createShiftRange(
                false
              )
            }
            className="rounded-xl bg-indigo-600 py-3"
          >
            Add Full Range
          </button>

          <button
            onClick={() =>
              createShiftRange(
                true
              )
            }
            className="rounded-xl bg-emerald-600 py-3"
          >
            Mon - Fri Only
          </button>
        </div>
      </div>

      {/* CALENDAR */}
      {viewMode ===
      "month" ? (
        <>
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
            {weekDays.map(
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
                if (!day)
                  return (
                    <div
                      key={i}
                    />
                  );

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
                    className="rounded-xl border border-white/10 bg-[#020617] p-2 text-left min-h-[150px]"
                  >
                    <div className="text-xs text-gray-500 mb-2">
                      {day.getDate()}
                    </div>

                    <div className="space-y-1">
                      {shifts
                        .slice(
                          0,
                          4
                        )
                        .map(
                          (
                            s
                          ) => (
                            <div
                              key={
                                s.id
                              }
                              title={`${s.name} ${s.start_time?.slice(
                                11,
                                16
                              )}-${s.end_time?.slice(
                                11,
                                16
                              )}`}
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
                            }{" "}
                            HOL
                          </div>
                        )
                      )}
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </>
      ) : (
        <WeekView
          month={month}
          shiftsForDay={
            shiftsForDay
          }
          holidaysForDay={
            holidaysForDay
          }
          dateStr={dateStr}
          setSelectedDay={
            setSelectedDay
          }
        />
      )}

      {/* DAY PANEL */}
      {selectedDay && (
        <DayPanel
          selectedDay={
            selectedDay
          }
          shifts={
            shiftsForDay(
              selectedDay
            )
          }
          holidays={
            holidaysForDay(
              selectedDay
            )
          }
          removeShift={
            removeShift
          }
        />
      )}
    </div>
  );
}

function WeekView({
  month,
  shiftsForDay,
  holidaysForDay,
  dateStr,
  setSelectedDay,
}) {
  const start =
    new Date(month);

  const day =
    start.getDay() === 0
      ? 6
      : start.getDay() - 1;

  start.setDate(
    start.getDate() - day
  );

  const days = [];

  for (
    let i = 0;
    i < 7;
    i++
  ) {
    const d =
      new Date(start);

    d.setDate(
      start.getDate() + i
    );

    days.push(d);
  }

  return (
    <div className="grid md:grid-cols-7 gap-3">
      {days.map((day) => {
        const shifts =
          shiftsForDay(day);

        const hols =
          holidaysForDay(day);

        return (
          <div
            key={dateStr(day)}
            onClick={() =>
              setSelectedDay(
                day
              )
            }
            className="rounded-2xl bg-[#020617] border border-white/10 p-3 min-h-[500px] cursor-pointer"
          >
            <div className="font-medium mb-3">
              {day.toLocaleDateString(
                "en-GB",
                {
                  weekday:
                    "short",
                  day: "numeric",
                }
              )}
            </div>

            <div className="space-y-2">
              {shifts.map(
                (s) => (
                  <div
                    key={s.id}
                    className="text-xs p-2 rounded bg-indigo-500/20 text-indigo-300"
                  >
                    {s.name}
                    <br />
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
                  </div>
                )
              )}

              {hols.map(
                (h) => (
                  <div
                    key={h.id}
                    className="text-xs p-2 rounded bg-green-500/20 text-green-300"
                  >
                    {h.name}
                    <br />
                    Holiday
                  </div>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayPanel({
  selectedDay,
  shifts,
  holidays,
  removeShift,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#020617] p-6 space-y-4">
      <h2 className="font-semibold">
        {selectedDay.toLocaleDateString(
          "en-GB"
        )}
      </h2>

      {shifts.map(
        (s) => (
          <div
            key={s.id}
            className="rounded-xl bg-[#0f172a] p-3 flex justify-between items-center"
          >
            <div>
              {s.name}
              <div className="text-xs text-gray-400">
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
              </div>
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

      {holidays.map(
        (h) => (
          <div
            key={h.id}
            className="rounded-xl bg-green-500/10 text-green-300 p-3"
          >
            {h.name} - Holiday
          </div>
        )
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