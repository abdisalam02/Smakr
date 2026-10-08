"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Search,
  MapPin,
  Check,
  Loader2,
  Upload,
  ArrowRight,
  ChevronLeft,
  Sparkles,
  ImageIcon,
} from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  insertFoodPost,
  insertVenue,
  updateVenue as updateVenueDb,
  type VibeTag,
  type VenueInsertInput,
} from "@/lib/supabase/data";
import { getCulinaryImageForDish, getRealisticPrice } from "@/lib/culinaryImages";
import type { FoodCategory, FoodPost, Venue } from "@/types";
import type { PlaceResult } from "@/lib/places/google";

/* ------------------------------------------------------------------ */
/* Constants & helpers                                                  */
/* ------------------------------------------------------------------ */

const VIBES: { id: VibeTag; emoji: string; label: string }[] = [
  { id: "craving", emoji: "✦", label: "Craving" },
  { id: "must_try", emoji: "★", label: "Must Try" },
  { id: "tried", emoji: "👅", label: "Tried" },
];

const VIBE_LABEL: Record<VibeTag, string> = {
  craving: "Craving",
  must_try: "Must Try",
  tried: "Tried",
};

const STEPS: { n: 1 | 2 | 3; label: string }[] = [
  { n: 1, label: "Spot" },
  { n: 2, label: "Dish" },
  { n: 3, label: "Photo" },
];

/** Google Places photo resource → proxied, size-capped URL. */
const photoProxy = (ref: string, i = 0) =>
  `/api/places/photos?ref=${encodeURIComponent(ref)}&i=${i}&w=600`;

const capitalize = (value?: string | null) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

/**
 * Category & icon choices surfaced in the "Log a Dish" flow. `category` maps to
 * the app's FoodCategory (and, via CATEGORY_LABELS in the data layer, to the
 * `venues.category` DB string); `icon` is persisted to `venues.vibe_signals.icon`
 * so the map radar renders the exact emoji pin.
 */
const CATEGORY_ICONS: {
  key: string;
  category: FoodCategory;
  icon: string;
  label: string;
  keywords: string[];
}[] = [
  { key: "pizza", category: "pizza", icon: "🍕", label: "Pizza", keywords: ["pizza", "pizzeria", "pizz"] },
  {
    key: "coffee",
    category: "coffee",
    icon: "☕",
    label: "Coffee",
    keywords: ["coffee", "kaffe", "cafe", "café", "espresso", "latte", "brew", "roaster", "kaffebar", "barista", "kaffebrenneriet"],
  },
  {
    key: "bakery",
    category: "bakery",
    icon: "🥐",
    label: "Bakery",
    keywords: ["bakery", "bakeri", "bake", "croissant", "bun", "bread", "brød", "pastry", "konditori", "cardamom"],
  },
  { key: "ramen", category: "ramen", icon: "🍜", label: "Ramen", keywords: ["ramen", "noodle", "noodles", "tonkotsu"] },
  { key: "burger", category: "burger", icon: "🍔", label: "Burger", keywords: ["burger", "smash", "grill"] },
  {
    key: "street-food",
    category: "street_food",
    icon: "🌮",
    label: "Street Food",
    keywords: ["taco", "tacos", "street", "kebab", "falafel", "shawarma", "shaurma"],
  },
  { key: "drinks", category: "drinks", icon: "🍷", label: "Bar", keywords: ["bar", "wine", "cocktail", "pub", "beer", "brygg", "vin"] },
  {
    key: "dessert",
    category: "dessert",
    icon: "🍦",
    label: "Sweets",
    keywords: ["ice cream", "gelato", "dessert", "sweet", "kake", "cake", "donut", "waffle", "vaffel", "sjokolade", "chocolate"],
  },
  {
    key: "asian",
    category: "ramen",
    icon: "🥢",
    label: "Asian",
    keywords: ["asian", "sushi", "dim sum", "wok", "thai", "chinese", "japanese", "korean", "vietnamese", "pho", "bánh mì", "banh mi"],
  },
  { key: "deli", category: "street_food", icon: "🥪", label: "Deli", keywords: ["deli", "sandwich", "subs", "sub"] },
];

/** Word-ish keyword match so "bar" doesn't match "Barcode". */
function matchesKeyword(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
}

