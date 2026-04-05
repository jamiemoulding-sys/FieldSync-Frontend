
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import HomeButton from '../components/HomeButton';

function InviteEmployee() {
  const { createInvite } = useAuth();

  const [email, setEmail] = useState('');
  const [link, setLink] = useState('');
  const [error, setError] = useState('');

  const handleInvite = async () => {
    setError('');
    setLink('');

    const res = await createInvite(email);

    if (!res.success) {
      setError(res.error);
    } else {
      setLink(res.link);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">

      <div className="flex justify-between items-center">
        <h1 className="heading-1">Invite Employee</h1>
        <HomeButton />
      </div>

      {error && <div className="badge-error">{error}</div>}

      <div className="card space-y-4">

        <input
          type="email"
          placeholder="employee@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
        />

        <button onClick={handleInvite} className="btn-primary w-full">
          Generate Invite Link
        </button>

        {link && (
          <div className="bg-black/30 p-3 rounded-lg text-sm break-all">
            {link}
          </div>
        )}

      </div>

    </div>
  );
}

export default InviteEmployee;