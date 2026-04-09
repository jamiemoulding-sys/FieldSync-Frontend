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
        <h2>FieldSync</h2>

        <button onClick={() => navigate('/dashboard')}>Dashboard</button>
        <button onClick={() => navigate('/schedule')}>Schedule</button>
        <button onClick={() => navigate('/holiday-requests')}>Holidays</button>
      </div>

      {/* MAIN */}
      <div style={main}>

        <h1>Dashboard</h1>

        {/* KPIs */}
        <div style={kpiGrid}>
          <KPI title="Users" value={stats.users || 0} />
          <KPI title="Active Staff" value={stats.activeShifts || 0} />
          <KPI title="Tasks" value={stats.tasks || 0} />
          <KPI title="Completed" value={stats.completedTasks || 0} />
        </div>

        {/* 🔥 HOURS CHART */}
        <div style={card}>
          <h3>Weekly Hours</h3>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={hours}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="hours" stroke="#6366f1" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 🔥 ACTIVITY BAR CHART */}
        <div style={card}>
          <h3>Top Performers</h3>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={activity}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="action" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ACTIVITY FEED */}
        <div style={card}>
          <h3>Live Activity</h3>

          {activity.map((a, i) => (
            <div key={i} style={row}>
              <strong>{a.name}</strong> — {a.action}
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
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

/* STYLES */

const layout = {
  display: 'flex',
  minHeight: '100vh',
  background: '#0b0f14',
  color: 'white'
};

const sidebar = {
  width: 200,
  padding: 20,
  background: '#020617'
};

const main = {
  flex: 1,
  padding: 30
};

const kpiGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 20,
  marginBottom: 20
};

const kpi = {
  background: '#111827',
  padding: 20,
  borderRadius: 10
};

const card = {
  background: '#111827',
  padding: 20,
  borderRadius: 10,
  marginBottom: 20
};

const row = {
  marginBottom: 8
};

export default Dashboard;