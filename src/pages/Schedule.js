import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { userAPI, scheduleAPI } from '../services/api';

function Schedule() {
  const [users, setUsers] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [selectedUser, setSelectedUser] = useState('');
  const [date, setDate] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, schedRes] = await Promise.all([
        userAPI.getAll(),
        scheduleAPI.getAll()
      ]);

      setUsers(usersRes.data || []);
      setSchedules(schedRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const createSchedule = async () => {
    if (!selectedUser || !date || !start || !end) {
      return alert('Fill all fields');
    }

    try {
      await scheduleAPI.create({
        user_id: selectedUser,
        date,
        start_time: `${date}T${start}`,
        end_time: `${date}T${end}`
      });

      // reset
      setSelectedUser('');
      setDate('');
      setStart('');
      setEnd('');

      loadData();

    } catch (err) {
      console.error(err);
      alert('Failed to create schedule');
    }
  };

  const deleteSchedule = async (id) => {
    try {
      await scheduleAPI.delete(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Layout>
      <div style={{ padding: 10 }}>

        <h1 style={{ marginBottom: 20 }}>📅 Schedule Manager</h1>

        {/* CREATE SHIFT */}
        <div style={card}>
          <h3 style={{ marginBottom: 15 }}>Assign Shift</h3>

          <div style={formRow}>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              style={input}
            >
              <option value="">Select Employee</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={input}
            />

            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              style={input}
            />

            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              style={input}
            />

            <button onClick={createSchedule} style={primaryBtn}>
              Add
            </button>
          </div>
        </div>

        {/* SCHEDULE LIST */}
        <div style={{ marginTop: 30 }}>
          <h3 style={{ marginBottom: 10 }}>Upcoming Shifts</h3>

          {schedules.length === 0 && (
            <p style={{ color: '#9ca3af' }}>No schedules yet</p>
          )}

          {schedules.map(s => (
            <div key={s.id} style={row}>
              <div>
                <strong>{s.name}</strong>
                <div style={{ color: '#9ca3af', fontSize: 14 }}>
                  {formatDate(s.date)} | {formatTime(s.start_time)} - {formatTime(s.end_time)}
                </div>
              </div>

              <button
                onClick={() => deleteSchedule(s.id)}
                style={deleteBtn}
              >
                Delete
              </button>
            </div>
          ))}
        </div>

      </div>
    </Layout>
  );
}

// 📅 FORMAT DATE
function formatDate(d) {
  return new Date(d).toLocaleDateString();
}

// ⏱ FORMAT TIME
function formatTime(t) {
  return new Date(t).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 🎨 STYLES
const card = {
  background: '#111827',
  padding: 20,
  borderRadius: 10
};

const formRow = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10
};

const input = {
  padding: 10,
  borderRadius: 6,
  border: 'none',
  background: '#1f2937',
  color: 'white'
};

const row = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 15,
  background: '#111827',
  borderRadius: 10,
  marginBottom: 10
};

const primaryBtn = {
  padding: 10,
  background: '#6366f1',
  border: 'none',
  borderRadius: 6,
  color: 'white',
  cursor: 'pointer'
};

const deleteBtn = {
  padding: 8,
  background: '#ef4444',
  border: 'none',
  borderRadius: 6,
  color: 'white',
  cursor: 'pointer'
};

export default Schedule;