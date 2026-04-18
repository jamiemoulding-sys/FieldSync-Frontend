// src/pages/Schedule.jsx
// NEXT FIX VERSION
// COPY / PASTE READY
// FIXES:
// ✅ Uses REAL locations from API (not fake hardcoded)
// ✅ Bulk scheduling restored
// ✅ Add shift works properly
// ✅ Weekly view clearer
// ✅ Better month/week/day layout
// ✅ Holidays shown but blocked from edits
// ✅ Bulk add by employee + location
// ✅ Wage totals from selected month only
// ✅ Cleaner colours
// ✅ Existing page upgraded

import React, { useEffect, useState } from "react";
import {
  Calendar,
  momentLocalizer,
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
  Users,
  CalendarDays,
  PoundSterling,
  Plus,
  RefreshCw,
  Building2,
  Briefcase,
} from "lucide-react";

const localizer =
  momentLocalizer(moment);

const DnDCalendar =
  withDragAndDrop(Calendar);

export default function Schedule() {
  const [events, setEvents] =
    useState([]);

  const [users, setUsers] =
    useState([]);

  const [locations, setLocations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [view, setView] =
    useState("week");

  const [date, setDate] =
    useState(new Date());

  const [filterLocation, setFilterLocation] =
    useState("all");

  const [showModal, setShowModal] =
    useState(false);

  const [editing, setEditing] =
    useState(null);

  const [form, setForm] = useState({
    user_id: "",
    location_id: "",
    start: "",
    end: "",
    overtime: false,
    open_shift: false,
  });

  const [bulk, setBulk] =
    useState({
      staff: [],
      location_id: "",
      from: "",
      to: "",
      start: "09:00",
      end: "17:00",
    });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);

      const [
        schedules,
        holidays,
        usersRes,
        locationsRes,
      ] = await Promise.all([
        scheduleAPI.getAll(),
        holidayAPI.getAll(),
        userAPI.getAll(),
        locationAPI.getAll(),
      ]);

      const safeUsers =
        usersRes || [];

      const safeLocations =
        locationsRes || [];

      const userMap = {};
      const locationMap = {};

      safeUsers.forEach((u) => {
        userMap[u.id] =
          u.name || u.email;
      });

      safeLocations.forEach(
        (l, i) => {
          locationMap[l.id] = {
            name: l.name,
            colour: colours[
              i %
                colours.length
            ],
          };
        }
      );

      const shiftRows =
        (schedules || []).map(
          (s) => {
            const loc =
              locationMap[
                s.location_id
              ] || {
                name:
                  "No Location",
                colour:
                  "#4f46e5",
              };

            const isOpen =
              s.open_shift;

            return {
              id:
                "shift-" +
                s.id,
              dbId: s.id,
              type:
                isOpen
                  ? "open"
                  : s.overtime
                  ? "overtime"
                  : "shift",
              title: isOpen
                ? `OPEN - ${loc.name}`
                : `${
                    userMap[
                      s.user_id
                    ] || "Staff"
                  } • ${
                    loc.name
                  }`,
              start:
                new Date(
                  s.start_time
                ),
              end:
                new Date(
                  s.end_time
                ),
              user_id:
                s.user_id,
              location_id:
                s.location_id,
              hourly_rate:
                Number(
                  safeUsers.find(
                    (u) =>
                      u.id ===
                      s.user_id
                  )
                    ?.hourly_rate ||
                    0
                ),
              colour:
                loc.colour,
            };
          }
        );

      const holidayRows =
        (holidays || [])
          .filter(
            (h) =>
              h.status ===
              "approved"
          )
          .map((h) => ({
            id:
              "holiday-" +
              h.id,
            dbId: h.id,
            type:
              "holiday",
            title: `${
              userMap[
                h.user_id
              ] || h.name
            } - HOLIDAY`,
            start:
              new Date(
                h.start_date
              ),
            end: moment(
              h.end_date
            )
              .add(
                1,
                "day"
              )
              .toDate(),
            allDay: true,
          }));

      setUsers(safeUsers);
      setLocations(
        safeLocations
      );
      setEvents([
        ...shiftRows,
        ...holidayRows,
      ]);
    } finally {
      setLoading(false);
    }
  }

  const filteredEvents =
    events.filter((e) => {
      if (
        filterLocation ===
        "all"
      )
        return true;

      return (
        e.location_id ===
          filterLocation ||
        e.type ===
          "holiday"
      );
    });

  const currentMonth =
    filteredEvents.filter(
      (e) =>
        moment(
          e.start
        ).month() ===
          moment(
            date
          ).month() &&
        moment(
          e.start
        ).year() ===
          moment(
            date
          ).year()
    );

  const wages =
    currentMonth
      .filter(
        (e) =>
          e.type ===
            "shift" ||
          e.type ===
            "overtime"
      )
      .reduce(
        (sum, e) => {
          const hrs =
            (e.end -
              e.start) /
            3600000;

          return (
            sum +
            hrs *
              e.hourly_rate
          );
        },
        0
      );

  const openCount =
    currentMonth.filter(
      (e) =>
        e.type ===
        "open"
    ).length;

  async function saveShift() {
    const payload = {
      user_id:
        form.open_shift
          ? null
          : form.user_id,
      location_id:
        form.location_id,
      open_shift:
        form.open_shift,
      overtime:
        form.overtime,
      date: moment(
        form.start
      ).format(
        "YYYY-MM-DD"
      ),
      start_time:
        form.start,
      end_time:
        form.end,
    };

    if (editing) {
      await scheduleAPI.update(
        editing.dbId,
        payload
      );
    } else {
      await scheduleAPI.create(
        payload
      );
    }

    closeModal();
    load();
  }

  async function bulkCreate() {
    if (
      !bulk.staff.length ||
      !bulk.location_id ||
      !bulk.from ||
      !bulk.to
    ) {
      return alert(
        "Fill all bulk fields"
      );
    }

    let d = moment(
      bulk.from
    );

    while (
      d <=
      moment(
        bulk.to
      )
    ) {
      for (const id of bulk.staff) {
        await scheduleAPI.create({
          user_id: id,
          location_id:
            bulk.location_id,
          date: d.format(
            "YYYY-MM-DD"
          ),
          start_time: `${d.format(
            "YYYY-MM-DD"
          )}T${
            bulk.start
          }`,
          end_time: `${d.format(
            "YYYY-MM-DD"
          )}T${
            bulk.end
          }`,
        });
      }

      d.add(
        1,
        "day"
      );
    }

    load();
  }

  async function deleteShift() {
    await scheduleAPI.delete(
      editing.dbId
    );

    closeModal();
    load();
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);

    setForm({
      user_id: "",
      location_id: "",
      start: "",
      end: "",
      overtime: false,
      open_shift: false,
    });
  }

  function openNew() {
    setEditing(null);

    setForm({
      user_id: "",
      location_id:
        locations[0]?.id ||
        "",
      start: moment().format(
        "YYYY-MM-DDT09:00"
      ),
      end: moment().format(
        "YYYY-MM-DDT17:00"
      ),
      overtime: false,
      open_shift: false,
    });

    setShowModal(true);
  }

  function editShift(e) {
    if (
      e.type ===
      "holiday"
    )
      return;

    setEditing(e);

    setForm({
      user_id:
        e.user_id || "",
      location_id:
        e.location_id ||
        "",
      start: moment(
        e.start
      ).format(
        "YYYY-MM-DDTHH:mm"
      ),
      end: moment(
        e.end
      ).format(
        "YYYY-MM-DDTHH:mm"
      ),
      overtime:
        e.type ===
        "overtime",
      open_shift:
        e.type ===
        "open",
    });

    setShowModal(true);
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
      event.dbId,
      {
        start_time:
          start,
        end_time: end,
      }
    );

    load();
  }

  if (loading)
    return (
      <div className="text-gray-400">
        Loading...
      </div>
    );

  return (
    <div className="space-y-6">

      <div className="flex justify-between flex-wrap gap-3">

        <div>
          <h1 className="text-3xl font-semibold">
            Schedule
          </h1>
          <p className="text-gray-400 text-sm">
            Live rota planner
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">

          <select
            value={
              filterLocation
            }
            onChange={(e) =>
              setFilterLocation(
                e.target.value
              )
            }
            className="bg-[#111827] text-white px-4 py-2 rounded-xl"
          >
            <option value="all">
              All Locations
            </option>

            {locations.map(
              (l) => (
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

          <button
            onClick={load}
            className="px-4 py-2 rounded-xl bg-white/5"
          >
            <RefreshCw size={16} />
          </button>

          <button
            onClick={
              openNew
            }
            className="px-4 py-2 rounded-xl bg-indigo-600"
          >
            <Plus size={16} />
          </button>

        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">

        <Card
          title="Staff"
          value={
            users.length
          }
          icon={
            <Users size={16} />
          }
        />

        <Card
          title="Month Shifts"
          value={
            currentMonth.filter(
              (e) =>
                e.type ===
                  "shift" ||
                e.type ===
                  "overtime"
            ).length
          }
          icon={
            <CalendarDays size={16} />
          }
        />

        <Card
          title="Open"
          value={
            openCount
          }
          icon={
            <Briefcase size={16} />
          }
        />

        <Card
          title="Wages"
          value={`£${wages.toFixed(
            2
          )}`}
          icon={
            <PoundSterling size={16} />
          }
        />

      </div>

      {/* BULK */}
      <div className="rounded-2xl bg-[#020617] border border-white/10 p-5 space-y-4">

        <h2 className="font-semibold">
          Bulk Schedule
        </h2>

        <div className="grid md:grid-cols-5 gap-3">

          <input
            type="date"
            value={bulk.from}
            onChange={(e) =>
              setBulk({
                ...bulk,
                from:
                  e.target
                    .value,
              })
            }
            className="bg-[#111827] px-3 py-2 rounded-xl"
          />

          <input
            type="date"
            value={bulk.to}
            onChange={(e) =>
              setBulk({
                ...bulk,
                to: e.target
                  .value,
              })
            }
            className="bg-[#111827] px-3 py-2 rounded-xl"
          />

          <input
            type="time"
            value={
              bulk.start
            }
            onChange={(e) =>
              setBulk({
                ...bulk,
                start:
                  e.target
                    .value,
              })
            }
            className="bg-[#111827] px-3 py-2 rounded-xl"
          />

          <input
            type="time"
            value={
              bulk.end
            }
            onChange={(e) =>
              setBulk({
                ...bulk,
                end: e.target
                  .value,
              })
            }
            className="bg-[#111827] px-3 py-2 rounded-xl"
          />

          <select
            value={
              bulk.location_id
            }
            onChange={(e) =>
              setBulk({
                ...bulk,
                location_id:
                  e.target
                    .value,
              })
            }
            className="bg-[#111827] px-3 py-2 rounded-xl"
          >
            <option value="">
              Location
            </option>

            {locations.map(
              (l) => (
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

        </div>

        <div className="grid md:grid-cols-4 gap-2">

          {users.map((u) => (
            <label
              key={u.id}
              className="bg-[#111827] rounded-xl px-3 py-2 flex gap-2"
            >
              <input
                type="checkbox"
                checked={bulk.staff.includes(
                  u.id
                )}
                onChange={() => {
                  if (
                    bulk.staff.includes(
                      u.id
                    )
                  ) {
                    setBulk({
                      ...bulk,
                      staff:
                        bulk.staff.filter(
                          (
                            x
                          ) =>
                            x !==
                            u.id
                        ),
                    });
                  } else {
                    setBulk({
                      ...bulk,
                      staff: [
                        ...bulk.staff,
                        u.id,
                      ],
                    });
                  }
                }}
              />
              {u.name}
            </label>
          ))}

        </div>

        <button
          onClick={
            bulkCreate
          }
          className="w-full py-3 rounded-xl bg-indigo-600"
        >
          Create Bulk Shifts
        </button>

      </div>

      {/* CALENDAR */}
      <div className="rounded-2xl border border-white/10 bg-[#020617] p-4">

        <DnDCalendar
          localizer={
            localizer
          }
          events={
            filteredEvents
          }
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          views={[
            "month",
            "week",
            "day",
            "agenda",
          ]}
          step={60}
          timeslots={1}
          selectable
          resizable
          popup
          style={{
            height:
              "78vh",
          }}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={
            editShift
          }
          onEventDrop={
            moveShift
          }
          onEventResize={
            moveShift
          }
          eventPropGetter={(
            event
          ) => ({
            style: {
              backgroundColor:
                event.type ===
                "holiday"
                  ? "#16a34a"
                  : event.type ===
                    "open"
                  ? "#f59e0b"
                  : event.type ===
                    "overtime"
                  ? "#7c3aed"
                  : event.colour,
              border: "none",
              borderRadius:
                "8px",
              padding:
                "2px 6px",
              fontSize:
                "12px",
            },
          })}
        />

      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">

          <div className="w-full max-w-md bg-[#020617] border border-white/10 rounded-2xl p-6 space-y-4">

            <h2 className="text-xl font-semibold">
              {editing
                ? "Edit Shift"
                : "Add Shift"}
            </h2>

            <select
              value={
                form.user_id
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  user_id:
                    e.target
                      .value,
                })
              }
              className="w-full bg-[#111827] px-4 py-3 rounded-xl"
            >
              <option value="">
                Staff
              </option>

              {users.map(
                (u) => (
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

            <select
              value={
                form.location_id
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  location_id:
                    e.target
                      .value,
                })
              }
              className="w-full bg-[#111827] px-4 py-3 rounded-xl"
            >
              {locations.map(
                (l) => (
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
              type="datetime-local"
              value={
                form.start
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  start:
                    e.target
                      .value,
                })
              }
              className="w-full bg-[#111827] px-4 py-3 rounded-xl"
            />

            <input
              type="datetime-local"
              value={
                form.end
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  end:
                    e.target
                      .value,
                })
              }
              className="w-full bg-[#111827] px-4 py-3 rounded-xl"
            />

            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={
                  form.open_shift
                }
                onChange={(e) =>
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
                onChange={(e) =>
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

            <button
              onClick={
                saveShift
              }
              className="w-full py-3 rounded-xl bg-indigo-600"
            >
              Save Shift
            </button>

            {editing && (
              <button
                onClick={
                  deleteShift
                }
                className="w-full py-3 rounded-xl bg-red-600"
              >
                Delete
              </button>
            )}

            <button
              onClick={
                closeModal
              }
              className="w-full py-3 rounded-xl bg-white/5"
            >
              Cancel
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

const colours = [
  "#4f46e5",
  "#16a34a",
  "#ea580c",
  "#0891b2",
  "#9333ea",
  "#dc2626",
];

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