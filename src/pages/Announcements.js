import { useEffect, useState } from "react";
import api from "../services/api";

export default function Announcements() {
  const [items, setItems] = useState([]);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await api.get("/announcements");
    setItems(res.data || []);
  };

  const submit = async () => {
    await api.post("/announcements", {
      title,
      message,
      priority,
    });

    setTitle("");
    setMessage("");
    setPriority("normal");

    load();
  };

  const remove = async (id) => {
    await api.delete(`/announcements/${id}`);
    load();
  };

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-semibold">
          Announcements
        </h1>

        <p className="text-sm text-gray-400">
          Send company-wide messages
        </p>
      </div>

      {/* CREATE */}
      <div className="p-6 rounded-2xl bg-[#020617] border border-white/10 space-y-4">

        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-[#111827]"
        />

        <textarea
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-[#111827] min-h-[120px]"
        />

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-[#111827]"
        >
          <option value="normal">Normal</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>

        <button
          onClick={submit}
          className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500"
        >
          Send Announcement
        </button>

      </div>

      {/* LIST */}
      <div className="space-y-3">

        {items.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-2xl bg-[#020617] border border-white/10"
          >
            <div className="flex justify-between">

              <div>
                <p className="font-semibold">
                  {item.title}
                </p>

                <p className="text-sm text-gray-400 mt-1">
                  {item.message}
                </p>

                <p className="text-xs mt-2 text-indigo-400">
                  {item.priority}
                </p>
              </div>

              <button
                onClick={() => remove(item.id)}
                className="text-red-400"
              >
                Delete
              </button>

            </div>
          </div>
        ))}

      </div>

    </div>
  );
}