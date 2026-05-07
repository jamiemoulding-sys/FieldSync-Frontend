import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { scheduleAPI, userAPI } from "../services/api";
import AddShiftModal from "../components/AddShiftModal";

/* MAIN */

export default function Schedule() {
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [holidays, setHolidays] = useState([]);

  const [view, setView] = useState("week");
  const [date, setDate] = useState(new Date());

  const [showAdd, setShowAdd] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

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
    const [u, s, a, h] = await Promise.all([
      userAPI.getAll(),
      scheduleAPI.getAll(),
      scheduleAPI.getAvailability?.() || [],
      scheduleAPI.getHolidays?.() || [],
    ]);

    setUsers(u || []);
    setShifts(s || []);
    setAvailability(a || []);
    setHolidays(h || []);
  }

  async function createShift(data) {
    await scheduleAPI.create(data);
    load();
  }

  async function updateShift(id, data) {
    await scheduleAPI.update(id, data);
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

  /* HELPERS */
  function formatName(name) {
    if (!name) return "Open";
    const [first, last] = name.split(" ");
    return `${first} ${last ? last[0] + "." : ""}`;
  }

  function getDayShifts(day) {
    return shifts.filter(
      (s) => s.date === day.format("YYYY-MM-DD")
    );
  }

  function isHoliday(day) {
    return holidays.includes(day.format("YYYY-MM-DD"));
  }

  function isAvailable(userId, day) {
    return availability.some(
      (a) =>
        a.user_id === userId &&
        a.date === day.format("YYYY-MM-DD")
    );
  }

  /* UI */
  return (
    <div className="h-screen flex bg-[#0B1220] text-white">

      <div className="flex-1 flex flex-col">

        {/* TOP BAR */}
        <div className="sticky top-0 z-20 flex justify-between items-center px-6 py-4 bg-[#111827] border-b border-white/10">
          <div className="text-lg font-semibold">
            {moment(date).startOf("isoWeek").format("DD MMM")} -{" "}
            {moment(date).endOf("isoWeek").format("DD MMM YYYY")}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setView("week")} className="btn-secondary">Week</button>
            <button onClick={() => setView("month")} className="btn-secondary">Month</button>

            <button onClick={prev} className="btn-secondary">←</button>
            <button onClick={() => setDate(new Date())} className="btn-secondary">Today</button>
            <button onClick={next} className="btn-secondary">→</button>

            <button onClick={() => setShowAdd(true)} className="btn-primary">+ Shift</button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-auto p-6">

          {/* WEEK VIEW */}
          {view === "week" && (
            <div className="grid grid-cols-7 gap-4">

              {days.map((day, i) => {
                const dayShifts = getDayShifts(day);

                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDay(day)}
                    className={`rounded-xl p-3 cursor-pointer transition
                      ${isHoliday(day)
                        ? "bg-red-900/30 border border-red-500/30"
                        : "bg-[#020617] hover:bg-[#0f172a]"
                      }`}
                  >
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>{day.format("ddd DD")}</span>
                      {isHoliday(day) && (
                        <span className="text-red-400 text-xs">Holiday</span>
                      )}
                    </div>

                    <div className="space-y-1">
                      {dayShifts.slice(0, 4).map((s) => {
                        const u = users.find((x) => x.id === s.user_id);

                        return (
                          <div
                            key={s.id}
                            className="bg-indigo-600 text-xs px-2 py-1 rounded flex justify-between"
                          >
                            <span>{formatName(u?.name)}</span>
                            <span>{moment(s.start_time).format("HH:mm")}</span>
                          </div>
                        );
                      })}

                      {/* AVAILABILITY */}
                      <div className="text-[10px] text-gray-500 pt-1">
                        {users
                          .filter((u) => isAvailable(u.id, day))
                          .slice(0, 3)
                          .map((u) => formatName(u.name))
                          .join(", ")}
                      </div>

                      {dayShifts.length > 4 && (
                        <div className="text-xs text-gray-400">
                          +{dayShifts.length - 4} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* MONTH VIEW */}
          {view === "month" && (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 42 }).map((_, i) => {
                const start = moment(date).startOf("month").startOf("isoWeek");
                const d = start.clone().add(i, "days");

                const dayShifts = getDayShifts(d);

                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDay(d)}
                    className="border border-white/10 p-2 min-h-[100px] rounded hover:bg-white/5 cursor-pointer"
                  >
                    <div className="text-xs text-gray-400">
                      {d.format("DD")}
                    </div>

                    {dayShifts.slice(0, 3).map((s) => {
                      const u = users.find((x) => x.id === s.user_id);

                      return (
                        <div
                          key={s.id}
                          className="text-xs bg-indigo-600 mt-1 p-1 rounded"
                        >
                          {formatName(u?.name)}
                        </div>
                      );
                    })}

                    {dayShifts.length > 3 && (
                      <div className="text-xs text-gray-400 mt-1">
                        +{dayShifts.length - 3}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ADD SHIFT MODAL */}
      {showAdd && (
        <AddShiftModal
          users={users}
          form={form}
          setForm={setForm}
          createShift={createShift}
          onClose={() => setShowAdd(false)}
        />
      )}

      {/* DAY DETAIL MODAL */}
      {selectedDay && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="bg-[#020617] p-6 w-[420px] rounded-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between">
              <div className="text-lg font-semibold">
                {selectedDay.format("dddd DD MMM")}
              </div>
              <button onClick={() => setSelectedDay(null)}>✕</button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">

              {/* SHIFTS */}
              <div>
                <div className="text-xs text-gray-400 mb-1">Scheduled</div>

                {getDayShifts(selectedDay).map((s) => {
                  const u = users.find((x) => x.id === s.user_id);

                  return (
                    <div
                      key={s.id}
                      className="flex justify-between p-2 rounded bg-indigo-600/20 border border-indigo-500/20"
                    >
                      <div>{formatName(u?.name)}</div>
                      <div>
                        {moment(s.start_time).format("HH:mm")} -{" "}
                        {moment(s.end_time).format("HH:mm")}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AVAILABLE */}
              <div>
                <div className="text-xs text-gray-400 mb-1">Available Staff</div>

                {users
                  .filter((u) => isAvailable(u.id, selectedDay))
                  .map((u) => (
                    <div
                      key={u.id}
                      className="p-2 rounded bg-green-500/10 border border-green-500/20 text-sm"
                    >
                      {formatName(u.name)}
                    </div>
                  ))}
              </div>

              {/* HOLIDAY */}
              {isHoliday(selectedDay) && (
                <div className="p-2 rounded bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                  Holiday — no shifts expected
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}