import React, { useState, useEffect } from 'react';
import { Wallet, CreditCard, CheckCircle2, XCircle, AlertTriangle, X, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { Card } from '../components/UI/Card';
import { Modal } from '../components/UI/Modal';
import { EmptyState } from '../components/UI/EmptyState';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { normalizePhoneNumber, formatWhatsAppPaymentRejectedMessage, createWhatsAppUrl, getPublicAppUrl } from '../utils/whatsapp';

export function Payments() {
  const { activeWorkspaceId, activeWorkspace, apiFetch } = useAuth();

  const [payments, setPayments] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  // Month, Year & Status Filter states
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Record Payment Modal (Head bypass direct record)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Head Verification / Rejection Modals
  const [verifyModal, setVerifyModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const isHead = !activeWorkspace?.role || activeWorkspace?.role === 'HEAD';

  const fetchPaymentsData = async () => {
    if (!activeWorkspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const pData = await apiFetch(`/workspaces/${activeWorkspaceId}/payments`);
      setPayments(pData);

      const pendingData = await apiFetch(`/workspaces/${activeWorkspaceId}/payments/pending`);
      setPendingPayments(pendingData);

      const fData = await apiFetch(`/workspaces/${activeWorkspaceId}/friends?includeInactive=false`);
      setFriends(fData);
    } catch (err) {
      console.error('Failed to fetch payments data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsData();
  }, [activeWorkspaceId]);

  const openPaymentModal = () => {
    setSelectedFriendId(friends.length > 0 ? friends[0].id : '');
    setAmount('');
    setPaymentMethod('UPI');
    setTransactionRef('');
    setNotes('');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setModalError('');

    const amt = parseFloat(amount);
    if (!selectedFriendId || isNaN(amt) || amt <= 0) {
      setModalError('Friend and a positive payment amount are required');
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
          transactionRef,
          notes
        })
      });

      setIsModalOpen(false);
      fetchPaymentsData();
    } catch (err) {
      setModalError(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyConfirm = async () => {
    if (!verifyModal) return;
    setProcessingAction(true);
    setFeedback(null);
    try {
      await apiFetch(`/workspaces/${activeWorkspaceId}/payments/${verifyModal.id}/verify`, {
        method: 'POST'
      });

      setFeedback({
        type: 'success',
        message: `Successfully verified ₹${verifyModal.amount.toLocaleString()} payment for ${verifyModal.friend.fullName}!`
      });
      setVerifyModal(null);
      fetchPaymentsData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to verify payment' });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal) return;
    setProcessingAction(true);
    setFeedback(null);
    try {
      await apiFetch(`/workspaces/${activeWorkspaceId}/payments/${rejectModal.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: actionReason })
      });

      const targetPhone = rejectModal.friend?.phone;
      const cleanPhone = normalizePhoneNumber(targetPhone);
      const name = rejectModal.friend?.fullName || 'there';
      const invId = rejectModal.invoiceId || rejectModal.invoice?.id;
      const invoiceUrl = invId ? getPublicAppUrl(`/invoices/view/${invId}`) : getPublicAppUrl('/invoices');

      let whatsappOpened = false;
      if (cleanPhone) {
        const message = formatWhatsAppPaymentRejectedMessage({
          friendName: name,
          amount: rejectModal.amount,
          reason: actionReason,
          invoiceUrl
        });
        const whatsappUrl = createWhatsAppUrl(targetPhone, message);
        if (whatsappUrl) {
          window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
          whatsappOpened = true;
        }
      }

      setFeedback({
        type: 'success',
        message: whatsappOpened
          ? `Payment rejected. WhatsApp opened to send rejection notice to ${name}.`
          : `Payment rejected. (Add phone number for ${name} to send WhatsApp rejection notices).`
      });
      setRejectModal(null);
      setActionReason('');
      fetchPaymentsData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to reject payment' });
    } finally {
      setProcessingAction(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const filteredPayments = payments.filter((p) => {
    const pDate = new Date(p.paidAt || p.createdAt);
    const pMonth = p.invoice ? p.invoice.month : (pDate.getMonth() + 1);
    const pYear = p.invoice ? p.invoice.year : pDate.getFullYear();

    if (selectedMonth && String(pMonth) !== String(selectedMonth)) return false;
    if (selectedYear && String(pYear) !== String(selectedYear)) return false;
    if (selectedStatus && p.paymentStatus !== selectedStatus) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1>Payment History & Verifications</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Review pending payment reports from roommates and track verified financial history
          </p>
        </div>
        <Button onClick={openPaymentModal} className="btn-mobile-full">
          <CreditCard size={16} />
          <span>Record Direct Payment</span>
        </Button>
      </div>

      {feedback && (
        <div
          style={{
            backgroundColor: feedback.type === 'success' ? 'var(--success-bg)' : 'var(--error-bg)',
            color: feedback.type === 'success' ? 'var(--success-text)' : 'var(--error-text)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* PENDING PAYMENT VERIFICATIONS SECTION */}
      {pendingPayments.length > 0 && (
        <Card
          title="Pending Payment Verifications"
          subtitle="Submitted 'I Paid' reports requiring Head review before updating invoice balances"
          style={{ border: '2px solid var(--warning-text)' }}
        >
          {/* Desktop Table View */}
          <div className="table-container desktop-only-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Roommate</th>
                  <th>Invoice Ref</th>
                  <th className="num">Reported Amount</th>
                  <th>UTR / Transaction Ref</th>
                  <th>Reported Date</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.map((p) => {
                  const invRef = p.invoice
                    ? `INV-${p.invoice.year}-${String(p.invoice.month).padStart(2, '0')}-${p.friend.shortCode}`
                    : 'N/A';

                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className="code-id" style={{ fontWeight: '600', fontSize: '0.78rem', padding: '0.15rem 0.4rem', backgroundColor: 'var(--surface-muted)', borderRadius: 'var(--radius-sm)' }}>
                            {p.friend.shortCode}
                          </span>
                          <span style={{ fontWeight: '600' }}>{p.friend.fullName}</span>
                        </div>
                      </td>
                      <td>
                        <span className="code-id" style={{ fontSize: '0.82rem', color: 'var(--purple)' }}>
                          {invRef}
                        </span>
                      </td>
                      <td className="num font-mono" style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--warning-text)' }}>
                        ₹{p.amount.toLocaleString()}
                      </td>
                      <td>
                        <code className="code-id" style={{ fontSize: '0.82rem', background: 'var(--surface-muted)', padding: '0.15rem 0.4rem', borderRadius: 'var(--radius-sm)' }}>
                          {p.transactionRef || 'None'}
                        </code>
                      </td>
                      <td className="text-util" style={{ fontSize: '0.82rem' }}>
                        {p.reportedAt ? new Date(p.reportedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : new Date(p.paidAt).toLocaleDateString()}
                      </td>
                      <td>
                        <Badge variant="payment">{p.paymentMethod}</Badge>
                      </td>
                      <td>
                        <Badge variant="warning">PENDING VERIFICATION</Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {isHead ? (
                          <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setVerifyModal(p)}
                              style={{ borderColor: 'var(--success-text)', color: 'var(--success-text)', padding: '0.35rem 0.65rem' }}
                            >
                              <CheckCircle2 size={14} />
                              <span>Verify & Mark Paid</span>
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setRejectModal(p);
                                setActionReason('');
                              }}
                              style={{ borderColor: 'var(--error-text)', color: 'var(--error-text)', padding: '0.35rem 0.65rem' }}
                            >
                              <XCircle size={14} />
                              <span>Payment Not Received</span>
                            </Button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Waiting for Head</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="mobile-only-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {pendingPayments.map((p) => {
              const invRef = p.invoice
                ? `INV-${p.invoice.year}-${String(p.invoice.month).padStart(2, '0')}-${p.friend.shortCode}`
                : 'N/A';
              return (
                <div key={p.id} className="mobile-card" style={{ border: '1px solid var(--warning-text)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="code-id" style={{ fontWeight: '600', fontSize: '0.78rem', padding: '0.15rem 0.4rem', backgroundColor: 'var(--surface-muted)', borderRadius: 'var(--radius-sm)' }}>
                        {p.friend.shortCode}
                      </span>
                      <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{p.friend.fullName}</span>
                    </div>
                    <span className="font-mono" style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--warning-text)' }}>
                      ₹{p.amount.toLocaleString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Ref: <code className="code-id">{invRef}</code></span>
                    <span>UTR: <code className="code-id">{p.transactionRef || 'None'}</code></span>
                  </div>

                  {isHead && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setVerifyModal(p)}
                        style={{ flex: 1, borderColor: 'var(--success-text)', color: 'var(--success-text)' }}
                      >
                        <CheckCircle2 size={14} />
                        <span>Verify Paid</span>
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => { setRejectModal(p); setActionReason(''); }}
                        style={{ flex: 1, borderColor: 'var(--error-text)', color: 'var(--error-text)' }}
                      >
                        <XCircle size={14} />
                        <span>Reject</span>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Month, Year & Status Filter Controls */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.85rem' }}>
              <Filter size={16} />
              <span>Filter:</span>
            </div>

            {/* Month Selector */}
            <select
              className="select"
              style={{ width: 'auto', minWidth: '130px' }}
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
              style={{ width: 'auto', minWidth: '105px' }}
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="">All Years</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>

            {/* Status Selector */}
            <select
              className="select"
              style={{ width: 'auto', minWidth: '130px' }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="SUCCESS">Verified / Success</option>
              <option value="PENDING">Pending Verification</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {(selectedMonth || selectedYear || selectedStatus) && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedMonth('');
                  setSelectedYear('');
                  setSelectedStatus('');
                }}
                style={{ fontSize: '0.78rem', padding: '0.3rem 0.55rem' }}
              >
                <X size={14} /> Clear
              </Button>
            )}
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '500' }}>
            Showing {filteredPayments.length} of {payments.length} payments
          </div>
        </div>
      </Card>

      {loading ? (
        <LoadingSpinner message="Fetching payment history..." />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No payments recorded yet"
          description="Record UPI, Cash, or Bank Transfer payments received from friends."
          action={
            <Button onClick={openPaymentModal}>
              <CreditCard size={16} />
              <span>Record First Payment</span>
            </Button>
          }
        />
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="No payments match selected filters"
          description={`No payments found matching Month: ${selectedMonth ? monthNames[selectedMonth - 1] : 'All'}, Year: ${selectedYear || 'All'}, Status: ${selectedStatus || 'All'}.`}
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedMonth('');
                setSelectedYear('');
                setSelectedStatus('');
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
                  <th>Roommate</th>
                  <th>Method</th>
                  <th>UTR / Transaction Reference</th>
                  <th>Status</th>
                  <th>Reported / Verified By</th>
                  <th className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => {
                  const isSuccess = p.paymentStatus === 'SUCCESS';
                  const isPending = p.paymentStatus === 'PENDING';
                  const isRejected = p.paymentStatus === 'REJECTED';

                  return (
                    <tr key={p.id}>
                      <td className="text-util" style={{ fontSize: '0.85rem' }}>
                        {new Date(p.paidAt || p.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="code-id" style={{ fontWeight: '600', padding: '0.15rem 0.4rem', backgroundColor: 'var(--surface-muted)', borderRadius: 'var(--radius-sm)' }}>
                            {p.friend.shortCode}
                          </span>
                          <span>{p.friend.fullName}</span>
                        </div>
                      </td>
                      <td>
                        <Badge variant="payment">{p.paymentMethod}</Badge>
                      </td>
                      <td className="code-id" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {p.transactionRef || '—'}
                      </td>
                      <td>
                        <Badge
                          variant={
                            isSuccess
                              ? 'success'
                              : isPending
                              ? 'warning'
                              : 'neutral'
                          }
                          style={{
                            backgroundColor: isRejected ? 'var(--error-bg)' : undefined,
                            color: isRejected ? 'var(--error-text)' : undefined,
                            borderColor: isRejected ? 'var(--error-text)' : undefined
                          }}
                        >
                          {isPending ? 'PENDING VERIFICATION' : p.paymentStatus}
                        </Badge>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {isSuccess && p.verifiedBy
                          ? `Verified by ${p.verifiedBy.name}`
                          : isRejected
                          ? `Rejected (${p.rejectionReason || 'Not received'})`
                          : p.recordedBy
                          ? `Reported by ${p.recordedBy.name}`
                          : 'Member'}
                      </td>
                      <td
                        className="num font-mono"
                        style={{
                          fontWeight: '700',
                          color: isSuccess ? 'var(--success-text)' : isPending ? 'var(--warning-text)' : 'var(--text-muted)'
                        }}
                      >
                        ₹{p.amount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="mobile-only-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {filteredPayments.map((p) => {
              const isSuccess = p.paymentStatus === 'SUCCESS';
              const isPending = p.paymentStatus === 'PENDING';
              const isRejected = p.paymentStatus === 'REJECTED';

              return (
                <div key={p.id} className="mobile-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="code-id" style={{ fontWeight: '600', fontSize: '0.78rem', padding: '0.15rem 0.4rem', backgroundColor: 'var(--surface-muted)', borderRadius: 'var(--radius-sm)' }}>
                        {p.friend.shortCode}
                      </span>
                      <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{p.friend.fullName}</span>
                    </div>

                    <span className="font-mono" style={{ fontWeight: '800', fontSize: '1.05rem', color: isSuccess ? 'var(--success-text)' : isPending ? 'var(--warning-text)' : 'var(--text-muted)' }}>
                      ₹{p.amount.toLocaleString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0' }}>
                    <span>{new Date(p.paidAt || p.createdAt).toLocaleDateString()} • <Badge variant="payment">{p.paymentMethod}</Badge></span>
                    <Badge variant={isSuccess ? 'success' : isPending ? 'warning' : 'neutral'}>
                      {isPending ? 'PENDING' : p.paymentStatus}
                    </Badge>
                  </div>

                  {p.transactionRef && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      UTR / Ref: <code className="code-id">{p.transactionRef}</code>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Direct Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Direct Payment"
      >
        {modalError && (
          <div style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-text)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {modalError}
          </div>
        )}

        <form onSubmit={handleRecordPayment}>
          <div className="form-group">
            <label className="form-label">Friend / Roommate *</label>
            <select
              className="select"
              required
              value={selectedFriendId}
              onChange={(e) => setSelectedFriendId(e.target.value)}
            >
              {friends.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.fullName} ({f.shortCode})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Amount (₹) *</label>
            <input
              type="number"
              className="input font-mono"
              required
              min="1"
              placeholder="e.g. 500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Method *</label>
            <select
              className="select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="UPI">UPI</option>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Transaction Reference / UTR (Optional)</label>
            <input
              type="text"
              className="input font-mono"
              placeholder="UPI Ref ID e.g. 42381920"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Sent via PhonePe / GPay"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM VERIFY PAYMENT MODAL */}
      {verifyModal && (
        <div className="modal-overlay" onClick={() => setVerifyModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-text)' }}>
                <CheckCircle2 size={20} /> Confirm Payment Verification
              </h3>
              <button onClick={() => setVerifyModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ backgroundColor: 'var(--surface-muted)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
              <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Roommate:</strong> {verifyModal.friend.fullName} ({verifyModal.friend.shortCode})</p>
              <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                <strong>Invoice:</strong> {verifyModal.invoice ? `INV-${verifyModal.invoice.year}-${String(verifyModal.invoice.month).padStart(2, '0')}-${verifyModal.friend.shortCode}` : 'N/A'}
              </p>
              <p style={{ margin: '4px 0', fontSize: '1rem' }}>
                <strong>Reported Amount:</strong> <span className="font-mono" style={{ color: 'var(--success-text)', fontWeight: '700' }}>₹{verifyModal.amount.toLocaleString()}</span>
              </p>
              <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>UTR / Ref ID:</strong> <code className="code-id">{verifyModal.transactionRef || 'None'}</code></p>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text)', marginBottom: '1.5rem', fontStyle: 'italic' }}>
              "Confirm that this payment has been received in your UPI/bank account."
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Button type="button" variant="secondary" onClick={() => setVerifyModal(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleVerifyConfirm} disabled={processingAction}>
                <CheckCircle2 size={16} />
                <span>{processingAction ? 'Verifying...' : 'Verify & Mark Paid'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM REJECT PAYMENT MODAL */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error-text)' }}>
                <XCircle size={20} /> Payment Not Received?
              </h3>
              <button onClick={() => setRejectModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-text)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
              "This will reject the reported payment and keep the invoice amount due unchanged."
            </div>

            <div style={{ backgroundColor: 'var(--surface-muted)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
              <p style={{ margin: '3px 0', fontSize: '0.88rem' }}><strong>Roommate:</strong> {rejectModal.friend.fullName}</p>
              <p style={{ margin: '3px 0', fontSize: '0.88rem' }}><strong>Reported Amount:</strong> ₹{rejectModal.amount.toLocaleString()}</p>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Rejection Reason</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Transaction ID not found in bank statement"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Button type="button" variant="secondary" onClick={() => setRejectModal(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleRejectConfirm}
                disabled={processingAction}
                style={{ backgroundColor: 'var(--error-text)', borderColor: 'var(--error-text)' }}
              >
                <XCircle size={16} />
                <span>{processingAction ? 'Rejecting...' : 'Reject Payment'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
