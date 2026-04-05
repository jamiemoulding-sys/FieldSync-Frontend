import React, { useState, useEffect } from 'react';
import api from '../services/api'; // ✅ FIXED
import HomeButton from '../components/HomeButton';

function HolidayRequests() {
  const [holidayRequests, setHolidayRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);

  const [formData, setFormData] = useState({
    employee_id: '',
    start_date: '',
    end_date: '',
    holiday_type: 'annual',
    reason: '',
    notes: ''
  });

  const [user, setUser] = useState(null);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    setIsManager(userData.role === 'manager');
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      let res;

      if (isManager) {
        res = await api.get('/holiday'); // adjust if needed
      } else {
        res = await api.get('/holiday/my');
      }

      setHolidayRequests(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const requestData = {
        ...formData,
        employee_id: formData.employee_id || user.id
      };

      if (editingRequest) {
        await api.put(`/holiday/${editingRequest.id}`, requestData);
        setSuccess('Updated successfully');
      } else {
        await api.post('/holiday', requestData);
        setSuccess('Created successfully');
      }

      setShowModal(false);
      setEditingRequest(null);
      await loadData();
    } catch (err) {
      setError('Failed to save request');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/holiday/${id}/approve`);
      loadData();
    } catch {
      setError('Approve failed');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/holiday/${id}/reject`);
      loadData();
    } catch {
      setError('Reject failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/holiday/${id}`);
      loadData();
    } catch {
      setError('Delete failed');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-xl font-bold">Holiday Requests</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowModal(true)} className="btn-primary">
            ➕ New
          </button>
          <HomeButton />
        </div>
      </div>

      {holidayRequests.map(r => (
        <div key={r.id} className="card mb-3">
          <p>{r.start_date} → {r.end_date}</p>
          <p>{r.reason}</p>

          {isManager && r.status === 'pending' && (
            <>
              <button onClick={() => handleApprove(r.id)}>Approve</button>
              <button onClick={() => handleReject(r.id)}>Reject</button>
            </>
          )}

          {r.status === 'pending' && (
            <button onClick={() => handleDelete(r.id)}>Delete</button>
          )}
        </div>
      ))}
    </div>
  );
}

export default HolidayRequests;
