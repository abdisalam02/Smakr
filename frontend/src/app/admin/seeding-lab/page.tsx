"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Rocket, RefreshCw, CheckCircle2, AlertCircle, Sparkles, Filter } from "lucide-react";
import { SeedingCandidateCard } from "@/components/admin/SeedingCandidateCard";
import type {
  StagedCandidateSpot,
  StagedDishHighlight,
  VerificationStatus,
} from "@/app/api/admin/seeding-lab/route";

export default function SeedingLabPage() {
  const [candidates, setCandidates] = useState<StagedCandidateSpot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCommitting, setIsCommitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Load staged candidates from API
  const loadCandidates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/seeding-lab");
      if (!res.ok) throw new Error("Failed to load candidates");
      const data = await res.json();
      setCandidates(data.candidates || []);
    } catch (err: any) {
      setNotification({ type: "error", message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCandidates();
  }, []);

  // Update spot metadata
  const handleUpdateSpot = async (spotId: string, updates: Partial<StagedCandidateSpot>) => {
    try {
      const res = await fetch("/api/admin/seeding-lab", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotId, updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      setCandidates((prev) =>
        prev.map((s) => (s.id === spotId ? (data.spot as StagedCandidateSpot) : s))
      );
    } catch (err: any) {
      alert(`Update error: ${err.message}`);
    }
  };

  // Update specific dish
  const handleUpdateDish = async (
    spotId: string,
    dishId: string,
    dishUpdates: Partial<StagedDishHighlight>
  ) => {
    try {
      const res = await fetch("/api/admin/seeding-lab", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotId, dishId, dishUpdates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      setCandidates((prev) =>
        prev.map((s) => (s.id === spotId ? (data.spot as StagedCandidateSpot) : s))
      );
    } catch (err: any) {
      alert(`Dish update error: ${err.message}`);
    }
  };

  // Safe Seeding Commit
  const handleCommitApproved = async () => {
    const approvedCount = candidates.filter((s) => s.verification_status === "approved").length;
    if (approvedCount === 0) {
      alert("No spots marked as 🟢 Approved. Review and approve candidate spots before committing.");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to commit ${approvedCount} approved spot(s) directly into Supabase?\n\nThis will ingest their food photos into Supabase Storage CDN and create the venues & food_posts in production.`
      )
    ) {
      return;
    }

    setIsCommitting(true);
    setNotification(null);

    try {
      const res = await fetch("/api/admin/seeding-lab", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Commit failed.");
      }

      const errSuffix =
        Array.isArray(data.errors) && data.errors.length > 0
          ? ` (Warnings: ${data.errors.join("; ")})`
          : "";

      setNotification({
        type: data.seededVenuesCount > 0 ? "success" : "error",
        message: `Successfully seeded ${data.seededVenuesCount} venue(s) and ${data.seededDishesCount} dish(es) to production!${errSuffix}`,
      });

      // Reload updated candidates (which will now show "seeded")
      await loadCandidates();
    } catch (err: any) {
      setNotification({ type: "error", message: err.message });
    } finally {
      setIsCommitting(false);
    }
  };

  // Filtered view
  const filteredCandidates = useMemo(() => {
    if (activeFilter === "all") return candidates;
    return candidates.filter((s) => s.verification_status === activeFilter);
  }, [candidates, activeFilter]);

  const stats = useMemo(() => {
    const total = candidates.length;
    const approved = candidates.filter((s) => s.verification_status === "approved").length;
    const needsPhoto = candidates.filter((s) => s.verification_status === "needs_photo").length;
    const seeded = candidates.filter((s) => s.verification_status === "seeded").length;
    const rejected = candidates.filter((s) => s.verification_status === "rejected").length;
    const pending = candidates.filter((s) => s.verification_status === "pending").length;
    return { total, approved, needsPhoto, seeded, rejected, pending };
  }, [candidates]);

  return (
    <div className="min-h-screen bg-[#F7F4EE] text-[#181615] font-sans antialiased pt-24 sm:pt-28 pb-28">
      {/* ── TOP STUDIO TITLE BAR (Offset cleanly below global fixed header) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-[#EAE5DC] shadow-[0_4px_20px_rgb(24,22,21,0.04)]">
          {/* Left: Branding & Back Navigation */}
          <div className="flex items-center gap-3.5">
            <Link
              href="/admin"
              className="p-2.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#EAE5DC] border border-[#DDD6C9] text-zinc-700 hover:text-[#181615] transition-colors"
              title="Return to Main Admin"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#E84A27] text-white text-[10px] font-black uppercase tracking-wider font-comico">
                  Curation Lab
                </span>
                <span className="text-xs font-bold text-zinc-500">
                  {stats.approved} Approved / {stats.total} Total
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#181615] tracking-tight mt-0.5">
                Seeding Verification Lab
              </h1>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadCandidates}
              disabled={isLoading || isCommitting}
              className="p-3 rounded-2xl bg-[#FAF7F2] hover:bg-[#EAE5DC] border border-[#DDD6C9] text-zinc-600 hover:text-[#181615] transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh staged seeds"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>

            <button
              type="button"
              onClick={handleCommitApproved}
              disabled={isCommitting || stats.approved === 0}
              className="px-6 py-3 rounded-2xl bg-[#E84A27] hover:bg-[#d03d1b] text-white font-black text-xs transition-all shadow-lg shadow-[#E84A27]/25 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Rocket className={`w-4 h-4 ${isCommitting ? "animate-bounce" : ""}`} />
              <span>{isCommitting ? "Ingesting to DB..." : `Commit Approved (${stats.approved}) 🚀`}</span>
            </button>
          </div>
        </div>

        {/* ── FILTER TABS ── */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeFilter === "all"
                ? "bg-[#181615] text-white shadow-xs"
                : "bg-white text-zinc-600 border border-[#EAE5DC] hover:text-black"
            }`}
          >
            All Candidates ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("approved")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeFilter === "approved"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
            }`}
          >
            <span>🟢 Approved</span>
            <span>({stats.approved})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("needs_photo")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeFilter === "needs_photo"
                ? "bg-amber-500 text-black shadow-xs font-black"
                : "bg-white text-amber-800 border border-amber-200 hover:bg-amber-50"
            }`}
          >
            <span>🟡 Needs Photo</span>
            <span>({stats.needsPhoto})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("seeded")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeFilter === "seeded"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-white text-purple-700 border border-purple-200 hover:bg-purple-50"
            }`}
          >
            <span>🟣 Seeded</span>
            <span>({stats.seeded})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("rejected")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeFilter === "rejected"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-white text-rose-700 border border-rose-200 hover:bg-rose-50"
            }`}
          >
            <span>🔴 Rejected</span>
            <span>({stats.rejected})</span>
          </button>
        </div>
      </div>

      {/* ── NOTIFICATION TOAST / BANNER ── */}
      {notification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mb-6">
          <div
            className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold border shadow-sm ${
              notification.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {notification.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-zinc-500 hover:text-black underline text-[11px]"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN CANDIDATES GALLERY ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8">
        {isLoading ? (
          <div className="p-20 text-center text-zinc-500 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#E84A27]" />
            <p className="text-sm font-bold text-[#181615]">Loading staged Oslo culinary candidates...</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="p-16 rounded-3xl bg-white border border-[#EAE5DC] text-center space-y-2 shadow-xs">
            <p className="text-base font-bold text-[#181615]">No candidates match the current filter.</p>
            <p className="text-xs text-zinc-500">
              Try switching tabs to "All Candidates" or inspect your staging file.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {filteredCandidates.map((spot) => (
              <SeedingCandidateCard
                key={spot.id}
                spot={spot}
                onUpdateSpot={handleUpdateSpot}
                onUpdateDish={handleUpdateDish}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
