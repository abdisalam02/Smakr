"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Rocket,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Search,
  Store,
  X,
  Database,
  ChevronRight,
  Layers,
} from "lucide-react";
import { SeedingCandidateCard } from "@/components/admin/SeedingCandidateCard";
import type {
  StagedCandidateSpot,
  StagedDishHighlight,
} from "@/app/api/admin/seeding-lab/route";

type Notification = { type: "success" | "error"; message: string } | null;

const STATUS_FILTERS = [
  { id: "all", label: "All", dot: "bg-zinc-400" },
  { id: "approved", label: "Approved", dot: "bg-emerald-500" },
  { id: "needs_photo", label: "Needs photo", dot: "bg-amber-500" },
  { id: "seeded", label: "Seeded", dot: "bg-violet-500" },
  { id: "rejected", label: "Rejected", dot: "bg-rose-500" },
] as const;

export default function SeedingLabPage() {
  const [candidates, setCandidates] = useState<StagedCandidateSpot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCommitting, setIsCommitting] = useState(false);
  const [activeMode, setActiveMode] = useState<"regular" | "popup">("regular");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [notification, setNotification] = useState<Notification>(null);

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

  // Auto-dismiss the toast so the page never feels stuck in an error state.
  useEffect(() => {
    if (!notification) return;
    const timer = window.setTimeout(() => setNotification(null), 6000);
    return () => window.clearTimeout(timer);
  }, [notification]);

  // Separate Regular Spots vs. Pop-Up Radar candidates
  const regularCandidates = useMemo(
    () => candidates.filter((s) => s.spot_type !== "popup" && s.spot_type !== "pop_up"),
    [candidates]
  );

  const popupCandidates = useMemo(
    () => candidates.filter((s) => s.spot_type === "popup" || s.spot_type === "pop_up"),
    [candidates]
  );

  const currentModeCandidates = activeMode === "regular" ? regularCandidates : popupCandidates;

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
      setNotification({ type: "error", message: err.message || "Could not save changes." });
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
      setNotification({ type: "error", message: err.message || "Could not save dish changes." });
    }
  };

  // Safe Seeding Commit (scoped to the active view mode)
  const handleCommitApproved = async () => {
    const approvedInMode = currentModeCandidates.filter((s) => s.verification_status === "approved");
    const modeLabel = activeMode === "regular" ? "restaurant" : "pop-up";

    if (approvedInMode.length === 0) {
      setNotification({
        type: "error",
        message: `No ${modeLabel}s are approved yet. Approve a candidate before committing.`,
      });
      return;
    }

    setIsConfirmOpen(false);
    setIsCommitting(true);
    setNotification(null);

    try {
      const res = await fetch("/api/admin/seeding-lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotIds: approvedInMode.map((s) => s.id) }),
      });
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
        message: `Seeded ${data.seededVenuesCount} venue(s) and ${data.seededDishesCount} dish(es) to production.${errSuffix}`,
      });

      // Reload updated candidates (which will now show "seeded")
      await loadCandidates();
    } catch (err: any) {
      setNotification({ type: "error", message: err.message });
    } finally {
      setIsCommitting(false);
    }
  };

  // Filtered view scoped to active mode + search query
  const filteredCandidates = useMemo(() => {
    const byStatus =
      activeFilter === "all"
        ? currentModeCandidates
        : currentModeCandidates.filter((s) => s.verification_status === activeFilter);

    const q = search.trim().toLowerCase();
    if (!q) return byStatus;

    return byStatus.filter((s) =>
      [s.name, s.neighborhood, s.food_category, s.address, ...s.dish_highlights.map((d) => d.dish_name)]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [currentModeCandidates, activeFilter, search]);

  const stats = useMemo(() => {
    const total = currentModeCandidates.length;
    const approved = currentModeCandidates.filter((s) => s.verification_status === "approved").length;
    const needsPhoto = currentModeCandidates.filter((s) => s.verification_status === "needs_photo").length;
    const seeded = currentModeCandidates.filter((s) => s.verification_status === "seeded").length;
    const rejected = currentModeCandidates.filter((s) => s.verification_status === "rejected").length;
    const pending = currentModeCandidates.filter((s) => s.verification_status === "pending").length;
    return { total, approved, needsPhoto, seeded, rejected, pending };
  }, [currentModeCandidates]);

  const modeLabel = activeMode === "regular" ? "Regular spots" : "Pop-up radar";
  const approvedInMode = currentModeCandidates.filter((s) => s.verification_status === "approved").length;

  return (
    <div className="h-full w-full overflow-y-auto no-scrollbar bg-[#F7F2E8] text-[#181615] font-sans antialiased">
      {/* Soft mask behind the floating global header so cards never scroll into it. */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 h-[92px] bg-[#F7F2E8] [mask-image:linear-gradient(to_bottom,black_62%,transparent_100%)]" />

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8 pt-[84px] sm:pt-24 pb-36 sm:pb-16">
        {/* ── HEADER ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[#EAE5DC] bg-white text-zinc-600 shadow-xs transition-colors hover:border-[#DDD6C9] hover:text-[#181615] active:scale-95"
              title="Back to Control Center"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-comico text-[22px] leading-none tracking-wide sm:text-3xl">
                  Seeding Lab
                </h1>
                <span className="hidden items-center gap-1 rounded-full border border-[#EAE5DC] bg-white px-2 py-0.5 text-[9.5px] font-black uppercase tracking-widest text-zinc-500 xs:inline-flex">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Live
                </span>
              </div>
              <p className="mt-1 truncate text-[11.5px] font-medium text-zinc-500 sm:text-xs">
                Curation queue for Oslo spots.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={loadCandidates}
              disabled={isLoading || isCommitting}
              className="grid h-10 w-10 place-items-center rounded-2xl border border-[#EAE5DC] bg-white text-zinc-600 shadow-xs transition-colors hover:border-[#DDD6C9] hover:text-[#181615] active:scale-95 disabled:opacity-50"
              title="Refresh staged seeds"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={isCommitting || approvedInMode === 0}
              className="hidden items-center gap-2 rounded-2xl bg-[#E84A27] px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-[#E84A27]/25 transition-all hover:bg-[#d03d1b] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:flex"
            >
              <Rocket className={`h-4 w-4 ${isCommitting ? "animate-bounce" : ""}`} />
              <span>{isCommitting ? "Ingesting..." : `Commit approved (${approvedInMode})`}</span>
            </button>
          </div>
        </div>

        {/* ── STAT TILES (tap to filter) ── */}
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { id: "approved", label: "Approved", value: stats.approved, icon: CheckCircle2, tone: "text-emerald-700", bg: "bg-emerald-50", ring: "border-emerald-200" },
            { id: "needs_photo", label: "Needs photo", value: stats.needsPhoto, icon: AlertTriangle, tone: "text-amber-700", bg: "bg-amber-50", ring: "border-amber-200" },
            { id: "seeded", label: "Seeded", value: stats.seeded, icon: Database, tone: "text-violet-700", bg: "bg-violet-50", ring: "border-violet-200" },
            { id: "all", label: "In queue", value: stats.total, icon: Layers, tone: "text-zinc-700", bg: "bg-white", ring: "border-[#EAE5DC]" },
          ].map((tile) => {
            const Icon = tile.icon;
            const isActive = activeFilter === tile.id;
            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => setActiveFilter(tile.id)}
                className={`flex items-center gap-3 rounded-2xl border p-3 text-left shadow-xs transition-all active:scale-[0.98] ${
                  isActive ? `${tile.bg} ${tile.ring} shadow-sm` : "border-[#EAE5DC] bg-white hover:border-[#DDD6C9]"
                }`}
              >
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tile.bg} ${tile.tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-lg font-black leading-none tabular-nums text-[#181615]">
                    {tile.value}
                  </span>
                  <span className={`mt-1 block truncate text-[10.5px] font-bold uppercase tracking-wider ${tile.tone}`}>
                    {tile.label}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* ── CONTROLS ── */}
        <div className="mt-4 rounded-3xl border border-[#EAE5DC] bg-white/70 p-2.5 shadow-xs backdrop-blur-md sm:p-3.5">
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-[#EAE6DF]/70 p-1">
            <button
              type="button"
              onClick={() => {
                setActiveMode("regular");
                setActiveFilter("all");
              }}
              className={`flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 py-2 text-[11px] font-black transition-all sm:px-3 ${
                activeMode === "regular"
                  ? "bg-white text-[#181615] shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <Store className="h-3.5 w-3.5" />
              <span>Regular</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9.5px] font-black ${
                  activeMode === "regular" ? "bg-[#181615] text-white" : "bg-black/5 text-zinc-500"
                }`}
              >
                {regularCandidates.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode("popup");
                setActiveFilter("all");
              }}
              className={`flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 py-2 text-[11px] font-black transition-all sm:px-3 ${
                activeMode === "popup"
                  ? "bg-white text-[#E84A27] shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Pop-up radar</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9.5px] font-black ${
                  activeMode === "popup" ? "bg-[#E84A27] text-white" : "bg-black/5 text-zinc-500"
                }`}
              >
                {popupCandidates.length}
              </span>
            </button>
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search spot, area or dish..."
                className="h-10 w-full rounded-2xl border border-[#EAE5DC] bg-white pl-9 pr-9 text-[12.5px] font-semibold text-[#181615] placeholder:font-medium placeholder:text-zinc-400 focus:border-[#E84A27]/50 focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {STATUS_FILTERS.map((filter) => {
              const count =
                filter.id === "all"
                  ? stats.total
                  : filter.id === "approved"
                  ? stats.approved
                  : filter.id === "needs_photo"
                  ? stats.needsPhoto
                  : filter.id === "seeded"
                  ? stats.seeded
                  : stats.rejected;
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold transition-all active:scale-95 ${
                    isActive
                      ? "border-[#181615] bg-[#181615] text-white"
                      : "border-[#EAE5DC] bg-white text-zinc-600 hover:border-[#DDD6C9]"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${filter.dot}`} />
                  {filter.label}
                  <span className={isActive ? "text-white/60" : "text-zinc-400"}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── TOAST ── */}
        {notification && (
          <div
            className={`mt-3 flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 text-xs font-semibold shadow-xs ${
              notification.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span className="min-w-0 flex-1 leading-relaxed">{notification.message}</span>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="shrink-0 rounded-full p-0.5 text-current/70 hover:bg-black/5"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* ── LIST HEADER ── */}
        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-comico text-sm tracking-wide text-[#181615]">
              {activeFilter === "all" ? "Queue" : STATUS_FILTERS.find((f) => f.id === activeFilter)?.label}
              <span className="ml-1.5 font-sans text-[11px] font-bold text-zinc-400">
                {filteredCandidates.length}
              </span>
            </h2>
            <p className="mt-0.5 text-[11px] font-medium text-zinc-500">
              {modeLabel} · {search ? `matching "${search}"` : "tap a card to open it"}
            </p>
          </div>
          <span className="hidden items-center gap-1 text-[10.5px] font-semibold text-zinc-400 sm:flex">
            {stats.pending > 0 ? `${stats.pending} awaiting review` : "All reviewed"}
            <ChevronRight className="h-3 w-3" />
          </span>
        </div>

        {/* ── CANDIDATES ── */}
        <main className="mt-3">
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-3xl border border-[#EAE5DC] bg-white p-4 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 animate-pulse rounded-2xl bg-[#181615]/[0.07]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-2/5 animate-pulse rounded-full bg-[#181615]/[0.07]" />
                      <div className="h-2.5 w-3/5 animate-pulse rounded-full bg-[#181615]/[0.05]" />
                    </div>
                    <div className="h-6 w-20 animate-pulse rounded-full bg-[#181615]/[0.06]" />
                  </div>
                </div>
              ))}
              <p className="pt-1 text-center text-[11px] font-semibold text-zinc-400">
                Loading staged Oslo candidates...
              </p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#DDD6C9] bg-white/60 px-6 py-12 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#FAF7F2] text-[#E84A27]">
                <Search className="h-5 w-5" />
              </span>
              <p className="mt-3 font-comico text-base tracking-wide text-[#181615]">Nothing here yet</p>
              <p className="mx-auto mt-1 max-w-xs text-xs font-medium leading-relaxed text-zinc-500">
                {search
                  ? `No ${modeLabel.toLowerCase()} match "${search}".`
                  : `No ${modeLabel.toLowerCase()} in this filter. Try another status.`}
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveFilter("all");
                  setSearch("");
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#DDD6C9] bg-white px-4 py-2 text-[11.5px] font-bold text-[#181615] shadow-xs transition-colors hover:border-[#E84A27]/40 hover:text-[#E84A27]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
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

      {/* ── MOBILE STICKY COMMIT BAR ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#EAE5DC] bg-[#F7F2E8]/95 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] pt-2.5 shadow-[0_-8px_24px_rgba(24,22,21,0.06)] backdrop-blur-md sm:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Ready to seed</p>
            <p className="truncate text-[12px] font-bold text-[#181615]">
              {approvedInMode} approved · {modeLabel.toLowerCase()}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            disabled={isCommitting || approvedInMode === 0}
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-[#E84A27] px-5 py-3 text-xs font-black text-white shadow-lg shadow-[#E84A27]/30 transition-all active:scale-[0.98] disabled:opacity-40"
          >
            <Rocket className={`h-4 w-4 ${isCommitting ? "animate-bounce" : ""}`} />
            {isCommitting ? "Seeding..." : `Commit (${approvedInMode})`}
          </button>
        </div>
      </div>

      {/* ── COMMIT CONFIRMATION ── */}
      {isConfirmOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setIsConfirmOpen(false)}
        >
          <div
            className="w-full rounded-t-3xl border border-[#EAE5DC] bg-[#FAF7F2] p-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#E84A27]/10 text-[#E84A27]">
                <Rocket className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="font-comico text-lg tracking-wide text-[#181615]">
                  Seed {approvedInMode} approved {approvedInMode === 1 ? "spot" : "spots"}?
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                  {approvedInMode} approved {modeLabel.toLowerCase()} will be written to Supabase. Dish photos are
                  optimised and uploaded to the CDN, then venues and food posts are created in production.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#EAE5DC] bg-white px-3.5 py-3 text-[11.5px] font-medium text-zinc-600">
              <span className="font-bold text-[#181615]">This cannot be undone</span> from the lab. You would need to
              remove the rows manually afterwards.
            </div>

            <div className="mt-4 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="flex-1 rounded-2xl border border-[#DDD6C9] bg-white px-4 py-3 text-xs font-black text-zinc-600 transition-colors hover:text-[#181615]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCommitApproved}
                disabled={isCommitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#E84A27] px-4 py-3 text-xs font-black text-white shadow-lg shadow-[#E84A27]/25 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <Rocket className="h-4 w-4" />
                {isCommitting ? "Seeding..." : "Commit now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
