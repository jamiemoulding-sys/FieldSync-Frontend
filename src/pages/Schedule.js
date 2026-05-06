import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import {
  scheduleAPI,
  holidayAPI,
  userAPI,
} from "../services/api";

/* ================= CONFIG ================= */

const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_WIDTH = 80;
const ROW_HEIGHT = 60;

/* ================= MAIN ================= */

export default function Schedule() {
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [holidays, setHolidays] = useState([]);

  const [date, setDate] = useState(new Date());
  const [dragging, setDragging] = useState(null);
  const [ghost, setGhost] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const [u, s, h] = await Promise.all([
      userAPI.getAll(),
      scheduleAPI.getAll(),
      holidayAPI.getAll(),
    ]);

    setUsers(u || []);
    setShifts(s || []);
    setHolidays(h || []);
  }

  async function updateShift(id, data) {
    await scheduleAPI.update(id, data);
    load();
  }

  /* ================= DAYS ================= */

  const days = useMemo(() => {
    const start = moment(date).startOf("week");
    return Array.from({ length: 7 }).map((_, i) =>
      start.clone().add(i, "days")
    );
  }, [date]);

  /* ================= POSITION ================= */

  function getPosition(start, end) {
    const s = moment(start);
    const e = moment(end);

    const startH =
      s.hours() + s.minutes() / 60 - START_HOUR;

    const endH =
      e.hours() + e.minutes() / 60 - START_HOUR;

    return {
      left: startH * HOUR_WIDTH,
      width: (endH - startH) * HOUR_WIDTH,
    };
  }

  /* ================= COLLISION ================= */

  function buildLanes(dayShifts) {
    const lanes = [];

    dayShifts.forEach((shift) => {
      let placed = false;

      for (let lane of lanes) {
        const conflict = lane.some((s) => {
          return (
            moment(shift.start_time).isBefore(s.end_time) &&
            moment(shift.end_time).isAfter(s.start_time)
          );
        });

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

  /* ================= DRAG ================= */

  function handleDrop(day, userId, hour) {
    if (!dragging) return;

    const newStart = moment(day)
      .hour(hour)
      .minute(0);

    const duration = moment(dragging.end_time).diff(
      dragging.start_time,
      "minutes"
    );

    const newEnd = newStart.clone().add(duration, "minutes");

    updateShift(dragging.id, {
      user_id: userId,
      date: day.format("YYYY-MM-DD"),
      start_time: newStart.toISOString(),
      end_time: newEnd.toISOString(),
    });

    setDragging(null);
    setGhost(null);
  }

  /* ================= RESIZE ================= */

  function resizeShift(e, shift, side) {
    e.preventDefault();

    const startX = e.clientX;

    const origStart = moment(shift.start_time);
    const origEnd = moment(shift.end_time);

    function move(ev) {
      const diff = ev.clientX - startX;
      const mins = Math.round(diff / 10) * 15;

      if (side === "right") {
        const newEnd = origEnd.clone().add(mins, "minutes");

        updateShift(shift.id, {
          end_time: newEnd.toISOString(),
        });
      }

      if (side === "left") {
        const newStart = origStart.clone().add(mins, "minutes");

        updateShift(shift.id, {
          start_time: newStart.toISOString(),
        });
      }
    }

    function stop() {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
    }

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
  }

  /* ================= UI ================= */

  return (
    <div className="p-4 space-y-4">

      {/* HEADER */}
      <div className="flex justify-between">

        <div className="flex gap-2">
          <button onClick={() => setDate(moment(date).subtract(7, "days").toDate())}>←</button>
          <button onClick={() => setDate(new Date())}>Today</button>
          <button onClick={() => setDate(moment(date).add(7, "days").toDate())}>→</button>
        </div>

        <div>{moment(date).format("MMMM YYYY")}</div>

      </div>

      {/* HOURS */}
      <div className="flex overflow-x-auto border-b border-white/10">
        <div className="w-[200px]" />
        {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
          <div key={i} style={{ width: HOUR_WIDTH }} className="text-xs text-center text-gray-400">
            {START_HOUR + i}:00
          </div>
        ))}
      </div>

      {/* GRID */}
      <div className="overflow-x-auto">

        {users.map((user) => (
          <div key={user.id} className="flex border-b border-white/10">

            {/* USER */}
            <div className="w-[200px] p-2 sticky left-0 bg-[#020617] z-10">
              {user.name}
            </div>

            {/* DAYS */}
            {days.map((day) => {
              const ds = day.format("YYYY-MM-DD");

              const dayShifts = shifts.filter(
                (s) =>
                  s.user_id === user.id &&
                  s.date === ds
              );

              const lanes = buildLanes(dayShifts);

              return (
                <div
                  key={ds}
                  className="relative border-l border-white/5"
                  style={{
                    width: (END_HOUR - START_HOUR) * HOUR_WIDTH,
                    height: ROW_HEIGHT,
                  }}
                >

                  {/* DROP GRID */}
                  {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => {
                    const hour = START_HOUR + i;

                    return (
                      <div
                        key={i}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(day, user.id, hour)}
                        style={{
                          position: "absolute",
                          left: i * HOUR_WIDTH,
                          width: HOUR_WIDTH,
                          height: "100%",
                        }}
                      />
                    );
                  })}

                  {/* SHIFTS */}
                  {lanes.map((lane, laneIndex) =>
                    lane.map((s) => {
                      const pos = getPosition(s.start_time, s.end_time);

                      return (
                        <div
                          key={s.id}
                          draggable
                          onDragStart={() => setDragging(s)}
                          className="absolute bg-indigo-600 rounded text-xs px-2 cursor-move group"
                          style={{
                            top: laneIndex * 22,
                            left: pos.left,
                            width: pos.width,
                            height: 20,
                          }}
                        >
                          {moment(s.start_time).format("HH:mm")} - {moment(s.end_time).format("HH:mm")}

                          {/* RESIZE LEFT */}
                          <div
                            onMouseDown={(e) => resizeShift(e, s, "left")}
                            className="absolute left-0 top-0 bottom-0 w-1 bg-white/30 cursor-ew-resize opacity-0 group-hover:opacity-100"
                          />

                          {/* RESIZE RIGHT */}
                          <div
                            onMouseDown={(e) => resizeShift(e, s, "right")}
                            className="absolute right-0 top-0 bottom-0 w-1 bg-white/30 cursor-ew-resize opacity-0 group-hover:opacity-100"
                          />
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

    </div>
  );
}