import React, { useState, useEffect } from 'react';
import { Save, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';

export function Settings() {
  const { activeWorkspaceId, apiFetch, refreshUserData } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    workspaceName: '',
    morningDefaultRate: 40,
    nightDefaultRate: 40,
    currency: 'INR',
    currencySymbol: '₹',
    upiId: '',
    payeeName: '',
    invoiceFooter: ''
  });

  useEffect(() => {
    if (!activeWorkspaceId) {
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`/workspaces/${activeWorkspaceId}/settings`);
        setFormData({
          workspaceName: data.workspaceName || '',
          morningDefaultRate: data.morningDefaultRate || 40,
          nightDefaultRate: data.nightDefaultRate || 40,
          currency: data.currency || 'INR',
          currencySymbol: data.currencySymbol || '₹',
          upiId: data.upiId || '',
          payeeName: data.payeeName || '',
          invoiceFooter: data.invoiceFooter || ''
        });
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [activeWorkspaceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.workspaceName || !formData.workspaceName.trim()) {
      setError('Workspace name cannot be empty');
      return;
    }

    setSubmitting(true);

    try {
      await apiFetch(`/workspaces/${activeWorkspaceId}/settings`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      if (refreshUserData) {
        await refreshUserData();
      }

      setSuccessMsg('Household workspace settings updated successfully');
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading workspace settings..." />;

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1>Household Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
          Organized household workspace profile, billing defaults, and statement options
        </p>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-text)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Section 1: Household Workspace Name */}
        <Card
          title="1. Household Workspace Profile"
          subtitle="Displayed on navigation topbar, workspace dropdown, and statement titles"
        >
          <div className="form-group" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
            <label className="form-label">Household Workspace Name *</label>
            <input
              type="text"
              className="input"
              required
              placeholder="e.g. Roommates Tiffin or Flat 402 Crew"
              value={formData.workspaceName}
              onChange={(e) => setFormData({ ...formData, workspaceName: e.target.value })}
            />
          </div>
        </Card>

        {/* Section 2: Billing Rates */}
        <Card
          title="2. Meal Billing Defaults"
          subtitle="Default prices applied when adding daily morning and night tiffins"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginTop: '0.5rem' }}>
            <div className="form-group">
              <label className="form-label">Morning Meal Default Rate (₹) *</label>
              <input
                type="number"
                className="input font-mono"
                required
                min="0"
                value={formData.morningDefaultRate}
                onChange={(e) => setFormData({ ...formData, morningDefaultRate: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Night Meal Default Rate (₹) *</label>
              <input
                type="number"
                className="input font-mono"
                required
                min="0"
                value={formData.nightDefaultRate}
                onChange={(e) => setFormData({ ...formData, nightDefaultRate: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Payment Details */}
        <Card
          title="3. Payment & UPI Configuration"
          subtitle="Displayed on monthly bill statements for one-tap roommate settlement"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginTop: '0.5rem' }}>
            <div className="form-group">
              <label className="form-label">Payee Name</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Kushal Sharma"
                value={formData.payeeName}
                onChange={(e) => setFormData({ ...formData, payeeName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">UPI ID</label>
              <input
                type="text"
                className="input font-mono"
                placeholder="roommate@okaxis"
                value={formData.upiId}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Section 4: Invoice Statement Options */}
        <Card
          title="4. Invoice Statement Customization"
          subtitle="Customize footer notes included in email and PDF statements"
        >
          <div className="form-group" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
            <label className="form-label">Invoice Footer Note</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Please clear dues by the 5th of every month. Thank you!"
              value={formData.invoiceFooter}
              onChange={(e) => setFormData({ ...formData, invoiceFooter: e.target.value })}
            />
          </div>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" disabled={submitting} size="lg" className="btn-mobile-full">
            <Save size={18} />
            <span>{submitting ? 'Saving Settings...' : 'Save Household Settings'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
