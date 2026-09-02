import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Plus, Edit3, Trash2, Filter, FileText } from 'lucide-react';
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
  const [mealTypeFilter, setMealTypeFilter] = useState('');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const fetchEntries = async () => {
    if (!activeWorkspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let url = `/workspaces/${activeWorkspaceId}/entries`;
      if (mealTypeFilter) url += `?mealType=${mealTypeFilter}`;
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
  }, [activeWorkspaceId, mealTypeFilter]);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>Filter Meal Type:</span>
          </div>

          <select
            className="select"
            style={{ width: 'auto', minWidth: '150px' }}
            value={mealTypeFilter}
            onChange={(e) => setMealTypeFilter(e.target.value)}
          >
            <option value="">All Meals</option>
            <option value="MORNING">Morning Only</option>
            <option value="NIGHT">Night Only</option>
          </select>
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
                {entries.map((entry) => {
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
            {entries.map((entry) => {
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
