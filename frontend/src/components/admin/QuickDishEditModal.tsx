"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Upload,
  Pencil,
  Tag,
  Globe,
} from "lucide-react";
import { uploadAdminImage } from "@/lib/adminUpload";
import type { StagedDishHighlight } from "@/app/api/admin/seeding-lab/route";
import {
  detectImageSource,
  getSourceBadgeMeta,
  isDeliveryAppImageUrl,
  type DishImageSource,
  type PhotoVisionTag,
} from "@/lib/admin/imageSource";
import type { WebSearchImageResult } from "@/app/api/admin/search-dish-web-images/route";
import type { ScrapedWebsitePhoto } from "@/app/api/admin/scrape-website-photos/route";
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
  spotId?: string;
  neighborhood?: string;
  websiteUrl?: string | null;
  isPopup?: boolean;
  candidatePhotos?: string[];
  photoVisionTags?: Record<string, PhotoVisionTag>;
  onPruneCandidatePhoto?: (photoUrl: string) => Promise<void> | void;
  onSetSpotCover?: (photoUrl: string) => Promise<void> | void;
  onAddCandidatePhotos?: (urls: string[], source: DishImageSource) => Promise<void> | void;
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
  spotId = "",
  neighborhood = "",
  websiteUrl = null,
  isPopup = false,
  candidatePhotos = [],
  photoVisionTags = {},
  onPruneCandidatePhoto,
  onSetSpotCover,
  onAddCandidatePhotos,
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
  const [imageSource, setImageSource] = useState<DishImageSource>(
    dish.image_source || detectImageSource(dish.dish_image)
  );
  const [sourceUrl, setSourceUrl] = useState<string | null>(dish.source_url || null);
  const [isAiEnhanced, setIsAiEnhanced] = useState<boolean>(Boolean(dish.is_ai_enhanced));
  const [imgError, setImgError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [coverToastUrl, setCoverToastUrl] = useState<string | null>(null);
  const [pruningUrl, setPruningUrl] = useState<string | null>(null);

  const hasFoodTagged = candidatePhotos.some((u) => photoVisionTags[u]?.bucket === "food");
  const [poolFilter, setPoolFilter] = useState<"all" | "food" | "venue_vibe">(
    hasFoodTagged ? "food" : "all"
  );

  // Default to Pool / Upload whenever candidate photos exist or for pop-ups
  const [activeTab, setActiveTab] = useState<
    "upload" | "web_search" | "website" | "restyle" | "google" | "url" | "presets"
  >(
    isPopup || candidatePhotos.length > 0
      ? "upload"
      : !dish.dish_image || !dish.is_verified_food_photo
      ? "web_search"
      : "restyle"
  );
  const [activeField, setActiveField] = useState<"photo" | "name" | "price" | "meta">("photo");

  // Per-Dish Web Image Search (Serper.dev / SerpApi fallback)
  const [webMode, setWebMode] = useState<"dish" | "venue_cover">("dish");
  const [webQuery, setWebQuery] = useState(`${spotName} ${dish.dish_name} Oslo`.trim());
  const [webResults, setWebResults] = useState<WebSearchImageResult[]>([]);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);
  const [webSearchError, setWebSearchError] = useState<string | null>(null);
  const [webProvider, setWebProvider] = useState<string | null>(null);
  const [hasRunWebSearch, setHasRunWebSearch] = useState(false);

  // Direct Restaurant Website Scraper
  const cleanInitialWebsite =
    websiteUrl && !/instagram\.com/i.test(websiteUrl) ? websiteUrl : "";
  const [siteUrlInput, setSiteUrlInput] = useState(cleanInitialWebsite);
  const [sitePhotos, setSitePhotos] = useState<ScrapedWebsitePhoto[]>([]);
  const [isScrapingSite, setIsScrapingSite] = useState(false);
  const [siteScrapeError, setSiteScrapeError] = useState<string | null>(null);
  const [sitePagesCrawled, setSitePagesCrawled] = useState<number>(0);
  const [isIngestingExternal, setIsIngestingExternal] = useState(false);

  const handleSelectExternalPhoto = async (params: {
    imageUrl: string;
    thumbnailUrl?: string;
    pageUrl?: string;
    source: DishImageSource;
    asCover?: boolean;
  }) => {
    const previewUrl = params.thumbnailUrl || params.imageUrl;
    if (!params.asCover) {
      // Show working preview immediately so Instagram/hotlink-blocked URLs never flash an error
      handleSelectPhoto(previewUrl, params.source);
    }
    setIsIngestingExternal(true);
    setWebSearchError(null);
    try {
      const res = await fetch("/api/admin/ingest-external-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: params.imageUrl,
          thumbnailUrl: params.thumbnailUrl,
          pageUrl: params.pageUrl,
        }),
      });
      const data = await res.json();
      const finalUrl = res.ok && data?.publicUrl ? (data.publicUrl as string) : previewUrl;

      if (params.asCover) {
        if (onSetSpotCover) await onSetSpotCover(finalUrl);
        if (onAddCandidatePhotos) void onAddCandidatePhotos([finalUrl], params.source);
        setCoverToastUrl(params.imageUrl);
        window.setTimeout(() => setCoverToastUrl(null), 1800);
      } else {
        setDishImage(finalUrl);
        setOriginalBeforeRemixImage(finalUrl);
        setTransformedImageUrl(null);
        setImageSource(params.source);
        setSourceUrl(params.imageUrl);
        setImgError(false);
        setIsVerified(true);
        if (onAddCandidatePhotos) void onAddCandidatePhotos([finalUrl], params.source);
      }
    } catch {
      if (params.asCover && onSetSpotCover) {
        await onSetSpotCover(previewUrl);
      }
    } finally {
      setIsIngestingExternal(false);
    }
  };

  const handleRunWebSearch = async (opts?: {
    overrideMode?: "dish" | "venue_cover";
    overrideQuery?: string;
    useStructuredDefault?: boolean;
  }) => {
    const modeToUse = opts?.overrideMode ?? webMode;
    const queryToUse = (opts?.overrideQuery ?? webQuery).trim();
    setIsSearchingWeb(true);
    setWebSearchError(null);
    setHasRunWebSearch(true);
    try {
      const res = await fetch("/api/admin/search-dish-web-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spotName,
          dishName,
          neighborhood,
          mode: modeToUse,
          ...(opts?.useStructuredDefault ? {} : { customQuery: queryToUse }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Web image search failed");
      setWebResults(Array.isArray(data.results) ? data.results : []);
      setWebProvider(data.provider || null);
    } catch (err: any) {
      setWebSearchError(err?.message || "Web search failed.");
    } finally {
      setIsSearchingWeb(false);
    }
  };

  useEffect(() => {
    if (activeTab === "web_search" && !hasRunWebSearch && !isSearchingWeb) {
      void handleRunWebSearch({ useStructuredDefault: true });
    }
  }, [activeTab]);

  const handleScrapeWebsite = async () => {
    const target = siteUrlInput.trim();
    if (!target) {
      setSiteScrapeError("Paste the restaurant website URL first.");
      return;
    }
    setIsScrapingSite(true);
    setSiteScrapeError(null);
    try {
      const res = await fetch("/api/admin/scrape-website-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteUrl: target,
          spotName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Website scrape failed");
      const photos: ScrapedWebsitePhoto[] = Array.isArray(data.photos) ? data.photos : [];
      setSitePhotos(photos);
      setSitePagesCrawled(Array.isArray(data.pagesCrawled) ? data.pagesCrawled.length : 1);
      if (photos.length > 0 && onAddCandidatePhotos) {
        void onAddCandidatePhotos(
          photos.slice(0, 12).map((p) => p.url),
          "website"
        );
      }
    } catch (err: any) {
      setSiteScrapeError(err?.message || "Could not scrape website photos.");
    } finally {
      setIsScrapingSite(false);
    }
  };

  // Direct File Upload & Clipboard Paste state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const { url, error } = await uploadAdminImage(file, {
        spotId: spotId || spotName,
        dishId: dish.id || dishName,
      });
      if (!url) throw new Error(error || "Upload failed");

      const newUrl = url;
      setDishImage(newUrl);
      setOriginalBeforeRemixImage(newUrl);
      setTransformedImageUrl(null);
      setImageSource("upload");
      setSourceUrl(newUrl);
      setIsAiEnhanced(false);
      setImgError(false);
      setIsVerified(true);
      setActiveTab("upload");

      // Auto-save the verified photo to the candidate spot immediately
      await onSave({
        dish_image: newUrl,
        is_verified_food_photo: true,
        image_source: "upload",
        source_url: newUrl,
        is_ai_enhanced: false,
      });
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  // Clipboard paste listener: catches Ctrl+V screenshot paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            void uploadFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [spotId, spotName, dish.id, dishName]);

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

  const handleSelectPhoto = (url: string, sourceHint?: DishImageSource) => {
    const tagSource = photoVisionTags[url]?.source;
    const detected = detectImageSource(url, sourceHint || tagSource);
    setDishImage(url);
    setOriginalBeforeRemixImage(url);
    setTransformedImageUrl(null);
    setImageSource(detected);
    setSourceUrl(url);
    setIsAiEnhanced(detected === "ai_polish");
    setImgError(false);
    setIsVerified(!isDeliveryAppImageUrl(url));
  };

  const isBlockedForAiShift = isDeliveryAppImageUrl(originalBeforeRemixImage || dishImage);

  // Run Direct Multimodal Polish / Camera Shift (Nano Banana Lite)
  const handleRunAiTransform = async () => {
    const sourceCandidate = originalBeforeRemixImage || dishImage;
    if (!sourceCandidate) {
      setTransformError("Select or paste a reference dish image first before running AI Polish.");
      return;
    }
    if (isDeliveryAppImageUrl(sourceCandidate)) {
      setTransformError(
        "Wolt/Foodora photos cannot be AI-shifted — pick a Google Maps, kitchen, or uploaded photo instead."
      );
      return;
    }

    setIsTransforming(true);
    setTransformError(null);

    try {
      const res = await fetch("/api/admin/transform-dish-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: sourceCandidate,
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
    setImageSource("ai_polish");
    setIsAiEnhanced(true);
    setImgError(false);
    setIsVerified(true);
  };

  const handleRevertToOriginal = () => {
    setDishImage(originalBeforeRemixImage);
    setImageSource(detectImageSource(originalBeforeRemixImage));
    setIsAiEnhanced(false);
    setTransformedImageUrl(null);
    setImgError(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    try {
      const parsedPrice = priceNok === "" ? null : Number(priceNok);
      const parsedTags = tasteTagsStr
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      const trimmedImg = dishImage.trim();
      const finalSource = detectImageSource(trimmedImg, imageSource);

      await onSave({
        dish_name: dishName.trim(),
        price_nok: isNaN(Number(parsedPrice)) ? null : parsedPrice,
        category: category.trim(),
        dish_image: trimmedImg,
        review_text: reviewText.trim(),
        taste_tags: parsedTags,
        is_verified_food_photo: isVerified && !imgError && !isDeliveryAppImageUrl(trimmedImg),
        image_source: finalSource,
        source_url: sourceUrl || trimmedImg || null,
        is_ai_enhanced: isAiEnhanced || finalSource === "ai_polish",
      });
      onClose();
    } catch (err: any) {
      console.error("Save error:", err);
      setSaveError(err?.message || "Failed to save dish changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const foodPoolCount = candidatePhotos.filter((u) => photoVisionTags[u]?.bucket === "food").length;
  const vibePoolCount = candidatePhotos.filter(
    (u) => photoVisionTags[u]?.bucket === "venue_vibe"
  ).length;
  const filteredPoolPhotos = candidatePhotos.filter((u) => {
    if (poolFilter === "all") return true;
    const tag = photoVisionTags[u];
    if (poolFilter === "food") return tag?.bucket === "food";
    return tag?.bucket === "venue_vibe";
  });

  const presetsForCategory = CURATED_FOOD_PRESETS[category] || CURATED_FOOD_PRESETS.bakery;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-t-3xl sm:rounded-3xl bg-[#FAF7F2] border border-[#EAE5DC] text-[#181615] shadow-2xl flex flex-col max-h-[92dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[#EAE5DC] bg-white shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#E84A27] bg-[#E84A27]/10 px-2 py-0.5 rounded-full">
                Dish Studio
              </span>
              <span className="text-xs font-bold text-zinc-500 truncate">{spotName}</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Tap dish photo, name, price, or tags directly on the preview card to edit.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl text-zinc-400 hover:text-[#181615] hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 overflow-y-auto no-scrollbar flex-1">
          {/* ── LIVE PHOTO HERO OR SIDE-BY-SIDE COMPARISON ── */}
          {transformedImageUrl ? (
            <div className="space-y-3 p-4 rounded-2xl bg-white border-2 border-[#E84A27]/40 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#E84A27] uppercase tracking-wider">
                  {anglePreset === "preserve_food_clean_scene"
                    ? "✨ Before vs. After (Food Locked · Clean Surroundings)"
                    : "✨ Before vs. After (Same Vessel & Food — New Angle & Surface)"}
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
            <div className="space-y-3">
              {/* Interactive 4:3 Dish Preview — click elements directly to edit */}
              <div
                onClick={() => {
                  if (activeField !== "name" && activeField !== "price") {
                    setActiveField("photo");
                  }
                }}
                className="group relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#EAE5DC] border border-[#DDD6C9] shadow-inner cursor-pointer"
              >
                {dishImage && !imgError ? (
                  <Image
                    src={dishImage}
                    alt={dishName}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.015]"
                    onError={() => {
                      setImgError(true);
                      setIsVerified(false);
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full text-zinc-400 gap-2">
                    <ImageIcon className="w-10 h-10 opacity-40" />
                    <span className="text-xs font-semibold">
                      {imgError ? "Image failed to load — tap to replace" : "Tap to add dish photo"}
                    </span>
                  </div>
                )}

                {/* Dark gradient overlay at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent pointer-events-none" />

                {/* Top-Left Verified Toggle */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsVerified((v) => !v);
                  }}
                  title="Toggle verified food macro status"
                  className={`absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-md transition-transform active:scale-95 cursor-pointer ${
                    isVerified && !imgError
                      ? "bg-emerald-500 text-white"
                      : "bg-amber-400 text-[#181615]"
                  }`}
                >
                  {isVerified && !imgError ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Verified Photo</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Unverified</span>
                    </>
                  )}
                </button>

                {/* Top-Right Photo Trigger Pill */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveField("photo");
                  }}
                  className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/65 hover:bg-black/85 text-white text-[11px] font-bold backdrop-blur-xs border border-white/15 cursor-pointer transition-colors"
                >
                  <Camera className="w-3 h-3 text-[#E84A27]" />
                  <span>Change Photo</span>
                </button>

                {/* Bottom-Right Price Pill (Inline Click-to-Edit) */}
                <div
                  className="absolute bottom-3 right-3 z-20"
                  onClick={(e) => e.stopPropagation()}
                >
                  {activeField === "price" ? (
                    <div className="flex items-center gap-1 bg-white rounded-full px-2.5 py-1 shadow-lg border border-[#E84A27]">
                      <input
                        type="number"
                        autoFocus
                        value={priceNok}
                        onChange={(e) => setPriceNok(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            setActiveField("photo");
                          }
                        }}
                        placeholder="185"
                        className="w-16 text-xs font-black text-[#181615] bg-transparent focus:outline-none"
                      />
                      <span className="text-[10px] font-bold text-zinc-400">NOK</span>
                      <button
                        type="button"
                        onClick={() => setActiveField("photo")}
                        className="p-0.5 rounded-full bg-[#E84A27] text-white cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveField("price")}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E84A27] hover:bg-[#d03d1b] text-white font-black text-xs shadow-md cursor-pointer transition-transform active:scale-95"
                    >
                      <span>{priceNok ? `${priceNok} NOK` : "+ Price"}</span>
                      <Pencil className="w-2.5 h-2.5 opacity-80" />
                    </button>
                  )}
                </div>

                {/* Bottom-Left Comico Dish Name (Inline Click-to-Edit) */}
                <div
                  className="absolute bottom-3 left-3 right-28 z-20"
                  onClick={(e) => e.stopPropagation()}
                >
                  {activeField === "name" ? (
                    <div className="flex items-center gap-1.5 bg-white/95 rounded-xl px-2.5 py-1.5 shadow-lg border border-[#E84A27]">
                      <input
                        type="text"
                        autoFocus
                        value={dishName}
                        onChange={(e) => setDishName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            setActiveField("photo");
                          }
                        }}
                        placeholder="Dish name..."
                        className="w-full text-sm font-bold text-[#181615] bg-transparent focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setActiveField("photo")}
                        className="px-2 py-0.5 rounded-lg bg-[#E84A27] text-white text-[11px] font-bold shrink-0 cursor-pointer"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveField("name")}
                      className="group/title inline-flex items-center gap-1.5 max-w-full text-left cursor-pointer"
                    >
                      <h4 className="font-comico font-black text-lg sm:text-xl text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] truncate group-hover/title:underline decoration-[#E84A27] decoration-2 underline-offset-4">
                        {dishName || "Tap to name dish"}
                      </h4>
                      <Pencil className="w-3.5 h-3.5 text-white/80 shrink-0" />
                    </button>
                  )}
                </div>
              </div>

              {/* Interactive Review & Tags Pill Strip directly below Preview */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 rounded-2xl bg-white border border-[#EAE5DC]">
                <button
                  type="button"
                  onClick={() => setActiveField("meta")}
                  className="flex-1 min-w-0 text-left flex items-center gap-2 cursor-pointer group"
                >
                  <Tag className="w-3.5 h-3.5 text-[#E84A27] shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-black text-[#181615] capitalize">
                        {category.replace("_", " ")}
                      </span>
                      {tasteTagsStr.trim() && (
                        <span className="text-[11px] text-zinc-500 truncate">
                          · {tasteTagsStr}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 truncate">
                      {reviewText.trim() || "Tap to add insider tasting note..."}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0 bg-[#EFEAE1] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveField("photo")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      activeField === "photo"
                        ? "bg-[#181615] text-white"
                        : "text-zinc-600 hover:text-[#181615]"
                    }`}
                  >
                    Photo Studio
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveField("meta")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      activeField === "meta"
                        ? "bg-[#E84A27] text-white"
                        : "text-zinc-600 hover:text-[#181615]"
                    }`}
                  >
                    Note &amp; Tags
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── PHOTO & AI REMIX TABS (shown when Photo Studio active) ── */}
          {activeField !== "meta" && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1 bg-[#EFEAE1] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab("upload")}
                className={`flex-1 min-w-[100px] py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === "upload"
                    ? "bg-[#E84A27] text-white shadow-xs"
                    : "text-[#181615] hover:bg-white/60"
                }`}
              >
                <Upload className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Pool / Upload{candidatePhotos.length > 0 ? ` (${candidatePhotos.length})` : ""}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("web_search")}
                className={`flex-1 min-w-[100px] py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === "web_search"
                    ? "bg-teal-700 text-white shadow-xs"
                    : "text-[#181615] hover:bg-white/60"
                }`}
              >
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span>🌐 Web Search</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("website")}
                className={`flex-1 min-w-[100px] py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === "website"
                    ? "bg-amber-700 text-white shadow-xs"
                    : "text-[#181615] hover:bg-white/60"
                }`}
              >
                <span>🏠 Spot Website</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("restyle")}
                className={`flex-1 min-w-[90px] py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === "restyle"
                    ? "bg-[#181615] text-white shadow-xs"
                    : "text-zinc-600 hover:text-[#181615]"
                }`}
              >
                <span>✨ AI Polish</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("google")}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === "google"
                    ? "bg-white text-[#181615] shadow-xs"
                    : "text-zinc-600 hover:text-[#181615]"
                }`}
              >
                <Camera className="w-3 h-3" />
                <span>Maps ({googlePhotos.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("url")}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === "url"
                    ? "bg-white text-[#181615] shadow-xs"
                    : "text-zinc-600 hover:text-[#181615]"
                }`}
              >
                <LinkIcon className="w-3 h-3" />
                <span>URL</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("presets")}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === "presets"
                    ? "bg-white text-[#181615] shadow-xs"
                    : "text-zinc-600 hover:text-[#181615]"
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Presets</span>
              </button>
            </div>

            {/* Tab: 🌐 Web Image Search (Per-Dish Targeted Search via Serper / SerpApi) */}
            {activeTab === "web_search" && (
              <div className="p-4 rounded-2xl bg-white border border-[#EAE5DC] space-y-3 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#FAF7F2]">
                  <div>
                    <span className="text-xs font-black text-[#181615] block">
                      🌐 Targeted Web Image Search (Wolt &amp; Foodora Excluded)
                    </span>
                    <span className="text-[11px] text-zinc-500 block mt-0.5">
                      Searches Oslo blogs, restaurant sites, news &amp; reviews. Click any photo to assign and add to spot pool.
                    </span>
                  </div>
                  <div className="flex items-center gap-1 rounded-xl bg-[#FAF7F2] p-0.5 border border-[#EAE5DC]">
                    <button
                      type="button"
                      onClick={() => {
                        setWebMode("dish");
                        const q = `${spotName} ${dishName} Oslo`.trim();
                        setWebQuery(q);
                        void handleRunWebSearch({
                          overrideMode: "dish",
                          overrideQuery: q,
                          useStructuredDefault: true,
                        });
                      }}
                      className={`px-2 py-1 rounded-lg text-[10.5px] font-bold cursor-pointer ${
                        webMode === "dish" ? "bg-[#181615] text-white" : "text-zinc-600 hover:text-[#181615]"
                      }`}
                    >
                      🍽️ Dish Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWebMode("venue_cover");
                        const q = `${spotName} Oslo restaurant exterior interior`.trim();
                        setWebQuery(q);
                        void handleRunWebSearch({
                          overrideMode: "venue_cover",
                          overrideQuery: q,
                          useStructuredDefault: true,
                        });
                      }}
                      className={`px-2 py-1 rounded-lg text-[10.5px] font-bold cursor-pointer ${
                        webMode === "venue_cover" ? "bg-[#181615] text-white" : "text-zinc-600 hover:text-[#181615]"
                      }`}
                    >
                      🏠 Entrance / Interior Cover
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={webQuery}
                    onChange={(e) => setWebQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleRunWebSearch({ overrideQuery: webQuery });
                      }
                    }}
                    placeholder={`${spotName} ${dishName} Oslo`}
                    className="flex-1 min-w-0 px-3 py-2 text-xs font-semibold rounded-xl bg-[#FAF7F2] border border-[#DDD6C9] text-[#181615] focus:outline-none focus:border-teal-700"
                  />
                  <button
                    type="button"
                    onClick={() => void handleRunWebSearch({ overrideQuery: webQuery })}
                    disabled={isSearchingWeb}
                    className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <Search className={`w-3.5 h-3.5 ${isSearchingWeb ? "animate-spin" : ""}`} />
                    <span>{isSearchingWeb ? "Searching..." : "Search"}</span>
                  </button>
                </div>

                {webSearchError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{webSearchError}</span>
                  </div>
                )}

                {isSearchingWeb ? (
                  <div className="py-8 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-teal-700" />
                    <span>Searching clean web photos (excluding Wolt/Foodora)...</span>
                  </div>
                ) : webResults.length === 0 ? (
                  <p className="py-6 text-center text-xs text-zinc-500 bg-[#FAF7F2] rounded-xl border border-dashed border-[#DDD6C9]">
                    No clean web photos found for this query. Try broadening the dish name or removing quotes.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10.5px] text-zinc-500 font-semibold">
                      <span>{webResults.length} clean results{webProvider ? ` via ${webProvider}` : ""}</span>
                      <span>
                        {isIngestingExternal ? "Saving to Supabase CDN..." : "Click photo to assign · hover for Set Cover"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-1">
                      {webResults.map((item, idx) => {
                        const isSelected =
                          sourceUrl === item.imageUrl ||
                          dishImage === item.imageUrl ||
                          dishImage === item.thumbnailUrl;
                        const isCoverJustSet = coverToastUrl === item.imageUrl;
                        return (
                          <div
                            key={`web-${item.imageUrl}-${idx}`}
                            className={`group/web relative aspect-[4/3] rounded-xl overflow-hidden border-2 bg-[#F3EFE7] transition-transform hover:scale-[1.02] ${
                              isSelected
                                ? "border-[#E84A27] ring-2 ring-[#E84A27]/30"
                                : "border-transparent"
                            }`}
                          >
                            <button
                              type="button"
                              title={`${item.title || "Web result"} — ${item.domain}`}
                              onClick={() =>
                                void handleSelectExternalPhoto({
                                  imageUrl: item.imageUrl,
                                  thumbnailUrl: item.thumbnailUrl,
                                  pageUrl: item.pageUrl,
                                  source: "web_search",
                                })
                              }
                              className="relative w-full h-full block cursor-pointer"
                            >
                              <Image
                                src={item.thumbnailUrl || item.imageUrl}
                                alt={item.title || item.domain}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                              {isSelected && (
                                <div className="absolute inset-0 bg-[#E84A27]/30 flex items-center justify-center">
                                  <Check className="w-5 h-5 text-white drop-shadow-md" />
                                </div>
                              )}
                            </button>

                            {/* Domain pill */}
                            <span
                              title={item.pageUrl || item.domain}
                              className="pointer-events-none absolute top-1 left-1 right-12 truncate z-10 px-1.5 py-0.5 rounded-md bg-black/80 text-white text-[9px] font-bold leading-none"
                            >
                              {item.domain}
                            </span>

                            {/* Dimensions pill */}
                            {item.width && item.height && (
                              <span className="pointer-events-none absolute top-1 right-1 z-10 px-1 py-0.5 rounded bg-black/65 text-white/90 text-[8px] font-mono leading-none">
                                {item.width}×{item.height}
                              </span>
                            )}

                            {/* Bottom title caption + Set Cover hover button */}
                            <div className="pointer-events-none absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-1.5 pb-1 pt-4">
                              <p className="text-[9.5px] font-semibold text-white truncate pr-14">
                                {item.title || item.domain}
                              </p>
                            </div>

                            {onSetSpotCover && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleSelectExternalPhoto({
                                    imageUrl: item.imageUrl,
                                    thumbnailUrl: item.thumbnailUrl,
                                    pageUrl: item.pageUrl,
                                    source: "web_search",
                                    asCover: true,
                                  });
                                }}
                                title="Set as restaurant cover"
                                className={`absolute bottom-1 right-1 z-20 px-1.5 py-0.5 rounded-md text-[8.5px] font-black leading-none transition-opacity cursor-pointer ${
                                  isCoverJustSet
                                    ? "bg-emerald-600 text-white opacity-100"
                                    : "bg-black/80 hover:bg-[#E84A27] text-white opacity-95 sm:opacity-0 sm:group-hover/web:opacity-100"
                                }`}
                              >
                                {isCoverJustSet ? "✓ Cover" : "Set Cover"}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: 🏠 Direct Restaurant Website Scraper */}
            {activeTab === "website" && (
              <div className="p-4 rounded-2xl bg-white border border-[#EAE5DC] space-y-3 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#FAF7F2]">
                  <div>
                    <span className="text-xs font-black text-[#181615] block">
                      🏠 Direct Restaurant Website Scraper
                    </span>
                    <span className="text-[11px] text-zinc-500 block mt-0.5">
                      Crawls the homepage + up to 2 menu/gallery sub-pages for original restaurant photography (zero API cost).
                    </span>
                  </div>
                  {sitePagesCrawled > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-800">
                      {sitePagesCrawled} page{sitePagesCrawled === 1 ? "" : "s"} crawled
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={siteUrlInput}
                    onChange={(e) => setSiteUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleScrapeWebsite();
                      }
                    }}
                    placeholder="https://restaurantwebsite.no"
                    className="flex-1 min-w-0 px-3 py-2 text-xs font-semibold rounded-xl bg-[#FAF7F2] border border-[#DDD6C9] text-[#181615] focus:outline-none focus:border-amber-700"
                  />
                  <button
                    type="button"
                    onClick={() => void handleScrapeWebsite()}
                    disabled={isScrapingSite || !siteUrlInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-45"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScrapingSite ? "animate-spin" : ""}`} />
                    <span>{isScrapingSite ? "Scraping..." : "Scrape Website"}</span>
                  </button>
                </div>

                {siteScrapeError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{siteScrapeError}</span>
                  </div>
                )}

                {isScrapingSite ? (
                  <div className="py-8 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-700" />
                    <span>Crawling restaurant homepage, menu &amp; gallery pages...</span>
                  </div>
                ) : sitePhotos.length === 0 ? (
                  <p className="py-6 text-center text-xs text-zinc-500 bg-[#FAF7F2] rounded-xl border border-dashed border-[#DDD6C9]">
                    {siteUrlInput.trim()
                      ? "Click Scrape Website to extract original photos from this restaurant's site."
                      : "No website URL saved on this spot yet — paste one above and click Scrape Website."}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-1">
                    {sitePhotos.map((photo, idx) => {
                      const isSelected = dishImage === photo.url;
                      const isCoverJustSet = coverToastUrl === photo.url;
                      return (
                        <div
                          key={`site-${photo.url}-${idx}`}
                          className={`group/site relative aspect-[4/3] rounded-xl overflow-hidden border-2 bg-[#F3EFE7] transition-transform hover:scale-[1.02] ${
                            isSelected
                              ? "border-[#E84A27] ring-2 ring-[#E84A27]/30"
                              : "border-transparent"
                          }`}
                        >
                          <button
                            type="button"
                            title={photo.altText || photo.url}
                            onClick={() =>
                              void handleSelectExternalPhoto({
                                imageUrl: photo.url,
                                pageUrl: photo.pageUrl,
                                source: "website",
                              })
                            }
                            className="relative w-full h-full block cursor-pointer"
                          >
                            <Image
                              src={photo.url}
                              alt={photo.altText || `Website photo ${idx + 1}`}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-[#E84A27]/30 flex items-center justify-center">
                                <Check className="w-5 h-5 text-white drop-shadow-md" />
                              </div>
                            )}
                          </button>

                          <span className="pointer-events-none absolute top-1 left-1 z-10 px-1.5 py-0.5 rounded-md bg-amber-700/90 text-white text-[8.5px] font-black leading-none">
                            WEB
                          </span>

                          {photo.altText && (
                            <div className="pointer-events-none absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-1.5 pb-1 pt-4">
                              <p className="text-[9.5px] font-semibold text-white truncate pr-14">
                                {photo.altText}
                              </p>
                            </div>
                          )}

                          {onSetSpotCover && (
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await onSetSpotCover(photo.url);
                                setCoverToastUrl(photo.url);
                                window.setTimeout(() => setCoverToastUrl(null), 1800);
                              }}
                              title="Set as restaurant cover"
                              className={`absolute bottom-1 right-1 z-20 px-1.5 py-0.5 rounded-md text-[8.5px] font-black leading-none transition-opacity cursor-pointer ${
                                isCoverJustSet
                                  ? "bg-emerald-600 text-white opacity-100"
                                  : "bg-black/80 hover:bg-[#E84A27] text-white opacity-95 sm:opacity-0 sm:group-hover/site:opacity-100"
                              }`}
                            >
                              {isCoverJustSet ? "✓ Cover" : "Set Cover"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Pool & Direct Upload / Clipboard Paste */}
            {activeTab === "upload" && (
              <div className="p-4 rounded-2xl bg-white border border-[#EAE5DC] space-y-3.5 shadow-xs">
                {candidatePhotos.length > 0 && (
                  <div className="space-y-2.5 border-b border-[#EAE5DC] pb-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#181615]">
                        Spot Photo Pool ({filteredPoolPhotos.length}/{candidatePhotos.length})
                      </span>
                      <div className="flex items-center gap-1 rounded-xl bg-[#FAF7F2] p-0.5 border border-[#EAE5DC]">
                        {(
                          [
                            { id: "all", label: `All (${candidatePhotos.length})` },
                            { id: "food", label: `🍽️ Food (${foodPoolCount})` },
                            { id: "venue_vibe", label: `🏠 Entrance & Vibe (${vibePoolCount})` },
                          ] as const
                        ).map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setPoolFilter(f.id)}
                            className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer ${
                              poolFilter === f.id
                                ? "bg-[#181615] text-white"
                                : "text-zinc-600 hover:text-[#181615]"
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {filteredPoolPhotos.length === 0 ? (
                      <p className="text-[11px] text-zinc-500 py-3 text-center bg-[#FAF7F2] rounded-xl border border-dashed border-[#DDD6C9]">
                        No photos tagged in this bucket yet. Switch to All or run Vision Auto-Match on the spot.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1">
                        {filteredPoolPhotos.map((photoUrl, idx) => {
                          const tag = photoVisionTags[photoUrl];
                          const srcType = detectImageSource(photoUrl, tag?.source);
                          const badge = getSourceBadgeMeta(srcType);
                          const isSelected = dishImage === photoUrl;
                          const isCoverJustSet = coverToastUrl === photoUrl;

                          return (
                            <div
                              key={`pool-${photoUrl}-${idx}`}
                              className={`group/thumb relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-transform hover:scale-[1.02] ${
                                isSelected
                                  ? "border-[#E84A27] ring-2 ring-[#E84A27]/30"
                                  : badge.isWarning
                                  ? "border-rose-400/80"
                                  : "border-transparent"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleSelectPhoto(photoUrl, srcType)}
                                title={tag?.description || photoUrl}
                                className="relative w-full h-full block cursor-pointer"
                              >
                                <Image
                                  src={photoUrl}
                                  alt={tag?.description || `Pool photo ${idx + 1}`}
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                                {isSelected && (
                                  <div className="absolute inset-0 bg-[#E84A27]/30 flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white drop-shadow-md" />
                                  </div>
                                )}
                              </button>

                              {/* Top-left Source Domain Pill */}
                              <span
                                className={`pointer-events-none absolute top-1 left-1 z-10 px-1.5 py-0.5 rounded-md border text-[8.5px] font-black leading-none tracking-wide shadow-xs ${badge.className}`}
                              >
                                {badge.label}
                              </span>

                              {/* Top-right Prune / Blacklist button */}
                              {onPruneCandidatePhoto && (
                                <button
                                  type="button"
                                  disabled={pruningUrl === photoUrl}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setPruningUrl(photoUrl);
                                    try {
                                      await onPruneCandidatePhoto(photoUrl);
                                    } finally {
                                      setPruningUrl(null);
                                    }
                                  }}
                                  title="Remove bad photo from spot pool"
                                  className="absolute top-1 right-1 z-20 grid h-5 w-5 place-items-center rounded-full bg-black/75 text-white hover:bg-rose-600 transition-colors cursor-pointer opacity-90 sm:opacity-0 sm:group-hover/thumb:opacity-100"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}

                              {/* Bottom-left Vision Bucket indicator */}
                              {tag?.bucket && (
                                <span className="pointer-events-none absolute bottom-1 left-1 z-10 px-1.5 py-0.5 rounded-md bg-black/70 text-white text-[8.5px] font-bold leading-none">
                                  {tag.bucket === "food"
                                    ? "🍽️ Food"
                                    : tag.bucket === "venue_vibe"
                                    ? "🏠 Vibe"
                                    : "🗑️ Junk"}
                                </span>
                              )}

                              {/* Bottom-right Set as Spot Cover button */}
                              {onSetSpotCover && !badge.isWarning && (
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await onSetSpotCover(photoUrl);
                                    setCoverToastUrl(photoUrl);
                                    window.setTimeout(() => setCoverToastUrl(null), 1800);
                                  }}
                                  title="Set this photo as the restaurant cover"
                                  className={`absolute bottom-1 right-1 z-20 px-1.5 py-0.5 rounded-md text-[8.5px] font-black leading-none transition-opacity cursor-pointer ${
                                    isCoverJustSet
                                      ? "bg-emerald-600 text-white opacity-100"
                                      : "bg-black/75 hover:bg-[#E84A27] text-white opacity-90 sm:opacity-0 sm:group-hover/thumb:opacity-100"
                                  }`}
                                >
                                  {isCoverJustSet ? "✓ Cover" : "Set Cover"}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#FAF7F2]">
                  <div>
                    <span className="text-xs font-black text-[#181615] block">
                      📤 Direct Image Upload &amp; Clipboard Paste
                    </span>
                    <span className="text-[11px] text-zinc-500 block mt-0.5">
                      Upload from disk, drag &amp; drop, or press <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-300 font-mono text-[10px] text-zinc-800 font-bold">Ctrl+V</kbd> to paste a screenshot directly.
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-[10px] font-extrabold text-[#E84A27]">
                    1080px WebP
                  </span>
                </div>

                {/* Dropzone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const files = e.dataTransfer.files;
                    if (files && files[0]) {
                      void uploadFile(files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all ${
                    isDragging
                      ? "border-[#E84A27] bg-[#E84A27]/5 scale-[0.99]"
                      : "border-[#DDD6C9] hover:border-[#E84A27]/60 bg-[#FAF7F2] hover:bg-white"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/avif"
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files[0]) {
                        void uploadFile(files[0]);
                      }
                    }}
                  />

                  <div className="flex flex-col items-center justify-center gap-2">
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-8 h-8 text-[#E84A27] animate-spin" />
                        <p className="text-xs font-bold text-[#181615]">Optimizing & uploading WebP...</p>
                        <p className="text-[10.5px] text-zinc-500">Processing with Sharp & saving to Supabase CDN</p>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-white border border-[#DDD6C9] flex items-center justify-center text-[#E84A27] shadow-xs">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-[#181615]">
                            Click to browse or drag & drop food photo
                          </p>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            JPEG, PNG, WebP, AVIF up to 10MB
                          </p>
                        </div>
                        <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#DDD6C9] text-[11px] font-bold text-zinc-700 shadow-xs">
                          <span>📋 Screenshot ready? Just press</span>
                          <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-300 font-mono text-[10px] text-zinc-800 font-black">Ctrl+V</kbd>
                          <span>here</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {uploadError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Tab 0: ✨ AI Polish / Camera & Background Shift */}
            {activeTab === "restyle" && (
              <div className="p-4 rounded-2xl bg-white border border-[#EAE5DC] space-y-3.5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#FAF7F2]">
                  <div>
                    <span className="text-xs font-black text-[#181615] block">
                      ✨ AI Polish · Preserve Food, Clean Surroundings
                    </span>
                    <span className="text-[11px] text-zinc-500 block mt-0.5">
                      Default mode locks the exact plated food, portion, vessel &amp; camera angle while balancing Oslo daylight and cleaning tabletop clutter.
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-extrabold text-emerald-700">
                    Nano Banana Lite
                  </span>
                </div>

                {isBlockedForAiShift && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Wolt/Foodora photos cannot be AI-polished. Pick a Google Maps, SerpApi, kitchen, or uploaded photo from Pool / Upload first.
                    </span>
                  </div>
                )}

                {/* 1. Polish / Camera Angle Mode */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                    1. Polish Mode / Camera Angle
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {(Object.keys(ANGLE_PRESETS) as AnglePresetId[]).map((id) => {
                      const opt = ANGLE_PRESETS[id];
                      const active = anglePreset === id;
                      const isPrimary = id === "preserve_food_clean_scene";
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setAnglePreset(id)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isPrimary ? "col-span-2 sm:col-span-3 text-left flex items-center justify-between" : ""
                          } ${
                            active
                              ? "bg-[#181615] text-white border-[#181615] shadow-xs"
                              : "bg-[#FAF7F2] text-zinc-700 border-[#DDD6C9] hover:border-[#181615]"
                          }`}
                        >
                          <span>{isPrimary ? opt.label : opt.shortLabel}</span>
                          {isPrimary && (
                            <span
                              className={`text-[9.5px] uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                                active ? "bg-[#E84A27] text-white" : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              Recommended
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Background Table Surface */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                    2. Background Table Surface (Original Dish &amp; Vessel Locked)
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
                  disabled={isTransforming || !dishImage || isBlockedForAiShift}
                  title={
                    isBlockedForAiShift
                      ? "Wolt/Foodora photos cannot be AI-shifted — pick a Google Maps, kitchen, or uploaded photo instead."
                      : undefined
                  }
                  className="w-full py-2.5 px-4 rounded-xl bg-[#E84A27] hover:bg-[#d03d1b] text-white font-black text-xs shadow-md shadow-[#E84A27]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isTransforming ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>
                        {anglePreset === "preserve_food_clean_scene"
                          ? "Polishing Daylight & Surroundings (Food Locked)..."
                          : "Shifting Camera Angle & Surface (Vessel Locked)..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>
                        {anglePreset === "preserve_food_clean_scene"
                          ? "✨ Polish Photo (Preserve Food · Clean Scene)"
                          : "✨ Shift Camera Angle & Table Surface"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Tab 1: Live Google Places Search */}
            {activeTab === "google" && (
              <div className="p-3.5 rounded-2xl bg-white border border-[#EAE5DC] space-y-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const nextQ = `${spotName} Oslo`;
                      setGoogleQuery(nextQ);
                      void fetchGooglePhotos(nextQ, false);
                    }}
                    className="rounded-full border border-[#DDD6C9] bg-[#FAF7F2] px-2.5 py-1 text-[10.5px] font-bold text-[#181615] hover:border-[#E84A27] cursor-pointer"
                  >
                    Spot: {spotName}
                  </button>
                  {dishName && (
                    <button
                      type="button"
                      onClick={() => {
                        const nextQ = `${dishName} Oslo`;
                        setGoogleQuery(nextQ);
                        void fetchGooglePhotos(nextQ, false);
                      }}
                      className="rounded-full border border-[#E84A27]/30 bg-[#E84A27]/8 px-2.5 py-1 text-[10.5px] font-bold text-[#E84A27] hover:bg-[#E84A27] hover:text-white cursor-pointer"
                    >
                      Dish: {dishName}
                    </button>
                  )}
                </div>

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
                        onClick={() => handleSelectPhoto(photoUrl, "google")}
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
                        <span className="pointer-events-none absolute top-1 left-1 z-10 px-1.5 py-0.5 rounded-md bg-zinc-900/85 text-white border border-zinc-700 text-[8.5px] font-black leading-none">
                          GOOGLE
                        </span>
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
                  Paste restaurant website, Instagram, or approved photo URL (no Wolt/Foodora)
                </label>
                <input
                  type="url"
                  value={dishImage}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDishImage(val);
                    setOriginalBeforeRemixImage(val);
                    setTransformedImageUrl(null);
                    setImageSource(detectImageSource(val));
                    setSourceUrl(val);
                    setIsAiEnhanced(false);
                    setImgError(false);
                    if (val.startsWith("http")) setIsVerified(!isDeliveryAppImageUrl(val));
                  }}
                  placeholder="Paste restaurant website, Instagram, or approved photo URL (no Wolt/Foodora)"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#FAF7F2] border border-[#DDD6C9] text-[#181615] focus:outline-none focus:border-[#E84A27]"
                />
                {isDeliveryAppImageUrl(dishImage) ? (
                  <p className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                    ⚠️ Wolt and Foodora URLs are blocked on commit and cannot be AI-polished. Use a Google Maps, restaurant website, or uploaded photo instead.
                  </p>
                ) : (
                  <p className="text-[11px] text-zinc-500">
                    Tip: Paste an approved restaurant or diner URL here, then optionally open{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("restyle")}
                      className="text-[#E84A27] font-bold underline cursor-pointer"
                    >
                      ✨ AI Polish
                    </button>{" "}
                    to clean daylight and surroundings while keeping the food locked.
                  </p>
                )}
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
          )}

          {/* ── NOTE, CATEGORY & TAGS EDITOR (only shown when activeField === "meta") ── */}
          {activeField === "meta" && (
            <div className="space-y-3.5 bg-white p-4 rounded-2xl border border-[#EAE5DC]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#181615] uppercase tracking-wider">
                  Dish Category, Tags &amp; Tasting Note
                </span>
                <button
                  type="button"
                  onClick={() => setActiveField("photo")}
                  className="text-[11px] font-bold text-[#E84A27] hover:underline cursor-pointer"
                >
                  Back to Photo Studio
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  Culinary Review &amp; Soundbite
                </label>
                <textarea
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Insider taste verdict..."
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
                    Confirm this photo shows the actual dish (no storefronts or clip-art).
                  </span>
                </div>
              </label>
            </div>
          )}

          {saveError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700">
              {saveError}
            </div>
          )}

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
