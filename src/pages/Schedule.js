import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { io } from "socket.io-client";
import { scheduleAPI, userAPI } from "../services/api";

/* ================= SOCKET ================= */

const socket = io("http://localhost:4000");

/* ================= CONFIG ================= */

const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_WIDTH = 80;

/* ================= HELPERS ================= */

function snap(hour) {
  return Math.round(hour * 4) / 4;
}

function formatHour(hour) {
  const h = Math.floor(hour);
  const m = Math.round((hour % 1) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function hours(start, end) {
  return (new Date(end) - new Date(start)) / 3600000;
}

/* ================= AVAILABILITY ================= */

function isUserAvailable(user, shift, allShifts) {
  const conflict = allShifts.some(
    (s) =>
      s.user_id === user.id &&
      s.date === shift.date &&
      new Date(shift.start_time) < new Date(s.end_time) &&
      new Date(shift.end_time) > new Date(s.start_time)
  );

  if (conflict) return false;

  const weekHours = allShifts
    .filter((s) => s.user_id === user.id)
    .reduce((sum, s) => sum + hours(s.start_time, s.end_time), 0);

  if (weekHours >= (user.max_hours || 48)) return false;

  return true;
}

/* ================= SCORING ================= */

function scoreUser(user, shift, shifts) {
  const worked = shifts
    .filter((s) => s.user_id === user.id)
    .reduce((sum, s) => sum + hours(s.start_time, s.end_time), 0);

  return (100 - worked) + (50 - (user.hourly_rate || 0));
}

/* ================= MAIN ================= */

export default function Schedule() {
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);

  const [date, setDate] = useState(new Date());
  const [view, setView] = useState("week");
  const [editMode, setEditMode] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const [dragging, setDragging] = useState(null);
  const [creating, setCreating] = useState(null);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    load();

    socket.on("shift:update", (data) => {
      setShifts((prev) =>
        prev.map((s) =>
          s.id === data.id ? { ...s, ...data } : s
        )
      );
    });

    socket.on("shift:create", (data) => {
      setShifts((prev) => [...prev, data]);
    });

    return () => socket.disconnect();
  }, []);

  async function load() {
    const [u, s] = await Promise.all([
      userAPI.getAll(),
      scheduleAPI.getAll(),
    ]);

    setUsers(u || []);
    setShifts(s || []);
  }

  function notify(text) {
    setToast(text);
    setTimeout(() => setToast(null), 2500);
  }

  /* ================= CREATE DRAG ================= */

  function startCreate(e, day, userId) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const hour = snap(START_HOUR + x / HOUR_WIDTH);

    setCreating({ day, userId, start: hour, end: hour });
  }

  function moveCreate(e) {
    if (!creating) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const hour = snap(START_HOUR + x / HOUR_WIDTH);

    setCreating((c) => ({ ...c, end: hour }));
  }

  function endCreate() {
    if (!creating) return;

    const start = Math.min(creating.start, creating.end);
    const end = Math.max(creating.start, creating.end);

    if (end - start < 0.25) {
      setCreating(null);
      return;
    }

    const startTime = moment(creating.day)
      .hour(Math.floor(start))
      .minute((start % 1) * 60);

    const endTime = moment(creating.day)
      .hour(Math.floor(end))
      .minute((end % 1) * 60);

    scheduleAPI.create({
      user_id: creating.userId,
      date: creating.day.format("YYYY-MM-DD"),
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      type: "assigned",
      status: "filled",
    });

    notify("Shift created");
    load();
    setCreating(null);
  }

  /* ================= AUTO FILL ================= */

  async function runAutoFill() {
    const openShifts = shifts.filter(
      (s) =>
        (!s.user_id || s.type === "open") &&
        s.status !== "filled"
    );

    let filled = 0;

    for (const shift of openShifts) {
      const available = users.filter((u) =>
        isUserAvailable(u, shift, shifts)
      );

      if (!available.length) continue;

      const best = available
        .map((u) => ({
          user: u,
          score: scoreUser(u, shift, shifts),
        }))
        .sort((a, b) => b.score - a.score)[0].user;

      await scheduleAPI.update(shift.id, {
        user_id: best.id,
        type: "assigned",
        status: "filled",
      });

      filled++;
    }

    notify(`AI filled ${filled} shifts`);
    load();
  }

  /* ================= DAYS ================= */

  const days = useMemo(() => {
    if (view === "week") {
      const start = moment(date).startOf("week");
      return Array.from({ length: 7 }).map((_, i) =>
        start.clone().add(i, "days")
      );
    }

    if (view === "month") {
      const start = moment(date).startOf("month");
      return Array.from({ length: start.daysInMonth() }).map((_, i) =>
        start.clone().add(i, "days")
      );
    }

    return [];
  }, [date, view]);

  /* ================= UI ================= */

  return (
    <div className="p-6 space-y-6 text-white">

      {/* HEADER */}
      <div className="flex justify-between items-center flex-wrap gap-3">

        <div className="flex gap-2">
          <button onClick={() => setDate(moment(date).subtract(7,"days").toDate())}>←</button>
          <button onClick={() => setDate(new Date())}>Today</button>
          <button onClick={() => setDate(moment(date).add(7,"days").toDate())}>→</button>
        </div>

        <div className="font-semibold">
          {moment(date).format("MMMM YYYY")}
        </div>

        <div className="flex gap-2 flex-wrap">

          <button onClick={() => setView("week")} className="bg-indigo-600 px-3 py-1 rounded">Week</button>
          <button onClick={() => setView("month")} className="bg-[#111827] px-3 py-1 rounded">Month</button>
          <button onClick={() => setView("list")} className="bg-[#111827] px-3 py-1 rounded">List</button>

          <button onClick={() => setEditMode(e=>!e)} className="bg-yellow-600 px-3 py-1 rounded">
            {editMode ? "Done" : "Edit"}
          </button>

          <button onClick={() => setShowAdd(true)} className="bg-emerald-600 px-3 py-1 rounded">
            + Add
          </button>

          <button onClick={runAutoFill} className="bg-purple-600 px-3 py-1 rounded">
            🤖 Auto Fill
          </button>

        </div>
      </div>

      {/* GRID */}
      {view !== "list" && (
        <div className="overflow-x-auto border border-white/20">

          {users.map((user) => (
            <div key={user.id} className="flex border-b border-white/20">

              <div className="w-[180px] p-2 bg-[#020617] font-medium">
                {user.name}
              </div>

              {days.map((day) => {
                const ds = day.format("YYYY-MM-DD");

                const dayShifts = shifts.filter(
                  (s) =>
                    s.date === ds &&
                    (s.user_id === user.id || !s.user_id)
                );

                return (
                  <div
                    key={ds}
                    className="relative border-l border-white/10"
                    style={{
                      width: (END_HOUR - START_HOUR) * HOUR_WIDTH,
                      height: 60,
                    }}
                    onMouseDown={(e)=>startCreate(e,day,user.id)}
                    onMouseMove={moveCreate}
                    onMouseUp={endCreate}
                  >

                    {dayShifts.map((s) => {
                      const start = moment(s.start_time);
                      const end = moment(s.end_time);

                      const left =
                        (start.hours() - START_HOUR) * HOUR_WIDTH;

                      const width =
                        (end.hours() - start.hours()) * HOUR_WIDTH;

                      return (
                        <div
                          key={s.id}
                          draggable
                          onDragStart={()=>setDragging(s)}
                          className={`absolute text-xs px-2 rounded ${
                            s.user_id ? "bg-indigo-600" : "bg-gray-500"
                          }`}
                          style={{ top:5,left,width,height:20 }}
                        >
                          {start.format("HH:mm")}
                        </div>
                      );
                    })}

                    {creating && creating.userId===user.id && (
                      <div
                        className="absolute bg-green-500/40 text-xs"
                        style={{
                          top:5,
                          left: Math.min(creating.start,creating.end)*HOUR_WIDTH,
                          width: Math.abs(creating.end-creating.start)*HOUR_WIDTH,
                          height:20
                        }}
                      >
                        {formatHour(creating.start)} - {formatHour(creating.end)}
                      </div>
                    )}

                  </div>
                );
              })}

            </div>
          ))}

        </div>
      )}

      {/* LIST VIEW */}
      {view === "list" && (
        <div className="space-y-2">
          {shifts.map((s) => (
            <div key={s.id} className="p-3 border rounded">
              {moment(s.date).format("DD MMM")} — {s.start_time}
            </div>
          ))}
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-black px-4 py-2 rounded">
          {toast}
        </div>
      )}

    </div>
  );
}