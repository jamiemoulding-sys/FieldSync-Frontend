// src/pages/Tasks.jsx
// TASKS V3 PREMIUM VERSION
// Multi Staff + Multi Route Stops + Claim + Complete + Better Dropdowns

import { useEffect, useMemo, useState } from "react";
import {
  taskAPI,
  userAPI,
  locationAPI,
} from "../services/api";

import { useAuth } from "../hooks/useAuth";

import {
  Plus,
  Search,
  Loader2,
  X,
  CheckCircle2,
  Trash2,
  MapPin,
  User,
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function createTask(e) {
    e.preventDefault();

    if (!form.title.trim()) return;

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
        status: "todo",
        completed: false,
      });

      setShowModal(false);

      setForm({
        title: "",
        description: "",
        assigned_users: [],
        route_locations: [],
      });

      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to create");
    } finally {
      setSaving(false);
    }
  }

  async function claimTask(task) {
    await taskAPI.update(task.id, {
      claimed_by: user.id,
      status: "progress",
    });

    loadData();
  }

  async function completeTask(task) {
    await taskAPI.update(task.id, {
      completed: true,
      status: "done",
      completed_by: user.id,
    });

    loadData();
  }

  async function deleteTask(id) {
    if (!window.confirm("Delete?"))
      return;

    await taskAPI.delete(id);
    loadData();
  }

  function toggleUser(id) {
    const exists =
      form.assigned_users.includes(id);

    setForm({
      ...form,
      assigned_users: exists
        ? form.assigned_users.filter(
            (x) => x !== id
          )
        : [
            ...form.assigned_users,
            id,
          ],
    });
  }

  function addStop(id) {
    if (!id) return;

    setForm({
      ...form,
      route_locations: [
        ...form.route_locations,
        id,
      ],
    });
  }

  function removeStop(id) {
    setForm({
      ...form,
      route_locations:
        form.route_locations.filter(
          (x, i) => i !== id
        ),
    });
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
      <div className="flex gap-2 text-gray-400">
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

      {/* HEADER */}
      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-2xl font-semibold">
            Tasks
          </h1>

          <p className="text-sm text-gray-400">
            Route Jobs / Work Orders
          </p>
        </div>

        {canManage && (
          <button
            onClick={() =>
              setShowModal(true)
            }
            className="px-4 py-2 rounded-xl bg-indigo-600 flex gap-2 items-center"
          >
            <Plus size={16} />
            New Task
          </button>
        )}
      </div>

      {/* SEARCH */}
      <input
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        placeholder="Search..."
        className="w-full px-4 py-3 rounded-xl bg-[#020617] border border-white/10"
      />

      {/* TASK LIST */}
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

              {task.completed && (
                <CheckCircle2 className="text-green-500" />
              )}

            </div>

            {/* STAFF */}
            <div className="text-xs text-gray-400">
              {task.assigned_users
                ?.length
                ? `Assigned Staff: ${task.assigned_users.length}`
                : "Open Task"}
            </div>

            {/* ROUTE */}
            {task.route_locations
              ?.length > 0 && (
              <div className="space-y-1">
                {task.route_locations.map(
                  (stop, i) => {
                    const loc =
                      locations.find(
                        (x) =>
                          String(
                            x.id
                          ) ===
                          String(
                            stop
                          )
                      );

                    return (
                      <div
                        key={i}
                        className="text-xs text-indigo-300"
                      >
                        {i + 1}.{" "}
                        {loc?.name ||
                          "Location"}
                      </div>
                    );
                  }
                )}
              </div>
            )}

            {/* ACTIONS */}
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
                  className="px-3 py-2 rounded-lg bg-red-600 text-sm flex gap-1 items-center"
                >
                  <Trash2 size={12} />
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
                Create Task
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
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title:
                      e.target.value,
                  })
                }
                className="w-full px-4 py-3 rounded-xl bg-white/5"
              />

              <textarea
                placeholder="Description"
                value={
                  form.description
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    description:
                      e.target.value,
                  })
                }
                className="w-full px-4 py-3 rounded-xl bg-white/5"
              />

              {/* STAFF */}
              <div>
                <p className="text-sm mb-2">
                  Assign Staff
                </p>

                <div className="grid gap-2 max-h-40 overflow-y-auto">

                  {users.map((u) => (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() =>
                        toggleUser(
                          u.id
                        )
                      }
                      className={`px-3 py-2 rounded-lg text-left ${
                        form.assigned_users.includes(
                          u.id
                        )
                          ? "bg-indigo-600"
                          : "bg-white/5"
                      }`}
                    >
                      {u.name ||
                        u.email}
                    </button>
                  ))}

                </div>
              </div>

              {/* ROUTES */}
              <div>
                <p className="text-sm mb-2">
                  Add Route Stops
                </p>

                <select
                  onChange={(e) =>
                    addStop(
                      e.target.value
                    )
                  }
                  className="w-full px-4 py-3 rounded-xl bg-white/5"
                >
                  <option value="">
                    Select location
                  </option>

                  {locations.map((l) => (
                    <option
                      key={l.id}
                      value={l.id}
                    >
                      {l.name ||
                        `Location ${l.id}`}
                    </option>
                  ))}
                </select>

                <div className="mt-3 space-y-2">

                  {form.route_locations.map(
                    (
                      id,
                      i
                    ) => {
                      const loc =
                        locations.find(
                          (x) =>
                            String(
                              x.id
                            ) ===
                            String(
                              id
                            )
                        );

                      return (
                        <div
                          key={i}
                          className="flex justify-between px-3 py-2 rounded-lg bg-white/5"
                        >
                          <span>
                            {i + 1}.{" "}
                            {loc?.name ||
                              "Location"}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              removeStop(
                                i
                              )
                            }
                          >
                            X
                          </button>
                        </div>
                      );
                    }
                  )}

                </div>
              </div>

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