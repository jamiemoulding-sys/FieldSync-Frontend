import React, { useState, useEffect } from 'react';
import api from '../services/api';
import HomeButton from '../components/HomeButton';

function TimeSheet() {
  const [timeSheetData, setTimeSheetData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedEmployee, setSelectedEmployee] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedEmployee]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [timeRes, userRes] = await Promise.all([
        api.get(`/shifts/history?date=${selectedDate}&user=${selectedEmployee}`),
        api.get('/users')
      ]);

      setTimeSheetData(timeRes.data || []);
      setEmployees(userRes.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load timesheet');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------

  const formatTime = (t) =>
    t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';

  const formatDate = (t) =>
    t ? new Date(t).toLocaleDateString() : 'N/A';

  const calculateHours = (start, end) => {
    if (!start || !end) return 0;
    return ((new Date(end) - new Date(start)) / 3600000).toFixed(2);
  };

  const exportCSV = () => {
    const rows = [
      ['Employee', 'Date', 'Clock In', 'Clock Out', 'Hours'],
      ...timeSheetData.map(r => [
        r.employee_name,
        formatDate(r.clock_in_time),
        formatTime(r.clock_in_time),
        formatTime(r.clock_out_time),
        calculateHours(r.clock_in_time, r.clock_out_time)
      ])
    ];

    const blob = new Blob(
      [rows.map(r => r.join(',')).join('\n')],
      { type: 'text/csv' }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet-${selectedDate}.csv`;
    a.click();
  };

  // -------------------------

  if (loading) {
    return <div className="center-screen">Loading timesheet...</div>;
  }

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="heading-1">📊 Timesheet</h1>
          <p className="subtle-text">Track work hours</p>
        </div>

        <div className="flex gap-3">
          <button onClick={exportCSV} className="btn-primary">
            Export CSV
          </button>
          <HomeButton />
        </div>
      </div>

      {/* ERRORS */}
      {error && <div className="badge-error">{error}</div>}
      {success && <div className="badge-success">{success}</div>}

      {/* FILTERS */}
      <div className="card flex gap-4 flex-wrap">

        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="input-field"
        />

        <select
          value={selectedEmployee}
          onChange={e => setSelectedEmployee(e.target.value)}
          className="input-field"
        >
          <option value="">All Employees</option>
          {employees.map(e => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>

      </div>

      {/* TABLE */}
      <div className="card overflow-x-auto">

        <table className="w-full text-left">

          <thead>
            <tr className="text-gray-400 text-sm">
              <th>Employee</th>
              <th>Date</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Hours</th>
            </tr>
          </thead>

          <tbody>

            {timeSheetData.map((r, i) => (
              <tr key={i} className="border-t border-white/10">

                <td>{r.employee_name}</td>
                <td>{formatDate(r.clock_in_time)}</td>
                <td>{formatTime(r.clock_in_time)}</td>
                <td>{formatTime(r.clock_out_time)}</td>
                <td>
                  {calculateHours(r.clock_in_time, r.clock_out_time)}h
                </td>

              </tr>
            ))}

          </tbody>

        </table>

        {timeSheetData.length === 0 && (
          <div className="text-center text-gray-400 mt-4">
            No data for selected date
          </div>
        )}

      </div>

    </div>
  );
}

export default TimeSheet;
