// src/pages/Schedule.jsx
// COMPLETE MASTER VERSION
// Copy / Paste Ready
// Includes:
// ✅ Modern clean calendar
// ✅ Month / Week / Day / Agenda
// ✅ Drag & Drop shifts
// ✅ Resize shifts
// ✅ Delete shifts
// ✅ Bulk schedule restored
// ✅ Real locations from API
// ✅ Open shifts
// ✅ Holiday overlay with employee names
// ✅ Monthly wages auto changes with viewed month
// ✅ Better week/day layouts
// ✅ Better dark styling
// ✅ No fake data

import React, {
  useEffect,
  useState,
  useMemo,
} from "react";

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
  PoundSterling,
  CalendarDays,
  Plus,
  Trash2,
  RefreshCw,
} from "lucide-react";

const localizer =
  momentLocalizer(moment);

const DnDCalendar =
  withDragAndDrop(Calendar);

export default function Schedule() {
  const [users, setUsers] =
    useState([]);

  const [locations, setLocations] =
    useState([]);

  const [schedules, setSchedules] =
    useState([]);

  const [holidays, setHolidays] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [view, setView] =
    useState("month");

  const [date, setDate] =
    useState(new Date());

  const [locationFilter, setLocationFilter] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [showBulk, setShowBulk] =
    useState(true);

  const [form, setForm] = useState({
    user_id: "",
    start: "",
    end: "",
    location_id: "",
    open_shift: false,
  });

  const [bulk, setBulk] = useState({
    from: "",
    to: "",
    start: "09:00",
    end: "17:00",
    location_id: "",
    user_ids: [],
    open_shift: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [
        usersRes,
        schedRes,
        holRes,
        locRes,
      ] = await Promise.all([
        userAPI.getAll(),
        scheduleAPI.getAll(),
        holidayAPI.getAll(),
        locationAPI.getAll(),
      ]);

      setUsers(usersRes || []);
      setSchedules(
        schedRes || []
      );
      setHolidays(
        holRes || []
      );
      setLocations(
        locRes || []
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const userMap = useMemo(() => {
    const map = {};
    users.forEach((u) => {
      map[u.id] =
        u.name || u.email;
    });
    return map;
  }, [users]);

  const locationMap =
    useMemo(() => {
      const map = {};
      locations.forEach(
        (l) => {
          map[l.id] = l.name;
        }
      );
      return map;
    }, [locations]);

  function buildEvents() {
    const shiftRows =
      schedules.map((s) => {
        const employee =
          s.open_shift
            ? "OPEN SHIFT"
            : userMap[
                s.user_id
              ] ||
              "Employee";

        const location =
          locationMap[
            s.location_id
          ] ||
          "No Location";

        return {
          id: s.id,
          type:
            s.open_shift
              ? "open"
              : "shift",
          title: `${employee} • ${location}`,
          start:
            new Date(
              s.start_time
            ),
          end: new Date(
            s.end_time
          ),
          raw: s,
        };
      });

    const holidayRows =
      holidays
        .filter(
          (h) =>
            h.status ===
            "approved"
        )
        .map((h) => ({
          id:
            "h_" +
            h.id,
          type:
            "holiday",
          title: `${
            userMap[
              h.user_id
            ] ||
            h.name ||
            "Employee"
          } • HOLIDAY`,
          start:
            new Date(
              h.start_date +
                "T00:00:00"
            ),
          end:
            new Date(
              moment(
                h.end_date
              )
                .add(
                  1,
                  "day"
                )
                .format()
            ),
          allDay: true,
        }));

    let rows = [
      ...shiftRows,
      ...holidayRows,
    ];

    if (
      locationFilter
    ) {
      rows =
        rows.filter(
          (x) =>
            x.type ===
              "holiday" ||
            String(
              x.raw
                ?.location_id
            ) ===
              String(
                locationFilter
              )
        );
    }

    return rows;
  }

  const events =
    buildEvents();

  const viewedMonth =
    moment(date).month();

  const viewedYear =
    moment(date).year();

  const monthShifts =
    schedules.filter(
      (s) =>
        moment(
          s.start_time
        ).month() ===
          viewedMonth &&
        moment(
          s.start_time
        ).year() ===
          viewedYear
    );

  const wageTotal =
    monthShifts.reduce(
      (
        sum,
        s
      ) => {
        if (
          s.open_shift
        )
          return sum;

        const user =
          users.find(
            (
              u
            ) =>
              String(
                u.id
              ) ===
              String(
                s.user_id
              )
          ) || {};

        const hrs =
          moment(
            s.end_time
          ).diff(
            moment(
              s.start_time
            ),
            "minutes"
          ) / 60;

        return (
          sum +
          hrs *
            Number(
              user.hourly_rate ||
                0
            )
        );
      },
      0
    );

  const openShifts =
    monthShifts.filter(
      (x) =>
        x.open_shift
    ).length;

  async function createShift(
    e
  ) {
    e.preventDefault();

    await scheduleAPI.create(
      {
        user_id:
          form.open_shift
            ? null
            : form.user_id,
        location_id:
          form.location_id,
        date:
          moment(
            form.start
          ).format(
            "YYYY-MM-DD"
          ),
        start_time:
          form.start,
        end_time:
          form.end,
        open_shift:
          form.open_shift,
      }
    );

    setShowModal(
      false
    );

    loadData();
  }

  async function createBulk() {
    let d = moment(
      bulk.from
    );

    while (
      d.isSameOrBefore(
        moment(
          bulk.to
        ),
        "day"
      )
    ) {
      if (
        bulk.open_shift
      ) {
        await scheduleAPI.create(
          {
            user_id:
              null,
            location_id:
              bulk.location_id,
            date:
              d.format(
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
            open_shift:
              true,
          }
        );
      } else {
        for (const uid of bulk.user_ids) {
          await scheduleAPI.create(
            {
              user_id:
                uid,
              location_id:
                bulk.location_id,
              date:
                d.format(
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
              open_shift:
                false,
            }
          );
        }
      }

      d.add(
        1,
        "day"
      );
    }

    loadData();
  }

  async function onDrop({
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
        end_time:
          end,
        date:
          moment(
            start
          ).format(
            "YYYY-MM-DD"
          ),
      }
    );

    loadData();
  }

  async function onResize({
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
        end_time:
          end,
        date:
          moment(
            start
          ).format(
            "YYYY-MM-DD"
          ),
      }
    );

    loadData();
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

    loadData();
  }

  function styleEvent(
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
          border:
            "none",
          borderRadius:
            "8px",
          color:
            "white",
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
          border:
            "none",
          borderRadius:
            "8px",
          color:
            "#111",
        },
      };
    }

    return {
      style: {
        background:
          "#4f46e5",
        border:
          "none",
        borderRadius:
          "8px",
        color:
          "white",
      },
    };
  }

  if (loading)
    return (
      <div className="text-gray-400">
        Loading...
      </div>
    );

  return (
    <div className="space-y-6">

      <style>{`
.rbc-calendar{
background:#020617;
color:white;
font-family:inherit;
}

.rbc-month-view,
.rbc-time-view,
.rbc-agenda-view{
border:1px solid rgba(255,255,255,.08);
border-radius:18px;
overflow:hidden;
}

.rbc-header{
padding:14px;
font-weight:600;
background:#0f172a;
border-color:rgba(255,255,255,.08)!important;
}

.rbc-toolbar{
margin-bottom:18px;
gap:10px;
flex-wrap:wrap;
}

.rbc-toolbar button{
background:#0f172a;
color:white;
border:1px solid rgba(255,255,255,.08);
padding:8px 14px;
}

.rbc-toolbar button:hover{
background:#1e293b;
}

.rbc-toolbar button.rbc-active{
background:#4f46e5;
}

.rbc-off-range-bg{
background:#111827!important;
}

.rbc-today{
background:rgba(79,70,229,.08)!important;
}

.rbc-timeslot-group,
.rbc-time-content,
.rbc-day-slot,
.rbc-time-header-content,
.rbc-time-view,
.rbc-month-row{
border-color:rgba(255,255,255,.08)!important;
}

.rbc-day-bg{
background:#020617;
}

.rbc-event{
font-size:12px;
padding:3px 6px;
}

input,select{
color:white;
}
option{
color:black;
}
      `}</style>

      {/* HEADER */}

      <div className="flex justify-between items-center flex-wrap gap-4">

        <div>
          <h1 className="text-3xl font-semibold">
            Schedule
          </h1>

          <p className="text-gray-400 text-sm">
            Live rota planner
          </p>
        </div>

        <div className="flex gap-2">

          <select
            value={
              locationFilter
            }
            onChange={(e)=>
              setLocationFilter(
                e.target.value
              )
            }
            className="bg-[#0f172a] rounded-xl px-4 py-3"
          >
            <option value="">
              All Locations
            </option>

            {locations.map(
              (l)=>(
                <option
                  key={l.id}
                  value={l.id}
                >
                  {l.name}
                </option>
              )
            )}
          </select>

          <button
            onClick={
              loadData
            }
            className="px-4 py-3 rounded-xl bg-[#0f172a]"
          >
            <RefreshCw size={16}/>
          </button>

          <button
            onClick={()=>
              setShowModal(
                true
              )
            }
            className="px-4 py-3 rounded-xl bg-indigo-600"
          >
            <Plus size={16}/>
          </button>

        </div>

      </div>

      {/* KPI */}

      <div className="grid md:grid-cols-4 gap-4">

        <Card
          title="Staff"
          value={
            users.length
          }
          icon={<Users size={16}/>}
        />

        <Card
          title="Month Shifts"
          value={
            monthShifts.length
          }
          icon={<CalendarDays size={16}/>}
        />

        <Card
          title="Open"
          value={
            openShifts
          }
          icon={<CalendarDays size={16}/>}
        />

        <Card
          title="Wages"
          value={`£${wageTotal.toFixed(
            2
          )}`}
          icon={<PoundSterling size={16}/>}
        />

      </div>

      {/* BULK */}

      <div className="rounded-2xl border border-white/10 bg-[#020617] p-5 space-y-4">

        <h2 className="text-xl font-semibold">
          Bulk Schedule
        </h2>

        <div className="grid md:grid-cols-5 gap-3">

          <input
            type="date"
            value={
              bulk.from
            }
            onChange={(e)=>
              setBulk({
                ...bulk,
                from:
                  e.target.value,
              })
            }
            className="bg-[#0f172a] rounded-xl px-4 py-3"
          />

          <input
            type="date"
            value={
              bulk.to
            }
            onChange={(e)=>
              setBulk({
                ...bulk,
                to:
                  e.target.value,
              })
            }
            className="bg-[#0f172a] rounded-xl px-4 py-3"
          />

          <input
            type="time"
            value={
              bulk.start
            }
            onChange={(e)=>
              setBulk({
                ...bulk,
                start:
                  e.target.value,
              })
            }
            className="bg-[#0f172a] rounded-xl px-4 py-3"
          />

          <input
            type="time"
            value={
              bulk.end
            }
            onChange={(e)=>
              setBulk({
                ...bulk,
                end:
                  e.target.value,
              })
            }
            className="bg-[#0f172a] rounded-xl px-4 py-3"
          />

          <select
            value={
              bulk.location_id
            }
            onChange={(e)=>
              setBulk({
                ...bulk,
                location_id:
                  e.target.value,
              })
            }
            className="bg-[#0f172a] rounded-xl px-4 py-3"
          >
            <option value="">
              Location
            </option>

            {locations.map(
              (l)=>(
                <option
                  key={l.id}
                  value={l.id}
                >
                  {l.name}
                </option>
              )
            )}
          </select>

        </div>

        <label className="flex gap-2 items-center text-sm">
          <input
            type="checkbox"
            checked={
              bulk.open_shift
            }
            onChange={(e)=>
              setBulk({
                ...bulk,
                open_shift:
                  e.target.checked,
              })
            }
          />
          Create Open Shifts
        </label>

        {!bulk.open_shift && (
          <div className="grid md:grid-cols-4 gap-2">

            {users.map(
              (u)=>(
                <label
                  key={u.id}
                  className="bg-[#0f172a] rounded-xl px-3 py-2 flex gap-2"
                >
                  <input
                    type="checkbox"
                    checked={bulk.user_ids.includes(
                      u.id
                    )}
                    onChange={()=>{
                      if(
                        bulk.user_ids.includes(
                          u.id
                        )
                      ){
                        setBulk({
                          ...bulk,
                          user_ids:
                            bulk.user_ids.filter(
                              x=>x!==u.id
                            ),
                        });
                      }else{
                        setBulk({
                          ...bulk,
                          user_ids:[
                            ...bulk.user_ids,
                            u.id,
                          ],
                        });
                      }
                    }}
                  />
                  {u.name}
                </label>
              )
            )}

          </div>
        )}

        <button
          onClick={
            createBulk
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
          events={events}
          startAccessor="start"
          endAccessor="end"
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
          selectable
          popup
          resizable
          step={30}
          timeslots={2}
          style={{
            height:
              "82vh",
          }}
          eventPropGetter={
            styleEvent
          }
          onEventDrop={
            onDrop
          }
          onEventResize={
            onResize
          }
          onDoubleClickEvent={
            deleteShift
          }
          draggableAccessor={(e)=>
            e.type !==
            "holiday"
          }
          resizableAccessor={(e)=>
            e.type !==
            "holiday"
          }
        />

      </div>

      {/* ADD SHIFT */}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">

          <div className="w-full max-w-md bg-[#020617] border border-white/10 rounded-2xl p-6">

            <h2 className="text-xl font-semibold mb-4">
              Add Shift
            </h2>

            <form
              onSubmit={
                createShift
              }
              className="space-y-4"
            >

              <label className="flex gap-2 items-center text-sm">
                <input
                  type="checkbox"
                  checked={
                    form.open_shift
                  }
                  onChange={(e)=>
                    setForm({
                      ...form,
                      open_shift:
                        e.target.checked,
                    })
                  }
                />
                Open Shift
              </label>

              {!form.open_shift && (
                <select
                  required
                  value={
                    form.user_id
                  }
                  onChange={(e)=>
                    setForm({
                      ...form,
                      user_id:
                        e.target.value,
                    })
                  }
                  className="w-full bg-[#0f172a] rounded-xl px-4 py-3"
                >
                  <option value="">
                    Employee
                  </option>

                  {users.map(
                    (u)=>(
                      <option
                        key={u.id}
                        value={u.id}
                      >
                        {u.name}
                      </option>
                    )
                  )}

                </select>
              )}

              <select
                required
                value={
                  form.location_id
                }
                onChange={(e)=>
                  setForm({
                    ...form,
                    location_id:
                      e.target.value,
                  })
                }
                className="w-full bg-[#0f172a] rounded-xl px-4 py-3"
              >
                <option value="">
                  Location
                </option>

                {locations.map(
                  (l)=>(
                    <option
                      key={l.id}
                      value={l.id}
                    >
                      {l.name}
                    </option>
                  )
                )}

              </select>

              <input
                type="datetime-local"
                required
                value={
                  form.start
                }
                onChange={(e)=>
                  setForm({
                    ...form,
                    start:
                      e.target.value,
                  })
                }
                className="w-full bg-[#0f172a] rounded-xl px-4 py-3"
              />

              <input
                type="datetime-local"
                required
                value={
                  form.end
                }
                onChange={(e)=>
                  setForm({
                    ...form,
                    end:
                      e.target.value,
                  })
                }
                className="w-full bg-[#0f172a] rounded-xl px-4 py-3"
              />

              <button className="w-full py-3 rounded-xl bg-indigo-600">
                Save Shift
              </button>

              <button
                type="button"
                onClick={()=>
                  setShowModal(
                    false
                  )
                }
                className="w-full py-3 rounded-xl bg-[#0f172a]"
              >
                Cancel
              </button>

            </form>

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
        <p className="text-sm text-gray-400">
          {title}
        </p>
        <div className="text-indigo-400">
          {icon}
        </div>
      </div>

      <h2 className="text-3xl font-semibold mt-3">
        {value}
      </h2>
    </div>
  );
}