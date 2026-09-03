import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      style={{
        backgroundColor: 'var(--warning-bg)',
        color: 'var(--warning-text)',
        borderBottom: '1px solid var(--border)',
        padding: '0.5rem 1rem',
        fontSize: '0.82rem',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        textAlign: 'center',
        zIndex: 10000
      }}
    >
      <WifiOff size={16} />
      <span>You're offline. Live meal logging and payment verification require an active internet connection.</span>
    </div>
  );
}
