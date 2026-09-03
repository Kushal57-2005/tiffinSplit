import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';

export function DateRangePicker({ startDate, endDate, onChange, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(startDate || '');
  const [customEnd, setCustomEnd] = useState(endDate || '');
  const [activePreset, setActivePreset] = useState(label || 'All Time');

  const containerRef = useRef(null);

  useEffect(() => {
    setCustomStart(startDate || '');
    setCustomEnd(endDate || '');
  }, [startDate, endDate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateLabel = (dStr) => {
    if (!dStr) return '';
    const d = new Date(dStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDisplayText = () => {
    if (activePreset && activePreset !== 'Custom Range' && activePreset !== 'All Time') {
      return activePreset;
    }
    if (startDate && endDate) {
      if (startDate === endDate) {
        return formatDateLabel(startDate);
      }
      return `${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`;
    }
    if (startDate) return `From ${formatDateLabel(startDate)}`;
    if (endDate) return `Until ${formatDateLabel(endDate)}`;
    return 'All Dates';
  };

  const applyPreset = (presetKey) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    let start = '';
    let end = '';

    if (presetKey === 'Today') {
      start = todayStr;
      end = todayStr;
    } else if (presetKey === 'Yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      start = yStr;
      end = yStr;
    } else if (presetKey === 'Last 7 Days') {
      const s = new Date(today);
      s.setDate(s.getDate() - 6);
      start = s.toISOString().split('T')[0];
      end = todayStr;
    } else if (presetKey === 'Last 30 Days') {
      const s = new Date(today);
      s.setDate(s.getDate() - 29);
      start = s.toISOString().split('T')[0];
      end = todayStr;
    } else if (presetKey === 'This Month') {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      const e = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      start = s.toISOString().split('T')[0];
      end = e.toISOString().split('T')[0];
    } else if (presetKey === 'Last Month') {
      const s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const e = new Date(today.getFullYear(), today.getMonth(), 0);
      start = s.toISOString().split('T')[0];
      end = e.toISOString().split('T')[0];
    } else if (presetKey === 'All Time') {
      start = '';
      end = '';
    }

    setActivePreset(presetKey);
    onChange({ startDate: start, endDate: end, label: presetKey });
    setIsOpen(false);
  };

  const handleApplyCustom = (e) => {
    e.preventDefault();
    setActivePreset('Custom Range');
    onChange({ startDate: customStart, endDate: customEnd, label: 'Custom Range' });
    setIsOpen(false);
  };

  const presets = [
    'All Time',
    'Today',
    'Yesterday',
    'Last 7 Days',
    'Last 30 Days',
    'This Month',
    'Last Month',
    'Custom Range'
  ];

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger Button */}
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.4rem 0.75rem',
          fontSize: '0.85rem',
          fontWeight: '500',
          backgroundColor: 'var(--surface)',
          borderColor: isOpen ? 'var(--brown)' : 'var(--border)',
          color: 'var(--text)',
          borderRadius: 'var(--radius-md)'
        }}
      >
        <Calendar size={15} style={{ color: 'var(--brown)' }} />
        <span>{getDisplayText()}</span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 1000,
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            width: '290px',
            padding: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              Select Date Range
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.3rem', marginBottom: '0.5rem' }}>
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  style={{
                    textAlign: 'left',
                    padding: '0.35rem 0.55rem',
                    fontSize: '0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: activePreset === preset ? 'var(--brown)' : 'transparent',
                    backgroundColor: activePreset === preset ? 'var(--surface-muted)' : 'transparent',
                    color: activePreset === preset ? 'var(--brown)' : 'var(--text)',
                    cursor: 'pointer',
                    fontWeight: activePreset === preset ? '600' : '400'
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Custom Range Inputs */}
            <form onSubmit={handleApplyCustom} style={{ borderTop: '1px solid var(--border)', paddingTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="input font-mono"
                    style={{ padding: '0.25rem 0.4rem', fontSize: '0.8rem', width: '100%' }}
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    className="input font-mono"
                    style={{ padding: '0.25rem 0.4rem', fontSize: '0.8rem', width: '100%' }}
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsOpen(false)}
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', backgroundColor: 'var(--brown)', borderColor: 'var(--brown)' }}
                >
                  Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
