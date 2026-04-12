import { useEffect, useState } from "react";
import {
  shiftAPI,
  scheduleAPI,
  holidayAPI,
} from "../services/api";

import {
  Clock3,
  CalendarDays,
  Plane,
  CheckCircle2,
} from "lucide-react";

export default function Dashboard() {
  const [activeShift, setActiveShift] =
    useState(null);

  const [schedule, setSchedule] =
    useState([]);

  const [holidays, setHolidays] =
    useState([]);

  const [worked, setWorked] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let timer;

    if (activeShift?.clock_in_time) {
      timer = setInterval(() => {
        const start = new Date(
          activeShift.clock_in_time
        ).getTime();

        const now = Date.now();

        const sec = Math.floor(
          (now - start) / 1000
        );

        setWorked(sec);
      }, 1000);
    }

    return () =>
      clearInterval(timer);
  }, [activeShift]);

  const load = async () => {
    try {
      setLoading(true);

      const [
        shift,
        mySchedule,
        myHoliday,
      ] = await Promise.all([
        shiftAPI.getActive(),
        scheduleAPI.getMine(),
        holidayAPI.getMine(),
      ]);

      setActiveShift(shift);
      setSchedule(mySchedule || []);
      setHolidays(myHoliday || []);
    } finally {
      setLoading(false);
    }
  };

  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  const todayShift =
    schedule.find(
      (s) => s.date === today
    );

  const pending =
    holidays.filter(
      (h) =>
        h.status ===
        "pending"
    ).length;

  const approved =
    holidays.filter(
      (h) =>
        h.status ===
        "approved"
    ).length;

  const formatTime = (sec) => {
    const h = Math.floor(
      sec / 3600
    );

    const m = Math.floor(
      (sec % 3600) / 60
    );

    const s = sec % 60;

    return `${String(h).padStart(
      2,
      "0"
    )}:${String(m).padStart(
      2,
      "0"
    )}:${String(s).padStart(
      2,
      "0"
    )}`;
  };

  if (loading) {
    return (
      <div className="text-gray-400">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-semibold">
          Welcome Back
        </h1>

        <p className="text-sm text-gray-400 mt-1">
          Your staff portal overview
        </p>
      </div>

      {/* TOP STATS */}
      <div className="grid md:grid-cols-4 gap-4">

        <Card
          title="Status"
          value={
            activeShift
              ? "Clocked In"
              : "Offline"
          }
          icon={<Clock3 size={16} />}
        />

        <Card
          title="Worked Today"
          value={formatTime(worked)}
          icon={<CheckCircle2 size={16} />}
        />

        <Card
          title="Pending Leave"
          value={pending}
          icon={<Plane size={16} />}
        />

        <Card
          title="Approved Leave"
          value={approved}
          icon={
            <CalendarDays
              size={16}
            />
          }
        />

      </div>

      {/* TODAY SHIFT */}
      <div className="rounded-2xl border border-white/10 bg-[#020617] p-6">

        <h2 className="text-lg font-semibold">
          Today's Schedule
        </h2>

        {todayShift ? (
          <div className="mt-4">

            <p className="text-3xl font-bold">
              {new Date(
                todayShift.start_time
              ).toLocaleTimeString(
                [],
                {
                  hour:
                    "2-digit",
                  minute:
                    "2-digit",
                }
              )}{" "}
              -{" "}
              {new Date(
                todayShift.end_time
              ).toLocaleTimeString(
                [],
                {
                  hour:
                    "2-digit",
                  minute:
                    "2-digit",
                }
              )}
            </p>

            <p className="text-sm text-gray-400 mt-2">
              You are scheduled
              today
            </p>

          </div>
        ) : (
          <p className="text-gray-400 mt-4">
            No shift scheduled
            today
          </p>
        )}

      </div>

      {/* RECENT HOLIDAYS */}
      <div className="rounded-2xl border border-white/10 bg-[#020617] p-6">

        <h2 className="text-lg font-semibold">
          Recent Holiday Requests
        </h2>

        <div className="space-y-3 mt-4">

          {holidays
            .slice(0, 4)
            .map((item) => (
              <div
                key={item.id}
                className="rounded-xl bg-white/5 px-4 py-3 flex justify-between"
              >
                <span>
                  {item.start_date} →{" "}
                  {item.end_date}
                </span>

                <span className="text-gray-400 capitalize">
                  {item.status}
                </span>
              </div>
            ))}

          {holidays.length ===
            0 && (
            <p className="text-gray-400">
              No holiday requests yet
            </p>
          )}

        </div>

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
    <div className="rounded-2xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">

      <div className="bg-[#020617] border border-white/10 rounded-2xl p-5">

        <div className="flex justify-between items-center">

          <p className="text-xs text-gray-400">
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

    </div>
  );
}