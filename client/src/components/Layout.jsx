import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sun, Moon, Menu, X, LogOut, User } from 'lucide-react';
import { Navigation } from './Navigation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, activeWorkspace, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close mobile navigation drawer when Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileOpen]);

  return (
    <div className="app-shell">
      {/* Translucent Backdrop for Mobile Drawer */}
      <div
        className={`drawer-backdrop ${mobileOpen ? 'active' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Responsive Sidebar Navigation / Drawer */}
      <Navigation mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="main-layout">
        {/* Topbar */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.35rem 0.5rem',
                color: 'var(--text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '38px',
                minWidth: '38px'
              }}
              onClick={() => setMobileOpen(!mobileOpen)}
              className="mobile-only-btn"
              aria-label={mobileOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
                Active Household
              </span>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '600', margin: 0, lineHeight: 1.1 }} className="text-break">
                {activeWorkspace ? activeWorkspace.name : 'TiffinSplit Workspace'}
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              onClick={toggleTheme}
              style={{
                background: 'var(--surface-muted)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.35rem 0.65rem',
                cursor: 'pointer',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                fontWeight: '500',
                minHeight: '38px'
              }}
              title="Toggle Light/Dark Theme"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              <span style={{ textTransform: 'capitalize' }} className="desktop-theme-text">{theme}</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.5rem', borderLeft: '1px solid var(--border)' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-payment)',
                  color: 'var(--accent-payment-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  flexShrink: 0
                }}
                title={user ? user.name : 'User Profile'}
              >
                {user ? user.name.charAt(0).toUpperCase() : <User size={15} />}
              </div>
              
              <div className="desktop-user-info" style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', lineHeight: 1.2 }}>
                  {user ? user.name : 'Member'}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1 }}>
                  {user ? user.email : ''}
                </span>
              </div>

              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '36px',
                  minWidth: '36px'
                }}
                title="Log Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="content-area animate-fade-in">
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (min-width: 769px) {
          .mobile-only-btn { display: none !important; }
        }
        @media (max-width: 768px) {
          .desktop-user-info { display: none !important; }
          .desktop-theme-text { display: none !important; }
        }
      `}</style>
    </div>
  );
}
