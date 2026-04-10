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
  const [showBilling, setShowBilling] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await api.get('/dashboard');
      const data = res?.data || {};

      setStats(data.stats || {});
      setActivity(data.topPerformers || []);
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

          <Section title="Core">
            <Nav label="Dashboard" active />
            <Nav label="Work Session" onClick={() => navigate('/work-session')} />
            <Nav label="Tasks" onClick={() => navigate('/tasks')} />
          </Section>

          <Section title="Management">
            <Nav label="Employees" onClick={() => navigate('/employees')} />
            <Nav label="Schedule" onClick={() => navigate('/schedule')} />
            <Nav label="Locations" onClick={() => navigate('/locations')} />
            <Nav label="Holiday Requests" onClick={() => navigate('/holiday-requests')} />
            <Nav label="Timesheets" onClick={() => navigate('/timesheets')} />
          </Section>

          <Section title="Business">
            <Nav label="Reports" onClick={() => navigate('/reports')} />
            <Nav label="Performance" onClick={() => navigate('/performance')} />
          </Section>

          <Section title="Account">
            <Nav label="Profile" onClick={() => navigate('/profile')} />

            <Nav
              label="Billing ▾"
              onClick={() => setShowBilling(!showBilling)}
            />

            {showBilling && (
              <div style={subMenu}>
                <Nav label="Plans" onClick={() => navigate('/billing')} />
                <Nav label="Invoices" onClick={() => navigate('/billing')} />
              </div>
            )}
          </Section>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }}
          style={logoutBtn}
        >
          Logout
        </button>
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

        {/* KPI CARDS */}
        <div style={kpiGrid}>
          <KPI title="Users" value={stats.users || 0} color="#3b82f6" />
          <KPI title="Active Staff" value={stats.activeShifts || 0} color="#ef4444" />
          <KPI title="Tasks" value={stats.tasks || 0} color="#f59e0b" />
          <KPI title="Completed" value={stats.completedTasks || 0} color="#10b981" />
        </div>

        {/* CHARTS */}
        <div style={chartGrid}>

          {/* HOURS */}
          <div style={glassCard}>
            <h3 style={cardTitle}>Weekly Hours</h3>

            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={hours}>
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="hours" stroke="#60a5fa" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* TOP USERS */}
          <div style={glassCard}>
            <h3 style={cardTitle}>Top Performers</h3>

            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={activity}>
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="completed" fill="#34d399" />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* ACTIVITY */}
        <div style={glassCard}>
          <h3 style={cardTitle}>Live Activity</h3>

          {activity.length === 0 && (
            <p style={muted}>No recent activity</p>
          )}

          {activity.map((a, i) => (
            <div key={i} style={activityRow}>
              <strong>{a.name}</strong> — {a.completed} tasks
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
        background: active ? 'rgba(99,102,241,0.2)' : 'transparent',
        color: active ? '#fff' : '#94a3b8'
      }}
    >
      {label}
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={sectionTitle}>{title}</p>
      {children}
    </div>
  );
}

function KPI({ title, value, color }) {
  return (
    <div style={{
      ...kpi,
      background: `linear-gradient(135deg, ${color}22, #020617)`
    }}>
      <p style={muted}>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

/* STYLES */

const layout = {
  display: 'flex',
  height: '100vh',
  background: 'radial-gradient(circle at top, #0f172a, #020617)',
  color: 'white'
};

const sidebar = {
  width: 240,
  padding: 20,
  background: '#020617',
  borderRight: '1px solid #1f2937',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
};

const brand = { marginBottom: 20 };

const sectionTitle = {
  fontSize: 11,
  color: '#64748b',
  marginBottom: 6,
  textTransform: 'uppercase'
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

const subMenu = { paddingLeft: 10 };

const main = {
  flex: 1,
  padding: 30
};

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: 25
};

const title = { margin: 0 };
const subtitle = { color: '#94a3b8' };

const userBox = {
  background: '#020617',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #1f2937'
};

const kpiGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 20,
  marginBottom: 20
};

const chartGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 20,
  marginBottom: 20
};

const kpi = {
  padding: 20,
  borderRadius: 12
};

const glassCard = {
  background: 'rgba(15,23,42,0.7)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.05)',
  padding: 20,
  borderRadius: 16
};

const cardTitle = { marginBottom: 15 };

const activityRow = {
  marginBottom: 8
};

const muted = { color: '#94a3b8' };

const logoutBtn = {
  padding: 10,
  background: '#020617',
  border: '1px solid #1f2937',
  borderRadius: 8,
  color: '#94a3b8'
};

export default Dashboard;