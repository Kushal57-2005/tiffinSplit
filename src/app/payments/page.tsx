"use client";

import { useEffect, useState } from "react";
import { 
  CreditCard, 
  PlusCircle, 
  IndianRupee, 
  QrCode, 
  Banknote, 
  Building2, 
  Calendar, 
  Search, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  X,
  FileText
} from "lucide-react";

interface Friend {
  id: string;
  fullName: string;
  shortCode: string;
  upiId?: string | null;
}

interface MonthlyInvoice {
  id: string;
  month: number;
  year: number;
  totalAmount: number;
  amountDue: number;
}

interface Payment {
  id: string;
  friendId: string;
  friend: Friend;
  invoiceId?: string | null;
  invoice?: MonthlyInvoice | null;
  amount: number;
  paymentMethod: "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER";
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  transactionRef?: string | null;
  notes?: string | null;
  paidAt: string;
}

export default function PaymentsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "BANK_TRANSFER" | "OTHER">("UPI");
  const [transactionRef, setTransactionRef] = useState("");
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [friendsRes, paymentsRes] = await Promise.all([
        fetch("/api/friends?active=true"),
        fetch("/api/payments"),
      ]);

      if (friendsRes.ok) setFriends(await friendsRes.json());
      if (paymentsRes.ok) setPayments(await paymentsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setSelectedFriendId(friends[0]?.id || "");
    setAmount("");
    setPaymentMethod("UPI");
    setTransactionRef("");
    setNotes("");
    setPaidAt(new Date().toISOString().split("T")[0]);
    setFormError("");
    setFormSuccess("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!selectedFriendId) {
      setFormError("Please select a roommate.");
      return;
    }
    const payNum = Number(amount);
    if (!payNum || payNum <= 0) {
      setFormError("Please enter a valid amount greater than ₹0.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          friendId: selectedFriendId,
          amount: payNum,
          paymentMethod,
          transactionRef,
          notes,
          paidAt,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record payment.");

      setFormSuccess(`Payment of ₹${payNum} recorded successfully!`);

      setTimeout(() => {
        setIsModalOpen(false);
        fetchData();
      }, 800);
    } catch (err: any) {
      setFormError(err.message || "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment record? This will adjust invoice balances.")) return;
    try {
      const res = await fetch(`/api/payments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete payment");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.friend.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.friend.shortCode.toLowerCase().includes(search.toLowerCase()) ||
      (p.transactionRef && p.transactionRef.toLowerCase().includes(search.toLowerCase()));

    if (methodFilter !== "ALL" && p.paymentMethod !== methodFilter) return false;
    return matchesSearch;
  });

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const upiCollected = payments.filter((p) => p.paymentMethod === "UPI").reduce((sum, p) => sum + p.amount, 0);
  const cashCollected = payments.filter((p) => p.paymentMethod === "CASH").reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 p-6 rounded-2xl border border-slate-800/80 shadow-xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Payment Records Ledger
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              {payments.length} Transactions Recorded
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Record payments received via UPI, Cash, or Bank Transfer and automatically update monthly dues.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>Record New Payment</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Total Lifetime Collections</span>
          <span className="text-2xl font-black text-emerald-400 font-mono">₹{totalCollected}</span>
          <span className="text-[11px] text-slate-500 block">Across all roommates</span>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">UPI Payments</span>
          <span className="text-2xl font-black text-amber-400 font-mono">₹{upiCollected}</span>
          <span className="text-[11px] text-slate-500 block">Digital scan & pay</span>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Cash Payments</span>
          <span className="text-2xl font-black text-white font-mono">₹{cashCollected}</span>
          <span className="text-[11px] text-slate-500 block">Physical cash receipts</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800/60">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search roommate name, code, or ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 font-medium mr-1">Method:</span>
          {["ALL", "UPI", "CASH", "BANK_TRANSFER"].map((method) => (
            <button
              key={method}
              onClick={() => setMethodFilter(method)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                methodFilter === method
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Ledger List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="text-sm text-slate-400">Loading payment ledger...</span>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/50">
          <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-300">No Payments Found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {search ? "No payments match your search query." : "Record your first roommate payment to begin tracking."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPayments.map((p) => {
            const formattedDate = new Date(p.paidAt).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "short",
              day: "numeric",
            });

            return (
              <div
                key={p.id}
                className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all shadow-md"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="h-10 w-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400">
                    {p.paymentMethod === "UPI" && <QrCode className="w-5 h-5" />}
                    {p.paymentMethod === "CASH" && <Banknote className="w-5 h-5 text-amber-400" />}
                    {p.paymentMethod === "BANK_TRANSFER" && <Building2 className="w-5 h-5 text-indigo-400" />}
                    {p.paymentMethod === "OTHER" && <CreditCard className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-100 text-sm">{p.friend.fullName}</h3>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        [{p.friend.shortCode}]
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5">
                      <span>{formattedDate}</span>
                      <span>•</span>
                      <span className="font-medium text-slate-300">{p.paymentMethod}</span>
                      {p.transactionRef && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-amber-300/80">Ref: {p.transactionRef}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-4">
                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-400 font-mono">₹{p.amount}</span>
                    {p.invoice && (
                      <span className="text-[10px] text-slate-500 block">
                        Linked Invoice: {p.invoice.month}/{p.invoice.year}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(p.id)}
                    title="Delete payment record"
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                Record Roommate Payment
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Select Roommate *</label>
                <select
                  required
                  value={selectedFriendId}
                  onChange={(e) => setSelectedFriendId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {friends.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.fullName} [{f.shortCode}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Amount (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 1500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Payment Date</label>
                  <input
                    type="date"
                    value={paidAt}
                    onChange={(e) => setPaidAt(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Payment Method *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "UPI", label: "UPI", icon: QrCode },
                    { id: "CASH", label: "Cash", icon: Banknote },
                    { id: "BANK_TRANSFER", label: "Bank", icon: Building2 },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = paymentMethod === item.id;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setPaymentMethod(item.id as any)}
                        className={`flex items-center justify-center space-x-1.5 p-2 rounded-lg border font-semibold text-xs transition-all ${
                          isSelected
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Transaction Reference (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref / UTR 321456987"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Paid via GPay for August tiffins."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 flex items-center space-x-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Record Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
