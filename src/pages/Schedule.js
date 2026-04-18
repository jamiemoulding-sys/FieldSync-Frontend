import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  momentLocalizer,
  Views,
} from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import moment from "moment";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

import {
  scheduleAPI,
  holidayAPI,
  userAPI,
  locationAPI,
} from "../services/api";

import {
  CalendarDays,
  Users,
  PoundSterling,
  Plus,
  RefreshCw,
} from "lucide-react";

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

export default function Schedule() {
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("month");
  const [date, setDate] = useState(new Date());

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    user_ids: [],
    location_id: "",
    start: "09:00",
    end: "17:00",
    single_date: "",

    bulk_from: "",
    bulk_to: "",
    bulk_days: "mon-fri",

    overtime: false,
    open_shift: false,
  });

  useEffect(() => {
    loadData(true);
  }, []);

  async function loadData(show = false) {
    try {
      if (show) setLoading(true);

      const [
        shiftRes,
        holidayRes,
        userRes,
        locationRes,
      ] = await Promise.all([
        scheduleAPI.getAll(),
        holidayAPI.getAll(),
        userAPI.getAll(),
        locationAPI.getAll(),
      ]);

      const safeUsers = Array.isArray(userRes)
        ? userRes
        : [];

      const safeLocations =
        Array.isArray(locationRes)
          ? locationRes
          : [];

      setUsers(safeUsers);
      setLocations(safeLocations);

      const userMap = {};
      const rateMap = {};
      const locMap = {};

      safeUsers.forEach((u) => {
        userMap[u.id] =
          u.name || u.email || "Staff";

        rateMap[u.id] = Number(
          u.hourly_rate || 0
        );
      });

      safeLocations.forEach((l) => {
        locMap[l.id] =
          l.name || "Location";
      });

      const holidays =
        Array.isArray(holidayRes)
          ? holidayRes
          : [];

      const holidayEvents = holidays
        .filter(
          (h) =>
            h.status === "approved"
        )
        .map((h) => ({
          id: `holiday-${h.id}`,
          type: "holiday",
          start: new Date(
            h.start_date +
              "T00:00:00"
          ),
          end: new Date(
            h.end_date +
              "T23:59:59"
          ),
          title: `${
            h.name ||
            userMap[h.user_id] ||
            "Staff"
          } • HOLIDAY`,
          allDay: true,
        }));

      const shiftEvents = (
        Array.isArray(shiftRes)
          ? shiftRes
          : []
      ).map((s) => {
        const start =
          new Date(s.start_time);

        const end = new Date(
          s.end_time
        );

        const open =
          s.is_open ||
          !s.user_id;

        const name = open
          ? "OPEN SHIFT"
          : userMap[s.user_id] ||
            "Staff";

        const hours = `${moment(
          start
        ).format("H:mm")} - ${moment(
          end
        ).format("H:mm")}`;

        return {
          id: s.id,
          type: open
            ? "open"
            : "shift",
          start,
          end,
          title: `${name} • ${hours}${
            s.location_id
              ? ` • ${
                  locMap[
                    s.location_id
                  ] || ""
                }`
              : ""
          }`,
          resource: {
            user_id:
              s.user_id,
            hourly_rate:
              rateMap[
                s.user_id
              ] || 0,
            overtime:
              s.overtime,
          },
        };
      });

      setEvents([
        ...shiftEvents,
        ...holidayEvents,
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function onHoliday(userId, day) {
    return events.some(
      (e) =>
        e.type === "holiday" &&
        e.title
          .toLowerCase()
          .includes(
            (
              users.find(
                (u) =>
                  u.id === userId
              )?.name || ""
            ).toLowerCase()
          ) &&
        moment(day).isBetween(
          e.start,
          e.end,
          "day",
          "[]"
        )
    );
  }

  async function createSingle() {
    if (
      !form.single_date ||
      !form.location_id
    )
      return;

    const selected =
      form.open_shift
        ? [null]
        : form.user_ids;

    for (const userId of selected) {
      if (
        userId &&
        onHoliday(
          userId,
          form.single_date
        )
      )
        continue;

      await scheduleAPI.create({
        user_id: userId,
        location_id:
          form.location_id,
        date: form.single_date,
        start_time: `${form.single_date}T${form.start}`,
        end_time: `${form.single_date}T${form.end}`,
        overtime:
          form.overtime,
        is_open:
          form.open_shift,
      });
    }

    setShowModal(false);
    loadData(false);
  }

  async function createBulk() {
    if (
      !form.bulk_from ||
      !form.bulk_to ||
      !form.location_id
    )
      return;

    let day = moment(
      form.bulk_from
    );

    const end = moment(
      form.bulk_to
    );

    while (
      day.isSameOrBefore(
        end,
        "day"
      )
    ) {
      const dow = day.day();

      const allowed =
        form.bulk_days ===
        "all"
          ? true
          : dow >= 1 &&
            dow <= 5;

      if (allowed) {
        const selected =
          form.open_shift
            ? [null]
            : form.user_ids;

        for (const userId of selected) {
          if (
            userId &&
            onHoliday(
              userId,
              day
            )
          )
            continue;

          await scheduleAPI.create({
            user_id:
              userId,
            location_id:
              form.location_id,
            date: day.format(
              "YYYY-MM-DD"
            ),
            start_time: `${day.format(
              "YYYY-MM-DD"
            )}T${form.start}`,
            end_time: `${day.format(
              "YYYY-MM-DD"
            )}T${form.end}`,
            overtime:
              form.overtime,
            is_open:
              form.open_shift,
          });
        }
      }

      day.add(1, "day");
    }

    setShowModal(false);
    loadData(false);
  }

  async function moveShift({
    event,
    start,
    end,
  }) {
    if (
      event.type ===
      "holiday"
    )
      return;

    await scheduleAPI.update(
      event.id,
      {
        start_time:
          start,
        end_time: end,
      }
    );

    loadData(false);
  }

  const monthData =
    useMemo(() => {
      return events.filter((e) =>
        moment(e.start).isSame(
          date,
          "month"
        )
      );
    }, [events, date]);

  const shifts =
    monthData.filter(
      (e) =>
        e.type === "shift" ||
        e.type === "open"
    ).length;

  const hours =
    monthData
      .filter(
        (e) =>
          e.type === "shift"
      )
      .reduce(
        (
          sum,
          e
        ) =>
          sum +
          moment(
            e.end
          ).diff(
            e.start,
            "minutes"
          ) /
            60,
        0
      );

  const wages =
    monthData
      .filter(
        (e) =>
          e.type === "shift"
      )
      .reduce(
        (
          sum,
          e
        ) => {
          const hrs =
            moment(
              e.end
            ).diff(
              e.start,
              "minutes"
            ) / 60;

          return (
            sum +
            hrs *
              (e.resource
                ?.hourly_rate ||
                0)
          );
        },
        0
      );

  function eventStyle(event) {
    if (
      event.type ===
      "holiday"
    ) {
      return {
        style: {
          background:
            "#16a34a",
          border: "none",
          borderRadius:
            "8px",
        },
      };
    }

    if (
      event.type ===
      "open"
    ) {
      return {
        style: {
          background:
            "#f59e0b",
          color: "#111",
          border: "none",
          borderRadius:
            "8px",
          fontWeight: 700,
        },
      };
    }

    return {
      style: {
        background:
          event.resource
            ?.overtime
            ? "#dc2626"
            : "#6366f1",
        border: "none",
        borderRadius:
          "8px",
      },
    };
  }

  if (loading) {
    return (
      <div className="text-gray-400">
        Loading schedule...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold">
            Schedule
          </h1>
          <p className="text-sm text-gray-400">
            Smart rota planner
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() =>
              loadData(
                false
              )
            }
            className="px-4 py-2 rounded-xl bg-white/5"
          >
            <RefreshCw
              size={16}
            />
          </button>

          <button
            onClick={() =>
              setShowModal(
                true
              )
            }
            className="px-4 py-2 rounded-xl bg-indigo-600 flex items-center gap-2"
          >
            <Plus
              size={16}
            />
            Add Shift
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card
          title="Monthly Shifts"
          value={shifts}
          icon={
            <CalendarDays size={16} />
          }
        />

        <Card
          title="Monthly Hours"
          value={hours.toFixed(
            1
          )}
          icon={
            <Users size={16} />
          }
        />

        <Card
          title="Monthly Wage"
          value={`£${wages.toFixed(
            2
          )}`}
          icon={
            <PoundSterling size={16} />
          }
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#020617] p-4 schedule-wrap">
        <DnDCalendar
          localizer={
            localizer
          }
          events={events}
          date={date}
          onNavigate={
            setDate
          }
          view={view}
          onView={setView}
          views={[
            Views.MONTH,
            Views.WEEK,
          ]}
          startAccessor="start"
          endAccessor="end"
          popup
          selectable
          resizable
          style={{
            height:
              "82vh",
          }}
          eventPropGetter={
            eventStyle
          }
          onEventDrop={
            moveShift
          }
          onEventResize={
            moveShift
          }
          components={{
            week: WeekSimple,
          }}
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">

          <div className="w-full max-w-2xl bg-[#020617] border border-white/10 rounded-2xl p-6">

            <h2 className="text-xl font-semibold mb-4">
              Add Single / Bulk Shift
            </h2>

            <div className="grid md:grid-cols-2 gap-3 mb-3">

              <input
                type="date"
                value={
                  form.single_date
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    single_date:
                      e.target
                        .value,
                  })
                }
                className="bg-[#0f172a] text-white rounded-xl px-4 py-3"
              />

              <select
                value={
                  form.location_id
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    location_id:
                      e.target
                        .value,
                  })
                }
                className="bg-[#0f172a] text-white rounded-xl px-4 py-3"
              >
                <option value="">
                  Location
                </option>

                {locations.map(
                  (
                    l
                  ) => (
                    <option
                      key={
                        l.id
                      }
                      value={
                        l.id
                      }
                    >
                      {l.name}
                    </option>
                  )
                )}
              </select>

              <input
                type="time"
                value={
                  form.start
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    start:
                      e.target
                        .value,
                  })
                }
                className="bg-[#0f172a] text-white rounded-xl px-4 py-3"
              />

              <input
                type="time"
                value={
                  form.end
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    end:
                      e.target
                        .value,
                  })
                }
                className="bg-[#0f172a] text-white rounded-xl px-4 py-3"
              />

            </div>

            <div className="rounded-xl bg-[#0f172a] p-4 mb-3">
              <p className="text-sm mb-3">
                Select Multiple Staff
              </p>

              <div className="grid md:grid-cols-3 gap-2">
                {users.map(
                  (
                    u
                  ) => (
                    <label
                      key={
                        u.id
                      }
                      className="text-sm flex gap-2"
                    >
                      <input
                        type="checkbox"
                        checked={form.user_ids.includes(
                          u.id
                        )}
                        onChange={() => {
                          const exists =
                            form.user_ids.includes(
                              u.id
                            );

                          setForm({
                            ...form,
                            user_ids:
                              exists
                                ? form.user_ids.filter(
                                    (
                                      x
                                    ) =>
                                      x !==
                                      u.id
                                  )
                                : [
                                    ...form.user_ids,
                                    u.id,
                                  ],
                          });
                        }}
                      />
                      {u.name}
                    </label>
                  )
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3 mb-3">
              <input
                type="date"
                value={
                  form.bulk_from
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    bulk_from:
                      e.target
                        .value,
                  })
                }
                className="bg-[#0f172a] text-white rounded-xl px-4 py-3"
              />

              <input
                type="date"
                value={
                  form.bulk_to
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    bulk_to:
                      e.target
                        .value,
                  })
                }
                className="bg-[#0f172a] text-white rounded-xl px-4 py-3"
              />

              <select
                value={
                  form.bulk_days
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    bulk_days:
                      e.target
                        .value,
                  })
                }
                className="bg-[#0f172a] text-white rounded-xl px-4 py-3"
              >
                <option value="mon-fri">
                  Mon - Fri
                </option>
                <option value="all">
                  All Days
                </option>
              </select>
            </div>

            <div className="flex gap-6 text-sm mb-4">
              <label className="flex gap-2">
                <input
                  type="checkbox"
                  checked={
                    form.open_shift
                  }
                  onChange={(
                    e
                  ) =>
                    setForm({
                      ...form,
                      open_shift:
                        e.target
                          .checked,
                    })
                  }
                />
                Open Shift
              </label>

              <label className="flex gap-2">
                <input
                  type="checkbox"
                  checked={
                    form.overtime
                  }
                  onChange={(
                    e
                  ) =>
                    setForm({
                      ...form,
                      overtime:
                        e.target
                          .checked,
                    })
                  }
                />
                Overtime
              </label>
            </div>

            <div className="space-y-2">
              <button
                onClick={
                  createSingle
                }
                className="w-full py-3 rounded-xl bg-indigo-600"
              >
                Add Single Shift
              </button>

              <button
                onClick={
                  createBulk
                }
                className="w-full py-3 rounded-xl bg-emerald-600"
              >
                Add Bulk Multi Staff
              </button>

              <button
                onClick={() =>
                  setShowModal(
                    false
                  )
                }
                className="w-full py-3 rounded-xl bg-white/5"
              >
                Cancel
              </button>
            </div>

          </div>

        </div>
      )}

      <style>{`
        .schedule-wrap .rbc-off-range-bg{
          background:transparent!important;
        }

        .schedule-wrap .rbc-today{
          background:rgba(99,102,241,.12)!important;
        }

        .schedule-wrap .rbc-header{
          padding:12px;
          border-color:rgba(255,255,255,.08);
        }

        .schedule-wrap .rbc-event{
          padding:4px 8px;
          font-size:12px;
        }
      `}</style>

    </div>
  );
}

function WeekSimple({
  date,
  events,
}) {
  const start = moment(date).startOf(
    "week"
  );

  const days = Array.from(
    { length: 7 },
    (_, i) =>
      start
        .clone()
        .add(i, "day")
  );

  return (
    <div className="grid grid-cols-7 gap-2 h-full p-2">
      {days.map((day) => {
        const rows =
          events.filter((e) =>
            moment(
              e.start
            ).isSame(
              day,
              "day"
            )
          );

        return (
          <div
            key={day.format()}
            className="bg-[#0f172a] rounded-xl p-2 overflow-auto"
          >
            <div className="font-semibold text-sm mb-2">
              {day.format(
                "ddd DD"
              )}
            </div>

            <div className="space-y-2">
              {rows.map(
                (r) => (
                  <div
                    key={r.id}
                    className="text-xs rounded-lg px-2 py-2 bg-white/5"
                  >
                    {r.title}
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