import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

export function DateRangePicker({ startDate, endDate, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  // Temporary selection state inside popover
  const [tempStart, setTempStart] = useState(startDate || '');
  const [tempEnd, setTempEnd] = useState(endDate || '');
  const [hoverDate, setHoverDate] = useState('');
  const [dragStart, setDragStart] = useState(null);

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
      if (dragStart) {
        if (hoverDate && hoverDate !== dragStart) {
          const min = dragStart < hoverDate ? dragStart : hoverDate;
          const max = dragStart > hoverDate ? dragStart : hoverDate;
          setTempStart(min);
          setTempEnd(max);
        }
        setDragStart(null);
        setHoverDate('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [dragStart, hoverDate]);

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

  const handleDateMouseDown = (dateStr) => {
    setDragStart(dateStr);
    setHoverDate(dateStr);
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(dateStr);
      setTempEnd('');
    }
  };

  const handleDateMouseEnter = (dateStr) => {
    if (dragStart || (tempStart && !tempEnd)) {
      setHoverDate(dateStr);
    }
  };

  const handleDateMouseUp = (dateStr) => {
    if (dragStart) {
      if (dragStart !== dateStr) {
        if (dateStr >= dragStart) {
          setTempStart(dragStart);
          setTempEnd(dateStr);
        } else {
          setTempStart(dateStr);
          setTempEnd(dragStart);
        }
      } else {
        if (!tempStart || (tempStart && tempEnd) || tempStart === dateStr) {
          setTempStart(dateStr);
          setTempEnd('');
        } else if (tempStart && !tempEnd) {
          if (dateStr >= tempStart) {
            setTempEnd(dateStr);
          } else {
            setTempEnd(tempStart);
            setTempStart(dateStr);
          }
        }
      }
      setDragStart(null);
      setHoverDate('');
    } else if (tempStart && !tempEnd) {
      if (dateStr >= tempStart) {
        setTempEnd(dateStr);
      } else {
        setTempEnd(tempStart);
        setTempStart(dateStr);
      }
      setHoverDate('');
    }
  };

  const handleApply = () => {
    let finalStart = tempStart;
    let finalEnd = tempEnd;

    if (!finalEnd && finalStart) {
      finalEnd = finalStart;
    } else if (finalStart && finalEnd && finalStart > finalEnd) {
      const swap = finalStart;
      finalStart = finalEnd;
      finalEnd = swap;
    }

    onChange({ startDate: finalStart, endDate: finalEnd, label: 'Custom range' });
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
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, current: false, dateStr: null });
    }
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

  const isRangeActive = Boolean(startDate || endDate);

  const now = new Date();
  const todayYYYYMMDD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger Button (Uses Theme CSS Variables for Light & Dark Mode) */}
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
          border: isOpen ? '2px solid var(--text)' : isRangeActive ? '1.5px solid var(--brown)' : '1px solid var(--border)',
          color: isRangeActive ? 'var(--brown)' : 'var(--text)',
          borderRadius: '12px',
          cursor: 'pointer',
          boxShadow: isOpen ? '0 0 0 3px rgba(148, 109, 109, 0.15)' : 'none',
          transition: 'all 0.15s ease'
        }}
      >
        <CalendarIcon size={16} style={{ color: isRangeActive ? 'var(--brown)' : 'var(--text-muted)' }} />
        <span style={{ fontWeight: isRangeActive ? '600' : '500' }}>{getDisplayText()}</span>
        {isOpen ? (
          <ChevronUp size={16} style={{ color: 'var(--text)' }} />
        ) : (
          <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
        )}
      </button>

      {/* Popover Dropdown Menu (Uses Theme Surface & Border Variables) */}
      {isOpen && (
        <div
          className="date-range-popover"
        >
          <div className="date-picker-body" style={{ display: 'flex', flexWrap: 'wrap' }}>
            {/* Calendar Grid Container */}
            <div
              className="date-picker-grid-container"
              onMouseLeave={() => {
                if (!dragStart) setHoverDate('');
              }}
              style={{ padding: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', userSelect: 'none' }}
            >
              {/* Left Month Calendar */}
              <div className="date-picker-month" style={{ width: '230px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', color: 'var(--text-muted)' }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0', textAlign: 'center' }}>
                  {leftDays.map((item, idx) => {
                    if (!item.current) {
                      return <div key={idx} style={{ height: '32px' }} />;
                    }
                    const effectiveEnd = getEffectiveEnd();
                    const isStart = Boolean(tempStart && item.dateStr === tempStart);
                    const isEnd = Boolean(effectiveEnd && item.dateStr === effectiveEnd);
                    const isSelected = isSelectedRange(item.dateStr);
                    const hasRange = Boolean(tempStart && effectiveEnd && tempStart !== effectiveEnd);
                    const isEndpoint = isStart || isEnd;
                    const isToday = item.dateStr === todayYYYYMMDD;

                    const dayOfWeek = new Date(item.dateStr + 'T00:00:00').getDay();

                    let ribbonLeft = '0';
                    let ribbonRight = '0';
                    let showRibbon = isSelected && hasRange;

                    if (showRibbon) {
                      if (isStart) {
                        ribbonLeft = '50%';
                        ribbonRight = '0';
                      } else if (isEnd) {
                        ribbonLeft = '0';
                        ribbonRight = '50%';
                      }
                    }

                    const ribbonBorderRadiusLeft = (dayOfWeek === 0 || isStart) ? '8px' : '0';
                    const ribbonBorderRadiusRight = (dayOfWeek === 6 || isEnd) ? '8px' : '0';
                    const ribbonBorderRadius = `${ribbonBorderRadiusLeft} ${ribbonBorderRadiusRight} ${ribbonBorderRadiusRight} ${ribbonBorderRadiusLeft}`;

                    return (
                      <div
                        key={idx}
                        onMouseDown={() => handleDateMouseDown(item.dateStr)}
                        onMouseEnter={() => handleDateMouseEnter(item.dateStr)}
                        onMouseUp={() => handleDateMouseUp(item.dateStr)}
                        style={{
                          position: 'relative',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        {showRibbon && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              bottom: 0,
                              left: ribbonLeft,
                              right: ribbonRight,
                              backgroundColor: 'var(--surface-muted)',
                              borderRadius: ribbonBorderRadius,
                              zIndex: 0
                            }}
                          />
                        )}
                        <div
                          style={{
                            position: 'relative',
                            zIndex: 1,
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.82rem',
                            backgroundColor: isEndpoint ? 'var(--brown)' : 'transparent',
                            color: isEndpoint ? 'var(--text-inverse)' : isSelected ? 'var(--brown)' : 'var(--text)',
                            fontWeight: isEndpoint || isToday ? '700' : isSelected ? '600' : '400',
                            transition: 'all 0.1s ease'
                          }}
                        >
                          <span style={{ lineHeight: 1 }}>{item.day}</span>
                          {isToday && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '2px',
                                width: '4px',
                                height: '4px',
                                borderRadius: '50%',
                                backgroundColor: isEndpoint ? 'var(--text-inverse)' : 'var(--brown)'
                              }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Month Calendar (Desktop View) */}
              <div className="desktop-only-calendar date-picker-month" style={{ width: '230px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ width: 18 }} />
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0', textAlign: 'center' }}>
                  {rightDays.map((item, idx) => {
                    if (!item.current) {
                      return <div key={idx} style={{ height: '32px' }} />;
                    }
                    const effectiveEnd = getEffectiveEnd();
                    const isStart = Boolean(tempStart && item.dateStr === tempStart);
                    const isEnd = Boolean(effectiveEnd && item.dateStr === effectiveEnd);
                    const isSelected = isSelectedRange(item.dateStr);
                    const hasRange = Boolean(tempStart && effectiveEnd && tempStart !== effectiveEnd);
                    const isEndpoint = isStart || isEnd;
                    const isToday = item.dateStr === todayYYYYMMDD;

                    const dayOfWeek = new Date(item.dateStr + 'T00:00:00').getDay();

                    let ribbonLeft = '0';
                    let ribbonRight = '0';
                    let showRibbon = isSelected && hasRange;

                    if (showRibbon) {
                      if (isStart) {
                        ribbonLeft = '50%';
                        ribbonRight = '0';
                      } else if (isEnd) {
                        ribbonLeft = '0';
                        ribbonRight = '50%';
                      }
                    }

                    const ribbonBorderRadiusLeft = (dayOfWeek === 0 || isStart) ? '8px' : '0';
                    const ribbonBorderRadiusRight = (dayOfWeek === 6 || isEnd) ? '8px' : '0';
                    const ribbonBorderRadius = `${ribbonBorderRadiusLeft} ${ribbonBorderRadiusRight} ${ribbonBorderRadiusRight} ${ribbonBorderRadiusLeft}`;

                    return (
                      <div
                        key={idx}
                        onMouseDown={() => handleDateMouseDown(item.dateStr)}
                        onMouseEnter={() => handleDateMouseEnter(item.dateStr)}
                        onMouseUp={() => handleDateMouseUp(item.dateStr)}
                        style={{
                          position: 'relative',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        {showRibbon && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              bottom: 0,
                              left: ribbonLeft,
                              right: ribbonRight,
                              backgroundColor: 'var(--surface-muted)',
                              borderRadius: ribbonBorderRadius,
                              zIndex: 0
                            }}
                          />
                        )}
                        <div
                          style={{
                            position: 'relative',
                            zIndex: 1,
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.82rem',
                            backgroundColor: isEndpoint ? 'var(--brown)' : 'transparent',
                            color: isEndpoint ? 'var(--text-inverse)' : isSelected ? 'var(--brown)' : 'var(--text)',
                            fontWeight: isEndpoint || isToday ? '700' : isSelected ? '600' : '400',
                            transition: 'all 0.1s ease'
                          }}
                        >
                          <span style={{ lineHeight: 1 }}>{item.day}</span>
                          {isToday && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '2px',
                                width: '4px',
                                height: '4px',
                                borderRadius: '50%',
                                backgroundColor: isEndpoint ? 'var(--text-inverse)' : 'var(--brown)'
                              }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar Input Preview & Action Buttons */}
          <div
            className="date-picker-bottom-bar"
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
                className="input font-mono date-picker-bottom-input"
                style={{ width: '105px', padding: '0.3rem 0.45rem', fontSize: '0.8rem', textAlign: 'center', borderRadius: '8px', backgroundColor: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
                value={formatShortInputDate(tempStart)}
              />
              <span style={{ color: 'var(--text-muted)' }}>–</span>
              <input
                type="text"
                readOnly
                placeholder="D / M / YYYY"
                className="input font-mono date-picker-bottom-input"
                style={{ width: '105px', padding: '0.3rem 0.45rem', fontSize: '0.8rem', textAlign: 'center', borderRadius: '8px', backgroundColor: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
                value={formatShortInputDate(getEffectiveEnd())}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsOpen(false)}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem', borderRadius: '8px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleApply}
                style={{
                  padding: '0.4rem 0.95rem',
                  fontSize: '0.82rem',
                  backgroundColor: 'var(--brown)',
                  borderColor: 'var(--brown)',
                  color: 'var(--text-inverse)',
                  borderRadius: '8px',
                  fontWeight: '600'
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
