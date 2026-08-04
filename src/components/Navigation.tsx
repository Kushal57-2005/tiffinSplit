"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Users, 
  UtensilsCrossed, 
  Receipt, 
  LayoutDashboard, 
  LogIn,
  UserPlus,
  LogOut,
  User,
  Trash2,
  AlertTriangle,
  Loader2,
  Settings,
  QrCode,
  CheckCircle2,
  Mail,
  Phone,
  CreditCard,
  Save
} from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Settings State
  const [settingsName, setSettingsName] = useState("");
  const [settingsEmail, setSettingsEmail] = useState("");
  const [settingsPhone, setSettingsPhone] = useState("");
  const [settingsUpiId, setSettingsUpiId] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Friends", href: "/friends", icon: Users },
    { name: "Meal Entries", href: "/entries", icon: UtensilsCrossed },
    { name: "Monthly Bills", href: "/billing", icon: Receipt },
  ];

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      setSettingsStatus(null);
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setSettingsName(data.name || "");
        setSettingsEmail(data.email || "");
        setSettingsPhone(data.phone || "");
        setSettingsUpiId(data.upiId || "");
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const openSettings = () => {
    setShowSettingsModal(true);
    fetchProfile();
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setSettingsStatus(null);
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: settingsName,
          email: settingsEmail,
          phone: settingsPhone,
          upiId: settingsUpiId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update settings.");
      }

      setSettingsStatus({ type: "success", text: "Settings and Payee UPI ID updated successfully!" });
      setTimeout(() => setSettingsStatus(null), 4000);
    } catch (err: any) {
      setSettingsStatus({ type: "error", text: err.message || "Failed to save settings." });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      const res = await fetch("/api/user/account", {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete account.");
      }

      await signOut();
      setShowDeleteModal(false);
      setShowSettingsModal(false);
      router.push("/register");
    } catch (err: any) {
      alert(err.message || "Failed to delete account.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/85 border-b border-slate-800/80 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href={session?.user ? "/dashboard" : "/"} className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 flex items-center justify-center shadow-md shadow-orange-500/20">
                <UtensilsCrossed className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200 bg-clip-text text-transparent">
                  TiffinSplit
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  Roommate Billing
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center space-x-2">
              {!isPending && session?.user ? (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/80">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                      {session.user.name?.[0]?.toUpperCase() || <User className="w-3 h-3" />}
                    </div>
                    <span className="text-xs font-medium text-slate-200 hidden sm:inline max-w-[120px] truncate">
                      {session.user.name || session.user.email}
                    </span>
                  </div>

                  <button
                    onClick={openSettings}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                    title="Account & Payee Settings"
                  >
                    <Settings className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Settings</span>
                  </button>

                  <button
                    onClick={() => signOut()}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      pathname === "/login"
                        ? "bg-amber-500 text-slate-950"
                        : "bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60"
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Login</span>
                  </Link>

                  <Link
                    href="/register"
                    className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      pathname === "/register"
                        ? "bg-amber-500 text-slate-950"
                        : "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30"
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Register</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile nav bar */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 bg-slate-900/95 py-2 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center py-1 px-2 rounded text-[11px] font-medium transition-colors ${
                  isActive ? "text-amber-400" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg">Account & Payee Settings</h3>
                  <p className="text-xs text-slate-400">Configure your default contact and Payee UPI ID</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {settingsStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                  settingsStatus.type === "success"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                }`}
              >
                {settingsStatus.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{settingsStatus.text}</span>
              </div>
            )}

            {loadingProfile ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-2">
                <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                <span className="text-xs text-slate-400">Loading settings...</span>
              </div>
            ) : (
              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Your Full Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                    placeholder="e.g. Kushal Sharma"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Email Address</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={settingsEmail}
                      onChange={(e) => setSettingsEmail(e.target.value)}
                      placeholder="kushal@example.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Phone Number</span>
                    </label>
                    <input
                      type="tel"
                      value={settingsPhone}
                      onChange={(e) => setSettingsPhone(e.target.value)}
                      placeholder="e.g. +91 9876543210"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1 bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl">
                  <label className="text-amber-300 font-bold flex items-center gap-1.5 text-xs">
                    <QrCode className="w-4 h-4 text-amber-400" />
                    <span>Your Payee UPI ID (For Invoices & QR Codes)</span>
                  </label>
                  <input
                    type="text"
                    value={settingsUpiId}
                    onChange={(e) => setSettingsUpiId(e.target.value)}
                    placeholder="e.g. 9876543210@paytm or kushal@okicici"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-amber-300 font-mono font-bold placeholder-slate-600 focus:outline-none focus:border-amber-500 text-xs"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    When roommates receive monthly invoice emails or scan billing QR codes, payment will be requested to this UPI ID.
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-orange-500/20 disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
                  >
                    {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Settings</span>
                  </button>
                </div>
              </form>
            )}

            {/* Danger Zone: Delete Account */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Danger Zone</h4>
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <div>
                  <span className="text-xs font-bold text-rose-300 block">Delete Account & Wipe Data</span>
                  <span className="text-[11px] text-slate-400">Permanently delete your user account and all roommate data</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md cursor-pointer transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-lg">Delete Account & Wipe Data</h3>
                <p className="text-xs text-slate-400">Irreversible Action</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
              Are you sure you want to delete your TiffinSplit account? This will permanently wipe all associated roommate records, daily tiffin entries, monthly invoices, and payment logs from MongoDB Atlas. This action cannot be undone.
            </p>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-lg shadow-rose-600/20 flex items-center space-x-2 cursor-pointer"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{deleting ? "Deleting Everything..." : "Yes, Delete Account & Data"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
