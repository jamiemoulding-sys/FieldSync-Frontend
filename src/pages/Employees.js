/* =========================================================
src/pages/Employees.js
EMPLOYEES V5 FULL FILE
COPY / PASTE READY

✅ Real data only
✅ Role changing fixed
✅ Delete employee (2 step confirm)
✅ Admin summary cards
✅ Action needed alerts
✅ Multi invite staff
✅ Full employee profile modal
✅ Start date / phone / payroll / rates
✅ Overtime + night fallback to hourly
========================================================= */

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  userAPI,
  inviteAPI,
} from "../services/api";

import {
  Users,
  UserPlus,
  Search,
  AlertTriangle,
  Crown,
  Shield,
  Mail,
  X,
  Save,
  Trash2,
} from "lucide-react";

export default function Employees() {
  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [pendingInvites, setPendingInvites] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [inviteOpen, setInviteOpen] =
    useState(false);

  const [inviteEmails, setInviteEmails] =
    useState("");

  const [inviteRole, setInviteRole] =
    useState("employee");

  const [editor, setEditor] =
    useState(null);

  const [form, setForm] =
    useState({});

  const [success, setSuccess] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    load();
    loadInvites();
  }, []);

  async function load() {
    try {
      setLoading(true);

      const data =
        await userAPI.getAll();

      setRows(
        Array.isArray(data)
          ? data
          : []
      );
    } catch {
      setError(
        "Failed loading employees"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadInvites() {
    try {
      if (
        inviteAPI.getAll
      ) {
        const data =
          await inviteAPI.getAll();

        setPendingInvites(
          Array.isArray(data)
            ? data
            : []
        );
      }
    } catch {
      setPendingInvites([]);
    }
  }

  const filtered = useMemo(() => {
    const q =
      search.toLowerCase();

    return rows.filter(
      (x) =>
        x.name
          ?.toLowerCase()
          .includes(q) ||
        x.email
          ?.toLowerCase()
          .includes(q)
    );
  }, [rows, search]);

  const alerts = [];

  rows.forEach((x) => {
    if (!x.hourly_rate) {
      alerts.push(
        `${x.name || x.email} needs pay rate`
      );
    }

    if (!x.department) {
      alerts.push(
        `${x.name || x.email} needs department`
      );
    }

    if (
      !x.contracted_hours
    ) {
      alerts.push(
        `${x.name || x.email} needs contracted hours`
      );
    }
  });

  pendingInvites.forEach(
    (x) => {
      const sent =
        new Date(
          x.created_at
        ).getTime();

      const daysLeft =
        7 -
        Math.floor(
          (Date.now() -
            sent) /
            86400000
        );

      if (
        x.accepted !==
          true &&
        daysLeft > 0
      ) {
        alerts.push(
          `Invite sent to ${x.email} (${daysLeft} day left)`
        );
      }
    }
  );

  async function updateRole(
    id,
    role
  ) {
    try {
      await userAPI.update(
        id,
        { role }
      );

      await load();

      setSuccess(
        "Role updated"
      );
    } catch {
      setError(
        "Failed to update role"
      );
    }
  }

  async function removeUser(
    id,
    name
  ) {
    const first =
      window.confirm(
        `Delete ${name}?`
      );

    if (!first) return;

    const second =
      window.confirm(
        `FINAL WARNING:\nThis permanently deletes ${name}`
      );

    if (!second) return;

    try {
      await userAPI.delete(
        id
      );

      await load();

      setSuccess(
        "Employee deleted"
      );
    } catch {
      setError(
        "Delete failed"
      );
    }
  }

  async function sendInvites() {
    const emails =
      inviteEmails
        .split("\n")
        .map((x) =>
          x.trim()
        )
        .filter(Boolean);

    if (!emails.length)
      return;

    try {
      setSaving(true);

      for (const email of emails) {
        await inviteAPI.send({
          email,
          role:
            inviteRole,
        });
      }

      await loadInvites();

      setInviteEmails(
        ""
      );

      setInviteOpen(
        false
      );

      setSuccess(
        `${emails.length} invite(s) sent`
      );
    } catch {
      setError(
        "Invite failed"
      );
    } finally {
      setSaving(false);
    }
  }

  function openEditor(emp) {
    setEditor(emp);

    setForm({
      name:
        emp.name || "",
      phone:
        emp.phone || "",
      department:
        emp.department ||
        "",
      job_title:
        emp.job_title ||
        "",
      payroll_id:
        emp.payroll_id ||
        "",
      emergency_contact:
        emp.emergency_contact ||
        "",

      start_date:
        emp.start_date ||
        "",

      hourly_rate:
        emp.hourly_rate ||
        "",

      overtime_rate:
        emp.overtime_rate ||
        emp.hourly_rate ||
        "",

      night_rate:
        emp.night_rate ||
        emp.hourly_rate ||
        "",

      contracted_hours:
        emp.contracted_hours ||
        "",

      holiday_allowance:
        emp.holiday_allowance ||
        "",

      status:
        emp.status ||
        "active",
    });
  }

  async function saveEditor() {
    try {
      setSaving(true);

      await userAPI.update(
        editor.id,
        {
          ...form,
          overtime_rate:
            form.overtime_rate ||
            form.hourly_rate,
          night_rate:
            form.night_rate ||
            form.hourly_rate,
        }
      );

      setEditor(null);

      await load();

      setSuccess(
        "Employee updated"
      );
    } catch {
      setError(
        "Save failed"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between gap-4 flex-wrap">

        <div>
          <h1 className="text-3xl font-bold">
            Employees
          </h1>

          <p className="text-sm text-gray-400">
            Workforce Control Centre
          </p>
        </div>

        <button
          onClick={() =>
            setInviteOpen(
              true
            )
          }
          className="px-4 py-2 rounded-xl bg-indigo-600 flex gap-2 items-center"
        >
          <UserPlus size={16} />
          Invite Staff
        </button>

      </div>

      {/* MESSAGES */}
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

      {/* PROFILE */}
      <div className="rounded-2xl bg-[#020617] border border-white/10 p-5 flex justify-between">

        <div>
          <p className="text-sm text-gray-400">
            Logged in as
          </p>

          <h2 className="text-xl font-semibold">
            {user?.name ||
              user?.email}
          </h2>

          <p className="text-sm text-indigo-300">
            Admin
          </p>
        </div>

        <Crown
          className="text-amber-400"
          size={26}
        />

      </div>

      {/* KPI */}
      <div className="grid md:grid-cols-4 gap-4">

        <Card
          title="Total Staff"
          value={
            rows.length
          }
          icon={
            <Users size={16} />
          }
        />

        <Card
          title="Pending Invites"
          value={
            pendingInvites.length
          }
          icon={
            <Mail size={16} />
          }
        />

        <Card
          title="Needs Action"
          value={
            alerts.length
          }
          icon={
            <AlertTriangle size={16} />
          }
        />

        <Card
          title="Managers"
          value={
            rows.filter(
              (x) =>
                x.role ===
                "manager"
            ).length
          }
          icon={
            <Shield size={16} />
          }
        />

      </div>

      {/* ALERTS */}
      <div className="rounded-2xl bg-[#020617] border border-white/10 p-5">

        <h3 className="font-semibold mb-3">
          Action Needed
        </h3>

        {!alerts.length ? (
          <p className="text-green-400 text-sm">
            Everything complete
          </p>
        ) : (
          <div className="space-y-2 text-sm">
            {alerts.map(
              (
                x,
                i
              ) => (
                <div
                  key={
                    i
                  }
                  className="text-amber-300"
                >
                  • {x}
                </div>
              )
            )}
          </div>
        )}

      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-4 top-4 text-gray-500"
        />

        <input
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          placeholder="Search employees..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#020617] border border-white/10"
        />
      </div>

      {/* TABLE */}
      <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#020617]">

        <table className="w-full text-sm">

          <thead className="bg-white/5 text-gray-400">
            <tr>
              <th className="p-4 text-left">
                User
              </th>
              <th className="p-4 text-left">
                Role
              </th>
              <th className="p-4 text-left">
                Rate
              </th>
              <th className="p-4 text-left">
                Action
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
              filtered.map(
                (
                  emp
                ) => (
                  <tr
                    key={
                      emp.id
                    }
                    className="border-t border-white/5"
                  >
                    <td className="p-4">
                      {emp.name ||
                        emp.email}
                    </td>

                    <td className="p-4">
                      <select
                        value={
                          emp.role ||
                          "employee"
                        }
                        onChange={(
                          e
                        ) =>
                          updateRole(
                            emp.id,
                            e.target
                              .value
                          )
                        }
                        className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10"
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
                    </td>

                    <td className="p-4">
                      {emp.hourly_rate
                        ? `£${emp.hourly_rate}`
                        : "-"}
                    </td>

                    <td className="p-4">
                      <div className="flex gap-3">

                        <button
                          onClick={() =>
                            openEditor(
                              emp
                            )
                          }
                          className="text-indigo-400"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            removeUser(
                              emp.id,
                              emp.name ||
                                emp.email
                            )
                          }
                          className="text-red-400"
                        >
                          <Trash2 size={15} />
                        </button>

                      </div>
                    </td>

                  </tr>
                )
              )
            )}

          </tbody>

        </table>

      </div>

      {/* INVITE MODAL */}
      {inviteOpen && (
        <Modal
          title="Invite Staff"
          close={() =>
            setInviteOpen(
              false
            )
          }
        >

          <textarea
            rows="7"
            value={
              inviteEmails
            }
            onChange={(e) =>
              setInviteEmails(
                e.target
                  .value
              )
            }
            placeholder={`one@email.com
two@email.com`}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10"
          />

          <select
            value={
              inviteRole
            }
            onChange={(e) =>
              setInviteRole(
                e.target
                  .value
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
            onClick={
              sendInvites
            }
            disabled={
              saving
            }
            className="w-full mt-4 py-3 rounded-xl bg-indigo-600"
          >
            {saving
              ? "Sending..."
              : "Send Invites"}
          </button>

        </Modal>
      )}

      {/* EDIT MODAL */}
      {editor && (
        <Modal
          title={`Employee Profile - ${editor.name}`}
          close={() =>
            setEditor(
              null
            )
          }
        >

          <div className="rounded-xl bg-white/5 p-4 mb-4 text-sm space-y-1">
            <p>
              Email:{" "}
              {editor.email}
            </p>

            <p>
              Role:{" "}
              {editor.role}
            </p>

            <p>
              Joined:{" "}
              {editor.created_at
                ? new Date(
                    editor.created_at
                  ).toLocaleDateString()
                : "-"}
            </p>
          </div>

          {Object.keys(
            form
          ).map(
            (
              key
            ) => (
              <input
                key={
                  key
                }
                value={
                  form[
                    key
                  ]
                }
                onChange={(
                  e
                ) =>
                  setForm(
                    {
                      ...form,
                      [key]:
                        e
                          .target
                          .value,
                    }
                  )
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
            onClick={
              saveEditor
            }
            className="w-full mt-4 py-3 rounded-xl bg-indigo-600 flex justify-center gap-2"
          >
            <Save size={16} />
            Save
          </button>

        </Modal>
      )}

    </div>
  );
}

function Card({
  title,
  value,
  icon,
}) {
  return (
    <div className="rounded-2xl bg-[#020617] border border-white/10 p-5">
      <div className="flex justify-between">
        <p className="text-xs text-gray-400">
          {title}
        </p>

        <div className="text-indigo-400">
          {icon}
        </div>
      </div>

      <h2 className="text-2xl font-semibold mt-2">
        {value}
      </h2>
    </div>
  );
}

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