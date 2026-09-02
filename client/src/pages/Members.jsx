import React, { useState, useEffect } from 'react';
import { UserPlus, Copy, Check, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { Modal } from '../components/UI/Modal';
import { EmptyState } from '../components/UI/EmptyState';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';

export function Members() {
  const { activeWorkspaceId, apiFetch, user } = useAuth();

  const [members, setMembers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [submittingInvite, setSubmittingInvite] = useState(false);

  const fetchMembers = async () => {
    if (!activeWorkspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch(`/workspaces/${activeWorkspaceId}/members`);
      setMembers(data.members || []);
      setPendingInvitations(data.pendingInvitations || []);
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [activeWorkspaceId]);

  const openInviteModal = () => {
    setInviteEmail('');
    setGeneratedInviteLink('');
    setCopied(false);
    setInviteError('');
    setIsInviteModalOpen(true);
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setInviteError('');

    if (!inviteEmail || !inviteEmail.trim()) {
      setInviteError('Please enter a valid email address');
      return;
    }

    setSubmittingInvite(true);

    try {
      const inv = await apiFetch(`/workspaces/${activeWorkspaceId}/invitations`, {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail })
      });

      const inviteUrl = `${window.location.origin}/register?invite=${inv.token}`;
      setGeneratedInviteLink(inviteUrl);
      fetchMembers();
    } catch (err) {
      setInviteError(err.message || 'Failed to create invitation');
    } finally {
      setSubmittingInvite(false);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(generatedInviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1>Household Members</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Equal permissions for all members in this shared workspace
          </p>
        </div>
        <Button onClick={openInviteModal} className="btn-mobile-full">
          <UserPlus size={16} />
          <span>Invite Member</span>
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching workspace members..." />
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <Card title="Active Members">
            {/* Desktop Table View */}
            <div className="table-container desktop-only-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Joined Date</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: '600' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--accent-payment)',
                              color: 'var(--accent-payment-text)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '700',
                              fontSize: '0.9rem'
                            }}
                          >
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <span>
                            {m.name} {m.userId === user?.id ? '(You)' : ''}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{m.email}</td>
                      <td>
                        <Badge variant="success">Active Member</Badge>
                      </td>
                      <td className="text-util" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {new Date(m.joinedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="mobile-only-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {members.map((m) => (
                <div key={m.id} className="mobile-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-payment)',
                        color: 'var(--accent-payment-text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '1rem',
                        flexShrink: 0
                      }}
                    >
                      {m.name.charAt(0).toUpperCase()}
                    </div>

                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                        {m.name} {m.userId === user?.id ? '(You)' : ''}
                      </div>
                      <div className="text-break" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {m.email}
                      </div>
                    </div>

                    <Badge variant="success">Active</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {pendingInvitations.length > 0 && (
            <Card title="Pending Invitations">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Invited Email</th>
                      <th>Status</th>
                      <th>Expires At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingInvitations.map((inv) => (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: '500' }}>{inv.email}</td>
                        <td>
                          <Badge variant="warning">
                            <Clock size={12} style={{ marginRight: '0.25rem' }} /> Invitation Pending
                          </Badge>
                        </td>
                        <td className="text-util" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {new Date(inv.expiresAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Roommate / Member"
      >
        {inviteError && (
          <div style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-text)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {inviteError}
          </div>
        )}

        {!generatedInviteLink ? (
          <form onSubmit={handleSendInvite}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Invited members receive full equal permissions to manage friends, log meals, generate invoices, and record payments.
            </p>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="input"
                required
                placeholder="roommate@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <Button variant="secondary" onClick={() => setIsInviteModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submittingInvite}>
                {submittingInvite ? 'Generating...' : 'Create Invitation Link'}
              </Button>
            </div>
          </form>
        ) : (
          <div>
            <div style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Invitation link created for <strong>{inviteEmail}</strong>!
            </div>

            <div className="form-group">
              <label className="form-label">Invitation Link</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="input font-mono"
                  readOnly
                  value={generatedInviteLink}
                />
                <Button variant="secondary" onClick={copyInviteLink}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </Button>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Share this link with your roommate to join the household.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <Button onClick={() => setIsInviteModalOpen(false)}>Done</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
