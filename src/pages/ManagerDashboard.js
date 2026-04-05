import React, { useEffect, useState } from 'react';
import { managerAPI } from '../services/api';
import BackButton from '../components/BackButton';

function ManagerDashboard() {
  const [workers, setWorkers] = useState([]);
  const [time, setTime] = useState(Date.now());

  useEffect(() => {
    loadWorkers();

    // 🔄 refresh workers every 5s
    const fetchInterval = setInterval(() => {
      loadWorkers();
    }, 5000);

    // ⏱️ live timer tick every second
    const timerInterval = setInterval(() => {
      setTime(Date.now());
    }, 1000);

    return () => {
      clearInterval(fetchInterval);
      clearInterval(timerInterval);
    };
  }, []);

  const loadWorkers = async () => {
    try {
      const res = await managerAPI.getActiveShifts();
      setWorkers(res.data || []);
    } catch (err) {
      console.error('LOAD WORKERS ERROR:', err);
    }
  };

  // ⏱️ LIVE DURATION
  const getDuration = (startTime) => {
    const start = new Date(startTime);
    const now = new Date(time);

    const seconds = Math.floor((now - start) / 1000);

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-3xl mx-auto">

        <BackButton />

        <h1 className="text-3xl font-bold mb-6">Manager Dashboard</h1>

        {workers.length === 0 ? (
          <p className="text-gray-400">No active workers</p>
        ) : (
          <div className="space-y-4">
            {workers.map(worker => (
              <div
                key={worker.id}
                className="bg-gray-800 p-4 rounded-lg flex justify-between items-center
                           transition-all duration-300 hover:scale-[1.02]"
              >
                <div>
                  <p className="font-bold text-lg">{worker.name}</p>
                  <p className="text-gray-400 text-sm">
                    Started: {new Date(worker.clock_in_time).toLocaleTimeString()}
                  </p>
                </div>

                <div className="text-green-400 font-bold text-lg">
                  {getDuration(worker.clock_in_time)}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}


export default ManagerDashboard;