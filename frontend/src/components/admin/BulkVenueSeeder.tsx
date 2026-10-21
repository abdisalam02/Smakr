"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Loader2,
  Check,
  MapPin,
  CheckCircle2,
  Eye,
  X,
  ExternalLink,
} from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { insertFoodPost, insertVenue, fetchVenues, fetchFoodPosts } from "@/lib/supabase/data";
import { FOOD_CATEGORIES } from "@/lib/foodSeeds";
import type { DietaryTag, FoodCategory } from "@/types";
import type { EnrichedStagingItem } from "@/app/api/admin/bulk-enrich/route";

const DEMO_CUSTOM_FORMAT = [
  "miso ramen --find meal",
  "dirty taco -- find meal",
  "Zamzam --- cheesesteak",
  "House of mandi --",
].join("\n");

const TORGGATA_PACK = [
  "Koie Ramen Torggata - Spicy Miso Tonkotsu Ramen (215 kr)",
  "Ochaya Oslo - Ceremonial Uji Matcha Latte (78 kr)",
  "Em Oi! Torggata - Bánh Mì Đặc Biệt (135 kr)",
  "Hitchhiker Sentrum - Street Food Tasting Plate (245 kr)",
  "Kulturhuset Youngstorget - Specialty Filter Coffee (52 kr)",
  "Funky Fresh Foods - Organic Vegan Burger (189 kr)",
  "Café Sara Torggata - Wood-Fired Sourdough Pizza (210 kr)",
  "Crow Bar Torggata - House Pork Carnitas Taco (145 kr)",
  "Breddos Tacos - Birria Quesatacos with Consomé (165 kr)",
  "Haralds Vaffel Torggata - Brown Cheese & Jam Vaffel (65 kr)",
].join("\n");

const LOKKA_PACK = [
  "Hot Temper, Grünerløkka - Nashville Hot Chicken Burger (185 kr)",
  "Supreme Roastworks - Iced Cortado (62 kr)",
  "Tim Wendelboe Grünerløkka - Aeropress Geisha (75 kr)",
  "Talormade Løkka - Pistachio Cardamom Doughnut (68 kr)",
  "Villa Paradiso Grünerløkka - Pizza Margherita D.O.P. (215 kr)",
  "Way Down South Grünerløkka - Smoked Beef Brisket Platter (275 kr)",
  "Trancher Grünerløkka - Entrecôte Roast Beef Sandwich (220 kr)",
  "Nighthawk Diner Grünerløkka - Classic Double Smash Cheeseburger (179 kr)",
  "Peloton Torggata / Løkka - Spicy Salami Sourdough Pizza (218 kr)",
  "Godt Brød Løkka - Organic Sourdough Cardamom Knot (56 kr)",
].join("\n");

const GRONLAND_TOYEN_PACK = [
  "Digg Pizza Grønland - Spicy Pepperoni Slice (79 kr)",
  "Punjab Tandoori Grønland - Butter Chicken with Garlic Naan (169 kr)",
  "Daglig Brød Tøyen - Sourdough Country Loaf & Butter (65 kr)",
  "Lille Tøyen Kolonial - Fresh Baked Croissant & Filter Coffee (85 kr)",
  "Brugata Landhandleri - Smoked Salmon Smørbrød (145 kr)",
  "Lahore Dera Grønland - Lamb Nihari with Fresh Naan (189 kr)",
  "Postkontoret Tøyen - Wood-Fired White Pizza (225 kr)",
  "Grønland Boulebar - Loaded French Fries (89 kr)",
  "Baba Bar Grønland - Lebanese Falafel & Halloumi Wrap (125 kr)",
  "Åpent Bakeri Damplassen - French Butter Brioche Bun (52 kr)",
].join("\n");

const OSLO_NEIGHBORHOODS = [
  "sentrum",
  "grunerlokka",
  "torggata",
  "toyen",
  "gronland",
  "frogner",
  "kampen",
];

