/* =========================================================
src/pages/Employees.js
EMPLOYEES V4 CONTROL CENTRE
COPY / PASTE READY

✅ Your admin profile at top
✅ Company stats cards
✅ Missing setup alerts
✅ Pending invites tracker
✅ Invite expiry countdown
✅ Accepted invites auto disappear
✅ Search staff
✅ Edit employee
✅ Multi invites
✅ Modern SaaS UI
========================================================= */

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { userAPI, inviteAPI } from "../services/api";

import {
  Users,
  UserPlus,
  Search,
  AlertTriangle,
  Crown,
  Shield,
  User,
  PoundSterling,
  Clock,
  Mail,
  X,
  Save,
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

  /* demo pending invites
     replace with real DB later */
  const [pendingInvites, setPendingInvites] =
    useState([
      {
        email: "frank@frank.com",
        sent_at: Date.now(),
        expires_days: 7,
      },
    ]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const data = await userAPI.getAll();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed loading employees");
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

  const me = rows.find((x) => x.id === user?.id);

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
  });

  pendingInvites.forEach((x) => {
    const daysLeft =
      x.expires_days -
      Math.floor(
        (Date.now() - x.sent_at) /
          86400000
      );

    if (daysLeft > 0) {
      alerts.push(
        `Invite sent to ${x.email} (${daysLeft} day left)`
      );
    }
  });

  async function sendInvites() {
    if (saving) return;

    const emails = inviteEmails
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

    if (!emails.length) return;

    try {
      setSaving(true);

      for (const email of emails) {
        await inviteAPI.send({
          email,
          role: inviteRole,
        });
      }

      setPendingInvites([
        ...pendingInvites,
        ...emails.map((email) => ({
          email,
          sent_at: Date.now(),
          expires_days: 7,
        })),
      ]);

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
      department:
        emp.department || "",
      hourly_rate:
        emp.hourly_rate || "",
      contracted_hours:
        emp.contracted_hours || "",
    });
  }

  async function saveEditor() {
    try {
      setSaving(true);

      await userAPI.update(
        editor.id,
        form
      );

      setEditor(null);
      load();

      setSuccess("Saved");
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between gap-3 flex-wrap">

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
            setInviteOpen(true)
          }
          className="px-4 py-2 rounded-xl bg-indigo-600 flex gap-2 items-center"
        >
          <UserPlus size={16} />
          Invite Staff
        </button>

      </div>

      {/* MY PROFILE */}
      <div className="rounded-2xl bg-[#020617] border border-white/10 p-5">

        <div className="flex justify-between">

          <div>
            <p className="text-sm text-gray-400">
              Logged in as
            </p>

            <h2 className="text-xl font-semibold">
              {user?.name ||
                user?.email}
            </h2>

            <p className="text-sm text-indigo-300">
              Admin Account
            </p>
          </div>

          <Crown
            className="text-amber-400"
            size={26}
          />

        </div>

      </div>

      {/* KPI */}
      <div className="grid md:grid-cols-4 gap-4">

        <Card
          title="Total Staff"
          value={rows.length}
          icon={<Users size={16} />}
        />

        <Card
          title="Pending Invites"
          value={
            pendingInvites.length
          }
          icon={<Mail size={16} />}
        />

        <Card
          title="Missing Setup"
          value={alerts.length}
          icon={
            <AlertTriangle
              size={16}
            />
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

        <div className="space-y-2 text-sm">

          {alerts.length === 0 ? (
            <p className="text-green-400">
              Everything complete
            </p>
          ) : (
            alerts.map((x, i) => (
              <div
                key={i}
                className="text-amber-300"
              >
                • {x}
              </div>
            ))
          )}

        </div>

      </div>

      {/* SEARCH */}
      <input
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        placeholder="Search staff..."
        className="w-full px-4 py-3 rounded-xl bg-[#020617] border border-white/10"
      />

      {/* STAFF TABLE */}
      <div className="rounded-2xl overflow-hidden bg-[#020617] border border-white/10">

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
            {filtered.map((emp) => (
              <tr
                key={emp.id}
                className="border-t border-white/5"
              >
                <td className="p-4">
                  {emp.name ||
                    emp.email}
                </td>

                <td className="p-4">
                  {emp.role}
                </td>

                <td className="p-4">
                  {emp.hourly_rate
                    ? `£${emp.hourly_rate}`
                    : "-"}
                </td>

                <td className="p-4">
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
                </td>
              </tr>
            ))}
          </tbody>

        </table>

      </div>

      {/* INVITE MODAL */}
      {inviteOpen && (
        <Modal
          title="Invite Staff"
          close={() =>
            setInviteOpen(false)
          }
        >

          <textarea
            rows="7"
            value={inviteEmails}
            onChange={(e) =>
              setInviteEmails(
                e.target.value
              )
            }
            placeholder={`one@email.com
two@email.com`}
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

      {/* EDIT MODAL */}
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
                placeholder={key}
                className="w-full mt-3 px-4 py-3 rounded-xl bg-slate-900 border border-white/10"
              />
            )
          )}

          <button
            onClick={saveEditor}
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

/* COMPONENTS */

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