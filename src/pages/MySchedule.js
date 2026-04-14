// src/pages/MySchedule.jsx
import { useEffect, useMemo, useState } from "react";
import { scheduleAPI } from "../services/api";
import {
  CalendarDays,
  Clock3,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function MySchedule() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);

      const data =
        await scheduleAPI.getMine();

      setRows(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  const thisWeek = useMemo(() => {
    return rows.slice(0, 7).length;
  }, [rows]);

  function formatDate(date) {
    if (!date) return "-";

    return new Date(
      date
    ).toLocaleDateString(
      "en-GB",
      {
        weekday: "short",
        day: "2-digit",
        month: "short",
      }
    );
  }

  function formatTime(date) {
    if (!date) return "-";

    return new Date(
      date
    ).toLocaleTimeString(
      "en-GB",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  if (loading) {
    return (
      <div className="text-gray-400 flex items-center gap-2">
        <Loader2
          size={16}
          className="animate-spin"
        />
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
            My Schedule
          </h1>

          <p className="text-sm text-gray-400">
            Upcoming assigned shifts
          </p>
        </div>

        <button
          onClick={load}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-2"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-3 gap-4">

        <Card
          title="Upcoming"
          value={rows.length}
          icon={
            <CalendarDays size={16} />
          }
        />

        <Card
          title="This Week"
          value={thisWeek}
          icon={
            <Clock3 size={16} />
          }
        />

        <Card
          title="Next Shift"
          value={
            rows[0]
              ? formatDate(
                  rows[0].date
                )
              : "-"
          }
          icon={
            <CalendarDays size={16} />
          }
        />

      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#020617]">

        <table className="w-full text-left">
          <thead className="bg-white/5 text-gray-400 text-sm">
            <tr>
              <th className="p-4">
                Date
              </th>
              <th className="p-4">
                Start
              </th>
              <th className="p-4">
                End
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-t border-white/5"
              >
                <td className="p-4">
                  {formatDate(
                    row.date
                  )}
                </td>

                <td className="p-4">
                  {formatTime(
                    row.start_time
                  )}
                </td>

                <td className="p-4">
                  {formatTime(
                    row.end_time
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No shifts assigned
          </div>
        )}
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  icon,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#020617] p-5">
      <div className="flex justify-between">
        <p className="text-sm text-gray-400">
          {title}
        </p>

        <div className="text-indigo-400">
          {icon}
        </div>
      </div>

      <h2 className="text-2xl font-semibold mt-3">
        {value}
      </h2>
    </div>
  );
}