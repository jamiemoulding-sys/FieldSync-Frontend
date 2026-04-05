import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { reportAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState({
    totalShifts: 0,
    totalUsers: 0,
    totalTasks: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // 🔒 LOCK IF NOT PRO
    if (!user?.isPro) return;

    loadReports();
  }, [user]);

  const loadReports = async () => {
    try {
      setLoading(true);

      const res = await reportAPI.getTimesheets();

      setData({
        totalShifts: res.data?.totalShifts || 0,
        totalUsers: res.data?.totalUsers || 0,
        totalTasks: res.data?.totalTasks || 0
      });

    } catch (err) {
      console.error(err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  // 🔒 PAYWALL
  if (!user?.isPro) {
    return (
      <Layout>
        <div className="card text-center space-y-4">

          <h1 className="heading-1">📊 Reports</h1>

          <p className="text-gray-400">
            Unlock advanced insights and analytics
          </p>

          <button
            onClick={() => navigate('/upgrade')}
            className="btn-primary"
          >
            Upgrade to Pro
          </button>

        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-white">Loading reports...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">

        {/* HEADER */}
        <div>
          <h1 className="heading-1">📊 Reports</h1>
          <p className="subtle-text">
            Overview of your business performance
          </p>
        </div>

        {error && (
          <div className="badge-error">{error}</div>
        )}

        {/* KPI GRID */}
        <div className="grid md:grid-cols-3 gap-6">

          <div className="kpi">
            <p className="kpi-title">Total Shifts</p>
            <p className="kpi-value">{data.totalShifts}</p>
          </div>

          <div className="kpi">
            <p className="kpi-title">Users</p>
            <p className="kpi-value">{data.totalUsers}</p>
          </div>

          <div className="kpi">
            <p className="kpi-title">Tasks</p>
            <p className="kpi-value">{data.totalTasks}</p>
          </div>

        </div>

      </div>
    </Layout>
  );
}

export default Reports;