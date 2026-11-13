"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X, Save, Loader2, ImageIcon, Pencil, Plus, Trash2, Check, Sparkles, Tag, MapPin, MessageSquareQuote } from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { DietaryTag, FoodCategory, FoodPost, ReviewItem } from "@/types";
import { updateFoodPost, updateVenue as updateVenueRecord } from "@/lib/supabase/data";
import { triggerAdminRevalidate } from "@/lib/adminUpload";
import { FOOD_CATEGORIES } from "@/lib/foodSeeds";
import { VisualPhotoSwitcher } from "@/components/ui/VisualPhotoSwitcher";
import { SmakrFoodIcon } from "@/components/food/FoodIcons";

/** Google Places photo resource → size-capped proxied URL. */
const photoProxy = (ref: string, i = 0) =>
  `/api/places/photos?ref=${encodeURIComponent(ref)}&i=${i}&w=600`;

const DIETARY_OPTIONS: { id: DietaryTag; label: string; emoji: string }[] = [
  { id: "vegan", label: "Vegan", emoji: "🌿" },
  { id: "vegetarian", label: "Vegetarian", emoji: "🌱" },
  { id: "halal", label: "Halal", emoji: "حلال" },
  { id: "gluten_free", label: "Gluten-Free", emoji: "🌾" },
];

const inputCls =
  "w-full px-3 py-2 text-xs rounded-xl bg-white border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#e84a27] focus:ring-1 focus:ring-[#e84a27] transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

interface EditPostModalProps {
  post: FoodPost;
  onClose: () => void;
}

/**
 * Editorial edit drawer for a single dish in the moderation queue. Persists to
 * `public.food_posts` and optimistically updates the Zustand feed.
 */
