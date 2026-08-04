"use client";

import { useEffect, useState } from "react";
import { 
  Receipt, 
  Calendar, 
  Sparkles, 
  FileCheck, 
  IndianRupee, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Loader2, 
  ChevronRight, 
  Eye, 
  Send, 
  QrCode, 
  Sliders, 
  X,
  CreditCard,
  Mail
} from "lucide-react";

interface Friend {
  id: string;
  fullName: string;
  shortCode: string;
  email?: string | null;
  phone?: string | null;
  upiId?: string | null;
}

interface MonthlyInvoiceItem {
  id: string;
  entryDate: string;
  mealType: "MORNING" | "NIGHT";
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  description?: string | null;
}

interface MonthlyInvoice {
  id: string;
  friendId: string;
  friend: Friend;
  month: number;
  year: number;
  totalMeals: number;
  totalQuantity: number;
  subtotalAmount: number;
  adjustmentAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  status: "DRAFT" | "GENERATED" | "SENT" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";
  generatedAt?: string | null;
  sentAt?: string | null;
  emailSent?: boolean;
  emailTo?: string | null;
  qrPayload?: string | null;
  qrImageUrl?: string | null;
  items: MonthlyInvoiceItem[];
}

interface SummaryItem {
  friend: Friend;
  month: number;
  year: number;
  liveStats: {
    totalMeals: number;
    totalQuantity: number;
    subtotalAmount: number;
    itemCount: number;
  };
  invoice: MonthlyInvoice | null;
  isGenerated: boolean;
}

