import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import api from '../services/api';

function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (!form.companyName) {
      return setError('Company name required');
    }

    setLoading(true);

    try {
      const res = await authAPI.register({
        email: form.email,
        password: form.password,
      });

      localStorage.setItem('token', res.data.token);

      const companyRes = await api.post('/companies/create-company', {
        name: form.companyName,
      });

      localStorage.setItem('token', companyRes.data.token);

      navigate('/dashboard');

    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white flex items-center justify-center px-6">

      <div className="w-full max-w-md bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 backdrop-blur">

        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold">FieldSync</h1>
          <p className="text-gray-400 text-sm mt-2">
            Create your workspace
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-[#111] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-[#111] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm password"
            value={form.confirmPassword}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-[#111] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />

          <input
            type="text"
            name="companyName"
            placeholder="Company name"
            value={form.companyName}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-[#111] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-medium transition disabled:opacity-50"
          >
            {loading ? 'Creating workspace...' : 'Create account'}
          </button>

        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <span
            onClick={() => navigate('/login')}
            className="text-white cursor-pointer hover:underline"
          >
            Sign in
          </span>
        </div>

      </div>

    </div>
  );
}

export default Signup;