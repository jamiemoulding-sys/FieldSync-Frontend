import { useEffect, useState } from "react";
import { shiftAPI, locationAPI } from "../services/api";
import { motion } from "framer-motion";
import {
  Clock3,
  MapPin,
  Play,
  Square,
  TimerReset,
  Navigation,
  Loader2,
  Coffee,
} from "lucide-react";

export default function WorkSession() {
  const [activeShift, setActiveShift] =
    useState(null);

  const [locations, setLocations] =
    useState([]);

  const [selectedLocation, setSelectedLocation] =
    useState("");

  const [timer, setTimer] =
    useState(0);

  const [breakTimer, setBreakTimer] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [shiftRes, locRes] =
        await Promise.all([
          shiftAPI.getActive(),
          locationAPI.getLocations(),
        ]);

      setActiveShift(
        shiftRes || null
      );

      setLocations(
        Array.isArray(locRes)
          ? locRes
          : []
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* MAIN TIMER */
  useEffect(() => {
    let interval;

    if (activeShift?.clock_in_time) {
      const update = () => {
        const start =
          new Date(
            activeShift.clock_in_time
          ).getTime();

        const now =
          Date.now();

        const total =
          Math.floor(
            (now - start) / 1000
          );

        const breaks =
          activeShift.total_break_seconds ||
          0;

        const liveBreak =
          activeShift.break_started_at
            ? Math.floor(
                (now -
                  new Date(
                    activeShift.break_started_at
                  ).getTime()) /
                  1000
              )
            : 0;

        const worked =
          total -
          breaks -
          liveBreak;

        setTimer(
          worked > 0
            ? worked
            : 0
        );
      };

      update();

      interval = setInterval(
        update,
        1000
      );
    }

    return () =>
      clearInterval(interval);
  }, [activeShift]);

  /* BREAK TIMER */
  useEffect(() => {
    let interval;

    if (
      activeShift?.break_started_at
    ) {
      const update = () => {
        const sec =
          Math.floor(
            (Date.now() -
              new Date(
                activeShift.break_started_at
              ).getTime()) /
              1000
          );

        setBreakTimer(
          sec > 0 ? sec : 0
        );
      };

      update();

      interval = setInterval(
        update,
        1000
      );
    } else {
      setBreakTimer(0);
    }

    return () =>
      clearInterval(interval);
  }, [activeShift]);

  /* LIVE GPS */
  useEffect(() => {
    let interval;

    if (activeShift?.id) {
      interval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              await shiftAPI.updateLocation({
                latitude:
                  pos.coords.latitude,
                longitude:
                  pos.coords.longitude,
              });
            } catch {}
          }
        );
      }, 15000);
    }

    return () =>
      clearInterval(interval);
  }, [activeShift]);

  const handleClockIn = () => {
    if (!selectedLocation) {
      alert(
        "Select a location"
      );
      return;
    }

    setActionLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const shift =
            await shiftAPI.clockIn({
              location_id:
                selectedLocation,
              latitude:
                pos.coords.latitude,
              longitude:
                pos.coords.longitude,
            });

          setActiveShift(
            shift
          );
        } catch {
          alert(
            "Clock in failed"
          );
        } finally {
          setActionLoading(
            false
          );
        }
      },
      () => {
        alert(
          "Location denied"
        );

        setActionLoading(
          false
        );
      }
    );
  };

  const handleClockOut =
    async () => {
      try {
        setActionLoading(
          true
        );

        await shiftAPI.clockOut();

        setActiveShift(
          null
        );

        setTimer(0);
      } catch {
        alert(
          "Clock out failed"
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  const handleBreak =
    async () => {
      try {
        setActionLoading(
          true
        );

        if (
          activeShift?.break_started_at
        ) {
          await shiftAPI.endBreak();
        } else {
          await shiftAPI.startBreak();
        }

        await loadData();
      } catch {
        alert(
          "Break action failed"
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  const formatTime = (
    sec
  ) => {
    const h = Math.floor(
      sec / 3600
    );

    const m = Math.floor(
      (sec % 3600) / 60
    );

    const s =
      sec % 60;

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

  const formatStarted = () => {
    if (
      !activeShift?.clock_in_time
    )
      return "";

    return new Date(
      activeShift.clock_in_time
    ).toLocaleTimeString(
      "en-GB",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  if (loading) {
    return (
      <div className="text-gray-400">
        Loading work
        session...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Work Session
        </h1>

        <p className="text-sm text-gray-400">
          Clock in and track
          today's shift
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <KPI
          icon={
            <Clock3
              size={16}
            />
          }
          title="Status"
          value={
            activeShift
              ? "Active"
              : "Offline"
          }
        />

        <KPI
          icon={
            <TimerReset
              size={16}
            />
          }
          title="Worked"
          value={formatTime(
            timer
          )}
        />

        <KPI
          icon={
            <Navigation
              size={16}
            />
          }
          title="Tracking"
          value={
            activeShift
              ? "Enabled"
              : "Stopped"
          }
        />
      </div>

      {activeShift ? (
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="rounded-3xl p-[1px] bg-gradient-to-r from-green-500/30 to-transparent"
        >
          <div className="bg-[#020617] border border-white/10 rounded-3xl p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/15 text-green-400 mx-auto flex items-center justify-center">
              <Clock3
                size={34}
              />
            </div>

            <p className="mt-5 text-sm text-green-400">
              Clocked In
            </p>

            <h2 className="text-5xl font-bold mt-3">
              {formatTime(
                timer
              )}
            </h2>

            <p className="text-sm text-gray-400 mt-3">
              Started{" "}
              {formatStarted()}
            </p>

            {activeShift.break_started_at && (
              <p className="text-amber-400 mt-3 text-sm">
                On Break{" "}
                {formatTime(
                  breakTimer
                )}
              </p>
            )}

            <div className="flex gap-3 justify-center mt-8 flex-wrap">
              <button
                onClick={
                  handleBreak
                }
                disabled={
                  actionLoading
                }
                className="px-6 py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 font-medium flex items-center gap-2"
              >
                <Coffee
                  size={16}
                />

                {activeShift.break_started_at
                  ? "End Break"
                  : "Start Break"}
              </button>

              <button
                onClick={
                  handleClockOut
                }
                disabled={
                  actionLoading
                }
                className="px-6 py-4 rounded-2xl bg-red-500 hover:bg-red-600 disabled:opacity-60 font-medium flex items-center gap-2"
              >
                {actionLoading ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Square
                    size={16}
                  />
                )}

                Clock Out
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="rounded-3xl p-[1px] bg-gradient-to-r from-indigo-500/30 to-transparent"
        >
          <div className="bg-[#020617] border border-white/10 rounded-3xl p-8">
            <h3 className="text-xl font-semibold">
              Start Shift
            </h3>

            <p className="text-sm text-gray-400 mt-2">
              Select your
              location before
              clocking in
            </p>

            <div className="relative mt-6">
              <MapPin
                size={16}
                className="absolute left-4 top-4 text-gray-500"
              />

              <select
                value={
                  selectedLocation
                }
                onChange={(e) =>
                  setSelectedLocation(
                    e.target.value
                  )
                }
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-4 outline-none"
              >
                <option value="">
                  Select
                  Location
                </option>

                {locations.map(
                  (loc) => (
                    <option
                      key={
                        loc.id
                      }
                      value={
                        loc.id
                      }
                    >
                      {
                        loc.name
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <button
              onClick={
                handleClockIn
              }
              disabled={
                actionLoading
              }
              className="w-full mt-5 py-4 rounded-2xl bg-green-600 hover:bg-green-500 disabled:opacity-60 font-medium flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Play
                  size={16}
                />
              )}

              Clock In
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function KPI({
  icon,
  title,
  value,
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

        <h3 className="text-xl font-semibold mt-3">
          {value}
        </h3>
      </div>
    </div>
  );
}