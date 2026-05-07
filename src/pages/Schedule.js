import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { scheduleAPI, userAPI } from "../services/api";

/* ================= CONFIG ================= */

const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_WIDTH = 80;
const ROW_HEIGHT = 70;

/* ================= HELPERS ================= */

function toX(time) {
  const m = moment(time);
  return (m.hours() + m.minutes() / 60 - START_HOUR) * HOUR_WIDTH;
}

function formatName(name) {
  if (!name) return "";
  const [first, last] = name.split(" ");
  return last ? `${first} ${last[0]}` : first;
}

/* ================= MAIN ================= */

export default function Schedule() {
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);

  const [view, setView] = useState("week");
  const [date, setDate] = useState(new Date());

  const [drag, setDrag] = useState(null);
  const [resize, setResize] = useState(null);

  const [showAdd, setShowAdd] = useState(false);

  const holidays = [
    "2026-05-08", // example
  ];

  /* ================= LOAD ================= */

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const [u, s] = await Promise.all([
      userAPI.getAll(),
      scheduleAPI.getAll(),
    ]);
    setUsers(u || []);
    setShifts(s || []);
  }

  async function createShift(data) {
    await scheduleAPI.create(data);
    load();
  }

  async function updateShift(id, data) {
    await scheduleAPI.update(id, data);
    load();
  }

  async function deleteShift(id) {
    await scheduleAPI.delete(id);
    load();
  }

  /* ================= NAV ================= */

  function prev() {
    setDate(moment(date).subtract(1, view === "month" ? "month" : "week").toDate());
  }

  function next() {
    setDate(moment(date).add(1, view === "month" ? "month" : "week").toDate());
  }

  /* ================= DAYS ================= */

  const days = useMemo(() => {
    const start = moment(date).startOf("isoWeek");
    return Array.from({ length: 7 }).map((_, i) =>
      start.clone().add(i, "days")
    );
  }, [date]);

  /* ================= DRAG ================= */

  useEffect(() => {
    function move(e) {
      if (!drag) return;

      const delta = e.clientX - drag.startX;
      const hours = delta / HOUR_WIDTH;

      const start = moment(drag.origStart).add(hours, "hours");
      const end = moment(drag.origEnd).add(hours, "hours");

      const snappedStart = start.minute(Math.round(start.minute() / 15) * 15);
      const snappedEnd = snappedStart.clone().add(
        moment(drag.origEnd).diff(drag.origStart),
        "minutes"
      );

      setDrag({
        ...drag,
        ghost: {
          ...drag.shift,
          start_time: snappedStart.toISOString(),
          end_time: snappedEnd.toISOString(),
        },
      });
    }

    function up() {
      if (drag?.ghost) {
        updateShift(drag.shift.id, drag.ghost);
      }
      setDrag(null);
    }

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [drag]);

  /* ================= RESIZE ================= */

  useEffect(() => {
    function move(e) {
      if (!resize) return;

      const delta = e.clientX - resize.startX;
      const hours = delta / HOUR_WIDTH;

      const end = moment(resize.origEnd).add(hours, "hours");
      const snapped = end.minute(Math.round(end.minute() / 15) * 15);

      setResize({
        ...resize,
        ghost: {
          ...resize.shift,
          end_time: snapped.toISOString(),
        },
      });
    }

    function up() {
      if (resize?.ghost) {
        updateShift(resize.shift.id, resize.ghost);
      }
      setResize(null);
    }

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [resize]);

  /* ================= UI ================= */

  return (
    <div className="h-screen flex bg-[#0B1220] text-white">

      {/* MAIN */}
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        <div className="flex justify-between p-4 border-b border-white/10 bg-[#111827]">
          <div>
            {view === "week" && (
              <>
                {moment(date).startOf("isoWeek").format("DD MMM")} -{" "}
                {moment(date).endOf("isoWeek").format("DD MMM YYYY")}
              </>
            )}
            {view === "month" && moment(date).format("MMMM YYYY")}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setView("week")}>Week</button>
            <button onClick={() => setView("month")}>Month</button>

            <button onClick={prev}>←</button>
            <button onClick={() => setDate(new Date())}>Today</button>
            <button onClick={next}>→</button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-auto p-4">

          {/* ================= WEEK VIEW ================= */}
          {view === "week" && (
            <div>

              {/* HEADER */}
              <div className="grid grid-cols-8 mb-2">
                <div />
                {days.map((d, i) => (
                  <div key={i} className="text-xs text-center">
                    {d.format("ddd DD")}
                  </div>
                ))}
              </div>

              {/* USERS */}
              {users.map(user => (
                <div key={user.id} className="grid grid-cols-8 mb-2">

                  {/* NAME */}
                  <div className="text-sm p-2">{user.name}</div>

                  {/* DAYS */}
                  {days.map((day, i) => {
                    const ds = day.format("YYYY-MM-DD");

                    const dayShifts = shifts.filter(
                      s => s.date === ds && s.user_id === user.id
                    );

                    const isHoliday = holidays.includes(ds);

                    return (
                      <div
                        key={i}
                        className={`relative border border-white/10`}
                        style={{ height: ROW_HEIGHT }}
                      >

                        {/* HOLIDAY */}
                        {isHoliday && (
                          <div className="absolute inset-0 bg-red-500/10" />
                        )}

                        {/* SHIFTS */}
                        {dayShifts.map(s => {
                          const active =
                            drag?.shift?.id === s.id
                              ? drag.ghost
                              : resize?.shift?.id === s.id
                              ? resize.ghost
                              : s;

                          const left = toX(active.start_time);
                          const width =
                            (moment(active.end_time).diff(
                              moment(active.start_time),
                              "minutes"
                            ) / 60) * HOUR_WIDTH;

                          return (
                            <div
                              key={s.id}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setDrag({
                                  shift: s,
                                  startX: e.clientX,
                                  origStart: s.start_time,
                                  origEnd: s.end_time,
                                });
                              }}
                              onDoubleClick={() => {
                                if (window.confirm("Delete shift?")) {
                                  deleteShift(s.id);
                                }
                              }}
                              className="absolute px-2 py-1 text-xs rounded-lg cursor-move"
                              style={{
                                left,
                                width,
                                top: 6,
                                background:
                                  "linear-gradient(135deg,#6366f1,#4f46e5)",
                              }}
                            >
                              <div>{formatName(user.name)}</div>
                              <div className="text-[10px]">
                                {moment(active.start_time).format("HH:mm")} -{" "}
                                {moment(active.end_time).format("HH:mm")}
                              </div>

                              {/* RESIZE */}
                              <div
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  setResize({
                                    shift: s,
                                    startX: e.clientX,
                                    origEnd: s.end_time,
                                  });
                                }}
                                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize"
                              />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* ================= MONTH VIEW ================= */}
          {view === "month" && (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 42 }).map((_, i) => {
                const start = moment(date).startOf("month").startOf("isoWeek");
                const d = start.clone().add(i, "days");

                const ds = d.format("YYYY-MM-DD");
                const isHoliday = holidays.includes(ds);

                return (
                  <div key={i} className="border p-2 min-h-[100px] relative">
                    <div className="text-xs">{d.format("DD")}</div>

                    {isHoliday && (
                      <div className="absolute inset-0 bg-red-500/10" />
                    )}

                    {shifts
                      .filter(s => s.date === ds)
                      .slice(0, 4)
                      .map(s => {
                        const user = users.find(u => u.id === s.user_id);

                        return (
                          <div
                            key={s.id}
                            className="text-[10px] bg-indigo-600 mt-1 p-1 rounded"
                          >
                            {formatName(user?.name)}{" "}
                            {moment(s.start_time).format("HH:mm")}
                          </div>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}