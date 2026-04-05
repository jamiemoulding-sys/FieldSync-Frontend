import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { locationAPI } from '../services/api';
import LocationPicker from '../components/LocationPicker';
import { useAuth } from '../hooks/useAuth';

function Locations() {
  const { user } = useAuth(); // ✅ IMPORTANT

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    radius: 100
  });

  const [position, setPosition] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const res = await locationAPI.getLocations();
      setLocations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!position) {
      setError('Please select a location on the map');
      return;
    }

    try {
      const payload = {
        ...formData,
        latitude: position.lat,
        longitude: position.lng,
        company_id: user?.companyId // ✅ CRITICAL FIX
      };

      console.log('SENDING LOCATION:', payload); // 👈 DEBUG

      if (editingLocation) {
        await locationAPI.update(editingLocation.id, payload);
        setSuccess('Updated');
      } else {
        await locationAPI.create(payload);
        setSuccess('Created');
      }

      setShowModal(false);
      setEditingLocation(null);
      setPosition(null);
      setFormData({ name: '', address: '', radius: 100 });

      loadLocations();

    } catch (err) {
      console.error('LOCATION ERROR:', err.response?.data || err); // 👈 IMPORTANT
      setError(err.response?.data?.error || 'Save failed');
    }
  };

  const handleEdit = (loc) => {
    setEditingLocation(loc);

    setFormData({
      name: loc.name,
      address: loc.address || '',
      radius: loc.radius || 100
    });

    setPosition({
      lat: loc.latitude,
      lng: loc.longitude
    });

    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await locationAPI.delete(id);
      loadLocations();
    } catch (err) {
      console.error(err);
      setError('Delete failed');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-white">Loading locations...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="heading-1">📍 Locations</h1>
            <p className="subtle-text">Manage your business locations</p>
          </div>

          <button
            onClick={() => {
              setEditingLocation(null);
              setPosition(null);
              setFormData({ name: '', address: '', radius: 100 });
              setShowModal(true);
            }}
            className="btn-primary"
          >
            ➕ Add Location
          </button>
        </div>

        {/* LIST */}
        {locations.length === 0 ? (
          <div className="card text-center text-gray-400">
            No locations yet
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {locations.map(loc => (
              <div key={loc.id} className="card">
                <p className="text-white font-semibold">{loc.name}</p>
                <p className="text-gray-400 text-sm">{loc.address}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Radius: {loc.radius || 100}m
                </p>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleEdit(loc)}
                    className="btn-secondary"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(loc.id)}
                    className="btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
            <div className="card w-full max-w-md space-y-4">

              <form onSubmit={handleSubmit} className="space-y-4">

                <input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input-field"
                  placeholder="Location name"
                  required
                />

                <input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="input-field"
                  placeholder="Optional address"
                />

                <LocationPicker position={position} setPosition={setPosition} />

                {position && (
                  <p className="text-xs text-gray-400">
                    📍 {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
                  </p>
                )}

                <input
                  type="number"
                  value={formData.radius}
                  onChange={(e) =>
                    setFormData({ ...formData, radius: e.target.value })
                  }
                  className="input-field"
                  placeholder="Radius (meters)"
                />

                <button className="btn-primary w-full">
                  {editingLocation ? 'Update Location' : 'Add Location'}
                </button>

              </form>

            </div>
          </div>
        )}

        {error && <div className="badge-error">{error}</div>}
        {success && <div className="badge-success">{success}</div>}

      </div>
    </Layout>
  );
}

export default Locations;