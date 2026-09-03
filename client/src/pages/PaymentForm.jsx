import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { CustomSelectDropdown } from '../components/UI/CustomSelectDropdown';

export function PaymentForm() {
  const { activeWorkspaceId, apiFetch } = useAuth();
  const navigate = useNavigate();

  const [friends, setFriends] = useState([]);
  const [selectedFriendId, setSelectedFriendId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!activeWorkspaceId) {
      setLoading(false);
      return;
    }

    const fetchFriends = async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`/workspaces/${activeWorkspaceId}/friends?includeInactive=false`);
        setFriends(data || []);
        if (data && data.length > 0) {
          setSelectedFriendId(data[0].id);
        }
      } catch (err) {
        setError(err.message || 'Failed to load roommates list');
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [activeWorkspaceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const amt = parseFloat(amount);
    if (!selectedFriendId || isNaN(amt) || amt <= 0) {
      setError('Please select a roommate and enter a positive payment amount');
      return;
    }

    setSubmitting(true);

    try {
      await apiFetch(`/workspaces/${activeWorkspaceId}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          friendId: selectedFriendId,
          amount: amt,
          paymentMethod,
          transactionRef: transactionRef.trim(),
          notes: notes.trim()
        })
      });

      navigate('/payments');
    } catch (err) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading roommates list..." />;

  const friendOptions = friends.map((f) => ({
    value: f.id,
    label: `${f.fullName} (${f.shortCode})`
  }));

  const methodOptions = [
    { value: 'UPI', label: 'UPI (GPay / PhonePe / Paytm)' },
    { value: 'CASH', label: 'Cash' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer (NEFT/IMPS)' },
    { value: 'OTHER', label: 'Other' }
  ];

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/payments')} style={{ marginBottom: '0.75rem', borderRadius: '12px' }}>
          <ArrowLeft size={16} /> Back to Payments
        </Button>
        <h1>Record Direct Payment</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
          Manually record a payment received from a roommate or friend
        </p>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: 'var(--error-bg)',
            color: 'var(--error-text)',
            padding: '0.85rem 1.1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Roommate / Friend *</label>
            <CustomSelectDropdown
              options={friendOptions}
              value={selectedFriendId}
              onChange={(val) => setSelectedFriendId(val)}
              placeholder="Select roommate..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Payment Amount (₹) *</label>
              <input
                type="number"
                step="1"
                min="1"
                className="input font-mono"
                required
                placeholder="e.g. 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ borderRadius: '12px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Payment Method *</label>
              <CustomSelectDropdown
                options={methodOptions}
                value={paymentMethod}
                onChange={(val) => setPaymentMethod(val)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Transaction Reference / UTR (Optional)</label>
            <input
              type="text"
              className="input font-mono"
              placeholder="UPI Ref ID e.g. 42381920"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              style={{ borderRadius: '12px' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Notes (Optional)</label>
            <textarea
              className="textarea"
              rows={3}
              placeholder="e.g. Sent via PhonePe / GPay"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ borderRadius: '12px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => navigate('/payments')} style={{ borderRadius: '12px' }}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} style={{ borderRadius: '12px', padding: '0.55rem 1.25rem' }}>
              <CreditCard size={16} />
              <span>{submitting ? 'Recording...' : 'Record Payment'}</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