const CURATED_FOOD_AND_FLAG_ICONS = [
  // Rice, chicken, meat & Middle Eastern
  { emoji: "🍚", label: "Mandi / Rice" },
  { emoji: "🍗", label: "Chicken" },
  { emoji: "🍖", label: "Lamb / Meat" },
  { emoji: "🥩", label: "Steak / Beef" },
  { emoji: "🥘", label: "Stew / Pot" },
  { emoji: "🫓", label: "Flatbread / Naan" },
  { emoji: "🍢", label: "Skewer" },
  { emoji: "🥙", label: "Kebab / Shawarma" },
  { emoji: "🍛", label: "Curry" },
  { emoji: "🍔", label: "Burger" },
  { emoji: "🍕", label: "Pizza" },
  { emoji: "🍜", label: "Ramen" },
  { emoji: "🌮", label: "Taco" },
  { emoji: "🥟", label: "Dumpling" },
  { emoji: "🍣", label: "Sushi" },
  { emoji: "☕", label: "Coffee" },
  { emoji: "🥐", label: "Bakery" },
  // National & Regional Flags
  { emoji: "🇾🇪", label: "Yemen" },
  { emoji: "🇸🇴", label: "Somalia" },
  { emoji: "🇱🇧", label: "Lebanon" },
  { emoji: "🇹🇷", label: "Turkey" },
  { emoji: "🇵🇰", label: "Pakistan" },
  { emoji: "🇮🇳", label: "India" },
  { emoji: "🇲🇦", label: "Morocco" },
  { emoji: "🇪🇹", label: "Ethiopia" },
  { emoji: "🇲🇽", label: "Mexico" },
  { emoji: "🇯🇵", label: "Japan" },
  { emoji: "🇻🇳", label: "Vietnam" },
  { emoji: "🇮🇹", label: "Italy" },
  { emoji: "🇺🇸", label: "USA" },
  { emoji: "🇳🇴", label: "Norway" },
  { emoji: "🇬🇷", label: "Greece" },
  { emoji: "🇰🇷", label: "Korea" },
  { emoji: "🇹🇭", label: "Thailand" },
];

