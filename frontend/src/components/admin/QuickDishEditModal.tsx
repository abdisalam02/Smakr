"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Check,
  AlertTriangle,
  Search,
  Sparkles,
  Image as ImageIcon,
  Link as LinkIcon,
  RefreshCw,
  Camera,
  Wand2,
} from "lucide-react";
import type { StagedDishHighlight } from "@/app/api/admin/seeding-lab/route";
import {
  ANGLE_PRESETS,
  ENVIRONMENT_PRESETS,
  resolveCategoryRemixDefaults,
  type AnglePresetId,
  type EnvironmentPresetId,
} from "@/lib/dishImageRemixConfig";

interface QuickDishEditModalProps {
  dish: StagedDishHighlight;
  spotName: string;
  onSave: (updated: Partial<StagedDishHighlight>) => Promise<void>;
  onClose: () => void;
}

// Persistent module-level cache so opening the modal for the same spot never re-fetches Google Places
export const clientGooglePhotosCache = new Map<string, string[]>();

const SESSION_CACHE_PREFIX = "smakr_gplaces_photos_v1:";

export function getCachedPhotosForQuery(query: string): string[] | null {
  const key = query.toLowerCase().trim();
  if (clientGooglePhotosCache.has(key)) {
    return clientGooglePhotosCache.get(key)!;
  }
  if (typeof window !== "undefined") {
    try {
      const raw = window.sessionStorage.getItem(SESSION_CACHE_PREFIX + key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          clientGooglePhotosCache.set(key, parsed);
          return parsed;
        }
      }
    } catch {
      // Ignore storage errors
    }
  }
  return null;
}

export function setCachedPhotosForQuery(query: string, urls: string[]): void {
  const key = query.toLowerCase().trim();
  clientGooglePhotosCache.set(key, urls);
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(SESSION_CACHE_PREFIX + key, JSON.stringify(urls));
    } catch {
      // Ignore storage quota errors
    }
  }
}

const CURATED_FOOD_PRESETS: Record<string, string[]> = {
  bakery: [
    "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1080&q=80",
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1080&q=80",
  ],
  cinnamon_roll: [
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1080&q=80",
  ],
  ramen: [
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1080&q=80",
    "https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=1080&q=80",
  ],
  pizza: [
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1080&q=80",
    "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=1080&q=80",
  ],
  tacos: [
    "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1080&q=80",
    "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1080&q=80",
  ],
  coffee: [
    "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=1080&q=80",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1080&q=80",
  ],
  k_chicken: [
    "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=1080&q=80",
  ],
  cheesesteak: [
    "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1080&q=80",
  ],
};

