import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { scheduleAPI, userAPI } from "../services/api";

/* ================= MAIN ================= */

export default function Schedule() {
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);

  const [view, setView] = useState("week");
  const [date, setDate] = useState(new Date());

  const [showBulk, setShowBulk] = useState(false);

  const [bulk, setBulk] = useState({
    users: [],
    startDate: "",
    endDate: "",
    days: [1, 2, 3, 4, 5], // weekdays default
    start: "09:00",
    end: "17:00",
  });

  const holidays = [];

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

  async function deleteShift(id) {
    await scheduleAPI.delete(id);
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

  function formatName(name) {
    if (!name) return "";
    const [first, last] = name.split(" ");
    return last ? `${first} ${last[0]}` : first;
  }

  /* ================= BULK CREATE ================= */

  function runBulk() {
    if (!bulk.startDate || !bulk.endDate) {
      alert("Select date range");
      return;
    }

    if (bulk.users.length === 0) {
      alert("Select users");
      return;
    }

    let current = moment(bulk.startDate);
    const end = moment(bulk.endDate);

    while (current.isSameOrBefore(end)) {
      if (bulk.days.includes(current.isoWeekday())) {
        bulk.users.forEach((userId) => {
          createShift({
            user_id: userId,
            date: current.format("YYYY-MM-DD"),
            start_time: `${current.format("YYYY-MM-DD")}T${bulk.start}:00`,
            end_time: `${current.format("YYYY-MM-DD")}T${bulk.end}:00`,
          });
        });
      }
      current.add(1, "day");
    }

    setShowBulk(false);
  }

  /* ================= UI ================= */

  return (
    <div className="h-screen flex bg-[#0B1220] text-white">

      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 bg-[#111827] border-b border-white/10">

          <div>
            {view === "week" && (
              <>
                {moment(date).startOf("isoWeek").format("DD MMM")} -{" "}
                {moment(date).endOf("isoWeek").format("DD MMM YYYY")}
              </>
            )}
            {view === "month" && moment(date).format("MMMM YYYY")}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setView("week")} className="btn-secondary">Week</button>
            <button onClick={() => setView("month")} className="btn-secondary">Month</button>

            <button onClick={prev}>←</button>
            <button onClick={() => setDate(new Date())}>Today</button>
            <button onClick={next}>→</button>

            <button onClick={() => setShowBulk(true)} className="btn-primary">
              Bulk Add
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
                  </div>
                ))}
              </div>

              {users.map(user => (
                <div key={user.id} className="grid grid-cols-8 border-b border-white/10">

                  <div className="p-2">{user.name}</div>

                  {days.map((day, i) => {
                    const ds = day.format("YYYY-MM-DD");

                    const dayShifts = shifts.filter(
                      s => s.date === ds && s.user_id === user.id
                    );

                    return (
                      <div key={i} className="p-1 min-h-[60px] space-y-1">

                        {dayShifts.map(s => (
                          <div
                            key={s.id}
                            className="bg-indigo-600 text-xs px-2 py-1 rounded cursor-pointer"
                            onDoubleClick={() => {
                              if (window.confirm("Delete shift?")) {
                                deleteShift(s.id);
                              }
                            }}
                          >
                            {formatName(user.name)}<br/>
                            {moment(s.start_time).format("HH:mm")} - {moment(s.end_time).format("HH:mm")}
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


                function bulkAddAllUsers(day) {
  const dateStr = day.format("YYYY-MM-DD");

  users.forEach((u) => {
    createShift({
      user_id: u.id,
      date: dateStr,
      start_time: `${dateStr}T09:00:00`,
      end_time: `${dateStr}T17:00:00`,
    });
  });
}

                return (
                  <div key={i} className="border p-2 min-h-[100px]">
                    <div className="text-xs text-gray-400">{d.format("DD")}</div>

                    {shifts
                      .filter(s => s.date === ds)
                      .slice(0, 3)
                      .map(s => {
                        const user = users.find(u => u.id === s.user_id);
                        return (
                          <div key={s.id} className="text-xs bg-indigo-600 mt-1 p-1 rounded">
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
      </div>

      {/* BULK MODAL */}
      {showBulk && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">

          <div className="bg-[#020617] p-6 w-[350px] space-y-3 rounded">

            <div className="flex justify-between">
              <div>Bulk Add</div>
              <button onClick={() => setShowBulk(false)}>✕</button>
            </div>

            {/* USERS */}
            <div className="max-h-[120px] overflow-auto border p-2">
              {users.map(u => (
                <label key={u.id} className="flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={bulk.users.includes(u.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setBulk({ ...bulk, users: [...bulk.users, u.id] });
                      } else {
                        setBulk({
                          ...bulk,
                          users: bulk.users.filter(id => id !== u.id),
                        });
                      }
                    }}
                  />
                  {u.name}
                </label>
              ))}
            </div>

            {/* DATES */}
            <input type="date" onChange={e => setBulk({ ...bulk, startDate: e.target.value })}/>
            <input type="date" onChange={e => setBulk({ ...bulk, endDate: e.target.value })}/>

            {/* TIMES */}
            <input type="time" onChange={e => setBulk({ ...bulk, start: e.target.value })}/>
            <input type="time" onChange={e => setBulk({ ...bulk, end: e.target.value })}/>

            <button onClick={runBulk} className="bg-indigo-600 w-full p-2">
              Create Shifts
            </button>

          </div>
        </div>
      )}

    </div>
  );
}