import { useEffect, useState } from "react";
import { holidayAPI, scheduleAPI } from "../services/api";
import { motion } from "framer-motion";

import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock3,
  ChevronLeft,
  ChevronRight,
  Plus,
  HeartPulse,
  AlertTriangle,
  Trash2,
  User,
} from "lucide-react";

export default function HolidayRequests() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    type: "holiday",
    start_date: "",
    end_date: "",
    status: "approved",
  });

  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(
    new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    )
  );

  useEffect(() => {
    load();

    const timer = setInterval(() => {
      load(false);
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  async function load(showLoader = true) {
    try {
      if (showLoader) setLoading(true);

      const data =
        await holidayAPI.getAll();

      setRequests(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(
    id,
    status
  ) {
    try {
      if (status === "approved") {
        await holidayAPI.approve(id);
      } else {
        await holidayAPI.reject(id);
      }

      await load(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update");
    }
  }

  async function deleteLeave(id) {
    if (
      !window.confirm(
        "Delete this leave request?"
      )
    )
      return;

    try {
      await holidayAPI.delete(id);
      await load(false);
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  }

  async function createLeave() {
    if (
      !form.name ||
      !form.start_date ||
      !form.end_date
    ) {
      return alert(
        "Fill all fields"
      );
    }

    try {
      await holidayAPI.create(form);

      try {
        const rota =
          await scheduleAPI.getAll();

        const clashes =
          rota.filter((s) => {
            if (
              s.name !== form.name
            )
              return false;

            return (
              s.date >=
                form.start_date &&
              s.date <=
                form.end_date
            );
          });

        for (const row of clashes) {
          await scheduleAPI.delete(
            row.id
          );
        }
      } catch {}

      setOpenModal(false);

      setForm({
        name: "",
        type: "holiday",
        start_date: "",
        end_date: "",
        status: "approved",
      });

      await load(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save");
    }
  }

  const filtered =
    requests.filter((r) => {
      if (filter === "all")
        return true;

      return (
        r.status === filter
      );
    });

  const pending =
    requests.filter(
      (r) =>
        r.status ===
        "pending"
    ).length;

  const approved =
    requests.filter(
      (r) =>
        r.status ===
        "approved"
    ).length;

  const rejected =
    requests.filter(
      (r) =>
        r.status ===
        "rejected"
    ).length;

  const endOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  );

  const days = [];

  for (
    let i = 1;
    i <= endOfMonth.getDate();
    i++
  ) {
    days.push(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        i
      )
    );
  }

  function getRequestsForDay(
    day
  ) {
    return filtered.filter(
      (r) => {
        const start =
          new Date(
            r.start_date +
              "T00:00:00"
          );

        const end =
          new Date(
            r.end_date +
              "T23:59:59"
          );

        return (
          day >= start &&
          day <= end
        );
      }
    );
  }

  function changeMonth(dir) {
    const next =
      new Date(
        currentMonth
      );

    next.setMonth(
      next.getMonth() +
        dir
    );

    setCurrentMonth(next);
  }

  function getTypeStyle(
    type
  ) {
    if (
      type ===
      "sickness"
    )
      return "bg-red-500/20 text-red-300";

    if (
      type ===
      "unauthorised"
    )
      return "bg-orange-500/20 text-orange-300";

    return "bg-blue-500/20 text-blue-300";
  }

  function getTypeIcon(
    type
  ) {
    if (
      type ===
      "sickness"
    ) {
      return (
        <HeartPulse
          size={12}
        />
      );
    }

    if (
      type ===
      "unauthorised"
    ) {
      return (
        <AlertTriangle
          size={12}
        />
      );
    }

    return (
      <CalendarDays
        size={12}
      />
    );
  }

  if (loading) {
    return (
      <div className="text-gray-400">
        Loading leave
        requests...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold">
            Leave Manager
          </h1>

          <p className="text-sm text-gray-400">
            Holidays,
            sickness &
            absences
          </p>
        </div>

        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) =>
              setFilter(
                e.target.value
              )
            }
            className="bg-[#0f172a] border border-white/10 rounded-xl px-4 py-2"
          >
            <option value="all">
              All
            </option>
            <option value="pending">
              Pending
            </option>
            <option value="approved">
              Approved
            </option>
            <option value="rejected">
              Rejected
            </option>
          </select>

          <button
            onClick={() =>
              setOpenModal(
                true
              )
            }
            className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <Plus size={16} />
            Add Leave
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-4 gap-4">
        <StatCard
          title="Total"
          value={
            requests.length
          }
          icon={
            <CalendarDays
              size={16}
            />
          }
        />

        <StatCard
          title="Pending"
          value={pending}
          icon={
            <Clock3
              size={16}
            />
          }
        />

        <StatCard
          title="Approved"
          value={approved}
          icon={
            <CheckCircle2
              size={16}
            />
          }
        />

        <StatCard
          title="Rejected"
          value={rejected}
          icon={
            <XCircle
              size={16}
            />
          }
        />
      </div>

      {/* CALENDAR */}
      <div className="rounded-2xl border border-white/10 bg-[#020617] p-5">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() =>
              changeMonth(-1)
            }
            className="p-2 rounded-xl bg-[#0f172a]"
          >
            <ChevronLeft size={16} />
          </button>

          <h2 className="font-semibold text-lg">
            {currentMonth.toLocaleString(
              "default",
              {
                month:
                  "long",
              }
            )}{" "}
            {currentMonth.getFullYear()}
          </h2>

          <button
            onClick={() =>
              changeMonth(1)
            }
            className="p-2 rounded-xl bg-[#0f172a]"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const items =
              getRequestsForDay(
                day
              );

            return (
              <div
                key={day}
                className="rounded-xl bg-[#0f172a] p-2 min-h-[120px]"
              >
                <div className="text-xs text-gray-400 mb-2">
                  {day.getDate()}
                </div>

                <div className="space-y-1">
                  {items
                    .slice(
                      0,
                      3
                    )
                    .map(
                      (
                        item
                      ) => (
                        <div
                          key={
                            item.id
                          }
                          className={`text-[10px] px-2 py-1 rounded flex items-center gap-1 ${getTypeStyle(
                            item.type
                          )}`}
                          title={`${item.name} - ${item.status}`}
                        >
                          {getTypeIcon(
                            item.type
                          )}
                          <span className="truncate">
                            {
                              item.name
                            }
                          </span>
                        </div>
                      )
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#020617]">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-gray-400">
            <tr>
              <th className="p-4 text-left">
                Employee
              </th>
              <th className="p-4 text-left">
                Type
              </th>
              <th className="p-4 text-left">
                Dates
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
              (
                r,
                i
              ) => (
                <motion.tr
                  key={r.id}
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay:
                      i *
                      0.02,
                  }}
                  className="border-t border-white/5"
                >
                  <td className="p-4 font-medium">
                    <div className="flex items-center gap-2">
                      <User size={14} />
                      {r.name}
                    </div>
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs capitalize ${getTypeStyle(
                        r.type
                      )}`}
                    >
                      {r.type}
                    </span>
                  </td>

                  <td className="p-4 text-gray-400">
                    {format(
                      r.start_date
                    )}{" "}
                    →{" "}
                    {format(
                      r.end_date
                    )}
                  </td>

                  <td className="p-4">
                    <Badge
                      status={
                        r.status
                      }
                    />
                  </td>

                  <td className="p-4">
                    <div className="flex gap-2 flex-wrap">
                      {r.status ===
                        "pending" && (
                        <>
                          <button
                            onClick={() =>
                              updateStatus(
                                r.id,
                                "approved"
                              )
                            }
                            className="px-3 py-1 rounded-lg bg-green-600 text-xs"
                          >
                            Approve
                          </button>

                          <button
                            onClick={() =>
                              updateStatus(
                                r.id,
                                "rejected"
                              )
                            }
                            className="px-3 py-1 rounded-lg bg-red-600 text-xs"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      <button
                        onClick={() =>
                          deleteLeave(
                            r.id
                          )
                        }
                        className="px-3 py-1 rounded-lg bg-gray-700 text-xs flex items-center gap-1"
                      >
                        <Trash2
                          size={
                            12
                          }
                        />
                        Delete
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#020617] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-xl font-semibold">
              Add Leave
            </h2>

            <input
              placeholder="Employee Name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name:
                    e.target.value,
                })
              }
              className="w-full px-4 py-3 rounded-xl bg-[#0f172a]"
            />

            <select
              value={form.type}
              onChange={(e) =>
                setForm({
                  ...form,
                  type:
                    e.target.value,
                })
              }
              className="w-full px-4 py-3 rounded-xl bg-[#0f172a]"
            >
              <option value="holiday">
                Holiday
              </option>
              <option value="sickness">
                Sickness
              </option>
              <option value="unauthorised">
                Unauthorised
              </option>
            </select>

            <input
              type="date"
              value={
                form.start_date
              }
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
              value={
                form.end_date
              }
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
                onClick={
                  createLeave
                }
                className="bg-indigo-600 rounded-xl py-3"
              >
                Save
              </button>

              <button
                onClick={() =>
                  setOpenModal(
                    false
                  )
                }
                className="bg-gray-700 rounded-xl py-3"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function format(date) {
  return new Date(
    date
  ).toLocaleDateString(
    "en-GB"
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