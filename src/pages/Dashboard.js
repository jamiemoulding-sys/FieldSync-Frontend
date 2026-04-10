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
        <h2 style={brand}>FieldSync</h2>

        <div>
          <Nav label="Dashboard" active />
          <Nav label="Work Session" onClick={() => navigate('/work-session')} />
          <Nav label="Tasks" onClick={() => navigate('/tasks')} />

          <Divider />

          <Nav label="Employees" onClick={() => navigate('/employees')} />
          <Nav label="Schedule" onClick={() => navigate('/schedule')} />
          <Nav label="Locations" onClick={() => navigate('/locations')} />
          <Nav label="Holiday Requests" onClick={() => navigate('/holiday-requests')} />
          <Nav label="Timesheets" onClick={() => navigate('/timesheets')} />

          <Divider />

          <Nav label="Reports" onClick={() => navigate('/reports')} />
          <Nav label="Performance" onClick={() => navigate('/performance')} />

          <Divider />

          <Nav label="Profile" onClick={() => navigate('/profile')} />
          <Nav label="Billing" onClick={() => navigate('/billing')} />
        </div>
      </div>

      {/* MAIN */}
      <div style={main}>

        {/* HEADER */}
        <div style={header}>
          <div>
            <h1 style={title}>Dashboard</h1>
            <p style={subtitle}>Real-time overview</p>
          </div>

          <div style={userBox}>
            {user?.email}
          </div>
        </div>

        {/* KPI ROW */}
        <div style={kpiGrid}>
          <KPI title="Users" value={stats.users || 0} />
          <KPI title="Active Staff" value={stats.activeShifts || 0} />
          <KPI title="Tasks" value={stats.tasks || 0} />
          <KPI title="Completed" value={stats.completedTasks || 0} />
        </div>

        {/* 🔥 CHARTS AT TOP (SHORTER HEIGHT) */}
        <div style={chartGrid}>

          <div style={card}>
            <h3 style={cardTitle}>Weekly Hours</h3>

            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={hours}>
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={card}>
            <h3 style={cardTitle}>Top Performers</h3>

            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={activity}>
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="action" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* ACTIVITY */}
        <div style={card}>
          <h3 style={cardTitle}>Live Activity</h3>

          {activity.map((a, i) => (
            <div key={i} style={activityRow}>
              <strong>{a.name}</strong> — {a.action}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

/* COMPONENTS */

function Nav({ label, onClick, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...nav,
        background: active ? '#1e293b' : 'transparent',
        color: active ? '#fff' : '#94a3b8'
      }}
    >
      {label}
    </button>
  );
}

function Divider() {
  return <div style={divider} />;
}

function KPI({ title, value }) {
  return (
    <div style={kpi}>
      <p style={muted}>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

/* STYLES */

const layout = {
  display: 'flex',
  height: '100vh',
  background: '#020617',
  color: 'white'
};

/* 🔥 SIDEBAR WITH GRADIENT SHADING */
const sidebar = {
  width: 240,
  padding: 20,
  background: 'linear-gradient(180deg, #020617 0%, #020617 60%, #0f172a 100%)',
  borderRight: '1px solid #1f2937'
};

const brand = {
  marginBottom: 20
};

const nav = {
  width: '100%',
  padding: 10,
  borderRadius: 8,
  border: 'none',
  textAlign: 'left',
  cursor: 'pointer',
  marginBottom: 4
};

const divider = {
  height: 1,
  background: '#1f2937',
  margin: '12px 0'
};

const main = {
  flex: 1,
  padding: 30
};

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: 20
};

const title = { margin: 0 };
const subtitle = { color: '#94a3b8' };

const userBox = {
  background: '#020617',
  border: '1px solid #1f2937',
  padding: '6px 10px',
  borderRadius: 8
};

const kpiGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 20,
  marginBottom: 20
};

/* 🔥 FIXED CHART SIZE + SPACING */
const chartGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 20,
  marginBottom: 20
};

const kpi = {
  background: '#0f172a',
  padding: 20,
  borderRadius: 12
};

const card = {
  background: '#0f172a',
  padding: 16,
  borderRadius: 12
};

const cardTitle = {
  marginBottom: 10
};

const activityRow = {
  marginBottom: 8
};

const muted = {
  color: '#94a3b8'
};

export default Dashboard;