import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';

export function FriendDetail() {
  const { friendId } = useParams();
  const { activeWorkspaceId, apiFetch } = useAuth();
  const navigate = useNavigate();

  const [friend, setFriend] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspaceId || !friendId) {
      setLoading(false);
      return;
    }

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`/workspaces/${activeWorkspaceId}/friends/${friendId}`);
        setFriend(data);
      } catch (err) {
        console.error('Failed to fetch friend detail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [activeWorkspaceId, friendId]);

  if (loading) return <LoadingSpinner message="Loading friend profile..." />;
  if (!friend) return <div style={{ padding: '2rem', textAlign: 'center' }}>Friend profile not found.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/friends')} style={{ marginBottom: '0.75rem' }}>
          <ArrowLeft size={14} /> Back to Friends
        </Button>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.65rem' }}>
          <h1>{friend.fullName}</h1>
          <span className="font-mono" style={{ fontWeight: '600', padding: '0.15rem 0.5rem', backgroundColor: 'var(--surface-muted)', borderRadius: 'var(--radius-sm)' }}>
            {friend.shortCode}
          </span>
          <Badge variant={friend.isActive ? 'success' : 'neutral'}>
            {friend.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      <Card title="Contact & Profile Info">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem', fontSize: '0.9rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Phone</span>
            <p style={{ fontWeight: '500' }}>{friend.phone || 'Not provided'}</p>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Email</span>
            <p className="text-break" style={{ fontWeight: '500' }}>{friend.email || 'Not provided'}</p>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>UPI ID</span>
            <p className="font-mono text-break" style={{ fontWeight: '500' }}>{friend.upiId || 'Not provided'}</p>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Notes</span>
            <p style={{ fontWeight: '500' }}>{friend.notes || 'None'}</p>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <Card title="Invoice History">
          {(!friend.invoices || friend.invoices.length === 0) ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>
              No invoices generated for this friend yet.
            </p>
          ) : (
            <div className="table-container" style={{ overflowX: 'hidden' }}>
              <table className="table" style={{ fontSize: '0.82rem', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.5rem 0.35rem' }}>Period</th>
                    <th className="num" style={{ padding: '0.5rem 0.35rem' }}>Meals</th>
                    <th className="num" style={{ padding: '0.5rem 0.35rem' }}>Total</th>
                    <th className="num" style={{ padding: '0.5rem 0.35rem' }}>Due</th>
                    <th style={{ padding: '0.5rem 0.35rem', textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {friend.invoices.map((inv) => (
                    <tr key={inv.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/invoices/${inv.id}`)}>
                      <td style={{ padding: '0.5rem 0.35rem', fontWeight: '500' }}>{inv.month}/{inv.year}</td>
                      <td className="num" style={{ padding: '0.5rem 0.35rem' }}>{inv.totalMeals}</td>
                      <td className="num" style={{ padding: '0.5rem 0.35rem' }}>₹{inv.totalAmount.toLocaleString()}</td>
                      <td className="num" style={{ padding: '0.5rem 0.35rem' }}>₹{inv.amountDue.toLocaleString()}</td>
                      <td style={{ padding: '0.5rem 0.35rem', textAlign: 'right' }}>
                        <Badge variant={inv.status === 'PAID' ? 'success' : inv.status === 'PARTIALLY_PAID' ? 'warning' : 'info'} style={{ fontSize: '0.7rem', padding: '0.15rem 0.35rem' }}>
                          {inv.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Recent Payments">
          {(!friend.payments || friend.payments.length === 0) ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>
              No payments recorded for this friend yet.
            </p>
          ) : (
            <div className="table-container" style={{ overflowX: 'hidden' }}>
              <table className="table" style={{ fontSize: '0.82rem', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.5rem 0.4rem' }}>Date</th>
                    <th style={{ padding: '0.5rem 0.4rem' }}>Method</th>
                    <th className="num" style={{ padding: '0.5rem 0.4rem' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {friend.payments.map((p) => (
                    <tr key={p.id}>
                      <td style={{ padding: '0.5rem 0.4rem' }}>{new Date(p.paidAt).toLocaleDateString()}</td>
                      <td style={{ padding: '0.5rem 0.4rem' }}><Badge variant="neutral">{p.paymentMethod}</Badge></td>
                      <td className="num" style={{ padding: '0.5rem 0.4rem', fontWeight: '600' }}>₹{p.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
