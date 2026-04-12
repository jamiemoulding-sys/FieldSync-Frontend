import { useEffect, useState } from "react";
import { holidayAPI } from "../services/api";
import {
  Plane,
  Calendar,
  Send,
} from "lucide-react";

export default function MyHoliday() {
  const [rows, setRows] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [form, setForm] =
    useState({
      start_date: "",
      end_date: "",
      reason: "",
    });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);

      const data =
        await holidayAPI.getMine();

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

  const submit = async (e) => {
    e.preventDefault();

    await holidayAPI.create(
      form
    );

    setForm({
      start_date: "",
      end_date: "",
      reason: "",
    });

    load();
  };

  const badge = (status) => {
    if (
      status ===
      "approved"
    )
      return "bg-green-500/20 text-green-400";

    if (
      status ===
      "rejected"
    )
      return "bg-red-500/20 text-red-400";

    return "bg-yellow-500/20 text-yellow-400";
  };

  if (loading) {
    return (
      <div className="text-gray-400">
        Loading holidays...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-semibold">
          My Holidays
        </h1>

        <p className="text-sm text-gray-400">
          Request time off
        </p>
      </div>

      <form
        onSubmit={submit}
        className="rounded-2xl border border-white/10 p-6 bg-[#020617] space-y-4"
      >

        <div className="grid md:grid-cols-2 gap-4">

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
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3"
            required
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
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3"
            required
          />

        </div>

        <textarea
          placeholder="Reason"
          value={
            form.reason
          }
          onChange={(e) =>
            setForm({
              ...form,
              reason:
                e.target.value,
            })
          }
          className="w-full min-h-[100px] bg-white/5 border border-white/10 rounded-xl px-4 py-3"
        />

        <button
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center gap-2"
        >
          <Send size={16} />
          Submit Request
        </button>

      </form>

      <div className="rounded-2xl border border-white/10 overflow-hidden">

        <table className="w-full text-left">

          <thead className="bg-white/5 text-gray-400 text-sm">
            <tr>
              <th className="p-4">
                Dates
              </th>
              <th className="p-4">
                Reason
              </th>
              <th className="p-4">
                Status
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
                    {row.start_date} →{" "}
                    {row.end_date}
                  </td>

                  <td className="p-4">
                    {row.reason}
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs capitalize ${badge(
                        row.status
                      )}`}
                    >
                      {
                        row.status
                      }
                    </span>
                  </td>
                </tr>
              )
            )}
          </tbody>

        </table>

      </div>

    </div>
  );
}