"use client";

import { useEffect, useState } from "react";
import { 
  UserPlus, 
  Search, 
  Edit3, 
  UserCheck, 
  UserX, 
  Mail, 
  Phone, 
  QrCode, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Trash2,
  X
} from "lucide-react";

interface Friend {
  id: string;
  fullName: string;
  shortCode: string;
  email?: string | null;
  phone?: string | null;
  upiId?: string | null;
  isActive: boolean;
  notes?: string | null;
  createdAt: string;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [upiId, setUpiId] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Status/Error Feedback
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/friends");
      if (!res.ok) throw new Error("Failed to fetch friends");
      const data = await res.json();
      setFriends(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const openCreateModal = () => {
    setEditingFriend(null);
    setFullName("");
    setShortCode("");
    setEmail("");
    setPhone("");
    setUpiId("");
    setNotes("");
    setIsActive(true);
    setFormError("");
    setFormSuccess("");
    setIsModalOpen(true);
  };

  const openEditModal = (friend: Friend) => {
    setEditingFriend(friend);
    setFullName(friend.fullName);
    setShortCode(friend.shortCode);
    setEmail(friend.email || "");
    setPhone(friend.phone || "");
    setUpiId(friend.upiId || "");
    setNotes(friend.notes || "");
    setIsActive(friend.isActive);
    setFormError("");
    setFormSuccess("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!fullName.trim()) {
      setFormError("Full Name is required.");
      return;
    }
    if (!shortCode.trim()) {
      setFormError("Short Code is required.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        fullName: fullName.trim(),
        shortCode: shortCode.trim().toUpperCase(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        upiId: upiId.trim() || undefined,
        notes: notes.trim() || undefined,
        isActive,
      };

      const url = editingFriend ? `/api/friends/${editingFriend.id}` : "/api/friends";
      const method = editingFriend ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Operation failed.");
      }

      setFormSuccess(
        editingFriend
          ? `Friend '${data.fullName}' updated successfully.`
          : `Friend '${data.fullName}' [Code: ${data.shortCode}] added successfully!`
      );

      setTimeout(() => {
        setIsModalOpen(false);
        fetchFriends();
      }, 800);
    } catch (err: any) {
      setFormError(err.message || "Failed to save friend.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActiveStatus = async (friend: Friend) => {
    try {
      const res = await fetch(`/api/friends/${friend.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !friend.isActive }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      fetchFriends();
    } catch (err: any) {
      alert(err.message || "Error updating friend status");
    }
  };

  const handleDelete = async (friend: Friend) => {
    if (!confirm(`Are you sure you want to remove or deactivate ${friend.fullName}?`)) return;

    try {
      const res = await fetch(`/api/friends/${friend.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete friend");
      fetchFriends();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredFriends = friends.filter((f) => {
    const matchesSearch =
      f.fullName.toLowerCase().includes(search.toLowerCase()) ||
      f.shortCode.toLowerCase().includes(search.toLowerCase()) ||
      (f.email && f.email.toLowerCase().includes(search.toLowerCase()));

    if (statusFilter === "active") return matchesSearch && f.isActive;
    if (statusFilter === "inactive") return matchesSearch && !f.isActive;
    return matchesSearch;
  });

  const activeCount = friends.filter((f) => f.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 p-6 rounded-2xl border border-slate-800/80 shadow-xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Roommates & Friends Directory
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
              {friends.length} Registered
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your roommate master list and unique shorthand codes used for daily tiffin entries.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-lg shadow-orange-500/20 transition-all duration-200 cursor-pointer active:scale-95"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Roommate</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800/60">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, code, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <span className="text-xs text-slate-400 font-medium mr-1">Status:</span>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === "active"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === "all"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            All ({friends.length})
          </button>
          <button
            onClick={() => setStatusFilter("inactive")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === "inactive"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            Deactivated ({friends.length - activeCount})
          </button>
        </div>
      </div>

      {/* Friends Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          <span className="text-sm text-slate-400">Loading roommate directory...</span>
        </div>
      ) : filteredFriends.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/50">
          <UserX className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-300">No Roommates Found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {search
              ? "No roommate matches your search criteria."
              : "Get started by adding your first roommate to track morning and night tiffin entries."}
          </p>
          {!search && (
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400 transition-all"
            >
              Add Roommate Now
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFriends.map((friend) => (
            <div
              key={friend.id}
              className={`relative group bg-gradient-to-b from-slate-900 to-slate-900/90 rounded-2xl border p-5 transition-all duration-200 hover:shadow-xl ${
                friend.isActive
                  ? "border-slate-800/80 hover:border-amber-500/40"
                  : "border-slate-800/40 opacity-70 hover:opacity-100"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 flex items-center justify-center font-black text-amber-400 text-base shadow-inner">
                    {friend.shortCode}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                      {friend.fullName}
                    </h3>
                    <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-400 border border-amber-400/20 mt-0.5">
                      Code: {friend.shortCode}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditModal(friend)}
                    title="Edit Roommate"
                    className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleActiveStatus(friend)}
                    title={friend.isActive ? "Deactivate Roommate" : "Activate Roommate"}
                    className={`p-1.5 rounded-lg transition-colors ${
                      friend.isActive
                        ? "text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
                        : "text-amber-400 hover:text-amber-300 hover:bg-slate-800"
                    }`}
                  >
                    {friend.isActive ? <UserCheck className="w-4 h-4 text-emerald-400" /> : <UserX className="w-4 h-4 text-amber-400" />}
                  </button>
                  <button
                    onClick={() => handleDelete(friend)}
                    title="Delete Roommate"
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-2 text-xs text-slate-400">
                {friend.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{friend.email}</span>
                  </div>
                )}
                {friend.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{friend.phone}</span>
                  </div>
                )}
                {friend.upiId && (
                  <div className="flex items-center space-x-2">
                    <QrCode className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
                    <span className="font-mono text-amber-300/90">{friend.upiId}</span>
                  </div>
                )}
                {friend.notes && (
                  <p className="text-slate-500 italic text-[11px] pt-1">
                    "{friend.notes}"
                  </p>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                <span>Status</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded-full ${
                    friend.isActive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}
                >
                  {friend.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {editingFriend ? "Edit Roommate Profile" : "Add Roommate"}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kushal Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Short Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KS or 2K"
                    value={shortCode}
                    onChange={(e) => setShortCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-500">Unique code for quick meal notes.</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. kushal@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Phone (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">UPI ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. kushal@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Room 201, double tiffin preferred."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="isActive" className="text-slate-300 font-medium cursor-pointer">
                  Active Roommate (available for daily tiffin ticks)
                </label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 border-t border-slate-800">
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
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingFriend ? "Save Changes" : "Create Roommate"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
