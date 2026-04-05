import React, { useEffect, useState } from "react";

// 📅 CALENDAR
import { Calendar, momentLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";

// 📦 STYLES (IMPORTANT)
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

// ⏱ DATE LIB
import moment from "moment";

// 🧩 YOUR APP
import Layout from "../components/Layout";
import { scheduleAPI, userAPI } from "../services/api";

// ✅ SETUP
const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

function ScheduleCalendar() {
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  // 🔄 LOAD DATA
  const loadData = async () => {
    try {
      const [schedRes, usersRes] = await Promise.all([
        scheduleAPI.getAll(),
        userAPI.getAll(),
      ]);

      const usersMap = {};
      usersRes.data.forEach((u) => {
        usersMap[u.id] = u.name || u.email;
      });

      const formatted = (schedRes.data || []).map((s) => ({
        id: s.id,
        title: usersMap[s.user_id] || "Employee",
        start: new Date(s.start_time),
        end: new Date(s.end_time),
      }));

      setEvents(formatted);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.error("Calendar load error:", err);
    }
  };

  // ➕ CREATE SHIFT (click empty slot)
  const handleSelectSlot = async ({ start, end }) => {
    const user_id = prompt("Enter user ID");

    if (!user_id) return;

    try {
      await scheduleAPI.create({
        user_id,
        date: moment(start).format("YYYY-MM-DD"),
        start_time: start,
        end_time: end,
      });

      loadData();
    } catch (err) {
      console.error("Create shift error:", err);
    }
  };

  // 🖱 DRAG SHIFT
  const handleEventDrop = async ({ event, start, end }) => {
    try {
      await scheduleAPI.update(event.id, {
        start_time: start,
        end_time: end,
      });

      loadData();
    } catch (err) {
      console.error("Drag error:", err);
    }
  };

  // 📏 RESIZE SHIFT
  const handleEventResize = async ({ event, start, end }) => {
    try {
      await scheduleAPI.update(event.id, {
        start_time: start,
        end_time: end,
      });

      loadData();
    } catch (err) {
      console.error("Resize error:", err);
    }
  };

  return (
    <Layout>
      <div style={{ padding: 20 }}>
        <h1 style={{ marginBottom: 20 }}>📅 Drag & Drop Schedule</h1>

        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          selectable
          resizable
          defaultView="week"
          views={["month", "week", "day"]}
          step={30}
          timeslots={2}
          style={{ height: "80vh" }}
          onSelectSlot={handleSelectSlot}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          eventPropGetter={() => ({
            style: {
              backgroundColor: "#6366f1",
              borderRadius: "6px",
              border: "none",
            },
          })}
        />
      </div>
    </Layout>
  );
}

export default ScheduleCalendar;