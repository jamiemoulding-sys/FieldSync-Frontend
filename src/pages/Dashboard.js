import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { shiftAPI, analyticsAPI, userAPI } from '../services/api';

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth() || {};

  const [activeShifts, setActiveShifts] = useState([]);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState([]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [activeRes, analyticsRes, usersRes] = await Promise.all([
        shiftAPI.getAllActive(),
        analyticsAPI.getShifts(),
        userAPI.getAll()
      ]);

      setActiveShifts(activeRes.data || []);
      setUsers(usersRes.data || []);
      setAnalytics(analyticsRes.data || []);

    } catch (err) {
      console.error(err);
    }
  };

  const todayStr = new Date().toDateString();

  const todayHours = analytics
    .filter(d => new Date(d.date).toDateString() === todayStr)
    .reduce((sum, d) => sum + Number(d.hours || 0), 0);

  const weeklyHours = analytics.reduce((sum, d) => sum + Number(d.hours || 0), 0);

  const onlinePercent = users.length
    ? Math.round((activeShifts.length / users.length) * 100)
    : 0;

  const productivityScore = Math.min(Math.round((weeklyHours / (users.length * 40 || 1)) * 100), 100);

  return (
    <div style={wrapper}>

      {/* SIDEBAR */}
      <div style={sidebar}>
        <div>
          <h2 style={logo}>⚡ FieldSync</h2>

          <nav style={nav}>
            <NavItem label="Dashboard" active />
            <NavItem label="Schedule" onClick={() => navigate('/schedule')} />
            <NavItem label="Reports" onClick={() => navigate('/reports')} />
            <NavItem label="Performance" onClick={() => navigate('/performance')} />
            <NavItem label="Billing" onClick={() => navigate('/billing')} />
          </nav>
        </div>

        <button onClick={handleLogout} style={logoutBtn}>
          Logout
        </button>
      </div>

      {/* MAIN */}
      <div style={main}>

        {/* HEADER */}
        <div style={header}>
          <div>
            <h1 style={title}>Dashboard</h1>
            <p style={subtitle}>Welcome back, {user?.name || 'Team'}</p>
          </div>
        </div>

        {/* KPI GRID */}
        <div style={kpiGrid}>
          <KPI title="Active Staff" value={activeShifts.length} sub={`${onlinePercent}% online`} />
          <KPI title="Today Hours" value={Math.round(todayHours)} sub="Today" />
          <KPI title="Weekly Hours" value={Math.round(weeklyHours)} sub="Last 7 days" />
          <KPI title="Productivity" value={`${productivityScore}%`} sub="Efficiency" />
        </div>

        {/* INSIGHTS STRIP */}
        <div style={insightGrid}>
          <Insight title="Staff Online" value={`${onlinePercent}%`} bar={onlinePercent} />
          <Insight title="Daily Load" value={`${Math.round(todayHours)}h`} bar={(todayHours / 50) * 100} />
          <Insight title="Weekly Load" value={`${Math.round(weeklyHours)}h`} bar={(weeklyHours / 200) * 100} />
        </div>

        {/* MAIN GRID */}
        <div style={contentGrid}>

          {/* TEAM */}
          <div style={card}>
            <h3 style={cardTitle}>Team Status</h3>

            {users.map((u) => {
              const active = activeShifts.find(s => s.user_id === u.id);

              return (
                <div key={u.id} style={row}>
                  <div style={userLeft}>
                    <div style={{
                      ...statusDot,
                      background: active ? '#10b981' : '#374151'
                    }} />
                    <span>{u.name}</span>
                  </div>

                  <span style={statusText}>
                    {active ? 'Working' : 'Offline'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ACTIVITY */}
          <div style={card}>
            <h3 style={cardTitle}>Live Activity</h3>

            {activeShifts.map((s, i) => (
              <div key={i} style={activityItem}>
                🟢 {s.name || 'Employee'} started shift
              </div>
            ))}

            {activeShifts.length === 0 && (
              <p style={{ color: '#9ca3af' }}>No activity</p>
            )}
          </div>

          {/* AI INSIGHTS 🔥 */}
          <div style={card}>
            <h3 style={cardTitle}>Insights</h3>

            {activeShifts.length === 0 && <p>⚠️ No staff working</p>}
            {activeShifts.length === 1 && <p>⚠️ Only 1 staff active</p>}
            {todayHours > 20 && <p>⚠️ High workload today</p>}

            <p>📊 {onlinePercent}% workforce active</p>

            {productivityScore < 60 && (
              <p>📉 Productivity is below optimal</p>
            )}

            {productivityScore > 80 && (
              <p>🚀 Team performing at high efficiency</p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

// KPI
function KPI({ title, value, sub }) {
  return (
    <div style={kpiCard}>
      <p style={kpiTitle}>{title}</p>
      <h2 style={kpiValue}>{value}</h2>
      <span style={kpiSub}>{sub}</span>
    </div>
  );
}

// INSIGHT BAR
function Insight({ title, value, bar }) {
  return (
    <div style={insightCard}>
      <div style={insightTop}>
        <span>{title}</span>
        <span>{value}</span>
      </div>

      <div style={barBg}>
        <div style={{ ...barFill, width: `${Math.min(bar, 100)}%` }} />
      </div>
    </div>
  );
}

// NAV ITEM
function NavItem({ label, onClick, active }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px 14px',
        borderRadius: 8,
        cursor: 'pointer',
        background: active ? '#1f2937' : 'transparent'
      }}
    >
      {label}
    </div>
  );
}

// STYLES

const wrapper = {
  display: 'flex',
  height: '100vh',
  background: '#0a0a0b',
  color: 'white'
};

const sidebar = {
  width: 220,
  background: '#111827',
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
};

const logo = { marginBottom: 30 };

const nav = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10
};

const logoutBtn = {
  background: '#ef4444',
  border: 'none',
  padding: 10,
  borderRadius: 8,
  color: 'white',
  cursor: 'pointer'
};

const main = {
  flex: 1,
  padding: 30,
  overflowY: 'auto'
};

const header = { marginBottom: 25 };

const title = { fontSize: 28 };

const subtitle = { color: '#9ca3af' };

const kpiGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 15,
  marginBottom: 20
};

const kpiCard = {
  background: '#111827',
  padding: 20,
  borderRadius: 12
};

const kpiTitle = { color: '#9ca3af' };

const kpiValue = { fontSize: 26 };

const kpiSub = {
  fontSize: 12,
  color: '#6b7280'
};

const insightGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 15,
  marginBottom: 20
};

const insightCard = {
  background: '#111827',
  padding: 15,
  borderRadius: 12
};

const insightTop = {
  display: 'flex',
  justifyContent: 'space-between'
};

const barBg = {
  height: 6,
  background: '#1f2937',
  marginTop: 10,
  borderRadius: 6
};

const barFill = {
  height: 6,
  background: '#6366f1',
  borderRadius: 6
};

const contentGrid = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr',
  gap: 20
};

const card = {
  background: '#111827',
  padding: 20,
  borderRadius: 12
};

const cardTitle = { marginBottom: 10 };

const row = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '10px 0',
  borderBottom: '1px solid rgba(255,255,255,0.05)'
};

const userLeft = {
  display: 'flex',
  gap: 10,
  alignItems: 'center'
};

const statusDot = {
  width: 8,
  height: 8,
  borderRadius: '50%'
};

const statusText = {
  color: '#9ca3af'
};

const activityItem = {
  marginBottom: 8,
  color: '#9ca3af'
};

export default Dashboard;