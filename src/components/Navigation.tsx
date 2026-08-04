"use client";

import { useState } from "react";
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
  Loader2
} from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Friends", href: "/friends", icon: Users },
    { name: "Meal Entries", href: "/entries", icon: UtensilsCrossed },
    { name: "Monthly Bills", href: "/billing", icon: Receipt },
  ];

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
                    onClick={() => signOut()}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>

                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                    title="Delete Account & All Data"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span className="hidden sm:inline">Delete Account</span>
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
