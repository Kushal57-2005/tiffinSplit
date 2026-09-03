import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, FileSpreadsheet, Eye, Mail, Send, CheckCircle, AlertCircle, X, CreditCard, Filter, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { EmptyState } from '../components/UI/EmptyState';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';

import { CustomSelectDropdown } from '../components/UI/CustomSelectDropdown';
import { getPublicAppUrl, formatWhatsAppBillMessage, createWhatsAppUrl } from '../utils/whatsapp';

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

  const handleSendWhatsApp = (inv) => {
    const invoiceUrl = getPublicAppUrl(`/invoices/view/${inv.id}`);
    const message = formatWhatsAppBillMessage({
      friendName: inv.friend?.fullName,
      monthName: monthNames[inv.month - 1],
      year: inv.year,
      amount: inv.amountDue > 0 ? inv.amountDue : inv.totalAmount,
      invoiceUrl
    });

    const url = createWhatsAppUrl(inv.friend?.phone, message);
    if (url) {
      window.open(url, '_blank');
    } else {
      const webUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      window.open(webUrl, '_blank');
    }
  };

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.65rem', width: '100%', alignItems: 'end' }}>
            {/* Month Dropdown */}
            <CustomSelectDropdown
              label="Month"
              value={selectedMonth}
              onChange={setSelectedMonth}
              options={[
                { label: 'All Months', value: '' },
                ...monthNames.map((m, idx) => ({ label: m, value: String(idx + 1) }))
              ]}
              minWidth="100%"
            />

            {/* Year Dropdown */}
            <CustomSelectDropdown
              label="Year"
              value={selectedYear}
              onChange={setSelectedYear}
              options={[
                { label: 'All Years', value: '' },
                { label: '2024', value: '2024' },
                { label: '2025', value: '2025' },
                { label: '2026', value: '2026' },
                { label: '2027', value: '2027' }
              ]}
              minWidth="100%"
            />

            {/* Status Dropdown */}
            <CustomSelectDropdown
              label="Status"
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Paid Only', value: 'PAID' },
                { label: 'Due / Unpaid', value: 'UNPAID' },
                { label: 'Generated', value: 'GENERATED' }
              ]}
              minWidth="100%"
            />

            {(selectedMonth || selectedYear || selectedStatus) && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedMonth('');
                  setSelectedYear('');
                  setSelectedStatus('');
                }}
                style={{ padding: '0.55rem 0.75rem', fontSize: '0.85rem', borderRadius: '12px', height: '42px', width: '100%', justifyContent: 'center' }}
              >
                <X size={16} />
                <span>Clear all</span>
              </button>
            )}
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
          <div className="table-container desktop-only-table" style={{ width: '100%', overflowX: 'hidden' }}>
            <table className="table" style={{ width: '100%', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.85rem 0.5rem', width: '16%' }}>Invoice Ref</th>
                  <th style={{ padding: '0.85rem 0.5rem', width: '12%' }}>Period</th>
                  <th style={{ padding: '0.85rem 0.5rem', width: '22%' }}>Roommate</th>
                  <th className="num" style={{ padding: '0.85rem 0.3rem', width: '4%' }}>Qty</th>
                  <th className="num" style={{ padding: '0.85rem 0.4rem', width: '7%' }}>Total</th>
                  <th className="num" style={{ padding: '0.85rem 0.4rem', width: '6%' }}>Paid</th>
                  <th className="num" style={{ padding: '0.85rem 0.4rem', width: '7%' }}>Due</th>
                  <th style={{ padding: '0.85rem 0.5rem', width: '9%' }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '0.85rem 0.75rem', width: '17%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => {
                  const invRef = `INV-${inv.year}-${String(inv.month).padStart(2, '0')}-${inv.friend.shortCode}`;
                  const isPaid = inv.status === 'PAID' || inv.amountDue === 0;

                  return (
                    <tr key={inv.id}>
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <span className="code-id" style={{ fontWeight: '600', color: 'var(--accent-invoice-text)', fontSize: '0.85rem' }}>
                          {invRef}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', fontWeight: '500', fontSize: '0.88rem' }}>
                        {monthNames[inv.month - 1]} {inv.year}
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
                          <span className="code-id" style={{ fontWeight: '600', fontSize: '0.75rem', padding: '0.12rem 0.4rem', backgroundColor: 'var(--accent-invoice)', color: 'var(--accent-invoice-text)', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}>
                            {inv.friend.shortCode}
                          </span>
                          <span style={{ fontSize: '0.88rem', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inv.friend.fullName}</span>
                        </div>
                      </td>
                      <td className="num" style={{ padding: '0.85rem 0.3rem', fontSize: '0.88rem' }}>{inv.totalQuantity}</td>
                      <td className="num font-mono" style={{ padding: '0.85rem 0.4rem', fontSize: '0.88rem' }}>₹{inv.totalAmount.toLocaleString()}</td>
                      <td className="num font-mono" style={{ padding: '0.85rem 0.4rem', fontSize: '0.88rem', color: 'var(--success-text)', fontWeight: '600' }}>₹{inv.amountPaid.toLocaleString()}</td>
                      <td className="num font-mono" style={{ padding: '0.85rem 0.4rem', fontSize: '0.88rem', fontWeight: '700', color: inv.amountDue > 0 ? 'var(--warning-text)' : 'inherit' }}>
                        ₹{inv.amountDue.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <Badge
                          variant={
                            inv.status === 'PAID'
                              ? 'success'
                              : inv.status === 'PARTIALLY_PAID'
                              ? 'warning'
                              : 'invoice'
                          }
                          style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                        >
                          {inv.status}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right', padding: '0.85rem 0.75rem' }}>
                        <div style={{ display: 'inline-flex', gap: '0.45rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={isPaid}
                            onClick={() => handleOpenSettleModal(inv)}
                            style={{
                              borderColor: isPaid ? 'var(--border)' : 'var(--success-text)',
                              color: isPaid ? 'var(--text-muted)' : 'var(--success-text)',
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.78rem',
                              borderRadius: '12px'
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
                            style={{ borderRadius: '12px', padding: '0.35rem 0.55rem' }}
                          >
                            <Eye size={14} />
                          </Button>

                          <div className="tooltip-wrapper">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleSendWhatsApp(inv)}
                              style={{
                                borderColor: '#25D366',
                                color: '#25D366',
                                borderRadius: '12px',
                                padding: '0.35rem 0.6rem'
                              }}
                            >
                              <MessageCircle size={14} style={{ color: '#25D366' }} />
                            </Button>
                            <span className="tooltip-content">Send statement on WhatsApp</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="mobile-only-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
            {filteredInvoices.map((inv) => {
              const invRef = `INV-${inv.year}-${String(inv.month).padStart(2, '0')}-${inv.friend.shortCode}`;
              const isPaid = inv.status === 'PAID' || inv.amountDue === 0;

              return (
                <div key={inv.id} className="mobile-card" style={{ width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <span className="code-id" style={{ fontSize: '0.75rem', color: 'var(--accent-invoice-text)', fontWeight: '700' }}>
                        {invRef}
                      </span>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem', marginTop: '0.1rem', wordBreak: 'break-word' }}>
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

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface-muted)', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <div>Total: <strong className="font-mono">₹{inv.totalAmount}</strong></div>
                    <div>Paid: <strong className="font-mono" style={{ color: 'var(--success-text)' }}>₹{inv.amountPaid}</strong></div>
                    <div>Due: <strong className="font-mono" style={{ color: inv.amountDue > 0 ? 'var(--warning-text)' : 'inherit' }}>₹{inv.amountDue}</strong></div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem', alignItems: 'center', width: '100%' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isPaid}
                      onClick={() => handleOpenSettleModal(inv)}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        borderColor: isPaid ? 'var(--border)' : 'var(--success-text)',
                        color: isPaid ? 'var(--text-muted)' : 'var(--success-text)',
                        borderRadius: '12px',
                        padding: '0.35rem 0.4rem',
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
                      style={{ flex: 1, minWidth: 0, borderRadius: '12px', padding: '0.35rem 0.4rem', fontSize: '0.78rem' }}
                    >
                      <Eye size={13} />
                      <span>View</span>
                    </Button>

                    <div className="tooltip-wrapper" style={{ flex: '0 0 auto' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSendWhatsApp(inv)}
                        style={{
                          borderColor: '#25D366',
                          color: '#25D366',
                          borderRadius: '12px',
                          padding: '0.35rem 0.55rem'
                        }}
                      >
                        <MessageCircle size={14} style={{ color: '#25D366' }} />
                      </Button>
                      <span className="tooltip-content">Send statement on WhatsApp</span>
                    </div>
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

              <CustomSelectDropdown
                label="Payment Method *"
                value={settleMethod}
                onChange={setSettleMethod}
                options={[
                  { label: 'UPI (PhonePe / GPay / Paytm)', value: 'UPI' },
                  { label: 'Cash', value: 'CASH' },
                  { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
                  { label: 'Other', value: 'OTHER' }
                ]}
                minWidth="100%"
              />

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
