import { useEffect, useState } from "react";
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
} from "lucide-react";

export default function Schedule() {
  const [users, setUsers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState("calendar");
  const [search, setSearch] = useState("");

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const [currentMonth, setCurrentMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [usersData, scheduleData] = await Promise.all([
        userAPI.getAll(),
        scheduleAPI.getAll(),
      ]);

      setUsers(Array.isArray(usersData) ? usersData : []);
      setSchedules(Array.isArray(scheduleData) ? scheduleData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createSchedule = async () => {
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
      let current = new Date(startDate);
      const finish = new Date(endDate);

      const requests = [];

      while (current <= finish) {
        const dateStr = current.toISOString().split("T")[0];

        selectedUsers.forEach((userId) => {
          requests.push(
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

      await Promise.all(requests);

      setSelectedUsers([]);
      setStartDate("");
      setEndDate("");
      setStart("");
      setEnd("");

      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to create shifts");
    }
  };

  const deleteShift = async (id) => {
    try {
      await scheduleAPI.delete(id);
      loadData();
    } catch {
      alert("Delete failed");
    }
  };

  const changeMonth = (dir) => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + dir);
    setCurrentMonth(next);
  };

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

  const getShiftsForDay = (day) => {
    return schedules.filter(
      (s) =>
        new Date(s.date).toDateString() ===
        day.toDateString()
    );
  };

  const filteredSchedules = schedules.filter((s) =>
    `${s.name || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalShifts = schedules.length;
  const totalStaff = users.length;

  const todayShifts = schedules.filter(
    (s) =>
      new Date(s.date).toDateString() ===
      new Date().toDateString()
  ).length;

  if (loading) {
    return (
      <div className="text-gray-400">
        Loading schedule...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Schedule
          </h1>

          <p className="text-sm text-gray-400">
            Plan shifts and manage rota
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setView("calendar")}
            className={`px-4 py-2 rounded-xl text-sm ${
              view === "calendar"
                ? "bg-indigo-600"
                : "bg-white/5"
            }`}
          >
            Calendar
          </button>

          <button
            onClick={() => setView("grid")}
            className={`px-4 py-2 rounded-xl text-sm ${
              view === "grid"
                ? "bg-indigo-600"
                : "bg-white/5"
            }`}
          >
            Grid
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid md:grid-cols-3 gap-4">
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
      </div>

      {/* CREATE */}
      <div className="rounded-2xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
        <div className="bg-[#020617] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Plus size={16} />
            <h3 className="font-medium">
              Bulk Assign Shifts
            </h3>
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
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 h-36"
            >
              {users.map((u) => (
                <option
                  key={u.id}
                  value={u.id}
                >
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
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2"
            />

            <input
              type="date"
              value={endDate}
              onChange={(e) =>
                setEndDate(e.target.value)
              }
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2"
            />

            <input
              type="time"
              value={start}
              onChange={(e) =>
                setStart(e.target.value)
              }
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2"
            />

            <input
              type="time"
              value={end}
              onChange={(e) =>
                setEnd(e.target.value)
              }
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2"
            />
          </div>

          <button
            onClick={createSchedule}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-medium"
          >
            Create Bulk Shifts
          </button>
        </div>
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
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: i * 0.03,
              }}
              className="rounded-2xl p-[1px] bg-gradient-to-b from-white/10 to-transparent"
            >
              <div className="bg-[#020617] border border-white/10 rounded-2xl p-4">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">
                      {s.name}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(
                        s.date
                      ).toLocaleDateString()}
                    </p>

                    <p className="text-sm mt-2">
                      {new Date(
                        s.start_time
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(
                        s.end_time
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
              className="p-2 rounded-xl bg-white/5"
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
              className="p-2 rounded-xl bg-white/5"
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
                  className="bg-[#020617] border border-white/10 rounded-xl p-2 min-h-[110px]"
                >
                  <div className="text-xs text-gray-500 mb-2">
                    {day.getDate()}
                  </div>

                  {shifts.map((s) => (
                    <div
                      key={s.id}
                      className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded mb-1"
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
    <div className="rounded-2xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
      <div className="bg-[#020617] border border-white/10 rounded-2xl p-4">
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
    </div>
  );
}