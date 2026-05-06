import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { scheduleAPI, userAPI } from "../services/api";

/* ================= CONFIG ================= */

const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_WIDTH = 80;
const ROW_HEIGHT = 64;

/* ================= HELPERS ================= */

function snap(hour) {
  return Math.round(hour * 4) / 4;
}

function toDecimal(m) {
  return m.hours() + m.minutes() / 60;
}

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

/* ================= AVAILABILITY ================= */

function isAvailable(user, shift, shifts) {
  return !shifts.some(
    (s) =>
      s.user_id === user.id &&
      s.date === shift.date &&
      new Date(shift.start_time) < new Date(s.end_time) &&
      new Date(shift.end_time) > new Date(s.start_time)
  );
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

  const [date, setDate] = useState(new Date());
  const [view, setView] = useState("week");

  const [dragging, setDragging] = useState(null);
  const [creating, setCreating] = useState(null);

  const [toast, setToast] = useState(null);
  const [swapTarget, setSwapTarget] = useState(null);

  const currentUser = {
    id: 1,
    role: "manager", // change to "staff" to test
  };

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

  /* ================= SWAP ================= */

  async function requestSwap(shift, targetUserId) {
    const target = users.find((u) => u.id === targetUserId);

    if (!isAvailable(target, shift, shifts)) {
      notify("User not available");
      return;
    }

    await updateShift(shift.id, {
      swap_requests: [
        ...(shift.swap_requests || []),
        { user_id: targetUserId },
      ],
    });

    notify("Swap requested");
    setSwapTarget(null);
  }

  async function approveSwap(shift, userId) {
    await updateShift(shift.id, {
      user_id: userId,
      swap_requests: [],
    });

    notify("Swap approved");
  }

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

    createShift({
      user_id: creating.userId,
      date: creating.day.format("YYYY-MM-DD"),
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
    });

    setCreating(null);
  }

  /* ================= DAYS ================= */

  const weekDays = useMemo(() => {
    const start = moment(date).startOf("week");
    return Array.from({ length: 7 }).map((_, i) =>
      start.clone().add(i, "days")
    );
  }, [date]);

  /* ================= UI ================= */

  return (
    <div className="p-6 text-white space-y-6">

      {/* HEADER */}
      <div className="flex justify-between">

        <div className="flex gap-2">
          <button onClick={() => setDate(moment(date).subtract(1,"week").toDate())}>←</button>
          <button onClick={() => setDate(new Date())}>Today</button>
          <button onClick={() => setDate(moment(date).add(1,"week").toDate())}>→</button>
        </div>

        <div>{moment(date).format("MMMM YYYY")}</div>

        <div className="flex gap-2">
          <button onClick={()=>setView("week")} className="bg-indigo-600 px-2">Week</button>
        </div>
      </div>

      {/* WEEK */}
      <div>

        <div className="grid grid-cols-7 text-xs text-gray-400 mb-2">
          {weekDays.map(d=>(
            <div key={d.format()}>{d.format("ddd DD")}</div>
          ))}
        </div>

        {users.map(user=>(
          <div key={user.id} className="flex border-b border-white/10">

            <div className="w-[140px] p-2">{user.name}</div>

            {weekDays.map(day=>{
              const ds = day.format("YYYY-MM-DD");

              const userShifts = shifts.filter(
                s=>s.user_id===user.id && s.date===ds
              );

              const lanes = buildLanes(userShifts);

              return (
                <div
                  key={ds}
                  className="relative border-l border-white/10"
                  style={{
                    width:(END_HOUR-START_HOUR)*HOUR_WIDTH,
                    height:ROW_HEIGHT
                  }}
                  onMouseDown={(e)=>startCreate(e,day,user.id)}
                  onMouseMove={moveCreate}
                  onMouseUp={endCreate}
                >

                  {Array.from({length:END_HOUR-START_HOUR}).map((_,i)=>(
                    <div
                      key={i}
                      onDragOver={e=>e.preventDefault()}
                      onDrop={()=>handleDrop(day,user.id,START_HOUR+i)}
                      style={{
                        position:"absolute",
                        left:i*HOUR_WIDTH,
                        width:HOUR_WIDTH,
                        height:"100%"
                      }}
                    />
                  ))}

                  {lanes.map((lane,laneIndex)=>
                    lane.map(s=>{
                      const pos = getPosition(s.start_time,s.end_time);

                      return (
                        <div
                          key={s.id}
                          draggable
                          onDragStart={()=>setDragging(s)}
                          className="absolute bg-indigo-600 text-xs px-2 rounded"
                          style={{
                            top:laneIndex*22,
                            left:pos.left,
                            width:pos.width,
                            height:20
                          }}
                        >
                          {moment(s.start_time).format("HH:mm")}

                          {/* STAFF ACTIONS */}
                          {currentUser.role==="staff" && (
                            <button
                              onClick={()=>setSwapTarget(s)}
                              className="block text-[10px]"
                            >
                              Swap
                            </button>
                          )}

                          {/* MANAGER APPROVAL */}
                          {currentUser.role==="manager" &&
                            s.swap_requests?.map((r,i)=>(
                              <button
                                key={i}
                                onClick={()=>approveSwap(s,r.user_id)}
                                className="block text-[10px]"
                              >
                                Approve {r.user_id}
                              </button>
                            ))}
                        </div>
                      );
                    })
                  )}

                  {creating && creating.userId===user.id && (
                    <div
                      className="absolute bg-green-500/40"
                      style={{
                        top:4,
                        left:Math.min(creating.start,creating.end)*HOUR_WIDTH,
                        width:Math.abs(creating.end-creating.start)*HOUR_WIDTH,
                        height:20
                      }}
                    />
                  )}

                </div>
              );
            })}

          </div>
        ))}

      </div>

      {/* SWAP PICKER */}
      {swapTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-[#020617] p-6 space-y-3">

            <h3>Select user</h3>

            {users.map(u=>(
              <button
                key={u.id}
                onClick={()=>requestSwap(swapTarget,u.id)}
                className="block w-full text-left"
              >
                {u.name}
              </button>
            ))}

          </div>
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