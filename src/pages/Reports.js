// src/pages/Reports.js
// ELITE PRODUCTION VERSION
// FULL COPY / PASTE READY
// ✅ Trial access kept
// ✅ Charts added
// ✅ Date filters
// ✅ Payroll totals
// ✅ Better exports
// ✅ Search
// ✅ Premium UI
// ✅ Full existing logic kept

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
  PoundSterling,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  LineChart,
  Line,
} from "recharts";

export default function Reports() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const navigate = useNavigate();

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

  const [range, setRange] =
    useState("30");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  /* ACCESS */

  const trialActive =
    user?.trial_end &&
    new Date(user.trial_end) >
      new Date();

  const isPaid =
    user?.isPro === true ||
    user?.subscription_status ===
      "active";

  const hasAccess =
    isPaid || trialActive;

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
          "Failed loading reports"
      );
    } finally {
      setLoading(false);
    }
  }

  function calcHours(
    start,
    end,
    breakSecs = 0
  ) {
    if (!start || !end) return 0;

    return Math.max(
      (new Date(end) -
        new Date(start)) /
        3600000 -
        breakSecs / 3600,
      0
    );
  }

  function inRange(date) {
    if (!date) return false;

    const d = date.split("T")[0];

    if (range === "custom") {
      return (
        (!fromDate ||
          d >= fromDate) &&
        (!toDate ||
          d <= toDate)
      );
    }

    const days =
      Number(range);

    const limit =
      new Date();

    limit.setDate(
      limit.getDate() - days
    );

    return (
      new Date(d) >= limit
    );
  }

  const filtered =
    useMemo(() => {
      return rows.filter((r) => {
        const name =
          (
            r.users?.name ||
            r.name ||
            ""
          ).toLowerCase();

        const email =
          (
            r.users?.email ||
            r.email ||
            ""
          ).toLowerCase();

        const q =
          search.toLowerCase();

        return (
          inRange(
            r.clock_in_time
          ) &&
          (name.includes(q) ||
            email.includes(q))
        );
      });
    }, [
      rows,
      search,
      range,
      fromDate,
      toDate,
    ]);

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

  /* FIX ONLY */
/* Replace totalWages in Reports.js */

