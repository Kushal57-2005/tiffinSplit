"use client";

import { useEffect, useState } from "react";
import { 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  BarChart3, 
  Search, 
  Layers, 
  ShieldCheck, 
  FileText,
  Loader2
} from "lucide-react";

interface AuditTask {
  id: string;
  title: string;
  category: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  notes?: string | null;
  evidenceUrl?: string | null;
  completedAt?: string | null;
}

interface AuditMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  completionRate: number;
}

export default function AuditPage() {
  const [metrics, setMetrics] = useState<AuditMetrics | null>(null);
  const [tasks, setTasks] = useState<AuditTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/audit");
        if (!res.ok) throw new Error("Failed to fetch audit data");
        const data = await res.json();
        setMetrics(data.metrics);
        setTasks(data.tasks);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAudit();
  }, []);

  const categories = Array.from(new Set(tasks.map((t) => t.category)));

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());

    if (categoryFilter !== "ALL" && t.category !== categoryFilter) return false;
    return matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 p-6 rounded-2xl border border-slate-800/80 shadow-xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Project Build Audit Tracker
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              {metrics ? `${metrics.completionRate}% Completed` : "Loading..."}
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Internal engineering delivery tracker enforcing PRD milestone verification, file evidence, and quality metrics.
          </p>
        </div>

        <a
          href="/AUDIT.md"
          target="_blank"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs border border-slate-700 transition-colors"
        >
          <FileText className="w-4 h-4 text-amber-400" />
          <span>View Single Source AUDIT.md</span>
        </a>
      </div>

      {/* Progress Metric Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-1">
            <span className="text-xs font-semibold text-slate-400 block">Total Audit Scope</span>
            <span className="text-2xl font-black text-white font-mono">{metrics.totalTasks} Tasks</span>
            <span className="text-[11px] text-slate-500 block">Across 12 engineering categories</span>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-1">
            <span className="text-xs font-semibold text-slate-400 block">Completed & Verified</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">{metrics.completedTasks} Done</span>
            <span className="text-[11px] text-slate-500 block">Validated via tests & build</span>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-1">
            <span className="text-xs font-semibold text-slate-400 block">Blocked Items</span>
            <span className="text-2xl font-black text-rose-400 font-mono">{metrics.blockedTasks} Blocked</span>
            <span className="text-[11px] text-slate-500 block">0 open blockers</span>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-1">
            <span className="text-xs font-semibold text-slate-400 block">Completion Rate</span>
            <span className="text-2xl font-black text-amber-400 font-mono">{metrics.completionRate}%</span>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-1.5 border border-slate-800">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics.completionRate}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800/60">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search task title or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-400 font-medium mr-1 shrink-0">Category:</span>
          <button
            onClick={() => setCategoryFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
              categoryFilter === "ALL"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                categoryFilter === cat
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          <span className="text-sm text-slate-400">Loading audit tracker...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((t) => (
            <div
              key={t.id}
              className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md hover:border-slate-700 transition-all"
            >
              <div className="flex items-center space-x-3.5">
                <div className="text-emerald-400 shrink-0">
                  {t.status === "COMPLETED" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : t.status === "IN_PROGRESS" ? (
                    <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-100 text-sm">{t.title}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950 text-amber-300 border border-slate-800">
                      {t.category}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    Priority: <span className="font-semibold text-slate-300">{t.priority}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <span
                  className={`font-bold px-3 py-1 rounded-full border ${
                    t.status === "COMPLETED"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : t.status === "IN_PROGRESS"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  }`}
                >
                  {t.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