export default function BillingPage() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  const [summaries, setSummaries] = useState<SummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Selected Invoice Modal State
  const [activeInvoice, setActiveInvoice] = useState<MonthlyInvoice | null>(null);
  const [adjustmentInput, setAdjustmentInput] = useState<number>(0);
  const [savingAdjustment, setSavingAdjustment] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // QR Modal State
  const [qrModalData, setQrModalData] = useState<{ upiId: string; payload: string; qrUrl: string; friendName: string; amount: number } | null>(null);

  // Feedback Messages
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const fetchBillingSummary = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const res = await fetch(`/api/billing/summary?month=${selectedMonth}&year=${selectedYear}`);
      if (!res.ok) throw new Error("Failed to fetch billing data");
      const data = await res.json();
      setSummaries(data.summaries || []);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to load monthly bills.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingSummary();
  }, [selectedMonth, selectedYear]);

  const handleGenerateAll = async () => {
    try {
      setGenerating(true);
      setStatusMessage("");
      setErrorMessage("");

      const res = await fetch("/api/billing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate invoices.");

      setStatusMessage(`Successfully generated invoices for ${selectedMonth}/${selectedYear}! Snapshot locked.`);
      fetchBillingSummary();
    } catch (err: any) {
      setErrorMessage(err.message || "Invoice generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenInvoiceModal = (item: SummaryItem) => {
    if (item.invoice) {
      setActiveInvoice(item.invoice);
      setAdjustmentInput(item.invoice.adjustmentAmount);
    }
  };

  const handleSaveAdjustment = async () => {
    if (!activeInvoice) return;
    try {
      setSavingAdjustment(true);
      const res = await fetch(`/api/billing/invoices/${activeInvoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adjustmentAmount: adjustmentInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update adjustment");

      setActiveInvoice(data);
      setStatusMessage("Invoice total updated with adjustment!");
      fetchBillingSummary();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingAdjustment(false);
    }
  };

  const handleSendEmail = async (invoiceId: string) => {
    try {
      setSendingEmail(true);
      const res = await fetch(`/api/billing/invoices/${invoiceId}/send-email`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send email");

      setStatusMessage(data.message || "Invoice email sent successfully!");
      if (activeInvoice && activeInvoice.id === invoiceId) {
        setActiveInvoice(data.invoice);
      }
      fetchBillingSummary();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleFetchQr = async (invoiceId: string, friendName: string) => {
    try {
      const res = await fetch(`/api/billing/invoices/${invoiceId}/qr`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch QR code");

      setQrModalData({
        upiId: data.upiId,
        payload: data.upiPayload,
        qrUrl: data.qrDataUrl,
        friendName,
        amount: data.amountDue,
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  // High-level aggregates
  const totalBilled = summaries.reduce(
    (sum, s) => sum + (s.invoice ? s.invoice.totalAmount : s.liveStats.subtotalAmount),
    0
  );
  const totalPaid = summaries.reduce((sum, s) => sum + (s.invoice ? s.invoice.amountPaid : 0), 0);
  const totalPending = Math.max(0, totalBilled - totalPaid);
  const totalTiffins = summaries.reduce(
    (sum, s) => sum + (s.invoice ? s.invoice.totalQuantity : s.liveStats.totalQuantity),
    0
  );

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 p-6 rounded-2xl border border-slate-800/80 shadow-xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Monthly Bills & Invoicing
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
              {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Group monthly tiffins per roommate, generate locked invoice snapshots, send emails, and scan UPI QR codes.
          </p>
        </div>

        {/* Month & Year Selectors */}
        <div className="flex items-center space-x-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            {[2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {statusMessage && (
        <div className="flex items-center space-x-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center space-x-2 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Total Monthly Tiffins</span>
          <span className="text-2xl font-black text-amber-400 font-mono">{totalTiffins} Tiffins</span>
          <span className="text-[11px] text-slate-500 block">Across all roommates</span>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Total Billed Amount</span>
          <span className="text-2xl font-black text-white font-mono">₹{totalBilled}</span>
          <span className="text-[11px] text-slate-500 block">Gross subtotal + adjustments</span>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Amount Collected</span>
          <span className="text-2xl font-black text-emerald-400 font-mono">₹{totalPaid}</span>
          <span className="text-[11px] text-slate-500 block">Recorded roommate payments</span>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Pending Due Balance</span>
          <span className="text-2xl font-black text-rose-400 font-mono">₹{totalPending}</span>
          <span className="text-[11px] text-slate-500 block">Outstanding room dues</span>
        </div>
      </div>

      {/* Action Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800/60">
        <div>
          <h3 className="text-sm font-bold text-slate-200">
            Invoice Snapshot Controls — {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
          </h3>
          <p className="text-xs text-slate-400">
            Generate or refresh locked month-end invoice snapshots for all active roommates.
          </p>
        </div>

        <button
          onClick={handleGenerateAll}
          disabled={generating}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4 stroke-[2.5]" />}
          <span>Generate All Invoices ({months.find((m) => m.value === selectedMonth)?.label})</span>
        </button>
      </div>

      {/* Summaries & Invoice Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          <span className="text-sm text-slate-400">Computing monthly totals...</span>
        </div>
      ) : summaries.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800/50">
          <Receipt className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No active roommates found to calculate bills for.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summaries.map((item) => {
            const { friend, liveStats, invoice } = item;
            const amountToDisplay = invoice ? invoice.totalAmount : liveStats.subtotalAmount;
            const tiffinsToDisplay = invoice ? invoice.totalQuantity : liveStats.totalQuantity;
            const mealsToDisplay = invoice ? invoice.totalMeals : liveStats.totalMeals;
            const status = invoice ? invoice.status : "UNGENERATED";

            return (
              <div
                key={friend.id}
                className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 flex items-center justify-center font-black text-amber-400 text-sm">
                        {friend.shortCode}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-100 text-base">{friend.fullName}</h3>
                        <span className="text-xs text-slate-400 font-mono">Code: {friend.shortCode}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        status === "PAID"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : status === "PARTIALLY_PAID"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : status === "GENERATED"
                          ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Total Meal Events</span>
                      <span className="font-semibold text-slate-200">{mealsToDisplay} Meals</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Total Tiffins</span>
                      <span className="font-semibold text-amber-300 font-mono">{tiffinsToDisplay} Tiffins</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal</span>
                      <span className="font-semibold text-slate-200 font-mono">₹{invoice ? invoice.subtotalAmount : liveStats.subtotalAmount}</span>
                    </div>
                    {invoice && invoice.adjustmentAmount !== 0 && (
                      <div className="flex justify-between text-slate-400">
                        <span>Adjustment</span>
                        <span className="font-semibold text-amber-400 font-mono">
                          {invoice.adjustmentAmount > 0 ? `+₹${invoice.adjustmentAmount}` : `-₹${Math.abs(invoice.adjustmentAmount)}`}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-slate-800/60">
                      <span>Total Invoice</span>
                      <span className="text-emerald-400 font-mono">₹{amountToDisplay}</span>
                    </div>

                    {invoice && (
                      <div className="flex justify-between text-xs pt-1">
                        <span className="text-slate-400">Paid / Due</span>
                        <span className="font-bold text-slate-300 font-mono">
                          <span className="text-emerald-400">₹{invoice.amountPaid}</span> /{" "}
                          <span className="text-rose-400">₹{invoice.amountDue}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/60 space-y-2">
                  {invoice ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleOpenInvoiceModal(item)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>

                      {friend.upiId ? (
                        <button
                          onClick={() => handleFetchQr(invoice.id, friend.fullName)}
                          className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5 text-amber-400" />
                          <span>UPI QR</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendEmail(invoice.id)}
                          disabled={sendingEmail}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
                        >
                          <Mail className="w-3.5 h-3.5 text-amber-400" />
                          <span>Email</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic block text-center">
                      Live total calculated. Click "Generate All Invoices" above to lock snapshot.
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invoice Detail Modal */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Invoice Snapshot: {activeInvoice.friend.fullName}
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    [{activeInvoice.friend.shortCode}]
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Month: {months.find((m) => m.value === activeInvoice.month)?.label} {activeInvoice.year}
                </p>
              </div>

              <button
                onClick={() => setActiveInvoice(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action Bar inside modal */}
            <div className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => handleSendEmail(activeInvoice.id)}
                disabled={sendingEmail}
                className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 disabled:opacity-50 flex items-center space-x-2"
              >
                {sendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                <span>Send Invoice Email</span>
              </button>

              {activeInvoice.friend.upiId && (
                <button
                  onClick={() => handleFetchQr(activeInvoice.id, activeInvoice.friend.fullName)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-amber-300 border border-slate-700 hover:bg-slate-700 font-bold flex items-center space-x-2"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>Show UPI QR Payload</span>
                </button>
              )}
            </div>

            {/* Invoice Breakdown Header */}
            <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block">Subtotal</span>
                <span className="text-base font-bold text-white font-mono">₹{activeInvoice.subtotalAmount}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Adjustment</span>
                <span className="text-base font-bold text-amber-400 font-mono">₹{activeInvoice.adjustmentAmount}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Final Amount Due</span>
                <span className="text-base font-extrabold text-emerald-400 font-mono">₹{activeInvoice.amountDue}</span>
              </div>
            </div>

            {/* Adjustment Control */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs">
              <label className="font-bold text-amber-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Adjust Bill Amount (+ for extra charges, - for discounts)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={adjustmentInput}
                  onChange={(e) => setAdjustmentInput(Number(e.target.value))}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleSaveAdjustment}
                  disabled={savingAdjustment}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 disabled:opacity-50 transition-colors"
                >
                  {savingAdjustment ? "Saving..." : "Apply Adjustment"}
                </button>
              </div>
            </div>

            {/* Snapshot Items Table */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-200 text-xs">Snapshot Line Items ({activeInvoice.items.length})</h4>
              <div className="space-y-1.5">
                {activeInvoice.items.map((item, idx) => (
                  <div
                    key={item.id || `inv-item-${idx}-${item.entryDate}`}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-amber-300/90 font-bold">
                        {new Date(item.entryDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      </span>
                      <span className="font-bold text-slate-200">{item.mealType}</span>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="text-slate-400">{item.quantity} Tiffin @ ₹{item.unitPrice}</span>
                      <span className="font-extrabold text-emerald-400 font-mono w-16 text-right">₹{item.lineTotal}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModalData && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-amber-400" />
                UPI Scan & Pay — {qrModalData.friendName}
              </h3>
              <button
                onClick={() => setQrModalData(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl inline-block shadow-lg mx-auto">
              <img src={qrModalData.qrUrl} alt="UPI QR Code" className="w-48 h-48 mx-auto" />
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-slate-400 block">UPI Payee ID:</span>
              <span className="font-mono font-bold text-amber-400 text-sm bg-slate-950 px-3 py-1 rounded border border-slate-800 inline-block">
                {qrModalData.upiId}
              </span>
              <span className="text-slate-400 block pt-1">Amount Due:</span>
              <span className="text-xl font-extrabold text-emerald-400 font-mono">₹{qrModalData.amount}</span>
            </div>

            <div className="pt-2">
              <a
                href={qrModalData.payload}
                className="block w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs hover:from-amber-400 hover:to-orange-400 shadow-md"
              >
                Open directly in UPI App (GPay / PhonePe)
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
