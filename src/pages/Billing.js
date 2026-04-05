import React from 'react';
import api from '../services/api';

function Billing() {

  const handleUpgrade = async () => {
    try {
      const res = await api.post('/billing/create-checkout-session');

      if (!res.data?.url) {
        alert('Something went wrong');
        return;
      }

      window.location.href = res.data.url;

    } catch (err) {
      console.error(err);
      alert('Payment failed');
    }
  };

  return (
    <div style={{
      padding: 40,
      color: 'white',
      maxWidth: 500,
      margin: '0 auto'
    }}>
      <h1 style={{ fontSize: 28 }}>Upgrade to Pro</h1>

      <p style={{ color: '#aaa', marginBottom: 30 }}>
        Unlock all features
      </p>

      <div style={{
        background: '#111',
        padding: 30,
        borderRadius: 12,
        border: '1px solid #222'
      }}>
        <h2>Pro Plan</h2>
        <p style={{ fontSize: 28 }}>£6 / month</p>

        <button
          onClick={handleUpgrade}
          style={{
            width: '100%',
            padding: 15,
            background: '#6366f1',
            border: 'none',
            borderRadius: 8,
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Start Subscription
        </button>
      </div>
    </div>
  );
}

export default Billing;