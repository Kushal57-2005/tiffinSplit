import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertTriangle, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Modal } from './UI/Modal';
import { Button } from './UI/Button';
import { Badge } from './UI/Badge';
import { parseBulkMealText } from '../utils/bulkParser';

export function BulkMealModal({ isOpen, onClose, onImportSuccess }) {
  const { activeWorkspaceId, apiFetch } = useAuth();

  const [rawText, setRawText] = useState(
    '01 Aug m K S SB\n02 Aug m K 2KP P SB SH\n03 Aug n K S P'
  );
  const [defaultYear, setDefaultYear] = useState(new Date().getFullYear());
  const [morningRate, setMorningRate] = useState(40);
  const [nightRate, setNightRate] = useState(40);

  const [friends, setFriends] = useState([]);
  const [parsedEntries, setParsedEntries] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!activeWorkspaceId) return;

    apiFetch(`/workspaces/${activeWorkspaceId}/friends?includeInactive=false`)
      .then((fData) => setFriends(fData))
      .catch((err) => console.error('Failed to fetch friends for bulk import:', err));

    apiFetch(`/workspaces/${activeWorkspaceId}/settings`)
      .then((setting) => {
        if (setting) {
          setMorningRate(setting.morningDefaultRate || 40);
          setNightRate(setting.nightDefaultRate || 40);
        }
      })
      .catch(() => {});
  }, [activeWorkspaceId]);

  useEffect(() => {
    const results = parseBulkMealText(rawText, friends, defaultYear, {
      morning: morningRate,
      night: nightRate
    });
    setParsedEntries(results);
  }, [rawText, friends, defaultYear, morningRate, nightRate]);

  const validEntries = parsedEntries.filter((p) => p.isValid);

  const handleBulkSubmit = async () => {
    if (validEntries.length === 0) {
      setError('No valid meal entries found to import');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const payload = validEntries.map((e) => ({
        entryDate: e.entryDate,
        mealType: e.mealType,
        defaultPrice: e.defaultPrice,
        rawNote: e.rawLine,
        items: e.items.map((i) => ({
          friendId: i.friendId,
          quantity: i.quantity,
          unitPrice: i.unitPrice
        }))
      }));

      await apiFetch(`/workspaces/${activeWorkspaceId}/entries/bulk`, {
        method: 'POST',
        body: JSON.stringify({ entries: payload })
      });

      onImportSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to bulk import meals');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Add Daily Meals" maxWidth="760px">
      {error && (
        <div style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-text)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ backgroundColor: 'var(--surface-muted)', padding: '0.85rem 1.1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
          <strong style={{ color: 'var(--text-main)' }}>Text Format Example:</strong>
          <pre className="font-mono" style={{ margin: '0.4rem 0 0 0', whiteSpace: 'pre-wrap', color: 'var(--accent-brown)', fontSize: '0.85rem' }}>
            01 Aug m K S SB{'\n'}
            02 Aug m K 2KP P SB SH
          </pre>
          <p style={{ marginTop: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.4rem 0 0 0' }}>
            Format: <code>[Date] [m/n] [Codes & Quantities]</code> (e.g., <code>2KP</code> = 2 meals for friend KP).
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.85rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Year</label>
            <select className="select" value={defaultYear} onChange={(e) => setDefaultYear(parseInt(e.target.value))}>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Morning Rate (₹)</label>
            <input type="number" className="input font-mono" value={morningRate} onChange={(e) => setMorningRate(parseFloat(e.target.value) || 0)} />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Night Rate (₹)</label>
            <input type="number" className="input font-mono" value={nightRate} onChange={(e) => setNightRate(parseFloat(e.target.value) || 0)} />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Bulk Raw Text Input *</label>
          <textarea
            className="textarea font-mono"
            rows={5}
            placeholder="Type or paste meal records line by line..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            style={{ fontSize: '0.88rem', lineHeight: '1.5' }}
          />
        </div>

        {parsedEntries.length > 0 && (
          <div style={{ marginTop: '0.25rem' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Live Parsed Preview ({validEntries.length} Valid Entries)</span>
            </h4>

            <div className="table-container" style={{ maxHeight: '240px', overflowY: 'auto' }}>
              <table className="table" style={{ fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Line</th>
                    <th style={{ width: '100px' }}>Parsed Date</th>
                    <th style={{ width: '90px' }}>Meal</th>
                    <th>Friends & Qty</th>
                    <th className="num" style={{ width: '90px' }}>Total</th>
                    <th style={{ width: '95px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedEntries.map((p) => (
                    <tr key={p.lineNum} style={{ opacity: p.isValid ? 1 : 0.65 }}>
                      <td className="font-mono">#{p.lineNum}</td>
                      <td style={{ fontWeight: '500' }}>
                        {p.isValid ? new Date(p.entryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                      </td>
                      <td>
                        {p.isValid ? <Badge variant={p.mealType === 'MORNING' ? 'info' : 'neutral'}>{p.mealType}</Badge> : '—'}
                      </td>
                      <td>
                        {p.isValid ? (
                          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                            {p.items.map((i, idx) => (
                              <span key={idx} className="font-mono" style={{ padding: '0.12rem 0.4rem', backgroundColor: 'var(--surface-muted)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.78rem' }}>
                                {i.shortCode} {i.quantity > 1 ? `(${i.quantity})` : ''}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--error-text)' }}>{p.error}</span>
                        )}
                      </td>
                      <td className="num font-mono" style={{ fontWeight: '600' }}>
                        {p.isValid ? `₹${p.items.reduce((acc, i) => acc + i.lineTotal, 0)}` : '—'}
                      </td>
                      <td>
                        {p.isValid ? (
                          <Badge variant="success"><CheckCircle size={11} style={{ marginRight: '0.2rem' }} /> Ready</Badge>
                        ) : (
                          <Badge variant="error"><AlertTriangle size={11} style={{ marginRight: '0.2rem' }} /> Error</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={onClose} style={{ flex: '1 1 100px' }}>
            Cancel
          </Button>
          <Button onClick={handleBulkSubmit} disabled={submitting || validEntries.length === 0} style={{ flex: '2 1 180px' }}>
            <Upload size={16} />
            <span>{submitting ? 'Importing...' : `Import ${validEntries.length} Meals`}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
