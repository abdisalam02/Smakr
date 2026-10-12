"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, Check, Trash2, Sparkles, Upload, Calendar, Clock, DollarSign } from "lucide-react";
import { FoodPost, FoodCategory, SpotType, Venue } from "@/types";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { updateFoodPost, updateVenue } from "@/lib/supabase/data";
import { FOOD_CATEGORIES } from "@/lib/foodSeeds";
import { IconPickerModal } from "./IconPickerModal";
import { getPopupStatus } from "@/lib/popupUtils";

interface QuickEditCardDrawerProps {
  post: FoodPost | null;
  onClose: () => void;
}

export function QuickEditCardDrawer({ post, onClose }: QuickEditCardDrawerProps) {
  const venues = useCityPulseStore((state) => state.venues);
  const storeUpdatePost = useCityPulseStore((state) => state.updatePost);
  const storeUpdateVenue = useCityPulseStore((state) => state.updateVenue);
  const showToast = useCityPulseStore((state) => state.showToast);

  const linkedVenue = post ? venues.find((v) => v.id === post.spot_id) ?? null : null;

  // Form State
  const [dishName, setDishName] = useState("");
  const [category, setCategory] = useState<FoodCategory>("all");
  const [priceNok, setPriceNok] = useState<string>("");
  const [priceTier, setPriceTier] = useState<string>("");
  const [imageUrl, setImageUrl] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [isOfficialPick, setIsOfficialPick] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [isArchived, setIsArchived] = useState(false);

  // Venue-level fields
  const [spotType, setSpotType] = useState<SpotType>("restaurant");
  const [popupStartDate, setPopupStartDate] = useState("");
  const [popupEndDate, setPopupEndDate] = useState("");
  const [locationSchedule, setLocationSchedule] = useState("");
  const [spotIcon, setSpotIcon] = useState("");

  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync form when post changes
  useEffect(() => {
    if (!post) return;
    setDishName(post.dish_name || "");
    setCategory(post.category || "all");
    setPriceNok(post.price_nok != null ? String(post.price_nok) : "");
    setPriceTier(post.price_tier || linkedVenue?.price_level || "");
    setImageUrl(post.image_url || "");
    setReviewText(post.review_text || "");
    setRating(post.rating ? Math.round(post.rating > 5 ? post.rating / 2 : post.rating) : 5);
    setIsOfficialPick(Boolean(post.is_official_pick));
    setIsPublished(post.is_published !== false);
    setIsArchived(Boolean(post.is_archived));

    if (linkedVenue) {
      setSpotType(linkedVenue.spot_type || "restaurant");
      setPopupStartDate(linkedVenue.popup_start_date ? linkedVenue.popup_start_date.substring(0, 10) : "");
      setPopupEndDate(linkedVenue.popup_end_date ? linkedVenue.popup_end_date.substring(0, 10) : "");
      setLocationSchedule(linkedVenue.location_schedule || "");
      setSpotIcon(linkedVenue.icon || "");
    }
  }, [post, linkedVenue]);

  if (!post) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const parsedPrice = priceNok.trim() === "" ? null : Number(priceNok);

      const trimmedReview = reviewText.trim();
      const curatedReviewItem = trimmedReview
        ? {
            id: `curated-${Date.now()}`,
            author_name: "Smakr Editorial",
            author_photo: null,
            rating,
            text: trimmedReview,
            relative_time: "Recent",
          }
        : null;

      // 1. Update FoodPost in store and Supabase
      const postUpdates: Partial<FoodPost> = {
        dish_name: dishName.trim(),
        category,
        price_nok: parsedPrice != null && !Number.isNaN(parsedPrice) ? parsedPrice : null,
        price_tier: priceTier || undefined,
        image_url: imageUrl,
        review_text: trimmedReview,
        rating,
        is_official_pick: isOfficialPick,
        is_published: isPublished,
        is_archived: isArchived,
      };

      if (curatedReviewItem) {
        postUpdates.diner_quotes = [
          curatedReviewItem,
          ...(post.diner_quotes || []).filter((q) => q.text !== trimmedReview),
        ];
      }

      if (!post.id.startsWith("synthetic-")) {
        storeUpdatePost(post.id, postUpdates);
        await updateFoodPost(post.id, postUpdates);
      }

      // 2. Update Venue in store and Supabase if linked
      if (linkedVenue) {
        const existingCurated = linkedVenue.curated_reviews || [];
        const nextCurated = curatedReviewItem
          ? [curatedReviewItem, ...existingCurated.filter((q) => q.text !== trimmedReview)]
          : existingCurated;

        const venueUpdates: Partial<Venue> = {
          spot_type: spotType,
          popup_start_date: spotType === "popup" && popupStartDate ? popupStartDate : undefined,
          popup_end_date: spotType === "popup" && popupEndDate ? popupEndDate : undefined,
          location_schedule: spotType === "food_truck" && locationSchedule ? locationSchedule : undefined,
          icon: spotIcon || linkedVenue.icon,
          curated_reviews: nextCurated,
          vibe_signals: {
            ...linkedVenue.vibe_signals,
            icon: spotIcon || linkedVenue.icon,
          },
        };

        storeUpdateVenue(linkedVenue.id, venueUpdates);
        await updateVenue(linkedVenue.id, venueUpdates);
      }

      showToast("Changes saved successfully");
      onClose();
    } catch {
      showToast("Error updating spot. Local changes saved.");
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const mockTempVenue: Venue | null = linkedVenue
    ? {
        ...linkedVenue,
        spot_type: spotType,
        popup_start_date: popupStartDate,
        popup_end_date: popupEndDate,
      }
    : null;

  const currentStatus = getPopupStatus(mockTempVenue);

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Admin Quick Edit"
        className="relative w-full max-w-lg h-full bg-[#181615] text-zinc-100 border-l border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#e84a27] text-white">
                Admin Quick-Edit
              </span>
              <span className="text-xs text-zinc-400 truncate max-w-[200px]">
                {post.spot_name}
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-1">
              Curate Spot & Dish
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
          {/* Hero Image Section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 block">
              Dish Hero Photo
            </label>
            <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 group">
              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt={dishName || "Hero image"}
                  fill
                  unoptimized
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-zinc-900 text-xs font-bold shadow-md hover:bg-zinc-200 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Swap Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Or paste image URL"
              className="w-full text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-200 focus:outline-hidden focus:border-[#e84a27]"
            />
          </div>

          {/* Dish & Pricing */}
          <div className="space-y-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Dish & Pricing
            </h3>

            <div>
              <label className="text-[11px] text-zinc-400 mb-1 block">Dish Title</label>
              <input
                type="text"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                placeholder="e.g. Handmade Spicy Bao"
                className="w-full text-sm px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-medium focus:outline-hidden focus:border-[#e84a27]"
              />
            </div>

            {/* Strict Nullable Price with 1-Tap Clear */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-zinc-400">
                  Exact Price in NOK <span className="text-zinc-500">(Optional)</span>
                </label>
                {priceNok !== "" && (
                  <button
                    type="button"
                    onClick={() => setPriceNok("")}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-medium transition-colors"
                  >
                    ✕ Clear Price
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-xs text-zinc-500">NOK</span>
                  <input
                    type="number"
                    value={priceNok}
                    onChange={(e) => setPriceNok(e.target.value)}
                    placeholder="e.g. 145 (leave empty for none)"
                    className="w-full text-sm pl-12 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono focus:outline-hidden focus:border-[#e84a27]"
                  />
                </div>

                {/* Price Tier Fallback */}
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                  {(["$", "$$", "$$$"] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setPriceTier(priceTier === tier ? "" : tier)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-mono font-bold transition-all ${
                        priceTier === tier
                          ? "bg-[#e84a27] text-white shadow-xs"
                          : "text-zinc-400 hover:text-white"
                      }`}
                      title={`Fallback tier ${tier}`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                If cleared, no phantom price badge renders. Price tier ($) displays only if set.
              </p>
            </div>

            {/* Food Category Selector */}
            <div>
              <label className="text-[11px] text-zinc-400 mb-1.5 block">Category</label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto no-scrollbar">
                {FOOD_CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-all flex items-center gap-1 ${
                      category === cat.id
                        ? "bg-white text-zinc-950 font-bold border-white"
                        : "bg-white/5 text-zinc-400 border-white/10 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Spot Type & Pop-Up Residency */}
          <div className="space-y-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Spot Type & Schedule
            </h3>

            {/* Spot Type Selector */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: "restaurant" as const, label: "Restaurant", icon: "🍽️" },
                { type: "food_truck" as const, label: "Food Truck", icon: "🚚" },
                { type: "popup" as const, label: "Pop-up", icon: "🎪" },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setSpotType(item.type)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                    spotType === item.type
                      ? "bg-[#e84a27] text-white border-[#e84a27] shadow-sm"
                      : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Pop-up dates */}
            {spotType === "popup" && (
              <div className="space-y-2 pt-2 border-t border-white/10 animate-in fade-in duration-150">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={popupStartDate}
                      onChange={(e) => setPopupStartDate(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={popupEndDate}
                      onChange={(e) => setPopupEndDate(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Status Preview Badge */}
                {currentStatus.label && (
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center justify-between">
                    <span>Preview Badge:</span>
                    <span className="font-bold px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950">
                      {currentStatus.label}
                    </span>
                  </div>
                )}
                <p className="text-[10px] text-zinc-500">
                  Active pop-ups show urgency badges and pulse on the radar. Ended pop-ups remain visible for 7 days at 50% opacity, then auto-archive.
                </p>
              </div>
            )}

            {/* Food Truck schedule */}
            {spotType === "food_truck" && (
              <div className="pt-2 border-t border-white/10 space-y-1.5 animate-in fade-in duration-150">
                <label className="text-[11px] text-zinc-400 block">
                  Location & Schedule Details
                </label>
                <input
                  type="text"
                  value={locationSchedule}
                  onChange={(e) => setLocationSchedule(e.target.value)}
                  placeholder="e.g. Parked at Youngstorget Thurs–Sat 18:00–23:00"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-hidden focus:border-[#e84a27]"
                />
              </div>
            )}

            {/* Sticky Icon Picker Trigger */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-300 block">
                  Custom Spot Icon
                </span>
                <span className="text-[10px] text-zinc-500">
                  Sticks permanently to this venue
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsIconPickerOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white transition-all active:scale-95"
              >
                <span className="text-base">{spotIcon || linkedVenue?.icon || "📍"}</span>
                <span>Change Icon...</span>
              </button>
            </div>
          </div>

          {/* Editorial Review & Rating */}
          <div className="space-y-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Editorial & Rating
            </h3>

            <div>
              <label className="text-[11px] text-zinc-400 mb-1 block">Review Soundbite</label>
              <textarea
                rows={2}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Crisp pastry with velvety pistachio cream…"
                className="w-full text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-hidden focus:border-[#e84a27]"
              />

              {linkedVenue?.curated_reviews && linkedVenue.curated_reviews.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block mb-1.5">
                    Pick from Google Reviews:
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                    {linkedVenue.curated_reviews.map((rev, idx) => (
                      <button
                        key={rev.id || idx}
                        type="button"
                        onClick={() => {
                          setReviewText(rev.text);
                          setRating(Math.round(rev.rating));
                        }}
                        className="w-full text-left p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors cursor-pointer group"
                      >
                        <p className="text-[11px] text-zinc-300 italic line-clamp-2 group-hover:text-white">
                          &ldquo;{rev.text}&rdquo;
                        </p>
                        <span className="text-[9px] text-zinc-400 mt-0.5 block">
                          ★ {rev.rating} · {rev.author_name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 mb-1 block">Star Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-xl transition-transform active:scale-125 ${
                      star <= rating ? "text-amber-400" : "text-zinc-600"
                    }`}
                  >
                    ★
                  </button>
                ))}
                <span className="text-xs font-mono font-bold text-zinc-300 ml-2">
                  {rating.toFixed(1)} / 5.0
                </span>
              </div>
            </div>
          </div>

          {/* Status Controls */}
          <div className="space-y-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Publishing & Status Controls
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-white block">
                  Official Mascot Pick
                </span>
                <span className="text-[10px] text-zinc-500">
                  Feature with Niwache badge in feed
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOfficialPick(!isOfficialPick)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  isOfficialPick ? "bg-[#e84a27]" : "bg-white/20"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    isOfficialPick ? "right-1" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <div>
                <span className="text-xs font-medium text-white block">
                  Published in Feed
                </span>
                <span className="text-[10px] text-zinc-500">
                  Muted dishes are hidden from public
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPublished(!isPublished)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  isPublished ? "bg-emerald-600" : "bg-white/20"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    isPublished ? "right-1" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <div>
                <span className="text-xs font-medium text-white block">
                  Archive Dish
                </span>
                <span className="text-[10px] text-zinc-500">
                  Soft-archive from active queries
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsArchived(!isArchived)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                  isArchived
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                    : "bg-white/5 text-zinc-400 border-white/10 hover:text-rose-400"
                }`}
              >
                {isArchived ? "Archived" : "Archive"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#e84a27] hover:bg-[#d43f1e] text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? "Saving…" : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* Searchable Icon Picker Modal */}
      {isIconPickerOpen && (
        <IconPickerModal
          currentIcon={spotIcon || linkedVenue?.icon}
          onSelect={(icon) => {
            setSpotIcon(icon);
            setIsIconPickerOpen(false);
          }}
          onClose={() => setIsIconPickerOpen(false)}
        />
      )}
    </div>
  );
}
