import React, { useState, useEffect } from 'react';
import { taskAPI, locationAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import HomeButton from '../components/HomeButton';
import Layout from '../components/Layout';

function Tasks() {
  const { user, loading: authLoading } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: ''
  });
  const [selectedLocation, setSelectedLocation] = useState('');

  const [completedTasks, setCompletedTasks] = useState([]);

  useEffect(() => {
    if (authLoading || !user) return;
    loadData();
  }, [authLoading, user]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [tasksRes, locationsRes] = await Promise.all([
        taskAPI.getTasks(),
        locationAPI.getLocations()
      ]);

      setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      setLocations(Array.isArray(locationsRes.data) ? locationsRes.data : []);

    } catch (err) {
      console.error(err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();

    try {
      await taskAPI.create({
        ...newTask,
        location_id: selectedLocation
      });

      setShowModal(false);
      setNewTask({ title: '', description: '' });
      setSelectedLocation('');

      loadData();

    } catch (err) {
      console.error(err);
      alert('Failed to create task');
    }
  };

  const handleComplete = async (taskId) => {
    try {
      await taskAPI.complete(taskId);
      setCompletedTasks(prev => [...prev, taskId]);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to complete task');
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="text-white">Loading tasks...</div>
      </Layout>
    );
  }

  return (
    <Layout>

      <div className="space-y-8">

        <div className="flex justify-between items-center">
          <h1 className="heading-1">📝 Tasks</h1>

          <div className="flex gap-3">
            <HomeButton />

            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              ➕ Add Task
            </button>
          </div>
        </div>

        {error && <div className="badge-error">{error}</div>}

        <div className="grid md:grid-cols-3 gap-6">
          {[...tasks]
            .sort((a, b) => completedTasks.includes(a.id) - completedTasks.includes(b.id))
            .map(task => {
              const isDone = completedTasks.includes(task.id);

              return (
                <div
                  key={task.id}
                  className={`card transition-all duration-300 ${
                    isDone ? 'opacity-60' : ''
                  }`}
                >
                  <p className="text-white font-semibold">{task.title}</p>
                  <p className="text-gray-400 text-sm">{task.description}</p>

                  <p className="text-xs text-gray-500 mt-2">
                    📍 {locations.find(l => l.id === task.location_id)?.name || 'Unknown'}
                  </p>

                  {isDone ? (
                    <div className="mt-3 text-green-400 font-semibold">
                      ✅ Completed
                    </div>
                  ) : (
                    <button
                      onClick={() => handleComplete(task.id)}
                      className="mt-3 bg-green-600 px-3 py-1 rounded hover:bg-green-700 active:scale-95 transition-all"
                    >
                      ✅ Complete
                    </button>
                  )}
                </div>
              );
            })}
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
            <div className="card w-full max-w-md">

              <form onSubmit={handleCreateTask} className="space-y-4">

                <input
                  placeholder="Task title"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  className="input-field"
                  required
                />

                <textarea
                  placeholder="Description"
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  className="input-field"
                />

                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Select Location</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>

                <button className="btn-primary w-full">
                  Create Task
                </button>

              </form>

            </div>
          </div>
        )}

      </div>

    </Layout>
  );
}

export default Tasks;