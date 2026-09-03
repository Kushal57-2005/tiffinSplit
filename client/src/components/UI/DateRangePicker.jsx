import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

export function DateRangePicker({ startDate, endDate, onChange, label }) {
  const [isOpen, setIsOpen] = useState(false);

  // Temporary selection state inside popover
  const [tempStart, setTempStart] = useState(startDate || '');
  const [tempEnd, setTempEnd] = useState(endDate || '');
  const [hoverDate, setHoverDate] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [activePreset, setActivePreset] = useState(label || 'All time');

  // Month navigation: viewMonth is Date object representing left calendar month
  const [viewMonth, setViewMonth] = useState(() => {
    if (startDate) {
      const d = new Date(startDate + 'T00:00:00');
      return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const containerRef = useRef(null);

  useEffect(() => {
    setTempStart(startDate || '');
    setTempEnd(endDate || '');
  }, [startDate, endDate]);

  // Close dropdown when clicking outside & handle global mouse up for dragging
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleGlobalMouseUp() {
      if (isDragging) {
        setIsDragging(false);
        if (tempStart && hoverDate && !tempEnd) {
          if (hoverDate >= tempStart) {
            setTempEnd(hoverDate);
          } else {
            setTempEnd(tempStart);
            setTempStart(hoverDate);
          }
        }
        setHoverDate('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, tempStart, hoverDate, tempEnd]);

  const formatDateLabel = (dStr) => {
    if (!dStr) return '';
    const d = new Date(dStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatShortInputDate = (dStr) => {
    if (!dStr) return '';
    const d = new Date(dStr + 'T00:00:00');
    return `${d.getDate()} / ${d.getMonth() + 1} / ${d.getFullYear()}`;
  };

  const getDisplayText = () => {
    if (activePreset && activePreset !== 'Custom Range' && activePreset !== 'All time') {
      return activePreset;
    }
    if (startDate && endDate) {
      if (startDate === endDate) {
        return formatDateLabel(startDate);
      }
      return `${formatDateLabel(startDate)} – ${formatDateLabel(endDate)}`;
    }
    if (startDate) return `From ${formatDateLabel(startDate)}`;
    if (endDate) return `Until ${formatDateLabel(endDate)}`;
    return 'Select date range';
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
    } else if (presetKey === 'This week') {
      const dayOfWeek = today.getDay();
      const s = new Date(today);
      s.setDate(today.getDate() - dayOfWeek);
      start = s.toISOString().split('T')[0];
      end = todayStr;
    } else if (presetKey === 'Last week') {
      const dayOfWeek = today.getDay();
      const e = new Date(today);
      e.setDate(today.getDate() - dayOfWeek - 1);
      const s = new Date(e);
      s.setDate(e.getDate() - 6);
      start = s.toISOString().split('T')[0];
      end = e.toISOString().split('T')[0];
    } else if (presetKey === 'This month') {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      const e = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      start = s.toISOString().split('T')[0];
      end = e.toISOString().split('T')[0];
    } else if (presetKey === 'Last month') {
      const s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const e = new Date(today.getFullYear(), today.getMonth(), 0);
      start = s.toISOString().split('T')[0];
      end = e.toISOString().split('T')[0];
    } else if (presetKey === 'This year') {
      const s = new Date(today.getFullYear(), 0, 1);
      const e = new Date(today.getFullYear(), 11, 31);
      start = s.toISOString().split('T')[0];
      end = e.toISOString().split('T')[0];
    } else if (presetKey === 'Last year') {
      const s = new Date(today.getFullYear() - 1, 0, 1);
      const e = new Date(today.getFullYear() - 1, 11, 31);
      start = s.toISOString().split('T')[0];
      end = e.toISOString().split('T')[0];
    } else if (presetKey === 'All time') {
      start = '';
      end = '';
    }

    setTempStart(start);
    setTempEnd(end);
    setHoverDate('');
    setActivePreset(presetKey);

    if (presetKey !== 'Custom Range') {
      onChange({ startDate: start, endDate: end, label: presetKey });
      setIsOpen(false);
    }
  };

  const handleDateMouseDown = (dateStr) => {
    setActivePreset('Custom Range');
    setIsDragging(true);
    setTempStart(dateStr);
    setTempEnd('');
    setHoverDate(dateStr);
  };

  const handleDateMouseEnter = (dateStr) => {
    if (tempStart && !tempEnd) {
      setHoverDate(dateStr);
    }
  };

  const handleDateMouseUp = (dateStr) => {
    if (isDragging) {
      setIsDragging(false);
      if (tempStart) {
        if (dateStr >= tempStart) {
          setTempEnd(dateStr);
        } else {
          setTempEnd(tempStart);
          setTempStart(dateStr);
        }
      }
      setHoverDate('');
    }
  };

  const handleDateClick = (dateStr) => {
    setActivePreset('Custom Range');
    if (!isDragging) {
      if (!tempStart || (tempStart && tempEnd)) {
        setTempStart(dateStr);
        setTempEnd('');
        setHoverDate('');
      } else if (tempStart && !tempEnd) {
        if (dateStr >= tempStart) {
          setTempEnd(dateStr);
        } else {
          setTempStart(dateStr);
          setTempEnd('');
        }
        setHoverDate('');
      }
    }
  };

  const handleApply = () => {
    let finalStart = tempStart;
    let finalEnd = tempEnd;

    if (finalStart && finalEnd && finalStart > finalEnd) {
      const swap = finalStart;
      finalStart = finalEnd;
      finalEnd = swap;
    }

    onChange({ startDate: finalStart, endDate: finalEnd, label: activePreset });
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  };

  // Helper to generate calendar month matrix
  const generateMonthGrid = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Padding from previous month
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, current: false, dateStr: null });
    }
    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, current: true, dateStr });
    }
    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const presets = [
    'Today',
    'Yesterday',
    'This week',
    'Last week',
    'This month',
    'Last month',
    'This year',
    'Last year',
    'All time'
  ];

  // Calculate left and right months
  const leftYear = viewMonth.getFullYear();
  const leftMonth = viewMonth.getMonth();

  const rightDate = new Date(leftYear, leftMonth + 1, 1);
  const rightYear = rightDate.getFullYear();
  const rightMonth = rightDate.getMonth();

  const leftDays = generateMonthGrid(leftYear, leftMonth);
  const rightDays = generateMonthGrid(rightYear, rightMonth);

  const getEffectiveEnd = () => {
    if (tempEnd) return tempEnd;
    if (tempStart && hoverDate) return hoverDate;
    return tempStart;
  };

  const isSelectedRange = (dateStr) => {
    if (!dateStr || !tempStart) return false;
    const effectiveEnd = getEffectiveEnd();
    if (!effectiveEnd) return dateStr === tempStart;

    const min = tempStart < effectiveEnd ? tempStart : effectiveEnd;
    const max = tempStart > effectiveEnd ? tempStart : effectiveEnd;
    return dateStr >= min && dateStr <= max;
  };

  const isStartOrEndDate = (dateStr) => {
    if (!dateStr) return false;
    const effectiveEnd = getEffectiveEnd();
    return dateStr === tempStart || dateStr === effectiveEnd;
  };

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
          gap: '0.5rem',
          padding: '0.45rem 0.85rem',
          fontSize: '0.88rem',
          fontWeight: '500',
          backgroundColor: 'var(--surface)',
          borderColor: isOpen ? '#7F56D9' : 'var(--border)',
          boxShadow: isOpen ? '0 0 0 3px rgba(127, 86, 217, 0.15)' : 'none',
          color: 'var(--text)',
          borderRadius: 'var(--radius-md)'
        }}
      >
        <CalendarIcon size={16} style={{ color: '#7F56D9' }} />
        <span>{getDisplayText()}</span>
        {isOpen ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
      </button>

      {/* Popover Dropdown Menu (Untitled UI Style) */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 1000,
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            width: 'max-content',
            maxWidth: '92vw',
            overflow: 'hidden'
          }}
        >
          <div className="date-picker-body" style={{ display: 'flex', flexWrap: 'wrap' }}>
            {/* Left Sidebar Presets */}
            <div
              style={{
                width: '140px',
                borderRight: '1px solid var(--border)',
                padding: '0.75rem 0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
                backgroundColor: 'var(--surface-muted)'
              }}
            >
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  style={{
                    textAlign: 'left',
                    padding: '0.4rem 0.65rem',
                    fontSize: '0.82rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: activePreset === preset ? '#F9F5FF' : 'transparent',
                    color: activePreset === preset ? '#7F56D9' : 'var(--text)',
                    cursor: 'pointer',
                    fontWeight: activePreset === preset ? '600' : '400'
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Calendar Grid Container (1 or 2 months) */}
            <div
              onMouseLeave={() => {
                if (!isDragging) setHoverDate('');
              }}
              style={{ padding: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', userSelect: 'none' }}
            >
              {/* Left Month Calendar */}
              <div style={{ width: '230px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', color: 'var(--text-muted)' }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <strong style={{ fontSize: '0.9rem' }}>
                    {monthNames[leftMonth]} {leftYear}
                  </strong>
                  <div style={{ width: 18 }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center', marginBottom: '0.4rem' }}>
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <span key={d} style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                      {d}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
                  {leftDays.map((item, idx) => {
                    if (!item.current) {
                      return <div key={idx} style={{ height: '30px' }} />;
                    }
                    const isSelected = isSelectedRange(item.dateStr);
                    const isEndpoint = isStartOrEndDate(item.dateStr);

                    return (
                      <div
                        key={idx}
                        onMouseDown={() => handleDateMouseDown(item.dateStr)}
                        onMouseEnter={() => handleDateMouseEnter(item.dateStr)}
                        onMouseUp={() => handleDateMouseUp(item.dateStr)}
                        onClick={() => handleDateClick(item.dateStr)}
                        style={{
                          height: '30px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          backgroundColor: isEndpoint ? '#7F56D9' : isSelected ? '#F9F5FF' : 'transparent',
                          color: isEndpoint ? '#FFFFFF' : isSelected ? '#7F56D9' : 'var(--text)',
                          borderRadius: isEndpoint ? '50%' : '0',
                          fontWeight: isEndpoint ? '700' : '400',
                          transition: 'background-color 0.1s ease'
                        }}
                      >
                        {item.day}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Month Calendar (Desktop View) */}
              <div className="desktop-only-calendar" style={{ width: '230px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ width: 18 }} />
                  <strong style={{ fontSize: '0.9rem' }}>
                    {monthNames[rightMonth]} {rightYear}
                  </strong>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', color: 'var(--text-muted)' }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center', marginBottom: '0.4rem' }}>
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <span key={d} style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                      {d}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
                  {rightDays.map((item, idx) => {
                    if (!item.current) {
                      return <div key={idx} style={{ height: '30px' }} />;
                    }
                    const isSelected = isSelectedRange(item.dateStr);
                    const isEndpoint = isStartOrEndDate(item.dateStr);

                    return (
                      <div
                        key={idx}
                        onMouseDown={() => handleDateMouseDown(item.dateStr)}
                        onMouseEnter={() => handleDateMouseEnter(item.dateStr)}
                        onMouseUp={() => handleDateMouseUp(item.dateStr)}
                        onClick={() => handleDateClick(item.dateStr)}
                        style={{
                          height: '30px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          backgroundColor: isEndpoint ? '#7F56D9' : isSelected ? '#F9F5FF' : 'transparent',
                          color: isEndpoint ? '#FFFFFF' : isSelected ? '#7F56D9' : 'var(--text)',
                          borderRadius: isEndpoint ? '50%' : '0',
                          fontWeight: isEndpoint ? '700' : '400',
                          transition: 'background-color 0.1s ease'
                        }}
                      >
                        {item.day}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar Input Preview & Action Buttons */}
          <div
            style={{
              borderTop: '1px solid var(--border)',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--surface-muted)',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
              <input
                type="text"
                readOnly
                placeholder="D / M / YYYY"
                className="input font-mono"
                style={{ width: '105px', padding: '0.3rem 0.45rem', fontSize: '0.8rem', textAlign: 'center' }}
                value={formatShortInputDate(tempStart)}
              />
              <span style={{ color: 'var(--text-muted)' }}>–</span>
              <input
                type="text"
                readOnly
                placeholder="D / M / YYYY"
                className="input font-mono"
                style={{ width: '105px', padding: '0.3rem 0.45rem', fontSize: '0.8rem', textAlign: 'center' }}
                value={formatShortInputDate(tempEnd || (tempStart && hoverDate ? hoverDate : ''))}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsOpen(false)}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleApply}
                style={{
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.82rem',
                  backgroundColor: '#7F56D9',
                  borderColor: '#7F56D9',
                  color: '#FFFFFF'
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
