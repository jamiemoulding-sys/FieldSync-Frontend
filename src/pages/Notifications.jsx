import React, {
  useEffect,
  useState,
} from "react";

import {
  Bell,
  CheckCircle2,
  Trash2,
  Loader2,
  CheckCheck,
} from "lucide-react";

import { notificationAPI } from "../services/api";

export default function Notifications() {
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
        await notificationAPI.getAll();

      setRows(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id) {
    await notificationAPI.markRead(id);
    load();
  }

  async function removeItem(id) {
    await notificationAPI.delete(id);
    load();
  }

  async function markAllRead() {
    await notificationAPI.markAllRead();
    load();
  }

  async function clearAll() {
    await notificationAPI.clearAll();
    load();
  }

  const unread = rows.filter(
    (x) => !x.read
  ).length;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <Loader2
          size={16}
          className="animate-spin"
        />
        Loading notifications...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center flex-wrap gap-4">

        <div>
          <h1 className="text-2xl font-semibold">
            Notifications
          </h1>

          <p className="text-sm text-gray-400">
            Alerts and updates
          </p>
        </div>

        <div className="flex gap-2">

          <div className="px-4 py-2 rounded-xl bg-indigo-600 text-sm">
            {unread} unread
          </div>

          {rows.length > 0 && (
            <>
              <button
                onClick={
                  markAllRead
                }
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm"
              >
                Mark All Read
              </button>

              <button
                onClick={clearAll}
                className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-sm text-red-400"
              >
                Clear All
              </button>
            </>
          )}

        </div>

      </div>

      {/* LIST */}
      <div className="space-y-4">

        {rows.map((item) => (
          <div
            key={item.id}
            className={`rounded-2xl border p-5 ${
              item.read
                ? "border-white/10 bg-[#020617]"
                : "border-indigo-500/30 bg-[#0b1225]"
            }`}
          >

            <div className="flex justify-between gap-4">

              <div className="flex gap-3">

                <Bell
                  size={18}
                  className="text-indigo-400 mt-1"
                />

                <div>

                  <div className="flex items-center gap-2">

                    <h3 className="font-medium">
                      {item.title}
                    </h3>

                    {!item.read && (
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                    )}

                  </div>

                  <p className="text-sm text-gray-400 mt-1">
                    {item.message}
                  </p>

                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(
                      item.created_at
                    ).toLocaleString()}
                  </p>

                </div>

              </div>

              <div className="flex gap-2">

                {!item.read && (
                  <button
                    onClick={() =>
                      markRead(
                        item.id
                      )
                    }
                    className="w-10 h-10 rounded-xl bg-green-600/20 text-green-400 flex items-center justify-center"
                  >
                    <CheckCircle2
                      size={16}
                    />
                  </button>
                )}

                <button
                  onClick={() =>
                    removeItem(
                      item.id
                    )
                  }
                  className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center"
                >
                  <Trash2
                    size={16}
                  />
                </button>

              </div>

            </div>

          </div>
        ))}

        {rows.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#020617] p-10 text-center text-gray-500">

            <CheckCheck
              size={28}
              className="mx-auto mb-3"
            />

            No notifications

          </div>
        )}

      </div>

    </div>
  );
}