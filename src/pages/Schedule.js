import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { scheduleAPI, userAPI } from "../services/api";
import AddShiftModal from "../components/AddShiftModal";

export default function Schedule() {
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);

  const [view, setView] = useState("week");
  const [date, setDate] = useState(new Date());

  const [editing, setEditing] = useState(null);
  const [dayModal, setDayModal] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState({
    start: "09:00",
    end: "17:00",
  });

  const holidays = [
    { date: "2026-05-08", name: "Bank Holiday" },
    { date: "2026-05-12", name: "Maintenance Day" },
  ];

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

  function isHoliday(dateStr) {
    return holidays.find((h) => h.date === dateStr);
  }

  async function createShift(data) {
    if (isHoliday(data.date)) return;

    const overlap = shifts.some(
      (s) =>
        s.user_id === data.user_id &&
        s.date === data.date &&
        new Date(data.start_time) < new Date(s.end_time) &&
        new Date(data.end_time) > new Date(s.start_time)
    );

    if (overlap) {
      alert("User already has a shift during this time");
      return;
    }

    await scheduleAPI.create(data);
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

  function prev() {
    setDate(moment(date).subtract(1, view === "month" ? "month" : "week").toDate());
  }

  function next() {
    setDate(moment(date).add(1, view === "month" ? "month" : "week").toDate());
  }

  function formatName(name) {
    if (!name) return "";
    const [first, last] = name.split(" ");
    return last ? `${first} ${last[0]}` : first;
  }

  const days = useMemo(() => {
    const start = moment(date).startOf("isoWeek");
    return Array.from({ length: 7 }).map((_, i) =>
      start.clone().add(i, "days")
    );
  }, [date]);

  async function bulkAddDay(day) {
    const dateStr = day.format("YYYY-MM-DD");

    if (isHoliday(dateStr)) return;

    const newShifts = [...shifts];

    for (const u of users) {
      const exists = newShifts.some(
        (s) => s.user_id === u.id && s.date === dateStr
      );

      if (exists) continue;

      const newShift = {
        user_id: u.id,
        date: dateStr,
        start_time: `${dateStr}T09:00:00`,
        end_time: `${dateStr}T17:00:00`,
      };

      await scheduleAPI.create(newShift);
      newShifts.push(newShift);
    }

    load();
  }

  async function bulkAddWeek() {
    for (const d of days) {
      await bulkAddDay(d);
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#0B1220] text-white">

      {/* HEADER */}
      <div className="flex justify-between items-center px-6 py-4 bg-[#111827] border-b border-white/10">
        <div className="text-lg font-semibold">
          {view === "week" &&
            `${moment(date).startOf("isoWeek").format("DD MMM")} - ${moment(date).endOf("isoWeek").format("DD MMM YYYY")}`}
          {view === "month" && moment(date).format("MMMM YYYY")}
        </div>

        <div className="flex gap-2">
          <button onClick={() => setView("week")}>Week</button>
          <button onClick={() => setView("month")}>Month</button>

          <button onClick={prev}>←</button>
          <button onClick={() => setDate(new Date())}>Today</button>
          <button onClick={next}>→</button>

          <button onClick={bulkAddWeek} className="bg-indigo-600 px-3 py-1 rounded">
            + Bulk Week
          </button>

          <button onClick={() => setShowAdd(true)} className="bg-indigo-600 px-3 py-1 rounded">
            + Shift
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-auto p-6">

        {/* WEEK */}
        {view === "week" && (
          <div className="border border-white/10 rounded overflow-hidden">

            <div className="grid grid-cols-8 bg-[#020617] border-b border-white/10">
              <div className="p-2 text-xs text-gray-400">Employee</div>

              {days.map((d, i) => (
                <div key={i} className="p-2 text-xs text-center text-gray-400">
                  {d.format("ddd DD")}
                  <button
                    onClick={() => bulkAddDay(d)}
                    className="block text-[10px] bg-indigo-600 mt-1 px-2 rounded"
                  >
                    + All
                  </button>
                </div>
              ))}
            </div>

            {users.map(user => (
              <div key={user.id} className="grid grid-cols-8 border-b border-white/10">

                <div className="p-2">{user.name}</div>

                {days.map((day, i) => {
                  const ds = day.format("YYYY-MM-DD");
                  const holiday = isHoliday(ds);

                  const dayShifts = shifts.filter(
                    s => s.date === ds && s.user_id === user.id
                  );

                  return (
                    <div
                      key={i}
                      onClick={() => setDayModal(ds)}
                      className={`p-1 min-h-[70px] cursor-pointer ${
                        holiday ? "bg-red-500/10" : ""
                      }`}
                    >
                      {holiday && (
                        <div className="text-[10px] text-red-400">
                          {holiday.name}
                        </div>
                      )}

                      {dayShifts.map(s => (
                        <div
                          key={s.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(s);
                          }}
                          className="bg-indigo-600 text-xs px-2 py-1 rounded mt-1"
                        >
                          {formatName(user.name)}
                          <div className="text-[10px]">
                            {moment(s.start_time).format("HH:mm")} - {moment(s.end_time).format("HH:mm")}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}

              </div>
            ))}

          </div>
        )}

        {/* MONTH */}
        {view === "month" && (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 42 }).map((_, i) => {
              const start = moment(date).startOf("month").startOf("isoWeek");
              const d = start.clone().add(i, "days");
              const ds = d.format("YYYY-MM-DD");
              const holiday = isHoliday(ds);

              return (
                <div
                  key={i}
                  onClick={() => setDayModal(ds)}
                  className="border p-2 min-h-[100px] cursor-pointer"
                >
                  <div className="text-xs">{d.format("DD")}</div>

                  {holiday && (
                    <div className="text-[10px] text-red-400">
                      {holiday.name}
                    </div>
                  )}

                  {shifts
                    .filter(s => s.date === ds)
                    .slice(0, 4)
                    .map(s => {
                      const user = users.find(u => u.id === s.user_id);

                      return (
                        <div key={s.id} className="text-[10px] bg-indigo-600 mt-1 p-1 rounded">
                          {formatName(user?.name)} {moment(s.start_time).format("HH:mm")}
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ADD MODAL */}
      {showAdd && (
        <AddShiftModal
          users={users}
          form={form}
          setForm={setForm}
          createShift={createShift}
          onClose={() => setShowAdd(false)}
        />
      )}

      {/* DAY MODAL */}
      {dayModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-[#020617] p-6 w-[400px] max-h-[80vh] overflow-y-auto rounded">
            <div className="text-lg mb-2">
              {moment(dayModal).format("DD MMM YYYY")}
            </div>

            {shifts
              .filter(s => s.date === dayModal)
              .map(s => {
                const user = users.find(u => u.id === s.user_id);

                return (
                  <div key={s.id} className="border p-2 rounded mb-2">
                    {user?.name}
                    <div className="text-xs">
                      {moment(s.start_time).format("HH:mm")} - {moment(s.end_time).format("HH:mm")}
                    </div>
                  </div>
                );
              })}

            <button onClick={() => setDayModal(null)}>Close</button>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-[#020617] p-6 space-y-3 rounded">
            <input
              type="time"
              defaultValue={moment(editing.start_time).format("HH:mm")}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  start_time: `${editing.date}T${e.target.value}:00`,
                })
              }
            />

            <input
              type="time"
              defaultValue={moment(editing.end_time).format("HH:mm")}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  end_time: `${editing.date}T${e.target.value}:00`,
                })
              }
            />

            <button onClick={() => { updateShift(editing.id, editing); setEditing(null); }}>
              Save
            </button>

            <button onClick={() => { deleteShift(editing.id); setEditing(null); }}>
              Delete
            </button>

            <button onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}

    </div>
  );
}