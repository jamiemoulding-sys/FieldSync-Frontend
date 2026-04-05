import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menu = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Tasks', path: '/tasks' },
    { name: 'Locations', path: '/locations' },
    { name: 'Reports', path: '/reports' },
    { name: 'Billing', path: '/billing' },
    { name: 'Profile', path: '/profile' },
  ];

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#0b1220',
      color: 'white',
      fontFamily: 'system-ui'
    }}>

      {/* SIDEBAR */}
      <div style={{
        width: 240,
        background: '#020617',
        borderRight: '1px solid #1e293b',
        padding: 20
      }}>

        <h2 style={{
          marginBottom: 30,
          fontSize: 20,
          fontWeight: '600'
        }}>
          FieldSync
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {menu.map(item => {
            const active = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: active ? '#6366f1' : 'transparent',
                  color: active ? 'white' : '#9ca3af',
                  fontWeight: active ? '600' : '400'
                }}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* TOP BAR */}
        <div style={{
          height: 60,
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 30px'
        }}>
          <span style={{ color: '#9ca3af' }}>
            Welcome back 👋
          </span>

          <span style={{
            background: '#111827',
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 12
          }}>
            Pro
          </span>
        </div>

        {/* PAGE CONTENT */}
        <div style={{
          padding: 30,
          flex: 1
        }}>
          {children}
        </div>

      </div>
    </div>
  );
}

export default Layout;