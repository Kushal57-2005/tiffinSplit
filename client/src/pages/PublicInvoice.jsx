import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Printer, QrCode, ExternalLink, CreditCard, Clock, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { Badge } from '../components/UI/Badge';
import { Modal } from '../components/UI/Modal';
import { Button } from '../components/UI/Button';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';

export function PublicInvoice() {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const fetchInvoice = async () => {
    setLoading(true);
    setError('');
    try {
      const rawApiUrl = (import.meta.env.VITE_API_URL || '/api').trim();
      let apiUrl = rawApiUrl;
      if (apiUrl.startsWith('http')) {
        try {
          const urlObj = new URL(apiUrl);
          if (!urlObj.pathname.endsWith('/api') && !urlObj.pathname.endsWith('/api/')) {
            apiUrl = `${urlObj.origin}/api`;
          } else {
            apiUrl = apiUrl.replace(/\/+$/, '');
          }
        } catch (e) {
          apiUrl = rawApiUrl;
        }
      }
      let res = await fetch(`${apiUrl}/invoices/public/${invoiceId}`);
      if (!res.ok) {
        res = await fetch(`${apiUrl}/invoices/${invoiceId}`);
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Invoice statement not found');
      }
      const data = await res.json();
      setInvoice(data);
      if (data) {
        setReportAmount(data.amountDue.toString());
      }
    } catch (err) {
      console.error('Fetch public invoice error:', err);
      setError(err.message || 'Invoice statement not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

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
      const rawApiUrl = (import.meta.env.VITE_API_URL || '/api').trim();
      let apiUrl = rawApiUrl;
      if (apiUrl.startsWith('http')) {
        try {
          const urlObj = new URL(apiUrl);
          if (!urlObj.pathname.endsWith('/api') && !urlObj.pathname.endsWith('/api/')) {
            apiUrl = `${urlObj.origin}/api`;
          } else {
            apiUrl = apiUrl.replace(/\/+$/, '');
          }
        } catch (e) {
          apiUrl = rawApiUrl;
        }
      }
      const token = localStorage.getItem('tiffinsplit_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let res = await fetch(`${apiUrl}/invoices/public/${invoice.id}/report`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: amt,
          paymentMethod: reportMethod,
          transactionRef: reportRef,
          notes: reportNotes,
          paidAt: reportDate
        })
      });

      if (!res.ok) {
        res = await fetch(`${apiUrl}/workspaces/${invoice.workspaceId}/payments/report`, {
          method: 'POST',
          headers,
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
      }

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to submit payment report');
      }

      setFeedback({
        type: 'success',
        message: 'Your payment report has been submitted! Waiting for Household Head verification.'
      });
      setIsReportModalOpen(false);
      fetchInvoice();
    } catch (err) {
      setReportError(err.message || 'Failed to submit payment report');
    } finally {
      setSubmittingReport(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) return <LoadingSpinner message="Loading tiffin bill statement..." />;

  if (error || !invoice) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backgroundColor: 'var(--bg)' }}>
        <div className="card" style={{ maxWidth: '440px', padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--error-text)', marginBottom: '0.5rem' }}>Invoice Not Found</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            The requested tiffin bill statement ID could not be found or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const setting = invoice.workspace?.setting || {};
  const upiId = setting.upiId || '8237172878@ibl';
  const payeeName = setting.payeeName || 'Kushal Waykole';
  const note = `TiffinSplit Bill ${monthNames[invoice.month - 1]} ${invoice.year}`;
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${invoice.amountDue}&cu=INR&tn=${encodeURIComponent(note)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiLink)}`;

  const pendingPayment = invoice.payments ? invoice.payments.find((p) => p.paymentStatus === 'PENDING') : null;
  const isFullyPaid = invoice.status === 'PAID' || invoice.amountDue === 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--accent-brown)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '1.1rem'
              }}
            >
              T
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', margin: 0 }}>TiffinSplit</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Shared Household Billing</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {!isFullyPaid && (
              <Button
                disabled={!!pendingPayment}
                onClick={() => {
                  setReportAmount(invoice.amountDue.toString());
                  setReportError('');
                  setIsReportModalOpen(true);
                }}
                style={{ backgroundColor: 'var(--brown)', borderColor: 'var(--brown)' }}
              >
                <CreditCard size={15} />
                <span>{pendingPayment ? 'Verification Pending' : `I Paid ₹${invoice.amountDue.toLocaleString()}`}</span>
              </Button>
            )}

            <button
              className="btn btn-secondary"
              onClick={() => window.print()}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <Printer size={15} /> Print Statement
            </button>
          </div>
        </div>

        <div className="invoice-sheet" style={{ backgroundColor: 'var(--surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Billed To
              </span>
              <h3 style={{ fontSize: '1.1rem', marginTop: '0.2rem' }}>{invoice.friend.fullName}</h3>
              <p className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Short Code: <strong>{invoice.friend.shortCode}</strong>
              </p>
            </div>

            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Statement Metadata
              </span>
              <p style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Generated Date: <strong>{new Date(invoice.generatedAt).toLocaleDateString()}</strong>
              </p>
              <p style={{ fontSize: '0.85rem' }}>
                Household: <strong>{invoice.workspace ? invoice.workspace.name : ''}</strong>
              </p>
            </div>
          </div>

          <h4 style={{ marginBottom: '0.5rem' }}>Tiffin Meal History Breakdown</h4>
          
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
            <div style={{ width: '100%', maxWidth: '320px', backgroundColor: 'var(--surface-muted)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', fontSize: '1rem', fontWeight: '600' }}>
                <span>Total Amount:</span>
                <span className="font-mono">₹{invoice.totalAmount.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--success-text)' }}>
                <span>Amount Paid:</span>
                <span className="font-mono">₹{invoice.amountPaid.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '1.05rem', fontWeight: '700', color: invoice.amountDue > 0 ? 'var(--warning-text)' : 'inherit' }}>
                <span>Amount Due:</span>
                <span className="font-mono">₹{invoice.amountDue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* UPI Payment Box */}
          <div style={{ backgroundColor: '#F5F9F6', border: '2px solid #2E7D32', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <h3 style={{ color: '#1B5E20', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <QrCode size={20} /> Pay via PhonePe / GPay / Paytm
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#333', marginTop: '0.4rem' }}>
                Payee: <strong>{payeeName}</strong>
              </p>
              <p className="font-mono" style={{ fontSize: '1rem', fontWeight: '700', color: '#1B5E20', marginTop: '0.2rem' }}>
                UPI ID: {upiId}
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <img src={qrImageUrl} alt="UPI QR Code" style={{ width: '140px', height: '140px', border: '2px solid #2E7D32', borderRadius: '8px', background: '#fff' }} />
              <p style={{ fontSize: '0.75rem', color: '#555', marginTop: '0.35rem' }}>Scan with GPay / PhonePe / Paytm</p>
            </div>

            {!isFullyPaid && (
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#555' }}>Amount Due to Pay</span>
                <h2 className="font-mono" style={{ fontSize: '1.6rem', color: '#2E7D32', margin: 0 }}>
                  ₹{invoice.amountDue.toLocaleString()}
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <a
                    href={upiLink}
                    style={{
                      backgroundColor: '#2E7D32',
                      color: '#FFFFFF',
                      padding: '0.65rem 1.4rem',
                      borderRadius: '24px',
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 3px 8px rgba(46,125,50,0.35)'
                    }}
                  >
                    <ExternalLink size={16} /> Pay Now ₹{invoice.amountDue.toLocaleString()}
                  </a>
                  <Button
                    disabled={!!pendingPayment}
                    onClick={() => {
                      setReportAmount(invoice.amountDue.toString());
                      setReportError('');
                      setIsReportModalOpen(true);
                    }}
                    style={{ backgroundColor: 'var(--brown)', borderColor: 'var(--brown)', borderRadius: '24px' }}
                  >
                    <CreditCard size={15} />
                    <span>{pendingPayment ? 'Verification Pending' : `I Paid ₹${invoice.amountDue.toLocaleString()}`}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
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

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Payment Method *</label>
            <select
              className="select"
              value={reportMethod}
              onChange={(e) => setReportMethod(e.target.value)}
            >
              <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

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