export function BulkVenueSeeder() {
  const [rawText, setRawText] = useState("");
  const [isEnriching, setIsEnriching] = useState(false);
  const [stagingItems, setStagingItems] = useState<EnrichedStagingItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitProgress, setCommitProgress] = useState<{ current: number; total: number } | null>(
    null
  );
  const [commitResult, setCommitResult] = useState<{ success: number; failed: number } | null>(
    null
  );

  const currentUser = useCityPulseStore((s) => s.currentUser);
  const showToast = useCityPulseStore((s) => s.showToast);
  const setVenues = useCityPulseStore((s) => s.setVenues);
  const setFoodPosts = useCityPulseStore((s) => s.setFoodPosts);

  const handleEnrich = async () => {
    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      showToast("Paste at least 1 line or select a starter pack.");
      return;
    }

    setIsEnriching(true);
    setCommitResult(null);
    try {
      const res = await fetch("/api/admin/bulk-enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines }),
      });
      const data = await res.json();
      if (!res.ok || !data.items) {
        showToast(data.error || "Enrichment failed.");
        return;
      }
      setStagingItems(data.items);
      setIsModalOpen(true);
      showToast(`Enriched ${data.items.length} spots! Review in card popup ✨`);
    } catch {
      showToast("Network error while enriching spots.");
    } finally {
      setIsEnriching(false);
    }
  };

  const handleToggleInclude = (id: string) => {
    setStagingItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, included: !item.included } : item))
    );
  };

  const handleUpdateItem = (id: string, patch: Partial<EnrichedStagingItem>) => {
    setStagingItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const handleToggleDietaryTag = (id: string, tag: DietaryTag) => {
    setStagingItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const current = item.dietaryTags || [];
        const next = current.includes(tag)
          ? current.filter((t) => t !== tag)
          : [...current, tag];
        return { ...item, dietaryTags: next };
      })
    );
  };

  const handleCommitAll = async () => {
    const selected = stagingItems.filter((item) => item.included);
    if (selected.length === 0) {
      showToast("No spots selected to publish.");
      return;
    }

    setIsCommitting(true);
    setCommitProgress({ current: 0, total: selected.length });
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selected.length; i++) {
      const item = selected[i];
      setCommitProgress({ current: i + 1, total: selected.length });

      try {
        // 1. Insert or reuse venue
        const vResult = await insertVenue({
          name: item.venueName,
          address: item.formattedAddress,
          neighborhood: item.neighborhood,
          category: item.category,
          icon: item.icon,
          latitude: item.latitude,
          longitude: item.longitude,
          imageUrl: item.selectedPhoto,
          priceLevel: item.priceLevel,
          openNow: item.openNow,
          googlePlaceId: item.googlePlaceId,
          googleRating: item.googleRating,
          googleReviewsCount: item.googleReviewsCount,
          dietaryTags: item.dietaryTags,
          curatedReviews: item.reviews,
        });

        if (!vResult.success || !vResult.venue) {
          console.error(`Failed to insert venue ${item.venueName}:`, vResult.error);
          failCount++;
          continue;
        }

        const venueId = vResult.venue.id;

        // 2. Insert signature dish linked to venue
        const pResult = await insertFoodPost({
          venueId,
          authorId: currentUser?.id || vResult.venue.id,
          dishName: item.dishName,
          category: item.category,
          dishImage: item.selectedPhoto,
          reviewText: item.tasteNote,
          priceNok: item.priceNok,
          rating: item.googleRating ? Math.round(item.googleRating * 2) : 9,
          dietaryTags: item.dietaryTags,
          isOfficialPick: true,
          dinerQuotes: item.reviews,
        });

        if (pResult.success) {
          successCount++;
        } else {
          console.error(`Failed to insert post for ${item.dishName}:`, pResult.error);
          failCount++;
        }
      } catch (err) {
        console.error(`Error saving ${item.venueName}:`, err);
        failCount++;
      }
    }

    // Refresh store
    const [freshVenues, freshPosts] = await Promise.all([fetchVenues(), fetchFoodPosts()]);
    setVenues(freshVenues);
    setFoodPosts(freshPosts);

    setIsCommitting(false);
    setCommitProgress(null);
    setCommitResult({ success: successCount, failed: failCount });
    setIsModalOpen(false);
    showToast(`Published ${successCount} spots to live Oslo Radar!`);
  };

  const selectedCount = stagingItems.filter((i) => i.included).length;

  return (
    <div
      className="rounded-3xl border bg-white p-4 sm:p-5 shadow-xs space-y-5"
      style={{ borderColor: "var(--surface-border, #E7E0D4)" }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-orange-50 text-[#e84a27]">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-base font-extrabold text-zinc-900 tracking-tight">
              AI + Google Places Bulk Seeder
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Flexible format: write <code className="font-mono text-zinc-700 bg-zinc-100 px-1 py-0.5 rounded">Spot -- find meal</code>, <code className="font-mono text-zinc-700 bg-zinc-100 px-1 py-0.5 rounded">Spot --- dish</code>, or just <code className="font-mono text-zinc-700 bg-zinc-100 px-1 py-0.5 rounded">Spot --</code>. Strict Oslo radar coordinates applied.
          </p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
          Strict Oslo Focus
        </span>
      </div>

      {/* Preset Buttons */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">
          1-Tap Quick Load Presets
        </span>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => setRawText(DEMO_CUSTOM_FORMAT)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-100/70 hover:bg-orange-100 text-[#e84a27] text-xs font-bold border border-orange-200 transition-all cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
          >
            <span>🎯</span>
            <span>Custom Format Demo</span>
          </button>
          <button
            type="button"
            onClick={() => setRawText(TORGGATA_PACK)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-all cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
          >
            <span>⚡</span>
            <span>Torggata &amp; Sentrum (10 Spots)</span>
          </button>
          <button
            type="button"
            onClick={() => setRawText(LOKKA_PACK)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-all cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
          >
            <span>⚡</span>
            <span>Grünerløkka Pack (10 Spots)</span>
          </button>
          <button
            type="button"
            onClick={() => setRawText(GRONLAND_TOYEN_PACK)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-all cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
          >
            <span>⚡</span>
            <span>Grønland &amp; Tøyen (10 Spots)</span>
          </button>
        </div>
      </div>

      {/* Input Box */}
      <div className="space-y-2">
        <textarea
          rows={5}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={`miso ramen --find meal\ndirty taco -- find meal\nZamzam --- cheesesteak\nHouse of mandi --\nHot Temper, Grünerløkka - Nashville Hot Chicken Burger (185 kr)`}
          className="w-full px-3.5 py-3 text-xs font-mono rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#e84a27] focus:ring-1 focus:ring-[#e84a27] transition-all resize-y"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-zinc-400 font-mono">
            {rawText.split(/\r?\n/).filter((l) => l.trim()).length} lines detected
          </span>
          <div className="flex items-center gap-2">
            {rawText.trim() && (
              <button
                type="button"
                onClick={() => setRawText("")}
                className="px-3 py-2 rounded-xl text-xs text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={handleEnrich}
              disabled={isEnriching || !rawText.trim()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-[#e84a27]/25 transition-all active:scale-95 cursor-pointer"
            >
              {isEnriching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Curating with Oslo Google &amp; AI…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Fetch &amp; Auto-Curate All</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Status Bar */}
      {stagingItems.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-zinc-900">
              {stagingItems.length} Staged Spots Ready
            </span>
            <span className="text-[11px] text-zinc-500 font-medium">
              ({selectedCount} marked to publish)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-900 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Eye className="w-3.5 h-3.5 text-[#e84a27]" />
              <span>Open Clean App Card View</span>
            </button>

            <button
              type="button"
              onClick={handleCommitAll}
              disabled={isCommitting || selectedCount === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
            >
              {isCommitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#e84a27]" />
                  <span>Publishing…</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Publish {selectedCount} to Radar</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {commitResult && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Successfully committed {commitResult.success} spots to the live Oslo Radar!
              {commitResult.failed > 0 && ` (${commitResult.failed} failed)`}
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          CLEAN APP CARD STAGING POPUP MODAL (Exact FoodPostCard Design in Warm Porcelain)
          ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#181615]/70 backdrop-blur-sm flex flex-col justify-between items-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200">
          {/* Modal Header */}
          <div className="w-full max-w-7xl flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#181615]/10 bg-[#FAF7F2] dark:bg-[#1C1917] p-4 rounded-2xl shadow-xs shrink-0">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-orange-500/10 text-[#e84a27] border border-orange-500/20">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-black font-comico text-[#181615] dark:text-white tracking-tight flex items-center gap-2">
                  <span>Smakr Staged Cards</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-sans">
                    {selectedCount} of {stagingItems.length} Accepted
                  </span>
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                  Select cover photos, verify prices, and edit taste notes before committing to radar.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const allSelected = stagingItems.every((i) => i.included);
                  setStagingItems((prev) => prev.map((i) => ({ ...i, included: !allSelected })));
                }}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#23201D] hover:bg-zinc-100 text-zinc-700 dark:text-zinc-200 text-xs font-semibold border border-[#181615]/10 transition-all cursor-pointer"
              >
                {stagingItems.every((i) => i.included) ? "Deselect All" : "Select All"}
              </button>

              <button
                type="button"
                onClick={handleCommitAll}
                disabled={isCommitting || selectedCount === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {isCommitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing {commitProgress?.current}/{commitProgress?.total}…</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Publish {selectedCount} to Radar</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-white dark:bg-[#23201D] hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 dark:hover:text-white border border-[#181615]/10 transition-all cursor-pointer"
                title="Close popup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body: Grid of Real Smakr App Cards */}
          <div className="w-full max-w-7xl flex-1 overflow-y-auto py-4 pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {stagingItems.map((item) => (
                <div
                  key={item.id}
                  className={`group relative w-full rounded-3xl overflow-hidden border transition-all duration-200 flex flex-col justify-between ${
                    item.included
                      ? "border-[#181615]/15 bg-[#FAF7F2] dark:bg-[#1C1917] shadow-lg"
                      : "border-[#181615]/5 bg-[#FAF7F2]/60 opacity-50 grayscale-[40%]"
                  }`}
                >
                  {/* Photo Hero Container (Aspect 4/3) */}
                  <div className="relative w-full aspect-[4/3] bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.selectedPhoto}
                      alt={item.dishName}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

                    {/* Top Floating Badges */}
                    <div className="absolute top-3 inset-x-3 flex items-start justify-between gap-2 z-10 pointer-events-auto">
                      {/* Interactive Price Tag */}
                      <div className="flex items-center gap-1 bg-[#e84a27] text-white font-bold px-2.5 py-1 rounded-full text-xs shadow-md">
                        <input
                          type="number"
                          value={item.priceNok}
                          onChange={(e) =>
                            handleUpdateItem(item.id, { priceNok: Number(e.target.value) || 0 })
                          }
                          className="w-12 bg-transparent text-white font-bold text-xs text-center focus:outline-none"
                        />
                        <span>kr</span>
                      </div>

                      {/* Right: Rating + Accept/Skip Toggle */}
                      <div className="flex items-center gap-1.5">
                        {item.googleRating && (
                          <span className="bg-black/60 backdrop-blur-md text-amber-400 font-bold px-2.5 py-1 rounded-full text-xs border border-white/10 flex items-center gap-1 shadow-sm">
                            ★ {item.googleRating.toFixed(1)}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleInclude(item.id)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-1 cursor-pointer active:scale-95 ${
                            item.included
                              ? "bg-emerald-600 text-white"
                              : "bg-zinc-700 text-zinc-300 border border-white/20"
                          }`}
                        >
                          <span>{item.included ? "✓" : "✕"}</span>
                          <span>{item.included ? "Accepted" : "Skip"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Photo Selector Strip (At Bottom of Photo) */}
                    <div className="absolute bottom-2 inset-x-2 z-10 bg-black/60 backdrop-blur-md rounded-xl p-1.5 border border-white/10">
                      <div className="flex items-center justify-between text-[9px] uppercase font-bold text-zinc-300 px-1 mb-1">
                        <span>Tap photo to set cover:</span>
                        <span className="text-[#e84a27] font-mono">
                          {item.photoUrls.indexOf(item.selectedPhoto) + 1}/{Math.min(item.photoUrls.length, 6)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                        {item.photoUrls.slice(0, 6).map((photo, pIdx) => {
                          const isCurrent = item.selectedPhoto === photo;
                          return (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => handleUpdateItem(item.id, { selectedPhoto: photo })}
                              className={`relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                                isCurrent
                                  ? "border-[#e84a27] ring-2 ring-[#e84a27]/40 scale-105"
                                  : "border-white/20 opacity-60 hover:opacity-100"
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={photo}
                                alt="Venue pic"
                                className="w-full h-full object-cover"
                              />
                              {isCurrent && (
                                <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-[#e84a27] text-white flex items-center justify-center text-[8px]">
                                  <Check className="w-2 h-2 stroke-[3]" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Card Editorial Information in Warm Porcelain */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-[#FAF7F2] dark:bg-[#1C1917]">
                    {/* Dish Name */}
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                        Signature Dish
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-white dark:bg-[#23201D] flex items-center justify-center text-lg shrink-0 border border-[#181615]/10" title="Active radar puck icon">
                          {item.icon || "🍽️"}
                        </span>
                        <input
                          type="text"
                          value={item.dishName}
                          onChange={(e) => handleUpdateItem(item.id, { dishName: e.target.value })}
                          className="w-full font-bold text-sm sm:text-base text-zinc-900 dark:text-white bg-white dark:bg-[#23201D] border border-[#181615]/15 rounded-xl px-2.5 py-1.5 focus:border-[#e84a27] focus:outline-none capitalize"
                        />
                      </div>
                    </div>

                    {/* Venue & Neighborhood row */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-[#e84a27] shrink-0" />
                        <span className="font-semibold text-zinc-900 dark:text-white truncate max-w-[150px]">
                          {item.venueName}
                        </span>
                      </div>

                      <select
                        value={item.neighborhood}
                        onChange={(e) => handleUpdateItem(item.id, { neighborhood: e.target.value })}
                        className="bg-white dark:bg-[#23201D] text-zinc-800 dark:text-zinc-200 text-xs rounded-lg border border-[#181615]/15 px-2 py-1 capitalize focus:border-[#e84a27] focus:outline-none cursor-pointer"
                      >
                        {OSLO_NEIGHBORHOODS.map((n) => (
                          <option key={n} value={n} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Insider Taste Note Callout (✦ Quote) */}
                    <div className="bg-[#F5EFE4] dark:bg-[#23201D] border border-[#181615]/10 rounded-xl p-2.5">
                      <div className="flex items-start gap-1.5">
                        <span className="text-[#e84a27] font-bold text-xs mt-0.5">✦</span>
                        <textarea
                          rows={2}
                          value={item.tasteNote}
                          onChange={(e) => handleUpdateItem(item.id, { tasteNote: e.target.value })}
                          className="w-full bg-transparent text-xs text-zinc-800 dark:text-zinc-200 italic focus:outline-none resize-none leading-relaxed"
                          placeholder="Authentic insider taste note..."
                        />
                      </div>
                    </div>

                    {/* Category & Dietary Tags Selector */}
                    <div className="space-y-2.5 pt-1 border-t border-[#181615]/10">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                          Category
                        </span>
                        <select
                          value={item.category}
                          onChange={(e) => {
                            const cat = e.target.value as FoodCategory;
                            const icon =
                              FOOD_CATEGORIES.find((c) => c.id === cat)?.emoji || item.icon;
                            handleUpdateItem(item.id, { category: cat, icon });
                          }}
                          className="bg-white dark:bg-[#23201D] text-xs text-zinc-800 dark:text-zinc-200 rounded-lg border border-[#181615]/15 px-2 py-1 focus:border-[#e84a27] focus:outline-none cursor-pointer"
                        >
                          {FOOD_CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                            <option key={c.id} value={c.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                              {c.emoji} {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Icon & Flag Quick Palette */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                            Food &amp; Cultural Flag Icons
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-zinc-500">Custom:</span>
                            <input
                              type="text"
                              value={item.icon || "🍽️"}
                              onChange={(e) => handleUpdateItem(item.id, { icon: e.target.value })}
                              className="w-8 text-center text-xs bg-white dark:bg-[#23201D] text-zinc-900 dark:text-white rounded border border-[#181615]/15 py-0.5 focus:border-[#e84a27] focus:outline-none"
                              maxLength={4}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full no-scrollbar">
                          {CURATED_FOOD_AND_FLAG_ICONS.map((i) => (
                            <button
                              key={i.emoji}
                              type="button"
                              onClick={() => handleUpdateItem(item.id, { icon: i.emoji })}
                              title={i.label}
                              className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                item.icon === i.emoji
                                  ? "bg-[#e84a27] scale-110 shadow-sm ring-1 ring-white"
                                  : "bg-white dark:bg-[#23201D] hover:bg-zinc-100 border border-[#181615]/10"
                              }`}
                            >
                              {i.emoji}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Dietary Tag Toggles */}
                      <div className="flex flex-wrap gap-1.5">
                        {(["halal", "vegan", "vegetarian", "gluten_free"] as DietaryTag[]).map(
                          (tag) => {
                            const active = (item.dietaryTags || []).includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => handleToggleDietaryTag(item.id, tag)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                  active
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                    : "bg-white dark:bg-[#23201D] text-zinc-600 dark:text-zinc-400 border-[#181615]/10 hover:border-zinc-400"
                                }`}
                              >
                                {tag.replace("_", " ")}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="w-full max-w-7xl flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#181615]/10 bg-[#FAF7F2] dark:bg-[#1C1917] p-4 rounded-2xl shadow-xs shrink-0 text-xs text-zinc-600 dark:text-zinc-400">
            <span>
              💡 Each card matches the live Smakr Oslo Radar design. Toggle &ldquo;Accepted&rdquo; to include or skip.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-[#23201D] hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300 text-xs font-semibold border border-[#181615]/10 cursor-pointer"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={handleCommitAll}
                disabled={isCommitting || selectedCount === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {isCommitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing {commitProgress?.current}/{commitProgress?.total}…</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Publish {selectedCount} to Radar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
