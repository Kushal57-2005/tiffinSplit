import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Plus, Edit3, Trash2, Filter, FileText, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { EmptyState } from '../components/UI/EmptyState';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { BulkMealModal } from '../components/BulkMealModal';

export function MealEntries() {
  const { activeWorkspaceId, apiFetch } = useAuth();
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [mealTypeFilter, setMealTypeFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchEntries = async () => {
    if (!activeWorkspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let url = `/workspaces/${activeWorkspaceId}/entries`;
      const params = new URLSearchParams();
      if (mealTypeFilter) params.append('mealType', mealTypeFilter);
      if (selectedMonth) params.append('month', selectedMonth);
      if (selectedYear) params.append('year', selectedYear);
      if (params.toString()) url += `?${params.toString()}`;

      const data = await apiFetch(url);
      setEntries(data);
    } catch (err) {
      console.error('Failed to fetch entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [activeWorkspaceId, mealTypeFilter, selectedMonth, selectedYear]);

  const filteredEntries = entries
    .filter((entry) => {
      const entryDateStr = new Date(entry.entryDate).toISOString().split('T')[0];
      if (startDate && entryDateStr < startDate) return false;
      if (endDate && entryDateStr > endDate) return false;
      return true;
    })
    .sort((a, b) => {
      const timeA = new Date(a.entryDate).getTime();
      const timeB = new Date(b.entryDate).getTime();
      if (sortOrder === 'ASC') {
        return timeA - timeB;
      }
      return timeB - timeA;
    });

  const handleDelete = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this meal entry? This action will be recorded in the activity log.')) {
      return;
    }

    try {
      await apiFetch(`/workspaces/${activeWorkspaceId}/entries/${entryId}`, {
        method: 'DELETE'
      });
      fetchEntries();
    } catch (err) {
      alert(err.message || 'Failed to delete entry');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1>Meal Entries</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Daily morning and night meal records
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', width: '100%', maxWidth: '360px' }}>
          <Button variant="secondary" onClick={() => setIsBulkModalOpen(true)} style={{ flex: 1 }}>
            <FileText size={16} />
            <span>Bulk Import</span>
          </Button>
          <Button onClick={() => navigate('/entries/new')} style={{ flex: 1 }}>
            <Plus size={16} />
            <span>+ Add Meal</span>
          </Button>
        </div>
      </div>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.85rem' }}>
              <Filter size={16} />
              <span>Filter & Sort:</span>
            </div>

            {/* Date Range Inputs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>From:</span>
              <input
                type="date"
                className="input font-mono"
                style={{ width: 'auto', padding: '0.35rem 0.5rem', fontSize: '0.82rem' }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>To:</span>
              <input
                type="date"
                className="input font-mono"
                style={{ width: 'auto', padding: '0.35rem 0.5rem', fontSize: '0.82rem' }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Month Selector */}
            <select
              className="select"
              style={{ width: 'auto', minWidth: '120px', padding: '0.35rem 0.5rem', fontSize: '0.82rem' }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="">All Months</option>
              {monthNames.map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>

            {/* Year Selector */}
            <select
              className="select"
              style={{ width: 'auto', minWidth: '95px', padding: '0.35rem 0.5rem', fontSize: '0.82rem' }}
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="">All Years</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>

            {/* Meal Type Selector */}
            <select
              className="select"
              style={{ width: 'auto', minWidth: '125px', padding: '0.35rem 0.5rem', fontSize: '0.82rem' }}
              value={mealTypeFilter}
              onChange={(e) => setMealTypeFilter(e.target.value)}
            >
              <option value="">All Meal Types</option>
              <option value="MORNING">Morning Only</option>
              <option value="NIGHT">Night Only</option>
            </select>

            {/* Sort Order Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Sort:</span>
              <select
                className="select"
                style={{ width: 'auto', minWidth: '135px', padding: '0.35rem 0.5rem', fontSize: '0.82rem' }}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="DESC">Newest First (↓)</option>
                <option value="ASC">Oldest First (↑)</option>
              </select>
            </div>

            {(startDate || endDate || selectedMonth || selectedYear || mealTypeFilter || sortOrder !== 'DESC') && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setSelectedMonth('');
                  setSelectedYear('');
                  setMealTypeFilter('');
                  setSortOrder('DESC');
                }}
                style={{ fontSize: '0.78rem', padding: '0.3rem 0.55rem' }}
              >
                <X size={14} /> Clear
              </Button>
            )}
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '500' }}>
            Showing {filteredEntries.length} {filteredEntries.length === 1 ? 'record' : 'records'}
          </div>
        </div>
      </Card>

      {loading ? (
        <LoadingSpinner message="Fetching meal records..." />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No meal entries recorded yet"
          description="Click + Add Meal Entry or Bulk Import to log morning and night tiffins for household friends."
          action={
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button variant="secondary" onClick={() => setIsBulkModalOpen(true)}>
                <FileText size={16} />
                <span>Bulk Import</span>
              </Button>
              <Button onClick={() => navigate('/entries/new')}>
                <Plus size={16} />
                <span>+ Add First Meal</span>
              </Button>
            </div>
          }
        />
      ) : filteredEntries.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="No meal entries match selected filters"
          description="Try adjusting your date range, month, year, or meal type filter settings."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSelectedMonth('');
                setSelectedYear('');
                setMealTypeFilter('');
                setSortOrder('DESC');
              }}
            >
              <X size={16} />
              <span>Reset Filters</span>
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="table-container desktop-only-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Meal Type</th>
                  <th>Friends Included</th>
                  <th className="num">Total Qty</th>
                  <th className="num">Total Amount</th>
                  <th>Recorded By</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => {
                  const totalQty = entry.items ? entry.items.reduce((acc, i) => acc + i.quantity, 0) : 0;
                  const totalAmount = entry.items ? entry.items.reduce((acc, i) => acc + i.lineTotal, 0) : 0;

                  return (
                    <tr key={entry.id}>
                      <td style={{ fontWeight: '500' }}>
                        {new Date(entry.entryDate).toLocaleDateString(undefined, {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td>
                        <Badge variant={entry.mealType === 'MORNING' ? 'info' : 'neutral'}>
                          {entry.mealType}
                        </Badge>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {entry.items.map((item) => (
                            <span
                              key={item.id}
                              className="font-mono"
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                padding: '0.15rem 0.4rem',
                                backgroundColor: 'var(--surface-muted)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border)'
                              }}
                            >
                              {item.friend.shortCode} {item.quantity > 1 ? `(${item.quantity})` : ''}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="num">{totalQty}</td>
                      <td className="num" style={{ fontWeight: '600' }}>
                        ₹{totalAmount.toLocaleString()}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {entry.createdBy ? entry.createdBy.name : 'Member'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/entries/${entry.id}/edit`)}
                            title="Edit Entry"
                          >
                            <Edit3 size={14} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(entry.id)}
                            title="Delete Entry"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="mobile-only-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {filteredEntries.map((entry) => {
              const totalQty = entry.items ? entry.items.reduce((acc, i) => acc + i.quantity, 0) : 0;
              const totalAmount = entry.items ? entry.items.reduce((acc, i) => acc + i.lineTotal, 0) : 0;

              return (
                <div key={entry.id} className="mobile-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                      {new Date(entry.entryDate).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    <Badge variant={entry.mealType === 'MORNING' ? 'info' : 'neutral'}>
                      {entry.mealType}
                    </Badge>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', margin: '0.3rem 0' }}>
                    {entry.items.map((item) => (
                      <span
                        key={item.id}
                        className="font-mono"
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: '600',
                          padding: '0.15rem 0.45rem',
                          backgroundColor: 'var(--surface-muted)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)'
                        }}
                      >
                        {item.friend.shortCode} {item.quantity > 1 ? `(${item.quantity})` : ''}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.4rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Total Qty: <strong style={{ color: 'var(--text)' }}>{totalQty}</strong> • Amount: <strong style={{ color: 'var(--success-text)' }} className="font-mono">₹{totalAmount}</strong>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/entries/${entry.id}/edit`)}
                      >
                        <Edit3 size={14} />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <BulkMealModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onImportSuccess={fetchEntries}
      />
    </div>
  );
}
