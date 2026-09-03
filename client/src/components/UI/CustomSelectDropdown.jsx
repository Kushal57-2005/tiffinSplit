import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';

export function CustomSelectDropdown({ label, options, value, onChange, placeholder = 'Select', minWidth = '145px' }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOpt = options.find((o) => String(o.value) === String(value)) || options[0];
  const isSelected = Boolean(value && value !== 'DESC');

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {label && (
        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '500', marginBottom: '0.25rem' }}>
          {label}
        </label>
      )}
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          padding: '0.45rem 0.85rem',
          fontSize: '0.88rem',
          fontWeight: '500',
          backgroundColor: 'var(--surface)',
          border: isOpen ? '2px solid var(--text)' : isSelected ? '1.5px solid var(--brown)' : '1px solid var(--border)',
          boxShadow: isOpen ? '0 0 0 3px rgba(148, 109, 109, 0.15)' : 'none',
          color: isSelected ? 'var(--brown)' : 'var(--text)',
          borderRadius: '12px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          minWidth: minWidth
        }}
      >
        <span style={{ fontWeight: isSelected ? '600' : '500' }}>{selectedOpt ? selectedOpt.label : placeholder}</span>
        {isOpen ? (
          <ChevronUp size={16} style={{ color: 'var(--text)' }} />
        ) : (
          <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 1000,
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-md)',
            minWidth: '160px',
            maxWidth: '220px',
            padding: '0.4rem 0.25rem'
          }}
        >
          {options.map((opt) => {
            const active = String(value) === String(opt.value);
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.85rem',
                  background: active ? 'var(--surface-muted)' : 'none',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: active ? 'var(--brown)' : 'var(--text)',
                  fontWeight: active ? '600' : '400',
                  textAlign: 'left'
                }}
              >
                <span>{opt.label}</span>
                {active && <Check size={16} style={{ color: 'var(--brown)' }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
