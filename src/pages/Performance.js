// src/pages/Performance.js
// FULL PREMIUM PERFORMANCE REPLACEMENT
// ✅ Real live data only
// ✅ No demo metrics
// ✅ Uses existing performanceAPI.getAll()
// ✅ Lateness / hours / consistency / rankings
// ✅ Useful management insights
// ✅ Premium UI
// ✅ Full copy / paste ready

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { performanceAPI } from "../services/api";
import { motion } from "framer-motion";

import {
  Trophy,
  Clock3,
  Search,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Star,
  Medal,
  TimerReset,
  Users,
  TrendingUp,
  Briefcase,
} from "lucide-react";

export default function Performance() {
  const [data, setData] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [sortBy, setSortBy] =
    useState("score");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);

      const res =
        await performanceAPI.getAll();

      setData(
        Array.isArray(res)
          ? res
          : []
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const rows = useMemo(() => {
    let list = [...data];

    if (search.trim()) {
      const q =
        search.toLowerCase();

      list = list.filter(
        (x) =>
          x.name
            ?.toLowerCase()
            .includes(q) ||
          x.email
            ?.toLowerCase()
            .includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === "hours") {
        return (
          getHours(b) -
          getHours(a)
        );
      }

      if (sortBy === "lateness") {
        return (
          getLateCount(b) -
          getLateCount(a)
        );
      }

      if (sortBy === "shifts") {
        return (
          getShifts(b) -
          getShifts(a)
        );
      }

      return (
        getScore(b) -
        getScore(a)
      );
    });

    return list;
  }, [data, search, sortBy]);

  const top =
    rows[0] || null;

  const totalHours =
    rows.reduce(
      (sum, x) =>
        sum +
        getHours(x),
      0
    );

  const avgHours =
    rows.length
      ? (
          totalHours /
          rows.length
        ).toFixed(1)
      : "0";

  const totalLate =
    rows.reduce(
      (sum, x) =>
        sum +
        getLateCount(x),
      0
    );

  const avgScore =
    rows.length
      ? Math.round(
          rows.reduce(
            (sum, x) =>
              sum +
              getScore(x),
            0
          ) / rows.length
        )
      : 0;

  const lowPerformers =
    rows.filter(
      (x) =>
        getScore(x) < 55
    ).length;

  const insights = [];

  if (top) {
    insights.push(
      `${top.name ||
        "Top Employee"} leads performance this period`
    );
  }

  if (totalLate > 0) {
    insights.push(
      `${totalLate} late arrivals recorded`
    );
  }

  if (
    Number(avgHours) > 42
  ) {
    insights.push(
      "Average hours are high — check burnout risk"
    );
  }

  if (
    lowPerformers > 0
  ) {
    insights.push(
      `${lowPerformers} team members need review`
    );
  }

  if (!insights.length) {
    insights.push(
      "Team performance looks strong"
    );
  }

  if (loading) {
    return (
      <Center
        text="Loading performance..."
        loading
      />
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex justify-between items-center flex-wrap gap-4">

        <div>
          <h1 className="text-3xl font-semibold">
            Performance
          </h1>

          <p className="text-sm text-gray-400">
            Staff output, reliability & workforce rankings
          </p>
        </div>

        <button
          onClick={load}
          className="px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Refresh
        </button>

      </div>

      {/* HERO */}

      {top && (
        <div className="rounded-3xl p-[1px] bg-gradient-to-r from-yellow-500/30 via-indigo-500/20 to-transparent">
          <div className="rounded-3xl bg-[#020617] border border-white/10 p-6">

            <div className="flex justify-between gap-4 flex-wrap items-center">

              <div className="flex items-center gap-4">

                <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                  <Trophy size={24} />
                </div>

                <div>
                  <p className="text-sm text-gray-400">
                    Top Performer
                  </p>

                  <h2 className="text-xl font-semibold">
                    {top.name ||
                      top.email}
                  </h2>

                  <p className="text-sm text-gray-400 mt-1">
                    {getShifts(top)} shifts •{" "}
                    {getHours(top).toFixed(
                      1
                    )} hrs
                  </p>
                </div>

              </div>

              <div className="text-right">
                <p className="text-xs text-gray-400">
                  Performance Score
                </p>

                <p className="text-4xl font-semibold text-yellow-400">
                  {getScore(top)}%
                </p>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* KPI */}

      <div className="grid md:grid-cols-4 gap-4">

        <KPI
          title="Employees"
          value={rows.length}
          icon={
            <Users size={16} />
          }
        />

        <KPI
          title="Average Score"
          value={`${avgScore}%`}
          icon={
            <Star size={16} />
          }
        />

        <KPI
          title="Avg Hours"
          value={avgHours}
          icon={
            <Clock3 size={16} />
          }
        />

        <KPI
          title="Late Arrivals"
          value={totalLate}
          icon={
            <TimerReset size={16} />
          }
        />

      </div>

      {/* INSIGHTS */}

      <div className="grid md:grid-cols-4 gap-4">

        {insights.map(
          (item, i) => (
            <div
              key={i}
              className="rounded-2xl bg-[#020617] border border-white/10 p-4 text-sm text-indigo-300"
            >
              {item}
            </div>
          )
        )}

      </div>

      {/* SEARCH */}

      <div className="grid md:grid-cols-2 gap-3">

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
            placeholder="Search employee..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#020617] border border-white/10"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(
              e.target.value
            )
          }
          className="px-4 py-3 rounded-2xl bg-[#020617] border border-white/10"
        >
          <option value="score">
            Sort by Score
          </option>

          <option value="hours">
            Sort by Hours
          </option>

          <option value="shifts">
            Sort by Shifts
          </option>

          <option value="lateness">
            Sort by Lateness
          </option>
        </select>

      </div>

      {/* STAFF GRID */}

      <div className="grid md:grid-cols-3 gap-4">

        {rows.map(
          (item, i) => {
            const score =
              getScore(item);

            const risk =
              score < 55;

            return (
              <motion.div
                key={item.id}
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay:
                    i * 0.02,
                }}
                className="rounded-3xl p-[1px] bg-gradient-to-b from-white/10 to-transparent"
              >
                <div className="rounded-3xl bg-[#020617] border border-white/10 p-5">

                  <div className="flex justify-between">

                    <div>
                      <p className="font-medium">
                        {item.name ||
                          item.email}
                      </p>

                      <p className="text-xs text-gray-400">
                        Team Member
                      </p>
                    </div>

                    {i === 0 && (
                      <Medal
                        size={18}
                        className="text-yellow-400"
                      />
                    )}

                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">

                    <Stat
                      label="Hours"
                      value={getHours(
                        item
                      ).toFixed(1)}
                    />

                    <Stat
                      label="Shifts"
                      value={getShifts(
                        item
                      )}
                    />

                    <Stat
                      label="Late"
                      value={getLateCount(
                        item
                      )}
                    />

                    <Stat
                      label="Avg Shift"
                      value={getAvgShift(
                        item
                      )}
                    />

                  </div>

                  <div className="mt-4">

                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-400">
                        Score
                      </span>

                      <span>
                        {score}%
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">

                      <div
                        className={`h-full ${
                          risk
                            ? "bg-red-500"
                            : "bg-indigo-500"
                        }`}
                        style={{
                          width: `${score}%`,
                        }}
                      />

                    </div>

                  </div>

                </div>
              </motion.div>
            );
          }
        )}

      </div>

    </div>
  );
}

/* HELPERS */

function getHours(x) {
  return Number(
    x.hours_worked || 0
  );
}

function getShifts(x) {
  return Number(
    x.total_shifts || 0
  );
}

function getLateCount(x) {
  return Number(
    x.late_count ||
      x.lateness ||
      x.total_late ||
      0
  );
}

function getAvgShift(x) {
  const shifts =
    getShifts(x);

  if (!shifts) return "0";

  return (
    getHours(x) / shifts
  ).toFixed(1);
}

function getScore(x) {
  const hours =
    getHours(x);

  const shifts =
    getShifts(x);

  const late =
    getLateCount(x);

  let score =
    shifts * 8 +
    hours * 1.8 -
    late * 6;

  score = Math.max(
    0,
    Math.min(
      100,
      Math.round(score)
    )
  );

  return score;
}

/* UI */

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

function Stat({
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-white/5 p-3 text-center">
      <p className="text-xs text-gray-400">
        {label}
      </p>

      <p className="text-sm font-semibold mt-1">
        {value}
      </p>
    </div>
  );
}

function Center({
  text,
  loading,
}) {
  return (
    <div className="h-[60vh] flex items-center justify-center gap-2 text-gray-400">
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