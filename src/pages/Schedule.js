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

/* ================= DEMAND ================= */

function forecastDemand(revenue = 12000) {
  const labourTarget = revenue * 0.3;
  const avgRate = 12;

  const totalHours = labourTarget / avgRate;

  return {
    hoursPerDay: totalHours / 7,
  };
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

  const [dragging, setDragging] = useState(null);
  const [creating, setCreating] = useState(null);

  const [toast, setToast] = useState(null);
  const [templates, setTemplates] = useState([]);

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

  /* ================= CREATE ================= */

  async function createShift(data) {
    await scheduleAPI.create(data);
    notify("Shift created");
    load();
  }

  /* ================= UPDATE ================= */

  async function updateShift(id, data) {
    socket.emit("shift:update", { id, ...data });
    await scheduleAPI.update(id, data);
    load();
  }

  /* ================= AUTO FILL ================= */

  async function runAutoFill() {
    const openShifts = shifts.filter(
      (s) => s.type === "open" && s.status === "open"
    );

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
    }

    notify("AI filled shifts");
    load();
  }

  /* ================= AUTO WEEK ================= */

  async function autoScheduleWeek() {
    await runAutoFill();
    notify("Week auto scheduled");
  }

  /* ================= TEMPLATE ================= */

  function saveTemplate() {
    setTemplates([
      ...templates,
      shifts.filter((s) => s.type === "assigned"),
    ]);

    notify("Template saved");
  }

  async function applyTemplate(template) {
    for (const s of template) {
      await scheduleAPI.create({
        ...s,
        id: undefined,
      });
    }

    notify("Template applied");
    load();
  }

  /* ================= LABOUR ================= */

  const labour = useMemo(() => {
    const cost = shifts.reduce((sum, s) => {
      const user = users.find((u) => u.id === s.user_id);
      if (!user) return sum;

      return sum + hours(s.start_time, s.end_time) * (user.hourly_rate || 0);
    }, 0);

    const revenue = 12000;

    return {
      cost,
      percent: ((cost / revenue) * 100).toFixed(1),
    };
  }, [shifts, users]);

  const demand = forecastDemand(12000);

  /* ================= DAYS ================= */

  const days = useMemo(() => {
    const start = moment(date).startOf("week");
    return Array.from({ length: 7 }).map((_, i) =>
      start.clone().add(i, "days")
    );
  }, [date]);

  /* ================= UI ================= */

  return (
    <div className="p-6 space-y-6 text-white">

      {/* HEADER */}
      <div className="flex justify-between">

        <div className="flex gap-2">
          <button onClick={() => setDate(moment(date).subtract(7,"days").toDate())}>←</button>
          <button onClick={() => setDate(new Date())}>Today</button>
          <button onClick={() => setDate(moment(date).add(7,"days").toDate())}>→</button>
        </div>

        <div className="flex gap-2">
          <button onClick={runAutoFill} className="bg-purple-600 px-3 py-1 rounded">
            Auto Fill
          </button>

          <button onClick={autoScheduleWeek} className="bg-indigo-600 px-3 py-1 rounded">
            Auto Week
          </button>
        </div>

      </div>

      {/* DASHBOARD */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#020617] p-4 rounded">
          <p className="text-xs text-gray-400">Demand</p>
          <p>{demand.hoursPerDay.toFixed(1)} hrs/day</p>
        </div>

        <div className="bg-[#020617] p-4 rounded">
          <p className="text-xs text-gray-400">Labour Cost</p>
          <p>£{labour.cost.toFixed(0)}</p>
        </div>

        <div className="bg-[#020617] p-4 rounded">
          <p className="text-xs text-gray-400">Labour %</p>
          <p>{labour.percent}%</p>
        </div>
      </div>

      {/* TEMPLATE */}
      <div className="flex gap-2">
        <button onClick={saveTemplate} className="bg-indigo-600 px-3 py-1 rounded">
          Save Template
        </button>

        {templates.map((t, i) => (
          <button key={i} onClick={() => applyTemplate(t)} className="bg-gray-700 px-3 py-1 rounded">
            Template {i + 1}
          </button>
        ))}
      </div>

      {/* GRID */}
      <div className="overflow-x-auto border border-white/20">

        {users.map((user) => (
          <div key={user.id} className="flex border-b border-white/20">

            <div className="w-[180px] p-2 bg-[#020617]">
              {user.name}
            </div>

            {days.map((day) => {
              const ds = day.format("YYYY-MM-DD");

              const dayShifts = shifts.filter(
                (s) => s.user_id === user.id && s.date === ds
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
                        className="absolute bg-indigo-600 text-xs px-2 rounded"
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

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-black px-4 py-2 rounded">
          {toast}
        </div>
      )}

    </div>
  );
}