export function EditPostModal({ post, onClose }: EditPostModalProps) {
  const venues = useCityPulseStore((s) => s.venues);
  const updatePost = useCityPulseStore((s) => s.updatePost);
  const updateVenueLocal = useCityPulseStore((s) => s.updateVenue);
  const showToast = useCityPulseStore((s) => s.showToast);

  const [dishName, setDishName] = useState(post.dish_name);
  const [venueId, setVenueId] = useState(post.spot_id);
  const [category, setCategory] = useState<FoodCategory>(post.category ?? "all");
  const [price, setPrice] = useState<number | string>(post.price_nok != null ? post.price_nok : "");
  const [imageUrl, setImageUrl] = useState(post.image_url);
  const [review, setReview] = useState(post.review_text);
  const [dietary, setDietary] = useState<DietaryTag[]>(post.dietary_tags ?? []);
  const [quotes, setQuotes] = useState<ReviewItem[]>(post.diner_quotes ?? []);
  const [quoteAuthor, setQuoteAuthor] = useState("");
  const [quoteRating, setQuoteRating] = useState(5);
  const [quoteText, setQuoteText] = useState("");
  const [googleReviews, setGoogleReviews] = useState<ReviewItem[]>([]);
  const [fetchedMeta, setFetchedMeta] = useState<{ rating: number | null; count: number } | null>(
    null
  );
  const [fetchingReviews, setFetchingReviews] = useState(false);
  const [saving, setSaving] = useState(false);

  // Interactive preview focus panel + Google photo refs
  const [googlePhotos, setGooglePhotos] = useState<string[]>([]);
  const [activePanel, setActivePanel] = useState<"photo" | "note" | "venue" | "quotes" | null>("photo");
  const [inlineField, setInlineField] = useState<"name" | "price" | null>(null);

  const selectedVenue = venues.find((v) => v.id === venueId);

  const toggleDietary = (tag: DietaryTag) =>
    setDietary((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  const starStr = (rating: number) => {
    const full = Math.max(0, Math.min(5, Math.round(rating)));
    return `${"★".repeat(full)}${"☆".repeat(5 - full)}`;
  };

  const addQuote = () => {
    const text = quoteText.trim();
    if (!text) {
      showToast("Write the quote text before adding.");
      return;
    }
    const quote: ReviewItem = {
      id: `manual-${Date.now().toString(36)}`,
      author_name: quoteAuthor.trim() || "Anonymous Diner",
      author_photo: null,
      rating: Math.max(1, Math.min(5, Number(quoteRating) || 5)),
      text,
      relative_time: "Curated",
    };
    setQuotes((prev) => [...prev, quote]);
    setQuoteAuthor("");
    setQuoteRating(5);
    setQuoteText("");
  };

  const removeQuote = (id: string) => setQuotes((prev) => prev.filter((q) => q.id !== id));

  const isAttached = (id: string) => quotes.some((q) => q.id === id);

  const toggleAttachReview = (review: ReviewItem) =>
    setQuotes((prev) =>
      prev.some((q) => q.id === review.id)
        ? prev.filter((q) => q.id !== review.id)
        : [...prev, review]
    );

  // Pull the venue's live Google reviews (Place Details when we have a place id,
  // otherwise a text search by name) plus any reviews already curated on it.
  const fetchGoogleReviews = async () => {
    const v = venues.find((x) => x.id === venueId);
    if (!v) {
      showToast("Pick a venue first.");
      return;
    }
    setFetchingReviews(true);
    try {
      const cat = v.food_category ?? "all";
      const url = v.google_place_id
        ? `/api/places/details?place_id=${encodeURIComponent(v.google_place_id)}&category=${cat}`
        : `/api/places/search?q=${encodeURIComponent(`${v.name} ${v.address}`)}&category=${cat}`;
      const res = await fetch(url);
      const data = await res.json();
      const fetched: ReviewItem[] = data.place?.reviews ?? [];
      setFetchedMeta({
        rating:
          typeof data.place?.google_rating === "number" ? data.place.google_rating : null,
        count:
          typeof data.place?.google_reviews_count === "number"
            ? data.place.google_reviews_count
            : 0,
      });

      const merged: ReviewItem[] = [];
      const seen = new Set<string>();
      for (const r of [...(v.curated_reviews ?? []), ...fetched]) {
        if (!r || !r.id || seen.has(r.id)) continue;
        seen.add(r.id);
        merged.push(r);
      }
      setGoogleReviews(merged);
      showToast(
        merged.length
          ? `Fetched ${merged.length} Google review${merged.length === 1 ? "" : "s"} for ${v.name}.`
          : `No Google reviews found for ${v.name}.`
      );
    } catch {
      showToast("Could not fetch Google reviews — please try again.");
    } finally {
      setFetchingReviews(false);
    }
  };

  const handleSave = async () => {
    const name = dishName.trim() || post.dish_name;
    const venue = venues.find((v) => v.id === venueId);

    const cleanDietary = dietary.filter((t) => !t.startsWith("cat_"));
    const updatedDietary = [...cleanDietary, `cat_${category}`];

    const parsedPrice = price === "" || price == null ? null : Number(price);

    const updates: Partial<FoodPost> = {
      dish_name: name,
      spot_id: venueId,
      price_nok: parsedPrice,
      image_url: imageUrl.trim(),
      review_text: review.trim(),
      dietary_tags: cleanDietary,
      diner_quotes: quotes,
      category: category,
    };
    if (venue) {
      updates.spot_name = venue.name;
      updates.spot_address = venue.address;
      updates.spot_coords = [venue.longitude, venue.latitude];
    }

    // Optimistic UI first, then persist.
    updatePost(post.id, updates);
    setSaving(true);
    const { error } = await updateFoodPost(post.id, {
      dishName: name,
      venueId,
      category,
      dishImage: imageUrl.trim() || null,
      reviewText: review.trim() || null,
      priceNok: parsedPrice,
      dietaryTags: updatedDietary,
      dinerQuotes: quotes,
    });

    // Persist the freshly-fetched Google metrics onto the venue so its card
    // shows the same rating + review count.
    if (venue && fetchedMeta) {
      const googleRating = fetchedMeta.rating ?? venue.google_rating ?? null;
      const googleReviewsCount = fetchedMeta.count ?? venue.google_reviews_count ?? 0;
      void updateVenueRecord(venue.id, { googleRating, googleReviewsCount });
      updateVenueLocal(venue.id, {
        google_rating: googleRating,
        google_reviews_count: googleReviewsCount,
      });
    }

    setSaving(false);

    if (error) {
      showToast(`Saved locally — database update failed (${error}).`);
    } else {
      await triggerAdminRevalidate();
      showToast("Dish updated — feed refreshed!");
    }
    onClose();
  };

  const categoryObj = FOOD_CATEGORIES.find((c) => c.id === category);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[#181615]/55 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-xl max-h-[92dvh] overflow-hidden rounded-t-3xl sm:rounded-3xl border border-[#181615]/10 bg-[#FAF7F2] shadow-2xl flex flex-col"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 bg-white border-b border-[#EAE5DC] shrink-0">
          <div>
            <h3 className="font-comico text-base sm:text-lg font-bold text-[#181615] flex items-center gap-2">
              <Pencil className="w-4 h-4 text-[#e84a27]" />
              <span>Edit Dish Card</span>
            </h3>
            <p className="text-[11px] text-zinc-500">
              Click any part of the live preview card to edit it.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 cursor-pointer transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto no-scrollbar space-y-4 flex-1">
          {/* Interactive Live FoodPostCard Preview */}
          <div
            onClick={() => setActivePanel("photo")}
            className="group relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-[#EAE5DC] border border-[#DDD6C9] shadow-md cursor-pointer"
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={dishName || "Dish preview"}
                fill
                unoptimized
                className="object-cover transition-transform duration-300 group-hover:scale-[1.015]"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-1.5">
                <ImageIcon className="w-8 h-8 opacity-40" />
                <span className="text-xs font-semibold">Tap to add photo</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/25 pointer-events-none" />

            {/* Top-Left Category & Venue Pill */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActivePanel("venue");
              }}
              className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 hover:bg-white text-[#181615] text-[11px] font-bold shadow-sm cursor-pointer transition-transform active:scale-95"
            >
              <SmakrFoodIcon name={category} className="w-4 h-4" />
              <span className="truncate max-w-[140px]">
                {selectedVenue?.name || post.spot_name}
              </span>
              <span className="text-zinc-400">· {categoryObj?.label || category}</span>
            </button>

            {/* Top-Right Price Pill (Inline Edit) */}
            <div className="absolute top-3 right-3 z-20" onClick={(e) => e.stopPropagation()}>
              {inlineField === "price" ? (
                <div className="flex items-center gap-1 bg-white rounded-full px-2.5 py-1 shadow-lg border border-[#e84a27]">
                  <input
                    type="number"
                    autoFocus
                    value={price}
                    onChange={(e) =>
                      setPrice(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setInlineField(null);
                    }}
                    placeholder="195"
                    className="w-14 text-xs font-black text-[#181615] bg-transparent focus:outline-none"
                  />
                  <span className="text-[10px] font-bold text-zinc-400">NOK</span>
                  <button
                    type="button"
                    onClick={() => setInlineField(null)}
                    className="p-0.5 rounded-full bg-[#e84a27] text-white cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setInlineField("price")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#e84a27] hover:bg-[#d23e1d] text-white text-xs font-black shadow-md cursor-pointer"
                >
                  <span>{price !== "" && price != null ? `${price} NOK` : "+ Price"}</span>
                  <Pencil className="w-2.5 h-2.5 opacity-80" />
                </button>
              )}
            </div>

            {/* Bottom Title + Taste Note Preview */}
            <div
              className="absolute bottom-3 left-3.5 right-3.5 z-10 space-y-1"
              onClick={(e) => e.stopPropagation()}
            >
              {inlineField === "name" ? (
                <div className="flex items-center gap-1.5 bg-white/95 rounded-xl px-2.5 py-1.5 shadow-lg border border-[#e84a27]">
                  <input
                    type="text"
                    autoFocus
                    value={dishName}
                    onChange={(e) => setDishName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setInlineField(null);
                    }}
                    className="w-full text-sm font-bold text-[#181615] bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setInlineField(null)}
                    className="px-2 py-0.5 rounded-lg bg-[#e84a27] text-white text-[11px] font-bold cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setInlineField("name")}
                  className="inline-flex items-center gap-1.5 text-left max-w-full cursor-pointer group/name"
                >
                  <h4 className="font-comico font-black text-xl text-white drop-shadow-md truncate group-hover/name:underline decoration-[#e84a27] underline-offset-4">
                    {dishName || "Tap to name dish"}
                  </h4>
                  <Pencil className="w-3.5 h-3.5 text-white/80 shrink-0" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setActivePanel("note")}
                className="block w-full text-left text-xs text-white/90 line-clamp-2 hover:text-white cursor-pointer"
              >
                {review.trim() || "Tap to add Smakr tasting note..."}
              </button>
            </div>
          </div>

          {/* Segmented Section Tabs (Focused Editing — No Stacked Wall) */}
          <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-[#EFEAE1] border border-[#181615]/5">
            {(
              [
                { id: "photo", label: "Photo", icon: ImageIcon },
                { id: "note", label: "Note & Tags", icon: Tag },
                { id: "venue", label: "Venue", icon: MapPin },
                { id: "quotes", label: `Quotes (${quotes.length})`, icon: MessageSquareQuote },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = activePanel === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePanel(tab.id)}
                  className={`py-2 px-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    active
                      ? "bg-[#181615] text-white shadow-xs"
                      : "text-zinc-600 hover:text-[#181615]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Panel 1: Photo Switcher */}
          {activePanel === "photo" && (
            <div className="p-3.5 rounded-2xl bg-white border border-[#EAE5DC]">
              <VisualPhotoSwitcher
                label="Dish Photo"
                currentImageUrl={imageUrl}
                venuePlaceId={selectedVenue?.google_place_id}
                venueName={selectedVenue?.name || post.spot_name}
                category={category}
                extraPhotos={googlePhotos.map((ref, i) => photoProxy(ref, i))}
                onSelectPhoto={(url) => setImageUrl(url)}
              />
            </div>
          )}

          {/* Panel 2: Venue & Category */}
          {activePanel === "venue" && (
            <div className="p-3.5 rounded-2xl bg-white border border-[#EAE5DC] grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Venue">
                <select
                  value={venueId}
                  onChange={(e) => {
                    setVenueId(e.target.value);
                    setGoogleReviews([]);
                    setFetchedMeta(null);
                  }}
                  className={inputCls}
                >
                  {!venues.some((v) => v.id === venueId) && (
                    <option value={venueId}>{post.spot_name}</option>
                  )}
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Food Category">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FoodCategory)}
                  className={inputCls}
                >
                  {FOOD_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          {/* Panel 3: Taste Note & Dietary Tags */}
          {activePanel === "note" && (
            <div className="p-3.5 rounded-2xl bg-white border border-[#EAE5DC] space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Smakr Taste Note / Verdict
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        showToast("Writing insider taste note…");
                        const res = await fetch("/api/admin/ai-curate", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            mode: "generate-dish-note",
                            dishName,
                            venueName: selectedVenue?.name || post.spot_name,
                            category,
                            rawGoogleReviews: [
                              ...quotes.map((q) => q.text),
                              ...googleReviews.map((q) => q.text),
                              ...(selectedVenue?.curated_reviews || []).map((q) => q.text),
                            ],
                          }),
                        });
                        const data = await res.json();
                        if (data.tasteNote) setReview(data.tasteNote);
                        if (data.suggestedPriceNok && (price === "" || price == null)) {
                          setPrice(data.suggestedPriceNok);
                        }
                        showToast("Taste note & price estimate ready");
                      } catch {
                        showToast("Could not auto-write note right now.");
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#e84a27]/10 hover:bg-[#e84a27]/20 text-[#e84a27] text-[11px] font-bold transition-colors cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>AI Note &amp; NOK</span>
                  </button>
                </div>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={3}
                  placeholder="1-2 punchy insider lines about texture, flavor, and why it's worth ordering..."
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Dietary Tags
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {DIETARY_OPTIONS.map((d) => {
                    const active = dietary.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleDietary(d.id)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                          active
                            ? "bg-[#181615] text-white border-[#181615]"
                            : "bg-[#FAF7F2] text-zinc-600 border-[#EAE5DC] hover:bg-zinc-100"
                        }`}
                      >
                        {d.emoji} {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Panel 4: Diner Quotes / Soundbites */}
          {activePanel === "quotes" && (
            <div className="rounded-2xl border border-[#EAE5DC] bg-white p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Diner Quotes / Soundbites
                </span>
                <button
                  type="button"
                  onClick={fetchGoogleReviews}
                  disabled={fetchingReviews}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-60 text-white text-[10px] font-bold transition-all cursor-pointer"
                >
                  {fetchingReviews ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  <span>{fetchingReviews ? "Fetching…" : "Fetch Google reviews"}</span>
                </button>
              </div>

              {quotes.length > 0 ? (
                <div className="space-y-2">
                  {quotes.map((q) => (
                    <div
                      key={q.id}
                      className="flex items-start gap-2 rounded-xl border border-[#EAE5DC] bg-[#FAF7F2] p-2.5"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-zinc-900 truncate">
                            {q.author_name}
                          </span>
                          <span className="text-[11px] text-amber-500 font-mono">
                            {starStr(q.rating)}
                          </span>
                          <span className="text-[10px] text-zinc-400">· {q.relative_time}</span>
                        </div>
                        <p className="text-[11px] text-zinc-600 leading-relaxed mt-0.5">{q.text}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQuote(q.id)}
                        className="shrink-0 p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                        title="Remove quote"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-zinc-400">
                  No quotes attached yet. Pull from Google or add one below.
                </p>
              )}

              {googleReviews.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Live from Google — tap to attach
                  </span>
                  {googleReviews.map((r) => {
                    const attached = isAttached(r.id);
                    return (
                      <div
                        key={r.id}
                        className={`rounded-xl border p-2.5 transition-colors ${
                          attached
                            ? "border-emerald-300 bg-emerald-50/50"
                            : "border-zinc-200 bg-[#FAF7F2]"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-zinc-900 truncate">
                            {r.author_name}
                          </span>
                          <span className="text-[11px] text-amber-500 font-mono">
                            {starStr(r.rating)}
                          </span>
                          <span className="text-[10px] text-zinc-400">· {r.relative_time}</span>
                        </div>
                        <p className="text-[11px] text-zinc-600 leading-relaxed mt-0.5">{r.text}</p>
                        <button
                          type="button"
                          onClick={() => toggleAttachReview(r)}
                          className={`mt-2 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            attached
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700"
                          }`}
                        >
                          {attached ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          <span>{attached ? "Attached" : "Attach quote"}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="space-y-2 rounded-xl border border-dashed border-zinc-300 bg-[#FAF7F2] p-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr] gap-2">
                  <input
                    value={quoteAuthor}
                    onChange={(e) => setQuoteAuthor(e.target.value)}
                    placeholder="Author name (e.g. Ingrid H.)"
                    className={inputCls}
                  />
                  <select
                    value={quoteRating}
                    onChange={(e) => setQuoteRating(Number(e.target.value))}
                    className={inputCls}
                  >
                    {[5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>
                        {starStr(r)} ({r})
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={quoteText}
                  onChange={(e) => setQuoteText(e.target.value)}
                  rows={2}
                  placeholder="Paste or type a diner quote…"
                  className={`${inputCls} resize-none`}
                />
                <button
                  type="button"
                  onClick={addQuote}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#181615] hover:bg-zinc-800 text-white text-[11px] font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Quote</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-[#EAE5DC] bg-white flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#EAE5DC] text-zinc-600 text-xs font-semibold hover:bg-zinc-100 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-60 text-white text-xs font-bold shadow-md shadow-[#e84a27]/25 transition-all cursor-pointer"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
