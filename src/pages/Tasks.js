import { useState, useEffect } from "react";
import { taskAPI, locationAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { motion } from "framer-motion";
import { CheckCircle, MapPin, Plus } from "lucide-react";

export default function Tasks() {
  const { user, loading: authLoading } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
  });

  const [selectedLocation, setSelectedLocation] = useState("");
  const [completedTasks, setCompletedTasks] = useState([]);

  useEffect(() => {
    if (authLoading || !user) return;
    loadData();
  }, [authLoading, user]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [tasksData, locationsData] = await Promise.all([
        taskAPI.getTasks(),       // ✅ FIXED
        locationAPI.getLocations()
      ]);

      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setLocations(Array.isArray(locationsData) ? locationsData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();

    try {
      await taskAPI.create({
        ...newTask,
        location_id: selectedLocation,
      });

      setShowModal(false);
      setNewTask({ title: "", description: "" });
      setSelectedLocation("");

      loadData();
    } catch (err) {
      alert("Failed to create task");
    }
  };

  const handleComplete = async (taskId) => {
    try {
      await taskAPI.complete(taskId);
      setCompletedTasks((prev) => [...prev, taskId]);
    } catch (err) {
      alert("Failed to complete task");
    }
  };

  if (authLoading || loading) {
    return <div className="text-gray-400">Loading tasks...</div>;
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="text-gray-400 text-sm">Manage and track work</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl text-sm transition shadow-lg shadow-indigo-500/20"
        >
          <Plus size={16} />
          Add Task
        </button>
      </div>

      {/* TASK GRID */}
      <div className="grid md:grid-cols-3 gap-6">

        {[...tasks]
          .sort(
            (a, b) =>
              completedTasks.includes(a.id) -
              completedTasks.includes(b.id)
          )
          .map((task, i) => {
            const isDone = completedTasks.includes(task.id);
            const location = locations.find(
              (l) => l.id === task.location_id
            );

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`relative rounded-2xl p-[1px] ${
                  isDone
                    ? "bg-gradient-to-b from-green-500/30 to-transparent"
                    : "bg-gradient-to-b from-white/10 to-transparent"
                }`}
              >
                <div className="bg-[#020617] border border-white/10 rounded-2xl p-5 h-full flex flex-col justify-between hover:bg-white/5 transition">

                  {/* TITLE */}
                  <div>
                    <p className="font-semibold text-white">
                      {task.title}
                    </p>

                    <p className="text-gray-400 text-sm mt-1">
                      {task.description}
                    </p>

                    {/* LOCATION */}
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-3">
                      <MapPin size={12} />
                      {location?.name || "Unknown"}
                    </div>
                  </div>

                  {/* ACTION */}
                  <div className="mt-4">
                    {isDone ? (
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle size={16} />
                        Completed
                      </div>
                    ) : (
                      <button
                        onClick={() => handleComplete(task.id)}
                        className="w-full bg-green-600 hover:bg-green-500 py-2 rounded-xl text-sm transition active:scale-95"
                      >
                        Complete Task
                      </button>
                    )}
                  </div>

                </div>
              </motion.div>
            );
          })}

      </div>

      {/* EMPTY STATE */}
      {tasks.length === 0 && (
        <div className="text-center text-gray-500 mt-10">
          No tasks yet
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#020617] border border-white/10 rounded-2xl p-6 w-full max-w-md"
          >
            <h2 className="text-lg font-semibold mb-4">
              Create Task
            </h2>

            <form onSubmit={handleCreateTask} className="space-y-3">

              <input
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm"
                required
              />

              <textarea
                placeholder="Description"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({
                    ...newTask,
                    description: e.target.value,
                  })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm"
              />

              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm"
                required
              >
                <option value="">Select Location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>

              <button className="w-full bg-indigo-600 hover:bg-indigo-500 py-2 rounded-xl text-sm transition">
                Create Task
              </button>

            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}