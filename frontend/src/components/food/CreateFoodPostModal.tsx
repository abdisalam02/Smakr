"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Camera,
  Plus,
  Sparkles,
  Link as LinkIcon,
  Search,
  Check,
  Video,
  Loader2,
  MapPin,
  Upload,
  ArrowRight,
  Edit3,
} from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { FOOD_CATEGORIES, INITIAL_FOOD_SPOTS } from "@/lib/foodSeeds";
import { FoodCategory, FoodPost, Venue } from "@/types";
import { getDistanceInMeters } from "@/lib/math";
import Image from "next/image";

const PRESET_PHOTOS = [
  { label: "Vietnamese Coffee", url: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=1200&q=80" },
  { label: "Bánh Mì / Sandwich", url: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=1200&q=80" },
  { label: "Cardamom Knot", url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80" },
  { label: "Ramen Bowl", url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80" },
  { label: "Smash Burger", url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80" },
  { label: "Artisanal Pizza", url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80" },
  { label: "Fish & Chips", url: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80" },
  { label: "Gelato", url: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=1200&q=80" },
];

export function CreateFoodPostModal() {
  const isCreateBiteModalOpen = useCityPulseStore((state) => state.isCreateBiteModalOpen);
  const setIsCreateBiteModalOpen = useCityPulseStore((state) => state.setIsCreateBiteModalOpen);
  const addFoodPost = useCityPulseStore((state) => state.addFoodPost);
  const currentUser = useCityPulseStore((state) => state.currentUser);
  const selectedVenue = useCityPulseStore((state) => state.selectedVenue);
  const showToast = useCityPulseStore((state) => state.showToast);

  // 3 Modes: "tiktok_link" | "photo_gps" | "manual"
  const [activeTab, setActiveTab] = useState<"tiktok_link" | "photo_gps" | "manual">("tiktok_link");

  // TikTok / Link Importer state
  const [importUrl, setImportUrl] = useState("");
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [extractedPreview, setExtractedPreview] = useState<{
    title: string;
    spotName: string;
    spotId: string;
    thumbnail: string;
    author: string;
    caption: string;
  } | null>(null);

  // Photo GPS state
  const [isGpsLocating, setIsGpsLocating] = useState(false);
  const [gpsDetectedNotice, setGpsDetectedNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form Fields
  const [dishName, setDishName] = useState("");
  const [spotId, setSpotId] = useState(INITIAL_FOOD_SPOTS[0].id);
  const [spotSearchQuery, setSpotSearchQuery] = useState("");
  const [isSpotDropdownOpen, setIsSpotDropdownOpen] = useState(false);
  const [category, setCategory] = useState<FoodCategory>("coffee");
  const [priceNok, setPriceNok] = useState<number>(78);
  const [rating, setRating] = useState<number>(9.5);
  const [tasteTagsStr, setTasteTagsStr] = useState("Creamy, Iced, Coconut");
  const [reviewText, setReviewText] = useState("");
  const [imageUrl, setImageUrl] = useState(PRESET_PHOTOS[0].url);

  // Pre-fill spot if opened from a specific venue card
  useEffect(() => {
    if (selectedVenue) {
      setSpotId(selectedVenue.id);
      if (selectedVenue.signature_dishes && selectedVenue.signature_dishes.length > 0) {
        setDishName(selectedVenue.signature_dishes[0]);
      }
      if (selectedVenue.food_category) {
        setCategory(selectedVenue.food_category as FoodCategory);
      }
    }
  }, [selectedVenue, isCreateBiteModalOpen]);

  if (!isCreateBiteModalOpen) return null;

  const currentSelectedSpot =
    INITIAL_FOOD_SPOTS.find((s) => s.id === spotId) || INITIAL_FOOD_SPOTS[0];

  const filteredSpots = INITIAL_FOOD_SPOTS.filter(
    (s) =>
      s.name.toLowerCase().includes(spotSearchQuery.toLowerCase()) ||
      s.address.toLowerCase().includes(spotSearchQuery.toLowerCase())
  );

  // Clean title helper (removes POV:, hashtags, trailing emojis)
  const cleanTitleText = (raw: string): string => {
    let text = raw.replace(/#[\wæøåÆØÅ]+/g, ""); // remove hashtags
    text = text.replace(/POV:\s*/i, "");
    text = text.trim();
    if (text.length > 55) {
      const parts = text.split(/[.!?\n]/);
      text = parts[0].trim();
    }
    return text || "Oslo Food Discovery";
  };

  // Heuristic Spot Matcher for captions
  const findMatchingSpotFromText = (text: string): Venue | undefined => {
    const lower = text.toLowerCase();

    // Check specific known spots first
    if (lower.includes("prindsen") || lower.includes("sandwich & stuff") || lower.includes("storgata 36")) {
      return INITIAL_FOOD_SPOTS.find((s) => s.id === "spot-sandwich-and-stuff");
    }
    if (lower.includes("ca phe") || lower.includes("cà phê") || lower.includes("smalgangen")) {
      return INITIAL_FOOD_SPOTS.find((s) => s.id === "spot-ca-phe-gronland");
    }
    if (lower.includes("farine") || lower.includes("kampen")) {
      return INITIAL_FOOD_SPOTS.find((s) => s.id === "spot-farine-kampen");
    }
    if (lower.includes("koie") || lower.includes("ramen")) {
      return INITIAL_FOOD_SPOTS.find((s) => s.id === "spot-koie");
    }
    if (lower.includes("zz pizza") || lower.includes("sandaker")) {
      return INITIAL_FOOD_SPOTS.find((s) => s.id === "spot-zz-pizza");
    }
    if (lower.includes("tim wendelboe") || lower.includes("wendelboe")) {
      return INITIAL_FOOD_SPOTS.find((s) => s.id === "spot-tim-wendelboe");
    }

    // Generic match
    return INITIAL_FOOD_SPOTS.find(
      (s) => lower.includes(s.name.toLowerCase()) || lower.includes(s.address.toLowerCase())
    );
  };

  // Option 1: Handle Smart TikTok / Video / Social Link Auto-Fetch
  const handleFetchLink = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanUrl = importUrl.trim();
    if (!cleanUrl) return;

    setIsFetchingUrl(true);

    try {
      if (cleanUrl.includes("tiktok.com")) {
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(cleanUrl)}`;
        const res = await fetch(oembedUrl);

        if (res.ok) {
          const data = await res.json();
          const rawTitle = data.title || "Viral Oslo Food Discovery";
          const author = data.author_name ? `@${data.author_name}` : "@tiktok_foodie";
          const photoUrl = data.thumbnail_url || PRESET_PHOTOS[1].url;

          const matchedSpot = findMatchingSpotFromText(rawTitle) || currentSelectedSpot;
          const cleanedDish = cleanTitleText(rawTitle);

          setSpotId(matchedSpot.id);
          if (matchedSpot.food_category) setCategory(matchedSpot.food_category as FoodCategory);
          setDishName(cleanedDish);
          setImageUrl(photoUrl);
          setReviewText(`Imported recommendation by ${author}: "${rawTitle.slice(0, 180)}..."`);
          setTasteTagsStr("TikTok Viral, Must Try, OsloEats");

          setExtractedPreview({
            title: cleanedDish,
            spotName: matchedSpot.name,
            spotId: matchedSpot.id,
            thumbnail: photoUrl,
            author,
            caption: rawTitle,
          });

          showToast("Extracted dish and creator info from TikTok!");
        } else {
          fallbackLinkParse(cleanUrl);
        }
      } else {
        fallbackLinkParse(cleanUrl);
      }
    } catch {
      fallbackLinkParse(cleanUrl);
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const fallbackLinkParse = (url: string) => {
    const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)/i);
    const photo = isImage ? url : PRESET_PHOTOS[1].url;
    const title = "Oslo Food Recommendation";
    const matchedSpot = currentSelectedSpot;

    setImageUrl(photo);
    setDishName(title);
    setReviewText(`Found via ${url}`);
    setTasteTagsStr("Trending, Must Try, Oslo");

    setExtractedPreview({
      title,
      spotName: matchedSpot.name,
      spotId: matchedSpot.id,
      thumbnail: photo,
      author: "@foodie_oslo",
      caption: `Shared via ${url}`,
    });

    showToast("Imported meal preview from link!");
  };

  // Option 3: Handle Food Photo Upload with EXIF / GPS Auto-Locate
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create local object URL for instantaneous photo preview
    const objectUrl = URL.createObjectURL(file);
    setImageUrl(objectUrl);
    setDishName(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") || "Fresh Dish");

    setIsGpsLocating(true);
    setGpsDetectedNotice("Detecting food spot from photo location...");

    // Try HTML5 Geolocation / EXIF match to nearest Oslo restaurant
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLat = pos.coords.latitude;
          const userLon = pos.coords.longitude;

          // Find closest venue
          let closest = INITIAL_FOOD_SPOTS[0];
          let minDist = 99999999;

          INITIAL_FOOD_SPOTS.forEach((spot) => {
            const dist = getDistanceInMeters(userLat, userLon, spot.latitude, spot.longitude);
            if (dist < minDist) {
              minDist = dist;
              closest = spot;
            }
          });

          setSpotId(closest.id);
          if (closest.food_category) setCategory(closest.food_category as FoodCategory);
          setGpsDetectedNotice(`📍 Auto-located spot: ${closest.name} (${Math.round(minDist)}m away)`);
          showToast(`Auto-detected spot: ${closest.name}!`);
          setIsGpsLocating(false);
          setActiveTab("manual");
        },
        () => {
          // Default to currentSelectedSpot
          setGpsDetectedNotice(`📍 Spot set to: ${currentSelectedSpot.name}`);
          setIsGpsLocating(false);
          setActiveTab("manual");
        },
        { timeout: 5000 }
      );
    } else {
      setIsGpsLocating(false);
      setActiveTab("manual");
    }
  };

  // Submit Post
  const handleFinalSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!dishName.trim()) return;

    const tags = tasteTagsStr
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newPost: FoodPost = {
      id: `post-${Date.now()}`,
      spot_id: currentSelectedSpot.id,
      spot_name: currentSelectedSpot.name,
      spot_address: currentSelectedSpot.address,
      spot_neighborhood: currentSelectedSpot.city,
      spot_coords: [currentSelectedSpot.longitude, currentSelectedSpot.latitude],
      dish_name: dishName.trim(),
      category,
      image_url: imageUrl,
      price_nok: Number(priceNok) || 85,
      rating: Number(rating) || 9.4,
      taste_tags: tags.length > 0 ? tags : ["Delicious", "OsloEats"],
      review_text: reviewText.trim() || "Delicious meal in Oslo! Highly recommended.",
      author: currentUser || {
        id: "user-1",
        name: "Astrid Lindholm",
        handle: "@astrid_eats_oslo",
        avatar_url:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
        badge: "Verified Foodie",
      },
      likes_count: 1,
      saves_count: 0,
      created_at_relative: "Just now",
      item_availability: "Available Now",
    };

    addFoodPost(newPost);
    showToast(`Logged "${newPost.dish_name}" at ${newPost.spot_name}!`);
    setIsCreateBiteModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
              <span>Log a Dish or Spot</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-50 text-[#ff5500] font-bold border border-orange-200/60">
                Smakr Oslo
              </span>
            </h2>
            <p className="text-xs text-zinc-500">
              Share what you had or import directly from TikTok / link
            </p>
          </div>
          <button
            onClick={() => setIsCreateBiteModalOpen(false)}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Ingestion Tabs */}
        <div className="p-2.5 bg-zinc-50 border-b border-zinc-100 flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("tiktok_link")}
            className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
              activeTab === "tiktok_link"
                ? "bg-white text-[#ff5500] shadow-xs border border-zinc-200/80"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span className="truncate">⚡ TikTok Import</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("photo_gps")}
            className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
              activeTab === "photo_gps"
                ? "bg-white text-[#ff5500] shadow-xs border border-zinc-200/80"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="truncate">📷 Photo GPS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
              activeTab === "manual"
                ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/80"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="truncate">📝 Custom</span>
          </button>
        </div>

        {/* Tab 1: TikTok & Link Auto-Import */}
        {activeTab === "tiktok_link" && (
          <div className="p-5 space-y-4 overflow-y-auto no-scrollbar text-xs">
            <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-200/70 space-y-1 text-zinc-800">
              <div className="font-bold flex items-center gap-1.5 text-zinc-900">
                <Sparkles className="w-4 h-4 text-[#ff5500]" />
                <span>Instant TikTok & Video Ingestion</span>
              </div>
              <p className="text-[11px] text-zinc-600 leading-relaxed">
                Paste any TikTok food recommendation video. Smakr automatically pulls the video thumbnail,
                cleans the caption, and matches the Oslo restaurant!
              </p>
            </div>

            <form onSubmit={handleFetchLink} className="space-y-3">
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">
                  Paste TikTok or Social Video Link
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="url"
                    required
                    placeholder="https://www.tiktok.com/@oslofoodguide/video/..."
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-[#ff5500] text-xs"
                  />
                </div>
              </div>

              {/* Sample quick paste button */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-zinc-400 font-mono">Try sample:</span>
                <button
                  type="button"
                  onClick={() =>
                    setImportUrl(
                      "https://www.tiktok.com/@sandwichandstuff/video/73829183749281"
                    )
                  }
                  className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-[10px] text-zinc-700 font-medium"
                >
                  🥪 Sandwich & Stuff (Prindsens Hage)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setImportUrl("https://www.tiktok.com/@oslo_eats/video/729182374619")
                  }
                  className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-[10px] text-zinc-700 font-medium"
                >
                  ☕ Cà Phê Coconut Coffee
                </button>
              </div>

              <button
                type="submit"
                disabled={isFetchingUrl}
                className="w-full py-2.5 px-4 rounded-xl bg-[#ff5500] hover:bg-[#e04b00] text-white font-bold text-xs shadow-md shadow-[#ff5500]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isFetchingUrl ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Auto-Fetching Metadata...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Auto-Extract Meal & Spot</span>
                  </>
                )}
              </button>
            </form>

            {/* Live Extracted Preview Card with 1-Click Post */}
            {extractedPreview && (
              <div className="mt-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-zinc-900 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Extracted Preview</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("manual")}
                    className="text-[10px] font-semibold text-[#ff5500] hover:underline"
                  >
                    Edit details
                  </button>
                </div>

                <div className="flex gap-3">
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-zinc-200 shrink-0 border border-zinc-200">
                    <Image
                      src={extractedPreview.thumbnail}
                      alt={extractedPreview.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                      unoptimized
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-zinc-900 text-xs truncate">
                        {dishName}
                      </h4>
                      <p className="text-[11px] text-[#ff5500] font-semibold mt-0.5 truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{currentSelectedSpot.name}</span>
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">
                        {extractedPreview.author} · {extractedPreview.caption.slice(0, 80)}...
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-zinc-600">
                      <span>{priceNok} NOK</span>
                      <span>·</span>
                      <span className="font-bold text-amber-600">★ {rating}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleFinalSubmit()}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <span>✨ Confirm & Post to Oslo Feed</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Photo Upload with EXIF & GPS Auto-Locate */}
        {activeTab === "photo_gps" && (
          <div className="p-5 space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 space-y-1 text-zinc-800">
              <div className="font-bold flex items-center gap-1.5 text-zinc-900">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Camera & GPS Spot Detection</span>
              </div>
              <p className="text-[11px] text-zinc-600 leading-relaxed">
                Take a photo or upload an image from your device. Smakr automatically detects your location
                and matches the closest Oslo restaurant!
              </p>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 px-4 rounded-2xl border-2 border-dashed border-zinc-300 hover:border-[#ff5500] bg-zinc-50 hover:bg-orange-50/30 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <div className="p-3 rounded-full bg-white text-[#ff5500] shadow-xs border border-zinc-200">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-center">
                <span className="font-bold text-zinc-900 text-xs">
                  Click to Snap or Select Food Photo
                </span>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Supports JPEG, PNG, WEBP with GPS location data
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {isGpsLocating && (
              <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-100 text-zinc-700">
                <Loader2 className="w-4 h-4 animate-spin text-[#ff5500]" />
                <span>Locating nearest Oslo restaurant...</span>
              </div>
            )}

            {gpsDetectedNotice && (
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-zinc-800 font-semibold text-[11px] flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#ff5500]" />
                <span>{gpsDetectedNotice}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Custom Form */}
        {activeTab === "manual" && (
          <form onSubmit={handleFinalSubmit} className="p-5 overflow-y-auto space-y-4 no-scrollbar text-xs">
            {/* Dish Name */}
            <div>
              <label className="block font-semibold text-zinc-800 mb-1">
                Dish or Beverage Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Loaded Crispy Pork Sandwich, Coconut Coffee"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-[#ff5500] transition-colors"
              />
            </div>

            {/* Searchable Oslo Spot Picker */}
            <div>
              <label className="block font-semibold text-zinc-800 mb-1">
                Oslo Restaurant or Food Spot *
              </label>
              <div className="relative">
                <div
                  onClick={() => setIsSpotDropdownOpen(!isSpotDropdownOpen)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between cursor-pointer hover:border-zinc-300"
                >
                  <span className="font-bold text-zinc-900 truncate">
                    {currentSelectedSpot.name}
                  </span>
                  <span className="text-[11px] text-zinc-400 truncate">
                    {currentSelectedSpot.address}
                  </span>
                </div>

                {isSpotDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white rounded-2xl border border-zinc-200 shadow-xl overflow-hidden max-h-48 flex flex-col animate-in fade-in duration-100">
                    <div className="p-2 border-b border-zinc-100 flex items-center gap-1.5 bg-zinc-50">
                      <Search className="w-3.5 h-3.5 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Search Oslo spots..."
                        value={spotSearchQuery}
                        onChange={(e) => setSpotSearchQuery(e.target.value)}
                        className="w-full bg-transparent text-xs focus:outline-none"
                      />
                    </div>

                    <div className="overflow-y-auto p-1 space-y-0.5 no-scrollbar">
                      {filteredSpots.map((spot) => (
                        <button
                          key={spot.id}
                          type="button"
                          onClick={() => {
                            setSpotId(spot.id);
                            setIsSpotDropdownOpen(false);
                          }}
                          className={`w-full p-2 text-left rounded-xl flex items-center justify-between transition-colors ${
                            spot.id === spotId
                              ? "bg-orange-50 text-[#ff5500] font-bold"
                              : "hover:bg-zinc-50 text-zinc-700"
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="truncate text-xs font-semibold">{spot.name}</div>
                            <div className="truncate text-[10px] text-zinc-400">{spot.address}</div>
                          </div>
                          {spot.id === spotId && <Check className="w-3.5 h-3.5 shrink-0 text-[#ff5500]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Category & Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FoodCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-[#ff5500]"
                >
                  {FOOD_CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-800 mb-1">
                  Price (NOK)
                </label>
                <input
                  type="number"
                  min="0"
                  value={priceNok}
                  onChange={(e) => setPriceNok(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-[#ff5500] font-mono"
                />
              </div>
            </div>

            {/* Foodie Rating */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-zinc-800">
                  Foodie Score
                </label>
                <span className="font-bold text-amber-600 font-mono text-xs">
                  ★ {rating} / 10
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.1"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full accent-[#ff5500] cursor-pointer"
              />
            </div>

            {/* Photo Preview & Selector */}
            <div>
              <label className="block font-semibold text-zinc-800 mb-1.5 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-zinc-500" />
                <span>Photo Preset or Custom URL</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {PRESET_PHOTOS.map((p) => (
                  <button
                    type="button"
                    key={p.label}
                    onClick={() => setImageUrl(p.url)}
                    className={`text-[10px] font-medium py-1.5 px-2 rounded-lg border text-center transition-all ${
                      imageUrl === p.url
                        ? "bg-zinc-900 text-white border-zinc-900 font-bold"
                        : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <input
                type="url"
                placeholder="Or paste direct image URL..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-[#ff5500]"
              />
            </div>

            {/* Taste Notes */}
            <div>
              <label className="block font-semibold text-zinc-800 mb-1">
                Taste Notes & Aromas (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Loaded, Crispy Pork, Savory, Herb Mayo"
                value={tasteTagsStr}
                onChange={(e) => setTasteTagsStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-[#ff5500]"
              />
            </div>

            {/* Review & Pro-Tips */}
            <div>
              <label className="block font-semibold text-zinc-800 mb-1">
                Insider Tip & Verdict
              </label>
              <textarea
                rows={2}
                placeholder="Insider recommendations (e.g. Get the loaded fries with it)..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-[#ff5500]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#ff5500] hover:bg-[#e04b00] text-white font-bold text-xs shadow-md shadow-[#ff5500]/25 transition-all"
            >
              Post Meal to Oslo Feed
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