export function QuickDishEditModal({
  dish,
  spotName,
  onSave,
  onClose,
}: QuickDishEditModalProps) {
  const [dishName, setDishName] = useState(dish.dish_name);
  const [priceNok, setPriceNok] = useState<number | string>(dish.price_nok ?? "");
  const [category, setCategory] = useState(dish.category);
  const [dishImage, setDishImage] = useState(dish.dish_image || "");
  const [originalBeforeRemixImage, setOriginalBeforeRemixImage] = useState(dish.dish_image || "");
  const [reviewText, setReviewText] = useState(dish.review_text || "");
  const [tasteTagsStr, setTasteTagsStr] = useState((dish.taste_tags || []).join(", "));
  const [isVerified, setIsVerified] = useState(dish.is_verified_food_photo);
  const [imgError, setImgError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Source selection tabs
  const [activeTab, setActiveTab] = useState<"restyle" | "google" | "url" | "presets">("restyle");

  // Google Places Photos state (initialized synchronously from cache if available)
  const initialQuery = `${spotName} Oslo`;
  const [googleQuery, setGoogleQuery] = useState(initialQuery);
  const [googlePhotos, setGooglePhotos] = useState<string[]>(
    () => getCachedPhotosForQuery(initialQuery) || []
  );
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isCachedResult, setIsCachedResult] = useState<boolean>(
    () => getCachedPhotosForQuery(initialQuery) !== null
  );

  // AI Angle & Background Shift state (Preserves 100% of original vessel & food)
  const initialRemixDefaults = resolveCategoryRemixDefaults(dish.category, dish.dish_name);
  const [anglePreset, setAnglePreset] = useState<AnglePresetId>(initialRemixDefaults.defaultAngle);
  const [environmentPreset, setEnvironmentPreset] = useState<EnvironmentPresetId>(
    initialRemixDefaults.defaultEnvironment
  );
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformedImageUrl, setTransformedImageUrl] = useState<string | null>(null);
  const [extractedCulinaryDna, setExtractedCulinaryDna] = useState<string | null>(null);
  const [transformError, setTransformError] = useState<string | null>(null);

  const fetchGooglePhotos = async (query: string, forceRefresh = false) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    if (!forceRefresh) {
      const cached = getCachedPhotosForQuery(trimmed);
      if (cached) {
        setGooglePhotos(cached);
        setIsCachedResult(true);
        return;
      }
    }

    setIsLoadingGoogle(true);
    try {
      const url = `/api/places/search?q=${encodeURIComponent(trimmed)}${
        forceRefresh ? "&refresh=1" : ""
      }`;
      const res = await fetch(url);
      const data = await res.json();
      const place = data?.places?.[0] || data?.place;
      const rawPhotos = place?.photos || [];

      const photoUrls = rawPhotos
        .map((p: any) => {
          const ref = p.name || p.photo_reference || p;
          if (typeof ref === "string" && ref.startsWith("places/")) {
            return `/api/places/photos?ref=${encodeURIComponent(ref)}&w=640`;
          }
          return null;
        })
        .filter((u: any): u is string => Boolean(u));

      setCachedPhotosForQuery(trimmed, photoUrls);
      setGooglePhotos(photoUrls);
      setIsCachedResult(Boolean(data?.cached));
    } catch (err) {
      console.warn("Failed to fetch Google photos:", err);
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  useEffect(() => {
    if (activeTab === "google" && getCachedPhotosForQuery(googleQuery) === null) {
      void fetchGooglePhotos(googleQuery, false);
    }
  }, [activeTab]);

  const handleSelectPhoto = (url: string) => {
    setDishImage(url);
    setOriginalBeforeRemixImage(url);
    setTransformedImageUrl(null);
    setImgError(false);
    setIsVerified(true);
  };

  // Run True Multimodal Camera & Background Shift (Nano Banana Lite)
  const handleRunAiTransform = async () => {
    const sourceUrl = originalBeforeRemixImage || dishImage;
    if (!sourceUrl) {
      setTransformError("Select or paste a reference dish image first before running AI Shift.");
      return;
    }

    setIsTransforming(true);
    setTransformError(null);

    try {
      const res = await fetch("/api/admin/transform-dish-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: sourceUrl,
          dishName,
          category,
          anglePreset,
          environmentPreset,
          variationSeed: Math.floor(1000 + Math.random() * 9000),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.imageUrl) {
        throw new Error(data.error || "Transformation failed");
      }

      setTransformedImageUrl(data.imageUrl);
      setExtractedCulinaryDna(data.extractedCulinaryDna || null);
    } catch (err: any) {
      setTransformError(err.message || "AI transformation failed");
    } finally {
      setIsTransforming(false);
    }
  };

  const handleAcceptRestyledImage = () => {
    if (!transformedImageUrl) return;
    setDishImage(transformedImageUrl);
    setImgError(false);
    setIsVerified(true);
  };

  const handleRevertToOriginal = () => {
    setDishImage(originalBeforeRemixImage);
    setTransformedImageUrl(null);
    setImgError(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const parsedPrice = priceNok === "" ? null : Number(priceNok);
      const parsedTags = tasteTagsStr
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      await onSave({
        dish_name: dishName.trim(),
        price_nok: isNaN(Number(parsedPrice)) ? null : parsedPrice,
        category: category.trim(),
        dish_image: dishImage.trim(),
        review_text: reviewText.trim(),
        taste_tags: parsedTags,
        is_verified_food_photo: isVerified && !imgError,
      });
      onClose();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const presetsForCategory = CURATED_FOOD_PRESETS[category] || CURATED_FOOD_PRESETS.bakery;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-[#FAF7F2] border border-[#EAE5DC] text-[#181615] shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE5DC] bg-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#E84A27] bg-[#E84A27]/10 px-2 py-0.5 rounded-full">
                Dish & AI Camera Studio
              </span>
              <span className="text-xs font-bold text-zinc-500">{spotName}</span>
            </div>
            <h3 className="font-comico font-black text-lg text-[#181615] tracking-wide mt-0.5 truncate max-w-[440px]">
              {dishName || "Unnamed Dish"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-[#181615] hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* ── LIVE PHOTO HERO OR SIDE-BY-SIDE COMPARISON ── */}
          {transformedImageUrl ? (
            <div className="space-y-3 p-4 rounded-2xl bg-white border-2 border-[#E84A27]/40 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#E84A27] uppercase tracking-wider">
                  ✨ Before vs. After (Same Vessel & Food — New Angle & Surface)
                </span>
                {dishImage === transformedImageUrl && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    ✓ Active on Card
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Before (Reference) */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-zinc-500 block">
                    Original Reference (100% Locked Vessel & Food)
                  </span>
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#EAE5DC] border border-[#DDD6C9]">
                    {originalBeforeRemixImage && (
                      <Image
                        src={originalBeforeRemixImage}
                        alt="Original Reference"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    )}
                  </div>
                </div>

                {/* After (AI Restyled) */}
                <div className="space-y-1">
                  <span className="text-[11px] font-black text-emerald-700 block">
                    ✨ Re-Angled Smartphone Photo
                  </span>
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#EAE5DC] border-2 border-emerald-500 shadow-md">
                    <Image
                      src={transformedImageUrl}
                      alt="AI Re-Angled Dish"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>

              {extractedCulinaryDna && (
                <p className="text-[11px] text-zinc-600 bg-[#FAF7F2] p-2.5 rounded-xl border border-[#EAE5DC] leading-relaxed">
                  <strong className="text-[#181615]">Multimodal Reference Lock:</strong>{" "}
                  {extractedCulinaryDna}
                </p>
              )}

              {/* Comparison Actions (Clean single emoji per button) */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleAcceptRestyledImage}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    dishImage === transformedImageUrl
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-[#E84A27] hover:bg-[#d03d1b] text-white shadow-sm"
                  }`}
                >
                  <span>
                    {dishImage === transformedImageUrl
                      ? "✅ Using Restyled Image (Click Save Dish Below)"
                      : "✅ Use Restyled Image"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleRunAiTransform}
                  disabled={isTransforming}
                  className="py-2 px-3 rounded-xl bg-[#FAF7F2] hover:bg-[#EAE5DC] border border-[#DDD6C9] text-xs font-bold text-[#181615] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span>{isTransforming ? "⏳ Re-Rolling..." : "🔄 Re-Roll Variation"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRevertToOriginal}
                  className="py-2 px-3 rounded-xl bg-white hover:bg-zinc-100 border border-[#DDD6C9] text-xs font-bold text-zinc-600 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>↩️ Revert</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#EAE5DC] border border-[#DDD6C9] shadow-inner">
              {dishImage && !imgError ? (
                <Image
                  src={dishImage}
                  alt={dishName}
                  fill
                  unoptimized
                  className="object-cover"
                  onError={() => {
                    setImgError(true);
                    setIsVerified(false);
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full text-zinc-400 gap-2">
                  <ImageIcon className="w-10 h-10 opacity-40" />
                  <span className="text-xs font-semibold">
                    {imgError ? "⚠️ Image failed to load" : "No image selected"}
                  </span>
                </div>
              )}

              {/* Dark gradient overlay at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent pointer-events-none" />

              {/* Overlaid Status Badge top-left */}
              <div className="absolute top-3 left-3 z-10">
                {isVerified && !imgError ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-md">
                    <Check className="w-3.5 h-3.5" /> Verified Food Macro
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-black shadow-md">
                    <AlertTriangle className="w-3.5 h-3.5" /> Unverified / Missing
                  </span>
                )}
              </div>

              {/* Price Pill bottom-right */}
              {priceNok && (
                <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-[#E84A27] text-white font-black text-xs shadow-md">
                  {priceNok} NOK
                </div>
              )}

              {/* Comico Title Overlay on Photo */}
              <div className="absolute bottom-3 left-3 right-20 z-10 pointer-events-none">
                <h4 className="font-comico font-black text-xl text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] truncate">
                  {dishName}
                </h4>
              </div>
            </div>
          )}

          {/* ── PHOTO & AI REMIX TABS ── */}
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-1 bg-[#EFEAE1] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab("restyle")}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "restyle"
                    ? "bg-[#E84A27] text-white shadow-xs"
                    : "text-[#181615] hover:bg-white/60"
                }`}
              >
                <span>✨ AI Angle Shift</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("google")}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "google"
                    ? "bg-white text-[#181615] shadow-xs"
                    : "text-zinc-600 hover:text-[#181615]"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Google ({googlePhotos.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("url")}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "url"
                    ? "bg-white text-[#181615] shadow-xs"
                    : "text-zinc-600 hover:text-[#181615]"
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Direct URL</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("presets")}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "presets"
                    ? "bg-white text-[#181615] shadow-xs"
                    : "text-zinc-600 hover:text-[#181615]"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Presets</span>
              </button>
            </div>

            {/* Tab 0: ✨ AI Angle & Background Shift (Multimodal Input) */}
            {activeTab === "restyle" && (
              <div className="p-4 rounded-2xl bg-white border border-[#EAE5DC] space-y-3.5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#FAF7F2]">
                  <div>
                    <span className="text-xs font-black text-[#181615] block">
                      ✨ AI Angle & Background Shift
                    </span>
                    <span className="text-[11px] text-zinc-500 block mt-0.5">
                      Passes reference image directly to Nano Banana Lite. Keeps 100% of original bowl/plate & food, zero added props.
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-extrabold text-emerald-700">
                    Nano Banana Lite
                  </span>
                </div>

                {/* 1. Camera Angle Shift */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                    1. Camera Angle Shift
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {(Object.keys(ANGLE_PRESETS) as AnglePresetId[]).map((id) => {
                      const opt = ANGLE_PRESETS[id];
                      const active = anglePreset === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setAnglePreset(id)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            active
                              ? "bg-[#181615] text-white border-[#181615] shadow-xs"
                              : "bg-[#FAF7F2] text-zinc-700 border-[#DDD6C9] hover:border-[#181615]"
                          }`}
                        >
                          {opt.shortLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Background Table Surface */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                    2. Background Table Surface (Original Bowl/Vessel Locked)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(ENVIRONMENT_PRESETS) as EnvironmentPresetId[]).map((id) => {
                      const opt = ENVIRONMENT_PRESETS[id];
                      const active = environmentPreset === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setEnvironmentPreset(id)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            active
                              ? "bg-[#181615] text-white border-[#181615] shadow-xs"
                              : "bg-[#FAF7F2] text-zinc-700 border-[#DDD6C9] hover:border-[#181615]"
                          }`}
                        >
                          {opt.shortLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {transformError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                    ⚠️ {transformError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleRunAiTransform}
                  disabled={isTransforming || !dishImage}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#E84A27] hover:bg-[#d03d1b] text-white font-black text-xs shadow-md shadow-[#E84A27]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isTransforming ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Shifting Camera Angle & Surface (Preserving Exact Vessel & Food)...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>✨ Shift Camera Angle & Table Surface</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Tab 1: Google Places Browser (Cached Fetch-Once) */}
            {activeTab === "google" && (
              <div className="p-3.5 rounded-2xl bg-white border border-[#EAE5DC] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={googleQuery}
                      onChange={(e) => setGoogleQuery(e.target.value)}
                      placeholder="Search Google Places..."
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-[#FAF7F2] border border-[#DDD6C9] text-[#181615] focus:outline-none focus:border-[#E84A27]"
                    />
                    <button
                      type="button"
                      onClick={() => fetchGooglePhotos(googleQuery, false)}
                      disabled={isLoadingGoogle}
                      className="px-3 py-1.5 rounded-lg bg-[#181615] hover:bg-black text-white text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Search className={`w-3 h-3 ${isLoadingGoogle ? "animate-spin" : ""}`} />
                      <span>Search</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fetchGooglePhotos(googleQuery, true)}
                      disabled={isLoadingGoogle}
                      title="Force fresh API call from Google Places"
                      className="p-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#EAE5DC] border border-[#DDD6C9] text-zinc-600 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGoogle ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                </div>

                {isCachedResult && googlePhotos.length > 0 && (
                  <p className="text-[10.5px] text-emerald-700 font-semibold">
                    ⚡ Loaded from persistent cache (0 Google API cost).
                  </p>
                )}

                {isLoadingGoogle ? (
                  <div className="py-6 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#E84A27]" />
                    <span>Fetching Google user photos once...</span>
                  </div>
                ) : googlePhotos.length === 0 ? (
                  <div className="py-4 text-center text-xs text-zinc-500">
                    No Google Places photos returned for this spot. Use Direct URL + AI Angle Shift.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1">
                    {googlePhotos.map((photoUrl, idx) => (
                      <button
                        key={photoUrl + idx}
                        type="button"
                        onClick={() => handleSelectPhoto(photoUrl)}
                        className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-transform hover:scale-105 cursor-pointer ${
                          dishImage === photoUrl
                            ? "border-[#E84A27] ring-2 ring-[#E84A27]/30"
                            : "border-transparent"
                        }`}
                      >
                        <Image
                          src={photoUrl}
                          alt="Google Place Photo"
                          fill
                          unoptimized
                          className="object-cover"
                        />
                        {dishImage === photoUrl && (
                          <div className="absolute inset-0 bg-[#E84A27]/30 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white drop-shadow-md" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Direct URL Input */}
            {activeTab === "url" && (
              <div className="p-3.5 rounded-2xl bg-white border border-[#EAE5DC] space-y-2">
                <label className="block text-xs font-bold text-[#181615]">
                  Paste Wolt, Foodora, or Website Reference Photo URL
                </label>
                <input
                  type="url"
                  value={dishImage}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDishImage(val);
                    setOriginalBeforeRemixImage(val);
                    setTransformedImageUrl(null);
                    setImgError(false);
                    if (val.startsWith("http")) setIsVerified(true);
                  }}
                  placeholder="https://imageproxy.wolt.com/... or https://..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#FAF7F2] border border-[#DDD6C9] text-[#181615] focus:outline-none focus:border-[#E84A27]"
                />
                <p className="text-[11px] text-zinc-500">
                  Tip: Paste any Wolt/Foodora reference URL here, then switch to{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("restyle")}
                    className="text-[#E84A27] font-bold underline cursor-pointer"
                  >
                    ✨ AI Angle Shift
                  </button>{" "}
                  to shift the camera angle and table surface.
                </p>
              </div>
            )}

            {/* Tab 3: Curated Presets */}
            {activeTab === "presets" && (
              <div className="p-3.5 rounded-2xl bg-white border border-[#EAE5DC] space-y-2">
                <span className="text-xs font-bold text-[#181615] block">
                  Curated Category Presets ({category})
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {presetsForCategory.map((presetUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPhoto(presetUrl)}
                      className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-transform hover:scale-105 cursor-pointer ${
                        dishImage === presetUrl
                          ? "border-[#E84A27] ring-2 ring-[#E84A27]/30"
                          : "border-transparent"
                      }`}
                    >
                      <Image
                        src={presetUrl}
                        alt="Preset Food"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── METADATA INPUTS ── */}
          <div className="space-y-3.5 bg-white p-4 rounded-2xl border border-[#EAE5DC]">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-zinc-700 mb-1">Dish Name</label>
                <input
                  type="text"
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-[#FAF7F2] border border-[#DDD6C9] text-[#181615] focus:outline-none focus:border-[#E84A27]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Price (NOK)</label>
                <input
                  type="number"
                  value={priceNok}
                  onChange={(e) => setPriceNok(e.target.value)}
                  placeholder="185"
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-[#FAF7F2] border border-[#DDD6C9] text-[#181615] focus:outline-none focus:border-[#E84A27]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-[#FAF7F2] border border-[#DDD6C9] text-[#181615] focus:outline-none focus:border-[#E84A27]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Taste Tags</label>
                <input
                  type="text"
                  value={tasteTagsStr}
                  onChange={(e) => setTasteTagsStr(e.target.value)}
                  placeholder="crispy, spicy, grilled"
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-[#FAF7F2] border border-[#DDD6C9] text-[#181615] focus:outline-none focus:border-[#E84A27]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Culinary Review & Soundbite
              </label>
              <textarea
                rows={2}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F2] border border-[#DDD6C9] text-[#181615] focus:outline-none focus:border-[#E84A27] resize-none"
              />
            </div>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF7F2] border border-[#DDD6C9] cursor-pointer">
              <input
                type="checkbox"
                checked={isVerified && !imgError}
                onChange={(e) => setIsVerified(e.target.checked)}
                className="w-4 h-4 rounded text-[#E84A27] focus:ring-[#E84A27]"
              />
              <div className="text-xs">
                <span className="font-bold text-[#181615] block">Verified Plated Food Photo</span>
                <span className="text-zinc-500 text-[11px]">
                  Confirm this photo is a macro shot of the food itself (no storefronts or clip-art).
                </span>
              </div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAE5DC]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold rounded-xl text-zinc-500 hover:text-[#181615] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 text-xs font-black rounded-xl bg-[#E84A27] hover:bg-[#d03d1b] text-white transition-all shadow-md shadow-[#E84A27]/25 flex items-center gap-1.5 cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save Dish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
