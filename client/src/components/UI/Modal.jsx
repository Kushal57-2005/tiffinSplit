import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, maxWidth = '520px' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '1.5rem 1rem',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        className="modal-content card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: maxWidth,
          maxHeight: 'calc(100vh - 3rem)',
          overflowY: 'auto',
          backgroundColor: 'var(--surface)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          padding: '1.25rem',
          borderRadius: '16px',
          marginTop: '1.5rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header" style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '600', color: 'var(--text)' }}>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease'
            }}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
