import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { scheduleAPI, userAPI } from "../services/api";

/* ================= CONFIG ================= */

const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_WIDTH = 80;
const ROW_HEIGHT = 70;

/* ================= HELPERS ================= */

const snap = (h) => Math.round(h * 4) / 4;

const toDecimal = (m) => m.hours() + m.minutes() / 60;

function getPosition(start, end) {
  const s = moment(start);
  const e = moment(end);

  const startH = toDecimal(s) - START_HOUR;
  const endH = toDecimal(e) - START_HOUR;

  return {
    left: startH * HOUR_WIDTH,
    width: (endH - startH) * HOUR_WIDTH,
  };
}

/* ================= COLLISION ================= */

function buildLanes(shifts) {
  const lanes = [];

  shifts.forEach((shift) => {
    let placed = false;

    for (let lane of lanes) {
      const conflict = lane.some(
        (s) =>
          moment(shift.start_time).isBefore(s.end_time) &&
          moment(shift.end_time).isAfter(s.start_time)
      );

      if (!conflict) {
        lane.push(shift);
        placed = true;
        break;
      }
    }

    if (!placed) lanes.push([shift]);
  });

  return lanes;
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
  const [swapShift, setSwapShift] = useState(null);

  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    user_id: "",
    date: "",
    start: "09:00",
    end: "17:00",
  });

  const currentUser = { id: 1, role: "manager" }; // change to "staff" to test

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

  async function updateShift(id, data) {
    await scheduleAPI.update(id, data);
    load();
  }

  async function createShift(data) {
    await scheduleAPI.create(data);
    load();
  }

  /* ================= NAV ================= */

  function prev() {
    setDate(
      moment(date)
        .subtract(1, view === "month" ? "month" : "week")
        .toDate()
    );
  }

  function next() {
    setDate(
      moment(date)
        .add(1, view === "month" ? "month" : "week")
        .toDate()
    );
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

  /* ================= DRAG ================= */

  function handleDrop(day, userId, hour) {
    if (!dragging) return;

    const start = snap(hour);

    const duration = moment(dragging.end_time).diff(
      dragging.start_time,
      "minutes"
    );

    const newStart = moment(day)
      .hour(Math.floor(start))
      .minute((start % 1) * 60);

    const newEnd = newStart.clone().add(duration, "minutes");

    updateShift(dragging.id, {
      user_id: userId,
      date: day.format("YYYY-MM-DD"),
      start_time: newStart.toISOString(),
      end_time: newEnd.toISOString(),
    });

    setDragging(null);
  }

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

  /* ================= SWAP ================= */

  async function requestSwap(shift, userId) {
    await updateShift(shift.id, {
      swap_requests: [...(shift.swap_requests || []), { user_id: userId }],
    });
    notify("Swap requested");
    setSwapShift(null);
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
      <div className="flex justify-between items-center">

        <div className="flex gap-2">
          <button onClick={prev}>←</button>
          <button onClick={() => setDate(new Date())}>Today</button>
          <button onClick={next}>→</button>
        </div>

        <div>{moment(date).format("MMMM YYYY")}</div>

        <div className="flex gap-2">
          <button onClick={()=>setView("week")} className={view==="week"?"bg-indigo-600 px-3":"bg-gray-700 px-3"}>Week</button>
          <button onClick={()=>setView("month")} className={view==="month"?"bg-indigo-600 px-3":"bg-gray-700 px-3"}>Month</button>
          <button onClick={()=>setView("list")} className={view==="list"?"bg-indigo-600 px-3":"bg-gray-700 px-3"}>List</button>
          <button onClick={()=>setShowAdd(true)} className="bg-green-600 px-3">+ Add</button>
        </div>
      </div>

      {/* WEEK */}
      {view === "week" && (
        <>
          <div className="grid grid-cols-7 text-xs text-gray-400">
            {weekDays.map(d => <div key={d}>{d.format("ddd DD")}</div>)}
          </div>

          {users.map(user => (
            <div key={user.id} className="flex border-b border-white/10">
              <div className="w-[140px] p-2">{user.name}</div>

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
                    style={{ width: (END_HOUR - START_HOUR)*HOUR_WIDTH, height: ROW_HEIGHT }}
                    onMouseDown={(e)=>startCreate(e,day,user.id)}
                    onMouseMove={moveCreate}
                    onMouseUp={endCreate}
                  >
                    {lanes.map((lane, i) =>
                      lane.map(s => {
                        const pos = getPosition(s.start_time, s.end_time);

                        return (
                          <div
                            key={s.id}
                            draggable
                            onDragStart={()=>setDragging(s)}
                            className="absolute bg-indigo-600 text-xs px-2 rounded"
                            style={{ top:i*22, left:pos.left, width:pos.width, height:20 }}
                          >
                            {moment(s.start_time).format("HH:mm")}

                            {currentUser.role==="staff" && (
                              <button onClick={()=>setSwapShift(s)} className="block text-[10px]">Swap</button>
                            )}

                            {currentUser.role==="manager" &&
                              s.swap_requests?.map((r,i)=>(
                                <button key={i} onClick={()=>approveSwap(s,r.user_id)} className="block text-[10px]">
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
        </>
      )}

      {/* MONTH */}
      {view === "month" && (
        <div className="grid grid-cols-7 gap-2">
          {monthDays.map(d => (
            <div key={d} className="border p-2 min-h-[100px]">
              <div className="text-xs text-gray-400">{d.format("DD")}</div>
              {shifts
                .filter(s => s.date === d.format("YYYY-MM-DD"))
                .map(s => (
                  <div key={s.id} className="bg-indigo-600 text-xs mt-1 p-1 rounded">
                    {moment(s.start_time).format("HH:mm")}
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}

      {/* LIST */}
      {view === "list" && (
        <div>
          {shifts.map(s => (
            <div key={s.id} className="border p-2 mb-2">
              {moment(s.date).format("DD MMM")} — {moment(s.start_time).format("HH:mm")}
            </div>
          ))}
        </div>
      )}

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

      {/* SWAP MODAL */}
      {swapShift && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-[#020617] p-6 space-y-2">
            {users.map(u=>(
              <button key={u.id} onClick={()=>requestSwap(swapShift,u.id)}>
                {u.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-4 right-4 bg-black p-2">{toast}</div>}

    </div>
  );
}