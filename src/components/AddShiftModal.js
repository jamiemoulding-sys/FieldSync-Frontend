import React, { useState } from "react";

export default function AddShiftModal({
  users,
  form,
  setForm,
  createShift,
  onClose,
}) {
  const [selectedUsers, setSelectedUsers] = useState([]);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      {/* MODAL BOX */}
      <div
        className="bg-[#020617] p-6 w-[320px] rounded-xl space-y-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 text-gray-400 hover:text-white"
        >
          ✕
        </button>

        <div className="text-sm font-semibold">Add Shift</div>

        {/* USERS */}
        <div>
          <div className="text-xs text-gray-400 mb-1">Select staff</div>
          <div className="max-h-[140px] overflow-y-auto border border-white/10 rounded p-2 space-y-1">
            {users.map((u) => (
              <label
                key={u.id}
                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white/5 p-1 rounded"
              >
                <input
                  type="checkbox"
                  className="accent-indigo-500"
                  checked={selectedUsers.includes(u.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers([...selectedUsers, u.id]);
                    } else {
                      setSelectedUsers(
                        selectedUsers.filter((id) => id !== u.id)
                      );
                    }
                  }}
                />
                {u.name}
              </label>
            ))}
          </div>
        </div>

        {/* DATE */}
        <input
          type="date"
          className="w-full p-2 bg-[#020617] text-white border border-white/10 rounded"
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />

        {/* TIMES */}
        <div className="flex gap-2">
          <input
            type="time"
            value={form.start}
            className="w-1/2 p-2 bg-[#020617] text-white border border-white/10 rounded"
            onChange={(e) => setForm({ ...form, start: e.target.value })}
          />
          <input
            type="time"
            value={form.end}
            className="w-1/2 p-2 bg-[#020617] text-white border border-white/10 rounded"
            onChange={(e) => setForm({ ...form, end: e.target.value })}
          />
        </div>

        {/* ACTIONS */}
        <div className="space-y-2 pt-2">
          {/* BULK */}
          <button
            className="bg-indigo-600 hover:bg-indigo-500 w-full p-2 rounded"
            onClick={() => {
              if (!form.date) return alert("Pick a date");
              if (selectedUsers.length === 0)
                return alert("Select users");

              selectedUsers.forEach((userId) => {
                createShift({
                  user_id: userId,
                  date: form.date,
                  start_time: `${form.date}T${form.start}:00`,
                  end_time: `${form.date}T${form.end}:00`,
                });
              });

              onClose();
            }}
          >
            Bulk Add
          </button>

          {/* SINGLE */}
          <button
            className="bg-green-600 hover:bg-green-500 w-full p-2 rounded"
            onClick={() => {
              if (!form.user_id) return alert("Pick a user");

              createShift({
                user_id: form.user_id,
                date: form.date,
                start_time: `${form.date}T${form.start}:00`,
                end_time: `${form.date}T${form.end}:00`,
              });

              onClose();
            }}
          >
            Add Single
          </button>

          {/* CANCEL */}
          <button
            onClick={onClose}
            className="w-full p-2 border border-white/10 rounded hover:bg-white/5"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}