"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Loader2,
  MapPin,
  ImageIcon,
  Check,
  Trash2,
  Database,
  Save,
  Star,
  Sparkles,
  AlertTriangle,
  X,
} from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { DietaryTag, FoodCategory, Neighborhood, ReviewItem } from "@/types";
import { FOOD_CATEGORIES } from "@/lib/foodSeeds";
import {
  clearFoodPosts,
  clearSeedVenues,
  fetchFoodPosts,
  fetchVenues,
  insertFoodPost,
  insertVenue,
  updateVenue,
} from "@/lib/supabase/data";

/* ------------------------------------------------------------------ */
/* Shared option lists                                                 */
/* ------------------------------------------------------------------ */

const NEIGHBORHOODS: { id: Neighborhood; label: string }[] = [
  { id: "grunerlokka", label: "Grünerløkka" },
  { id: "torggata", label: "Torggata" },
  { id: "toyen", label: "Tøyen" },
  { id: "gronland", label: "Grønland" },
  { id: "sentrum", label: "Sentrum" },
  { id: "frogner", label: "Frogner" },
  { id: "kampen", label: "Kampen" },
];

const DIETARY_OPTIONS: { id: DietaryTag; label: string; emoji: string }[] = [
  { id: "vegan", label: "Vegan", emoji: "🌿" },
  { id: "vegetarian", label: "Vegetarian", emoji: "🌱" },
  { id: "halal", label: "Halal", emoji: "حلال" },
  { id: "gluten_free", label: "Gluten-Free", emoji: "🌾" },
];

const VENUE_CATEGORIES = FOOD_CATEGORIES.filter((c) => c.id !== "all");

/**
 * Curated emoji picker. Selecting an icon also maps the venue to a filter
 * category so the map, cards and filter pills stay consistent.
 */
const VENUE_ICONS: { emoji: string; label: string; category: FoodCategory }[] = [
  { emoji: "☕", label: "Coffee", category: "coffee" },
  { emoji: "🥐", label: "Bakery", category: "bakery" },
  { emoji: "🍜", label: "Ramen", category: "ramen" },
  { emoji: "🍔", label: "Burger", category: "burger" },
  { emoji: "🍕", label: "Pizza", category: "pizza" },
  { emoji: "🌮", label: "Street Food", category: "street_food" },
  { emoji: "🍷", label: "Wine/Bar", category: "drinks" },
  { emoji: "🍦", label: "Sweets", category: "dessert" },
  { emoji: "🥢", label: "Asian", category: "ramen" },
  { emoji: "🥪", label: "Deli", category: "street_food" },
];

const inputCls =
  "w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#e84a27] focus:ring-1 focus:ring-[#e84a27] transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  neighborhood: string;
  location: { lat: number; lng: number };
  rating: number | null;
  user_ratings_total: number | null;
  google_rating?: number | null;
  google_reviews_count?: number;
  price_level?: "$" | "$$" | "$$$" | null;
  reviews?: ReviewItem[];
  photos: string[];
}

type SaveFeedback =
  | { kind: "success"; title: string; message: string; venueName: string }
  | { kind: "error"; title: string; message: string };

/* ------------------------------------------------------------------ */
/* Google Places importer + interactive photo picker                   */
/* ------------------------------------------------------------------ */

