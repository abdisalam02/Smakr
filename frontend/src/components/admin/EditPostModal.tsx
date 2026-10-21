"use client";

import React, { useRef, useState } from "react";
import { X, Save, Loader2, ImageIcon, Pencil, Plus, Trash2, Check, Sparkles, Upload } from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { DietaryTag, FoodCategory, FoodPost, ReviewItem } from "@/types";
import { updateFoodPost, updateVenue as updateVenueRecord, uploadDishPhoto } from "@/lib/supabase/data";
import { FOOD_CATEGORIES } from "@/lib/foodSeeds";
import { VisualPhotoSwitcher } from "@/components/ui/VisualPhotoSwitcher";

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

  // Photo picker (Google listing shots + direct upload)
  const [googlePhotos, setGooglePhotos] = useState<string[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedVenue = venues.find((v) => v.id === venueId);

  const visibleGooglePhotos = showAllPhotos ? googlePhotos : googlePhotos.slice(0, 4);

  /** Pulls the venue's live Google listing photos (Place Details or text search). */
  const loadGooglePhotos = async () => {
    const v = venues.find((x) => x.id === venueId);
    if (!v) {
      showToast("Pick a venue first.");
      return;
    }
    setLoadingPhotos(true);
    try {
      const cat = v.food_category ?? "all";
      const url = v.google_place_id
        ? `/api/places/details?place_id=${encodeURIComponent(v.google_place_id)}&category=${cat}`
        : `/api/places/search?q=${encodeURIComponent(`${v.name} ${v.address}`)}&category=${cat}`;
      const res = await fetch(url);
      const data = await res.json();
      const refs: string[] = data.place?.photos ?? [];
      setGooglePhotos(refs);
      setShowAllPhotos(false);
      showToast(
        refs.length
          ? `Loaded ${refs.length} Google photo${refs.length === 1 ? "" : "s"} — tap one to use it.`
          : "No Google photos found for this spot."
      );
    } catch {
      showToast("Could not fetch Google photos — please try again.");
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true);
    const { url, error } = await uploadDishPhoto(file);
    setUploadingPhoto(false);
    if (!url) {
      showToast(error ?? "Upload failed.");
      return;
    }
    setImageUrl(url);
    showToast("Photo uploaded ✅");
  };

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

    if (error) showToast(`Saved locally — database update failed (${error}).`);
    else showToast("✅ Dish updated — feed refreshed!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar rounded-t-3xl sm:rounded-3xl border bg-white p-4 shadow-2xl space-y-4"
        style={{ borderColor: "var(--surface-border, #E7E0D4)" }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-comico text-lg font-bold text-[#181615] flex items-center gap-2">
            <Pencil className="w-4 h-4 text-[#e84a27]" />
            Edit Dish
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 cursor-pointer" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <Field label="Dish Name">
          <input value={dishName} onChange={(e) => setDishName(e.target.value)} className={inputCls} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr] gap-3">
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
          <Field label="Food Category & Type">
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

        <Field label="Price (NOK)">
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="Optional (leave empty for none)"
            className={inputCls}
          />
        </Field>

        <VisualPhotoSwitcher
          label="Dish Photo"
          currentImageUrl={imageUrl}
          venuePlaceId={selectedVenue?.google_place_id}
          venueName={selectedVenue?.name || post.spot_name}
          category={category}
          extraPhotos={googlePhotos.map((ref, i) => photoProxy(ref, i))}
          onSelectPhoto={(url) => setImageUrl(url)}
        />

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
                  showToast("✨ Taste note & price estimate ready");
                } catch {
                  showToast("Could not auto-write note right now.");
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e84a27]/10 hover:bg-[#e84a27]/20 text-[#e84a27] text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>✨ Auto-Write Note &amp; Price</span>
            </button>
          </div>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={3}
            placeholder="1–2 punchy insider lines about the dish texture, flavor, and why it's worth ordering..."
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
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                    active
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  {d.emoji} {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Diner Quotes / Soundbites */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Diner Quotes / Soundbites
            </span>
            <button
              type="button"
              onClick={fetchGoogleReviews}
              disabled={fetchingReviews}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-60 text-white text-[10px] font-bold transition-all active:scale-[0.98]"
            >
              {fetchingReviews ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              <span>{fetchingReviews ? "Fetching…" : "Fetch Google reviews"}</span>
            </button>
          </div>
          <p className="-mt-1 text-[10px] text-zinc-400">
            Pull live reviews from Google for{" "}
            <strong className="text-zinc-600">{selectedVenue?.name ?? post.spot_name}</strong> and
            attach the ones you like — or add your own below.
          </p>

          {quotes.length > 0 ? (
            <div className="space-y-2">
              {quotes.map((q) => (
                <div
                  key={q.id}
                  className="flex items-start gap-2 rounded-xl border border-zinc-200 bg-white p-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-zinc-900 truncate">
                        {q.author_name}
                      </span>
                      <span className="text-[11px] text-amber-500 font-mono">{starStr(q.rating)}</span>
                      <span className="text-[10px] text-zinc-400">· {q.relative_time}</span>
                    </div>
                    <p className="text-[11px] text-zinc-600 leading-relaxed mt-0.5">{q.text}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeQuote(q.id)}
                    className="shrink-0 p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                    title="Remove quote"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-zinc-400">No quotes attached yet. Add one below.</p>
          )}

          {/* Fetched Google reviews */}
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
                      attached ? "border-emerald-300 bg-emerald-50/50" : "border-zinc-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-zinc-900 truncate">
                        {r.author_name}
                      </span>
                      <span className="text-[11px] text-amber-500 font-mono">{starStr(r.rating)}</span>
                      <span className="text-[10px] text-zinc-400">· {r.relative_time}</span>
                    </div>
                    <p className="text-[11px] text-zinc-600 leading-relaxed mt-0.5">{r.text}</p>
                    <button
                      type="button"
                      onClick={() => toggleAttachReview(r)}
                      className={`mt-2 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-[0.98] ${
                        attached
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
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

          {/* Add a manual quote */}
          <div className="space-y-2 rounded-xl border border-dashed border-zinc-300 bg-white p-2.5">
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
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-bold transition-all active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Quote</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-600 text-xs font-semibold hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-60 text-white text-xs font-bold shadow-md shadow-[#e84a27]/25 transition-all active:scale-[0.98]"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
