"use client";

import { useEffect, useState, use } from "react";
import { 
  UtensilsCrossed, 
  QrCode, 
  CheckCircle2, 
  ArrowUpRight, 
  Loader2, 
  Smartphone,
  ShieldCheck,
  Building2
} from "lucide-react";

interface PayDetails {
  id: string;
  monthName: string;
  year: number;
  friendName: string;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  status: string;
  upiId: string;
  upiPayload: string;
  qrDataUrl: string;
}

export default function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [details, setDetails] = useState<PayDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDetails() {
      try {
        setLoading(true);
        const res = await fetch(`/api/pay/${resolvedParams.id}`);
        if (!res.ok) throw new Error("Invoice not found or expired.");
        const data = await res.json();
        setDetails(data);

        // Immediately trigger native UPI app launch redirect
        if (data.upiPayload) {
          window.location.href = data.upiPayload;
        }
      } catch (err: any) {
        setError(err.message || "Failed to load payment details.");
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100">
        <Loader2 className="w-10 h-10 text-amber-400 animate-spin mb-3" />
        <span className="text-sm font-semibold text-slate-400">Opening TiffinSplit Payment Portal...</span>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white">Payment Link Unavailable</h1>
          <p className="text-xs text-slate-400">{error || "Invalid invoice payment link."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20 mx-auto">
            <UtensilsCrossed className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">TiffinSplit Payment</h1>
          <p className="text-xs text-slate-400">
            Invoice for <span className="text-amber-400 font-semibold">{details.monthName} {details.year}</span>
          </p>
        </div>

        {/* Roommate & Due Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 text-center">
          <span className="text-xs text-slate-400 font-medium block">Roommate Statement</span>
          <h2 className="text-lg font-bold text-white">{details.friendName}</h2>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Net Amount Due</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">₹{details.amountDue}</span>
          </div>
        </div>

        {/* UPI QR Code Section */}
        {details.qrDataUrl && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-center space-y-3">
            <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-400 font-medium">
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>Scan QR Code via GPay / PhonePe / Paytm</span>
            </div>

            <div className="p-3 bg-white rounded-2xl inline-block border-4 border-amber-500 shadow-xl">
              <img
                src={details.qrDataUrl}
                alt="UPI Payment QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="text-xs">
              <span className="text-slate-400 block mb-1">Payee UPI ID</span>
              <code className="bg-slate-900 border border-slate-800 text-amber-400 px-3 py-1.5 rounded-lg font-mono font-bold text-sm select-all">
                {details.upiId}
              </code>
            </div>
          </div>
        )}

        {/* 1-Tap UPI Launch Buttons */}
        {details.upiPayload && (
          <div className="space-y-2.5">
            <a
              href={details.upiPayload}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-orange-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Smartphone className="w-5 h-5" />
              <span>Open UPI App & Pay ₹{details.amountDue}</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>

            <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
              <a
                href={details.upiPayload.replace("upi://pay", "gpay://upi/pay")}
                className="flex items-center justify-center py-2 px-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-blue-400 font-bold transition-all text-center"
              >
                Google Pay
              </a>
              <a
                href={details.upiPayload.replace("upi://pay", "phonepe://pay")}
                className="flex items-center justify-center py-2 px-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-purple-400 font-bold transition-all text-center"
              >
                PhonePe
              </a>
              <a
                href={details.upiPayload.replace("upi://pay", "paytmmp://pay")}
                className="flex items-center justify-center py-2 px-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-400 font-bold transition-all text-center"
              >
                Paytm
              </a>
            </div>
          </div>
        )}

        <div className="pt-2 text-center text-[11px] text-slate-500 flex items-center justify-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Secure Direct UPI Settlement — TiffinSplit Admin</span>
        </div>
      </div>
    </div>
  );
}
