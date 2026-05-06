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

  const [view, setView] = useState("week");
  const [date, setDate] = useState(new Date());

  const [dragging, setDragging] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState({
    from: "",
    to: "",
    start: "09:00",
    end: "17:00",
    user_ids: [],
  });

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

  async function deleteShift(id) {
    await scheduleAPI.delete(id);
    load();
  }

  /* ================= DAYS ================= */

  const days = useMemo(() => {
    const start =
      view === "week"
        ? moment(date).startOf("week")
        : moment(date).startOf("month");

    const count = view === "week" ? 7 : 30;

    return Array.from({ length: count }).map((_, i) =>
      start.clone().add(i, "days")
    );
  }, [date, view]);

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

  /* ================= BULK ================= */

  async function createBulk() {
    let d = moment(form.from);
    const end = moment(form.to);

    while (d.isSameOrBefore(end, "day")) {
      const ds = d.format("YYYY-MM-DD");

      for (const uid of form.user_ids) {
        await scheduleAPI.create({
          user_id: uid,
          date: ds,
          start_time: `${ds}T${form.start}:00`,
          end_time: `${ds}T${form.end}:00`,
        });
      }

      d.add(1, "day");
    }

    setShowAdd(false);
    load();
  }

  /* ================= UI ================= */

  return (
    <div className="p-6 space-y-6 text-white">

      {/* HEADER */}
      <div className="flex justify-between items-center">

        <div className="flex gap-2">
          <button onClick={() => setDate(moment(date).subtract(7, "days").toDate())} className="px-3 py-2 bg-[#111827] rounded">←</button>
          <button onClick={() => setDate(new Date())} className="px-3 py-2 bg-[#111827] rounded">Today</button>
          <button onClick={() => setDate(moment(date).add(7, "days").toDate())} className="px-3 py-2 bg-[#111827] rounded">→</button>
        </div>

        <div className="text-lg font-semibold">
          {moment(date).format("MMMM YYYY")}
        </div>

        <div className="flex gap-2">
          <button onClick={() => setView("week")} className="px-3 py-2 bg-indigo-600 rounded">Week</button>
          <button onClick={() => setView("month")} className="px-3 py-2 bg-[#111827] rounded">Month</button>
          <button onClick={() => setView("list")} className="px-3 py-2 bg-[#111827] rounded">List</button>

          <button onClick={() => setEditMode(!editMode)} className="px-3 py-2 bg-yellow-600 rounded">
            {editMode ? "Done" : "Edit"}
          </button>

          <button onClick={() => setShowAdd(true)} className="px-3 py-2 bg-emerald-600 rounded">
            + Add
          </button>
        </div>

      </div>

      {/* TIMELINE */}
      <div className="overflow-x-auto border border-white/10 rounded-xl">

        <div className="flex border-b border-white/10 bg-[#020617]">
          <div className="w-[180px]" />

          {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
            <div key={i} style={{ width: HOUR_WIDTH }} className="text-xs text-center text-gray-400 py-2">
              {START_HOUR + i}:00
            </div>
          ))}
        </div>

        {users.map((user) => (
          <div key={user.id} className="flex border-b border-white/5">

            <div className="w-[180px] p-3 bg-[#020617] sticky left-0">
              {user.name}
            </div>

            {days.map((day) => {
              const ds = day.format("YYYY-MM-DD");

              const dayShifts = shifts.filter(
                (s) =>
                  s.user_id === user.id &&
                  s.date === ds
              );

              const lanes = buildLanes(dayShifts);

              return (
                <div key={ds} className="relative border-l border-white/5"
                  style={{
                    width: (END_HOUR - START_HOUR) * HOUR_WIDTH,
                    height: ROW_HEIGHT,
                  }}
                >

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

                          {editMode && (
                            <button
                              onClick={() => deleteShift(s.id)}
                              className="absolute top-0 right-0 text-xs"
                            >
                              ✕
                            </button>
                          )}

                          <div
                            onMouseDown={(e) => resizeShift(e, s, "left")}
                            className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize"
                          />

                          <div
                            onMouseDown={(e) => resizeShift(e, s, "right")}
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize"
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