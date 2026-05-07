import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { scheduleAPI, userAPI } from "../services/api";
import AddShiftModal from "../components/AddShiftModal";

/* CONFIG */
const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_WIDTH = 60;
const ROW_HEIGHT = 70;

/* MAIN */
export default function Schedule() {
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);

  const [date, setDate] = useState(new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  const [drag, setDrag] = useState(null);
  const [resize, setResize] = useState(null);

  const [form, setForm] = useState({
    user_id: "",
    date: "",
    start: "09:00",
    end: "17:00",
  });

  /* LOAD */
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

  /* HELPERS */
  const SNAP = 15; // minutes

function snapMoment(m) {
  const mins = m.minutes();
  const snapped = Math.round(mins / SNAP) * SNAP;
  return m.clone().minutes(snapped).seconds(0);
}

function snapXToTime(x, day) {
  const hour = START_HOUR + x / HOUR_WIDTH;

  const m = moment(day)
    .hour(Math.floor(hour))
    .minute((hour % 1) * 60);

  return snapMoment(m);
}
  
  function formatName(name) {
    const parts = name.split(" ");
    return `${parts[0]} ${parts[1] ? parts[1][0] : ""}`;
  }

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

  /* CRUD */
  async function createShift(data) {
    if (hasConflict(data)) {
      alert("⚠️ This person already has a shift here");
      return;
    }
    await scheduleAPI.create(data);
    load();
  }

  async function updateShift(id, data) {
    if (hasConflict({ ...data, id })) {
      alert("⚠️ Shift conflict");
      return;
    }
    await scheduleAPI.update(id, data);
    load();
  }

  async function deleteShift(id) {
    await scheduleAPI.delete(id);
    load();
  }

  /* NAV */
  function prev() {
    setDate(moment(date).subtract(1, "week").toDate());
  }

  function next() {
    setDate(moment(date).add(1, "week").toDate());
  }

  /* DAYS */
  const days = useMemo(() => {
    const start = moment(date).startOf("isoWeek");
    return Array.from({ length: 7 }).map((_, i) =>
      start.clone().add(i, "days")
    );
  }, [date]);

  /* DRAG */
  useEffect(() => {
  function move(e) {
    if (!drag) return;

    const dx = e.clientX - drag.startX;

    const snapped = snapXToTime(drag.origLeft + dx, drag.day);

    const duration = moment(drag.shift.end_time).diff(
      drag.shift.start_time,
      "minutes"
    );

    const end = snapped.clone().add(duration, "minutes");

    setDrag({
      ...drag,
      ghost: {
        ...drag.shift,
        start_time: snapped.toISOString(),
        end_time: end.toISOString(),
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

  /* RESIZE */
  useEffect(() => {
  function move(e) {
    if (!resize) return;

    const dx = e.clientX - resize.startX;
    const hours = dx / HOUR_WIDTH;

    let end = moment(resize.shift.end_time).add(hours, "hours");
    end = snapMoment(end);

    if (end.diff(resize.shift.start_time, "minutes") < 30) return;

    setResize({
      ...resize,
      ghost: {
        ...resize.shift,
        end_time: end.toISOString(),
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

  /* UI */
  return (
    <div className="h-screen flex bg-[#0B1220] text-white">

      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        <div className="flex justify-between p-4 bg-[#111827]">
          <div>
            {moment(date).format("DD MMM")} -{" "}
            {moment(date).add(6, "days").format("DD MMM YYYY")}
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
              <div key={u.id} className="h-[70px] flex items-center px-2 border-b border-white/10">
                {formatName(u.name)}
              </div>
            ))}
          </div>

          {/* DAYS */}
          {days.map((day, di) => (
            <div key={di}>
              <div className="text-center text-xs py-2 border-b border-white/10">
                {day.format("ddd DD")}
              </div>

              {users.map((user) => {
                const ds = day.format("YYYY-MM-DD");

                const dayShifts = shifts.filter(
                  (s) =>
                    String(s.user_id) === String(user.id) &&
                    s.date === ds
                );

                return (
                  <div
                    key={user.id + ds}
                    className="relative border-b border-l border-white/10"
                    style={{
                      width: (END_HOUR - START_HOUR) * HOUR_WIDTH,
                      height: ROW_HEIGHT,
                    }}
                  >
                    {dayShifts.map((s) => {
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
  ) /
    60) *
  HOUR_WIDTH;

                      return (
                        <div
                          key={s.id}
                          onMouseDown={(e) =>
                            setDrag({
                              shift: s,
                              startX: e.clientX,
                              origLeft: left,
                              day,
                            })
                          }
                          onDoubleClick={() => setEditing(s)}
                         className="absolute px-2 py-1 text-xs rounded-xl cursor-move select-none transition-all"
style={{
  left,
  width,
  top: 6,
  background:
    drag?.shift?.id === s.id
      ? "linear-gradient(135deg,#818cf8,#6366f1)"
      : "linear-gradient(135deg,#6366f1,#4f46e5)",
  opacity: drag?.shift?.id === s.id ? 0.7 : 1,
}}
                        >
                          <div>{formatName(user.name)}</div>
                          <div className="text-[10px]">
                            {moment(active.start_time).format("HH:mm")} -{" "}
                            {moment(active.end_time).format("HH:mm")}
                          </div>

                          <div
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setResize({
                                shift: s,
                                startX: e.clientX,
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

            <button onClick={() => {
              updateShift(editing.id, editing);
              setEditing(null);
            }}>
              Save
            </button>

            <button onClick={() => {
              deleteShift(editing.id);
              setEditing(null);
            }}>
              Delete
            </button>

            <button onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}