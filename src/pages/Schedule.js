import { useEffect, useState } from "react";
import { userAPI, scheduleAPI } from "../services/api";
import { motion } from "framer-motion";

export default function Schedule() {
  const [users, setUsers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [view, setView] = useState("grid");

  // ✅ NEW (MULTI USER + RANGE)
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, schedData] = await Promise.all([
        userAPI.getAll(),
        scheduleAPI.getAll(),
      ]);

      setUsers(Array.isArray(usersData) ? usersData : []);
      setSchedules(Array.isArray(schedData) ? schedData : []);
    } catch (err) {
      console.error(err);
    }
  };

  // 🚀 BULK CREATE
  const createSchedule = async () => {
    if (!selectedUsers.length || !startDate || !endDate || !start || !end) {
      return alert("Fill all fields");
    }

    try {
      let current = new Date(startDate);
      const endD = new Date(endDate);

      const promises = [];

      while (current <= endD) {
        const dateStr = current.toISOString().split("T")[0];

        selectedUsers.forEach((userId) => {
          promises.push(
            scheduleAPI.create({
              user_id: userId,
              date: dateStr,
              start_time: `${dateStr}T${start}`,
              end_time: `${dateStr}T${end}`,
            })
          );
        });

        current.setDate(current.getDate() + 1);
      }

      await Promise.all(promises);

      // reset
      setSelectedUsers([]);
      setStartDate("");
      setEndDate("");
      setStart("");
      setEnd("");

      loadData();
    } catch (err) {
      console.error(err);
      alert("Bulk create failed");
    }
  };

  const deleteSchedule = async (id) => {
    await scheduleAPI.delete(id);
    loadData();
  };

  /* CALENDAR */
  const endOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  );

  const days = [];
  for (let i = 1; i <= endOfMonth.getDate(); i++) {
    days.push(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i)
    );
  }

  const getShiftsForDay = (day) => {
    return schedules.filter(
      (s) =>
        new Date(s.date).toDateString() === day.toDateString()
    );
  };

  const changeMonth = (dir) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + dir);
    setCurrentMonth(newDate);
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Schedule</h1>
          <p className="text-gray-400 text-sm">
            Plan and manage team shifts
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setView("grid")}
            className={`px-3 py-1 rounded-lg text-sm ${
              view === "grid"
                ? "bg-indigo-600 text-white"
                : "bg-white/5 text-gray-400"
            }`}
          >
            Grid
          </button>

          <button
            onClick={() => setView("calendar")}
            className={`px-3 py-1 rounded-lg text-sm ${
              view === "calendar"
                ? "bg-indigo-600 text-white"
                : "bg-white/5 text-gray-400"
            }`}
          >
            Calendar
          </button>
        </div>
      </div>

      {/* 🔥 BULK CREATE */}
      <div className="rounded-2xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
        <div className="bg-[#020617] border border-white/10 rounded-2xl p-5">

          <h3 className="text-sm text-gray-400 mb-3">
            Bulk Assign Shifts
          </h3>

          <div className="grid md:grid-cols-5 gap-3">

            {/* MULTI SELECT */}
            <select
              multiple
              value={selectedUsers}
              onChange={(e) =>
                setSelectedUsers(
                  Array.from(e.target.selectedOptions, (o) => o.value)
                )
              }
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm h-32"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm"
            />

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm"
            />

            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm"
            />

            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm"
            />

          </div>

          <button
            onClick={createSchedule}
            className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 text-sm"
          >
            Create Bulk Shifts
          </button>
        </div>
      </div>

      {/* GRID VIEW */}
      {view === "grid" && (
        <div className="grid md:grid-cols-3 gap-4">
          {schedules.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-2xl p-[1px] bg-gradient-to-b from-white/10 to-transparent"
            >
              <div className="bg-[#020617] border border-white/10 rounded-2xl p-4 flex justify-between">

                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-gray-400 text-xs">
                    {new Date(s.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm">
                    {new Date(s.start_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })} →
                    {new Date(s.end_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <button
                  onClick={() => deleteSchedule(s.id)}
                  className="text-red-400 text-xs hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* CALENDAR */}
      {view === "calendar" && (
        <div>

          <div className="flex justify-between mb-3">
            <button onClick={() => changeMonth(-1)}>←</button>

            <h3>
              {currentMonth.toLocaleString("default", {
                month: "long",
              })}{" "}
              {currentMonth.getFullYear()}
            </h3>

            <button onClick={() => changeMonth(1)}>→</button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((day, i) => (
              <div
                key={i}
                className="bg-[#020617] border border-white/10 rounded-xl p-2 min-h-[80px]"
              >
                <div className="text-xs text-gray-500">
                  {day.getDate()}
                </div>

                {getShiftsForDay(day).map((s) => (
                  <div
                    key={s.id}
                    className="text-xs bg-indigo-500/20 text-indigo-400 px-1 rounded mt-1"
                  >
                    {s.name}
                  </div>
                ))}
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}