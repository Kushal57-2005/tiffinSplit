import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';

import { CustomSelectDropdown } from '../components/UI/CustomSelectDropdown';

export function InvoiceGenerate() {
  const { activeWorkspaceId, apiFetch } = useAuth();
  const navigate = useNavigate();

  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState([]);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleFetchPreview = async () => {
    if (!activeWorkspaceId) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(
        `/workspaces/${activeWorkspaceId}/invoices/preview?month=${month}&year=${year}`
      );
      setPreviews(data.previews || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch invoice preview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchPreview();
  }, [activeWorkspaceId, month, year]);

  const handleGenerate = async () => {
    if (previews.length === 0) return;

    setGenerating(true);
    setError('');
    try {
      await apiFetch(`/workspaces/${activeWorkspaceId}/invoices/generate`, {
        method: 'POST',
        body: JSON.stringify({ month, year })
      });
      navigate('/invoices');
    } catch (err) {
      setError(err.message || 'Failed to generate invoices');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/invoices')} style={{ marginBottom: '0.75rem' }}>
          <ArrowLeft size={14} /> Back to Invoices
        </Button>
        <h1>Generate Monthly Invoices</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Calculates monthly totals and creates immutable billing snapshots for each friend
        </p>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-text)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <Card title="Billing Period Selection">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          <CustomSelectDropdown
            label="Month"
            value={month}
            onChange={(val) => setMonth(parseInt(val))}
            options={monthNames.map((mName, idx) => ({
              label: mName,
              value: idx + 1
            }))}
            minWidth="100%"
          />

          <CustomSelectDropdown
            label="Year"
            value={year}
            onChange={(val) => setYear(parseInt(val))}
            options={[
              { label: '2025', value: 2025 },
              { label: '2026', value: 2026 },
              { label: '2027', value: 2027 }
            ]}
            minWidth="100%"
          />
        </div>
      </Card>

      {loading ? (
        <LoadingSpinner message="Calculating meal totals for selected period..." />
      ) : (
        <Card title={`Invoice Preview — ${monthNames[month - 1]} ${year}`}>
          {previews.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0' }}>
              No meal entries found for {monthNames[month - 1]} {year}. Add meal entries first to generate invoices.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Friend</th>
                      <th className="num">Meals</th>
                      <th className="num">Total Qty</th>
                      <th className="num">Calculated Subtotal</th>
                      <th style={{ width: '160px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previews.map((p) => (
                      <tr key={p.friend.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="font-mono" style={{ fontWeight: '600', padding: '0.15rem 0.4rem', backgroundColor: 'var(--surface-muted)', borderRadius: 'var(--radius-sm)' }}>
                              {p.friend.shortCode}
                            </span>
                            <span style={{ fontWeight: '500' }}>{p.friend.fullName}</span>
                          </div>
                        </td>
                        <td className="num">{p.totalMeals}</td>
                        <td className="num">{p.totalQuantity}</td>
                        <td className="num" style={{ fontWeight: '600' }}>
                          ₹{p.subtotalAmount.toLocaleString()}
                        </td>
                        <td>
                          {p.alreadyGenerated ? (
                            <Badge variant="info">Snapshot Exists</Badge>
                          ) : (
                            <Badge variant="neutral">Ready to Generate</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={handleGenerate} disabled={generating} size="lg">
                  <FileSpreadsheet size={18} />
                  <span>{generating ? 'Creating Snapshots...' : `Generate ${previews.length} Invoices`}</span>
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
