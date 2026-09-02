import React from 'react';

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '3rem 1.5rem',
        backgroundColor: 'var(--surface)',
        border: '1px dashed var(--border)',
        borderRadius: 'var(--radius-lg)'
      }}
    >
      {Icon && (
        <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
          <Icon size={40} />
        </div>
      )}
      <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>
      {description && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem', maxWidth: '400px', margin: '0 auto 1.25rem auto' }}>
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
