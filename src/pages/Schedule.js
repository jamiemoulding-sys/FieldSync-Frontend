import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { scheduleAPI, userAPI } from "../services/api";
import AddShiftModal from "../components/AddShiftModal";

const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_WIDTH = 80;
const ROW_HEIGHT = 70;

export default function Schedule() {
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);

  const [view, setView] = useState("week");
  const [date, setDate] = useState(new Date());

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  const [dragState, setDragState] = useState(null);
  const [resizeState, setResizeState] = useState(null);

  const [form, setForm] = useState({
    user_id: "",
    date: "",
    start: "09:00",
    end: "17:00",
  });

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
    if (hasConflict(data)) {
      alert("⚠️ This person is already working during those hours");
      return;
    }
    await scheduleAPI.create(data);
    load();
  }

  async function updateShift(id, data) {
    if (hasConflict({ ...data, id })) {
      alert("⚠️ Shift conflict detected");
      return;
    }
    await scheduleAPI.update(id, data);
    load();
  }

  async function deleteShift(id) {
    await scheduleAPI.delete(id);
    load();
  }

  function hasConflict(newShift) {
    return shifts.some((s) => {
      if (s.id === newShift.id) return false;
      if (s.user_id !== newShift.user_id) return false;
      if (s.date !== newShift.date) return false;

      return (
        new Date(newShift.start_time) < new Date(s.end_time) &&
        new Date(newShift.end_time) > new Date(s.start_time)
      );
    });
  }

  function formatName(name) {
    const parts = name.split(" ");
    return `${parts[0]} ${parts[1] ? parts[1][0] : ""}`;
  }

  function prev() {
    setDate(moment(date).subtract(1, "week").toDate());
  }

  function next() {
    setDate(moment(date).add(1, "week").toDate());
  }

  const days = useMemo(() => {
    const start = moment(date).startOf("isoWeek");
    return Array.from({ length: 7 }).map((_, i) =>
      start.clone().add(i, "days")
    );
  }, [date]);

  function toX(time) {
    const m = moment(time);
    return (m.hours() + m.minutes() / 60 - START_HOUR) * HOUR_WIDTH;
  }

  function fromX(x, day) {
    const hour = START_HOUR + x / HOUR_WIDTH;
    return moment(day)
      .hour(Math.floor(hour))
      .minute((hour % 1) * 60)
      .toISOString();
  }

  return (
    <div className="h-screen flex bg-[#0B1220] text-white">

      {/* MAIN */}
      <div className="flex-1 flex flex-col">

        {/* TOP BAR */}
        <div className="sticky top-0 z-20 flex justify-between px-6 py-4 bg-[#111827] border-b border-white/10">
          <div>
            {moment(date).startOf("isoWeek").format("DD MMM")} -{" "}
            {moment(date).endOf("isoWeek").format("DD MMM YYYY")}
          </div>

          <div className="flex gap-2">
            <button onClick={prev}>←</button>
            <button onClick={() => setDate(new Date())}>Today</button>
            <button onClick={next}>→</button>
            <button onClick={() => setShowAdd(true)}>+ Shift</button>
          </div>
        </div>

        {/* GRID */}
        <div className="flex overflow-auto">

          {/* USERS */}
          <div className="w-[140px]">
            {users.map((u) => (
              <div
                key={u.id}
                className="h-[70px] flex items-center px-2 border-b border-white/10"
              >
                {formatName(u.name)}
              </div>
            ))}
          </div>

          {/* DAYS */}
          {days.map((day, dayIndex) => (
            <div key={dayIndex}>
              <div className="text-center text-xs py-2 border-b border-white/10">
                {day.format("ddd DD")}
              </div>

              {users.map((user, userIndex) => {
                const dayShifts = shifts.filter(
                  (s) =>
                    s.user_id === user.id &&
                    s.date === day.format("YYYY-MM-DD")
                );

                return (
                  <div
                    key={user.id}
                    className="relative border-b border-l border-white/10 hover:bg-white/[0.02]"
                    style={{
                      width: (END_HOUR - START_HOUR) * HOUR_WIDTH,
                      height: ROW_HEIGHT,
                    }}
                  >

                    {dayShifts.map((s) => {
                      const left = toX(s.start_time);
                      const width =
                        (moment(s.end_time).diff(
                          moment(s.start_time),
                          "minutes"
                        ) /
                          60) *
                        HOUR_WIDTH;

                      return (
                        <div
                          key={s.id}
                          onMouseDown={(e) =>
                            setDragState({
                              shift: s,
                              startX: e.clientX,
                              day,
                              user,
                            })
                          }
                          onDoubleClick={() => setEditing(s)}
                          className="absolute px-3 py-1 text-xs rounded-xl cursor-move transition hover:scale-[1.02]"
                          style={{
                            left,
                            width,
                            top: 6,
                            background:
                              "linear-gradient(135deg,#6366f1,#4f46e5)",
                          }}
                        >
                          <div>{formatName(user.name)}</div>
                          <div className="text-[10px] opacity-80">
                            {moment(s.start_time).format("HH:mm")} -{" "}
                            {moment(s.end_time).format("HH:mm")}
                          </div>

                          {/* RESIZE */}
                          <div
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setResizeState({ shift: s });
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
      </div>

      {/* ADD */}
      {showAdd && (
        <AddShiftModal
          users={users}
          form={form}
          setForm={setForm}
          createShift={createShift}
          onClose={() => setShowAdd(false)}
        />
      )}

      {/* EDIT */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-[#020617] p-6 space-y-3 rounded">

            <div>Edit Shift</div>

            <input
              type="time"
              defaultValue={moment(editing.start_time).format("HH:mm")}
              onChange={(e) =>
                (editing.start_time = `${editing.date}T${e.target.value}:00`)
              }
            />

            <input
              type="time"
              defaultValue={moment(editing.end_time).format("HH:mm")}
              onChange={(e) =>
                (editing.end_time = `${editing.date}T${e.target.value}:00`)
              }
            />

            <button
              onClick={() => {
                updateShift(editing.id, editing);
                setEditing(null);
              }}
            >
              Save
            </button>

            <button
              onClick={() => {
                deleteShift(editing.id);
                setEditing(null);
              }}
            >
              Delete
            </button>

            <button onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}