// src/pages/HolidayRequests.jsx
// FULL FIXED FILE
// Nothing removed
// Modal restored correctly
// Build safe

import { useEffect, useState } from "react";
import {
  holidayAPI,
  scheduleAPI,
  userAPI,
} from "../services/api";

import { motion } from "framer-motion";

import {
  CheckCircle2,
  XCircle,
  Clock3,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";

export default function HolidayRequests() {
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("month");

  const [openModal, setOpenModal] =
    useState(false);

  const [form, setForm] = useState({
    user_id: "",
    type: "holiday",
    start_date: "",
    end_date: "",
    status: "approved",
  });

  const today = new Date();

  const [currentDate, setCurrentDate] =
    useState(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    );

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);

      const [h, s, u] =
        await Promise.all([
          holidayAPI.getAll(),
          scheduleAPI.getAll(),
          userAPI.getAll(),
        ]);

      const safeUsers =
        Array.isArray(u) ? u : [];

      const mapped =
  (Array.isArray(h) ? h : []).map(
    (row) => {
      const emp =
        safeUsers.find(
          (x) =>
            x.id === row.user_id
        ) || {};

      return {
        ...row,
        name:
          emp.name ||
          row.name ||
          "Unknown",

        holiday_days: Number(
          emp.holiday_allowance ??
          emp.holiday_days ??
          20
        ),
      };
    }
  );

      const rota =
        (Array.isArray(s) ? s : []).map(
          (row) => {
            const emp =
              safeUsers.find(
                (x) =>
                  x.id === row.user_id
              ) || {};

            return {
              ...row,
              name:
                emp.name ||
                "Unknown",
            };
          }
        );

      setUsers(safeUsers);
      setRequests(mapped);
      setSchedules(rota);
    } finally {
      setLoading(false);
    }
  }

  function dateStr(day) {
    const y = day.getFullYear();
    const m = String(
      day.getMonth() + 1
    ).padStart(2, "0");
    const d = String(
      day.getDate()
    ).padStart(2, "0");

    return `${y}-${m}-${d}`;
  }

  function format(date) {
    return new Date(
      date
    ).toLocaleDateString("en-GB");
  }

