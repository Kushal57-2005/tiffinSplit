import React from 'react';

export function Input({ label, error, helperText, className = '', ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input className={`input ${className}`} {...props} />
      {error && <span style={{ fontSize: '0.75rem', color: 'var(--error-text)' }}>{error}</span>}
      {helperText && !error && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{helperText}</span>}
    </div>
  );
}
