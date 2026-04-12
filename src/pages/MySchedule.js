import { useEffect, useState } from "react";
import { scheduleAPI } from "../services/api";
import {
  Calendar,
  Clock3,
} from "lucide-react";

export default function MySchedule() {
  const [rows, setRows] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);

      const data =
        await scheduleAPI.getMine();

      setRows(
        Array.isArray(data)
          ? data
          : []
      );
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString(
      "en-GB",
      {
        weekday:
          "short",
        day: "2-digit",
        month:
          "short",
      }
    );

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString(
      "en-GB",
      {
        hour: "2-digit",
        minute:
          "2-digit",
      }
    );

  if (loading) {
    return (
      <div className="text-gray-400">
        Loading schedule...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-semibold">
          My Schedule
        </h1>

        <p className="text-sm text-gray-400">
          Your upcoming shifts
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">

        <Card
          title="Upcoming"
          value={
            rows.length
          }
          icon={
            <Calendar
              size={16}
            />
          }
        />

        <Card
          title="This Week"
          value={
            rows.slice(
              0,
              7
            ).length
          }
          icon={
            <Clock3
              size={16}
            />
          }
        />

      </div>

      <div className="rounded-2xl border border-white/10 overflow-hidden">

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
            {rows.map(
              (row) => (
                <tr
                  key={
                    row.id
                  }
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
              )
            )}
          </tbody>

        </table>

        {rows.length ===
          0 && (
          <div className="p-6 text-center text-gray-500">
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
    <div className="rounded-2xl border border-white/10 p-5 bg-[#020617]">
      <div className="flex justify-between">
        <p className="text-sm text-gray-400">
          {title}
        </p>

        <div className="text-indigo-400">
          {icon}
        </div>
      </div>

      <h3 className="text-2xl font-semibold mt-3">
        {value}
      </h3>
    </div>
  );
}