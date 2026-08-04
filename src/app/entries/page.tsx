"use client";

import { useEffect, useState } from "react";
import { 
  UtensilsCrossed, 
  Sun, 
  Moon, 
  CheckSquare, 
  Square, 
  Plus, 
  Minus, 
  Sparkles, 
  Calendar, 
  IndianRupee, 
  FileText, 
  Edit3, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Zap,
  Layers
} from "lucide-react";
import { parseShorthandNote, parseMultiLineShorthand, ParsedMealNote } from "@/lib/shorthand-parser";

interface Friend {
  id: string;
  fullName: string;
  shortCode: string;
  isActive: boolean;
}

interface MealEntryItem {
  id?: string;
  friendId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  friend: {
    id: string;
    fullName: string;
    shortCode: string;
  };
}

interface MealEntry {
  id: string;
  entryDate: string;
  mealType: "MORNING" | "NIGHT";
  defaultPrice: number;
  rawNote?: string | null;
  notes?: string | null;
  totalPersons: number;
  totalQuantity: number;
  totalAmount: number;
  createdAt: string;
  items: MealEntryItem[];
}

export default function EntriesPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [entries, setEntries] = useState<MealEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Single Form State
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [mealType, setMealType] = useState<"MORNING" | "NIGHT">("MORNING");
  const [defaultPrice, setDefaultPrice] = useState<number>(70);
  const [rawNote, setRawNote] = useState("");
  const [notes, setNotes] = useState("");

  // Map of friendId -> { selected: boolean, quantity: number, unitPrice: number }
  const [selectedItems, setSelectedItems] = useState<Record<string, { selected: boolean; quantity: number; unitPrice: number }>>({});

  // Editing state
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  // Multi-Line Bulk Add State
  const [showBulkMode, setShowBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkPrice, setBulkPrice] = useState<number>(70);
  const [parsedBulkNotes, setParsedBulkNotes] = useState<ParsedMealNote[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);

  // Shorthand Parse Feedback
  const [parseFeedback, setParseFeedback] = useState<{ matched: number; unmatched: string[] } | null>(null);

  // Status & Error
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Filters & Accordions
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [filterMealType, setFilterMealType] = useState<string>("ALL");
  const [searchDate, setSearchDate] = useState<string>("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [friendsRes, entriesRes] = await Promise.all([
        fetch("/api/friends?active=true"),
        fetch("/api/entries"),
      ]);

      if (friendsRes.ok) {
        const activeFriends = await friendsRes.json();
        setFriends(activeFriends);
        
        const map: Record<string, { selected: boolean; quantity: number; unitPrice: number }> = {};
        activeFriends.forEach((f: Friend) => {
          map[f.id] = { selected: false, quantity: 1, unitPrice: 70 };
        });
        setSelectedItems(map);
      }

      if (entriesRes.ok) {
        const entriesData = await entriesRes.json();
        setEntries(entriesData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDefaultPriceChange = (price: number) => {
    setDefaultPrice(price);
    setSelectedItems((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => {
        updated[id] = { ...updated[id], unitPrice: price };
      });
      return updated;
    });
  };

  const toggleFriendSelect = (id: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        selected: !prev[id]?.selected,
      },
    }));
  };

  const updateQuantity = (id: string, delta: number) => {
    setSelectedItems((prev) => {
      const currentQty = prev[id]?.quantity || 1;
      const newQty = Math.max(1, currentQty + delta);
      return {
        ...prev,
        [id]: {
          ...prev[id],
          selected: true,
          quantity: newQty,
        },
      };
    });
  };

  // Single-line Shorthand Parser
  const handleParseShorthand = () => {
    setParseFeedback(null);
    if (!rawNote.trim()) return;

    const shortCodes = friends.map((f) => f.shortCode);
    const parsed = parseShorthandNote(rawNote, shortCodes);

    if (parsed.suggestedMealType) {
      setMealType(parsed.suggestedMealType);
    }
    if (parsed.suggestedDate) {
      setEntryDate(parsed.suggestedDate);
    }

    const newMap: Record<string, { selected: boolean; quantity: number; unitPrice: number }> = {};
    friends.forEach((f) => {
      newMap[f.id] = { selected: false, quantity: 1, unitPrice: defaultPrice };
    });

    let matchedCount = 0;
    parsed.items.forEach((item) => {
      const friend = friends.find((f) => f.shortCode.toUpperCase() === item.shortCode.toUpperCase());
      if (friend) {
        newMap[friend.id] = {
          selected: true,
          quantity: item.quantity,
          unitPrice: defaultPrice,
        };
        matchedCount++;
      }
    });

    setSelectedItems(newMap);
    setParseFeedback({
      matched: matchedCount,
      unmatched: parsed.unmatchedTokens,
    });
  };

  // Multi-Line Bulk Shorthand Parser
  const handleParseBulkShorthand = () => {
    if (!bulkText.trim()) return;
    const shortCodes = friends.map((f) => f.shortCode);
    const parsedList = parseMultiLineShorthand(bulkText, shortCodes);
    setParsedBulkNotes(parsedList);
  };

  // Save All Multi-Line Bulk Entries
  const handleSaveBulkEntries = async () => {
    if (parsedBulkNotes.length === 0) return;

    try {
      setBulkSaving(true);
      setFormError("");
      setFormSuccess("");

      const friendCodeMap = new Map(friends.map((f) => [f.shortCode.toUpperCase(), f.id]));
      let successCount = 0;

      for (const parsed of parsedBulkNotes) {
        if (parsed.items.length === 0) continue;

        const dateToSave = parsed.suggestedDate || entryDate;
        const typeToSave = parsed.suggestedMealType || mealType;

        const items = parsed.items
          .map((item) => {
            const friendId = friendCodeMap.get(item.shortCode.toUpperCase());
            if (!friendId) return null;
            return {
              friendId,
              quantity: item.quantity,
              unitPrice: bulkPrice,
            };
          })
          .filter(Boolean);

        if (items.length === 0) continue;

        const payload = {
          entryDate: dateToSave,
          mealType: typeToSave,
          defaultPrice: bulkPrice,
          rawNote: parsed.rawText,
          notes: "Multi-line bulk add",
          items,
        };

        const res = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) successCount++;
      }

      setFormSuccess(`Successfully bulk-created ${successCount} daily meal entries at ₹${bulkPrice}/tiffin!`);
      setBulkText("");
      setParsedBulkNotes([]);
      setShowBulkMode(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || "Failed to bulk save entries.");
    } finally {
      setBulkSaving(false);
    }
  };

  // Calculations for active selection
  const selectedFriendIds = Object.keys(selectedItems).filter((id) => selectedItems[id]?.selected);
  const totalSelectedPersons = selectedFriendIds.length;
  const totalSelectedTiffins = selectedFriendIds.reduce((sum, id) => sum + (selectedItems[id]?.quantity || 0), 0);
  const totalSelectedCost = selectedFriendIds.reduce(
    (sum, id) => sum + (selectedItems[id]?.quantity || 0) * (selectedItems[id]?.unitPrice || defaultPrice),
    0
  );

  const resetForm = () => {
    setEditingEntryId(null);
    setRawNote("");
    setNotes("");
    setFormError("");
    setFormSuccess("");
    setParseFeedback(null);

    const map: Record<string, { selected: boolean; quantity: number; unitPrice: number }> = {};
    friends.forEach((f) => {
      map[f.id] = { selected: false, quantity: 1, unitPrice: defaultPrice };
    });
    setSelectedItems(map);
  };

  const openEditEntry = (entry: MealEntry) => {
    setEditingEntryId(entry.id);
    setEntryDate(entry.entryDate.split("T")[0]);
    setMealType(entry.mealType);
    setDefaultPrice(entry.defaultPrice);
    setRawNote(entry.rawNote || "");
    setNotes(entry.notes || "");

    const map: Record<string, { selected: boolean; quantity: number; unitPrice: number }> = {};
    friends.forEach((f) => {
      map[f.id] = { selected: false, quantity: 1, unitPrice: entry.defaultPrice };
    });

    entry.items.forEach((item) => {
      map[item.friend.id] = {
        selected: true,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      };
    });

    setSelectedItems(map);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (selectedFriendIds.length === 0) {
      setFormError("Please tick at least one roommate for this meal entry.");
      return;
    }

    try {
      setSubmitting(true);

      const items = selectedFriendIds.map((id) => ({
        friendId: id,
        quantity: selectedItems[id].quantity,
        unitPrice: selectedItems[id].unitPrice,
      }));

      const payload = {
        entryDate,
        mealType,
        defaultPrice,
        rawNote,
        notes,
        items,
      };

      const url = editingEntryId ? `/api/entries/${editingEntryId}` : "/api/entries";
      const method = editingEntryId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save entry.");

      setFormSuccess(
        editingEntryId
          ? "Meal entry updated successfully!"
          : `Saved ${data.mealType} meal entry for ${data.totalPersons} roommates (${data.totalQuantity} tiffins)!`
      );

      setTimeout(() => {
        resetForm();
        fetchData();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || "Failed to save meal entry.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this meal entry?")) return;

    try {
      const res = await fetch(`/api/entries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete entry");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredEntries = entries.filter((entry) => {
    if (filterMealType !== "ALL" && entry.mealType !== filterMealType) return false;
    if (searchDate && !entry.entryDate.startsWith(searchDate)) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 p-6 rounded-2xl border border-slate-800/80 shadow-xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Daily Tiffin Meal Entry
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
              {entries.length} Historical Records
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tick off roommates for morning or night meals, assign double tiffins, or paste multi-line shorthand notes.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowBulkMode(!showBulkMode)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>{showBulkMode ? "Close Multi-Day Mode" : "Multi-Day Bulk Add"}</span>
          </button>

          {editingEntryId && (
            <button
              onClick={resetForm}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700"
            >
              Cancel Edit Mode
            </button>
          )}
        </div>
      </div>

      {/* Multi-Line Bulk Import Modal / Box */}
      {showBulkMode && (
        <div className="bg-slate-900 border-2 border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
            <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Multi-Day Multi-Line Shorthand Bulk Add</span>
            </h3>

            {/* Custom Bulk Price Input */}
            <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
                <span>Bulk Price / Tiffin:</span>
              </label>
              <input
                type="number"
                min="0"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(Number(e.target.value))}
                className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-amber-300 font-mono focus:outline-none focus:border-amber-500 text-center"
              />
            </div>
          </div>

          <textarea
            rows={5}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={`Paste multi-line shorthand notes, e.g.:\n29 July N - S, 2K, KP, P, H, S\n30 July N - S, K, KP, P, H, S`}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500"
          />

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleParseBulkShorthand}
              disabled={!bulkText.trim()}
              className="px-5 py-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 font-bold text-xs disabled:opacity-40 transition-colors cursor-pointer"
            >
              Parse All Lines Below
            </button>

            {parsedBulkNotes.length > 0 && (
              <button
                type="button"
                onClick={handleSaveBulkEntries}
                disabled={bulkSaving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-orange-500/20 flex items-center space-x-2 cursor-pointer"
              >
                {bulkSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Save All {parsedBulkNotes.length} Days @ ₹{bulkPrice}/Tiffin</span>
              </button>
            )}
          </div>

          {/* Parsed Preview Table */}
          {parsedBulkNotes.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-300">Parsed Preview ({parsedBulkNotes.length} Days @ ₹{bulkPrice}/tiffin):</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {parsedBulkNotes.map((note, idx) => {
                  const totalTiffins = note.items.reduce((s, i) => s + i.quantity, 0);
                  const dayCost = totalTiffins * bulkPrice;
                  return (
                    <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-amber-400 mr-2">{note.suggestedDate || "Default Date"}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold mr-2">
                          {note.suggestedMealType || "MORNING"}
                        </span>
                        <span className="text-slate-400 font-mono">{note.rawText}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400 font-bold block">{totalTiffins} Tiffins (₹{dayCost})</span>
                        <span className="text-[10px] text-slate-500">
                          {note.items.map((i) => `${i.quantity}${i.shortCode}`).join(", ")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Single Form Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-400" />
            <span>{editingEntryId ? "Edit Meal Entry" : "Record New Meal Entry"}</span>
          </h2>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setMealType("MORNING")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mealType === "MORNING"
                  ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                  : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>MORNING</span>
            </button>
            <button
              type="button"
              onClick={() => setMealType("NIGHT")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mealType === "NIGHT"
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                  : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>NIGHT</span>
            </button>
          </div>
        </div>

        {formError && (
          <div className="flex items-center space-x-2 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {formSuccess && (
          <div className="flex items-center space-x-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{formSuccess}</span>
          </div>
        )}

        {/* Shorthand Helper Box */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              Quick Shorthand Note Parser
            </label>
            <span className="text-[11px] text-slate-500">e.g. 29 July N - S, 2K, KP, P, H, S</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Paste shorthand note string..."
              value={rawNote}
              onChange={(e) => setRawNote(e.target.value)}
              className="w-full sm:flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
            <button
              type="button"
              onClick={handleParseShorthand}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 font-semibold text-xs transition-colors shrink-0"
            >
              Auto-Tick Form
            </button>
          </div>

          {parseFeedback && (
            <div className="text-xs pt-1 flex items-center gap-3">
              <span className="text-emerald-400 font-medium">
                ✓ Matched {parseFeedback.matched} roommate shortcode(s)
              </span>
              {parseFeedback.unmatched.length > 0 && (
                <span className="text-amber-400">
                  Unrecognized tokens: {parseFeedback.unmatched.join(", ")}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Date & Default Price Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Entry Date
            </label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
              Default Price per Tiffin (₹)
            </label>
            <input
              type="number"
              min="0"
              value={defaultPrice}
              onChange={(e) => handleDefaultPriceChange(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 font-semibold"
            />
          </div>
        </div>

        {/* Roommate Selection Grid */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">
              Select Roommates for {mealType} Tiffin ({totalSelectedPersons} selected)
            </h3>
            <span className="text-xs text-slate-500">
              Tick roommate and adjust quantity if someone took 2+ tiffins.
            </span>
          </div>

          {friends.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">
              No active roommates found. Please add roommates first in the Friends section.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {friends.map((friend) => {
                const itemState = selectedItems[friend.id] || { selected: false, quantity: 1, unitPrice: defaultPrice };
                const isSelected = itemState.selected;

                return (
                  <div
                    key={friend.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/40 shadow-sm"
                        : "bg-slate-950/60 border-slate-800/80 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <div
                      onClick={() => toggleFriendSelect(friend.id)}
                      className="flex items-center space-x-3 cursor-pointer flex-1"
                    >
                      <button type="button" className="text-amber-400 shrink-0">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 fill-amber-500/20 text-amber-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-600" />
                        )}
                      </button>

                      <div>
                        <span className="font-semibold text-sm text-slate-100 block">
                          {friend.fullName}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-amber-400/90">
                          [{friend.shortCode}]
                        </span>
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(friend.id, -1)}
                          disabled={!isSelected}
                          className="p-1 hover:bg-slate-800 text-slate-300 rounded disabled:opacity-30"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center font-bold text-xs text-amber-300 font-mono">
                          {itemState.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(friend.id, 1)}
                          className="p-1 hover:bg-slate-800 text-slate-300 rounded"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-xs font-semibold text-slate-400 w-12 text-right">
                        ₹{itemState.quantity * (itemState.unitPrice || defaultPrice)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Calculation Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex flex-wrap items-center justify-around sm:justify-start gap-4 sm:gap-6 text-xs text-slate-300 w-full sm:w-auto">
            <div>
              <span className="text-slate-500 block">Selected People</span>
              <span className="text-base font-bold text-white">{totalSelectedPersons}</span>
            </div>
            <div className="hidden sm:block h-8 w-px bg-slate-800" />
            <div>
              <span className="text-slate-500 block">Total Tiffins</span>
              <span className="text-base font-bold text-amber-400">{totalSelectedTiffins}</span>
            </div>
            <div className="hidden sm:block h-8 w-px bg-slate-800" />
            <div>
              <span className="text-slate-500 block">Grand Total</span>
              <span className="text-base font-extrabold text-emerald-400">₹{totalSelectedCost}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || totalSelectedPersons === 0}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-orange-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{editingEntryId ? "Update Entry" : `Save ${mealType} Entry (₹${totalSelectedCost})`}</span>
          </button>
        </div>
      </div>

      {/* Historical Entries Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span>Recent Meal Entries Ledger</span>
          </h2>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
            />
            <select
              value={filterMealType}
              onChange={(e) => setFilterMealType(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Meals</option>
              <option value="MORNING">Morning Only</option>
              <option value="NIGHT">Night Only</option>
            </select>
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800/50">
            <UtensilsCrossed className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No historical meal entries found for the selected filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEntries.map((entry) => {
              const isExpanded = expandedEntryId === entry.id;
              const formattedDate = new Date(entry.entryDate).toLocaleDateString("en-IN", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={entry.id}
                  className="bg-slate-900 border border-slate-800/80 rounded-xl overflow-hidden transition-all"
                >
                  <div
                    onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                          entry.mealType === "MORNING"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                        }`}
                      >
                        {entry.mealType === "MORNING" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100 text-sm">{formattedDate}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              entry.mealType === "MORNING"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            }`}
                          >
                            {entry.mealType}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {entry.totalPersons} Roommates ({entry.totalQuantity} Tiffins @ ₹{entry.defaultPrice})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-4">
                      <span className="font-extrabold text-emerald-400 text-base">
                        ₹{entry.totalAmount}
                      </span>

                      <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openEditEntry(entry)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-slate-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Roommate Breakdown */}
                  {isExpanded && (
                    <div className="bg-slate-950 p-4 border-t border-slate-800/60 space-y-3 text-xs">
                      {entry.rawNote && (
                        <p className="text-slate-400 font-mono bg-slate-900/80 p-2 rounded border border-slate-800">
                          <span className="text-amber-400/80 font-sans font-bold mr-1">Raw Note:</span>
                          {entry.rawNote}
                        </p>
                      )}

                      <h4 className="font-bold text-slate-300">Itemized Roommate Ledger:</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {entry.items.map((item) => (
                          <div
                            key={item.id || item.friendId}
                            className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between"
                          >
                            <div>
                              <span className="font-semibold text-slate-200 block">{item.friend.fullName}</span>
                              <span className="text-[10px] text-amber-400 font-mono">[{item.friend.shortCode}]</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-amber-300 block">{item.quantity} Tiffin(s)</span>
                              <span className="text-[11px] text-slate-400">₹{item.lineTotal}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
