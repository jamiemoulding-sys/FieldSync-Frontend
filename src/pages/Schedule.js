import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { scheduleAPI, userAPI } from "../services/api";

/* ================= CONFIG ================= */

const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_WIDTH = 80;
const ROW_HEIGHT = 90;

/* ================= HELPERS ================= */

const snap = (h) => Math.round(h * 4) / 4;
const toDecimal = (m) => m.hours() + m.minutes() / 60;

function getPosition(start, end) {
  const s = moment(start);
  const e = moment(end);

  return {
    left: (toDecimal(s) - START_HOUR) * HOUR_WIDTH,
    width: Math.max((toDecimal(e) - toDecimal(s)) * HOUR_WIDTH, 80),
  };
}

function hours(start, end) {
  return (new Date(end) - new Date(start)) / 3600000;
}

/* ================= MAIN ================= */

export default function Schedule() {
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);

  const [view, setView] = useState("week");
  const [date, setDate] = useState(new Date());

  const [dragging, setDragging] = useState(null);
  const [creating, setCreating] = useState(null);

  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState({
    user_id: "",
    date: "",
    start: "09:00",
    end: "17:00",
  });

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

  /* ================= CREATE ================= */

  function startCreate(e, day, userId) {
    if (dragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const hour = snap(START_HOUR + (e.clientX - rect.left) / HOUR_WIDTH);

    setCreating({ day, userId, start: hour, end: hour });
  }

  function moveCreate(e) {
    if (!creating) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const hour = snap(START_HOUR + (e.clientX - rect.left) / HOUR_WIDTH);

    setCreating((c) => ({ ...c, end: hour }));
  }

  function endCreate() {
    if (!creating) return;

    const start = Math.min(creating.start, creating.end);
    const end = Math.max(creating.start, creating.end);

    if (end - start < 0.25) return setCreating(null);

    const s = moment(creating.day)
      .hour(Math.floor(start))
      .minute((start % 1) * 60);

    const e = moment(creating.day)
      .hour(Math.floor(end))
      .minute((end % 1) * 60);

    createShift({
      user_id: creating.userId,
      date: creating.day.format("YYYY-MM-DD"),
      start_time: s.toISOString(),
      end_time: e.toISOString(),
    });

    setCreating(null);
  }

  /* ================= DRAG ================= */

  function handleDrop(day, userId, hour) {
    if (!dragging) return;

    const duration = moment(dragging.end_time).diff(
      dragging.start_time,
      "minutes"
    );

    const start = moment(day).hour(hour).minute(0);
    const end = start.clone().add(duration, "minutes");

    updateShift(dragging.id, {
      user_id: userId,
      date: day.format("YYYY-MM-DD"),
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    });

    setDragging(null);
  }

  /* ================= AI ================= */

  async function runAutoFill() {
    const openShifts = shifts.filter((s) => !s.user_id);

    for (const shift of openShifts) {
      const available = users.filter((u) => {
        const conflict = shifts.some(
          (s) =>
            s.user_id === u.id &&
            s.date === shift.date &&
            new Date(shift.start_time) < new Date(s.end_time) &&
            new Date(shift.end_time) > new Date(s.start_time)
        );

        if (conflict) return false;

        const totalHours = shifts
          .filter((s) => s.user_id === u.id)
          .reduce((sum, s) => sum + hours(s.start_time, s.end_time), 0);

        return totalHours < 48;
      });

      if (!available.length) continue;

      const best = available[0];

      await updateShift(shift.id, {
        user_id: best.id,
      });
    }
  }

  /* ================= UI ================= */

 return (
  <>
    <div className="h-screen flex bg-[#0B1220] text-white">

      {/* SIDEBAR */}
      <div className="w-[220px] bg-[#020617] border-r border-white/10 p-4 space-y-4">
        <div className="text-lg font-bold">YourApp</div>

        
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">

        {/* TOP BAR */}
       <div className="sticky top-0 z-20 flex justify-between items-center px-6 py-4 bg-[#111827] border-b border-white/10">

          <div className="text-lg font-semibold">
            {view === "week" && (
              <span>
                {moment(date).startOf("isoWeek").format("DD MMM")} -{" "}
                {moment(date).endOf("isoWeek").format("DD MMM YYYY")}
              </span>
            )}
            {view === "month" && <span>{moment(date).format("MMMM YYYY")}</span>}
            {view === "list" && <span>All Shifts</span>}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setView("week")} className="btn-secondary">Week</button>
            <button onClick={() => setView("month")} className="btn-secondary">Month</button>
            <button onClick={() => setView("list")} className="btn-secondary">List</button>

            <button onClick={prev} className="btn-secondary">←</button>
            <button onClick={() => setDate(new Date())} className="btn-secondary">Today</button>
            <button onClick={next} className="btn-secondary">→</button>

            <button onClick={runAutoFill} className="btn-ai">🤖 AI</button>
            <button onClick={() => setShowAdd(true)} className="btn-primary">+ Shift</button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-auto p-6">

          {/* WEEK VIEW */}
          {view === "week" && (
            <div className="overflow-x-auto border border-white/10">

              {/* TIME HEADER */}
              <div className="flex border-b border-white/10 bg-[#020617]">
                <div className="w-[160px]" />
                {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
                  <div
                    key={i}
                    style={{ width: HOUR_WIDTH }}
                    className="text-xs text-gray-400 text-center py-1 border-l border-white/5"
                  >
                    {START_HOUR + i}:00
                  </div>
                ))}
              </div>

              {/* USERS ROWS */}
              {users.map(user => (
                <div key={user.id} className="flex border-b border-white/10">

                  <div className="w-[160px] p-2 bg-[#020617]">
                    {user.name}
                  </div>

                  {days.map(day => {
                    const ds = day.format("YYYY-MM-DD");

                    const dayShifts = shifts.filter(
                      s => s.date === ds && s.user_id === user.id
                    );

                    return (
                      <div
                        key={ds}
                        className="relative border-l border-white/10"
                        style={{
                          width: (END_HOUR - START_HOUR) * HOUR_WIDTH,
                          height: ROW_HEIGHT
                        }}
                        onMouseDown={(e) => {
                          if (dragging) return;
                          startCreate(e, day, user.id);
                        }}
                        onMouseMove={moveCreate}
                        onMouseUp={endCreate}
                      >

                        {/* GRID */}
                        {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
                          <div
                            key={`grid-${i}`}
                            className="absolute top-0 bottom-0 border-l border-white/5"
                            style={{ left: i * HOUR_WIDTH }}
                          />
                        ))}

                        {/* DROP ZONES */}
                        {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
                          <div
                            key={`drop-${i}`}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(day, user.id, START_HOUR + i)}
                            style={{
                              position: "absolute",
                              left: i * HOUR_WIDTH,
                              width: HOUR_WIDTH,
                              height: "100%"
                            }}
                          />
                        ))}

                        {/* SHIFTS */}
                        {dayShifts.map(shift => {
                          const pos = getPosition(shift.start_time, shift.end_time);
                          const assignedUser = users.find(u => u.id === shift.user_id);

                          return (
                            <div
                              key={shift.id}
                              draggable
                              onDragStart={() => setDragging(shift)}
                              className="absolute rounded-lg px-2 py-1 text-xs shadow-lg cursor-pointer"
                              style={{
                                top: 8,
                                left: pos.left,
                                width: pos.width,
                                minWidth: 100,
                                background: shift.user_id ? "#4f46e5" : "#6b7280",
                              }}
                            >
                              <div className="font-semibold truncate">
                                {assignedUser?.name || "Open Shift"}
                              </div>
                              <div className="text-[10px] opacity-80">
                                {moment(shift.start_time).format("HH:mm")} -{" "}
                                {moment(shift.end_time).format("HH:mm")}
                              </div>
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

          {/* MONTH VIEW */}
          {view === "month" && (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 42 }).map((_, i) => {
                const start = moment(date).startOf("month").startOf("isoWeek");
                const d = start.clone().add(i, "days");

                return (
                  <div key={i} className="border p-2 min-h-[100px]">
                    <div className="text-xs text-gray-400">{d.format("DD")}</div>

                    {shifts
                      .filter(s => s.date === d.format("YYYY-MM-DD"))
                      .map(s => (
                        <div key={s.id} className="text-xs bg-indigo-600 mt-1 p-1 rounded">
                          {moment(s.start_time).format("HH:mm")}
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>
          )}

         {/* LIST VIEW */}
{view === "list" && (
  <div className="space-y-2">
    {shifts.map((s) => {
      const user = users.find((u) => u.id === s.user_id);

      return (
        <div key={s.id} className="p-3 border rounded flex justify-between">
          <div>
            <div className="font-semibold">
              {user?.name || "Unassigned"}
            </div>
            <div className="text-xs text-gray-400">
              {moment(s.date).format("DD MMM YYYY")}
            </div>
          </div>

          <div className="text-sm">
            {moment(s.start_time).format("HH:mm")} - {moment(s.end_time).format("HH:mm")}
          </div>
        </div>
      );
    })}
  </div>
)}
  

        </div>
      </div>
    </div>

    {/* ADD MODAL */}
    {showAdd && (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
        <div className="bg-[#020617] p-6 space-y-3">

          <select onChange={e=>setForm({...form,user_id:e.target.value})}>
            <option>Select user</option>
            {users.map(u=>(
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          <input type="date" onChange={e=>setForm({...form,date:e.target.value})}/>
          <input type="time" onChange={e=>setForm({...form,start:e.target.value})}/>
          <input type="time" onChange={e=>setForm({...form,end:e.target.value})}/>

          <button
            onClick={()=>{
              createShift({
                user_id: form.user_id,
                date: form.date,
                start_time: `${form.date}T${form.start}:00`,
                end_time: `${form.date}T${form.end}:00`,
              });
              setShowAdd(false);
            }}
            className="bg-green-600 w-full"
          >
            Save
          </button>

        </div>
      </div>
    )}
  </>
);
}