export function VenueImporter() {
  const addVenue = useCityPulseStore((s) => s.addVenue);
  const setVenues = useCityPulseStore((s) => s.setVenues);
  const setFoodPosts = useCityPulseStore((s) => s.setFoodPosts);
  const currentUser = useCityPulseStore((s) => s.currentUser);
  const showToast = useCityPulseStore((s) => s.showToast);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [source, setSource] = useState<"google" | "mock" | null>(null);
  const [place, setPlace] = useState<PlaceResult | null>(null);

  // Auto-populated editable details
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState<Neighborhood>("sentrum");
  const [category, setCategory] = useState<FoodCategory>("ramen");
  const [icon, setIcon] = useState<string>("🍜");
  const [dietary, setDietary] = useState<DietaryTag[]>([]);
  const [lat, setLat] = useState(59.9171);
  const [lng, setLng] = useState(10.7516);
  const [priceLevel, setPriceLevel] = useState("$$");
  const [openNow, setOpenNow] = useState(true);

  // Photo selection
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [dishPhoto, setDishPhoto] = useState<string | null>(null);

  // Dish-image search
  const [dishQuery, setDishQuery] = useState("");
  const [dishSearching, setDishSearching] = useState(false);
  const [dishResults, setDishResults] = useState<string[]>([]);

  // Optional signature dish
  const [alsoCreateDish, setAlsoCreateDish] = useState(true);
  const [dishName, setDishName] = useState("");
  const [dishPrice, setDishPrice] = useState(215);
  const [dishReview, setDishReview] = useState("");
  const [curatedReviews, setCuratedReviews] = useState<ReviewItem[]>([]);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<SaveFeedback | null>(null);

  const photoUrl = (ref: string, i: number) =>
    `/api/places/photos?ref=${encodeURIComponent(ref)}&category=${category}&i=${i}&w=600`;

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) {
      showToast("Type a venue name to search Google Places.");
      return;
    }
    setFeedback(null);
    setSearching(true);
    try {
      const res = await fetch(
        `/api/places/search?q=${encodeURIComponent(q)}&category=${category}`
      );
      const data = await res.json();
      if (!res.ok || !data.place) {
        showToast(data.error || "No Google Places match found.");
        return;
      }
      const p = data.place as PlaceResult;
      setSource(data.source);
      setPlace(p);
      setName(p.name);
      setAddress(p.formatted_address);
      setNeighborhood((p.neighborhood as Neighborhood) || "sentrum");
      setLat(p.location.lat);
      setLng(p.location.lng);
      setCoverPhoto(null);
      setDishPhoto(null);
      setDishResults([]);
      setDishQuery("");
      setAlsoCreateDish(true);
      setCuratedReviews([]);
      if (p.price_level) setPriceLevel(p.price_level);
      showToast(
        data.source === "google"
          ? "Fetched live Google Places data ✨"
          : "Showing curated beta results (add GOOGLE_PLACES_API_KEY for live data)"
      );
    } catch {
      showToast("Google Places search failed — please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleDishSearch = async () => {
    const q = dishQuery.trim();
    if (!q) return;
    setDishSearching(true);
    try {
      const res = await fetch(`/api/places/dish?q=${encodeURIComponent(q)}&count=6`);
      const data = await res.json();
      setDishResults(data.images ?? []);
      if (!dishName.trim()) setDishName(q);
    } catch {
      showToast("Dish image search failed.");
    } finally {
      setDishSearching(false);
    }
  };

  const resetImporter = () => {
    setQuery("");
    setPlace(null);
    setSource(null);
    setName("");
    setAddress("");
    setCoverPhoto(null);
    setDishPhoto(null);
    setDishResults([]);
    setDishQuery("");
    setDishName("");
    setDietary([]);
    setIcon("🍜");
    setDishReview("");
    setCuratedReviews([]);
  };

  /* ---------- Google review curation helpers ---------- */

  const starStr = (rating: number) => {
    const full = Math.max(0, Math.min(5, Math.round(rating)));
    return `${"★".repeat(full)}${"☆".repeat(5 - full)}`;
  };

  const isCurated = (id: string) => curatedReviews.some((r) => r.id === id);

  const toggleCurateReview = (review: ReviewItem) =>
    setCuratedReviews((prev) =>
      prev.some((r) => r.id === review.id)
        ? prev.filter((r) => r.id !== review.id)
        : [...prev, review]
    );

  const copyReviewIntoNote = (review: ReviewItem) => {
    const snippet = review.text.trim();
    if (!snippet) {
      showToast("That review has no text to copy.");
      return;
    }
    setDishReview((prev) =>
      prev.trim()
        ? `${prev.trim()}\n\n“${snippet}” — ${review.author_name}`
        : `“${snippet}” — ${review.author_name}`
    );
    showToast(`✂️ Copied ${review.author_name}'s review into the dish note.`);
  };

  const handleSave = async () => {
    setFeedback(null);
    if (!name.trim()) {
      setFeedback({
        kind: "error",
        title: "Missing venue name",
        message: "Give the venue a name before saving.",
      });
      showToast("⚠️ Save failed: venue name is required.");
      return;
    }
    setSaving(true);
    const coverImage = coverPhoto ?? (place?.photos[0] ? photoUrl(place.photos[0], 0) : null);
    const venueName = name.trim();
    const wantsDish = alsoCreateDish && Boolean(dishName.trim());

    try {
      const result = await insertVenue({
        name: venueName,
        address: address.trim() || "Oslo",
        neighborhood,
        category,
        icon,
        latitude: Number(lat) || 59.9171,
        longitude: Number(lng) || 10.7516,
        imageUrl: coverImage,
        priceLevel,
        openNow,
        googlePlaceId: place?.place_id ?? null,
        googleRating: place?.google_rating ?? place?.rating ?? null,
        googleReviewsCount: place?.google_reviews_count ?? 0,
        googleMapsUrl: place ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}` : null,
        dietaryTags: dietary,
        curatedReviews,
      });

      if (!result.success || !result.venue) {
        // Surface the exact database / permission / network error.
        const friendly =
          result.code === "no-session"
            ? "No database session — you're in the local Beta Dev Bypass. Sign in with your admin email/password to write to Supabase."
            : result.code === "permission-denied"
            ? "Database permission denied — ensure your user role in public.profiles is set to 'admin'."
            : result.error || "Unknown database error.";
        setFeedback({ kind: "error", title: "Save Failed", message: friendly });
        showToast(`⚠️ Save failed: ${friendly}`);
        return;
      }

      const savedVenue = result.venue;
      // Seed the store so the Oslo map radar updates immediately.
      addVenue(savedVenue);
      const refreshed = await fetchVenues();
      setVenues(refreshed);

      // When an existing venue is reused, still refresh its Google metrics and
      // curated reviews on the persisted row.
      if (result.reused && (curatedReviews.length > 0 || place?.google_reviews_count != null)) {
        await updateVenue(savedVenue.id, {
          googleRating: place?.google_rating ?? place?.rating ?? null,
          googleReviewsCount: place?.google_reviews_count ?? 0,
          curatedReviews,
        });
      }

      let dishNote = "";
      if (wantsDish && currentUser?.id) {
        const dishResult = await insertFoodPost({
          venueId: savedVenue.id,
          authorId: currentUser.id,
          dishName: dishName.trim(),
          dishImage: dishPhoto ?? coverImage,
          reviewText: dishReview,
          priceNok: Number(dishPrice) || 0,
          rating: 9,
          dietaryTags: dietary,
          isOfficialPick: true,
          dinerQuotes: curatedReviews,
        });
        if (dishResult.success) {
          // Reflect the new dish at the top of the live feed immediately.
          const posts = await fetchFoodPosts();
          setFoodPosts(posts);
        } else {
          dishNote = ` The venue saved, but the signature dish failed: ${dishResult.error}`;
        }
      } else if (wantsDish && !currentUser?.id) {
        dishNote = " Sign in as an admin to attach the signature dish.";
      }

      const reusedNote = result.reused ? " An existing venue was reused." : "";
      const curatedNote = curatedReviews.length
        ? ` ${curatedReviews.length} Google review${curatedReviews.length === 1 ? "" : "s"} curated.`
        : "";
      setFeedback({
        kind: "success",
        venueName: savedVenue.name,
        title: `🎉 Successfully saved ${savedVenue.name}${
          wantsDish ? " and signature dish" : ""
        } to Supabase!`,
        message: `It is live on the Oslo radar now.${dishNote}${reusedNote}${curatedNote}`,
      });
      showToast(`🎉 Saved ${savedVenue.name} to Supabase!`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error while saving.";
      setFeedback({ kind: "error", title: "Save Failed", message });
      showToast(`⚠️ Save failed: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="rounded-3xl border bg-white p-4 shadow-xs space-y-4"
      style={{ borderColor: "var(--surface-border, #E7E0D4)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#e84a27]" />
          Import from Google Places
        </h2>
        <span
          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${
            source === "google"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-100 text-amber-800 border-amber-200"
          }`}
        >
          {source === "google" ? "Live Google API" : "Curated beta mode"}
        </span>
      </div>

      {/* 1 — Search */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search any venue in Oslo (e.g. Koie Ramen, Tim Wendelboe)…"
            className={`${inputCls} pl-9`}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching}
          className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-60 text-white font-bold text-xs shadow-md shadow-[#e84a27]/25 transition-all active:scale-[0.98]"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <span aria-hidden>🔍</span>}
          <span>Search Google Places</span>
        </button>
      </div>

      {place && (
        <>
          {/* Google metrics summary */}
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50/70 px-3 py-2.5">
            <span className="flex items-center gap-1.5 text-sm font-bold text-amber-900">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {place.google_rating != null
                ? place.google_rating.toFixed(1)
                : place.rating != null
                ? place.rating.toFixed(1)
                : "—"}
            </span>
            <span className="text-xs text-amber-800">
              ({place.google_reviews_count ?? place.user_ratings_total ?? 0} Google reviews)
            </span>
            {place.price_level && (
              <span className="ml-auto text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-white text-amber-800 border border-amber-200">
                {place.price_level}
              </span>
            )}
          </div>

          {/* 2 — Auto-populated details */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-3 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-900 truncate">{place.name}</p>
                <p className="text-[11px] text-zinc-500 truncate">{place.formatted_address}</p>
              </div>
              {place.rating != null && (
                <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200/60">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {place.rating.toFixed(1)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Venue Name">
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Oslo Neighborhood">
                <select
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value as Neighborhood)}
                  className={inputCls}
                >
                  {NEIGHBORHOODS.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Address">
              <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
            </Field>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="Category">
                <select
                  value={category}
                  onChange={(e) => {
                    const next = e.target.value as FoodCategory;
                    setCategory(next);
                    setIcon(VENUE_ICONS.find((i) => i.category === next)?.emoji ?? "");
                  }}
                  className={inputCls}
                >
                  {VENUE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Latitude">
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(Number(e.target.value))}
                  className={inputCls}
                />
              </Field>
              <Field label="Longitude">
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(Number(e.target.value))}
                  className={inputCls}
                />
              </Field>
              <Field label="Price level">
                <select
                  value={priceLevel}
                  onChange={(e) => setPriceLevel(e.target.value)}
                  className={inputCls}
                >
                  <option value="$">$</option>
                  <option value="$$">$$</option>
                  <option value="$$$">$$$</option>
                </select>
              </Field>
            </div>

            {/* Curated category icon picker — rendered on the map pin & cards */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Venue Icon
              </span>
              <div className="flex flex-wrap gap-1.5">
                {VENUE_ICONS.map((opt) => {
                  const active = icon === opt.emoji;
                  return (
                    <button
                      key={`${opt.emoji}-${opt.label}`}
                      type="button"
                      onClick={() => {
                        setIcon(opt.emoji);
                        setCategory(opt.category);
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-all ${
                        active
                          ? "bg-[#e84a27] text-white border-[#e84a27] shadow-xs"
                          : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      <span aria-hidden className="text-sm leading-none">{opt.emoji}</span>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {DIETARY_OPTIONS.map((d) => {
                const active = dietary.includes(d.id);
                return (
                  <button
                    key={d.id}
                    onClick={() =>
                      setDietary((prev) =>
                        prev.includes(d.id) ? prev.filter((t) => t !== d.id) : [...prev, d.id]
                      )
                    }
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
              <label className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600">
                <input
                  type="checkbox"
                  checked={openNow}
                  onChange={(e) => setOpenNow(e.target.checked)}
                  className="accent-[#e84a27]"
                />
                Open now
              </label>
            </div>
          </div>

          {/* 3 — Interactive photo selection grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#e84a27]" />
                Select photos ({place.photos.length})
              </h3>
              <span className="text-[10px] text-zinc-400">
                Tap a photo = cover · use overlay for dish
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {place.photos.map((ref, i) => {
                const url = photoUrl(ref, i);
                const isCover = coverPhoto === url;
                const isDish = dishPhoto === url;
                return (
                  <div
                    key={`${ref}-${i}`}
                    onClick={() => setCoverPhoto(url)}
                    className={`relative group aspect-[4/3] rounded-xl overflow-hidden border bg-zinc-100 cursor-pointer transition-all ${
                      isCover
                        ? "border-[#e84a27] ring-2 ring-[#e84a27] shadow-sm"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`${place.name} photo ${i + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {(isCover || isDish) && (
                      <span
                        className={`absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white shadow-xs ${
                          isCover ? "bg-[#e84a27]" : "bg-zinc-900"
                        }`}
                      >
                        <Check className="w-2.5 h-2.5" />
                        {isCover ? "Cover" : "Dish"}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCoverPhoto(url);
                        }}
                        className="w-full px-2 py-1 rounded-lg bg-[#e84a27] hover:bg-[#d23e1d] text-white text-[10px] font-bold"
                      >
                        Select as Cover Photo
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDishPhoto(url);
                        }}
                        className="w-full px-2 py-1 rounded-lg bg-white hover:bg-zinc-100 text-zinc-800 text-[10px] font-bold"
                      >
                        Select for Dish
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dish photo search */}
          <div className="space-y-2 rounded-2xl border border-dashed border-zinc-200 p-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  value={dishQuery}
                  onChange={(e) => setDishQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleDishSearch()}
                  placeholder="Search a dish photo (e.g. Spicy Miso Ramen)…"
                  className={`${inputCls} pl-9`}
                />
              </div>
              <button
                onClick={handleDishSearch}
                disabled={dishSearching}
                className="shrink-0 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 text-white font-semibold text-xs transition-all"
              >
                {dishSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Find dish images</span>
              </button>
            </div>

            {dishResults.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {dishResults.map((url, i) => {
                  const isDish = dishPhoto === url;
                  return (
                    <button
                      key={`${url}-${i}`}
                      onClick={() => setDishPhoto(url)}
                      className={`relative group aspect-square rounded-lg overflow-hidden border transition-all ${
                        isDish ? "border-[#e84a27] ring-2 ring-[#e84a27]" : "border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="dish" loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      {isDish && (
                        <span className="absolute top-1 left-1 p-0.5 rounded-full bg-[#e84a27] text-white">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Google Customer Reviews & Soundbites */}
          {place.reviews && place.reviews.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-[#e84a27]" />
                  Google Customer Reviews &amp; Soundbites
                </h3>
                <span className="text-[10px] text-zinc-400">
                  {curatedReviews.length} curated for venue
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {place.reviews.map((review) => {
                  const curated = isCurated(review.id);
                  return (
                    <div
                      key={review.id}
                      className={`rounded-2xl border p-3 space-y-2 transition-all ${
                        curated ? "border-[#e84a27]/50 bg-orange-50/40" : "border-zinc-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-zinc-900 truncate">
                          {review.author_name}
                        </span>
                        <span className="text-[10px] text-zinc-400">· {review.relative_time}</span>
                        <span className="ml-auto text-[11px] text-amber-500 font-mono tracking-tight leading-none">
                          {starStr(review.rating)}
                        </span>
                      </div>

                      <p className="text-[11px] leading-relaxed text-zinc-600">{review.text}</p>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyReviewIntoNote(review)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-bold transition-all active:scale-[0.98]"
                        >
                          <span aria-hidden>✂️</span>
                          <span>Copy into Dish Note</span>
                        </button>
                        <label
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                            curated
                              ? "bg-[#e84a27] text-white border-[#e84a27]"
                              : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={curated}
                            onChange={() => toggleCurateReview(review)}
                            className="sr-only"
                          />
                          <span aria-hidden>{curated ? "✓" : "＋"}</span>
                          <span>Curate for Venue</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[10px] text-zinc-400">
                Curated reviews are saved to the venue&apos;s <code>curated_reviews</code> and
                attached to the dish as diner quotes.
              </p>
            </div>
          )}

          {/* Optional signature dish */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-3 space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
              <input
                type="checkbox"
                checked={alsoCreateDish}
                onChange={(e) => setAlsoCreateDish(e.target.checked)}
                className="accent-[#e84a27]"
              />
              Also create a signature dish in <code className="text-[10px] bg-zinc-100 px-1 rounded">food_posts</code>
            </label>
            {alsoCreateDish && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
                  <Field label="Dish name">
                    <input
                      value={dishName}
                      onChange={(e) => setDishName(e.target.value)}
                      placeholder="Spicy Miso Ramen"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Price (NOK)">
                    <input
                      type="number"
                      value={dishPrice}
                      onChange={(e) => setDishPrice(Number(e.target.value))}
                      className={inputCls}
                    />
                  </Field>
                </div>

                <Field label="Dish Photo (grid above or manual URL)">
                  <div className="flex items-center gap-2">
                    <input
                      value={dishPhoto ?? ""}
                      onChange={(e) => setDishPhoto(e.target.value || null)}
                      placeholder="https://… or select a photo from the grid"
                      className={inputCls}
                    />
                    {dishPhoto && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={dishPhoto}
                        alt="dish preview"
                        className="w-10 h-10 rounded-lg object-cover border border-zinc-200 shrink-0"
                      />
                    )}
                  </div>
                </Field>

                <Field label="Editorial Taste Note / Review (optional)">
                  <textarea
                    value={dishReview}
                    onChange={(e) => setDishReview(e.target.value)}
                    rows={3}
                    placeholder="Why is this dish essential? Describe the flavors, crust, broth..."
                    className={`${inputCls} resize-none`}
                  />
                </Field>
              </div>
            )}
          </div>

          {/* 4 — Prominent save feedback banner */}
          {feedback && (
            <div
              role="status"
              aria-live="polite"
              className={`p-4 rounded-xl space-y-3 border ${
                feedback.kind === "success"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : "bg-red-50 border-red-300 text-red-800"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span aria-hidden className="text-lg leading-none shrink-0">
                  {feedback.kind === "success" ? "🎉" : "⚠️"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">
                    {feedback.kind === "success" ? feedback.title : `Save Failed: ${feedback.message}`}
                  </p>
                  {feedback.kind === "success" && (
                    <p className="text-xs mt-1 leading-relaxed">{feedback.message}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setFeedback(null)}
                  className="shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {feedback.kind === "success" && (
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all active:scale-[0.98]"
                  >
                    <span aria-hidden>📍</span>
                    <span>View on Live Radar</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      resetImporter();
                      setFeedback(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold transition-all active:scale-[0.98]"
                  >
                    <span aria-hidden>＋</span>
                    <span>Add Another Spot</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-[#e84a27]/25 transition-all active:scale-[0.98]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving to Supabase...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>💾 Save to Supabase</span>
              </>
            )}
          </button>
        </>
      )}

      {!place && (
        <p className="text-[11px] leading-relaxed text-zinc-500">
          Search a venue to auto-fill its name, address, neighborhood and coordinates, then pick a
          cover + dish photo from the returned gallery. With{" "}
          <code className="text-[10px] bg-zinc-100 px-1 rounded">GOOGLE_PLACES_API_KEY</code> set the
          importer pulls live Google data; otherwise it uses curated beta photography.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Data cleanliness — controlled reset utilities                       */
/* ------------------------------------------------------------------ */

export function DataCleanupCard() {
  const showToast = useCityPulseStore((s) => s.showToast);
  const setVenues = useCityPulseStore((s) => s.setVenues);
  const [busy, setBusy] = useState<null | "venues" | "posts">(null);
  const [confirming, setConfirming] = useState(false);

  const handleClearVenues = async () => {
    setBusy("venues");
    const { deleted, error } = await clearSeedVenues();
    setBusy(null);
    setConfirming(false);
    if (error) {
      showToast(`Could not clear venues: ${error}`);
      return;
    }
    const refreshed = await fetchVenues();
    if (refreshed.length) setVenues(refreshed);
    showToast(`🧹 Removed ${deleted} non-imported venue${deleted === 1 ? "" : "s"}.`);
  };

  const handleClearPosts = async () => {
    setBusy("posts");
    const { deleted, error } = await clearFoodPosts();
    setBusy(null);
    if (error) {
      showToast(`Could not clear posts: ${error}`);
      return;
    }
    showToast(`🧹 Removed ${deleted} demo post${deleted === 1 ? "" : "s"}.`);
  };

  return (
    <div
      className="rounded-3xl border bg-white p-4 shadow-xs space-y-3"
      style={{ borderColor: "var(--surface-border, #E7E0D4)" }}
    >
      <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
        <Database className="w-4 h-4 text-[#e84a27]" />
        Data Cleanliness
      </h2>

      <div className="flex items-start gap-2 rounded-2xl bg-amber-50 border border-amber-200 px-3 py-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed text-amber-800">
          Removes placeholder rows so only your curated Google-imported spots remain. This deletes{" "}
          <strong>venues without a Google Place ID</strong> and all demo food posts. Irreversible.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setConfirming((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Dummy Seed Venues</span>
        </button>
        <button
          onClick={handleClearPosts}
          disabled={busy !== null}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 text-xs font-semibold disabled:opacity-60 transition-all"
        >
          {busy === "posts" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          <span>Clear Demo Food Posts</span>
        </button>
      </div>

      {confirming && (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-red-200 bg-red-50/60 p-3">
          <p className="text-[11px] font-semibold text-red-800">
            Delete all venues without a Google Place ID?
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setConfirming(false)}
              className="px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-600 text-[11px] font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleClearVenues}
              disabled={busy !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold disabled:opacity-60"
            >
              {busy === "venues" && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
