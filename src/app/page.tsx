"use client";

import Link from "next/link";
import { 
  UtensilsCrossed, 
  Users, 
  Receipt, 
  QrCode, 
  Mail, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Calculator, 
  ChevronRight,
  Sun,
  Moon,
  TrendingUp,
  Clock
} from "lucide-react";
import { useSession } from "@/lib/auth-client";

export default function LandingPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen text-slate-100 space-y-20 pb-16 overflow-hidden">
      
      {/* ---------------------------------------------------- */}
      {/* HERO SECTION                                         */}
      {/* ---------------------------------------------------- */}
      <section className="relative pt-8 pb-12 sm:pt-16 sm:pb-20">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-amber-300/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6 px-4">
          
          {/* Top Pill */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-400 text-xs font-semibold shadow-lg shadow-amber-500/5 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>The Ultimate Roommate Meal & Tiffin Expense Manager</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.15]">
            No More Awkward Math or Lost Notes on <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
              Roommate Tiffin Bills
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
            Effortlessly record daily Morning & Night tiffin counts, auto-generate monthly invoices per roommate, send direct email bills, and collect instant payments with UPI QR codes.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4">
            {session?.user ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-slate-950 font-black text-base shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-slate-950 font-black text-base shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Start Splitting Free</span>
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </Link>

                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-base border border-slate-700/80 shadow-lg hover:border-slate-600 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Log In to Account</span>
                </Link>
              </>
            )}
          </div>

          {/* Quick Highlights */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>100% Free for Roommates</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Instant GPay / PhonePe UPI QR</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Automated Email Statements</span>
            </div>
          </div>

        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* INTERACTIVE MOCKUP / PREVIEW                         */}
      {/* ---------------------------------------------------- */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="relative p-1 rounded-3xl bg-gradient-to-b from-amber-500/30 via-slate-800/40 to-slate-900/60 shadow-2xl">
          <div className="bg-slate-950/90 rounded-[23px] p-6 sm:p-8 backdrop-blur-xl space-y-6">
            
            {/* Mock Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs text-slate-400 font-mono ml-2">TiffinSplit Live App Command Center</span>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                ● Connected to Live Database
              </span>
            </div>

            {/* Mock Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card 1: Daily Entry Mock */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-extrabold text-white">Daily Tiffin Logger</span>
                  </div>
                  <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded font-mono">
                    Today: Morning Meal
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-300 font-extrabold text-[11px] flex items-center justify-center">K</span>
                      <span className="font-bold text-slate-200">Kushal</span>
                    </div>
                    <span className="text-amber-400 font-bold">1 Tiffin (₹70)</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-300 font-extrabold text-[11px] flex items-center justify-center">A</span>
                      <span className="font-bold text-slate-200">Amit</span>
                    </div>
                    <span className="text-amber-400 font-bold">1 Tiffin (₹70)</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-md bg-rose-500/20 text-rose-300 font-extrabold text-[11px] flex items-center justify-center">R</span>
                      <span className="font-bold text-slate-200">Rahul</span>
                    </div>
                    <span className="text-slate-500 font-medium">0 Tiffin (Skipped)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Total Meal Quantity: <strong className="text-white">2 Tiffins</strong></span>
                  <span className="text-amber-400 font-extrabold text-sm">₹140</span>
                </div>
              </div>

              {/* Card 2: Invoice & UPI QR Mock */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Receipt className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-extrabold text-white">Monthly Roommate Invoice</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-semibold">
                    LOCKED STATEMENT
                  </span>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Roommate:</span>
                    <strong className="text-slate-200">Amit Sharma</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Month:</span>
                    <strong className="text-slate-200">August 2026</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Total Tiffins Consumed:</span>
                    <strong className="text-amber-400">42 Meals</strong>
                  </div>
                  <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                    <span className="font-semibold text-slate-300">Total Billed Amount:</span>
                    <strong className="text-amber-400 font-mono text-base font-black">₹2,940</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="flex items-center justify-center space-x-1.5 p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Instant UPI QR</span>
                  </div>
                  <div className="flex items-center justify-center space-x-1.5 p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Statement</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* WHY TIFFINSPLIT (PROBLEM VS SOLUTION)               */}
      {/* ---------------------------------------------------- */}
      <section className="max-w-5xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Built Specifically for Tiffin & Mess Expense Sharing
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Traditional expense splitters like Splitwise are great for one-off bills, but terrible for tracking daily 2x tiffins across multiple roommates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Old Way */}
          <div className="bg-slate-900/60 border border-rose-500/20 rounded-3xl p-6 space-y-4">
            <div className="flex items-center space-x-2 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-white">The Old Messy Way</h3>
            </div>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-start space-x-2">
                <span className="text-rose-400 font-bold">✕</span>
                <span>Writing meal ticks in paper notebooks that get lost or damaged.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-rose-400 font-bold">✕</span>
                <span>Confusing WhatsApp messages like "I had tiffin today but he didn't".</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-rose-400 font-bold">✕</span>
                <span>Calculating 30 days of custom meal prices manually at month-end.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-rose-400 font-bold">✕</span>
                <span>Chasing roommates for payment without transparent itemized proof.</span>
              </li>
            </ul>
          </div>

          {/* TiffinSplit Way */}
          <div className="bg-slate-900/60 border border-amber-500/30 rounded-3xl p-6 space-y-4 shadow-xl shadow-amber-500/5">
            <div className="flex items-center space-x-2 text-amber-400">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-white">The TiffinSplit Way</h3>
            </div>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>1-Tap daily meal logging for Morning & Night tiffins.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Auto-calculated month-end invoices with locked immutable totals.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Dynamic UPI QR code generated with exact bill amount for instant payment.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>1-Click automated email statements delivered to each roommate.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* KEY FEATURES GRID                                   */}
      {/* ---------------------------------------------------- */}
      <section className="max-w-6xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Everything You Need for Smooth Roommate Billing
          </h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Engineered with precise Indian tiffin rooming logistics in mind.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Feature 1 */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-amber-500/40 transition-all shadow-xl group">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 w-fit group-hover:scale-110 transition-transform">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-white text-base">Daily Tiffin Logger</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Record morning and night meal quantities with default or custom prices per roommate in under 10 seconds.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-amber-500/40 transition-all shadow-xl group">
            <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 w-fit group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-white text-base">Roommate Directory</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Manage active roommates, assign shortcodes (e.g. `KUSH`), and set default meal rates or dietary notes.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-amber-500/40 transition-all shadow-xl group">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 w-fit group-hover:scale-110 transition-transform">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-white text-base">Monthly Billing Engine</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Generate locked snapshot invoices every month. Prevent post-month editing disputes with immutable records.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-amber-500/40 transition-all shadow-xl group">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit group-hover:scale-110 transition-transform">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-white text-base">Instant UPI QR Payment</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Generate dynamic UPI QR codes populated with the exact rupee total. Scan & pay directly via Google Pay, PhonePe, or Paytm.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-amber-500/40 transition-all shadow-xl group">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 w-fit group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-white text-base">Automated Email Receipts</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Deliver formatted itemized invoice breakdowns straight to roommate emails with a single button click.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-amber-500/40 transition-all shadow-xl group">
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 w-fit group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-white text-base">Data Ownership & Audit</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Complete privacy control. Track system audit logs and delete your account & data instantly whenever you move out.
            </p>
          </div>

        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* HOW IT WORKS (3 STEPS)                              */}
      {/* ---------------------------------------------------- */}
      <section className="max-w-4xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">How TiffinSplit Works</h2>
          <p className="text-slate-400 text-sm">3 simple steps to stress-free roommate room billing</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3 text-center relative">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
              1
            </div>
            <h3 className="font-extrabold text-white text-sm">Add Roommates</h3>
            <p className="text-slate-400 text-xs">Register roommate names, emails, shortcodes, and default meal rates.</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3 text-center relative">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
              2
            </div>
            <h3 className="font-extrabold text-white text-sm">Log Daily Meals</h3>
            <p className="text-slate-400 text-xs">Tick tiffin quantities for Morning & Night in a fast 1-click interface.</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3 text-center relative">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
              3
            </div>
            <h3 className="font-extrabold text-white text-sm">Settle Bills via UPI</h3>
            <p className="text-slate-400 text-xs">Auto-generate invoices, email statement copies, and scan QR to collect payments.</p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* BOTTOM CTA BANNER                                    */}
      {/* ---------------------------------------------------- */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 rounded-3xl p-8 sm:p-12 shadow-2xl text-center space-y-6 text-slate-950">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight max-w-2xl mx-auto text-slate-950">
            Ready to Simplify Your Roommate Tiffin Expense Sharing?
          </h2>

          <p className="text-slate-900 font-semibold text-sm max-w-md mx-auto">
            Join roommate houses using TiffinSplit to record daily meals, eliminate month-end disputes, and settle payments effortlessly.
          </p>

          <div className="pt-2">
            {session?.user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-2 px-8 py-4 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-black text-sm shadow-xl transition-all cursor-pointer"
              >
                <span>Access Your Dashboard</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            ) : (
              <Link
                href="/register"
                className="inline-flex items-center space-x-2 px-8 py-4 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-black text-sm shadow-xl transition-all cursor-pointer"
              >
                <span>Create Free Account Now</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* FOOTER                                               */}
      {/* ---------------------------------------------------- */}
      <footer className="max-w-7xl mx-auto px-4 pt-10 border-t border-slate-800/80 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center">
            <UtensilsCrossed className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="font-extrabold text-white text-sm">TiffinSplit</span>
          <span>© 2026 Roommate Meal Billing Operating System</span>
        </div>

        <div className="flex items-center space-x-4">
          <Link href="/register" className="hover:text-amber-400 transition-colors">Register</Link>
          <Link href="/login" className="hover:text-amber-400 transition-colors">Login</Link>
          <Link href={session?.user ? "/dashboard" : "/login"} className="hover:text-amber-400 transition-colors">Dashboard</Link>
        </div>
      </footer>

    </div>
  );
}
