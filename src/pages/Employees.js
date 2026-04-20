/* =========================================================
src/pages/Employees.js
EMPLOYEES V3 ELITE
COPY / PASTE READY

✅ Multi user invites
✅ Bulk paste emails
✅ Edit employee modal
✅ Delete employee
✅ Wage / department / contracts
✅ Search + filters
✅ Success / error states
✅ Loading states
✅ Modern UI
========================================================= */

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { userAPI, inviteAPI } from "../services/api";

import {
  Users,
  Search,
  UserPlus,
  RefreshCw,
  X,
  Mail,
  Trash2,
  Pencil,
  Save,
  Crown,
  Shield,
  User,
} from "lucide-react";

export default function Employees() {
  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteRole, setInviteRole] = useState("employee");

  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState({});

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const data = await userAPI.getAll();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed loading staff");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return rows.filter(
      (x) =>
        x.name?.toLowerCase().includes(q) ||
        x.email?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  async function sendInvites() {
    if (saving) return;

    const emails = inviteEmails
      .split("\n")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);

    if (!emails.length) {
      setError("Enter email addresses");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      for (const email of emails) {
        await inviteAPI.send({
          email,
          role: inviteRole,
        });
      }

      setInviteEmails("");
      setInviteOpen(false);

      setSuccess(
        `${emails.length} invite(s) sent`
      );
    } catch {
      setError("Invite failed");
    } finally {
      setSaving(false);
    }
  }

  function openEditor(emp) {
    setEditor(emp);

    setForm({
      name: emp.name || "",
      department: emp.department || "",
      hourly_rate: emp.hourly_rate || "",
      contracted_hours:
        emp.contracted_hours || "",
      status: emp.status || "active",
    });
  }

  async function saveEditor() {
    try {
      setSaving(true);

      await userAPI.update(editor.id, form);

      setEditor(null);
      await load();

      setSuccess("Employee updated");
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function removeUser(id) {
    if (!window.confirm("Delete employee?"))
      return;

    try {
      await userAPI.delete(id);
      await load();
    } catch {
      setError("Delete failed");
    }
  }

  if (user?.role === "employee") {
    return <div>No access</div>;
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between flex-wrap gap-4">

        <div>
          <h1 className="text-3xl font-bold flex gap-2 items-center">
            <Users size={24} />
            Employees
          </h1>

          <p className="text-sm text-gray-400">
            Workforce control centre
          </p>
        </div>

        <div className="flex gap-2">

          <button
            onClick={load}
            className="px-4 py-2 rounded-xl bg-white/5"
          >
            <RefreshCw size={16} />
          </button>

          <button
            onClick={() =>
              setInviteOpen(true)
            }
            className="px-4 py-2 rounded-xl bg-indigo-600 flex gap-2 items-center"
          >
            <UserPlus size={16} />
            Invite
          </button>

        </div>

      </div>

      {/* ALERTS */}
      {success && (
        <div className="rounded-xl bg-green-500/10 text-green-300 px-4 py-3">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-500/10 text-red-300 px-4 py-3">
          {error}
        </div>
      )}

      {/* SEARCH */}
      <div className="relative">

        <Search
          size={16}
          className="absolute left-4 top-4 text-gray-500"
        />

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search staff..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#020617] border border-white/10"
        />

      </div>

      {/* TABLE */}
      <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#020617]">

        <table className="w-full text-sm">

          <thead className="bg-white/5 text-gray-400">
            <tr>
              <th className="p-4 text-left">
                Name
              </th>
              <th className="p-4 text-left">
                Role
              </th>
              <th className="p-4 text-left">
                Rate
              </th>
              <th className="p-4 text-left">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td
                  colSpan="4"
                  className="p-6 text-center text-gray-400"
                >
                  Loading...
                </td>
              </tr>
            ) : (
              filtered.map((emp) => (
                <tr
                  key={emp.id}
                  className="border-t border-white/5"
                >

                  <td className="p-4">
                    <div>
                      <p>
                        {emp.name || "-"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {emp.email}
                      </p>
                    </div>
                  </td>

                  <td className="p-4">
                    {emp.role === "admin" ? (
                      <span className="text-amber-400 flex gap-1 items-center">
                        <Crown size={14} />
                        Admin
                      </span>
                    ) : emp.role ===
                      "manager" ? (
                      <span className="text-blue-400 flex gap-1 items-center">
                        <Shield size={14} />
                        Manager
                      </span>
                    ) : (
                      <span className="text-gray-300 flex gap-1 items-center">
                        <User size={14} />
                        Employee
                      </span>
                    )}
                  </td>

                  <td className="p-4">
                    {emp.hourly_rate
                      ? `£${emp.hourly_rate}`
                      : "-"}
                  </td>

                  <td className="p-4 flex gap-3">

                    <button
                      onClick={() =>
                        openEditor(emp)
                      }
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() =>
                        removeUser(emp.id)
                      }
                      className="text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>

                  </td>

                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>

      {/* MULTI INVITE */}
      {inviteOpen && (
        <Modal
          title="Invite Staff"
          close={() =>
            setInviteOpen(false)
          }
        >

          <textarea
            rows="8"
            value={inviteEmails}
            onChange={(e) =>
              setInviteEmails(
                e.target.value
              )
            }
            placeholder={`one@email.com
two@email.com
three@email.com`}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10"
          />

          <select
            value={inviteRole}
            onChange={(e) =>
              setInviteRole(
                e.target.value
              )
            }
            className="w-full mt-3 px-4 py-3 rounded-xl bg-slate-900 border border-white/10"
          >
            <option value="employee">
              Employee
            </option>
            <option value="manager">
              Manager
            </option>
            <option value="admin">
              Admin
            </option>
          </select>

          <button
            onClick={sendInvites}
            disabled={saving}
            className="w-full mt-4 py-3 rounded-xl bg-indigo-600"
          >
            {saving
              ? "Sending..."
              : "Send Invites"}
          </button>

        </Modal>
      )}

      {/* EDITOR */}
      {editor && (
        <Modal
          title={`Edit ${editor.name}`}
          close={() =>
            setEditor(null)
          }
        >

          {Object.keys(form).map(
            (key) => (
              <input
                key={key}
                value={form[key]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [key]:
                      e.target.value,
                  })
                }
                placeholder={key.replaceAll(
                  "_",
                  " "
                )}
                className="w-full mt-3 px-4 py-3 rounded-xl bg-slate-900 border border-white/10"
              />
            )
          )}

          <button
            onClick={saveEditor}
            className="w-full mt-4 py-3 rounded-xl bg-indigo-600 flex justify-center gap-2"
          >
            <Save size={16} />
            Save Changes
          </button>

        </Modal>
      )}

    </div>
  );
}

/* MODAL */

function Modal({
  title,
  close,
  children,
}) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-2xl bg-[#020617] border border-white/10 p-6">

        <div className="flex justify-between mb-4">

          <h2 className="font-semibold">
            {title}
          </h2>

          <button onClick={close}>
            <X size={18} />
          </button>

        </div>

        {children}

      </div>
    </div>
  );
}