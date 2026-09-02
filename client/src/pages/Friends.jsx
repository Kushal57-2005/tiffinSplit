import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Edit3, UserCheck, UserX, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { Modal } from '../components/UI/Modal';
import { EmptyState } from '../components/UI/EmptyState';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';

export function Friends() {
  const { activeWorkspaceId, apiFetch } = useAuth();
  const navigate = useNavigate();

  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFriend, setEditingFriend] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    shortCode: '',
    email: '',
    phone: '',
    upiId: '',
    notes: ''
  });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchFriends = async () => {
    if (!activeWorkspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch(
        `/workspaces/${activeWorkspaceId}/friends?includeInactive=${includeInactive}`
      );
      setFriends(data);
    } catch (err) {
      console.error('Failed to fetch friends:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [activeWorkspaceId, includeInactive]);

  const openCreateModal = () => {
    setEditingFriend(null);
    setFormData({ fullName: '', shortCode: '', email: '', phone: '', upiId: '', notes: '' });
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (friend) => {
    setEditingFriend(friend);
    setFormData({
      fullName: friend.fullName || '',
      shortCode: friend.shortCode || '',
      email: friend.email || '',
      phone: friend.phone || '',
      upiId: friend.upiId || '',
      notes: friend.notes || ''
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);

    try {
      if (editingFriend) {
        await apiFetch(`/workspaces/${activeWorkspaceId}/friends/${editingFriend.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await apiFetch(`/workspaces/${activeWorkspaceId}/friends`, {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setIsModalOpen(false);
      fetchFriends();
    } catch (err) {
      setModalError(err.message || 'Failed to save friend');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (friend) => {
    try {
      await apiFetch(`/workspaces/${activeWorkspaceId}/friends/${friend.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !friend.isActive })
      });
      fetchFriends();
    } catch (err) {
      alert(err.message || 'Failed to change status');
    }
  };

  const filteredFriends = friends.filter((f) => {
    const q = searchQuery.toLowerCase();
    return (
      f.fullName.toLowerCase().includes(q) ||
      f.shortCode.toLowerCase().includes(q) ||
      (f.email && f.email.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1>Friends & Roommates</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            People whose daily tiffin meals are logged and billed in this household
          </p>
        </div>
        <Button onClick={openCreateModal} className="btn-mobile-full">
          <Plus size={16} />
          <span>+ Add Friend</span>
        </Button>
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Search by name or short code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <label className="checkbox-label" style={{ fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              className="checkbox-input"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            <span>Include inactive friends</span>
          </label>
        </div>
      </Card>

      {loading ? (
        <LoadingSpinner message="Fetching friends list..." />
      ) : filteredFriends.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No friends found"
          description="Add friends or roommates to start logging daily meals for them."
          action={
            <Button onClick={openCreateModal}>
              <Plus size={16} />
              <span>Add Friend</span>
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
                  <th>Roommate</th>
                  <th>Short Code</th>
                  <th>Contact</th>
                  <th>UPI Payment Identifier</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFriends.map((friend) => {
                  const initials = friend.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                  return (
                    <tr key={friend.id} style={{ opacity: friend.isActive ? 1 : 0.6 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--surface-muted)',
                              color: 'var(--brown)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '600',
                              fontSize: '0.85rem',
                              border: '1px solid var(--border)',
                              flexShrink: 0
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600' }}>{friend.fullName}</div>
                            {friend.notes && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {friend.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="font-mono" style={{ fontWeight: '600', padding: '0.2rem 0.5rem', backgroundColor: 'var(--surface-muted)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                          {friend.shortCode}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {friend.phone || friend.email || '—'}
                      </td>
                      <td style={{ fontSize: '0.85rem' }} className="font-mono">
                        {friend.upiId || '—'}
                      </td>
                      <td>
                        <Badge variant={friend.isActive ? 'success' : 'neutral'}>
                          {friend.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <Button variant="secondary" size="sm" onClick={() => navigate(`/friends/${friend.id}`)} title="View Profile">
                            <Eye size={14} />
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => openEditModal(friend)} title="Edit Friend">
                            <Edit3 size={14} />
                          </Button>
                          <Button
                            variant={friend.isActive ? 'secondary' : 'primary'}
                            size="sm"
                            onClick={() => handleToggleStatus(friend)}
                            title={friend.isActive ? 'Deactivate Friend' : 'Activate Friend'}
                          >
                            {friend.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
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
            {filteredFriends.map((friend) => {
              const initials = friend.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

              return (
                <div key={friend.id} className="mobile-card" style={{ opacity: friend.isActive ? 1 : 0.7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--surface-muted)',
                          color: 'var(--brown)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '0.9rem',
                          border: '1px solid var(--border)',
                          flexShrink: 0
                        }}
                      >
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{friend.fullName}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                          <span className="code-id" style={{ fontSize: '0.75rem', padding: '0.1rem 0.35rem', backgroundColor: 'var(--surface-muted)', borderRadius: 'var(--radius-sm)' }}>
                            {friend.shortCode}
                          </span>
                          <Badge variant={friend.isActive ? 'success' : 'neutral'}>
                            {friend.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {(friend.phone || friend.email || friend.upiId) && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0.4rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                      {friend.email && <div>Email: <span className="text-break" style={{ color: 'var(--text)' }}>{friend.email}</span></div>}
                      {friend.phone && <div>Phone: <span style={{ color: 'var(--text)' }}>{friend.phone}</span></div>}
                      {friend.upiId && <div>UPI: <code className="code-id">{friend.upiId}</code></div>}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/friends/${friend.id}`)} style={{ flex: 1 }}>
                      <Eye size={14} />
                      <span>View</span>
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => openEditModal(friend)} style={{ flex: 1 }}>
                      <Edit3 size={14} />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant={friend.isActive ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => handleToggleStatus(friend)}
                    >
                      {friend.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFriend ? `Edit Roommate: ${editingFriend.fullName}` : 'Add Roommate'}
      >
        {modalError && (
          <div style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-text)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {modalError}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="input"
                required
                placeholder="e.g. Rahul Sharma"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Short Code *</label>
              <input
                type="text"
                className="input font-mono"
                required
                placeholder="e.g. KP or S"
                value={formData.shortCode}
                onChange={(e) => setFormData({ ...formData, shortCode: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem' }}>
            <div className="form-group">
              <label className="form-label">Phone (Optional)</label>
              <input
                type="text"
                className="input"
                placeholder="+91 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email (Optional)</label>
              <input
                type="email"
                className="input"
                placeholder="rahul@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">UPI ID for Direct Billing (Optional)</label>
            <input
              type="text"
              className="input font-mono"
              placeholder="rahul@okaxis"
              value={formData.upiId}
              onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <textarea
              className="textarea"
              rows={2}
              placeholder="Dietary preferences..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingFriend ? 'Update Friend' : 'Save Friend'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