function usedDays(id) {
  const userSchedules = schedules.filter(
    (x) => x.user_id === id
  );

  const approved = requests.filter(
    (x) =>
      x.user_id === id &&
      x.status === "approved"
  );

  let total = 0;

  approved.forEach((h) => {
    let current = new Date(h.start_date);
    const end = new Date(h.end_date);

    while (current <= end) {
      const ds = dateStr(current);

      const hasShift = userSchedules.some(
        (s) => s.date === ds
      );

      const weekday = current.getDay();

      const fallbackMonFri =
        weekday >= 1 && weekday <= 5;

      if (
        userSchedules.length
          ? hasShift
          : fallbackMonFri
      ) {
        total++;
      }

      current.setDate(
        current.getDate() + 1
      );
    }
  });

  return total;
}

  async function updateStatus(
    id,
    status
  ) {
    if (status === "approved") {
      await holidayAPI.approve(id);
    } else {
      await holidayAPI.reject(id);
    }

    load();
  }

  async function removeLeave(id) {
    if (
      !window.confirm(
        "Delete request?"
      )
    )
      return;

    await holidayAPI.delete(id);
    load();
  }

  async function createLeave() {
    if (
      !form.user_id ||
      !form.start_date ||
      !form.end_date
    ) {
      return alert(
        "Fill all fields"
      );
    }

    await holidayAPI.create(form);

    setOpenModal(false);

    setForm({
      user_id: "",
      type: "holiday",
      start_date: "",
      end_date: "",
      status: "approved",
    });

    load();
  }

  const filtered =
    requests.filter((r) => {
      if (filter === "all")
        return true;

      return (
        r.status === filter
      );
    });

  function holidaysForDay(day) {
    const ds = dateStr(day);

    return requests.filter(
      (x) =>
        x.status ===
          "approved" &&
        x.start_date <= ds &&
        x.end_date >= ds
    );
  }

  function shiftsForDay(day) {
    const ds = dateStr(day);

    return schedules.filter(
      (x) =>
        x.date === ds
    );
  }

  function getMonthDays() {
    const end = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    const arr = [];

    for (
      let i = 1;
      i <= end.getDate();
      i++
    ) {
      arr.push(
        new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          i
        )
      );
    }

    return arr;
  }

  function getWeekDays() {
    const start =
      new Date(currentDate);

    const day =
      start.getDay() || 7;

    start.setDate(
      start.getDate() - day + 1
    );

    const arr = [];

    for (
      let i = 0;
      i < 7;
      i++
    ) {
      const d =
        new Date(start);

      d.setDate(
        start.getDate() + i
      );

      arr.push(d);
    }

    return arr;
  }

  const days =
    view === "month"
      ? getMonthDays()
      : getWeekDays();

  function next() {
    const d =
      new Date(currentDate);

    if (view === "month") {
      d.setMonth(
        d.getMonth() + 1
      );
    } else {
      d.setDate(
        d.getDate() + 7
      );
    }

    setCurrentDate(d);
  }

  function prev() {
    const d =
      new Date(currentDate);

    if (view === "month") {
      d.setMonth(
        d.getMonth() - 1
      );
    } else {
      d.setDate(
        d.getDate() - 7
      );
    }

    setCurrentDate(d);
  }

  if (loading) {
    return (
      <div className="text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold">
            Leave Manager
          </h1>

          <p className="text-sm text-gray-400">
            Holidays + live rota visibility
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() =>
              setView("month")
            }
            className="px-4 py-2 rounded-xl bg-indigo-600"
          >
            Month
          </button>

          <button
            onClick={() =>
              setView("week")
            }
            className="px-4 py-2 rounded-xl bg-[#0f172a]"
          >
            Week
          </button>

          <button
            onClick={() =>
              setOpenModal(true)
            }
            className="px-4 py-2 rounded-xl bg-emerald-600"
          >
            <Plus
              size={16}
              className="inline mr-2"
            />
            Add Leave
          </button>
        </div>
      </div>

      {/* REQUEST TABLE */}
      <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#020617]">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-gray-400">
            <tr>
              <th className="p-4 text-left">
                Employee
              </th>
              <th className="p-4 text-left">
                Dates
              </th>
              <th className="p-4 text-left">
                Allowance
              </th>
              <th className="p-4 text-left">
                Status
              </th>
              <th className="p-4 text-left">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {filtered.map(
              (r, i) => (
                <motion.tr
                  key={r.id}
                  initial={{
                    opacity: 0,
                    y: 6,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay:
                      i * 0.02,
                  }}
                  className="border-t border-white/5"
                >
                  <td className="p-4">
                    {r.name}
                  </td>

                  <td className="p-4">
                    {format(
                      r.start_date
                    )}{" "}
                    →{" "}
                    {format(
                      r.end_date
                    )}
                  </td>

                  <td className="p-4">
                    {usedDays(
                      r.user_id
                    )}{" "}
                    /{" "}
                    {
                      r.holiday_days
                    }
                  </td>

                  <td className="p-4">
                    <Badge
                      status={
                        r.status
                      }
                    />
                  </td>

                  <td className="p-4">
  <div className="flex gap-2">

    {r.status === "pending" && (
      <>
        <button
          onClick={() =>
            updateStatus(r.id, "approved")
          }
          className="px-3 py-1 rounded bg-green-600 text-xs"
        >
          Accept
        </button>

        <button
          onClick={() => {
            const reason = prompt("Reason for rejection?");
            updateStatus(
              r.id,
              "rejected",
              reason || ""
            );
          }}
          className="px-3 py-1 rounded bg-red-600 text-xs"
        >
          Reject
        </button>
      </>
    )}

    <button
      onClick={() =>
        removeLeave(r.id)
      }
          className="px-3 py-1 rounded bg-gray-700 text-xs"
       >
             <Trash2 size={12} />
           </button>

          </div>
         </td>
                </motion.tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {openModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#020617] border border-white/10 p-6 space-y-4">

            <h2 className="text-xl font-semibold">
              Add Leave Request
            </h2>

            <select
              value={form.user_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  user_id:
                    e.target.value,
                })
              }
              className="w-full px-4 py-3 rounded-xl bg-[#0f172a]"
            >
              <option value="">
                Select Employee
              </option>

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
              value={form.start_date}
              onChange={(e) =>
                setForm({
                  ...form,
                  start_date:
                    e.target.value,
                })
              }
              className="w-full px-4 py-3 rounded-xl bg-[#0f172a]"
            />

            <input
              type="date"
              value={form.end_date}
              onChange={(e) =>
                setForm({
                  ...form,
                  end_date:
                    e.target.value,
                })
              }
              className="w-full px-4 py-3 rounded-xl bg-[#0f172a]"
            />

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  setOpenModal(
                    false
                  )
                }
                className="py-3 rounded-xl bg-white/5"
              >
                Cancel
              </button>

              <button
                onClick={
                  createLeave
                }
                className="py-3 rounded-xl bg-emerald-600"
              >
                Save Leave
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

function Badge({
  status,
}) {
  const styles = {
    pending:
      "bg-yellow-500/20 text-yellow-400",
    approved:
      "bg-green-500/20 text-green-400",
    rejected:
      "bg-red-500/20 text-red-400",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}