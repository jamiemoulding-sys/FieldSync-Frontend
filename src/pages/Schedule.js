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
  Trash2,
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
  });

  useEffect(() => {
    loadData(true);
  }, []);

  async function loadData(show = false) {
    try {
      if (show) setLoading(true);

      const [
        shifts,
        holidays,
        staff,
        locs,
      ] = await Promise.all([
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

      const shiftEvents = (
        Array.isArray(shifts)
          ? shifts
          : []
      ).map((s) => {
        const open =
          s.is_open ||
          !s.user_id;

        const start =
          new Date(
            s.start_time
          );

        const end =
          new Date(
            s.end_time
          );

        const title = open
          ? `OPEN • ${
              locMap[
                s.location_id
              ] || ""
            } • ${moment(
              start
            ).format(
              "HH:mm"
            )}-${moment(
              end
            ).format(
              "HH:mm"
            )}`
          : `${
              userMap[
                s.user_id
              ] || "Staff"
            } • ${moment(
              start
            ).format(
              "HH:mm"
            )}-${moment(
              end
            ).format(
              "HH:mm"
            )} • ${
              locMap[
                s.location_id
              ] || ""
            }`;

        return {
          id: s.id,
          type: open
            ? "open"
            : "shift",
          user_id:
            s.user_id,
          start,
          end,
          title,
          hourly_rate:
            rateMap[
              s.user_id
            ] || 0,
          overtime:
            s.overtime ||
            false,
        };
      });

      const holidayEvents = (
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
            "Staff"
          } • HOLIDAY`,
        }));

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

  function eventStyleGetter(
    event
  ) {
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
          color:
            "#111827",
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
          event.overtime
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

    try {
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
        end_time:
          form.end,
        is_open:
          form.is_open,
        overtime:
          form.overtime,
      });

      setShowModal(
        false
      );

      setForm({
        user_id: "",
        location_id:
          "",
        start: "",
        end: "",
        is_open: false,
        overtime: false,
      });

      loadData(false);
    } catch {
      alert(
        "Failed to save shift"
      );
    }
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

  async function resizeShift({
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

  async function deleteShift(
    event
  ) {
    if (
      event.type ===
      "holiday"
    )
      return;

    if (
      !window.confirm(
        "Delete shift?"
      )
    )
      return;

    await scheduleAPI.delete(
      event.id
    );

    loadData(false);
  }

  const monthEvents =
    useMemo(() => {
      return events.filter(
        (e) =>
          moment(
            e.start
          ).isSame(
            date,
            "month"
          )
      );
    }, [events, date]);

  const totalShifts =
    monthEvents.filter(
      (e) =>
        e.type ===
          "shift" ||
        e.type ===
          "open"
    ).length;

  const totalHours =
    monthEvents
      .filter(
        (e) =>
          e.type ===
          "shift"
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
            moment(
              e.start
            ),
            "minutes"
          ) /
            60,
        0
      );

  const wages =
    monthEvents
      .filter(
        (e) =>
          e.type ===
          "shift"
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
              moment(
                e.start
              ),
              "minutes"
            ) / 60;

          return (
            sum +
            hrs *
              e.hourly_rate
          );
        },
        0
      );

  const weekFormats = {
    dayFormat:
      "ddd DD",
  };

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
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10"
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
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2"
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
          value={
            totalShifts
          }
          icon={
            <CalendarDays size={16} />
          }
        />

        <Card
          title="Monthly Hours"
          value={totalHours.toFixed(
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

      <div className="rounded-2xl border border-white/10 bg-[#020617] p-4 overflow-hidden schedule-wrap">

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
          selectable
          popup
          resizable
          views={[
            Views.MONTH,
            Views.WEEK,
          ]}
          toolbar
          step={60}
          timeslots={1}
          style={{
            height:
              "80vh",
          }}
          formats={
            weekFormats
          }
          eventPropGetter={
            eventStyleGetter
          }
          onEventDrop={
            moveShift
          }
          onEventResize={
            resizeShift
          }
          onDoubleClickEvent={
            deleteShift
          }
          draggableAccessor={(
            e
          ) =>
            e.type !==
            "holiday"
          }
          resizableAccessor={(
            e
          ) =>
            e.type !==
            "holiday"
          }
          components={{
            timeGutterHeader:
              () => null,
          }}
        />

      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">

          <div className="w-full max-w-lg bg-[#020617] border border-white/10 rounded-2xl p-6">

            <h2 className="text-lg font-semibold mb-4">
              Add Shift
            </h2>

            <form
              onSubmit={
                createShift
              }
              className="space-y-4"
            >

              <select
                required
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
                className="w-full bg-[#0f172a] text-white rounded-xl px-4 py-3"
              >
                <option value="">
                  Select Location
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
                      {
                        l.name
                      }
                    </option>
                  )
                )}
              </select>

              {!form.is_open && (
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
                  className="w-full bg-[#0f172a] text-white rounded-xl px-4 py-3"
                >
                  <option value="">
                    Select Staff
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
              )}

              <input
                type="datetime-local"
                required
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
                className="w-full bg-[#0f172a] text-white rounded-xl px-4 py-3"
              />

              <input
                type="datetime-local"
                required
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
                className="w-full bg-[#0f172a] text-white rounded-xl px-4 py-3"
              />

              <label className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={
                    form.is_open
                  }
                  onChange={(
                    e
                  ) =>
                    setForm({
                      ...form,
                      is_open:
                        e.target
                          .checked,
                    })
                  }
                />
                Open Shift
              </label>

              <label className="flex gap-2 text-sm">
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

              <button className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500">
                Save Shift
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowModal(
                    false
                  )
                }
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10"
              >
                Cancel
              </button>

            </form>

          </div>

        </div>
      )}

      <style>{`
        .schedule-wrap .rbc-off-range-bg{
          background: transparent !important;
        }

        .schedule-wrap .rbc-today{
          background: rgba(99,102,241,.12) !important;
        }

        .schedule-wrap .rbc-header{
          padding:10px;
          border-color:rgba(255,255,255,.08);
        }

        .schedule-wrap .rbc-time-gutter,
        .schedule-wrap .rbc-time-header-gutter{
          display:none;
        }

        .schedule-wrap .rbc-time-content{
          border-top:1px solid rgba(255,255,255,.08);
        }

        .schedule-wrap .rbc-timeslot-group{
          min-height:60px;
          border-color:rgba(255,255,255,.04);
        }

        .schedule-wrap .rbc-label{
          display:none;
        }

        .schedule-wrap .rbc-event{
          padding:4px 8px;
          font-size:12px;
        }
      `}</style>

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
      <div className="flex justify-between items-center">
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