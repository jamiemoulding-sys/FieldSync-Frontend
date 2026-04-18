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
    user_id: "",
    location_id: "",
    start: "",
    end: "",
    is_open: false,
    overtime: false,

    bulk_from: "",
    bulk_to: "",
    bulk_days: "mon-fri",
  });

  useEffect(() => {
    loadData(true);
  }, []);

  async function loadData(show = false) {
    try {
      if (show) setLoading(true);

      const [shifts, holidays, staff, locs] =
        await Promise.all([
          scheduleAPI.getAll(),
          holidayAPI.getAll(),
          userAPI.getAll(),
          locationAPI.getAll(),
        ]);

      const safeUsers = Array.isArray(staff)
        ? staff
        : [];

      const safeLocs = Array.isArray(locs)
        ? locs
        : [];

      setUsers(safeUsers);
      setLocations(safeLocs);

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

      safeLocs.forEach((l) => {
        locMap[l.id] =
          l.name || "Location";
      });

      const shiftRows = (
        Array.isArray(shifts)
          ? shifts
          : []
      ).map((s) => {
        const start =
          new Date(s.start_time);

        const end =
          new Date(s.end_time);

        const isOpen =
          s.is_open || !s.user_id;

        const employee =
          userMap[s.user_id] ||
          "OPEN";

        const hours = `${moment(
          start
        ).format("H:mm")} - ${moment(
          end
        ).format("H:mm")}`;

        return {
          id: s.id,
          type: isOpen
            ? "open"
            : "shift",
          start,
          end,
          user_id: s.user_id,
          title: `${employee} • ${hours}`,
          resource: {
            hourly_rate:
              rateMap[s.user_id] ||
              0,
            overtime:
              s.overtime,
          },
        };
      });

      const holidayRows = (
        Array.isArray(
          holidays
        )
          ? holidays
          : []
      )
        .filter(
          (h) =>
            h.status ===
            "approved"
        )
        .map((h) => ({
          id: `h-${h.id}`,
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
            userMap[
              h.user_id
            ] ||
            "Holiday"
          } • HOLIDAY`,
        }));

      setEvents([
        ...shiftRows,
        ...holidayRows,
      ]);
    } finally {
      setLoading(false);
    }
  }

  function styleEvent(event) {
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

  async function createShift(
    e
  ) {
    e.preventDefault();

    await scheduleAPI.create({
      user_id:
        form.is_open
          ? null
          : form.user_id,
      location_id:
        form.location_id,
      date: moment(
        form.start
      ).format(
        "YYYY-MM-DD"
      ),
      start_time:
        form.start,
      end_time: form.end,
      is_open:
        form.is_open,
      overtime:
        form.overtime,
    });

    setShowModal(false);
    loadData(false);
  }

  async function createBulk() {
    if (
      !form.bulk_from ||
      !form.bulk_to ||
      !form.location_id ||
      !form.start ||
      !form.end
    )
      return;

    let current = moment(
      form.bulk_from
    );

    const end = moment(
      form.bulk_to
    );

    while (
      current.isSameOrBefore(
        end,
        "day"
      )
    ) {
      const dow =
        current.day();

      const allowed =
        form.bulk_days ===
        "all"
          ? true
          : dow >= 1 &&
            dow <= 5;

      if (allowed) {
        await scheduleAPI.create({
          user_id:
            form.is_open
              ? null
              : form.user_id,
          location_id:
            form.location_id,
          date: current.format(
            "YYYY-MM-DD"
          ),
          start_time: `${current.format(
            "YYYY-MM-DD"
          )}T${moment(
            form.start
          ).format(
            "HH:mm"
          )}`,
          end_time: `${current.format(
            "YYYY-MM-DD"
          )}T${moment(
            form.end
          ).format(
            "HH:mm"
          )}`,
          is_open:
            form.is_open,
          overtime:
            form.overtime,
        });
      }

      current.add(
        1,
        "day"
      );
    }

    setShowModal(false);
    loadData(false);
  }

  async function moveEvent({
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

  const monthRows =
    useMemo(() => {
      return events.filter(
        (e) =>
          moment(
            e.start
          ).isSame(
            date,
            "month"
          ) &&
          e.type !==
            "holiday"
      );
    }, [events, date]);

  const shifts =
    monthRows.length;

  const hours =
    monthRows.reduce(
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
    monthRows.reduce(
      (
        sum,
        e
      ) => {
        if (
          e.type ===
          "open"
        )
          return sum;

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
          startAccessor="start"
          endAccessor="end"
          views={[
            Views.MONTH,
            Views.WEEK,
          ]}
          popup
          selectable
          resizable
          step={60}
          timeslots={1}
          style={{
            height:
              "82vh",
          }}
          onEventDrop={
            moveEvent
          }
          onEventResize={
            moveEvent
          }
          eventPropGetter={
            styleEvent
          }
          components={{
            week: WeekListView,
          }}
        />

      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">

          <div className="w-full max-w-xl bg-[#020617] border border-white/10 rounded-2xl p-6">

            <h2 className="text-lg font-semibold mb-4">
              Add Shift / Bulk
            </h2>

            <div className="grid md:grid-cols-2 gap-3 mb-3">

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

              <select
                value={
                  form.user_id
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    user_id:
                      e.target
                        .value,
                  })
                }
                className="bg-[#0f172a] text-white rounded-xl px-4 py-3"
              >
                <option value="">
                  Staff
                </option>

                {users.map(
                  (
                    u
                  ) => (
                    <option
                      key={
                        u.id
                      }
                      value={
                        u.id
                      }
                    >
                      {u.name}
                    </option>
                  )
                )}
              </select>

              <input
                type="datetime-local"
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
                type="datetime-local"
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

            <div className="space-y-2">

              <button
                onClick={
                  createShift
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
                Add Bulk Shifts
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
          background:rgba(99,102,241,.10)!important;
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

function WeekListView({
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