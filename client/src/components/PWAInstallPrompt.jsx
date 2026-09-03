import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('pwa_prompt_dismissed');
    if (isDismissed) return;

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.25rem',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 2rem)',
        maxWidth: '440px',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        padding: '1rem 1.25rem',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'var(--accent-brown)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: '1.2rem',
            flexShrink: 0
          }}
        >
          🍱
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text)' }}>
            Install TiffinSplit App
          </h4>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Install on your home screen for quick single-tap access
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <button
          onClick={handleInstallClick}
          className="btn btn-primary"
          style={{
            padding: '0.45rem 0.85rem',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <Download size={15} />
          <span>Install</span>
        </button>
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.35rem',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '4px'
          }}
          aria-label="Close prompt"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
