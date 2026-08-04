"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Users, 
  UtensilsCrossed, 
  Receipt, 
  ArrowRight, 
  Sparkles, 
  Loader2
} from "lucide-react";

interface DashboardData {
  activeFriendsCount: number;
  currentMonthMealsCount: number;
  totalBilledAmount: number;
  totalPaidAmount: number;
  totalPendingDue: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const [friendsRes, entriesRes, summaryRes] = await Promise.all([
          fetch("/api/friends?active=true"),
          fetch(`/api/entries?month=${month}&year=${year}`),
          fetch(`/api/billing/summary?month=${month}&year=${year}`),
        ]);

        let friendsCount = 0;
        let mealsCount = 0;
        let billed = 0;
        let paid = 0;

        if (friendsRes.ok) {
          const friends = await friendsRes.json();
          friendsCount = friends.length;
        }

        if (entriesRes.ok) {
          const entries = await entriesRes.json();
          mealsCount = entries.length;
        }

        if (summaryRes.ok) {
          const summary = await summaryRes.json();
          const summaries = summary.summaries || [];
          billed = summaries.reduce(
            (sum: number, s: any) => sum + (s.invoice ? s.invoice.totalAmount : s.liveStats.subtotalAmount),
            0
          );
          paid = summaries.reduce((sum: number, s: any) => sum + (s.invoice ? s.invoice.amountPaid : 0), 0);
        }

        setData({
          activeFriendsCount: friendsCount,
          currentMonthMealsCount: mealsCount,
          totalBilledAmount: billed,
          totalPaidAmount: paid,
          totalPendingDue: Math.max(0, billed - paid),
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Command Center */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/50 p-8 rounded-3xl border border-slate-800/80 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Roommate Meal Billing Operating System
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            TiffinSplit Overview & Command Center
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            Structured daily tiffin record keeping, tick-based meal entries, automated monthly grouping, locked invoice snapshots, and email billing.
          </p>

          {/* Core Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/entries"
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
            >
              <UtensilsCrossed className="w-4 h-4 stroke-[2.5]" />
              <span>Record Daily Tiffins</span>
            </Link>

            <Link
              href="/billing"
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all"
            >
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>Monthly Invoices</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Metric Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          <span className="text-sm text-slate-400">Loading roommate room status...</span>
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/friends"
            className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2 hover:border-amber-500/40 transition-all shadow-xl group"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">Active Roommates</span>
              <Users className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-3xl font-black text-white font-mono block">{data.activeFriendsCount}</span>
            <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
              Manage Roommate Directory <ArrowRight className="w-3 h-3" />
            </span>
          </Link>

          <Link
            href="/entries"
            className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2 hover:border-amber-500/40 transition-all shadow-xl group"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">Current Month Meals</span>
              <UtensilsCrossed className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-3xl font-black text-white font-mono block">{data.currentMonthMealsCount}</span>
            <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
              Add Tiffin Entry <ArrowRight className="w-3 h-3" />
            </span>
          </Link>

          <Link
            href="/billing"
            className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2 hover:border-amber-500/40 transition-all shadow-xl group"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">Current Month Billed</span>
              <Receipt className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-3xl font-black text-amber-400 font-mono block">₹{data.totalBilledAmount}</span>
            <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
              View Monthly Bills <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
