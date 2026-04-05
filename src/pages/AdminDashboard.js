import React, { useState, useEffect } from 'react';
import { shiftAPI, taskAPI, locationAPI, uploadAPI } from '../services/api';
import { 
  Users, MapPin, Plus, Edit2, Trash2, Camera, 
  ClockIn, ClockOut, CheckCircle, X 
} from 'lucide-react';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('employees');
  const [activeShifts, setActiveShifts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [shiftsResponse, locationsResponse, tasksResponse, completionsResponse] = await Promise.all([
        shiftAPI.getActiveAll(),
        locationAPI.getLocations(),
        taskAPI.getAllTasks(),
        uploadAPI.getAllCompletions()
      ]);

      setActiveShifts(shiftsResponse.data);
      setLocations(locationsResponse.data);
      setTasks(tasksResponse.data);
      setCompletions(completionsResponse.data);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      if (editingItem) {
        await taskAPI.updateTask(editingItem.id, taskData);
      } else {
        await taskAPI.createTask(taskData);
      }
      
      setShowTaskModal(false);
      setEditingItem(null);
      loadData();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleCreateLocation = async (locationData) => {
    try {
      if (editingItem) {
        await locationAPI.updateLocation(editingItem.id, locationData);
      } else {
        await locationAPI.createLocation(locationData);
      }
      
      setShowLocationModal(false);
      setEditingItem(null);
      loadData();
    } catch (error) {
      console.error('Failed to save location:', error);
    }
  };

  const handleDeleteLocation = async (locationId) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    
    try {
      await locationAPI.deleteLocation(locationId);
      loadData();
    } catch (error) {
      console.error('Failed to delete location:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Employees</p>
              <p className="text-2xl font-bold text-gray-900">{activeShifts.length}</p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Locations</p>
              <p className="text-2xl font-bold text-gray-900">{locations.length}</p>
            </div>
            <MapPin className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Tasks</p>
              <p className="text-2xl font-bold text-gray-900">
                {tasks.filter(t => t.is_active).length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completions Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {completions.filter(c => 
                  new Date(c.completed_at).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
            <Camera className="h-8 w-8 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['employees', 'locations', 'tasks', 'completions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="card">
        {activeTab === 'employees' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Employees</h2>
            {activeShifts.length === 0 ? (
              <p className="text-gray-500">No employees currently clocked in</p>
            ) : (
              <div className="space-y-3">
                {activeShifts.map((shift) => (
                  <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{shift.user_name}</p>
                      <p className="text-sm text-gray-600">{shift.location_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {new Date(shift.clock_in_time).toLocaleTimeString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(shift.clock_in_time).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'locations' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Locations</h2>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowLocationModal(true);
                }}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Location</span>
              </button>
            </div>
            <div className="space-y-3">
              {locations.map((location) => (
                <div key={location.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{location.name}</p>
                    <p className="text-sm text-gray-600">{location.address}</p>
                    <p className="text-xs text-gray-500">QR: {location.qr_code}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingItem(location);
                        setShowLocationModal(true);
                      }}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteLocation(location.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowTaskModal(true);
                }}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Task</span>
              </button>
            </div>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{task.title}</p>
                    <p className="text-sm text-gray-600">{task.description}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500">
                        {locations.find(l => l.id === task.location_id)?.name}
                      </span>
                      {task.requires_photo && (
                        <span className="text-xs text-amber-600 flex items-center">
                          <Camera className="h-3 w-3 mr-1" />
                          Photo required
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded ${
                        task.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {task.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingItem(task);
                      setShowTaskModal(true);
                    }}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'completions' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Task Completions</h2>
            <div className="space-y-3">
              {completions.slice(0, 20).map((completion) => (
                <div key={completion.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{completion.task_title}</p>
                    <p className="text-sm text-gray-600">by {completion.user_name}</p>
                    <p className="text-xs text-gray-500">
                      {completion.location_name} • {new Date(completion.completed_at).toLocaleString()}
                    </p>
                  </div>
                  {completion.photo_url && (
                    <img
                      src={completion.photo_url}
                      alt="Task completion"
                      className="h-12 w-12 object-cover rounded"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showTaskModal && (
        <TaskModal
          task={editingItem}
          locations={locations}
          onClose={() => {
            setShowTaskModal(false);
            setEditingItem(null);
          }}
          onSave={handleCreateTask}
        />
      )}

      {showLocationModal && (
        <LocationModal
          location={editingItem}
          onClose={() => {
            setShowLocationModal(false);
            setEditingItem(null);
          }}
          onSave={handleCreateLocation}
        />
      )}
    </div>
  );
}

function TaskModal({ task, locations, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    location_id: task?.location_id || '',
    requires_photo: task?.requires_photo || false,
    is_active: task?.is_active !== undefined ? task.is_active : true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {task ? 'Edit Task' : 'Create Task'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="input-field"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <select
              value={formData.location_id}
              onChange={(e) => setFormData({...formData, location_id: parseInt(e.target.value)})}
              className="input-field"
              required
            >
              <option value="">Select location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.requires_photo}
                onChange={(e) => setFormData({...formData, requires_photo: e.target.checked})}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Requires photo</span>
            </label>

            {task && (
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            )}
          </div>

          <div className="flex space-x-3">
            <button type="submit" className="btn-primary flex-1">
              {task ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LocationModal({ location, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: location?.name || '',
    address: location?.address || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {location ? 'Edit Location' : 'Create Location'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="input-field"
              rows={2}
            />
          </div>

          <div className="flex space-x-3">
            <button type="submit" className="btn-primary flex-1">
              {location ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminDashboard;
