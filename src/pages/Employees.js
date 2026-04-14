import {
  useState,
  useEffect,
} from "react";

import {
  useAuth,
} from "../hooks/useAuth";

import {
  userAPI,
  inviteAPI,
} from "../services/api";

import { motion } from "framer-motion";

import {
  Users,
  Search,
  Mail,
  Shield,
  Trash2,
  UserPlus,
  Crown,
  User,
  RefreshCw,
} from "lucide-react";

export default function Employees() {
  const { user } =
    useAuth();

  const [employees, setEmployees] =
    useState([]);

  const [filtered, setFiltered] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState("all");

  const [inviteOpen, setInviteOpen] =
    useState(false);

  const [inviteEmail, setInviteEmail] =
    useState("");

  const [inviteRole, setInviteRole] =
    useState("employee");

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    let data = [...employees];

    if (roleFilter !== "all") {
      data = data.filter(
        (u) =>
          u.role ===
          roleFilter
      );
    }

    if (search.trim()) {
      const q =
        search.toLowerCase();

      data = data.filter(
        (u) =>
          u.email
            ?.toLowerCase()
            .includes(q) ||
          u.name
            ?.toLowerCase()
            .includes(q)
      );
    }

    setFiltered(data);
  }, [
    employees,
    search,
    roleFilter,
  ]);

  const loadEmployees =
    async () => {
      try {
        setLoading(true);

        const data =
          await userAPI.getAll();

        setEmployees(
          Array.isArray(data)
            ? data
            : []
        );
      } catch {
        alert(
          "Failed to load staff"
        );
      } finally {
        setLoading(false);
      }
    };

  const updateRole =
    async (
      id,
      role
    ) => {
      try {
        setSaving(true);

        await userAPI.update(
          id,
          { role }
        );

        await loadEmployees();
      } catch {
        alert(
          "Failed to update role"
        );
      } finally {
        setSaving(false);
      }
    };

  const removeUser =
    async (id) => {
      if (
        !window.confirm(
          "Delete this employee?"
        )
      )
        return;

      try {
        setSaving(true);

        await userAPI.delete(id);

        await loadEmployees();
      } catch {
        alert(
          "Delete failed"
        );
      } finally {
        setSaving(false);
      }
    };

  const sendInvite =
    async () => {
      try {
        if (!inviteEmail) {
          return alert(
            "Enter email"
          );
        }

        setSaving(true);

        await inviteAPI.send({
          email:
            inviteEmail,
          role:
            inviteRole,
        });

        alert(
          "Invite sent"
        );

        setInviteOpen(
          false
        );

        setInviteEmail(
          ""
        );

        setInviteRole(
          "employee"
        );
      } catch {
        alert(
          "Invite failed"
        );
      } finally {
        setSaving(false);
      }
    };

  if (
    user?.role ===
    "employee"
  ) {
    return (
      <div className="text-gray-400">
        No access
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Users size={22} />
            Employees
          </h1>

          <p className="text-sm text-gray-400 mt-1">
            Manage team members
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={
              loadEmployees
            }
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-2 text-sm"
          >
            <RefreshCw
              size={15}
            />
            Refresh
          </button>

          <button
            onClick={() =>
              setInviteOpen(
                true
              )
            }
            className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl text-sm flex items-center gap-2"
          >
            <UserPlus
              size={16}
            />
            Invite
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-4 top-4 text-gray-500"
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target
                  .value
              )
            }
            placeholder="Search employee..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#020617] border border-white/10 text-white"
          />
        </div>

        <select
          value={
            roleFilter
          }
          onChange={(e) =>
            setRoleFilter(
              e.target
                .value
            )
          }
          className="rounded-xl bg-[#020617] border border-white/10 px-4 py-3 text-white"
        >
          <option value="all">
            All Roles
          </option>
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
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <StatCard
          title="Total Staff"
          value={
            employees.length
          }
        />

        <StatCard
          title="Managers"
          value={
            employees.filter(
              (x) =>
                x.role ===
                "manager"
            ).length
          }
        />

        <StatCard
          title="Admins"
          value={
            employees.filter(
              (x) =>
                x.role ===
                "admin"
            ).length
          }
        />
      </div>

      <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#020617]">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-gray-400">
            <tr>
              <th className="text-left p-4">
                User
              </th>
              <th className="text-left p-4">
                Role
              </th>
              <th className="text-left p-4">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {!loading &&
              filtered.map(
                (
                  emp,
                  i
                ) => (
                  <motion.tr
                    key={
                      emp.id
                    }
                    initial={{
                      opacity: 0,
                      y: 10,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        i *
                        0.03,
                    }}
                    className="border-t border-white/5 hover:bg-white/5"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-semibold">
                          {(
                            emp.name ||
                            emp.email
                          )
                            .charAt(
                              0
                            )
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="text-white">
                            {emp.name ||
                              "Unnamed"}
                          </p>

                          <p className="text-xs text-gray-400">
                            {
                              emp.email
                            }
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      {emp.id ===
                      user?.id ? (
                        <RoleBadge
                          role={
                            emp.role
                          }
                        />
                      ) : (
                        <select
                          disabled={
                            saving
                          }
                          value={
                            emp.role
                          }
                          onChange={(
                            e
                          ) =>
                            updateRole(
                              emp.id,
                              e
                                .target
                                .value
                            )
                          }
                          className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-xs min-w-[130px]"
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
                      )}
                    </td>

                    <td className="p-4">
                      {emp.id !==
                        user?.id && (
                        <button
                          onClick={() =>
                            removeUser(
                              emp.id
                            )
                          }
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2
                            size={
                              16
                            }
                          />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                )
              )}
          </tbody>
        </table>

        {!loading &&
          filtered.length ===
            0 && (
            <div className="p-6 text-center text-gray-500">
              No employees found
            </div>
          )}

        {loading && (
          <div className="p-6 text-center text-gray-400">
            Loading...
          </div>
        )}
      </div>

      {inviteOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-6">
          <div className="w-full max-w-md rounded-2xl bg-[#020617] border border-white/10 p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Mail size={18} />
              Invite Employee
            </h2>

            <input
              value={
                inviteEmail
              }
              onChange={(e) =>
                setInviteEmail(
                  e.target
                    .value
                )
              }
              placeholder="Email"
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white"
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
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white"
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
                sendInvite
              }
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500"
            >
              {saving
                ? "Sending..."
                : "Send Invite"}
            </button>

            <button
              onClick={() =>
                setInviteOpen(
                  false
                )
              }
              className="w-full text-sm text-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RoleBadge({
  role,
}) {
  const map = {
    admin:
      "bg-red-500/20 text-red-400",
    manager:
      "bg-indigo-500/20 text-indigo-400",
    employee:
      "bg-emerald-500/20 text-emerald-400",
  };

  const icons = {
    admin:
      <Crown size={12} />,
    manager:
      <Shield size={12} />,
    employee:
      <User size={12} />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs capitalize ${map[role]}`}
    >
      {icons[role]}
      {role}
    </span>
  );
}

function StatCard({
  title,
  value,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#020617] p-4">
      <p className="text-xs text-gray-400">
        {title}
      </p>

      <h2 className="text-2xl font-semibold mt-2">
        {value}
      </h2>
    </div>
  );
}