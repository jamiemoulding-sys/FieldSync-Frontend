import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { scheduleAPI, userAPI } from "../services/api";
import AddShiftModal from "../components/AddShiftModal";

/* ================= MAIN ================= */

export default function Schedule() {
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);
  
  const [view, setView] = useState("week");
  const [date, setDate] = useState(new Date());

  const [showAdd, setShowAdd] = useState(false);
  const holidays = [];

  const [form, setForm] = useState({
    user_id: "",
    date: "",
    start: "09:00",
    end: "17:00",
  });

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

  async function updateShift(id, data) {
    await scheduleAPI.update(id, data);
    load();
  }

  /* ================= NAV ================= */

  function prev() {
    setDate(moment(date).subtract(1, view === "month" ? "month" : "week").toDate());
  }

  function next() {
    setDate(moment(date).add(1, view === "month" ? "month" : "week").toDate());
  }

  function quickAddShift(userId, day) {
  createShift({
    user_id: userId,
    date: day.format("YYYY-MM-DD"),
    start_time: `${day.format("YYYY-MM-DD")}T09:00:00`,
    end_time: `${day.format("YYYY-MM-DD")}T17:00:00`,
  });
}
  /* ================= DAYS ================= */

  const days = useMemo(() => {
    const start = moment(date).startOf("isoWeek");
    return Array.from({ length: 7 }).map((_, i) =>
      start.clone().add(i, "days")
    );
  }, [date]);

  /* ================= AI ================= */

  async function runAutoFill() {
    const openShifts = shifts.filter((s) => !s.user_id);

    for (const shift of openShifts) {
      const available = users.filter((u) => {
        const conflict = shifts.some(
          (s) =>
            s.user_id === u.id &&
            s.date === shift.date &&
            new Date(shift.start_time) < new Date(s.end_time) &&
            new Date(shift.end_time) > new Date(s.start_time)
        );

        if (conflict) return false;

        const totalHours = shifts
          .filter((s) => s.user_id === u.id)
          .reduce((sum, s) => sum + ((new Date(s.end_time) - new Date(s.start_time)) / 3600000), 0);

        return totalHours < 48;
      });

      if (!available.length) continue;

      await updateShift(shift.id, {
        user_id: available[0].id,
      });
    }
  }

  /* ================= UI ================= */

  return (
    <div className="h-screen flex bg-[#0B1220] text-white">

      {/* MAIN */}
      <div className="flex-1 flex flex-col">

        {/* TOP BAR */}
        <div className="sticky top-0 z-20 flex justify-between items-center px-6 py-4 bg-[#111827] border-b border-white/10">

          <div className="text-lg font-semibold">
            {view === "week" && (
              <span>
                {moment(date).startOf("isoWeek").format("DD MMM")} -{" "}
                {moment(date).endOf("isoWeek").format("DD MMM YYYY")}
              </span>
            )}
            {view === "month" && <span>{moment(date).format("MMMM YYYY")}</span>}
            {view === "list" && <span>All Shifts</span>}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setView("week")} className="btn-secondary">Week</button>
            <button onClick={() => setView("month")} className="btn-secondary">Month</button>
            <button onClick={() => setView("list")} className="btn-secondary">List</button>

            <button onClick={prev} className="btn-secondary">←</button>
            <button onClick={() => setDate(new Date())} className="btn-secondary">Today</button>
            <button onClick={next} className="btn-secondary">→</button>

            <button onClick={runAutoFill} className="btn-ai">🤖 AI</button>
            <button onClick={() => setShowAdd(true)} className="btn-primary">+ Shift</button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-auto p-6">

          {/* WEEK VIEW */}
          {view === "week" && (
            <div className="border border-white/10 rounded overflow-hidden">
          
              {/* HEADER */}
              <div className="grid grid-cols-8 bg-[#020617] border-b border-white/10">
                <div className="p-2 text-xs text-gray-400">Employee</div>

                {days.map((d, i) => (
                  <div key={i} className="p-2 text-xs text-center text-gray-400">
                    {d.format("ddd DD")}
                  </div>
                ))}
              </div>

              {/* ROWS */}
              {users.map(user => (
                <div key={user.id} className="grid grid-cols-8 border-b border-white/10">
                
                  <div className="p-2 bg-[#020617] text-sm">
                    {user.name}
                  </div>

                  {days.map((day, i) => {
                    const ds = day.format("YYYY-MM-DD");

                    const dayShifts = shifts.filter(
                      s => s.date === ds && s.user_id === user.id
                    );
                    const isHoliday = holidays.includes(ds);
                    
                    return (
                      <div
  key={i}
  className="p-1 space-y-1 min-h-[70px] cursor-pointer hover:bg-white/5"
  onClick={() => quickAddShift(user.id, day)}
>

                       {dayShifts.map(s => (
  <div
    key={s.id}
    className="bg-indigo-600 text-xs px-2 py-1 rounded flex justify-between items-center"
  >
    <span>
      {moment(s.start_time).format("HH:mm")} - {moment(s.end_time).format("HH:mm")}
    </span>

    <button
      onClick={(e) => {
        e.stopPropagation();

        const newStart = prompt(
          "New start time (HH:mm)",
          moment(s.start_time).format("HH:mm")
        );
        const newEnd = prompt(
          "New end time (HH:mm)",
          moment(s.end_time).format("HH:mm")
        );

        if (!newStart || !newEnd) return;

        updateShift(s.id, {
          start_time: `${s.date}T${newStart}:00`,
          end_time: `${s.date}T${newEnd}:00`,
        });
      }}
      className="text-[10px] bg-black/30 px-1 rounded"
    >
      Edit
    </button>
  </div>
))}

                      </div>
                    );
                  })}

                </div>
              ))}

            </div>
          )}

          {/* MONTH VIEW */}
          {view === "month" && (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 42 }).map((_, i) => {
                const start = moment(date).startOf("month").startOf("isoWeek");
                const d = start.clone().add(i, "days");

                return (
                  <div key={i} className="border p-2 min-h-[100px]">
                    <div className="text-xs text-gray-400">{d.format("DD")}</div>

                    {shifts
                      .filter(s => s.date === d.format("YYYY-MM-DD"))
                      .map(s => (
                        <div key={s.id} className="text-xs bg-indigo-600 mt-1 p-1 rounded">
                          {moment(s.start_time).format("HH:mm")} - {moment(s.end_time).format("HH:mm")}
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* LIST VIEW */}
          {view === "list" && (
            <div className="space-y-2">
              {shifts.map((s) => {
                const user = users.find((u) => u.id === s.user_id);

                return (
                  <div key={s.id} className="p-3 border rounded flex justify-between">
                    <div>
                      <div className="font-semibold">
                        {user?.name || "Unassigned"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {moment(s.date).format("DD MMM YYYY")}
                      </div>
                    </div>

                    <div className="text-sm">
                      {moment(s.start_time).format("HH:mm")} - {moment(s.end_time).format("HH:mm")}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

            </div> {/* CONTENT */}
    

            </div> {/* CONTENT */}
      

      {showAdd && (
        <AddShiftModal
          users={users}
          form={form}
          setForm={setForm}
          createShift={createShift}
          onClose={() => setShowAdd(false)}
        />
      )}

    </div>
  );
}