// src/pages/Schedule.jsx
// FULL RESTORED VERSION
// Original UI kept + fixed logic + multi-company safe

import { useEffect, useMemo, useState } from "react";
import { userAPI, scheduleAPI } from "../services/api";
import { motion } from "framer-motion";

import {
  CalendarDays,
  Users,
  Plus,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function Schedule() {
  const [users, setUsers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [view, setView] = useState("calendar");
  const [search, setSearch] = useState("");

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

  async function loadData() {
    try {
      setLoading(true);

      const [usersData, rotaData] = await Promise.all([
        userAPI.getAll(),
        scheduleAPI.getAll(),
      ]);

      const safeUsers = Array.isArray(usersData) ? usersData : [];
      const safeRota = Array.isArray(rotaData) ? rotaData : [];

      const mapped = safeRota.map((item) => ({
        ...item,
        name:
          safeUsers.find((u) => u.id === item.user_id)?.name ||
          item.users?.name ||
          "Unknown",
      }));

      setUsers(safeUsers);
      setSchedules(mapped);
    } catch (err) {
      console.error(err);
      setUsers([]);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }

  async function createSchedule() {
    if (
      !selectedUsers.length ||
      !startDate ||
      !endDate ||
      !start ||
      !end
    ) {
      return alert("Fill all fields");
    }

    try {
      setCreating(true);

      let current = new Date(startDate + "T00:00:00");
      const finish = new Date(endDate + "T00:00:00");

      const requests = [];

      while (current <= finish) {
        const y = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, "0");
        const d = String(current.getDate()).padStart(2, "0");

        const dateStr = `${y}-${m}-${d}`;

        for (const userId of selectedUsers) {
          requests.push(
            scheduleAPI.create({
              user_id: userId,
              date: dateStr,
              start_time: `${dateStr}T${start}:00`,
              end_time: `${dateStr}T${end}:00`,
            })
          );
        }

        current.setDate(current.getDate() + 1);
      }

      await Promise.all(requests);

      setSelectedUsers([]);
      setStartDate("");
      setEndDate("");
      setStart("");
      setEnd("");

      await loadData();

      alert("Bulk shifts created");
    } catch (err) {
      console.error(err);
      alert("Failed to create shifts");
    } finally {
      setCreating(false);
    }
  }

  async function deleteShift(id) {
    if (!window.confirm("Delete this shift?")) return;

    try {
      await scheduleAPI.delete(id);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  }

  function changeMonth(dir) {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + dir);
    setCurrentMonth(next);
  }

  const endOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  );

  const days = [];

  for (let i = 1; i <= endOfMonth.getDate(); i++) {
    days.push(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        i
      )
    );
  }

  function getShiftsForDay(day) {
    return schedules.filter((s) => {
      const shiftDate = new Date(s.date + "T00:00:00");
      return shiftDate.toDateString() === day.toDateString();
    });
  }

  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [schedules, search]);

  const totalStaff = users.length;
  const totalShifts = schedules.length;

  const todayShifts = schedules.filter((s) => {
    const shiftDate = new Date(s.date + "T00:00:00");
    return shiftDate.toDateString() === new Date().toDateString();
  }).length;

  if (loading) {
    return (
      <div className="text-gray-400 flex gap-2 items-center">
        <Loader2 size={16} className="animate-spin" />
        Loading schedule...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Schedule</h1>
          <p className="text-sm text-gray-400">
            Plan shifts and manage rota
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setView("calendar")}
            className={`px-4 py-2 rounded-xl ${
              view === "calendar"
                ? "bg-indigo-600 text-white"
                : "bg-[#0f172a] text-gray-300"
            }`}
          >
            Calendar
          </button>

          <button
            onClick={() => setView("grid")}
            className={`px-4 py-2 rounded-xl ${
              view === "grid"
                ? "bg-indigo-600 text-white"
                : "bg-[#0f172a] text-gray-300"
            }`}
          >
            Grid
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-4 gap-4">
        <StatCard
          title="Total Staff"
          value={totalStaff}
          icon={<Users size={16} />}
        />

        <StatCard
          title="Shifts Today"
          value={todayShifts}
          icon={<Clock3 size={16} />}
        />

        <StatCard
          title="Total Shifts"
          value={totalShifts}
          icon={<CalendarDays size={16} />}
        />

        <StatCard
          title="Ready"
          value="Live"
          icon={<CheckCircle2 size={16} />}
        />
      </div>

      {/* BULK ASSIGN */}
      <div className="rounded-2xl border border-white/10 bg-[#020617] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Plus size={16} />
          <h3 className="font-medium">Bulk Assign Shifts</h3>
        </div>

        <div className="grid md:grid-cols-5 gap-3">
          <select
            multiple
            value={selectedUsers}
            onChange={(e) =>
              setSelectedUsers(
                Array.from(
                  e.target.selectedOptions,
                  (o) => o.value
                )
              )
            }
            className="bg-[#0f172a] border border-white/10 rounded-xl px-3 py-2 h-36"
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
            onChange={(e) =>
              setStartDate(e.target.value)
            }
            className="bg-[#0f172a] border border-white/10 rounded-xl px-3 py-2"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) =>
              setEndDate(e.target.value)
            }
            className="bg-[#0f172a] border border-white/10 rounded-xl px-3 py-2"
          />

          <input
            type="time"
            value={start}
            onChange={(e) =>
              setStart(e.target.value)
            }
            className="bg-[#0f172a] border border-white/10 rounded-xl px-3 py-2"
          />

          <input
            type="time"
            value={end}
            onChange={(e) =>
              setEnd(e.target.value)
            }
            className="bg-[#0f172a] border border-white/10 rounded-xl px-3 py-2"
          />
        </div>

        <button
          onClick={createSchedule}
          disabled={creating}
          className="w-full mt-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500"
        >
          {creating ? "Creating..." : "Create Bulk Shifts"}
        </button>
      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-4 top-3.5 text-gray-500"
        />

        <input
          placeholder="Search employee..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="w-full bg-[#020617] border border-white/10 rounded-2xl pl-11 pr-4 py-3"
        />
      </div>

      {/* GRID */}
      {view === "grid" && (
        <div className="grid md:grid-cols-3 gap-4">
          {filteredSchedules.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="rounded-2xl border border-white/10 bg-[#020617] p-4"
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{s.name}</p>

                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(
                      s.date + "T00:00:00"
                    ).toLocaleDateString("en-GB")}
                  </p>
                </div>

                <button
                  onClick={() =>
                    deleteShift(s.id)
                  }
                  className="text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* CALENDAR */}
      {view === "calendar" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() =>
                changeMonth(-1)
              }
              className="p-2 rounded-xl bg-[#0f172a]"
            >
              <ChevronLeft size={18} />
            </button>

            <h3 className="font-medium">
              {currentMonth.toLocaleString(
                "default",
                { month: "long" }
              )}{" "}
              {currentMonth.getFullYear()}
            </h3>

            <button
              onClick={() =>
                changeMonth(1)
              }
              className="p-2 rounded-xl bg-[#0f172a]"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((day, i) => {
              const shifts =
                getShiftsForDay(day);

              return (
                <div
                  key={i}
                  className="bg-[#020617] border border-white/10 rounded-xl p-2 min-h-[130px]"
                >
                  <div className="text-xs text-gray-500 mb-2">
                    {day.getDate()}
                  </div>

                  {shifts.map((s) => (
                    <div
                      key={s.id}
                      className="text-xs bg-indigo-500/20 text-indigo-300 rounded px-2 py-1 mb-1"
                    >
                      {s.name}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#020617] p-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-400">
          {title}
        </p>

        <div className="text-indigo-400">
          {icon}
        </div>
      </div>

      <h2 className="text-2xl font-semibold mt-2">
        {value}
      </h2>
    </div>
  );
}