import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { userAPI } from "../services/api";
import { motion } from "framer-motion";

export default function Employees() {
  const { user } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "employee",
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await userAPI.getAll(); // ✅ FIXED
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      // 👉 you may need to wire this endpoint later
      await userAPI.create?.(formData);

      setShowModal(false);
      setFormData({ name: "", email: "", role: "employee" });

      loadEmployees();
    } catch (err) {
      alert("Failed to create employee");
    }
  };

  if (loading) {
    return <div className="text-gray-400">Loading employees...</div>;
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Employees</h1>
          <p className="text-gray-400 text-sm">Manage your team</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl text-sm transition shadow-lg shadow-indigo-500/20"
        >
          + Add Employee
        </button>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#020617]">

        <table className="w-full text-sm">
          <thead className="bg-white/5 text-gray-400">
            <tr>
              <th className="text-left p-4">User</th>
              <th className="text-left p-4">Role</th>
              <th className="text-left p-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {employees.map((emp, i) => (
              <motion.tr
                key={emp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border-t border-white/5 hover:bg-white/5 transition"
              >
                <td className="p-4 flex items-center gap-3">

                  {/* Avatar */}
                  <img
                    src={`https://ui-avatars.com/api/?name=${emp.name}`}
                    className="w-9 h-9 rounded-full"
                  />

                  <div>
                    <p className="font-medium">{emp.name}</p>
                    <p className="text-gray-400 text-xs">{emp.email}</p>
                  </div>
                </td>

                <td className="p-4">
                  <span className="px-2 py-1 rounded-full text-xs bg-indigo-500/20 text-indigo-400">
                    {emp.role}
                  </span>
                </td>

                <td className="p-4">
                  <span className="text-green-400 text-xs flex items-center gap-1">
                    ● Active
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {employees.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No employees yet
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#020617] border border-white/10 rounded-2xl p-6 w-full max-w-md"
          >
            <h2 className="text-lg font-semibold mb-4">
              Add Employee
            </h2>

            <form onSubmit={handleCreate} className="space-y-3">

              <input
                placeholder="Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm"
                required
              />

              <input
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm"
                required
              />

              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm"
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </select>

              <button className="w-full bg-indigo-600 hover:bg-indigo-500 py-2 rounded-xl text-sm transition">
                Create Employee
              </button>

            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}