const totalWages = filtered
  .reduce((sum, r) => {
    const hrs = calcHours(
      r.clock_in_time,
      r.clock_out_time,
      r.total_break_seconds
    );

    /* pull wage rate from every possible place */
    const rate = Number(
      r.users?.hourly_rate ??
      r.user?.hourly_rate ??
      r.hourly_rate ??
      r.rate ??
      0
    );

    return sum + hrs * rate;
  }, 0)
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

  const chartData =
    Object.values(
      filtered.reduce(
        (acc, row) => {
          const day =
            row.clock_in_time?.split(
              "T"
            )[0];

          const hrs =
            calcHours(
              row.clock_in_time,
              row.clock_out_time,
              row.total_break_seconds
            );

          if (!acc[day]) {
            acc[day] = {
              date: day,
              shifts: 0,
              hours: 0,
            };
          }

          acc[day].shifts += 1;
          acc[day].hours += hrs;

          return acc;
        },
        {}
      )
    );

  function exportCSV() {
    const csv = [
      [
        "Employee",
        "Date",
        "Hours",
        "Wages",
      ],
      ...filtered.map((r) => {
        const hrs =
          calcHours(
            r.clock_in_time,
            r.clock_out_time,
            r.total_break_seconds
          );

        const rate =
          Number(
            r.users
              ?.hourly_rate ||
              0
          );

        return [
          r.users?.name ||
            r.name ||
            "",
          r.clock_in_time?.split(
            "T"
          )[0],
          hrs.toFixed(2),
          (
            hrs * rate
          ).toFixed(2),
        ];
      }),
    ]
      .map((x) =>
        x.join(",")
      )
      .join("\n");

    const blob =
      new Blob([csv], {
        type: "text/csv",
      });

    const url =
      URL.createObjectURL(
        blob
      );

    const a =
      document.createElement(
        "a"
      );

    a.href = url;
    a.download =
      "reports.csv";
    a.click();

    URL.revokeObjectURL(
      url
    );
  }

  if (authLoading)
    return null;

  if (
    !user ||
    user.role !== "admin"
  ) {
    return (
      <Center text="Admins only." />
    );
  }

  if (!hasAccess) {
    return (
      <Center text="Upgrade required." />
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
      <div className="flex justify-between gap-4 flex-wrap">

        <div>
          <h1 className="text-2xl font-semibold">
            Reports
          </h1>

          <p className="text-sm text-gray-400">
            Business analytics
          </p>
        </div>

        <div className="flex gap-2">

          <button
            onClick={loadData}
            className="px-4 py-2 rounded-xl bg-white/5"
          >
            <RefreshCw size={16} />
          </button>

          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-xl bg-indigo-600"
          >
            <Download size={16} />
          </button>

        </div>
      </div>

      {error && (
        <Alert text={error} />
      )}

      {/* FILTERS */}
      <div className="grid md:grid-cols-4 gap-3">

        <select
          value={range}
          onChange={(e) =>
            setRange(
              e.target.value
            )
          }
          className="px-4 py-3 rounded-xl bg-[#020617]"
        >
          <option value="7">
            Last 7 Days
          </option>
          <option value="30">
            Last 30 Days
          </option>
          <option value="90">
            Last 90 Days
          </option>
          <option value="custom">
            Custom
          </option>
        </select>

        {range ===
          "custom" && (
          <>
            <input
              type="date"
              value={fromDate}
              onChange={(e) =>
                setFromDate(
                  e.target.value
                )
              }
              className="px-4 py-3 rounded-xl bg-[#020617]"
            />

            <input
              type="date"
              value={toDate}
              onChange={(e) =>
                setToDate(
                  e.target.value
                )
              }
              className="px-4 py-3 rounded-xl bg-[#020617]"
            />
          </>
        )}

        <div className="relative">
          <Search
            size={16}
            className="absolute left-4 top-4 text-gray-500"
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#020617]"
          />
        </div>

      </div>

      {/* KPI */}
      <div className="grid md:grid-cols-4 gap-4">

        <KPI
          title="Hours"
          value={totalHours}
          icon={<Clock3 size={16} />}
        />

        <KPI
          title="Wages"
          value={`£${totalWages}`}
          icon={
            <PoundSterling size={16} />
          }
        />

        <KPI
          title="Shifts"
          value={
            filtered.length
          }
          icon={
            <CalendarDays size={16} />
          }
        />

        <KPI
          title="Tasks Done"
          value={`${completionRate}%`}
          icon={
            <TrendingUp size={16} />
          }
        />

      </div>

      {/* CHARTS */}
      <div className="grid md:grid-cols-2 gap-4">

        <Card title="Hours Trend">
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart
                data={chartData}
              >
                <XAxis
                  dataKey="date"
                />
                <Tooltip />
                <Line
                  dataKey="hours"
                  stroke="#6366f1"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Shift Volume">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart
                data={chartData}
              >
                <XAxis
                  dataKey="date"
                />
                <Tooltip />
                <Bar
                  dataKey="shifts"
                  fill="#22c55e"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>

      {/* TABLE */}
      <Card title="Recent Records">

        <div className="space-y-2">

          {filtered
            .slice(0, 20)
            .map(
              (
                r,
                i
              ) => {
                const hrs =
                  calcHours(
                    r.clock_in_time,
                    r.clock_out_time,
                    r.total_break_seconds
                  );

                return (
                  <motion.div
                    key={
                      r.id ||
                      i
                    }
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    className="grid md:grid-cols-4 gap-3 bg-white/5 rounded-xl p-3 text-sm"
                  >
                    <span>
                      {r.users
                        ?.name ||
                        "Unknown"}
                    </span>

                    <span>
                      {
                        r.clock_in_time?.split(
                          "T"
                        )[0]
                      }
                    </span>

                    <span>
                      {hrs.toFixed(
                        2
                      )}{" "}
                      hrs
                    </span>

                    <span className="text-green-400">
                      Saved
                    </span>

                  </motion.div>
                );
              }
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
    <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-300 text-sm">
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