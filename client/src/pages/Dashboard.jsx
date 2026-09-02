import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UtensilsCrossed,
  Receipt,
  Wallet,
  AlertCircle,
  PlusCircle,
  FileSpreadsheet,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/UI/Card";
import { Button } from "../components/UI/Button";
import { Badge } from "../components/UI/Badge";
import { LoadingSpinner } from "../components/UI/LoadingSpinner";
import { normalizePhoneNumber, formatWhatsAppPaymentRejectedMessage, createWhatsAppUrl } from "../utils/whatsapp";

export function Dashboard() {
  const { user, activeWorkspaceId, activeWorkspace, apiFetch } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    periodLabel: "This Month Overview",
    monthName: "",
    year: new Date().getFullYear(),
    isPreviousUnsettled: false,
    totalMeals: 0,
    billedAmount: 0,
    paidAmount: 0,
    dueAmount: 0,
    pendingReviewAmount: 0,
  });
  const [pendingPayments, setPendingPayments] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  // Verification & Rejection Modal State
  const [verifyModal, setVerifyModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [actionReason, setActionReason] = useState("");
  const [processingAction, setProcessingAction] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const isHead = !activeWorkspace?.role || activeWorkspace?.role === "HEAD";
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const loadDashboardData = async () => {
    if (!activeWorkspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const currentDate = new Date();
      const curMonth = currentDate.getMonth() + 1;
      const curYear = currentDate.getFullYear();

      // Fetch pending verifications
      const pendingData = await apiFetch(
        `/workspaces/${activeWorkspaceId}/payments/pending`,
      );
      setPendingPayments(pendingData);

      let pendingTotal = 0;
      if (Array.isArray(pendingData)) {
        pendingTotal = pendingData.reduce((acc, p) => acc + p.amount, 0);
      }

      // Fetch entries
      const entries = await apiFetch(
        `/workspaces/${activeWorkspaceId}/entries`,
      );
      setRecentEntries(entries.slice(0, 5));

      // Fetch invoices
      const invoices = await apiFetch(
        `/workspaces/${activeWorkspaceId}/invoices`,
      );

      // Group invoices by "YYYY-MM"
      const monthlyInvoiceMap = {};
      if (Array.isArray(invoices) && invoices.length > 0) {
        invoices.forEach((inv) => {
          const key = `${inv.year}-${String(inv.month).padStart(2, "0")}`;
          if (!monthlyInvoiceMap[key]) {
            monthlyInvoiceMap[key] = {
              year: inv.year,
              month: inv.month,
              invoices: [],
              billed: 0,
              paid: 0,
              due: 0,
            };
          }
          monthlyInvoiceMap[key].invoices.push(inv);
          monthlyInvoiceMap[key].billed += inv.totalAmount;
          monthlyInvoiceMap[key].paid += inv.amountPaid;
          monthlyInvoiceMap[key].due += inv.amountDue;
        });
      }

      // Sort invoice months ascending (oldest first) to find the oldest unsettled month (where collected < billed amount)
      const sortedKeysAsc = Object.keys(monthlyInvoiceMap).sort();
      const oldestUnsettledKey = sortedKeysAsc.find(
        (key) => monthlyInvoiceMap[key].due > 0,
      );

      let targetMonth = curMonth;
      let targetYear = curYear;
      let targetBilled = 0;
      let targetPaid = 0;
      let targetDue = 0;
      let isPrevUnsettled = false;

      if (oldestUnsettledKey) {
        // Show previous unsettled month data until Collected == Billed Amount
        const monthData = monthlyInvoiceMap[oldestUnsettledKey];
        targetMonth = monthData.month;
        targetYear = monthData.year;
        targetBilled = monthData.billed;
        targetPaid = monthData.paid;
        targetDue = monthData.due;

        if (
          targetYear < curYear ||
          (targetYear === curYear && targetMonth < curMonth)
        ) {
          isPrevUnsettled = true;
        }
      } else {
        // All previous billing months are fully collected! Auto-switch to Current Month Data
        targetMonth = curMonth;
        targetYear = curYear;
        const curKey = `${curYear}-${String(curMonth).padStart(2, "0")}`;

        if (monthlyInvoiceMap[curKey]) {
          targetBilled = monthlyInvoiceMap[curKey].billed;
          targetPaid = monthlyInvoiceMap[curKey].paid;
          targetDue = monthlyInvoiceMap[curKey].due;
        } else {
          // If current month invoice is not generated yet, compute directly from current month's meal entries
          const curMonthEntries = entries.filter((e) => {
            const d = new Date(e.entryDate);
            return d.getMonth() + 1 === curMonth && d.getFullYear() === curYear;
          });
          curMonthEntries.forEach((e) => {
            if (e.items) {
              e.items.forEach((item) => {
                targetBilled += item.lineTotal;
                targetDue += item.lineTotal;
              });
            }
          });
        }
      }

      // Calculate total meals count for target month/year
      let targetMealsCount = 0;
      const targetEntries = entries.filter((e) => {
        const d = new Date(e.entryDate);
        return (
          d.getMonth() + 1 === targetMonth && d.getFullYear() === targetYear
        );
      });
      targetEntries.forEach((e) => {
        if (e.items) {
          targetMealsCount += e.items.reduce((acc, i) => acc + i.quantity, 0);
        }
      });

      const monthNameStr = monthNames[targetMonth - 1];

      setStats({
        periodLabel: `${monthNameStr} ${targetYear} Overview`,
        monthName: monthNameStr,
        year: targetYear,
        isPreviousUnsettled: isPrevUnsettled,
        totalMeals: targetMealsCount,
        billedAmount: targetBilled,
        paidAmount: targetPaid,
        dueAmount: targetDue,
        pendingReviewAmount: pendingTotal,
      });

      // Fetch recent activity
      const activity = await apiFetch(
        `/workspaces/${activeWorkspaceId}/activity?limit=6`,
      );
      setRecentActivity(activity);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeWorkspaceId]);

  // Handle Head Verifying Payment
  const handleVerifyConfirm = async () => {
    if (!verifyModal) return;
    setProcessingAction(true);
    setFeedback(null);
    try {
      await apiFetch(
        `/workspaces/${activeWorkspaceId}/payments/${verifyModal.id}/verify`,
        {
          method: "POST",
        },
      );

      setFeedback({
        type: "success",
        message: `Successfully verified ₹${verifyModal.amount.toLocaleString()} payment for ${verifyModal.friend.fullName}!`,
      });
      setVerifyModal(null);
      loadDashboardData();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to verify payment",
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle Head Rejecting Payment
  const handleRejectConfirm = async () => {
    if (!rejectModal) return;
    setProcessingAction(true);
    setFeedback(null);
    try {
      await apiFetch(
        `/workspaces/${activeWorkspaceId}/payments/${rejectModal.id}/reject`,
        {
          method: "POST",
          body: JSON.stringify({ reason: actionReason }),
        },
      );

      const targetPhone = rejectModal.friend?.phone;
      const cleanPhone = normalizePhoneNumber(targetPhone);
      const name = rejectModal.friend?.fullName || 'there';
      const baseUrl = window.location.origin;
      const invId = rejectModal.invoiceId || rejectModal.invoice?.id;
      const invoiceUrl = invId ? `${baseUrl}/invoices/view/${invId}` : `${baseUrl}/invoices`;

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
        type: "success",
        message: whatsappOpened
          ? `Payment rejected. WhatsApp opened to send rejection notice to ${name}.`
          : `Payment rejected. (Add phone number for ${name} to send WhatsApp rejection notices).`,
      });
      setRejectModal(null);
      setActionReason("");
      loadDashboardData();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to reject payment",
      });
    } finally {
      setProcessingAction(false);
    }
  };

  if (!activeWorkspaceId && !loading) {
    return (
      <div style={{ padding: '3rem 1.5rem', textAlign: 'center', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', margin: '2rem auto', maxWidth: '600px' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>No Active Household Workspace</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Please select or create a household workspace to view your dashboard.
        </p>
        <Button onClick={() => navigate('/members')}>Manage Workspaces</Button>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Loading household overview..." />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Header & Quick Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1>
            {getGreeting()}, {user ? user.name.split(" ")[0] : "Roommate"} 👋
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.95rem",
              marginTop: "0.2rem",
            }}
          >
            {activeWorkspace?.name || "TiffinSplit Household Workspace"}
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Button onClick={() => navigate("/entries/new")}>
            <PlusCircle size={16} />
            <span>+ Add Meal</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate("/invoices/generate")}
          >
            <FileSpreadsheet size={16} />
            <span>Generate Invoices</span>
          </Button>
          <Button variant="secondary" onClick={() => navigate("/payments")}>
            <CreditCard size={16} />
            <span>Payments</span>
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          style={{
            backgroundColor:
              feedback.type === "success"
                ? "var(--success-bg)"
                : "var(--error-bg)",
            color:
              feedback.type === "success"
                ? "var(--success-text)"
                : "var(--error-text)",
            padding: "0.85rem 1.25rem",
            borderRadius: "var(--radius-md)",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {feedback.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertTriangle size={18} />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "inherit",
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "0.85rem",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: "600", margin: 0 }}>
              {stats.periodLabel}
            </h2>
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {stats.monthName} {stats.year}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          {/* Total Meals */}
          <div
            className="card"
            style={{
              borderLeft: "4px solid var(--brown)",
              backgroundColor: "var(--surface)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Total Meals
              </span>
              <div
                style={{
                  padding: "0.35rem",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--accent-meal)",
                  color: "var(--accent-meal-text)",
                }}
              >
                <UtensilsCrossed size={16} />
              </div>
            </div>
            <div
              style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}
            >
              <h2 style={{ fontSize: "1.7rem", fontWeight: "700" }}>
                {stats.totalMeals}
              </h2>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                tiffins
              </span>
            </div>
          </div>

          {/* Billed Amount */}
          <div
            className="card"
            style={{
              borderLeft: "4px solid var(--purple)",
              backgroundColor: "var(--surface)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Billed Amount
              </span>
              <div
                style={{
                  padding: "0.35rem",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--accent-invoice)",
                  color: "var(--accent-invoice-text)",
                }}
              >
                <Receipt size={16} />
              </div>
            </div>
            <h2
              style={{ fontSize: "1.7rem", fontWeight: "700" }}
              className="font-mono"
            >
              ₹{stats.billedAmount.toLocaleString()}
            </h2>
          </div>

          {/* Amount Paid / Collected */}
          <div
            className="card"
            style={{
              borderLeft: "4px solid var(--blue)",
              backgroundColor: "var(--surface)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Collected
              </span>
              <div
                style={{
                  padding: "0.35rem",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--accent-payment)",
                  color: "var(--accent-payment-text)",
                }}
              >
                <Wallet size={16} />
              </div>
            </div>
            <h2
              style={{
                fontSize: "1.7rem",
                fontWeight: "700",
                color: "var(--success-text)",
              }}
              className="font-mono"
            >
              ₹{stats.paidAmount.toLocaleString()}
            </h2>
          </div>

          {/* Outstanding Due */}
          <div
            className="card"
            style={{
              borderLeft: "4px solid var(--warning-text)",
              backgroundColor: "var(--surface)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Outstanding
              </span>
              <div
                style={{
                  padding: "0.35rem",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--warning-bg)",
                  color: "var(--warning-text)",
                }}
              >
                <AlertCircle size={16} />
              </div>
            </div>
            <h2
              style={{ fontSize: "1.7rem", fontWeight: "700" }}
              className="font-mono"
            >
              ₹{stats.dueAmount.toLocaleString()}
            </h2>
          </div>

          {/* Pending Review */}
          <div
            className="card"
            style={{
              borderLeft: "4px solid var(--purple)",
              backgroundColor: "var(--surface)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Pending Review
              </span>
              <div
                style={{
                  padding: "0.35rem",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--accent-invoice)",
                  color: "var(--accent-invoice-text)",
                }}
              >
                <Clock size={16} />
              </div>
            </div>
            <h2
              style={{
                fontSize: "1.7rem",
                fontWeight: "700",
                color: "var(--purple)",
              }}
              className="font-mono"
            >
              ₹{stats.pendingReviewAmount.toLocaleString()}
            </h2>
          </div>
        </div>
      </div>

      {/* PENDING PAYMENT VERIFICATIONS SECTION (Visual & Prominent) */}
      {pendingPayments.length > 0 && (
        <Card
          title="Pending Payment Verifications"
          subtitle="Roommates reported payments requiring Household Head review before marking invoice paid"
          style={{ border: "2px solid var(--warning-text)" }}
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
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.map((p) => {
                  const invRef = p.invoice
                    ? `INV-${p.invoice.year}-${String(p.invoice.month).padStart(2, "0")}-${p.friend.shortCode}`
                    : "N/A";

                  return (
                    <tr key={p.id}>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                          }}
                        >
                          <span
                            className="code-id"
                            style={{
                              fontWeight: "600",
                              fontSize: "0.78rem",
                              padding: "0.15rem 0.4rem",
                              backgroundColor: "var(--surface-muted)",
                              borderRadius: "var(--radius-sm)",
                            }}
                          >
                            {p.friend.shortCode}
                          </span>
                          <span style={{ fontWeight: "600" }}>
                            {p.friend.fullName}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className="code-id"
                          style={{
                            fontSize: "0.82rem",
                            color: "var(--purple)",
                          }}
                        >
                          {invRef}
                        </span>
                      </td>
                      <td
                        className="num font-mono"
                        style={{
                          fontWeight: "700",
                          fontSize: "0.95rem",
                          color: "var(--warning-text)",
                        }}
                      >
                        ₹{p.amount.toLocaleString()}
                      </td>
                      <td>
                        <code
                          className="code-id"
                          style={{
                            fontSize: "0.82rem",
                            background: "var(--surface-muted)",
                            padding: "0.15rem 0.4rem",
                            borderRadius: "var(--radius-sm)",
                          }}
                        >
                          {p.transactionRef || "None"}
                        </code>
                      </td>
                      <td className="text-util" style={{ fontSize: "0.82rem" }}>
                        {p.reportedAt
                          ? new Date(p.reportedAt).toLocaleString([], {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : new Date(p.paidAt).toLocaleDateString()}
                      </td>
                      <td>
                        <Badge variant="payment">{p.paymentMethod}</Badge>
                      </td>
                      <td>
                        <Badge variant="warning">PENDING VERIFICATION</Badge>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {isHead ? (
                          <div
                            style={{
                              display: "inline-flex",
                              gap: "0.4rem",
                              justifyContent: "flex-end",
                            }}
                          >
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setVerifyModal(p)}
                              style={{
                                borderColor: "var(--success-text)",
                                color: "var(--success-text)",
                                padding: "0.35rem 0.65rem",
                              }}
                            >
                              <CheckCircle2 size={14} />
                              <span>Verify & Mark Paid</span>
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setRejectModal(p);
                                setActionReason("");
                              }}
                              style={{
                                borderColor: "var(--error-text)",
                                color: "var(--error-text)",
                                padding: "0.35rem 0.65rem",
                              }}
                            >
                              <XCircle size={14} />
                              <span>Payment Not Received</span>
                            </Button>
                          </div>
                        ) : (
                          <span
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            Waiting for Head
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="mobile-only-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {pendingPayments.map((p) => {
              const invRef = p.invoice
                ? `INV-${p.invoice.year}-${String(p.invoice.month).padStart(2, "0")}-${p.friend.shortCode}`
                : "N/A";
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

      {/* Main Grid: Recent Meals & Household Activity */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* Recent Meals */}
        <Card
          title="Recent Meals"
          subtitle="Latest tiffin entries logged"
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/entries")}
            >
              View All <ArrowRight size={14} />
            </Button>
          }
        >
          {recentEntries.length === 0 ? (
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.9rem",
                textAlign: "center",
                padding: "1.5rem 0",
              }}
            >
              No meals recorded yet.{" "}
              <span
                style={{
                  color: "var(--brown)",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
                onClick={() => navigate("/entries/new")}
              >
                + Add first meal
              </span>
            </p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Meal</th>
                    <th>People</th>
                    <th className="num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEntries.map((e) => {
                    const totalAmount = e.items
                      ? e.items.reduce((acc, i) => acc + i.lineTotal, 0)
                      : 0;
                    const count = e.items ? e.items.length : 0;
                    return (
                      <tr
                        key={e.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate("/entries")}
                      >
                        <td
                          className="text-util"
                          style={{ fontSize: "0.85rem" }}
                        >
                          {new Date(e.entryDate).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td>
                          <Badge
                            variant={
                              e.mealType === "MORNING" ? "meal" : "neutral"
                            }
                          >
                            {e.mealType}
                          </Badge>
                        </td>
                        <td>
                          {count} {count === 1 ? "person" : "people"}
                        </td>
                        <td
                          className="num font-mono"
                          style={{ fontWeight: "600" }}
                        >
                          ₹{totalAmount.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Household Activity Timeline */}
        <Card
          title="Recent Activity"
          subtitle="Household log timeline"
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/activity")}
            >
              View Timeline <ArrowRight size={14} />
            </Button>
          }
        >
          {recentActivity.length === 0 ? (
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.9rem",
                textAlign: "center",
                padding: "1.5rem 0",
              }}
            >
              No activity logged yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {recentActivity.map((log) => (
                <div key={log.id} className="timeline-item">
                  <div className="timeline-dot" />
                  <span className="timeline-time">
                    {new Date(log.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "500", fontSize: "0.85rem" }}>
                      {log.user ? log.user.name : "System"}
                    </div>
                    <p
                      style={{
                        fontSize: "0.82rem",
                        color: "var(--text-muted)",
                        marginTop: "0.1rem",
                      }}
                    >
                      {log.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* CONFIRM VERIFY PAYMENT MODAL */}
      {verifyModal && (
        <div className="modal-overlay" onClick={() => setVerifyModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "var(--success-text)",
                }}
              >
                <CheckCircle2 size={20} /> Confirm Payment Verification
              </h3>
              <button
                onClick={() => setVerifyModal(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                backgroundColor: "var(--surface-muted)",
                padding: "1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                marginBottom: "1.25rem",
              }}
            >
              <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
                <strong>Roommate:</strong> {verifyModal.friend.fullName} (
                {verifyModal.friend.shortCode})
              </p>
              <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
                <strong>Invoice:</strong>{" "}
                {verifyModal.invoice
                  ? `INV-${verifyModal.invoice.year}-${String(verifyModal.invoice.month).padStart(2, "0")}-${verifyModal.friend.shortCode}`
                  : "N/A"}
              </p>
              <p style={{ margin: "4px 0", fontSize: "1rem" }}>
                <strong>Reported Amount:</strong>{" "}
                <span
                  className="font-mono"
                  style={{ color: "var(--success-text)", fontWeight: "700" }}
                >
                  ₹{verifyModal.amount.toLocaleString()}
                </span>
              </p>
              <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
                <strong>UTR / Ref ID:</strong>{" "}
                <code className="code-id">
                  {verifyModal.transactionRef || "None"}
                </code>
              </p>
              <p
                style={{
                  margin: "4px 0",
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                }}
              >
                <strong>Reported At:</strong>{" "}
                {verifyModal.reportedAt
                  ? new Date(verifyModal.reportedAt).toLocaleString()
                  : new Date().toLocaleString()}
              </p>
            </div>

            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--text)",
                marginBottom: "1.5rem",
                fontStyle: "italic",
              }}
            >
              "Confirm that this payment has been received in your UPI/bank
              account."
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
              }}
            >
              <Button
                type="button"
                variant="secondary"
                onClick={() => setVerifyModal(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleVerifyConfirm}
                disabled={processingAction}
              >
                <CheckCircle2 size={16} />
                <span>
                  {processingAction ? "Verifying..." : "Verify & Mark Paid"}
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM REJECT PAYMENT MODAL */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "var(--error-text)",
                }}
              >
                <XCircle size={20} /> Payment Not Received?
              </h3>
              <button
                onClick={() => setRejectModal(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                backgroundColor: "var(--error-bg)",
                color: "var(--error-text)",
                padding: "0.85rem 1rem",
                borderRadius: "var(--radius-md)",
                marginBottom: "1.25rem",
                fontSize: "0.88rem",
              }}
            >
              "This will reject the reported payment and keep the invoice amount
              due unchanged."
            </div>

            <div
              style={{
                backgroundColor: "var(--surface-muted)",
                padding: "0.85rem 1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                marginBottom: "1.25rem",
              }}
            >
              <p style={{ margin: "3px 0", fontSize: "0.88rem" }}>
                <strong>Roommate:</strong> {rejectModal.friend.fullName}
              </p>
              <p style={{ margin: "3px 0", fontSize: "0.88rem" }}>
                <strong>Reported Amount:</strong> ₹
                {rejectModal.amount.toLocaleString()}
              </p>
              <p style={{ margin: "3px 0", fontSize: "0.88rem" }}>
                <strong>UTR / Ref ID:</strong>{" "}
                <code className="code-id">
                  {rejectModal.transactionRef || "None"}
                </code>
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label className="form-label">
                Rejection Reason (Sent via email to roommate)
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Transaction ID not found in GPay/Bank statement"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
              }}
            >
              <Button
                type="button"
                variant="secondary"
                onClick={() => setRejectModal(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleRejectConfirm}
                disabled={processingAction}
                style={{
                  backgroundColor: "var(--error-text)",
                  borderColor: "var(--error-text)",
                }}
              >
                <XCircle size={16} />
                <span>
                  {processingAction ? "Rejecting..." : "Reject Payment"}
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