/** Best-guess category key from a venue name (falls back to Pizza). */
function detectCategoryKey(name: string): string {
  const text = name.toLowerCase();
  for (const c of CATEGORY_ICONS) {
    if (c.keywords.some((k) => matchesKeyword(text, k))) return c.key;
  }
  return CATEGORY_ICONS[0].key;
}

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */

export function CreateFoodPostModal() {
  const isOpen = useCityPulseStore((state) => state.isCreateBiteModalOpen);
  const setIsOpen = useCityPulseStore((state) => state.setIsCreateBiteModalOpen);
  const addFoodPost = useCityPulseStore((state) => state.addFoodPost);
  const addVenue = useCityPulseStore((state) => state.addVenue);
  const updateVenueLocal = useCityPulseStore((state) => state.updateVenue);
  const setMapCenter = useCityPulseStore((state) => state.setMapCenter);
  const showToast = useCityPulseStore((state) => state.showToast);
  const currentUser = useCityPulseStore((state) => state.currentUser);
  const selectedVenue = useCityPulseStore((state) => state.selectedVenue);
  const venues = useCityPulseStore((state) => state.venues);

  // ── Flow ──
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // ── Step 1: venue ──
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [venueId, setVenueId] = useState<string | null>(null);
  const [google, setGoogle] = useState<PlaceResult | null>(null);
  const [listingPhotos, setListingPhotos] = useState<string[]>([]);
  const [categoryKey, setCategoryKey] = useState<string>(CATEGORY_ICONS[0].key);

  const activeCategory = useMemo(
    () => CATEGORY_ICONS.find((c) => c.key === categoryKey) ?? CATEGORY_ICONS[0],
    [categoryKey]
  );

  // ── Step 2: dish ──
  const [dishName, setDishName] = useState("");
  const [priceNok, setPriceNok] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [vibe, setVibe] = useState<VibeTag | null>(null);

  // ── Step 3: photo ──
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "error">("idle");
  const [fallbackPhoto, setFallbackPhoto] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const uploadPromiseRef = useRef<Promise<string | null> | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const wasOpenRef = useRef(false);

  /* ---- derived ---- */
  const existingVenue = useMemo<Venue | null>(
    () =>
      venues.find((v) => v.id === venueId) ??
      (selectedVenue && selectedVenue.id === venueId ? selectedVenue : null),
    [venues, venueId, selectedVenue]
  );

  const hasSelection = Boolean(google || existingVenue);
  const selectedName = google?.name ?? existingVenue?.name ?? "";
  const selectedAddress = google?.formatted_address ?? existingVenue?.address ?? "";
  const listingCover = existingVenue?.cover_image_url ?? null;

  /* ---- reset each time the modal opens ---- */
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      const fromVenue = selectedVenue ?? null;
      setStep(fromVenue ? 2 : 1);
      setVenueId(fromVenue?.id ?? null);
      setGoogle(null);
      setListingPhotos([]);
      setCategoryKey(
        fromVenue
          ? CATEGORY_ICONS.find((c) => c.icon === fromVenue.icon)?.key ??
              detectCategoryKey(fromVenue.name)
          : CATEGORY_ICONS[0].key
      );
      setQuery("");
      setResults([]);
      setDishName(fromVenue?.signature_dishes?.[0] ?? "");
      setPriceNok("");
      setReviewText("");
      setVibe(null);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setLocalPreview(null);
      setUploadedUrl(null);
      setUploadState("idle");
      setFallbackPhoto(null);
      setShowFallback(false);
      setSubmitting(false);
      uploadPromiseRef.current = null;
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, selectedVenue]);

  /* ---- debounced Google Places search ---- */
  useEffect(() => {
    if (!isOpen) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(q)}`);
        const json = (await res.json()) as { results?: PlaceResult[]; place?: PlaceResult };
        const list = json.results ?? (json.place ? [json.place] : []);
        if (!cancelled) setResults(list);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, isOpen]);

  /* ---- listing photos for the Google fallback ---- */
  const loadListingPhotos = useCallback(async (placeId: string | null | undefined) => {
    if (!placeId) {
      setListingPhotos([]);
      return;
    }
    try {
      const res = await fetch(`/api/places/details?place_id=${encodeURIComponent(placeId)}`);
      const json = (await res.json()) as { place?: PlaceResult };
      setListingPhotos(json.place?.photos ?? []);
    } catch {
      setListingPhotos([]);
    }
  }, []);

  /* ---- local (DB) matches, deduped against Google results ---- */
  const localMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? venues.filter(
          (v) =>
            v.name.toLowerCase().includes(q) || v.address.toLowerCase().includes(q)
        )
      : venues;
    return base.slice(0, 6);
  }, [venues, query]);

  const googleMatches = useMemo(() => {
    const knownPlaceIds = new Set(
      venues.map((v) => v.google_place_id).filter(Boolean) as string[]
    );
    const knownNames = new Set(venues.map((v) => v.name.toLowerCase()));
    return results.filter(
      (r) => !knownPlaceIds.has(r.place_id) && !knownNames.has(r.name.toLowerCase())
    );
  }, [results, venues]);

  /* ---- selection handlers ---- */
  const selectExisting = (v: Venue) => {
    setVenueId(v.id);
    setGoogle(null);
    setFallbackPhoto(null);
    setQuery("");
    setResults([]);
    setListingPhotos([]);
    setCategoryKey(
      CATEGORY_ICONS.find((c) => c.icon === v.icon)?.key ?? detectCategoryKey(v.name)
    );
  };

  const selectGooglePlace = (r: PlaceResult) => {
    setGoogle(r);
    setVenueId(null);
    setFallbackPhoto(null);
    setQuery("");
    setResults([]);
    setListingPhotos(r.photos ?? []);
    setCategoryKey(detectCategoryKey(r.name));
  };

  const clearSelection = () => {
    setVenueId(null);
    setGoogle(null);
    setFallbackPhoto(null);
    setListingPhotos([]);
    setQuery("");
    setResults([]);
  };

  /* ---- photo upload ---- */
  const uploadPhoto = useCallback(async (file: File): Promise<string | null> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setUploadState("error");
      return null;
    }
    setUploadState("uploading");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) {
        setUploadState("error");
        return null;
      }
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const filePath = `${userId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("dish-photos")
        .upload(filePath, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("dish-photos").getPublicUrl(filePath);
      const publicUrl = data.publicUrl;
      setUploadedUrl(publicUrl);
      setUploadState("idle");
      return publicUrl;
    } catch (err) {
      console.warn("[CreateFoodPostModal] photo upload failed:", err);
      setUploadState("error");
      return null;
    }
  }, []);

  const handleFileSelected = (file: File) => {
    setFallbackPhoto(null);
    setUploadedUrl(null);
    setUploadState("uploading");
    // Instant local preview…
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setLocalPreview(objectUrl);
    // …while the real upload streams to Supabase Storage.
    uploadPromiseRef.current = uploadPhoto(file);
  };

  const clearPhoto = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setLocalPreview(null);
    setUploadedUrl(null);
    setUploadState("idle");
    uploadPromiseRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ---- submit ---- */
  const handleSubmit = async () => {
    if (submitting) return;
    if (!currentUser) {
      setIsOpen(false);
      useCityPulseStore.getState().openCreateDish();
      return;
    }
    if (!dishName.trim()) {
      setStep(2);
      showToast("Add the dish name first.");
      return;
    }
    if (!google && !existingVenue) {
      setStep(1);
      showToast("Pick the Oslo spot for this dish first.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      showToast("Supabase isn't configured yet.");
      return;
    }

    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) {
        showToast("Please sign in again to log a dish.");
        return;
      }

      // 1) Resolve the venue (inserting a new Google spot when needed).
      let finalVenue: Venue | null = existingVenue;
      if (google) {
        const input: VenueInsertInput = {
          name: google.name,
          address: google.formatted_address,
          neighborhood: google.neighborhood,
          latitude: google.location.lat,
          longitude: google.location.lng,
          category: activeCategory.category,
          icon: activeCategory.icon,
          imageUrl: google.photos?.[0] ? photoProxy(google.photos[0]) : null,
          priceLevel: google.price_level ?? undefined,
          openNow: true,
          googlePlaceId: google.place_id,
          googleRating: google.google_rating,
          googleReviewsCount: google.google_reviews_count,
          googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${google.place_id}`,
          curatedReviews: google.reviews,
        };
        const result = await insertVenue(input);
        if (!result.success || !result.venue) {
          showToast(
            result.code === "permission-denied"
              ? "This new spot needs a quick admin approval. Pick an existing spot for now."
              : result.error ?? "Couldn't add that spot."
          );
          return;
        }
        finalVenue = result.venue;
        if (!useCityPulseStore.getState().venues.some((v) => v.id === finalVenue!.id)) {
          addVenue(finalVenue);
        }
      }
      if (!finalVenue) {
        showToast("Pick the Oslo spot for this dish first.");
        return;
      }

      // 1b) Existing spots adopt the chosen category + emoji so the radar pin
      // matches. Store update is instant; the DB write is best-effort (admin RLS).
      if (!google) {
        const patch: Partial<Venue> = {};
        if (finalVenue.icon !== activeCategory.icon) patch.icon = activeCategory.icon;
        if (finalVenue.food_category !== activeCategory.category) {
          patch.food_category = activeCategory.category;
        }
        if (Object.keys(patch).length > 0) {
          updateVenueLocal(finalVenue.id, patch);
          void updateVenueDb(finalVenue.id, {
            category: activeCategory.category,
            icon: activeCategory.icon,
          });
        }
      }

      // 2) Resolve the photo (await an in-flight upload first).
      let image = uploadedUrl;
      if (uploadPromiseRef.current) {
        const uploaded = await uploadPromiseRef.current;
        image = uploaded ?? uploadedUrl ?? image;
      }
      const finalImage =
        image ||
        fallbackPhoto ||
        (google?.photos?.[0] ? photoProxy(google.photos[0]) : "") ||
        finalVenue.cover_image_url ||
        getCulinaryImageForDish(dishName, finalVenue.food_category);

      // 3) Persist the dish.
      const numericPrice =
        Number(priceNok) || getRealisticPrice(dishName, finalVenue.food_category);
      const insert = await insertFoodPost({
        venueId: finalVenue.id,
        authorId: userId,
        dishName: dishName.trim(),
        dishImage: finalImage,
        reviewText: reviewText.trim(),
        priceNok: numericPrice,
        rating: 0,
        dietaryTags: [],
        isOfficialPick: false,
        vibe: vibe ?? undefined,
        dinerQuotes: [],
      });
      if (!insert.success) {
        showToast(insert.error ?? "Couldn't save your dish — please try again.");
        return;
      }

      // 4) Optimistic feed + map update.
      const optimistic: FoodPost = {
        id: insert.dish?.id ?? `post-${Date.now()}`,
        spot_id: finalVenue.id,
        spot_name: finalVenue.name,
        spot_address: finalVenue.address,
        spot_neighborhood: capitalize(finalVenue.neighborhood) || "Oslo",
        spot_coords: [finalVenue.longitude, finalVenue.latitude],
        dish_name: dishName.trim(),
        category: activeCategory.category,
        image_url: finalImage,
        price_nok: numericPrice,
        rating: 0,
        taste_tags: vibe ? [VIBE_LABEL[vibe]] : [],
        review_text: reviewText.trim(),
        author: {
          name: currentUser.name || currentUser.handle,
          handle: currentUser.handle,
          avatar_url: currentUser.avatar_url || "",
          badge: currentUser.badge,
        },
        likes_count: 0,
        saves_count: 0,
        created_at_relative: "Just now",
        is_official_pick: false,
        dietary_tags: [],
        diner_quotes: [],
      };

      addFoodPost(optimistic);
      // Pan the radar to the new pin while keeping the feed (and the fresh dish
      // at its top) visible.
      setMapCenter([finalVenue.longitude, finalVenue.latitude], 15);
      setIsOpen(false);
      showToast("🎉 Dish logged! Oslo foodies thank you.");
    } catch (err) {
      console.error("[CreateFoodPostModal] submit failed:", err);
      showToast("Something went wrong saving your dish. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---- misc ---- */
  const canAdvance =
    step === 1 ? hasSelection : step === 2 ? dishName.trim().length > 0 : true;

  if (!isOpen) return null;

  const fallbackOptions = [
    ...listingPhotos.slice(0, 4).map((ref, i) => photoProxy(ref, i)),
    ...(listingCover && !listingPhotos.length ? [listingCover] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-xs animate-in fade-in duration-150 sm:p-4">
      <div className="relative w-full sm:max-w-lg bg-[#FAF7F2] rounded-t-3xl sm:rounded-3xl border border-[#e8e0d4] shadow-2xl overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[92vh]">
        {/* ── Header ── */}
        <div className="px-5 pt-4 pb-3 border-b border-[#efe7da] bg-white/70 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-comico text-lg leading-tight text-[#221e19]">
                Log a Dish
              </h2>
              <p className="text-xs text-[#8a8073] mt-0.5">
                {step === 1
                  ? "Where did you eat?"
                  : step === 2
                  ? "Tell us about the dish"
                  : "Add a photo to make it pop"}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close"
              className="shrink-0 text-[#9a9083] hover:text-[#221e19] p-1.5 rounded-full hover:bg-black/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step progress */}
          <div className="flex items-center gap-2 mt-3.5">
            {STEPS.map((s, i) => {
              const active = step === s.n;
              const done = step > s.n;
              return (
                <React.Fragment key={s.n}>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                        done
                          ? "bg-[#e84a27] text-white"
                          : active
                          ? "bg-[#e84a27] text-white"
                          : "bg-[#ece4d7] text-[#a89d8c]"
                      }`}
                    >
                      {done ? <Check className="w-3.5 h-3.5" /> : s.n}
                    </span>
                    <span
                      className={`text-[11px] font-semibold ${
                        active ? "text-[#221e19]" : "text-[#a89d8c]"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <span
                      className={`flex-1 h-px ${
                        step > s.n ? "bg-[#e84a27]/50" : "bg-[#e2d8c8]"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4">
          {/* ================= STEP 1 — VENUE ================= */}
          {step === 1 && (
            <div className="space-y-4">
              {!hasSelection ? (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a89d8c]" />
                    <input
                      autoFocus
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search a venue in Oslo (e.g. Koie, Fuglen)..."
                      className="w-full pl-9 pr-9 py-3 rounded-2xl bg-white border border-[#e2d8c8] text-sm text-[#221e19] placeholder-[#a89d8c] focus:outline-none focus:border-[#e84a27] focus:ring-1 focus:ring-[#e84a27]/30 transition-all"
                    />
                    {searching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#e84a27] animate-spin" />
                    )}
                  </div>

                  {/* Local DB matches */}
                  {localMatches.length > 0 && (
                    <div>
                      <p className="px-1 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#a89d8c]">
                        On Smakr
                      </p>
                      <div className="space-y-1.5">
                        {localMatches.map((v) => (
                          <VenueRowButton
                            key={v.id}
                            name={v.name}
                            address={v.address}
                            rating={v.google_rating ?? null}
                            badge="On Smakr"
                            emoji={v.icon}
                            onClick={() => selectExisting(v)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Google Places matches */}
                  {googleMatches.length > 0 && (
                    <div>
                      <p className="px-1 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#a89d8c]">
                        Google Places
                      </p>
                      <div className="space-y-1.5">
                        {googleMatches.map((r) => (
                          <VenueRowButton
                            key={r.place_id}
                            name={r.name}
                            address={r.formatted_address}
                            rating={r.google_rating ?? null}
                            badge="New spot"
                            onClick={() => selectGooglePlace(r)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {!searching && query.trim().length >= 2 && googleMatches.length === 0 && (
                    <p className="text-center text-xs text-[#a89d8c] py-6">
                      No new matches for “{query.trim()}”. Try another name, or pick a spot above.
                    </p>
                  )}

                  {venues.length === 0 && query.trim().length < 2 && (
                    <div className="flex items-start gap-2 p-3 rounded-2xl bg-white border border-[#efe7da] text-xs text-[#8a8073]">
                      <Sparkles className="w-4 h-4 text-[#e84a27] shrink-0 mt-0.5" />
                      <span>
                        Search Google to add the very first spot, or ask an admin to seed Smakr.
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 rounded-2xl bg-white border border-[#e2d8c8] shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="w-11 h-11 rounded-xl bg-[#e84a27]/10 text-[#e84a27] flex items-center justify-center shrink-0 text-lg">
                      {activeCategory.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-comico text-base text-[#221e19] truncate">
                          {selectedName}
                        </h3>
                        <span
                          className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            google
                              ? "bg-[#e84a27]/10 text-[#e84a27]"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {google ? "NEW" : "ON SMAKR"}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8a8073] mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{selectedAddress}</span>
                      </p>
                      {google && (
                        <p className="text-[10px] text-[#a89d8c] mt-1">
                          We'll add this spot to Smakr when you post.
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="mt-3 text-[11px] font-bold text-[#e84a27] hover:underline"
                  >
                    Change spot
                  </button>

                  <div className="mt-4 pt-4 border-t border-[#efe7da]">
                    <CategoryIconRow value={categoryKey} onChange={setCategoryKey} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 2 — DISH ================= */}
          {step === 2 && (
            <div className="space-y-4">
              {hasSelection && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-[#efe7da] text-xs text-[#8a8073]">
                  <MapPin className="w-3.5 h-3.5 text-[#e84a27] shrink-0" />
                  <span className="truncate font-semibold text-[#221e19]">{selectedName}</span>
                </div>
              )}

              <CategoryIconRow value={categoryKey} onChange={setCategoryKey} />

              <div>
                <label className="block text-xs font-bold text-[#221e19] mb-1.5">
                  Dish name <span className="text-[#e84a27]">*</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="e.g. Cardamom Morning Bun"
                  className="w-full px-3.5 py-3 rounded-2xl bg-white border border-[#e2d8c8] text-sm text-[#221e19] placeholder-[#a89d8c] focus:outline-none focus:border-[#e84a27] focus:ring-1 focus:ring-[#e84a27]/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#221e19] mb-1.5">
                  Price in NOK <span className="text-[#a89d8c] font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={priceNok}
                    onChange={(e) => setPriceNok(e.target.value)}
                    placeholder="58"
                    className="w-full px-3.5 py-3 pr-14 rounded-2xl bg-white border border-[#e2d8c8] text-sm text-[#221e19] placeholder-[#a89d8c] focus:outline-none focus:border-[#e84a27] focus:ring-1 focus:ring-[#e84a27]/30 transition-all font-mono"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#a89d8c]">
                    NOK
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#221e19] mb-1.5">
                  Taste impression
                </label>
                <textarea
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="What makes this dish special? (Crust, broth, spice...)"
                  className="w-full px-3.5 py-3 rounded-2xl bg-white border border-[#e2d8c8] text-sm text-[#221e19] placeholder-[#a89d8c] focus:outline-none focus:border-[#e84a27] focus:ring-1 focus:ring-[#e84a27]/30 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#221e19] mb-1.5">
                  Vibe / taste tag
                </label>
                <div className="flex flex-wrap gap-2">
                  {VIBES.map((v) => {
                    const active = vibe === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVibe(active ? null : v.id)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition-all active:scale-95 ${
                          active
                            ? "bg-[#e84a27] text-white border-[#e84a27] shadow-sm shadow-[#e84a27]/25"
                            : "bg-white text-[#6b6459] border-[#e2d8c8] hover:border-[#e84a27]/50"
                        }`}
                      >
                        <span>{v.emoji}</span>
                        <span>{v.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3 — PHOTO ================= */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Instant local preview */}
              {localPreview || uploadedUrl ? (
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-[#e2d8c8] bg-[#efe7da]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadedUrl || localPreview || ""}
                    alt="Dish preview"
                    className="w-full h-full object-cover"
                  />
                  {uploadState === "uploading" && !uploadedUrl && (
                    <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center gap-2 text-white">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-xs font-semibold">Uploading…</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-full bg-white/90 backdrop-blur text-[11px] font-bold text-[#221e19] shadow-sm hover:bg-white"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={clearPhoto}
                      aria-label="Remove photo"
                      className="p-1.5 rounded-full bg-white/90 backdrop-blur text-[#6b6459] shadow-sm hover:bg-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-9 px-4 rounded-2xl border-2 border-dashed border-[#e0d5c3] hover:border-[#e84a27] bg-white/70 hover:bg-[#e84a27]/[0.04] flex flex-col items-center justify-center gap-2.5 transition-colors"
                >
                  <span className="p-3.5 rounded-full bg-[#e84a27]/10 text-[#e84a27]">
                    <Upload className="w-5 h-5" />
                  </span>
                  <span className="text-center">
                    <span className="block font-bold text-sm text-[#221e19]">
                      Tap to add a photo
                    </span>
                    <span className="block text-[11px] text-[#a89d8c] mt-0.5">
                      Camera or library · JPG, PNG, WEBP
                    </span>
                  </span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelected(f);
                }}
                className="hidden"
              />

              {uploadState === "error" && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  Upload didn't go through — we'll use a listing or Smakr photo instead.
                </p>
              )}

              {/* Google listing photo fallback */}
              {!localPreview && !uploadedUrl && (fallbackOptions.length > 0 || google) && (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={async () => {
                      const next = !showFallback;
                      setShowFallback(next);
                      if (next && listingPhotos.length === 0 && !google) {
                        await loadListingPhotos(existingVenue?.google_place_id);
                      }
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                      showFallback
                        ? "bg-[#221e19] text-white border-[#221e19]"
                        : "bg-white text-[#221e19] border-[#e2d8c8] hover:border-[#221e19]/30"
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Use Google listing photo</span>
                  </button>

                  {showFallback && fallbackOptions.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {fallbackOptions.map((url, i) => (
                        <button
                          key={`${url}-${i}`}
                          type="button"
                          onClick={() => setFallbackPhoto(url)}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                            fallbackPhoto === url
                              ? "border-[#e84a27] ring-2 ring-[#e84a27]/20"
                              : "border-transparent hover:border-[#e84a27]/40"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Listing photo ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {fallbackPhoto === url && (
                            <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#e84a27] text-white flex items-center justify-center">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {showFallback && fallbackOptions.length === 0 && (
                    <p className="text-center text-[11px] text-[#a89d8c] py-2">
                      No listing photos available — we'll use a matching Smakr photo.
                    </p>
                  )}
                </div>
              )}

              {!localPreview && !uploadedUrl && <FlashNote />}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-4 border-t border-[#efe7da] bg-white/70 backdrop-blur-sm flex items-center gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
              disabled={submitting}
              className="flex items-center gap-1 px-3.5 py-3 rounded-2xl text-xs font-bold text-[#6b6459] bg-white border border-[#e2d8c8] hover:bg-[#faf7f2] transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <span className="text-[11px] font-semibold text-[#a89d8c] pl-1">
              Step {step} / 3
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              if (step < 3) {
                if (!canAdvance) {
                  showToast(step === 1 ? "Pick a spot to continue." : "Add the dish name first.");
                  return;
                }
                setStep((s) => (s === 1 ? 2 : 3));
              } else {
                void handleSubmit();
              }
            }}
            disabled={submitting || !canAdvance}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] text-white font-bold text-sm shadow-md shadow-[#e84a27]/25 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Posting…</span>
              </>
            ) : step < 3 ? (
              <>
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Post dish to the feed</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function VenueRowButton({
  name,
  address,
  rating,
  badge,
  emoji,
  onClick,
}: {
  name: string;
  address: string;
  rating: number | null;
  badge: string;
  emoji?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-[#efe7da] hover:border-[#e84a27]/40 hover:bg-[#faf7f2] transition-all text-left"
    >
      <span className="w-9 h-9 rounded-xl bg-[#e84a27]/10 text-[#e84a27] flex items-center justify-center shrink-0 text-base">
        {emoji || <Search className="w-4 h-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="font-semibold text-sm text-[#221e19] truncate">{name}</span>
          <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#ece4d7] text-[#8a8073]">
            {badge}
          </span>
        </span>
        <span className="block text-[11px] text-[#a89d8c] truncate mt-0.5">{address}</span>
      </span>
      {rating != null && (
        <span className="shrink-0 flex items-center gap-0.5 text-[11px] font-bold text-amber-600">
          ★ {rating.toFixed(1)}
        </span>
      )}
    </button>
  );
}

function CategoryIconRow({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-[#221e19] mb-1.5">
        Category &amp; icon
      </label>
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
        {CATEGORY_ICONS.map((c) => {
          const active = value === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => onChange(c.key)}
              aria-pressed={active}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border transition-all active:scale-95 ${
                active
                  ? "bg-[#e84a27] text-white border-[#e84a27] shadow-sm shadow-[#e84a27]/25"
                  : "bg-white text-[#6b6459] border-[#e2d8c8] hover:border-[#e84a27]/50"
              }`}
            >
              <span className="text-sm leading-none">{c.icon}</span>
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FlashNote() {
  return (
    <p className="text-center text-[11px] text-[#a89d8c] leading-relaxed">
      No photo? That's fine — pick the Google listing shot above, or we'll match a Smakr photo.
    </p>
  );
}
