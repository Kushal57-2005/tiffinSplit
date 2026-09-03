import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, CreditCard, QrCode, Mail, ExternalLink, Clock, AlertTriangle, CheckCircle2, X, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { Modal } from '../components/UI/Modal';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { CustomSelectDropdown } from '../components/UI/CustomSelectDropdown';
import { normalizePhoneNumber, formatWhatsAppBillMessage, createWhatsAppUrl, getPublicAppUrl } from '../utils/whatsapp';

export function InvoiceDetail() {
  const { invoiceId } = useParams();
  const { activeWorkspaceId, apiFetch } = useAuth();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  // "I Paid" Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportAmount, setReportAmount] = useState('');
  const [reportMethod, setReportMethod] = useState('UPI');
  const [reportRef, setReportRef] = useState('');
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportNotes, setReportNotes] = useState('');
  const [reportError, setReportError] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const [feedback, setFeedback] = useState(null);

  const fetchInvoiceDetail = async () => {
    if (!activeWorkspaceId || !invoiceId) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/workspaces/${activeWorkspaceId}/invoices/${invoiceId}`);
      setInvoice(data);
      if (data) {
        setReportAmount(data.amountDue.toString());
      }
    } catch (err) {
      console.error('Failed to fetch invoice detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceDetail();
  }, [activeWorkspaceId, invoiceId]);

  // Handle Roommate "I Paid" Payment Report
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setReportError('');

    const amt = parseFloat(reportAmount);
    if (isNaN(amt) || amt <= 0) {
      setReportError('Payment amount must be greater than 0');
      return;
    }

    if (amt > invoice.amountDue) {
      setReportError(`Reported payment cannot exceed current amount due of ₹${invoice.amountDue}`);
      return;
    }

    setSubmittingReport(true);
    setFeedback(null);

    try {
      await apiFetch(`/workspaces/${activeWorkspaceId}/payments/report`, {
        method: 'POST',
        body: JSON.stringify({
          friendId: invoice.friendId,
          invoiceId: invoice.id,
          amount: amt,
          paymentMethod: reportMethod,
          transactionRef: reportRef,
          notes: reportNotes,
          paidAt: reportDate
        })
      });

      setFeedback({
        type: 'success',
        message: 'Your payment report has been submitted! Waiting for Household Head verification.'
      });
      setIsReportModalOpen(false);
      fetchInvoiceDetail();
    } catch (err) {
      setReportError(err.message || 'Failed to submit payment report');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleSendWhatsApp = () => {
    setFeedback(null);
    const rawPhone = invoice?.friend?.phone;
    const cleanPhone = normalizePhoneNumber(rawPhone);

    if (!cleanPhone) {
      setFeedback({
        type: 'error',
        message: 'Phone number is not available for this member. Add a phone number before sending via WhatsApp.'
      });
      return;
    }

    const name = invoice.friend?.fullName || 'there';
    const monthName = monthNames[invoice.month - 1];
    const year = invoice.year;
    const amount = invoice.amountDue > 0 ? invoice.amountDue : invoice.totalAmount;
    const invoiceUrl = getPublicAppUrl(`/invoices/view/${invoice.id}`);

    const message = formatWhatsAppBillMessage({
      friendName: name,
      monthName,
      year,
      amount,
      invoiceUrl
    });

    const whatsappUrl = createWhatsAppUrl(rawPhone, message);

    if (!whatsappUrl) {
      setFeedback({
        type: 'error',
        message: 'Phone number is not available for this member. Add a phone number before sending via WhatsApp.'
      });
      return;
    }

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setFeedback({
      type: 'success',
      message: 'WhatsApp opened with the bill message.'
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) return <LoadingSpinner message="Loading invoice statement..." />;
  if (!invoice) return <div>Invoice not found.</div>;

  const setting = invoice.workspace?.setting || {};
  const upiId = setting.upiId || '8237172878@ibl';
  const payeeName = setting.payeeName || 'Kushal Waykole';
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${invoice.amountDue}&cu=INR&tn=${encodeURIComponent(`TiffinSplit Bill ${monthNames[invoice.month - 1]} ${invoice.year}`)}`;

  // Find latest pending or rejected payment reports for this invoice
  const pendingPayment = invoice.payments ? invoice.payments.find((p) => p.paymentStatus === 'PENDING') : null;
  const rejectedPayment = invoice.payments ? invoice.payments.find((p) => p.paymentStatus === 'REJECTED') : null;
  const isFullyPaid = invoice.status === 'PAID' || invoice.amountDue === 0;

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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

      {/* PENDING VERIFICATION BANNER */}
      {pendingPayment && !isFullyPaid && (
        <div style={{ backgroundColor: 'var(--accent-invoice)', color: 'var(--accent-invoice-text)', border: '1px solid var(--purple)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Clock size={22} style={{ color: 'var(--purple)', flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: '0.95rem' }}>Payment verification pending</strong>
            <p style={{ fontSize: '0.85rem', marginTop: '0.15rem' }}>
              ₹{pendingPayment.amount.toLocaleString()} payment reported on {new Date(pendingPayment.createdAt).toLocaleDateString()}. Waiting for Household Head verification.
            </p>
          </div>
        </div>
      )}

      {/* REJECTED VERIFICATION BANNER */}
      {rejectedPayment && !pendingPayment && !isFullyPaid && (
        <div style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-text)', border: '1px solid var(--error-text)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={22} style={{ color: 'var(--error-text)', flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: '0.95rem' }}>Payment was not verified</strong>
            <p style={{ fontSize: '0.85rem', marginTop: '0.15rem' }}>
              Reason: {rejectedPayment.rejectionReason || 'Payment not found in bank/UPI account'}. Please complete payment and submit confirmation again.
            </p>
          </div>
        </div>
      )}

      {/* Top Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Button variant="secondary" size="sm" onClick={() => navigate('/invoices')}>
          <ArrowLeft size={14} /> Back to Invoices
        </Button>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'nowrap' }}>
          <Button variant="secondary" size="sm" onClick={handleSendWhatsApp} style={{ whiteSpace: 'nowrap' }}>
            <MessageCircle size={14} style={{ color: '#25D366' }} /> Send on WhatsApp
          </Button>

          <Button variant="secondary" size="sm" onClick={() => window.print()} style={{ whiteSpace: 'nowrap' }}>
            <Printer size={14} /> Print / Save PDF
          </Button>
        </div>
      </div>

      <div className="invoice-sheet">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ letterSpacing: '0.05em', color: 'var(--accent-brown)' }}>TIFFINSPLIT</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Shared Household Tiffin Statement</p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '1.2rem' }}>Monthly Invoice</h2>
            <p className="font-mono" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {monthNames[invoice.month - 1]} {invoice.year}
            </p>
            <div style={{ marginTop: '0.35rem' }}>
              <Badge variant={invoice.status === 'PAID' ? 'success' : invoice.status === 'PARTIALLY_PAID' ? 'warning' : 'info'}>
                {invoice.status}
              </Badge>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Billed To
            </span>
            <h3 style={{ fontSize: '1.1rem', marginTop: '0.2rem' }}>{invoice.friend.fullName}</h3>
            <p className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Short Code: <strong>{invoice.friend.shortCode}</strong>
            </p>
            {invoice.friend.phone && <p style={{ fontSize: '0.85rem' }}>Phone: {invoice.friend.phone}</p>}
            {invoice.friend.email && <p className="text-break" style={{ fontSize: '0.85rem' }}>Email: {invoice.friend.email}</p>}
          </div>

          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Statement Metadata
            </span>
            <p style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Generated Date: <strong>{new Date(invoice.generatedAt).toLocaleDateString()}</strong>
            </p>
            <p style={{ fontSize: '0.85rem' }}>
              Generated By: <strong>{invoice.generatedBy ? invoice.generatedBy.name : 'Member'}</strong>
            </p>
            <p style={{ fontSize: '0.85rem' }}>
              Household: <strong>{invoice.workspace ? invoice.workspace.name : ''}</strong>
            </p>
          </div>
        </div>

        <h4 style={{ marginBottom: '0.5rem' }}>Meal Items Breakdown (Snapshot)</h4>
        
        {/* Desktop Table View */}
        <div className="table-container desktop-only-table" style={{ marginBottom: '1.5rem' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Meal Type</th>
                <th className="num">Quantity</th>
                <th className="num">Unit Price</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.entryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' })}</td>
                  <td><Badge variant="neutral">{item.mealType}</Badge></td>
                  <td className="num">{item.quantity}</td>
                  <td className="num">₹{item.unitPrice}</td>
                  <td className="num" style={{ fontWeight: '500' }}>₹{item.lineTotal.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View (No Horizontal Scroll) */}
        <div className="mobile-only-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {invoice.items.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface-muted)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.88rem' }}>
                  {new Date(item.entryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' })}
                </div>
                <div style={{ marginTop: '0.15rem' }}>
                  <Badge variant="neutral" style={{ fontSize: '0.7rem' }}>{item.mealType}</Badge>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="font-mono" style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                  ₹{item.lineTotal.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {item.quantity} × ₹{item.unitPrice}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ width: '100%', marginBottom: '2rem' }}>
          <div style={{ width: '100%', backgroundColor: 'var(--surface-muted)', padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span>Total Meals Count:</span>
              <strong className="font-mono">{invoice.totalMeals}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span>Total Tiffins Quantity:</span>
              <strong className="font-mono">{invoice.totalQuantity}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span>Subtotal:</span>
              <span className="font-mono">₹{invoice.subtotalAmount.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span>Adjustments:</span>
              <span className="font-mono">₹{invoice.adjustmentAmount.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.65rem', borderTop: '1px solid var(--border)', fontSize: '1rem', fontWeight: '600' }}>
              <span>Total Amount:</span>
              <span className="font-mono">₹{invoice.totalAmount.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.9rem', color: 'var(--success-text)' }}>
              <span>Amount Paid:</span>
              <span className="font-mono">₹{invoice.amountPaid.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '1.05rem', fontWeight: '700', color: invoice.amountDue > 0 ? 'var(--warning-text)' : 'inherit' }}>
              <span>Amount Due:</span>
              <span className="font-mono">₹{invoice.amountDue.toLocaleString()}</span>
            </div>
          </div>
        </div>


        {invoice.payments && invoice.payments.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>Payment Audit Trail</h4>
            
            {/* Desktop Table View */}
            <div className="table-container desktop-only-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Method</th>
                    <th>UTR / Reference</th>
                    <th>Status</th>
                    <th>Reported / Verified By</th>
                    <th className="num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.map((p) => {
                    const isSuccess = p.paymentStatus === 'SUCCESS';
                    const isPending = p.paymentStatus === 'PENDING';
                    const isRejected = p.paymentStatus === 'REJECTED';

                    return (
                      <tr key={p.id}>
                        <td>{new Date(p.paidAt || p.createdAt).toLocaleDateString()}</td>
                        <td><Badge variant="neutral">{p.paymentMethod}</Badge></td>
                        <td className="font-mono" style={{ fontSize: '0.85rem' }}>{p.transactionRef || '—'}</td>
                        <td>
                          <Badge
                            variant={isSuccess ? 'success' : isPending ? 'warning' : 'neutral'}
                            style={{
                              backgroundColor: isRejected ? 'var(--error-bg)' : undefined,
                              color: isRejected ? 'var(--error-text)' : undefined
                            }}
                          >
                            {isPending ? 'PENDING VERIFICATION' : p.paymentStatus}
                          </Badge>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          {isSuccess && p.verifiedBy
                            ? `Verified by ${p.verifiedBy.name}`
                            : isRejected
                            ? `Rejected (${p.rejectionReason || 'Not received'})`
                            : p.recordedBy
                            ? `Reported by ${p.recordedBy.name}`
                            : 'Member'}
                        </td>
                        <td className="num" style={{ fontWeight: '600', color: isSuccess ? 'var(--success-text)' : isPending ? 'var(--warning-text)' : 'var(--text-muted)' }}>
                          ₹{p.amount.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (No Horizontal Scroll) */}
            <div className="mobile-only-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {invoice.payments.map((p) => {
                const isSuccess = p.paymentStatus === 'SUCCESS';
                const isPending = p.paymentStatus === 'PENDING';
                const isRejected = p.paymentStatus === 'REJECTED';

                return (
                  <div key={p.id} style={{ backgroundColor: 'var(--surface-muted)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {new Date(p.paidAt || p.createdAt).toLocaleDateString()} • <Badge variant="payment">{p.paymentMethod}</Badge>
                      </div>
                      <div className="font-mono" style={{ fontWeight: '700', fontSize: '0.95rem', color: isSuccess ? 'var(--success-text)' : isPending ? 'var(--warning-text)' : 'var(--text-muted)' }}>
                        ₹{p.amount.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem' }}>
                      <Badge variant={isSuccess ? 'success' : isPending ? 'warning' : 'neutral'}>
                        {isPending ? 'PENDING' : p.paymentStatus}
                      </Badge>
                      {p.transactionRef && (
                        <code className="code-id" style={{ fontSize: '0.78rem' }}>{p.transactionRef}</code>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ROOMMATE "I PAID" REPORT MODAL */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Report Payment Confirmation"
      >
        {reportError && (
          <div style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-text)', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {reportError}
          </div>
        )}

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Your payment will remain pending until the Household Head verifies it in their UPI/bank account.
        </p>

        <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Amount Paid (₹) *</label>
            <input
              type="number"
              className="input font-mono"
              required
              min="1"
              max={invoice.amountDue}
              value={reportAmount}
              onChange={(e) => setReportAmount(e.target.value)}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Current balance due: ₹{invoice.amountDue.toLocaleString()}
            </span>
          </div>

          <CustomSelectDropdown
            label="Payment Method *"
            value={reportMethod}
            onChange={setReportMethod}
            options={[
              { label: 'UPI (Google Pay / PhonePe / Paytm)', value: 'UPI' },
              { label: 'Cash', value: 'CASH' },
              { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
              { label: 'Other', value: 'OTHER' }
            ]}
            minWidth="100%"
          />

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">UPI Transaction ID / UTR (Recommended)</label>
            <input
              type="text"
              className="input font-mono"
              placeholder="12-digit UTR e.g. 423891029381"
              value={reportRef}
              onChange={(e) => setReportRef(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Payment Date</label>
            <input
              type="date"
              className="input font-mono"
              required
              max={new Date().toISOString().split('T')[0]}
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Note (Optional)</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Sent via PhonePe to Kushal"
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsReportModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submittingReport}>
              <CreditCard size={16} />
              <span>{submittingReport ? 'Submitting...' : `I Paid ₹${parseFloat(reportAmount || 0).toLocaleString()}`}</span>
            </Button>
          </div>
        </form>
      </Modal>


    </div>
  );
}
