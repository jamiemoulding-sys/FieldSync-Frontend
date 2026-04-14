// src/pages/Reports.js
// FINAL 100% PRODUCTION VERSION
// real data only / safer / cleaner / no fake stats

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { reportAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import {
  BarChart3,
  Users,
  CalendarDays,
  TrendingUp,
  Crown,
  AlertCircle,
  RefreshCw,
  Download,
  Search,
  Loader2,
  Clock3,
} from "lucide-react";

export default function Reports() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const navigate =
    useNavigate();

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [summary, setSummary] =
    useState({});

  const [rows, setRows] =
    useState([]);

  const isPaid =
    user?.isPro === true ||
    user?.subscription_status ===
      "active";

  useEffect(() => {
    if (authLoading) return;

    if (user?.role === "admin") {
      loadData();
    } else {
      setLoading(false);
    }
  }, [authLoading, user]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        summaryData,
        sheetData,
      ] = await Promise.all([
        reportAPI.getSummary(),
        reportAPI.getTimesheets(),
      ]);

      setSummary(
        summaryData || {}
      );

      setRows(
        Array.isArray(sheetData)
          ? sheetData
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Failed to load reports"
      );
    } finally {
      setLoading(false);
    }
  }

  const filtered =
    useMemo(() => {
      let data = [...rows];

      if (search.trim()) {
        const q =
          search.toLowerCase();

        data = data.filter(
          (r) =>
            (
              r.users?.name ||
              r.name ||
              ""
            )
              .toLowerCase()
              .includes(q) ||
            (
              r.users?.email ||
              r.email ||
              ""
            )
              .toLowerCase()
              .includes(q)
        );
      }

      return data;
    }, [rows, search]);

  function calcHours(
    start,
    end,
    breakSecs = 0
  ) {
    if (!start || !end) return 0;

    const hrs =
      (new Date(end) -
        new Date(start)) /
        3600000 -
      breakSecs / 3600;

    return Math.max(hrs, 0);
  }

  const totalHours =
    filtered
      .reduce(
        (sum, r) =>
          sum +
          calcHours(
            r.clock_in_time,
            r.clock_out_time,
            r.total_break_seconds
          ),
        0
      )
      .toFixed(2);

  const completionRate =
    summary?.tasks > 0
      ? Math.round(
          ((summary.completedTasks ||
            0) /
            summary.tasks) *
            100
        )
      : 0;

  const activeRate =
    summary?.users > 0
      ? Math.round(
          ((summary.activeUsers ||
            0) /
            summary.users) *
            100
        )
      : 0;

  function exportCSV() {
    const csv = [
      [
        "Employee",
        "Date",
        "Clock In",
        "Clock Out",
        "Hours",
      ],
      ...filtered.map((r) => [
        r.users?.name ||
          r.name ||
          "",
        r.clock_in_time?.split(
          "T"
        )[0] || "",
        r.clock_in_time || "",
        r.clock_out_time || "",
        calcHours(
          r.clock_in_time,
          r.clock_out_time,
          r.total_break_seconds
        ).toFixed(2),
      ]),
    ]
      .map((x) => x.join(","))
      .join("\n");

    const blob = new Blob(
      [csv],
      {
        type: "text/csv",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement(
        "a"
      );

    a.href = url;
    a.download =
      "reports.csv";
    a.click();

    URL.revokeObjectURL(url);
  }

  if (authLoading) return null;

  if (!user || user.role !== "admin") {
    return (
      <Center text="Admins only." />
    );
  }

  if (!isPaid) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="max-w-md w-full rounded-3xl border border-white/10 bg-[#020617] p-8 text-center">

          <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mx-auto mb-5">
            <Crown size={26} />
          </div>

          <h1 className="text-2xl font-semibold">
            Upgrade Required
          </h1>

          <p className="text-sm text-gray-400 mt-3">
            Reports are
            available on paid
            plans.
          </p>

          <button
            onClick={() =>
              navigate(
                "/billing"
              )
            }
            className="mt-6 w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500"
          >
            View Plans
          </button>

        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <Center
        loading
        text="Loading reports..."
      />
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between gap-4 flex-wrap items-center">

        <div>
          <h1 className="text-2xl font-semibold">
            Reports
          </h1>

          <p className="text-sm text-gray-400">
            Real business
            analytics
          </p>
        </div>

        <div className="flex gap-2">

          <button
            onClick={loadData}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-2"
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2"
          >
            <Download size={15} />
            Export
          </button>

        </div>
      </div>

      {error && (
        <Alert text={error} />
      )}

      {/* KPI */}
      <div className="grid md:grid-cols-4 gap-4">

        <KPI
          title="Employees"
          value={
            summary.users || 0
          }
          icon={<Users size={16} />}
        />

        <KPI
          title="Shifts"
          value={
            summary.totalShifts ||
            filtered.length
          }
          icon={
            <CalendarDays
              size={16}
            />
          }
        />

        <KPI
          title="Hours"
          value={totalHours}
          icon={<Clock3 size={16} />}
        />

        <KPI
          title="Tasks Done"
          value={`${completionRate}%`}
          icon={
            <TrendingUp
              size={16}
            />
          }
        />

      </div>

      {/* EXTRA */}
      <div className="grid md:grid-cols-2 gap-4">

        <Card title="Live Staff Rate">
          <div className="text-4xl font-semibold">
            {activeRate}%
          </div>

          <p className="text-sm text-gray-400 mt-2">
            Currently clocked
            in staff
          </p>
        </Card>

        <Card title="Open Tasks">
          <div className="text-4xl font-semibold">
            {(summary.tasks ||
              0) -
              (summary.completedTasks ||
                0)}
          </div>

          <p className="text-sm text-gray-400 mt-2">
            Remaining tasks
          </p>
        </Card>

      </div>

      {/* SEARCH */}
      <Card title="Timesheets">

        <div className="relative mb-4">

          <Search
            size={16}
            className="absolute left-4 top-3.5 text-gray-500"
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search employee..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3"
          />

        </div>

        <div className="space-y-2">

          {filtered.length ===
          0 ? (
            <p className="text-sm text-gray-500">
              No records found
            </p>
          ) : (
            filtered.map(
              (r, i) => {
                const hrs =
                  calcHours(
                    r.clock_in_time,
                    r.clock_out_time,
                    r.total_break_seconds
                  );

                return (
                  <motion.div
                    key={
                      r.id || i
                    }
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    className="grid md:grid-cols-5 gap-3 bg-white/5 rounded-xl p-3 text-sm"
                  >
                    <span>
                      {r.users
                        ?.name ||
                        r.name ||
                        "Unknown"}
                    </span>

                    <span>
                      {r.clock_in_time?.split(
                        "T"
                      )[0] ||
                        "-"}
                    </span>

                    <span>
                      {hrs.toFixed(
                        2
                      )}{" "}
                      hrs
                    </span>

                    <span>
                      {r.clock_out_time
                        ? "Closed"
                        : "Open"}
                    </span>

                    <span className="text-green-400">
                      Saved
                    </span>
                  </motion.div>
                );
              }
            )
          )}

        </div>

      </Card>

    </div>
  );
}

/* COMPONENTS */

function KPI({
  title,
  value,
  icon,
}) {
  return (
    <div className="rounded-2xl bg-[#020617] border border-white/10 p-5">
      <div className="flex justify-between">
        <p className="text-xs text-gray-400">
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

function Card({
  title,
  children,
}) {
  return (
    <div className="rounded-2xl bg-[#020617] border border-white/10 p-5">
      <h3 className="text-sm text-gray-400 mb-4">
        {title}
      </h3>

      {children}
    </div>
  );
}

function Alert({
  text,
}) {
  return (
    <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-300 text-sm flex gap-2">
      <AlertCircle size={16} />
      {text}
    </div>
  );
}

function Center({
  text,
  loading,
}) {
  return (
    <div className="h-[60vh] flex items-center justify-center text-gray-400 gap-2">
      {loading && (
        <Loader2
          size={16}
          className="animate-spin"
        />
      )}
      {text}
    </div>
  );
}