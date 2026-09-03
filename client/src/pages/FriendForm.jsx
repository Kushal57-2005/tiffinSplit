import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User, Phone, Mail, CreditCard, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';

export function FriendForm() {
  const { friendId } = useParams();
  const { activeWorkspaceId, apiFetch } = useAuth();
  const navigate = useNavigate();

  const isEdit = Boolean(friendId);

  const [fullName, setFullName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [upiId, setUpiId] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit || !activeWorkspaceId) return;

    const fetchFriend = async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`/workspaces/${activeWorkspaceId}/friends/${friendId}`);
        if (data) {
          setFullName(data.fullName || '');
          setShortCode(data.shortCode || '');
          setPhone(data.phone || '');
          setEmail(data.email || '');
          setUpiId(data.upiId || '');
          setNotes(data.notes || '');
          setIsActive(data.isActive !== false);
        }
      } catch (err) {
        setError(err.message || 'Failed to load friend details');
      } finally {
        setLoading(false);
      }
    };

    fetchFriend();
  }, [isEdit, activeWorkspaceId, friendId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !shortCode.trim()) {
      setError('Full Name and Short Code are required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        fullName: fullName.trim(),
        shortCode: shortCode.trim().toUpperCase(),
        phone: phone.trim(),
        email: email.trim(),
        upiId: upiId.trim(),
        notes: notes.trim(),
        isActive
      };

      if (isEdit) {
        await apiFetch(`/workspaces/${activeWorkspaceId}/friends/${friendId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch(`/workspaces/${activeWorkspaceId}/friends`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      navigate('/friends');
    } catch (err) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} friend`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading roommate profile..." />;

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/friends')} style={{ marginBottom: '0.75rem', borderRadius: '12px' }}>
          <ArrowLeft size={16} /> Back to Friends
        </Button>
        <h1>{isEdit ? 'Edit Roommate Profile' : 'Add New Roommate'}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
          {isEdit ? 'Update contact details, UPI ID, and status' : 'Add a new friend or roommate to log and split daily tiffin meals'}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="input"
                required
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ borderRadius: '12px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Short Code * (Used in logs e.g. R or RS)</label>
              <input
                type="text"
                className="input font-mono"
                required
                maxLength={6}
                placeholder="e.g. RS or R"
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value.toUpperCase())}
                style={{ borderRadius: '12px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Phone Number (Optional)</label>
              <input
                type="tel"
                className="input font-mono"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ borderRadius: '12px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email (Optional)</label>
              <input
                type="email"
                className="input"
                placeholder="rahul@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ borderRadius: '12px' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">UPI ID for Direct Billing (Optional)</label>
            <input
              type="text"
              className="input font-mono"
              placeholder="rahul@okaxis"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              style={{ borderRadius: '12px' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Notes (Optional)</label>
            <textarea
              className="textarea"
              rows={3}
              placeholder="Dietary preferences, room number, or special notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ borderRadius: '12px' }}
            />
          </div>


          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => navigate('/friends')} style={{ borderRadius: '12px' }}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} style={{ borderRadius: '12px', padding: '0.55rem 1.25rem' }}>
              <Save size={16} />
              <span>{submitting ? 'Saving...' : isEdit ? 'Update Roommate' : 'Save Roommate'}</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
