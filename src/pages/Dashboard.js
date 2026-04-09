import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth() || {};

  const [stats, setStats] = useState({});
  const [activity, setActivity] = useState([]);
  const [hours, setHours] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await api.get('/dashboard');
      const data = res?.data || {};

      setStats(data.stats || {});
      setActivity(data.activity || []);
      setHours(data.trends?.hours || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={layout}>

      {/* SIDEBAR */}
      <div style={sidebar}>
        <div>
          <h2 style={brand}>FieldSync</h2>

          <Nav label="Dashboard" active onClick={() => navigate('/dashboard')} />
          <Nav label="Schedule" onClick={() => navigate('/schedule')} />
          <Nav label="Holidays" onClick={() => navigate('/holiday-requests')} />
        </div>

        <div>
          <button style={logoutBtn} onClick={() => {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }}>
            Logout
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={main}>

        {/* HEADER */}
        <div style={header}>
          <div>
            <h1 style={title}>Dashboard</h1>
            <p style={subtitle}>Welcome back {user?.name || ''}</p>
          </div>
        </div>

        {/* KPIs */}
        <div style={kpiGrid}>
          <KPI title="Users" value={stats.users || 0} />
          <KPI title="Active Staff" value={stats.activeShifts || 0} />
          <KPI title="Tasks" value={stats.tasks || 0} />
          <KPI title="Completed" value={stats.completedTasks || 0} />
        </div>

        {/* HOURS CHART */}
        <div style={card}>
          <h3 style={cardTitle}>Weekly Hours</h3>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={hours}>
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="#6366f1"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* TOP PERFORMERS */}
        <div style={card}>
          <h3 style={cardTitle}>Top Performers</h3>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={activity}>
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Bar dataKey="action" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ACTIVITY FEED */}
        <div style={card}>
          <h3 style={cardTitle}>Live Activity</h3>

          {activity.length === 0 && (
            <p style={muted}>No recent activity</p>
          )}

          {activity.map((a, i) => (
            <div key={i} style={row}>
              <strong>{a.name}</strong> — {formatAction(a)}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

/* COMPONENTS */

function KPI({ title, value }) {
  return (
    <div style={kpi}>
      <p style={muted}>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

function Nav({ label, onClick, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '10px 12px',
        marginBottom: 6,
        borderRadius: 8,
        border: 'none',
        textAlign: 'left',
        cursor: 'pointer',
        background: active ? '#6366f1' : 'transparent',
        color: active ? 'white' : '#9ca3af'
      }}
    >
      {label}
    </button>
  );
}

/* HELPERS */

const formatAction = (a) => {
  switch (a?.action) {
    case 'clock_in': return 'clocked in';
    case 'clock_out': return 'clocked out';
    case 'task_completed': return 'completed a task';
    case 'task_created': return 'created a task';
    default: return a?.action;
  }
};

/* STYLES */

const layout = {
  display: 'flex',
  minHeight: '100vh',
  background: '#0b0f14',
  color: 'white'
};

const sidebar = {
  width: 230,
  background: '#020617',
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  borderRight: '1px solid #1f2937'
};

const brand = {
  marginBottom: 25
};

const main = {
  flex: 1,
  padding: 30
};

const header = {
  marginBottom: 20
};

const title = { margin: 0 };
const subtitle = { color: '#6b7280' };

const kpiGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 20,
  marginBottom: 20
};

const kpi = {
  background: '#111827',
  padding: 20,
  borderRadius: 10,
  border: '1px solid #1f2937'
};

const card = {
  background: '#111827',
  padding: 20,
  borderRadius: 10,
  marginBottom: 20,
  border: '1px solid #1f2937'
};

const cardTitle = {
  marginBottom: 15
};

const row = {
  marginBottom: 8
};

const muted = {
  color: '#6b7280'
};

const logoutBtn = {
  marginTop: 10,
  padding: 10,
  width: '100%',
  background: '#111827',
  border: '1px solid #1f2937',
  borderRadius: 8,
  color: '#9ca3af',
  cursor: 'pointer'
};

export default Dashboard;