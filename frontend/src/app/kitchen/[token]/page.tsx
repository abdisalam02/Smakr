"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Flame,
  Zap,
  XCircle,
  CheckCircle2,
  Clock,
  Radio,
  Loader2,
  ShieldCheck,
  MapPin,
  Check,
  ArrowLeft,
} from "lucide-react";
import type { KitchenLiveStatus } from "@/types";

interface KitchenRemotePageProps {
  params: Promise<{ token: string }>;
}

export default function KitchenRemotePage({ params }: KitchenRemotePageProps) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [venue, setVenue] = useState<{
    id: string;
    name: string;
    address: string;
    kitchen_status: KitchenLiveStatus;
  } | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<KitchenLiveStatus["status"]>("normal");
  const [batchNote, setBatchNote] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadStatus() {
      try {
        const res = await fetch(`/api/kitchen/status?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.success) {
          setError(data.error || "Invalid or expired kitchen remote link.");
          setLoading(false);
          return;
        }
        setVenue(data.venue);
        setSelectedStatus(data.venue.kitchen_status?.status || "normal");
        setBatchNote(data.venue.kitchen_status?.batch_note || "");
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError("Network connection issue. Please reload.");
          setLoading(false);
        }
      }
    }
    loadStatus();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleBroadcast = async () => {
    if (!venue) return;
    setIsBroadcasting(true);
    setBroadcastSuccess(false);

    try {
      const res = await fetch("/api/kitchen/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId: venue.id,
          kitchenToken: token,
          status: selectedStatus,
          batchNote: batchNote.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Broadcast failed. Please retry.");
        return;
      }

      setVenue((prev) => (prev ? { ...prev, kitchen_status: data.venue.kitchen_status } : null));
      setBroadcastSuccess(true);
      setTimeout(() => setBroadcastSuccess(false), 4500);
    } catch {
      alert("Broadcast failed due to a network error.");
    } finally {
      setIsBroadcasting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#FAF7F2] p-4 text-[#181615]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#e84a27]" />
          <span className="text-xs font-bold text-zinc-600">Connecting to Kitchen Remote…</span>
        </div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#FAF7F2] p-4 text-[#181615]">
        <div className="max-w-md w-full rounded-3xl bg-white border border-[#E7E0D4] p-6 text-center shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto">
            <XCircle className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-extrabold text-zinc-900">Access Denied</h1>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {error || "This kitchen remote link is invalid or has expired. Please request a new link."}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Open Smakr Oslo Radar</span>
          </Link>
        </div>
      </div>
    );
  }

  const currentStatus = venue.kitchen_status?.status || "normal";

  return (
    <div className="min-h-dvh bg-[#FAF7F2] text-[#181615] flex flex-col items-center justify-start p-4 sm:p-6 select-none">
      <main className="max-w-md w-full space-y-5 my-auto pb-10">
        {/* Top Header */}
        <header className="space-y-1.5 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Kitchen Remote</span>
          </div>
          <h1 className="font-comico text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            {venue.name}
          </h1>
          <p className="text-xs text-zinc-500 flex items-center justify-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#e84a27]" />
            <span>{venue.address}</span>
          </p>
        </header>

        {/* Current Active Badge Banner */}
        <section
          aria-label="Current Live Status"
          className="rounded-2xl border p-3.5 bg-white border-[#E7E0D4] shadow-xs flex items-center justify-between gap-3"
        >
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
              Live Radar Status
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-extrabold text-zinc-900 capitalize">
                {currentStatus === "fresh_batch" && "🔥 Fresh Batch Now"}
                {currentStatus === "low_stock" && "⚡ Few Left Today"}
                {currentStatus === "sold_out" && "❌ Sold Out for Today"}
                {currentStatus === "normal" && "✓ Normal / Standard"}
              </span>
            </div>
          </div>
          {venue.kitchen_status?.updated_at && (
            <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>
                {new Date(venue.kitchen_status.updated_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </span>
          )}
        </section>

        {/* 4 Tactile Status Buttons */}
        <section aria-label="Select Batch Status" className="space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">
            Tap to Set Batch Status
          </span>

          <div className="grid grid-cols-1 gap-2.5">
            {/* 1. Fresh Batch */}
            <button
              type="button"
              onClick={() => setSelectedStatus("fresh_batch")}
              className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-[0.98] ${
                selectedStatus === "fresh_batch"
                  ? "bg-orange-50/80 border-[#e84a27] ring-2 ring-[#e84a27]/30 shadow-sm"
                  : "bg-white border-[#E7E0D4] hover:border-zinc-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-orange-100 text-[#e84a27] flex items-center justify-center text-xl shrink-0">
                  🔥
                </span>
                <div>
                  <div className="font-extrabold text-sm text-zinc-900">Fresh Batch Now</div>
                  <div className="text-[11px] text-zinc-500">
                    Just out of the oven or fryer — ready warm
                  </div>
                </div>
              </div>
              {selectedStatus === "fresh_batch" && (
                <span className="w-5 h-5 rounded-full bg-[#e84a27] text-white flex items-center justify-center text-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
            </button>

            {/* 2. Few Left */}
            <button
              type="button"
              onClick={() => setSelectedStatus("low_stock")}
              className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-[0.98] ${
                selectedStatus === "low_stock"
                  ? "bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/30 shadow-sm"
                  : "bg-white border-[#E7E0D4] hover:border-zinc-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl shrink-0">
                  ⚡
                </span>
                <div>
                  <div className="font-extrabold text-sm text-zinc-900">Few Left Today</div>
                  <div className="text-[11px] text-zinc-500">
                    Running low — last portions before sold out
                  </div>
                </div>
              </div>
              {selectedStatus === "low_stock" && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
            </button>

            {/* 3. Sold Out */}
            <button
              type="button"
              onClick={() => setSelectedStatus("sold_out")}
              className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-[0.98] ${
                selectedStatus === "sold_out"
                  ? "bg-zinc-100 border-zinc-800 ring-2 ring-zinc-800/20 shadow-sm"
                  : "bg-white border-[#E7E0D4] hover:border-zinc-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-zinc-200 text-zinc-800 flex items-center justify-center text-xl shrink-0">
                  ❌
                </span>
                <div>
                  <div className="font-extrabold text-sm text-zinc-900">Sold Out for Today</div>
                  <div className="text-[11px] text-zinc-500">
                    Today&apos;s drop is gone — kitchen resets tomorrow
                  </div>
                </div>
              </div>
              {selectedStatus === "sold_out" && (
                <span className="w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center text-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
            </button>

            {/* 4. Normal / Reset */}
            <button
              type="button"
              onClick={() => setSelectedStatus("normal")}
              className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-[0.98] ${
                selectedStatus === "normal"
                  ? "bg-zinc-50 border-zinc-400 shadow-xs"
                  : "bg-white/60 border-[#E7E0D4] hover:bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-600 flex items-center justify-center text-sm shrink-0">
                  ✓
                </span>
                <span className="font-bold text-xs text-zinc-700">Normal / Reset Status</span>
              </div>
              {selectedStatus === "normal" && (
                <span className="w-4 h-4 rounded-full bg-zinc-600 text-white flex items-center justify-center text-[10px]">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              )}
            </button>
          </div>
        </section>

        {/* 1-Line Kitchen Note Input */}
        <section aria-label="Kitchen Soundbite Note" className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Kitchen Note (Optional · Max 60 chars)
            </span>
            <span className="text-[10px] font-mono text-zinc-400">{batchNote.length}/60</span>
          </div>
          <input
            type="text"
            maxLength={60}
            value={batchNote}
            onChange={(e) => setBatchNote(e.target.value)}
            placeholder="e.g. 30 cardamom buns warm from the oven at 12:30"
            className="w-full px-4 py-3 text-xs rounded-2xl bg-white border border-[#E7E0D4] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#e84a27] focus:ring-1 focus:ring-[#e84a27] transition-all shadow-xs"
          />
        </section>

        {/* Broadcast Action Button */}
        <section aria-label="Broadcast Action">
          <button
            type="button"
            onClick={handleBroadcast}
            disabled={isBroadcasting}
            className="w-full py-4 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] active:scale-[0.98] disabled:opacity-60 text-white font-extrabold text-sm shadow-lg shadow-[#e84a27]/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isBroadcasting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Broadcasting to Oslo Radar…</span>
              </>
            ) : (
              <>
                <Radio className="w-4 h-4" />
                <span>Broadcast to Live Oslo Map</span>
              </>
            )}
          </button>

          {broadcastSuccess && (
            <div className="mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs text-center font-bold flex items-center justify-center gap-1.5 animate-in fade-in duration-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Broadcast live. Oslo foodies on the radar see your update now.</span>
            </div>
          )}

          <p className="text-[10.5px] text-zinc-400 text-center mt-3 leading-relaxed">
            Batch statuses automatically reset after 14 hours. No password required for this private kitchen link.
          </p>
        </section>
      </main>
    </div>
  );
}
