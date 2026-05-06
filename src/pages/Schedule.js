import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import {
  scheduleAPI,
  holidayAPI,
  userAPI,
  locationAPI,
} from "../services/api";

export default function Schedule() {
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [holidays, setHolidays] = useState([]);

  const [view, setView] = useState("week");
  const [date, setDate] = useState(new Date());
  const [editMode, setEditMode] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const [dragging, setDragging] = useState(null);

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

  function isHoliday(uid, ds) {
    return holidays.some(
      (h) =>
        h.user_id === uid &&
        h.status === "approved" &&
        ds >= h.start_date &&
        ds <= h.end_date
    );
  }

  async function createBulk() {
    let d = moment(form.from);
    const end = moment(form.to);

    while (d.isSameOrBefore(end, "day")) {
      const ds = d.format("YYYY-MM-DD");

      for (const uid of form.user_ids) {
        if (isHoliday(uid, ds)) continue;

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

  async function updateShift(id, data) {
    await scheduleAPI.update(id, data);
    load();
  }

  async function deleteShift(id) {
    await scheduleAPI.delete(id);
    load();
  }

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

  function handleDrop(day) {
    if (!dragging) return;

    updateShift(dragging.id, {
      date: day.format("YYYY-MM-DD"),
    });

    setDragging(null);
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex gap-2">
        <button onClick={() => setView("week")}>Week</button>
        <button onClick={() => setView("month")}>Month</button>
        <button onClick={() => setView("list")}>List</button>

        <button onClick={() => setEditMode(!editMode)}>
          {editMode ? "Done" : "Edit"}
        </button>

        <button onClick={() => setShowAdd(true)}>
          Add
        </button>
      </div>

      {/* GRID */}
      {view !== "list" && (
        <div className="grid grid-cols-7 gap-2">

          {days.map((d) => {
            const ds = d.format("YYYY-MM-DD");

            const dayShifts = shifts.filter(
              (s) => s.date === ds
            );

            return (
              <div
                key={ds}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(d)}
                className="border p-2 min-h-[140px]"
              >
                <p className="text-xs text-gray-400">
                  {d.format("DD MMM")}
                </p>

                {/* HOLIDAYS */}
                {holidays
                  .filter(
                    (h) =>
                      h.status === "approved" &&
                      ds >= h.start_date &&
                      ds <= h.end_date
                  )
                  .map((h) => (
                    <div
                      key={h.id}
                      className="bg-green-600 text-xs p-1 rounded"
                    >
                      HOLIDAY
                    </div>
                  ))}

                {/* SHIFTS */}
                {dayShifts.map((s) => {
                  const start = moment(s.start_time);
                  const end = moment(s.end_time);

                  return (
                    <div
                      key={s.id}
                      draggable
                      onDragStart={() => setDragging(s)}
                      className="bg-indigo-600 p-2 rounded text-xs mt-2 relative cursor-move"
                    >
                      {editMode && (
                        <button
                          onClick={() => deleteShift(s.id)}
                          className="absolute right-1 top-1"
                        >
                          ✕
                        </button>
                      )}

                      {
                        users.find(
                          (u) => u.id === s.user_id
                        )?.name
                      }

                      <br />

                      {start.format("HH:mm")} -{" "}
                      {end.format("HH:mm")}

                      {/* RESIZE */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-white/20"
                        onMouseDown={(e) => {
                          e.preventDefault();

                          const startY = e.clientY;
                          const original = moment(s.end_time);

                          function move(ev) {
                            const diff = ev.clientY - startY;
                            const mins = Math.round(diff / 2) * 15;

                            const newEnd = original.clone().add(mins, "minutes");

                            updateShift(s.id, {
                              end_time: newEnd.toISOString(),
                            });
                          }

                          function stop() {
                            window.removeEventListener("mousemove", move);
                            window.removeEventListener("mouseup", stop);
                          }

                          window.addEventListener("mousemove", move);
                          window.addEventListener("mouseup", stop);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* LIST */}
      {view === "list" && (
        <div className="space-y-2">
          {shifts.map((s) => (
            <div key={s.id} className="p-3 border rounded">
              {moment(s.date).format("DD MMM")} —{" "}
              {
                users.find(
                  (u) => u.id === s.user_id
                )?.name
              }
            </div>
          ))}
        </div>
      )}

      {/* BULK ADD */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-[#020617] p-6 rounded-xl space-y-4 w-[400px]">

            <input
              type="date"
              value={form.from}
              onChange={(e) =>
                setForm({ ...form, from: e.target.value })
              }
            />

            <input
              type="date"
              value={form.to}
              onChange={(e) =>
                setForm({ ...form, to: e.target.value })
              }
            />

            <input
              type="time"
              value={form.start}
              onChange={(e) =>
                setForm({ ...form, start: e.target.value })
              }
            />

            <input
              type="time"
              value={form.end}
              onChange={(e) =>
                setForm({ ...form, end: e.target.value })
              }
            />

            <div className="max-h-40 overflow-auto">
              {users.map((u) => (
                <label key={u.id} className="block">
                  <input
                    type="checkbox"
                    checked={form.user_ids.includes(u.id)}
                    onChange={() => {
                      const exists =
                        form.user_ids.includes(u.id);

                      setForm({
                        ...form,
                        user_ids: exists
                          ? form.user_ids.filter((x) => x !== u.id)
                          : [...form.user_ids, u.id],
                      });
                    }}
                  />
                  {u.name}
                </label>
              ))}
            </div>

            <button
              onClick={createBulk}
              className="w-full bg-emerald-600 py-2 rounded"
            >
              Save
            </button>

            <button
              onClick={() => setShowAdd(false)}
              className="w-full bg-gray-600 py-2 rounded"
            >
              Cancel
            </button>

          </div>
        </div>
      )}

    </div>
  );
}