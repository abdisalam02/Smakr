"use client";

import React from "react";
import Image from "next/image";
import {
  ArrowLeft,
  MapPin,
  Star,
  Bookmark,
  Share2,
  Sparkles,
  Plus,
  Flame,
  CheckCircle2,
  Gauge,
  Armchair,
  Clock,
  Heart,
} from "lucide-react";
import { Neighborhood, Venue } from "@/types";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { useVenueDetail } from "@/hooks/useVenueDetail";
import { DietaryBadge } from "@/components/ui/DietaryBadge";
import { FOOD_CATEGORIES } from "@/lib/foodSeeds";

const NEIGHBORHOOD_LABELS: Record<Neighborhood, string> = {
  all: "Oslo",
  grunerlokka: "Grünerløkka",
  torggata: "Torggata",
  toyen: "Tøyen",
  gronland: "Grønland",
  sentrum: "Sentrum",
  frogner: "Frogner",
  kampen: "Kampen",
};

const VIBE_LABELS: Record<string, string> = {
  optimal: "Optimal",
  moderate: "Moderate",
  packed: "Packed",
};

interface VenueDetailPaneProps {
  venue: Venue | null;
  onBack: () => void;
}

function VibeStat({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "default" | "success";
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-2xl bg-[var(--surface-raised)] border border-[var(--surface-border)] text-center">
      <Icon className="w-3.5 h-3.5 text-zinc-400" />
      <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-400">
        {label}
      </span>
      <span
        className={`text-xs font-extrabold ${
          tone === "success" ? "text-emerald-600" : "text-[var(--foreground)]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ReactionButton({
  active,
  onClick,
  activeClass,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  activeClass: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold transition-all active:scale-95 ${
        active
          ? activeClass
          : "bg-[var(--surface-raised)] text-zinc-600 border-[var(--surface-border)] hover:bg-zinc-100"
      }`}
    >
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </button>
  );
}

