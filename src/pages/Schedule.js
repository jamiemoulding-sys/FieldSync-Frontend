import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { scheduleAPI, userAPI } from "../services/api";

/* ================= CONFIG ================= */

const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_WIDTH = 70;
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

function overlaps(a, b) {
  return (
    moment(a.start_time).isBefore(b.end_time) &&
    moment(a.end_time).isAfter(b.start_time)
  );
}

function buildLanes(shifts) {
  const lanes = [];
  shifts.forEach((shift) => {
    let placed = false;

    for (let lane of lanes) {
      if (!lane.some((s) => overlaps(shift, s))) {
        lane.push(shift);
        placed = true;
        break;
      }
    }

    if (!placed) lanes.push([shift]);
  });

  return lanes;
}

/* ================= ROLE COLORS ================= */

const ROLE_COLORS = {
  manager: "bg-indigo-600",
  staff: "bg-emerald-600",
  open: "bg-gray-500",
};

/* ================= MAIN ================= */

export default function Schedule() {
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);

  const [view, setView] = useState("week");
  const [date, setDate] = useState(new Date());

  const [dragging, setDragging] = useState(null);
  const [creating, setCreating] = useState(null);
  const [resizing, setResizing] = useState(null);

  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [swapShift, setSwapShift] = useState(null);

  const [toast, setToast] = useState(null);

  const currentUser = { id: 1, role: "manager" };

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

  function notify(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function createShift(data) {
    await scheduleAPI.create(data);
    notify("Shift created");
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

  const weekDays = useMemo(() => {
    const start = moment(date).startOf("week");
    return Array.from({ length: 7 }).map((_, i) =>
      start.clone().add(i, "days")
    );
  }, [date]);

  const monthDays = useMemo(() => {
    const start = moment(date).startOf("month").startOf("week");
    return Array.from({ length: 42 }).map((_, i) =>
      start.clone().add(i, "days")
    );
  }, [date]);

  /* ================= CREATE ================= */

  function startCreate(e, day, userId) {
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

    const s = moment(creating.day).hour(start).minute((start % 1) * 60);
    const e = moment(creating.day).hour(end).minute((end % 1) * 60);

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

    const duration = moment(dragging.end_time).diff(dragging.start_time, "minutes");

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

  /* ================= RESIZE ================= */

  useEffect(() => {
    function move(e) {
      if (!resizing) return;

      const diff = e.clientX - resizing.startX;
      const mins = Math.round(diff / 10) * 15;

      if (resizing.side === "right") {
        const end = moment(resizing.shift.end_time).add(mins, "minutes");
        updateShift(resizing.shift.id, { end_time: end.toISOString() });
      }

      if (resizing.side === "left") {
        const start = moment(resizing.shift.start_time).add(mins, "minutes");
        updateShift(resizing.shift.id, { start_time: start.toISOString() });
      }
    }

    function stop() {
      setResizing(null);
    }

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
    };
  }, [resizing]);

  /* ================= AI ================= */

  async function runAutoFill() {
    const open = shifts.filter((s) => !s.user_id);

    for (const shift of open) {
      const best = users[0]; // simple version
      if (!best) continue;

      await updateShift(shift.id, { user_id: best.id });
    }

    notify("AI assigned shifts");
  }

  /* ================= SWAP ================= */

  async function requestSwap(shift, userId) {
    await updateShift(shift.id, {
      swap_requests: [...(shift.swap_requests || []), { user_id: userId }],
    });
    notify("Swap requested");
  }

  async function approveSwap(shift, userId) {
    await updateShift(shift.id, {
      user_id: userId,
      swap_requests: [],
    });
    notify("Swap approved");
  }

  /* ================= UI ================= */

  return (
    <div className="p-6 text-white space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center bg-[#020617] p-4 rounded-xl">

        <div className="flex gap-2">
          <button onClick={prev}>←</button>
          <button onClick={() => setDate(new Date())}>Today</button>
          <button onClick={next}>→</button>
        </div>

        <div className="font-semibold text-lg">
          {moment(date).format("MMMM YYYY")}
        </div>

        <div className="flex gap-2">
          <button onClick={()=>setView("week")}>Week</button>
          <button onClick={()=>setView("month")}>Month</button>
          <button onClick={()=>setView("list")}>List</button>
          <button onClick={()=>setShowAdd(true)}>+ Add</button>
          <button onClick={()=>setShowBulk(true)}>Bulk</button>
          <button onClick={runAutoFill}>AI</button>
        </div>
      </div>

      {/* WEEK VIEW */}
      {view === "week" && (
        <div className="overflow-x-auto border border-white/10 rounded-xl">

          {/* HOURS */}
          <div className="flex bg-[#020617]">
            <div className="w-[160px]" />
            {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
              <div key={i} style={{ width: HOUR_WIDTH }} className="text-xs text-center text-gray-400 py-2">
                {START_HOUR + i}:00
              </div>
            ))}
          </div>

          {users.map(user => (
            <div key={user.id} className="flex border-b border-white/10">

              <div className="w-[160px] p-3 bg-[#020617] font-medium">
                {user.name}
              </div>

              {weekDays.map(day => {
                const ds = day.format("YYYY-MM-DD");

                const userShifts = shifts.filter(
                  s => s.user_id === user.id && s.date === ds
                );

                const lanes = buildLanes(userShifts);

                return (
                  <div
                    key={ds}
                    className="relative border-l border-white/10"
                    style={{
                      width: (END_HOUR - START_HOUR) * HOUR_WIDTH,
                      height: ROW_HEIGHT
                    }}
                    onMouseDown={(e)=>startCreate(e,day,user.id)}
                    onMouseMove={moveCreate}
                    onMouseUp={endCreate}
                  >

                    {lanes.map((lane,i)=>
                      lane.map(s=>{
                        const pos = getPosition(s.start_time,s.end_time);

                        const role = s.user_id ? "staff" : "open";

                        return (
                          <div
                            key={s.id}
                            draggable
                            onDragStart={()=>setDragging(s)}
                            className={`absolute text-xs px-2 py-1 rounded ${ROLE_COLORS[role]}`}
                            style={{ top:i*22, left:pos.left, width:pos.width }}
                          >
                            {user.name}
                            <br/>
                            {moment(s.start_time).format("HH:mm")} - {moment(s.end_time).format("HH:mm")}

                            <div onMouseDown={(e)=>setResizing({shift:s,side:"left",startX:e.clientX})} className="absolute left-0 w-1 cursor-ew-resize"/>
                            <div onMouseDown={(e)=>setResizing({shift:s,side:"right",startX:e.clientX})} className="absolute right-0 w-1 cursor-ew-resize"/>

                            {currentUser.role==="staff" && (
                              <button onClick={()=>setSwapShift(s)}>Swap</button>
                            )}

                            {currentUser.role==="manager" &&
                              s.swap_requests?.map((r,i)=>(
                                <button key={i} onClick={()=>approveSwap(s,r.user_id)}>
                                  Approve
                                </button>
                              ))}
                          </div>
                        );
                      })
                    )}

                  </div>
                );
              })}
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