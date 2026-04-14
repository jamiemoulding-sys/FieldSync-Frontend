/* =========================================================
src/pages/WorkSession.js
LAUNCH READY PRO VERSION

UPGRADES INCLUDED
✅ Better geofence detection
✅ Live GPS status
✅ Shows distance from site
✅ Prevent double clock in
✅ Auto refresh every 20s
✅ Cleaner UI
✅ Break timer improved
✅ Mobile polished
✅ Keeps your layout style
========================================================= */

import { useEffect, useState } from "react";
import {
  shiftAPI,
  locationAPI,
} from "../services/api";

import {
  Clock3,
  Play,
  Square,
  Coffee,
  MapPin,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Navigation,
} from "lucide-react";

export default function WorkSession() {
  const [activeShift, setActiveShift] =
    useState(null);

  const [locations, setLocations] =
    useState([]);

  const [selectedLocation, setSelectedLocation] =
    useState("");

  const [worked, setWorked] =
    useState(0);

  const [breakSec, setBreakSec] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [warning, setWarning] =
    useState("");

  const [gpsText, setGpsText] =
    useState("");

  const [distanceAway, setDistanceAway] =
    useState(null);

  useEffect(() => {
    load();

    const timer =
      setInterval(load, 20000);

    return () =>
      clearInterval(timer);
  }, []);

  useEffect(() => {
    let timer;

    if (activeShift?.clock_in_time) {
      timer = setInterval(() => {
        const now = Date.now();

        const start = new Date(
          activeShift.clock_in_time
        ).getTime();

        const savedBreak =
          activeShift.total_break_seconds ||
          0;

        const liveBreak =
          activeShift.break_started_at
            ? Math.floor(
                (now -
                  new Date(
                    activeShift.break_started_at
                  ).getTime()) / 1000
              )
            : 0;

        const total =
          Math.floor(
            (now - start) / 1000
          ) -
          savedBreak -
          liveBreak;

        setWorked(
          total > 0 ? total : 0
        );

        setBreakSec(liveBreak);
      }, 1000);
    }

    return () =>
      clearInterval(timer);
  }, [activeShift]);

  async function load() {
    try {
      setLoading(true);

      const [
        shift,
        locs,
      ] = await Promise.all([
        shiftAPI.getActive(),
        locationAPI.getLocations(),
      ]);

      setActiveShift(
        shift || null
      );

      setLocations(
        Array.isArray(locs)
          ? locs
          : []
      );
    } finally {
      setLoading(false);
    }
  }

  function distanceMeters(
    lat1,
    lon1,
    lat2,
    lon2
  ) {
    const R = 6371000;

    const dLat =
      ((lat2 - lat1) *
        Math.PI) /
      180;

    const dLon =
      ((lon2 - lon1) *
        Math.PI) /
      180;

    const a =
      Math.sin(
        dLat / 2
      ) *
        Math.sin(
          dLat / 2
        ) +
      Math.cos(
        (lat1 *
          Math.PI) /
          180
      ) *
        Math.cos(
          (lat2 *
            Math.PI) /
            180
        ) *
        Math.sin(
          dLon / 2
        ) *
        Math.sin(
          dLon / 2
        );

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return R * c;
  }

  async function clockIn() {
    if (
      saving ||
      activeShift
    )
      return;

    if (!selectedLocation) {
      return alert(
        "Select a location"
      );
    }

    const site =
      locations.find(
        (x) =>
          String(x.id) ===
          String(
            selectedLocation
          )
      );

    if (!site) {
      return alert(
        "Location not found"
      );
    }

    setSaving(true);
    setWarning("");
    setGpsText(
      "Checking location..."
    );

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat =
            pos.coords
              .latitude;

          const lng =
            pos.coords
              .longitude;

          const distance =
            distanceMeters(
              lat,
              lng,
              Number(
                site.latitude
              ),
              Number(
                site.longitude
              )
            );

          const radius =
            Number(
              site.radius
            ) || 100;

          setDistanceAway(
            Math.round(
              distance
            )
          );

          if (
            distance >
            radius
          ) {
            setWarning(
              `Outside allowed zone. ${Math.round(
                distance
              )}m away (limit ${radius}m)`
            );

            setGpsText("");
            setSaving(false);
            return;
          }

          setGpsText(
            "Clocking in..."
          );

          await shiftAPI.clockIn({
            location_id:
              selectedLocation,
            latitude: lat,
            longitude: lng,
          });

          setGpsText(
            "Clocked in"
          );

          await load();
        } finally {
          setSaving(false);
        }
      },
      () => {
        setSaving(false);

        setGpsText("");

        alert(
          "Allow location access first"
        );
      },
      {
        enableHighAccuracy: true,
      }
    );
  }

  async function clockOut() {
    try {
      setSaving(true);
      await shiftAPI.clockOut();
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleBreak() {
    try {
      setSaving(true);

      if (
        activeShift?.break_started_at
      ) {
        await shiftAPI.endBreak();
      } else {
        await shiftAPI.startBreak();
      }

      await load();
    } finally {
      setSaving(false);
    }
  }

  function format(sec) {
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
      <div>
        <h1 className="text-2xl font-semibold">
          Work Session
        </h1>

        <p className="text-sm text-gray-400">
          Clock in and manage shift
        </p>
      </div>

      {warning && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300 text-sm flex gap-2">
          <AlertTriangle size={16} />
          {warning}
        </div>
      )}

      {gpsText && (
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4 text-indigo-300 text-sm">
          {gpsText}
        </div>
      )}

      {activeShift ? (
        <div className="rounded-3xl border border-white/10 bg-[#020617] p-8 text-center">

          <div className="w-20 h-20 mx-auto rounded-full bg-green-500/15 text-green-400 flex items-center justify-center">
            <CheckCircle2 size={34} />
          </div>

          <p className="mt-5 text-green-400 text-sm">
            Currently Clocked In
          </p>

          <h2 className="text-5xl font-bold mt-3">
            {format(worked)}
          </h2>

          {activeShift.break_started_at && (
            <p className="text-amber-400 mt-3">
              Break:
              {" "}
              {format(
                breakSec
              )}
            </p>
          )}

          <div className="grid md:grid-cols-2 gap-3 mt-8">

            <button
              onClick={
                toggleBreak
              }
              disabled={
                saving
              }
              className="py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 flex items-center justify-center gap-2"
            >
              <Coffee size={16} />

              {activeShift.break_started_at
                ? "End Break"
                : "Start Break"}
            </button>

            <button
              onClick={
                clockOut
              }
              disabled={
                saving
              }
              className="py-4 rounded-2xl bg-red-600 hover:bg-red-500 flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Square size={16} />
              )}

              Clock Out
            </button>

          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-[#020617] p-8">

          <h2 className="text-xl font-semibold">
            Start Shift
          </h2>

          <p className="text-sm text-gray-400 mt-1">
            Must be inside site radius
          </p>

          <div className="relative mt-5">
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
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-4"
            >
              <option value="">
                Select Location
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
                    {loc.name}
                  </option>
                )
              )}
            </select>
          </div>

          {distanceAway && (
            <div className="mt-4 text-sm text-gray-400 flex items-center gap-2">
              <Navigation size={14} />
              Last distance:
              {" "}
              {distanceAway}m
            </div>
          )}

          <button
            onClick={clockIn}
            disabled={saving}
            className="w-full mt-5 py-4 rounded-2xl bg-green-600 hover:bg-green-500 flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <Play size={16} />
            )}

            Clock In
          </button>

        </div>
      )}
    </div>
  );
}