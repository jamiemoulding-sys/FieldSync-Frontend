import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { performanceAPI } from "../services/api";

function Performance() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await performanceAPI.getAll();
      setData(res.data || []);
    } catch (err) {
      console.error("Performance error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ padding: 20 }}>
        <h1 style={{ marginBottom: 20 }}>📊 Performance</h1>

        {loading && <p>Loading...</p>}

        {!loading && data.length === 0 && (
          <p style={{ color: "#9ca3af" }}>No data available</p>
        )}

        {!loading && data.map((user) => (
          <div key={user.id} style={card}>
            <strong>{user.email}</strong>

            <div style={meta}>
              Shifts: {user.total_shifts}
            </div>

            <div style={meta}>
              Hours: {Number(user.hours_worked).toFixed(1)}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}

// 🎨 STYLES
const card = {
  background: "#111827",
  padding: 15,
  borderRadius: 10,
  marginBottom: 10,
};

const meta = {
  fontSize: 14,
  color: "#9ca3af",
};

export default Performance;