export function VenueDetailPane({ venue, onBack }: VenueDetailPaneProps) {
  const openCreateDish = useCityPulseStore((state) => state.openCreateDish);
  const showToast = useCityPulseStore((state) => state.showToast);

  const {
    recommendedMeals,
    reactions,
    handleReaction,
    likedPostIds,
    toggleLikePost,
    savedPostIds,
    toggleSavePost,
    googleMapsUrl,
  } = useVenueDetail(venue);

  if (!venue) return null;

  const categoryDef = FOOD_CATEGORIES.find((c) => c.id === venue.food_category);
  const googleRating =
    typeof venue.google_rating === "number" && venue.google_rating > 0 ? venue.google_rating : null;
  const googleCount = venue.google_reviews_count ?? 0;
  const curatedReviews = venue.curated_reviews ?? [];

  const stars = (rating: number) => {
    const full = Math.max(0, Math.min(5, Math.round(rating)));
    return `${"★".repeat(full)}${"☆".repeat(5 - full)}`;
  };
  const neighborhoodLabel =
    venue.neighborhood && venue.neighborhood !== "all"
      ? NEIGHBORHOOD_LABELS[venue.neighborhood]
      : venue.city || "Oslo";

  const isBookmarked = savedPostIds.has(venue.id);
  const isOpenNow = venue.open_now !== false;
  const vibe = venue.vibe;

  const handleLogDish = () => {
    openCreateDish();
  };

  const handleShare = async () => {
    const url =
      typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: `${venue.name} · Smakr Oslo`,
      text: `Check out ${venue.name} on Smakr`,
      url,
    };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        showToast("Venue link copied to clipboard 🔗");
      }
    } catch {
      // User dismissed the share sheet — no action required.
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[var(--background)]">
      {/* ================= STICKY HEADER ================= */}
      <div className="shrink-0 bg-[var(--surface)] border-b border-[var(--surface-border)]">
        <div className="flex items-center justify-between gap-2 px-4 py-2.5">
          <button
            onClick={onBack}
            className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--surface-raised)] hover:bg-zinc-100 border border-[var(--surface-border)] text-[var(--foreground)] text-xs font-bold transition-all active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#e84a27] group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Food Feed</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-[var(--surface-raised)] hover:bg-zinc-100 border border-[var(--surface-border)] text-zinc-600 hover:text-[#e84a27] transition-colors"
              title="Share this venue"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => toggleSavePost(venue.id)}
              className={`p-2 rounded-xl border transition-colors ${
                isBookmarked
                  ? "bg-[#e84a27] border-[#e84a27] text-white"
                  : "bg-[var(--surface-raised)] hover:bg-zinc-100 border-[var(--surface-border)] text-zinc-600 hover:text-[#e84a27]"
              }`}
              title={isBookmarked ? "Saved" : "Bookmark venue"}
            >
              <Bookmark
                className={`w-3.5 h-3.5 ${isBookmarked ? "fill-current" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Category + dietary pills */}
        <div className="flex items-center gap-1.5 flex-wrap px-4 pb-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-[#e84a27]/10 text-[#e84a27] border border-[#e84a27]/20">
            {categoryDef?.emoji || venue.icon ? `${venue.icon || categoryDef?.emoji} ` : ""}
            {categoryDef?.label || venue.food_category || "Food Spot"}
          </span>

          {venue.price_level && (
            <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-full bg-[var(--surface-raised)] text-zinc-600 border border-[var(--surface-border)]">
              {venue.price_level}
            </span>
          )}

          {venue.dietary_tags?.map((tag) => (
            <DietaryBadge key={tag} tag={tag} />
          ))}
        </div>
      </div>

      {/* ================= SCROLLABLE BODY ================= */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-5 space-y-5">
        {/* Hero image */}
        <div className="relative w-full h-52 rounded-3xl overflow-hidden border border-[var(--surface-border)] bg-zinc-100">
          {venue.cover_image_url ? (
            <Image
              src={venue.cover_image_url}
              alt={venue.name}
              fill
              className="object-cover"
              sizes="600px"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              {venue.icon || categoryDef?.emoji || "🍽️"}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
            <span className="text-xs font-semibold drop-shadow-sm">
              {venue.live_food_status || "Oslo Culinary Hotspot"}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-mono font-bold border border-white/20">
              {venue.price_level || "$$"}
            </span>
          </div>
        </div>

        {/* Title + meta */}
        <div className="space-y-2">
          <h1 className="font-comico text-2xl xl:text-3xl text-[var(--foreground)] leading-tight">
            {venue.name}
          </h1>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <MapPin className="w-3.5 h-3.5 text-[#e84a27] shrink-0" />
              <span className="truncate">
                {venue.address}, {venue.city}
              </span>
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--surface-raised)] text-zinc-600 border border-[var(--surface-border)]">
              <MapPin className="w-3 h-3 text-[#e84a27]" />
              {neighborhoodLabel}
            </span>
            <span
              className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isOpenNow
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200/70"
                  : "text-red-700 bg-red-50 border-red-200/70"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isOpenNow ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
              {isOpenNow ? "Open Now" : "Closed"}
            </span>
            {googleRating != null && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="font-mono">{googleRating.toFixed(1)}</span>
                {googleCount > 0 && (
                  <span className="font-normal text-amber-700/80">({googleCount} Google)</span>
                )}
              </span>
            )}
          </div>

          {venue.description && (
            <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
              {venue.description}
            </p>
          )}
        </div>

        {/* Live vibe indicators */}
        <div className="grid grid-cols-3 gap-2">
          <VibeStat
            icon={Gauge}
            label="Speed"
            value={
              vibe?.avg_download_mbps != null
                ? `${Math.round(vibe.avg_download_mbps)} Mbps`
                : "Fast"
            }
          />
          <VibeStat
            icon={Armchair}
            label="Seating"
            value={vibe?.seat_label || "Plenty"}
          />
          <VibeStat
            icon={Clock}
            label="Best Time"
            value={
              vibe?.overall_status
                ? VIBE_LABELS[vibe.overall_status] || vibe.overall_status
                : "Optimal"
            }
            tone="success"
          />
        </div>

        {/* ================= CURATED DINER REVIEWS ================= */}
        {curatedReviews.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
                <Star className="w-4 h-4 text-[#e84a27]" />
                <span>What Diners Say</span>
              </h2>
              {googleRating != null && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="font-mono">{googleRating.toFixed(1)}</span>
                  {googleCount > 0 && <span className="font-normal">({googleCount})</span>}
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {curatedReviews.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl bg-[var(--surface)] border border-[var(--surface-border)] p-3 shadow-xs"
                >
                  <p className="text-[11px] text-zinc-600 leading-relaxed italic">
                    &ldquo;{r.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-amber-500 font-mono text-[11px]">{stars(r.rating)}</span>
                    <span className="text-[11px] font-semibold text-zinc-700">{r.author_name}</span>
                    <span className="text-[10px] text-zinc-400">· {r.relative_time}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ================= DISHES YOU CAN'T MISS ================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#e84a27]" />
              <span>Dishes You Can&apos;t Miss ({recommendedMeals.length})</span>
            </h2>
            <span className="text-[10px] font-mono text-zinc-400">
              Foodie Radar Verified
            </span>
          </div>

          <button
            onClick={handleLogDish}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] text-white font-bold text-xs shadow-md shadow-[#e84a27]/25 transition-all active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>Log a Dish Here</span>
          </button>

          <div className="space-y-3">
            {recommendedMeals.length === 0 && (
              <p className="text-xs text-zinc-400 text-center py-8">
                No dishes logged here yet — be the first foodie to add one.
              </p>
            )}

            {recommendedMeals.map((dish) => {
              const activeReaction = reactions[dish.id];
              const isSaved = savedPostIds.has(dish.id);
              const isLiked = likedPostIds.has(dish.id);

              return (
                <div
                  key={dish.id}
                  className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--surface-border)] shadow-xs flex gap-3"
                >
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-zinc-200 shrink-0 border border-[var(--surface-border)]">
                    <Image
                      src={dish.image_url}
                      alt={dish.dish_name}
                      fill
                      className="object-cover"
                      sizes="96px"
                      unoptimized
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-white text-[10px] font-mono font-bold">
                      {dish.price_nok} NOK
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xs font-extrabold text-[var(--foreground)] leading-snug">
                        {dish.dish_name}
                      </h3>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold text-[10px] shrink-0 border border-amber-200/60">
                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                        <span className="font-mono">{dish.rating}</span>
                      </div>
                    </div>

                    {dish.review_text && (
                      <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 italic leading-relaxed">
                        &ldquo;{dish.review_text}&rdquo;
                      </p>
                    )}

                    {dish.taste_tags && dish.taste_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {dish.taste_tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded bg-[var(--surface-raised)] text-zinc-600 text-[9px] font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto pt-2 flex items-center gap-1.5">
                      <ReactionButton
                        active={activeReaction === "craving"}
                        onClick={() => handleReaction(dish.id, "craving")}
                        activeClass="bg-[#e84a27] text-white border-[#e84a27]"
                        icon={Flame}
                        label="Craving"
                      />
                      <ReactionButton
                        active={activeReaction === "must_try"}
                        onClick={() => handleReaction(dish.id, "must_try")}
                        activeClass="bg-amber-500 text-white border-amber-500"
                        icon={Star}
                        label="Must Try"
                      />
                      <ReactionButton
                        active={activeReaction === "ate_here"}
                        onClick={() => handleReaction(dish.id, "ate_here")}
                        activeClass="bg-emerald-600 text-white border-emerald-600"
                        icon={CheckCircle2}
                        label="Tried"
                      />

                      <div className="ml-auto flex items-center gap-1">
                        <button
                          onClick={() => toggleLikePost(dish.id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold transition-all active:scale-95 ${
                            isLiked
                              ? "bg-[#e84a27] text-white border-[#e84a27]"
                              : "bg-[var(--surface-raised)] text-zinc-600 border-[var(--surface-border)] hover:bg-zinc-100"
                          }`}
                          title="Recommend this dish"
                        >
                          <Heart
                            className={`w-3 h-3 ${isLiked ? "fill-current" : ""}`}
                          />
                          <span className="font-mono">{dish.likes_count}</span>
                        </button>
                        <button
                          onClick={() => toggleSavePost(dish.id)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            isSaved
                              ? "bg-zinc-900 text-white border-zinc-900"
                              : "bg-[var(--surface-raised)] text-zinc-500 border-[var(--surface-border)] hover:bg-zinc-100"
                          }`}
                          title={isSaved ? "Saved to your list" : "Save dish"}
                        >
                          <Bookmark
                            className={`w-3 h-3 ${isSaved ? "fill-current" : ""}`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Directions */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--surface-border)] text-[var(--foreground)] font-semibold text-xs hover:bg-[var(--surface-raised)] transition-colors"
        >
          <MapPin className="w-3.5 h-3.5 text-[#e84a27]" />
          <span>Open in Google Maps</span>
        </a>
      </div>
    </div>
  );
}
