"use client";

import React, { useState, useEffect } from "react";
import { X, Camera, Plus, Sparkles, Link as LinkIcon, Search, Check, Video, Loader2 } from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { FOOD_CATEGORIES, INITIAL_FOOD_SPOTS } from "@/lib/foodSeeds";
import { FoodCategory, FoodPost } from "@/types";
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

  // Tab state: "quick_import" | "manual"
  const [activeTab, setActiveTab] = useState<"quick_import" | "manual">("quick_import");

  // Quick import state
  const [importUrl, setImportUrl] = useState("");
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

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

  // Handle Smart Link / TikTok Auto-Fetch
  const handleFetchLink = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanUrl = importUrl.trim();
    if (!cleanUrl) return;

    setIsFetchingUrl(true);
    setImportStatus("Querying TikTok / link metadata...");

    try {
      if (cleanUrl.includes("tiktok.com")) {
        // Query TikTok's public official oEmbed endpoint
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(cleanUrl)}`;
        const res = await fetch(oembedUrl);

        if (res.ok) {
          const data = await res.json();
          // Title typically contains caption: e.g. "Best coconut coffee in Oslo at Ca Phe #oslofood"
          const title = data.title || "Viral Oslo Food Discovery";
          const author = data.author_name ? `@${data.author_name}` : "@tiktok_foodie";

          // Smart heuristic extractor
          let detectedSpot = INITIAL_FOOD_SPOTS.find((s) =>
            title.toLowerCase().includes(s.name.toLowerCase().split(" ")[0])
          );

          if (detectedSpot) {
            setSpotId(detectedSpot.id);
            setCategory(detectedSpot.food_category as FoodCategory);
          }

          // Extract dish candidate or use title
          setDishName(title.split("#")[0].trim().slice(0, 45) || "Viral Oslo Specialty");
          setReviewText(`Imported from TikTok by ${author}: "${title}"`);
          if (data.thumbnail_url) {
            setImageUrl(data.thumbnail_url);
          }
          setTasteTagsStr("TikTok Viral, Must Try, OsloEats");
          showToast("Extracted dish and creator info from TikTok!");
          setActiveTab("manual"); // switch to review populated form
        } else {
          // Fallback parsing if TikTok oEmbed has CORS restriction in client environment
          fallbackLinkParse(cleanUrl);
        }
      } else {
        fallbackLinkParse(cleanUrl);
      }
    } catch {
      fallbackLinkParse(cleanUrl);
    } finally {
      setIsFetchingUrl(false);
      setImportStatus(null);
    }
  };

  const fallbackLinkParse = (url: string) => {
    // If it's an image link or social share
    if (url.match(/\.(jpeg|jpg|gif|png|webp)/i)) {
      setImageUrl(url);
      setDishName("Oslo Food Discovery");
      showToast("Photo link attached successfully!");
    } else if (url.includes("instagram.com") || url.includes("tiktok.com")) {
      // Simulate quick social parser
      setImageUrl(PRESET_PHOTOS[0].url);
      setDishName("Trending Oslo Bite");
      setReviewText(`Imported recommendation from social link: ${url}`);
      setTasteTagsStr("Social Hit, Trending, Oslo");
      showToast("Imported meal from link!");
    } else {
      setReviewText(`Found via ${url}`);
      showToast("Link attached to post!");
    }
    setActiveTab("manual");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
      rating: Number(rating) || 9.2,
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

        {/* Ingestion Mode Switcher */}
        <div className="p-3 bg-zinc-50 border-b border-zinc-100 flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("quick_import")}
            className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "quick_import"
                ? "bg-white text-[#ff5500] shadow-xs border border-zinc-200/80"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>⚡ TikTok & Link Auto-Import</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "manual"
                ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/80"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <span>📝 Custom Food Log</span>
          </button>
        </div>

        {/* Tab 1: TikTok & Link Auto-Import */}
        {activeTab === "quick_import" && (
          <div className="p-5 space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-200/70 space-y-1 text-zinc-800">
              <div className="font-bold flex items-center gap-1.5 text-zinc-900">
                <Video className="w-4 h-4 text-[#ff5500]" />
                <span>Instant Social Link Ingestion</span>
              </div>
              <p className="text-[11px] text-zinc-600 leading-relaxed">
                Paste any TikTok food recommendation video, Instagram Reel, or direct image link.
                Smakr automatically pulls the title, video thumbnail, and matches the Oslo restaurant!
              </p>
            </div>

            <form onSubmit={handleFetchLink} className="space-y-3">
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">
                  Paste TikTok or Photo Link
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

              {/* Sample quick paste buttons for fast testing */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-zinc-400 font-mono">Try sample:</span>
                <button
                  type="button"
                  onClick={() =>
                    setImportUrl("https://www.tiktok.com/@foodiesoslo/video/73829183749281")
                  }
                  className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-[10px] text-zinc-600"
                >
                  Ca Phe Coconut Coffee
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setImportUrl("https://www.tiktok.com/@oslo_eats/video/729182374619")
                  }
                  className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-[10px] text-zinc-600"
                >
                  Farine Cardamom Bun
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
          </div>
        )}

        {/* Tab 2: Manual Log & Form */}
        {activeTab === "manual" && (
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 no-scrollbar text-xs">
            {/* Dish Name */}
            <div>
              <label className="block font-semibold text-zinc-800 mb-1">
                Dish or Beverage Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Iced Coconut Coffee, Smash Burger, Tonkotsu Ramen"
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
                placeholder="e.g. Iced Coconut, Rich Phin, Crunchy Sourdough, Smoky"
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
                placeholder="Insider recommendations (e.g. Ask for extra chili, best before 11am)..."
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
