// src/pages/Tasks.jsx
// TASKS V2 FULL ENTERPRISE VERSION
// Route Planning + Claim Task + Multi Staff + Complete Logs

import { useEffect, useMemo, useState } from "react";
import {
  taskAPI,
  userAPI,
  locationAPI,
} from "../services/api";
import { useAuth } from "../hooks/useAuth";

import {
  Plus,
  Loader2,
  Search,
  CheckCircle2,
  MapPin,
  User,
  X,
} from "lucide-react";

export default function Tasks() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [locations, setLocations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [showModal, setShowModal] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const canManage =
    user?.role === "admin" ||
    user?.role === "manager";

  const [form, setForm] = useState({
    title: "",
    description: "",
    assigned_users: [],
    route_locations: [],
    due_date: "",
    priority: "normal",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [
        taskRows,
        userRows,
        locationRows,
      ] = await Promise.all([
        taskAPI.getAll(),
        userAPI.getAll(),
        locationAPI.getAll(),
      ]);

      setTasks(taskRows || []);
      setUsers(userRows || []);
      setLocations(locationRows || []);
    } finally {
      setLoading(false);
    }
  }

  async function createTask(e) {
    e.preventDefault();

    try {
      setSaving(true);

      await taskAPI.create({
        title: form.title,
        description:
          form.description,
        assigned_users:
          form.assigned_users,
        route_locations:
          form.route_locations,
        due_date:
          form.due_date || null,
        priority:
          form.priority,
        status: "todo",
        completed: false,
      });

      setShowModal(false);
      loadData();
    } finally {
      setSaving(false);
    }
  }

  async function claimTask(task) {
    await taskAPI.update(task.id, {
      claimed_by: user.id,
      claimed_at:
        new Date().toISOString(),
      status: "progress",
    });

    loadData();
  }

  async function completeTask(task) {
    await taskAPI.update(task.id, {
      completed: true,
      status: "done",
      completed_by: user.id,
      completed_at:
        new Date().toISOString(),
    });

    loadData();
  }

  async function deleteTask(id) {
    if (!window.confirm("Delete task?"))
      return;

    await taskAPI.delete(id);
    loadData();
  }

  const filtered = useMemo(() => {
    const q =
      search.toLowerCase();

    return tasks.filter((t) =>
      `${t.title} ${t.description}`
        .toLowerCase()
        .includes(q)
    );
  }, [tasks, search]);

  if (loading) {
    return (
      <div className="text-gray-400 flex gap-2">
        <Loader2
          size={16}
          className="animate-spin"
        />
        Loading tasks...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-2xl font-semibold">
            Tasks
          </h1>
          <p className="text-sm text-gray-400">
            Jobs / Routes / Tasks
          </p>
        </div>

        {canManage && (
          <button
            onClick={() =>
              setShowModal(true)
            }
            className="px-4 py-2 rounded-xl bg-indigo-600"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      <input
        placeholder="Search..."
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        className="w-full px-4 py-3 rounded-xl bg-[#020617] border border-white/10"
      />

      <div className="grid gap-4">

        {filtered.map((task) => (
          <div
            key={task.id}
            className="rounded-2xl border border-white/10 bg-[#020617] p-5 space-y-3"
          >

            <div className="flex justify-between">

              <div>
                <h2 className="font-semibold">
                  {task.title}
                </h2>

                <p className="text-sm text-gray-400">
                  {task.description}
                </p>
              </div>

              {task.completed ? (
                <CheckCircle2 className="text-green-500" />
              ) : null}
            </div>

            {/* Assigned */}
            <div className="text-xs text-gray-400">
              {task.assigned_users?.length
                ? `Assigned: ${task.assigned_users.length}`
                : "Open Task"}
            </div>

            {/* Route */}
            {task.route_locations
              ?.length > 0 && (
              <div className="text-xs text-indigo-300">
                Route Stops:{" "}
                {
                  task.route_locations
                    .length
                }
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">

              {!task.claimed_by &&
                !task.completed && (
                  <button
                    onClick={() =>
                      claimTask(task)
                    }
                    className="px-3 py-2 rounded-lg bg-white/10 text-sm"
                  >
                    Claim
                  </button>
                )}

              {!task.completed &&
                (task.claimed_by ===
                  user.id ||
                  canManage) && (
                  <button
                    onClick={() =>
                      completeTask(
                        task
                      )
                    }
                    className="px-3 py-2 rounded-lg bg-green-600 text-sm"
                  >
                    Complete
                  </button>
                )}

              {canManage && (
                <button
                  onClick={() =>
                    deleteTask(
                      task.id
                    )
                  }
                  className="px-3 py-2 rounded-lg bg-red-600 text-sm"
                >
                  Delete
                </button>
              )}

            </div>

          </div>
        ))}

      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">

          <div className="w-full max-w-xl rounded-2xl bg-[#020617] border border-white/10 p-6 space-y-4">

            <div className="flex justify-between">
              <h2 className="text-lg font-semibold">
                New Task
              </h2>

              <button
                onClick={() =>
                  setShowModal(false)
                }
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={createTask}
              className="space-y-4"
            >

              <input
                required
                placeholder="Title"
                className="w-full px-4 py-3 rounded-xl bg-white/5"
                onChange={(e) =>
                  setForm({
                    ...form,
                    title:
                      e.target.value,
                  })
                }
              />

              <textarea
                placeholder="Description"
                className="w-full px-4 py-3 rounded-xl bg-white/5"
                onChange={(e) =>
                  setForm({
                    ...form,
                    description:
                      e.target.value,
                  })
                }
              />

              <select
                className="w-full px-4 py-3 rounded-xl bg-white/5"
                onChange={(e) =>
                  setForm({
                    ...form,
                    assigned_users:
                      e.target.value
                        ? [
                            e.target
                              .value,
                          ]
                        : [],
                  })
                }
              >
                <option value="">
                  Open Task
                </option>

                {users.map((u) => (
                  <option
                    key={u.id}
                    value={u.id}
                  >
                    {u.name}
                  </option>
                ))}
              </select>

              <select
                className="w-full px-4 py-3 rounded-xl bg-white/5"
                onChange={(e) =>
                  setForm({
                    ...form,
                    route_locations:
                      e.target.value
                        ? [
                            {
                              id:
                                e.target
                                  .value,
                            },
                          ]
                        : [],
                  })
                }
              >
                <option value="">
                  No Route
                </option>

                {locations.map((l) => (
                  <option
                    key={l.id}
                    value={l.id}
                  >
                    {l.name}
                  </option>
                ))}
              </select>

              <button
                disabled={saving}
                className="w-full py-3 rounded-xl bg-indigo-600"
              >
                {saving
                  ? "Saving..."
                  : "Create Task"}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}