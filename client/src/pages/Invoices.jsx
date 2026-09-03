import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, FileSpreadsheet, Eye, Mail, Send, CheckCircle, AlertCircle, X, CreditCard, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { EmptyState } from '../components/UI/EmptyState';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';

export function Invoices() {
  const { activeWorkspaceId, apiFetch } = useAuth();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Month & Year Filter state
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');



  // Settle Payment Modal state
  const [settleModal, setSettleModal] = useState(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMethod, setSettleMethod] = useState('UPI');
  const [settleRef, setSettleRef] = useState('');
  const [settleNotes, setSettleNotes] = useState('');
  const [submittingSettle, setSubmittingSettle] = useState(false);

  const [feedback, setFeedback] = useState(null);

  const [hasInitializedDefaultFilter, setHasInitializedDefaultFilter] = useState(false);

  const fetchInvoices = async () => {
    if (!activeWorkspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Fetch all invoices for active workspace first to determine default month/year
      const data = await apiFetch(`/workspaces/${activeWorkspaceId}/invoices`);
      setInvoices(data);

      if (!hasInitializedDefaultFilter) {
        const currentDate = new Date();
        const curMonth = currentDate.getMonth() + 1;
        const curYear = currentDate.getFullYear();

        let prevMonth = curMonth - 1;
        let prevYear = curYear;
        if (prevMonth === 0) {
          prevMonth = 12;
          prevYear = curYear - 1;
        }

        if (Array.isArray(data) && data.length > 0) {
          const monthMap = {};
          data.forEach((inv) => {
            const key = `${inv.year}-${String(inv.month).padStart(2, '0')}`;
            if (!monthMap[key]) {
              monthMap[key] = { year: inv.year, month: inv.month, due: 0 };
            }
            monthMap[key].due += inv.amountDue;
          });

          const sortedKeysAsc = Object.keys(monthMap).sort();
          const oldestUnsettledKey = sortedKeysAsc.find((k) => monthMap[k].due > 0);

          if (oldestUnsettledKey) {
            // Show oldest unsettled month's bill (e.g. last month's bill if unpaid)
            const monthData = monthMap[oldestUnsettledKey];
            setSelectedMonth(String(monthData.month));
            setSelectedYear(String(monthData.year));
          } else {
            // All bills are paid! Show current month bill (like dashboard)
            const curKey = `${curYear}-${String(curMonth).padStart(2, '0')}`;
            if (monthMap[curKey]) {
              setSelectedMonth(String(curMonth));
              setSelectedYear(String(curYear));
            } else {
              const prevKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
              if (monthMap[prevKey]) {
                setSelectedMonth(String(prevMonth));
                setSelectedYear(String(prevYear));
              } else {
                setSelectedMonth(String(curMonth));
                setSelectedYear(String(curYear));
              }
            }
          }
        } else {
          // No invoices generated yet: default to last month
          setSelectedMonth(String(prevMonth));
          setSelectedYear(String(prevYear));
        }

        setHasInitializedDefaultFilter(true);
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setHasInitializedDefaultFilter(false);
    setSelectedMonth('');
    setSelectedYear('');
  }, [activeWorkspaceId]);

  useEffect(() => {
    fetchInvoices();
  }, [activeWorkspaceId]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const filteredInvoices = invoices.filter((inv) => {
    if (selectedMonth && String(inv.month) !== String(selectedMonth)) return false;
    if (selectedYear && String(inv.year) !== String(selectedYear)) return false;
    if (selectedStatus === 'PAID' && inv.status !== 'PAID' && inv.amountDue > 0) return false;
    if (selectedStatus === 'UNPAID' && (inv.status === 'PAID' || inv.amountDue === 0)) return false;
    if (selectedStatus === 'GENERATED' && inv.status !== 'GENERATED') return false;
    return true;
  });



  // Open Settle Payment Modal prefilled with invoice details
  const handleOpenSettleModal = (inv) => {
    setSettleModal(inv);
    setSettleAmount(inv.amountDue.toString());
    setSettleMethod('UPI');
    setSettleRef('');
    setSettleNotes(`Payment for ${monthNames[inv.month - 1]} ${inv.year} statement`);
  };

  const handleSettleSubmit = async (e) => {
    e.preventDefault();
    if (!settleModal) return;

    const amt = parseFloat(settleAmount);
    if (isNaN(amt) || amt <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a positive settlement amount' });
      return;
    }

    setSubmittingSettle(true);
    setFeedback(null);

    try {
      await apiFetch(`/workspaces/${activeWorkspaceId}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          friendId: settleModal.friendId,
          invoiceId: settleModal.id,
          amount: amt,
          paymentMethod: settleMethod,
          transactionRef: settleRef,
          notes: settleNotes
        })
      });

      setFeedback({
        type: 'success',
        message: `Successfully recorded ₹${amt.toLocaleString()} payment for ${settleModal.friend.fullName}. Bill status updated!`
      });
      setSettleModal(null);
      fetchInvoices();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to record payment settlement' });
    } finally {
      setSubmittingSettle(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1>Monthly Invoices</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Generated immutable billing documents and payment balances
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', width: '100%', maxWidth: '200px' }}>
          <Button onClick={() => navigate('/invoices/generate')} style={{ flex: 1 }}>
            <FileSpreadsheet size={16} />
            <span>Generate</span>
          </Button>
        </div>
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
            {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Month, Year & Status Filter Controls */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.85rem', marginRight: '0.25rem' }}>
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
              style={{ width: 'auto', minWidth: '125px' }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PAID">Paid Only</option>
              <option value="UNPAID">Due / Unpaid</option>
              <option value="GENERATED">Generated</option>
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
            Showing {filteredInvoices.length} of {invoices.length} invoices
          </div>
        </div>
      </Card>

      {loading ? (
        <LoadingSpinner message="Fetching monthly invoices..." />
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices generated yet"
          description="Generate monthly invoices for your household roommates based on recorded meal entries."
          action={
            <Button onClick={() => navigate('/invoices/generate')}>
              <FileSpreadsheet size={16} />
              <span>Generate First Invoice</span>
            </Button>
          }
        />
      ) : filteredInvoices.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="No invoices match selected filters"
          description={`No invoices found matching Month: ${selectedMonth ? monthNames[selectedMonth - 1] : 'All'}, Year: ${selectedYear || 'All'}, Status: ${selectedStatus || 'All'}.`}
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
                  <th>Invoice Ref</th>
                  <th>Billing Period</th>
                  <th>Roommate</th>
                  <th className="num">Qty</th>
                  <th className="num">Subtotal</th>
                  <th className="num">Paid</th>
                  <th className="num">Due</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => {
                  const invRef = `INV-${inv.year}-${String(inv.month).padStart(2, '0')}-${inv.friend.shortCode}`;
                  const isPaid = inv.status === 'PAID' || inv.amountDue === 0;

                  return (
                    <tr key={inv.id}>
                      <td>
                        <span className="code-id" style={{ fontWeight: '600', color: 'var(--accent-invoice-text)', fontSize: '0.82rem' }}>
                          {invRef}
                        </span>
                      </td>
                      <td style={{ fontWeight: '500', fontSize: '0.85rem' }}>
                        {monthNames[inv.month - 1]} {inv.year}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className="code-id" style={{ fontWeight: '600', fontSize: '0.75rem', padding: '0.1rem 0.35rem', backgroundColor: 'var(--accent-invoice)', color: 'var(--accent-invoice-text)', borderRadius: 'var(--radius-sm)' }}>
                            {inv.friend.shortCode}
                          </span>
                          <span style={{ fontSize: '0.88rem' }}>{inv.friend.fullName}</span>
                        </div>
                      </td>
                      <td className="num">{inv.totalQuantity}</td>
                      <td className="num font-mono">₹{inv.subtotalAmount.toLocaleString()}</td>
                      <td className="num font-mono" style={{ color: 'var(--success-text)', fontWeight: '600' }}>₹{inv.amountPaid.toLocaleString()}</td>
                      <td className="num font-mono" style={{ fontWeight: '700', color: inv.amountDue > 0 ? 'var(--warning-text)' : 'inherit' }}>
                        ₹{inv.amountDue.toLocaleString()}
                      </td>
                      <td>
                        <Badge
                          variant={
                            inv.status === 'PAID'
                              ? 'success'
                              : inv.status === 'PARTIALLY_PAID'
                              ? 'warning'
                              : 'invoice'
                          }
                          style={{ fontSize: '0.7rem' }}
                        >
                          {inv.status}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.3rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={isPaid}
                            onClick={() => handleOpenSettleModal(inv)}
                            style={{
                              borderColor: isPaid ? 'var(--border)' : 'var(--success-text)',
                              color: isPaid ? 'var(--text-muted)' : 'var(--success-text)',
                              padding: '0.3rem 0.55rem',
                              fontSize: '0.78rem'
                            }}
                          >
                            <CreditCard size={13} />
                            <span>{isPaid ? 'Settled' : 'Settle'}</span>
                          </Button>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/invoices/${inv.id}`)}
                            title="View Statement Details"
                          >
                            <Eye size={14} />
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
            {filteredInvoices.map((inv) => {
              const invRef = `INV-${inv.year}-${String(inv.month).padStart(2, '0')}-${inv.friend.shortCode}`;
              const isPaid = inv.status === 'PAID' || inv.amountDue === 0;

              return (
                <div key={inv.id} className="mobile-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span className="code-id" style={{ fontSize: '0.75rem', color: 'var(--accent-invoice-text)', fontWeight: '700' }}>
                        {invRef}
                      </span>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem', marginTop: '0.1rem' }}>
                        {inv.friend.fullName} ({inv.friend.shortCode})
                      </div>
                    </div>

                    <Badge
                      variant={
                        inv.status === 'PAID'
                          ? 'success'
                          : inv.status === 'PARTIALLY_PAID'
                          ? 'warning'
                          : 'invoice'
                      }
                    >
                      {inv.status}
                    </Badge>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0' }}>
                    Period: <strong style={{ color: 'var(--text)' }}>{monthNames[inv.month - 1]} {inv.year}</strong> • {inv.totalQuantity} tiffins
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface-muted)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                    <div>Total: <strong className="font-mono">₹{inv.totalAmount}</strong></div>
                    <div>Paid: <strong className="font-mono" style={{ color: 'var(--success-text)' }}>₹{inv.amountPaid}</strong></div>
                    <div>Due: <strong className="font-mono" style={{ color: inv.amountDue > 0 ? 'var(--warning-text)' : 'inherit' }}>₹{inv.amountDue}</strong></div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isPaid}
                      onClick={() => handleOpenSettleModal(inv)}
                      style={{
                        flex: 1,
                        borderColor: isPaid ? 'var(--border)' : 'var(--success-text)',
                        color: isPaid ? 'var(--text-muted)' : 'var(--success-text)'
                      }}
                    >
                      <CreditCard size={14} />
                      <span>{isPaid ? 'Settled' : 'Settle'}</span>
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                      style={{ flex: 1 }}
                    >
                      <Eye size={14} />
                      <span>View</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Settle Payment Modal */}
      {settleModal && (
        <div className="modal-overlay" onClick={() => setSettleModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={20} style={{ color: 'var(--success-text)' }} /> Settle Invoice Payment
              </h3>
              <button onClick={() => setSettleModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ backgroundColor: 'var(--surface-muted)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Roommate:</span>
                <strong style={{ fontSize: '0.95rem' }}>{settleModal.friend.fullName} ({settleModal.friend.shortCode})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Invoice Period:</span>
                <span style={{ fontSize: '0.85rem' }}>{monthNames[settleModal.month - 1]} {settleModal.year}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.35rem', marginTop: '0.35rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Remaining Due:</span>
                <strong className="font-mono" style={{ fontSize: '1.1rem', color: 'var(--warning-text)' }}>₹{settleModal.amountDue.toLocaleString()}</strong>
              </div>
            </div>

            <form onSubmit={handleSettleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Settlement Amount (₹) *</label>
                <input
                  type="number"
                  className="input font-mono"
                  required
                  min="1"
                  max={settleModal.amountDue}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  placeholder="e.g. 770"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Payment Method *</label>
                <select
                  className="select"
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value)}
                >
                  <option value="UPI">UPI (PhonePe / GPay / Paytm)</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Transaction Ref / UPI ID (Optional)</label>
                <input
                  type="text"
                  className="input font-mono"
                  placeholder="e.g. UPI Ref # 42398109"
                  value={settleRef}
                  onChange={(e) => setSettleRef(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Notes (Optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Settled via GPay QR"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <Button type="button" variant="secondary" onClick={() => setSettleModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingSettle}>
                  <CreditCard size={16} />
                  <span>{submittingSettle ? 'Settling...' : `Settle ₹${parseFloat(settleAmount || 0).toLocaleString()} Payment`}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
