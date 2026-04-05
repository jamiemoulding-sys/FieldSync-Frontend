import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { managerAPI } from '../services/api';

function Employees() {
  const { user } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'employee'
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const res = await managerAPI.getEmployees();
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      await managerAPI.createEmployee(formData);

      setShowModal(false);
      setFormData({ name: '', email: '', role: 'employee' });

      loadEmployees();
    } catch (err) {
      alert('Failed to create employee');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-white">Loading employees...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="heading-1">👥 Employees</h1>
            <p className="subtle-text mt-1">
              Manage your team
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            + Add Employee
          </button>
        </div>

        {/* GRID */}
        <div className="grid md:grid-cols-3 gap-6">
          {employees.map(emp => (
            <div key={emp.id} className="card">

              <div className="w-12 h-12 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-semibold text-lg">
                {emp.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>

              <div className="mt-4">
                <p className="font-semibold text-white">{emp.name}</p>
                <p className="text-sm text-gray-400">{emp.email}</p>
              </div>

              <div className="mt-4">
                <span className="px-2 py-1 rounded-full text-xs bg-indigo-500/20 text-indigo-400">
                  {emp.role}
                </span>
              </div>

            </div>
          ))}
        </div>

        {/* EMPTY */}
        {employees.length === 0 && (
          <div className="card text-center text-gray-400">
            No employees yet
          </div>
        )}

        {/* MODAL */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center">

            <div className="card w-full max-w-md">

              <h2 className="heading-2 mb-4">Add Employee</h2>

              <form onSubmit={handleCreate} className="space-y-3">

                <input
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input-field"
                  required
                />

                <input
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="input-field"
                  required
                />

                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="input-field"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                </select>

                <button className="btn-primary w-full">
                  Create Employee
                </button>

              </form>

            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}

export default Employees;