import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import { shiftAPI, analyticsAPI, userAPI, holidayAPI, scheduleAPI } from '../services/api';

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth() || {};

  const [activeShifts, setActiveShifts] = useState([]);
  const [users, setUsers] = useState([]);
  const [weeklyHours, setWeeklyHours] = useState(0);
  const [todayHours, setTodayHours] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [now, setNow] = useState(Date.now());

  // ⏱ LIVE CLOCK
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 🔄 LOAD DATA
  useEffect(() => {
    const interval = setInterval(loadData, 15000);
    loadData();
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [activeRes, analyticsRes, usersRes, holidayRes, scheduleRes] = await Promise.all([
        shiftAPI.getAllActive().catch(() => ({ data: [] })),
        analyticsAPI.getShifts().catch(() => ({ data: [] })),
        userAPI.getAll().catch(() => ({ data: [] })),
        holidayAPI.getAll().catch(() => ({ data: [] })),
        scheduleAPI.getAll().catch(() => ({ data: [] }))
      ]);

      const active = activeRes.data || [];
      const analytics = analyticsRes.data || [];
      const usersData = usersRes.data || [];
      const holidays = holidayRes.data || [];
      const schedules = scheduleRes.data || [];

      setActiveShifts(active);
      setUsers(usersData);

      // HOURS
      const weekly = analytics.reduce((sum, d) => sum + Number(d.hours || 0), 0);
      setWeeklyHours(weekly);

      const todayStr = new Date().toDateString();
      const todayTotal = analytics
        .filter(d => new Date(d.date).toDateString() === todayStr)
        .reduce((sum, d) => sum + Number(d.hours || 0), 0);

      setTodayHours(todayTotal);

      buildAlerts(active, todayTotal, holidays, schedules);

    } catch (err) {
      console.error(err);
    }
  };

  // 🚨 ALERT SYSTEM (UPGRADED)
  const buildAlerts = (active, todayHours, holidays, schedules) => {
    const a = [];
    const now = new Date();
    const todayStr = now.toDateString();

    // BASIC
    if (active.length === 0) {
      a.push('⚠️ No staff currently clocked in');
    }

    if (active.length === 1) {
      a.push('⚠️ Only 1 staff member working');
    }

    if (todayHours > 20) {
      a.push('⚠️ High total hours today');
    }

    if (holidays.length > 0) {
      a.push(`📅 ${holidays.length} holiday requests pending`);
    }

    // ⏰ LATENESS
    schedules.forEach(s => {
      const scheduleDate = new Date(s.date).toDateString();
      if (scheduleDate !== todayStr) return;

      const shift = active.find(sh => sh.user_id === s.user_id);

      if (shift) {
        const clockIn = new Date(shift.clock_in_time);
        const start = new Date(s.start_time);

        if (clockIn > start) {
          const minsLate = Math.floor((clockIn - start) / 60000);
          a.push(`⏰ ${s.name || 'Employee'} is ${minsLate} mins late`);
        }
      }
    });

    // ❌ ABSENCE
    schedules.forEach(s => {
      const scheduleDate = new Date(s.date).toDateString();
      if (scheduleDate !== todayStr) return;

      const shift = active.find(sh => sh.user_id === s.user_id);
      const start = new Date(s.start_time);

      if (!shift && now > start) {
        a.push(`❌ ${s.name || 'Employee'} missed shift`);
      }
    });

    // ⏱ OVERTIME
    active.forEach(s => {
      const duration = (Date.now() - new Date(s.clock_in_time)) / 1000 / 60 / 60;
      if (duration > 8) {
        a.push(`⚠️ ${s.name || 'Employee'} nearing overtime`);
      }
    });

    setAlerts(a);
  };

  return (
    <Layout>
      <div style={{ padding: 10 }}>

        {/* HEADER */}
        <div style={{ marginBottom: 25 }}>
          <h1 style={{ fontSize: 26 }}>
            Welcome back, {user?.name || 'Team'} 👋
          </h1>
        </div>

        {/* STATS */}
        <div style={grid}>
          <Stat title="Active Staff" value={activeShifts.length} />
          <Stat title="Today Hours" value={todayHours} />
          <Stat title="Weekly Hours" value={weeklyHours} />
        </div>

        {/* ALERTS */}
        {alerts.length > 0 && (
          <div style={alertBox}>
            {alerts.map((a, i) => (
              <p key={i}>{a}</p>
            ))}
          </div>
        )}

        {/* TEAM STATUS */}
        <div style={card}>
          <h3 style={{ marginBottom: 15 }}>Team Status</h3>

          {users.map((u) => {
            const active = activeShifts.find(s => s.user_id === u.id);

            return (
              <div key={u.id} style={row}>
                <div>
                  <span style={{ marginRight: 8 }}>
                    {active ? '🟢' : '⚪'}
                  </span>
                  {u.name}
                </div>

                <div style={{ color: '#9ca3af' }}>
                  {active
                    ? formatDuration(now - new Date(active.clock_in_time))
                    : 'Off shift'}
                </div>
              </div>
            );
          })}
        </div>

        {/* ACTIONS */}
        <div style={actions}>
          <button onClick={() => navigate('/work-session')} style={primaryBtn}>
            ⏰ Start Work
          </button>

          <button onClick={() => navigate('/schedule')} style={secondaryBtn}>
            📅 Schedule
          </button>

          <button onClick={() => navigate('/reports')} style={secondaryBtn}>
            📊 Reports
          </button>

          <button onClick={() => navigate('/performance')} style={secondaryBtn}>
            📊 Performance
          </button>

          <button onClick={() => navigate('/billing')} style={upgradeBtn}>
            💳 Upgrade
          </button>
        </div>

      </div>
    </Layout>
  );
}

// ⏱ FORMAT
function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}h ${m}m ${sec}s`;
}

// COMPONENT
function Stat({ title, value }) {
  return (
    <div style={card}>
      <p style={{ color: '#9ca3af' }}>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

// STYLES
const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 15,
  marginBottom: 20
};

const card = {
  background: '#111827',
  padding: 15,
  borderRadius: 10
};

const alertBox = {
  background: '#1f2937',
  padding: 15,
  borderRadius: 10,
  marginBottom: 20,
  color: '#f87171'
};

const row = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: 10
};

const actions = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  marginTop: 20
};

const primaryBtn = {
  padding: 14,
  background: '#6366f1',
  border: 'none',
  borderRadius: 8,
  color: 'white',
  cursor: 'pointer'
};

const secondaryBtn = {
  padding: 14,
  background: '#1f2937',
  border: 'none',
  borderRadius: 8,
  color: 'white',
  cursor: 'pointer'
};

const upgradeBtn = {
  padding: 14,
  background: '#10b981',
  border: 'none',
  borderRadius: 8,
  color: 'white',
  cursor: 'pointer'
};

export default Dashboard;