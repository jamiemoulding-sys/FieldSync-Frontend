import React, { useEffect, useState } from 'react';
import { shiftAPI, locationAPI } from '../services/api';
import BackButton from '../components/BackButton';

function WorkSession() {
  const [activeShift, setActiveShift] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [timer, setTimer] = useState(0);

  // ⏱️ TIMER
  useEffect(() => {
    let interval;

    if (activeShift?.clock_in_time) {
      interval = setInterval(() => {
        const start = new Date(activeShift.clock_in_time);
        const now = new Date();
        const seconds = Math.floor((now - start) / 1000);
        setTimer(seconds);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeShift]);

  // 📦 LOAD DATA
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [shiftRes, locationRes] = await Promise.all([
        shiftAPI.getActive(),
        locationAPI.getLocations()
      ]);

      setActiveShift(shiftRes?.data || null);
      setLocations(locationRes?.data || []);
    } catch (err) {
      console.error('LOAD ERROR:', err);
    }
  };

  // ▶️ CLOCK IN
  const handleClockIn = async () => {
    if (!selectedLocation) {
      alert('Select a location');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await shiftAPI.clockIn({
            location_id: selectedLocation,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });

          setActiveShift(res.data.shift);

        } catch (err) {
          alert(err.response?.data?.error || 'Clock in failed');
        }
      },
      () => {
        alert('Location permission denied');
      }
    );
  };

  // 🔄 LIVE LOCATION TRACKING
  useEffect(() => {
    let interval;

    if (activeShift) {
      interval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          try {
            await fetch(`${process.env.REACT_APP_API_URL}/api/shifts/update-location`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
              })
            });
          } catch (err) {
            console.error('LOCATION UPDATE ERROR:', err);
          }
        });
      }, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeShift]);

  // ⏹️ CLOCK OUT
  const handleClockOut = async () => {
    try {
      await shiftAPI.clockOut();
      setActiveShift(null);
      setTimer(0);
    } catch (err) {
      alert(err.response?.data?.error || 'Clock out failed');
    }
  };

  // ⏱️ FORMAT TIMER
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-xl mx-auto">

        <BackButton />

        <h1 className="text-3xl font-bold mb-6">Work Session</h1>

        {activeShift ? (
          <div className="bg-green-900 p-6 rounded-xl text-center">
            <h2 className="text-xl mb-2">🟢 Clocked In</h2>

            <p className="text-gray-300">
              Started: {new Date(activeShift.clock_in_time).toLocaleTimeString()}
            </p>

            <p className="text-3xl font-bold mt-4">
              {formatTime(timer)}
            </p>

            <button
              onClick={handleClockOut}
              className="mt-6 bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Clock Out
            </button>
          </div>
        ) : (
          <div className="bg-gray-800 p-6 rounded-xl">

            <h2 className="text-lg mb-4">Clock In</h2>

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 mb-4"
            >
              <option value="">Select Location</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleClockIn}
              className="w-full bg-green-600 py-2 rounded hover:bg-green-700"
            >
              Clock In
            </button>

          </div>
        )}

      </div>
    </div>
  );
}

export default WorkSession;