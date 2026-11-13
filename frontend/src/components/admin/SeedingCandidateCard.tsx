"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Check,
  AlertTriangle,
  Pencil,
  Image as ImageIcon,
  MapPin,
  Star,
  Clock,
  Compass,
  X,
  Camera,
  Link as LinkIcon,
  Search,
  RefreshCw,
  Upload,
  Trash2,
  Rocket,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  Database,
  Plus,
} from "lucide-react";
import { IconPickerModal } from "@/components/admin/IconPickerModal";
import {
  QuickDishEditModal,
  getCachedPhotosForQuery,
  setCachedPhotosForQuery,
} from "@/components/admin/QuickDishEditModal";
import {
  SmakrFoodIcon,
  isCustomFoodIcon,
  resolveCustomIconKey,
} from "@/components/food/FoodIcons";
import { resolveEntityTaxonomy } from "@/lib/taxonomy";
import { uploadAdminImage } from "@/lib/adminUpload";
import type {
  StagedCandidateSpot,
  StagedDishHighlight,
  VerificationStatus,
} from "@/app/api/admin/seeding-lab/route";
import type { AiShiftSpotProposal } from "@/app/api/admin/ai-shift-spot/route";

type ActiveSpotField =
  | null
  | "cover"
  | "name"
  | "category"
  | "price"
  | "rating"
  | "location"
  | "signature"
  | "story";

interface SeedingCandidateCardProps {
  spot: StagedCandidateSpot;
  onUpdateSpot: (spotId: string, updates: Partial<StagedCandidateSpot>) => Promise<void>;
  onUpdateDish: (
    spotId: string,
    dishId: string,
    dishUpdates: Partial<StagedDishHighlight>
  ) => Promise<void>;
  onAddDish?: (spotId: string, newDish: Partial<StagedDishHighlight>) => Promise<void>;
  onSyncSeeded?: (spotId: string) => Promise<void>;
}

export function SeedingCandidateCard({
  spot,
  onUpdateSpot,
  onUpdateDish,
  onAddDish,
  onSyncSeeded,
}: SeedingCandidateCardProps) {
  const isPopupSpot = spot.spot_type === "popup" || spot.spot_type === "pop_up";
  const instagramUrl =
    (spot as any).instagram_url ||
    (spot.notes?.match(/https:\/\/(www\.)?instagram\.com\/[^\s"')]+/i)?.[0] ?? null);
  const instagramHandle = instagramUrl
    ? instagramUrl.replace(/\/$/, "").split("/").pop()
    : null;

  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<StagedDishHighlight | null>(null);
  const [activeSpotField, setActiveSpotField] = useState<ActiveSpotField>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSyncingSeeded, setIsSyncingSeeded] = useState(false);
  const [isAddingDishOpen, setIsAddingDishOpen] = useState(false);
  const [newDishTitle, setNewDishTitle] = useState("");
  const [newDishPrice, setNewDishPrice] = useState("");

  // AI Quick Shift Modal State
  const [isAiShiftOpen, setIsAiShiftOpen] = useState(false);
  const [aiShiftInput, setAiShiftInput] = useState("");
  const [isParsingAiShift, setIsParsingAiShift] = useState(false);
  const [isApplyingAiShift, setIsApplyingAiShift] = useState(false);
  const [aiShiftError, setAiShiftError] = useState<string | null>(null);
  const [aiShiftProposal, setAiShiftProposal] = useState<AiShiftSpotProposal | null>(null);

  const handleParseAiShift = async (customText?: string) => {
    const textToParse = (customText ?? aiShiftInput).trim();
    if (!textToParse) {
      setAiShiftError("Paste an Instagram drop announcement or natural language update first.");
      return;
    }
    setIsParsingAiShift(true);
    setAiShiftError(null);
    try {
      const res = await fetch("/api/admin/ai-shift-spot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "preview",
          spotId: spot.id,
          rawText: textToParse,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse announcement.");
      setAiShiftProposal(data.proposal);
    } catch (err: any) {
      setAiShiftError(err.message || "Error parsing announcement.");
    } finally {
      setIsParsingAiShift(false);
    }
  };

  const handleApplyAiShift = async () => {
    if (!aiShiftProposal) return;
    setIsApplyingAiShift(true);
    setAiShiftError(null);
    try {
      const res = await fetch("/api/admin/ai-shift-spot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "apply",
          spotId: spot.id,
          proposal: aiShiftProposal,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to apply AI Shift.");

      if (data.spot) {
        await onUpdateSpot(spot.id, data.spot);
      }
      setIsAiShiftOpen(false);
      setAiShiftProposal(null);
      setAiShiftInput("");
    } catch (err: any) {
      setAiShiftError(err.message || "Failed to apply AI Shift to production.");
    } finally {
      setIsApplyingAiShift(false);
    }
  };

  // Restaurant Card Modal state
  const [spotName, setSpotName] = useState(spot.name);
  const [spotAddress, setSpotAddress] = useState(spot.address);
  const [spotNeighborhood, setSpotNeighborhood] = useState(spot.neighborhood);
  const [spotCategory, setSpotCategory] = useState(spot.food_category);
  const [spotPriceLevel, setSpotPriceLevel] = useState<"$" | "$$" | "$$$">(
    spot.price_level || "$$"
  );
  const [spotRating, setSpotRating] = useState<string>(String(spot.google_rating ?? 4.7));
  const [spotSignatureDish, setSpotSignatureDish] = useState(
    spot.signature_dish || spot.dish_highlights[0]?.dish_name || ""
  );
  const [spotCoverUrl, setSpotCoverUrl] = useState(spot.cover_image_url || "");
  const [spotWhyCurated, setSpotWhyCurated] = useState(spot.why_curated || "");
  const [spotPhotoTab, setSpotPhotoTab] = useState<"upload" | "google" | "url">(
    isPopupSpot ? "upload" : "google"
  );
  const [spotGoogleQuery, setSpotGoogleQuery] = useState(`${spot.name} Oslo`);
  const [spotGooglePhotos, setSpotGooglePhotos] = useState<string[]>(
    () => getCachedPhotosForQuery(`${spot.name} Oslo`) || []
  );
  const [isLoadingSpotGoogle, setIsLoadingSpotGoogle] = useState(false);
  const [isSavingSpot, setIsSavingSpot] = useState(false);

  // Direct Cover Upload & Clipboard Paste state
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const uploadCoverFile = async (file: File) => {
    setIsUploadingCover(true);
    setCoverUploadError(null);
    try {
      const { url, error } = await uploadAdminImage(file, {
        spotId: spot.id || spotName,
        dishId: "cover",
      });
      if (!url) throw new Error(error || "Upload failed");

      setSpotCoverUrl(url);
      setSpotPhotoTab("upload");

      // Persist cover image immediately (auto-syncs to Supabase if seeded)
      await onUpdateSpot(spot.id, { cover_image_url: url });
    } catch (err: any) {
      setCoverUploadError(err.message || "Failed to upload cover image.");
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Clipboard paste listener when cover photo tray is open
  useEffect(() => {
    if (activeSpotField !== "cover") return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            void uploadCoverFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [activeSpotField, spot.id, spotName]);

  // Keep local state synced when parent spot updates
  useEffect(() => {
    setSpotName(spot.name);
    setSpotAddress(spot.address);
    setSpotNeighborhood(spot.neighborhood);
    setSpotCategory(spot.food_category);
    setSpotPriceLevel(spot.price_level || "$$");
    setSpotRating(String(spot.google_rating ?? 4.7));
    setSpotSignatureDish(spot.signature_dish || spot.dish_highlights[0]?.dish_name || "");
    setSpotCoverUrl(spot.cover_image_url || "");
    setSpotWhyCurated(spot.why_curated || "");
  }, [spot]);

  const fetchSpotGooglePhotos = async (query: string, forceRefresh = false) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    if (!forceRefresh) {
      const cached = getCachedPhotosForQuery(trimmed);
      if (cached) {
        setSpotGooglePhotos(cached);
        return;
      }
    }
    setIsLoadingSpotGoogle(true);
    try {
      const res = await fetch(
        `/api/places/search?q=${encodeURIComponent(trimmed)}${
          forceRefresh ? "&refresh=1" : ""
        }`
      );
      const data = await res.json();
      const place = data?.places?.[0] || data?.place;
      const rawPhotos = place?.photos || [];
      const urls = rawPhotos
        .map((p: any) => {
          const ref = p.name || p.photo_reference || p;
          if (typeof ref === "string" && ref.startsWith("places/")) {
            return `/api/places/photos?ref=${encodeURIComponent(ref)}&w=640`;
          }
          return null;
        })
        .filter((u: any): u is string => Boolean(u));
      setCachedPhotosForQuery(trimmed, urls);
      setSpotGooglePhotos(urls);
    } catch (err) {
      console.warn("Failed to load spot Google photos:", err);
    } finally {
      setIsLoadingSpotGoogle(false);
    }
  };

  useEffect(() => {
    if (
      activeSpotField === "cover" &&
      spotPhotoTab === "google" &&
      getCachedPhotosForQuery(spotGoogleQuery) === null
    ) {
      void fetchSpotGooglePhotos(spotGoogleQuery, false);
    }
  }, [activeSpotField, spotPhotoTab]);

  const saveSpotField = async (patch: Partial<StagedCandidateSpot>) => {
    setIsSavingSpot(true);
    try {
      await onUpdateSpot(spot.id, patch);
      setActiveSpotField(null);
    } finally {
      setIsSavingSpot(false);
    }
  };

  // Resolve authentic cultural flag and taxonomy
  const taxonomy = resolveEntityTaxonomy({
    name: spot.name,
    food_category: spot.food_category as any,
    icon: spot.icon,
    spot_type: spot.spot_type,
    signature_dishes: spot.dish_highlights.map((d) => d.dish_name),
  } as any);

  const allDishesVerified =
    spot.dish_highlights.length > 0 &&
    spot.dish_highlights.every(
      (d) =>
        d.is_verified_food_photo &&
        Boolean(d.dish_image) &&
        !/streetview|facade|building|\/icons\/food\//i.test(d.dish_image)
    );

  const [isCommittingSpot, setIsCommittingSpot] = useState(false);

  const handleStatusChange = async (newStatus: VerificationStatus) => {
    const anyMissingPhoto = spot.dish_highlights.some(
      (d) => !d.dish_image || /\/icons\/food\//i.test(d.dish_image)
    );
    if (newStatus === "approved" && anyMissingPhoto) {
      alert("Cannot approve spot until every dish has a real photo URL (not an SVG fallback).");
      return;
    }
    await onUpdateSpot(spot.id, { verification_status: newStatus });
  };

  const handleCommitSingleSpot = async () => {
    if (!allDishesVerified) {
      alert(`Cannot commit "${spot.name}": Every active dish must have a verified photo first.`);
      return;
    }

    if (
      !confirm(
        `Commit "${spot.name}" with ${spot.dish_highlights.length} dish(es) directly to Supabase production?`
      )
    ) {
      return;
    }

    setIsCommittingSpot(true);
    try {
      const res = await fetch("/api/admin/seeding-lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotIds: [spot.id] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Commit failed.");

      await onUpdateSpot(spot.id, { verification_status: "seeded" });
      alert(`Successfully seeded "${spot.name}" and ${spot.dish_highlights.length} dish(es) to production!`);
    } catch (err: any) {
      alert(`Commit error: ${err.message}`);
    } finally {
      setIsCommittingSpot(false);
    }
  };

  const handleUseOnlyThisDish = async (dishToKeep: StagedDishHighlight) => {
    if (
      !confirm(
        `Use only "${dishToKeep.dish_name}" for ${spot.name}? This will remove other unverified dishes.`
      )
    ) {
      return;
    }
    await onUpdateSpot(spot.id, {
      dish_highlights: [dishToKeep],
      signature_dish: dishToKeep.dish_name,
      verification_status: dishToKeep.is_verified_food_photo ? "approved" : "needs_photo",
    });
  };

  const handleRemoveDish = async (dishToRemoveId: string, dishToRemoveName: string) => {
    if (spot.dish_highlights.length <= 1) {
      alert("A candidate spot must have at least one dish.");
      return;
    }
    if (!confirm(`Remove "${dishToRemoveName}" from ${spot.name}?`)) {
      return;
    }
    const remaining = spot.dish_highlights.filter((d) => d.id !== dishToRemoveId);
    const allRemainingVerified = remaining.every(
      (d) => d.is_verified_food_photo && Boolean(d.dish_image)
    );
    await onUpdateSpot(spot.id, {
      dish_highlights: remaining,
      signature_dish: remaining[0]?.dish_name,
      verification_status: allRemainingVerified ? "approved" : "needs_photo",
    });
  };

  const displayRating = typeof spot.google_rating === "number" ? spot.google_rating : 4.7;
  const displayPriceLevel = spot.price_level || "$$";
  const displaySignature =
    spot.signature_dish ||
    spot.dish_highlights[0]?.dish_name ||
    taxonomy.dishCategory ||
    taxonomy.spotLabel;
  const effectiveCoverUrl = spot.cover_image_url || spot.dish_highlights[0]?.dish_image || "";

  return (
    <div className="relative rounded-2xl bg-white border border-[#EAE5DC] text-[#181615] shadow-xs overflow-hidden flex flex-col transition-all hover:border-[#DDD6C9] hover:shadow-sm">
      {/* ── SUMMARY ROW (tap to open the workspace) ── */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        aria-expanded={isExpanded}
        className="flex w-full items-center gap-3.5 p-3.5 text-left transition-colors hover:bg-[#FAF7F2]/60 sm:px-4"
      >
        <div className="relative h-13 w-13 shrink-0 overflow-hidden rounded-xl bg-[#F3EFE7] ring-1 ring-black/8 sm:h-14 sm:w-14">
          {effectiveCoverUrl ? (
            <Image
              src={effectiveCoverUrl}
              alt={spot.name}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center">
              <SmakrFoodIcon
                name={
                  resolveCustomIconKey(spot.icon) ||
                  resolveCustomIconKey(spot.food_category) ||
                  taxonomy.spotKind
                }
                className="h-7 w-7 object-contain"
              />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-[15px] font-bold leading-snug text-[#181615] sm:text-base">
              {spot.name}
            </h2>
            {isPopupSpot && (
              <span className="shrink-0 rounded-md bg-[#E84A27]/10 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-[#E84A27]">
                Pop-up
              </span>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500 truncate">
            <MapPin className="h-3 w-3 shrink-0 text-[#E84A27]" />
            <span className="capitalize text-zinc-700 font-semibold">{spot.neighborhood || "Oslo"}</span>
            <span className="text-zinc-300">·</span>
            <span>{displayPriceLevel}</span>
            <span className="text-zinc-300">·</span>
            <span className="truncate text-zinc-500">{displaySignature}</span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          {spot.verification_status === "seeded" ? (
            <span title="Seeded" className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10.5px] font-bold text-emerald-700">
              <Database className="h-3 w-3 shrink-0" />
              <span className="hidden sm:inline">Live</span>
            </span>
          ) : spot.verification_status === "approved" ? (
            <span title="Approved" className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10.5px] font-bold text-emerald-700">
              <CheckCircle2 className="h-3 w-3 shrink-0" />
              <span className="hidden sm:inline">Approved</span>
            </span>
          ) : spot.verification_status === "needs_photo" ? (
            <span title="Needs photo" className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10.5px] font-bold text-amber-700">
              <Camera className="h-3 w-3 shrink-0" />
              <span className="hidden sm:inline">Needs photo</span>
            </span>
          ) : spot.verification_status === "rejected" ? (
            <span title="Rejected" className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10.5px] font-bold text-rose-700">
              <X className="h-3 w-3 shrink-0" />
              <span className="hidden sm:inline">Rejected</span>
            </span>
          ) : (
            <span title="Pending" className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10.5px] font-bold text-sky-700">
              <Clock className="h-3 w-3 shrink-0" />
              <span className="hidden sm:inline">Pending</span>
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* ── EXPANDED WORKSPACE ── */}
      {isExpanded && (
        <>
          {/* Curator toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 border-t border-[#EAE5DC] bg-[#FAF7F2] px-3 py-2.5 animate-in fade-in-0 duration-150">
            <button
              type="button"
              onClick={() => {
                setIsAiShiftOpen(true);
                setAiShiftError(null);
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#181615] px-3 text-[11px] font-bold text-white transition-colors hover:bg-[#E84A27] cursor-pointer"
              title="Paste drop text to update the card and production DB with AI"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI shift
            </button>
            <button
              type="button"
              onClick={() =>
                setActiveSpotField((cur) => (cur === "cover" ? null : "cover"))
              }
              className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold transition-colors cursor-pointer ${
                activeSpotField === "cover"
                  ? "border-[#E84A27] bg-[#E84A27] text-white"
                  : "border-[#DDD6C9] bg-white text-[#181615] hover:border-[#E84A27]/40 hover:text-[#E84A27]"
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              Cover Photo
            </button>
            <button
              type="button"
              onClick={() => setIsIconPickerOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#DDD6C9] bg-white px-3 text-[11px] font-bold text-[#181615] transition-colors hover:border-[#E84A27]/40 hover:text-[#E84A27] cursor-pointer"
              title="Customize the map radar pin icon"
            >
              <span className="grid h-4 w-4 place-items-center">
                {isCustomFoodIcon(spot.icon) ? (
                  <SmakrFoodIcon name={spot.icon} className="h-4 w-4 object-contain" />
                ) : (
                  <span className="text-[11px] leading-none">{spot.icon || "📍"}</span>
                )}
              </span>
              Pin
            </button>
            {isPopupSpot && instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-full border border-pink-200 bg-pink-50 px-3 text-[11px] font-bold text-pink-700 transition-colors hover:bg-pink-100"
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pink-500" />
                @{instagramHandle || "instagram"}
              </a>
            )}
            <span
              className={`hidden text-[10px] font-semibold uppercase tracking-widest text-zinc-400 sm:block ${
                isPopupSpot && instagramUrl ? "" : "ml-auto"
              }`}
            >
              Tap card elements to edit
            </span>
          </div>

          {/* Pop-up drop pattern */}
          {isPopupSpot && (
            <div className="flex flex-wrap items-start gap-2 border-t border-[#EAE5DC] bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-pink-500/10 px-3.5 py-2.5">
              <span className="rounded-full bg-[#E84A27] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                Drop pattern
              </span>
              <p className="min-w-0 flex-1 text-[11px] font-medium leading-relaxed text-zinc-700">
                {spot.notes
                  ? spot.notes.replace(/Instagram:\s*https:\/\/[^\s]+/i, "").trim()
                  : "No drop notes yet — use AI Shift to parse schedule."}
              </p>
            </div>
          )}

      {/* ── MAIN WORKSPACE: CLICK-TO-EDIT SPOT CARD (LEFT) + DISH CARDS (RIGHT) ── */}
      <div className="p-3.5 sm:p-5 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 bg-white items-start animate-in fade-in-0 duration-200">
        {/* LEFT COLUMN (5 cols): Interactive Spot Card Preview */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-black uppercase tracking-widest text-zinc-400">
              Spot card preview
            </span>
            <span className="text-[10px] text-[#E84A27] font-bold">
              Tap any part to edit
            </span>
          </div>

          <div className="rounded-3xl overflow-hidden border border-[#EAE5DC] bg-[#FAF7F2] shadow-sm">
            {/* Exact Clone of FoodSpotCard.tsx with Direct Click-to-Edit Surfaces */}
            <div className="relative flex items-center gap-3 sm:gap-3.5 p-3.5 bg-[#EFE8DC] border-b border-[#181615]/10 select-none overflow-hidden min-h-[144px]">
              {/* Left Column — Clickable 1:1 Cover Thumbnail */}
              <div
                onClick={() =>
                  setActiveSpotField((cur) => (cur === "cover" ? null : "cover"))
                }
                className={`relative z-10 w-[110px] h-[110px] sm:w-[126px] sm:h-[126px] rounded-2xl overflow-hidden shrink-0 bg-[#EAE6DF] shadow-sm ring-2 transition-all group/thumb cursor-pointer ${
                  activeSpotField === "cover"
                    ? "ring-[#E84A27]"
                    : "ring-black/10 hover:ring-[#E84A27]/60"
                }`}
                title="Click to upload or change cover photo"
              >
                {effectiveCoverUrl ? (
                  <Image
                    src={effectiveCoverUrl}
                    alt={spot.name}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-200 group-hover/thumb:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <SmakrFoodIcon
                      name={
                        resolveCustomIconKey(spot.icon) ||
                        resolveCustomIconKey(spot.food_category) ||
                        taxonomy.spotKind
                      }
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                )}

                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-extrabold gap-1 z-[4] pointer-events-none">
                  <Camera className="w-4 h-4 text-white" />
                  <span>Photo</span>
                </div>

                {/* Clickable Rating Badge bottom-left */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSpotField((cur) => (cur === "rating" ? null : "rating"));
                  }}
                  title="Tap to edit Google rating"
                  className={`absolute bottom-2 left-2 z-[5] flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#181615]/90 text-white text-[10px] font-bold shadow-xs cursor-pointer transition-transform hover:scale-105 ${
                    activeSpotField === "rating" ? "ring-2 ring-[#E84A27]" : ""
                  }`}
                >
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  <span>{displayRating.toFixed(1)}</span>
                </button>
              </div>

              {/* Right Column — 4 Click-to-Edit Card Lines */}
              <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-between py-0.5 min-h-[110px] sm:min-h-[126px] gap-1">
                {/* Line 1: Clickable Category Badge + Open/Pop-up pill */}
                <div className="flex items-center justify-between gap-1.5 min-w-0">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveSpotField((cur) => (cur === "category" ? null : "category"))
                    }
                    title="Tap to edit category or map icon"
                    className={`text-[11px] font-semibold text-[#e84a27] uppercase tracking-wider flex items-center gap-1 font-comico truncate rounded-md px-1 -ml-1 py-0.5 transition-colors cursor-pointer ${
                      activeSpotField === "category"
                        ? "bg-[#E84A27]/15 ring-1 ring-[#E84A27]/40"
                        : "hover:bg-[#E84A27]/10"
                    }`}
                  >
                    <SmakrFoodIcon
                      name={
                        resolveCustomIconKey(spot.icon) ||
                        resolveCustomIconKey(spot.food_category) ||
                        taxonomy.spotKind
                      }
                      className="w-3.5 h-3.5 shrink-0"
                    />
                    <span className="truncate">{taxonomy.spotLabel}</span>
                  </button>

                  {isPopupSpot ? (
                    <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-[#E84A27] text-white font-comico shrink-0 tracking-wide">
                      Pop-up
                    </span>
                  ) : (
                    <span className="bg-[#4E8752]/10 text-[#4E8752] border border-[#4E8752]/20 px-2 py-0.5 rounded-full text-[9.5px] font-bold inline-flex items-center gap-1 shrink-0">
                      <Clock className="w-2.5 h-2.5 shrink-0" />
                      <span>Open</span>
                    </span>
                  )}
                </div>

                {/* Line 2: Inline Editable Venue Title + Clickable Price Tier */}
                <div className="flex items-center justify-between gap-1.5 min-w-0">
                  {activeSpotField === "name" ? (
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <input
                        autoFocus
                        type="text"
                        value={spotName}
                        onChange={(e) => setSpotName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && spotName.trim()) {
                            void saveSpotField({ name: spotName.trim() });
                          } else if (e.key === "Escape") {
                            setSpotName(spot.name);
                            setActiveSpotField(null);
                          }
                        }}
                        className="w-full min-w-0 px-2 py-0.5 rounded-lg bg-white border border-[#E84A27] font-comico text-sm text-[#181615] focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={isSavingSpot}
                        onClick={() => void saveSpotField({ name: spotName.trim() || spot.name })}
                        className="p-1 rounded-lg bg-[#E84A27] text-white shrink-0 cursor-pointer"
                        title="Save name"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveSpotField("name")}
                      title="Tap to rename spot"
                      className="font-comico text-base sm:text-lg text-[#181615] leading-tight truncate text-left hover:text-[#E84A27] rounded-md px-1 -ml-1 transition-colors cursor-pointer flex-1 min-w-0"
                    >
                      {spot.name}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const next =
                        displayPriceLevel === "$"
                          ? "$$"
                          : displayPriceLevel === "$$"
                          ? "$$$"
                          : "$";
                      setSpotPriceLevel(next);
                      void onUpdateSpot(spot.id, { price_level: next });
                    }}
                    title="Tap to cycle price tier ($ / $$ / $$$)"
                    className="text-[10.5px] font-extrabold text-zinc-700 bg-white/85 hover:bg-[#E84A27] hover:text-white border border-black/10 px-2 py-0.5 rounded-md shrink-0 transition-colors cursor-pointer"
                  >
                    {displayPriceLevel}
                  </button>
                </div>

                {/* Line 3: Clickable Neighborhood + Address */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveSpotField((cur) => (cur === "location" ? null : "location"))
                  }
                  title="Tap to edit neighborhood & address"
                  className={`text-xs font-medium text-[#6E655F] flex items-center gap-1 truncate text-left rounded-md px-1 -ml-1 py-0.5 transition-colors cursor-pointer ${
                    activeSpotField === "location"
                      ? "bg-[#E84A27]/15 ring-1 ring-[#E84A27]/40"
                      : "hover:bg-black/5"
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-[#E84A27] shrink-0" />
                  <span className="capitalize font-bold text-[#181615] truncate">
                    {spot.neighborhood}
                  </span>
                  <span className="text-zinc-400">·</span>
                  <span className="truncate text-[11px] text-zinc-600">
                    {isPopupSpot
                      ? spot.address.replace(/,\s*0\d{3}\s*Oslo/i, "").replace(/,\s*Oslo/i, "").trim() || "Roving Pop-Up"
                      : spot.address}
                  </span>
                </button>

                {/* Line 4: Inline Editable Signature Dish */}
                <div className="border-t border-[#181615]/8 pt-1.5 flex items-center justify-between gap-2 min-w-0">
                  {activeSpotField === "signature" ? (
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <span className="text-[#e84a27] text-xs shrink-0">✦</span>
                      <input
                        autoFocus
                        type="text"
                        value={spotSignatureDish}
                        onChange={(e) => setSpotSignatureDish(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            void saveSpotField({ signature_dish: spotSignatureDish.trim() });
                          } else if (e.key === "Escape") {
                            setSpotSignatureDish(spot.signature_dish || "");
                            setActiveSpotField(null);
                          }
                        }}
                        className="w-full min-w-0 px-2 py-0.5 rounded-lg bg-white border border-[#E84A27] text-xs font-bold text-[#181615] focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={isSavingSpot}
                        onClick={() =>
                          void saveSpotField({ signature_dish: spotSignatureDish.trim() })
                        }
                        className="p-1 rounded-lg bg-[#E84A27] text-white shrink-0 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveSpotField("signature")}
                      title="Tap to edit signature dish"
                      className="text-xs font-bold text-[#181615] hover:text-[#E84A27] truncate flex items-center gap-1 text-left rounded-md px-1 -ml-1 py-0.5 transition-colors cursor-pointer flex-1 min-w-0"
                    >
                      <span className="text-[#e84a27]">✦</span>
                      <span className="truncate">{displaySignature}</span>
                    </button>
                  )}

                  {isPopupSpot ? (
                    <span className="px-2 py-0.5 rounded-xl bg-orange-50 text-[#E84A27] border border-orange-200 text-[10px] font-black shrink-0">
                      ✦ Drop
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-xl bg-[#FAF6EE] text-[#181615] border border-[#181615]/12 text-[10px] font-bold shrink-0 inline-flex items-center gap-1">
                      <Compass className="w-2.5 h-2.5 text-[#E84A27]" />
                      <span>Map</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── FOCUSED INLINE POPOVER TRAY (ONLY APPEARS FOR THE CLICKED ELEMENT) ── */}
            {activeSpotField === "cover" && (
              <div className="p-3.5 bg-white border-b border-[#EAE5DC] space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-black uppercase tracking-wider text-[#E84A27]">
                    Spot Cover Photo
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveSpotField(null)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-zinc-800 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1 bg-[#EFEAE1] p-1 rounded-xl">
                  {(
                    [
                      { id: "upload", label: "Upload / Paste" },
                      { id: "google", label: `Google (${spotGooglePhotos.length})` },
                      { id: "url", label: "Direct URL" },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSpotPhotoTab(t.id)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                        spotPhotoTab === t.id
                          ? "bg-[#E84A27] text-white shadow-xs"
                          : "text-zinc-600 hover:text-[#181615]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {spotPhotoTab === "upload" ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingCover(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDraggingCover(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingCover(false);
                      const files = e.dataTransfer.files;
                      if (files?.[0]) void uploadCoverFile(files[0]);
                    }}
                    onClick={() => coverFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                      isDraggingCover
                        ? "border-[#E84A27] bg-[#E84A27]/5"
                        : "border-[#DDD6C9] hover:border-[#E84A27]/60 bg-[#FAF7F2]"
                    }`}
                  >
                    <input
                      ref={coverFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/avif"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void uploadCoverFile(f);
                      }}
                    />
                    {isUploadingCover ? (
                      <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#E84A27]">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Uploading WebP...</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="w-5 h-5 mx-auto text-[#E84A27]" />
                        <p className="text-xs font-bold text-[#181615]">
                          Tap to browse, drop photo, or Ctrl+V
                        </p>
                      </div>
                    )}
                    {coverUploadError && (
                      <p className="mt-2 text-[11px] font-bold text-rose-600">{coverUploadError}</p>
                    )}
                  </div>
                ) : spotPhotoTab === "google" ? (
                  <div className="space-y-2">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={spotGoogleQuery}
                        onChange={(e) => setSpotGoogleQuery(e.target.value)}
                        className="flex-1 min-w-0 px-2.5 py-1.5 text-xs rounded-xl bg-[#FAF7F2] border border-[#DDD6C9]"
                      />
                      <button
                        type="button"
                        onClick={() => fetchSpotGooglePhotos(spotGoogleQuery, true)}
                        disabled={isLoadingSpotGoogle}
                        className="px-3 py-1.5 rounded-xl bg-[#181615] text-white text-xs font-bold cursor-pointer shrink-0"
                      >
                        {isLoadingSpotGoogle ? "..." : "Search"}
                      </button>
                    </div>
                    {spotGooglePhotos.length > 0 && (
                      <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto">
                        {spotGooglePhotos.map((pUrl, i) => (
                          <button
                            key={pUrl + i}
                            type="button"
                            onClick={() => void saveSpotField({ cover_image_url: pUrl })}
                            className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer ${
                              spotCoverUrl === pUrl ? "border-[#E84A27]" : "border-transparent"
                            }`}
                          >
                            <Image src={pUrl} alt="" fill unoptimized className="object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      value={spotCoverUrl}
                      onChange={(e) => setSpotCoverUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 min-w-0 px-2.5 py-1.5 text-xs rounded-xl bg-[#FAF7F2] border border-[#DDD6C9]"
                    />
                    <button
                      type="button"
                      disabled={isSavingSpot || !spotCoverUrl.trim()}
                      onClick={() => void saveSpotField({ cover_image_url: spotCoverUrl.trim() })}
                      className="px-3 py-1.5 rounded-xl bg-[#E84A27] text-white text-xs font-bold cursor-pointer shrink-0"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeSpotField === "category" && (
              <div className="p-3 bg-white border-b border-[#EAE5DC] space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#E84A27]">
                    Category & Map Pin
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSpotField(null);
                      setIsIconPickerOpen(true);
                    }}
                    className="text-[11px] font-bold text-[#181615] hover:text-[#E84A27] underline cursor-pointer"
                  >
                    Open Pin Studio →
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={spotCategory}
                    onChange={(e) => setSpotCategory(e.target.value)}
                    placeholder="ramen, bakery, street_food..."
                    className="flex-1 min-w-0 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-[#FAF7F2] border border-[#DDD6C9]"
                  />
                  <button
                    type="button"
                    onClick={() => void saveSpotField({ food_category: spotCategory.trim() })}
                    className="px-3 py-1.5 rounded-xl bg-[#E84A27] text-white text-xs font-bold cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {activeSpotField === "rating" && (
              <div className="p-3 bg-white border-b border-[#EAE5DC] flex items-center gap-2 animate-in fade-in duration-150">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-zinc-500">
                  Rating:
                </span>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={spotRating}
                  onChange={(e) => setSpotRating(e.target.value)}
                  className="w-20 px-2.5 py-1 text-xs font-bold rounded-xl bg-[#FAF7F2] border border-[#DDD6C9]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const parsed = Number.parseFloat(spotRating);
                    void saveSpotField({
                      google_rating: Number.isFinite(parsed) ? parsed : 4.7,
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#E84A27] text-white text-xs font-bold cursor-pointer ml-auto"
                >
                  Save
                </button>
              </div>
            )}

            {activeSpotField === "location" && (
              <div className="p-3 bg-white border-b border-[#EAE5DC] space-y-2 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={spotNeighborhood}
                    onChange={(e) => setSpotNeighborhood(e.target.value)}
                    placeholder="Neighborhood"
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-[#FAF7F2] border border-[#DDD6C9]"
                  />
                  <input
                    type="text"
                    value={spotAddress}
                    onChange={(e) => setSpotAddress(e.target.value)}
                    placeholder="Street address"
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-[#FAF7F2] border border-[#DDD6C9]"
                  />
                </div>
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveSpotField(null)}
                    className="px-2.5 py-1 text-xs font-semibold text-zinc-500 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void saveSpotField({
                        neighborhood: spotNeighborhood.trim().toLowerCase(),
                        address: spotAddress.trim(),
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-[#E84A27] text-white text-xs font-bold cursor-pointer"
                  >
                    Save location
                  </button>
                </div>
              </div>
            )}

            {/* Curated note + inline click-to-edit story */}
            <div className="p-3 bg-[#FAF7F2] space-y-2">
              {activeSpotField === "story" ? (
                <div className="space-y-2">
                  <textarea
                    autoFocus
                    rows={2}
                    value={spotWhyCurated}
                    onChange={(e) => setSpotWhyCurated(e.target.value)}
                    placeholder="Why Smakr loves this spot..."
                    className="w-full px-2.5 py-2 text-xs rounded-xl bg-white border border-[#E84A27] resize-none focus:outline-none"
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSpotWhyCurated(spot.why_curated || "");
                        setActiveSpotField(null);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-zinc-500 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveSpotField({ why_curated: spotWhyCurated.trim() })}
                      className="px-3 py-1 rounded-xl bg-[#E84A27] text-white text-xs font-bold cursor-pointer"
                    >
                      Save story
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveSpotField("story")}
                  title="Tap to edit story quote"
                  className="w-full text-left text-[11.5px] text-zinc-600 hover:text-[#181615] italic border-l-2 border-[#E84A27] pl-2.5 line-clamp-2 cursor-pointer transition-colors"
                >
                  {spot.why_curated ? `"${spot.why_curated}"` : "+ Tap to add curated note"}
                </button>
              )}

              <div className="flex items-center justify-between gap-2 pt-0.5">
                <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-zinc-500">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      spot.cover_image_url ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  {spot.cover_image_url ? "Cover photo set" : "Using dish photo fallback"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setActiveSpotField((cur) => (cur === "cover" ? null : "cover"))
                  }
                  className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#E84A27] cursor-pointer"
                >
                  <Camera className="h-3 w-3" />
                  {spot.cover_image_url ? "Change cover" : "Add cover"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (7 cols): Dish Feed Cards (Click photo/title/price directly!) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10.5px] font-black uppercase tracking-widest text-zinc-400">
              Dishes
              <span className="ml-1.5 rounded-full bg-[#181615]/5 px-1.5 py-0.5 text-[10px] text-zinc-500">
                {spot.dish_highlights.length}
              </span>
            </span>
            {onAddDish && (
              <button
                type="button"
                onClick={() => setIsAddingDishOpen((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full bg-[#FAF7F2] hover:bg-[#E84A27] hover:text-white border border-[#DDD6C9] px-2.5 py-1 text-[11px] font-bold text-[#181615] transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add dish</span>
              </button>
            )}
          </div>

          {isAddingDishOpen && onAddDish && (
            <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E84A27]/35 flex flex-wrap sm:flex-nowrap items-center gap-2">
              <input
                type="text"
                value={newDishTitle}
                onChange={(e) => setNewDishTitle(e.target.value)}
                placeholder="New dish name (e.g. Matcha Basque)..."
                className="flex-1 min-w-[160px] px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-[#DDD6C9]"
              />
              <input
                type="number"
                value={newDishPrice}
                onChange={(e) => setNewDishPrice(e.target.value)}
                placeholder="NOK"
                className="w-20 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-white border border-[#DDD6C9]"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!newDishTitle.trim()) return;
                  await onAddDish(spot.id, {
                    dish_name: newDishTitle.trim(),
                    price_nok: newDishPrice ? Number(newDishPrice) : null,
                    category: spot.food_category,
                  });
                  setNewDishTitle("");
                  setNewDishPrice("");
                  setIsAddingDishOpen(false);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#E84A27] text-white text-xs font-bold cursor-pointer"
              >
                Add
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {spot.dish_highlights.map((dish) => {
              const isBadImage =
                !dish.dish_image ||
                /streetview|facade|building|\/icons\/food\//i.test(dish.dish_image) ||
                !dish.is_verified_food_photo;

              return (
                <div
                  key={dish.id}
                  className="group relative rounded-3xl overflow-hidden bg-[#181615] border border-black/10 shadow-md flex flex-col transition-all hover:shadow-xl"
                >
                  {/* Clickable Full-Bleed 4:3 Photography Container */}
                  {!dish.dish_image ? (
                    <button
                      type="button"
                      onClick={() => setEditingDish(dish)}
                      className="relative w-full aspect-[4/3] bg-[#FAF7F2] border-b border-[#EAE5DC] flex flex-col items-center justify-center p-5 text-center transition-colors hover:bg-[#F3EFE7] cursor-pointer"
                    >
                      {dish.price_nok && (
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#E84A27] text-white font-bold text-xs shadow-xs">
                          {dish.price_nok} NOK
                        </div>
                      )}
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-700 mb-2.5">
                        <Camera className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-bold text-[#181615] line-clamp-1">
                        {dish.dish_name}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-amber-700">
                        Tap to upload or paste dish photo
                      </p>
                      {dish.review_text && (
                        <p className="mt-2 text-[11px] text-zinc-500 line-clamp-2 max-w-[26ch]">
                          {dish.review_text}
                        </p>
                      )}
                    </button>
                  ) : (
                    <div
                      onClick={() => setEditingDish(dish)}
                      title="Tap anywhere on dish card to edit photo, price or AI Shift"
                      className="relative w-full aspect-[4/3] overflow-hidden bg-[#E8E0D2] cursor-pointer"
                    >
                      <Image
                        src={dish.dish_image}
                        alt={dish.dish_name}
                        fill
                        unoptimized
                        className="object-cover w-full opacity-100 transition-transform duration-700 ease-out group-hover:scale-105"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent pointer-events-none" />

                      {isBadImage && (
                        <div className="absolute inset-x-3 top-3 z-20 px-2.5 py-1.5 rounded-xl bg-amber-400/95 text-black text-[11px] font-bold flex items-center gap-1.5 shadow-md backdrop-blur-md">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-black" />
                          <span className="truncate">Tap to verify photo</span>
                        </div>
                      )}

                      {dish.price_nok && (
                        <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-[#E84A27] text-white font-bold text-xs shadow-md">
                          {dish.price_nok} NOK
                        </div>
                      )}

                      <div className="absolute bottom-0 inset-x-0 p-4 z-10 flex flex-col justify-end pointer-events-none">
                        <h3 className="font-comico font-black text-[19px] sm:text-[21px] tracking-wide leading-[1.15] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] line-clamp-1 capitalize">
                          {dish.dish_name}
                        </h3>

                        {isPopupSpot && (spot as any).popup_meta?.dates_label && (
                          <div className="mt-1 text-[11px] font-bold text-[#FF8566] drop-shadow-xs">
                            {String((spot as any).popup_meta.dates_label).replace(/\s*Drop$/i, "").trim()}
                          </div>
                        )}

                        <div className="text-[12px] font-semibold text-white/95 drop-shadow-xs mt-1 flex items-center gap-1.5 flex-wrap">
                          {isPopupSpot ? (
                            <SmakrFoodIcon name="popup" className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <MapPin className="w-[13px] h-[13px] text-[#e84a27] shrink-0" />
                          )}
                          <span className="font-semibold text-white">{spot.name}</span>
                          <span className="text-zinc-400">·</span>
                          <span className="text-zinc-300 capitalize">{spot.neighborhood}</span>
                        </div>

                        {dish.review_text && (
                          <p className="text-[11px] text-zinc-200 line-clamp-2 mt-1 drop-shadow-sm font-medium">
                            {dish.review_text}
                          </p>
                        )}

                        {dish.taste_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {dish.taste_tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[9.5px] font-bold text-white"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Card Action Strip */}
                  <div className="p-3 bg-[#FAF7F2] border-t border-[#EAE5DC] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateDish(spot.id, dish.id, {
                            is_verified_food_photo: !dish.is_verified_food_photo,
                          })
                        }
                        title="Click to toggle dish photo verification"
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                          dish.is_verified_food_photo
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                        }`}
                      >
                        {dish.is_verified_food_photo ? "🟢 Verified" : "🟡 Verify"}
                      </button>

                      {spot.dish_highlights.length > 1 && dish.is_verified_food_photo && (
                        <button
                          type="button"
                          onClick={() => handleUseOnlyThisDish(dish)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10.5px] font-black flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          title={`Select and use only "${dish.dish_name}" for this spot`}
                        >
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>Solo Dish</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingDish(dish)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#E84A27] hover:text-white text-[#181615] border border-[#DDD6C9] hover:border-[#E84A27] text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Dish Studio</span>
                      </button>

                      {spot.dish_highlights.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDish(dish.id, dish.dish_name)}
                          className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                          title={`Remove "${dish.dish_name}"`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

          {/* ── CURATOR ACTIONS ── */}
          <div className="space-y-3 border-t border-[#EAE5DC] bg-[#FAF7F2] p-3.5 sm:p-5 animate-in fade-in-0 duration-200">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Review status
              </span>
              {allDishesVerified ? (
                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Ready for production
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {spot.dish_highlights.filter((d) => !d.is_verified_food_photo).length} photo(s) missing
                </span>
              )}
            </div>

            {spot.verification_status === "seeded" ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/75 px-3.5 py-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <Database className="h-4 w-4 shrink-0" />
                  <span>Live on Radar — cover &amp; dish edits sync automatically</span>
                </div>
                {onSyncSeeded && (
                  <button
                    type="button"
                    disabled={isSyncingSeeded}
                    onClick={async () => {
                      setIsSyncingSeeded(true);
                      try {
                        await onSyncSeeded(spot.id);
                      } finally {
                        setIsSyncingSeeded(false);
                      }
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#181615] hover:bg-[#E84A27] text-white px-3.5 py-2 text-[11px] font-black transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncingSeeded ? "animate-spin" : ""}`} />
                    <span>{isSyncingSeeded ? "Syncing..." : "Re-sync Live DB"}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 rounded-2xl border border-[#DDD6C9] bg-white p-1">
                <button
                  type="button"
                  onClick={() => handleStatusChange("approved")}
                  title="Approve for database seeding"
                  className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[11px] font-black transition-all cursor-pointer ${
                    spot.verification_status === "approved"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-zinc-600 hover:bg-emerald-50 hover:text-emerald-800"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange("needs_photo")}
                  title="Flag this spot for a better food photo"
                  className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[11px] font-black transition-all cursor-pointer ${
                    spot.verification_status === "needs_photo"
                      ? "bg-amber-400 text-black shadow-xs"
                      : "text-zinc-600 hover:bg-amber-50 hover:text-amber-800"
                  }`}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Photo
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange("rejected")}
                  title="Reject this candidate"
                  className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[11px] font-black transition-all cursor-pointer ${
                    spot.verification_status === "rejected"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-zinc-600 hover:bg-rose-50 hover:text-rose-800"
                  }`}
                >
                  <X className="h-3.5 w-3.5" />
                  Reject
                </button>
              </div>
            )}

            {spot.verification_status !== "seeded" && (
              <button
                type="button"
                onClick={handleCommitSingleSpot}
                disabled={isCommittingSpot || !allDishesVerified}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#E84A27] px-4 py-3 text-xs font-black text-white shadow-md shadow-[#E84A27]/25 transition-all hover:bg-[#d03d1b] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                title={
                  !allDishesVerified
                    ? "Verify all dishes or click 'Solo Dish' first"
                    : `Commit ${spot.name} directly to production database`
                }
              >
                <Rocket className={`h-4 w-4 ${isCommittingSpot ? "animate-bounce" : ""}`} />
                {isCommittingSpot ? "Committing…" : "Commit this spot"}
              </button>
            )}
          </div>
        </>
      )}

      {/* ── MODALS ── */}
      {isIconPickerOpen && (
        <IconPickerModal
          currentIcon={spot.icon}
          initialTab={spot.food_category}
          onSelect={async (newIcon) => {
            await onUpdateSpot(spot.id, { icon: newIcon });
            setIsIconPickerOpen(false);
          }}
          onClose={() => setIsIconPickerOpen(false)}
        />
      )}

      {editingDish && (
        <QuickDishEditModal
          dish={editingDish}
          spotName={spot.name}
          spotId={spot.id}
          isPopup={isPopupSpot}
          onSave={async (dishUpdates) => {
            await onUpdateDish(spot.id, editingDish.id, dishUpdates);
          }}
          onClose={() => setEditingDish(null)}
        />
      )}

      {/* ── AI QUICK SHIFT MODAL (NLP DROP UPDATER + LIVE DIFF PREVIEW) ── */}
      {isAiShiftOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsAiShiftOpen(false)}
        >
          <div
            className="bg-white border border-[#EAE5DC] rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-2xl bg-[#E84A27]/10 text-[#E84A27]">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-black text-[#181615]">
                    ✨ AI Quick Shift: {spot.name}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Paste an Instagram drop announcement or type changes in plain language to update{" "}
                    <code className="font-mono text-[#E84A27]">staged_candidates.json</code>,{" "}
                    <code className="font-mono text-[#E84A27]">venues</code>, and{" "}
                    <code className="font-mono text-[#E84A27]">food_posts</code> simultaneously.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiShiftOpen(false)}
                className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Natural Language Input */}
            <div className="space-y-2.5">
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-600">
                1. Paste Drop Update or Announcement Text
              </label>
              <textarea
                rows={3}
                value={aiShiftInput}
                onChange={(e) => setAiShiftInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    void handleParseAiShift();
                  }
                }}
                placeholder="e.g. Next pop-up is on Nov 14th at Mike's Corner in Oslobukta at 12pm, serving Double Biscoff matcha 75 kr (80 cups only)..."
                className="w-full px-3.5 py-2.5 text-xs font-medium rounded-2xl bg-[#FAF7F2] border border-[#DDD6C9] focus:outline-none focus:border-[#E84A27] resize-none"
              />

              {/* Quick Sample Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10.5px] font-bold text-zinc-400">Quick presets:</span>
                {[
                  "Next pop-up Thursday Nov 14th at Mike's Corner in Oslobukta at 12:00 · 75 kr",
                  "Live weekend drop at Trekanten, Pilestredet 24 from 12:00 until sold out",
                  "Seasonal pause / between residencies — next drop dates TBA on Instagram",
                ].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => {
                      setAiShiftInput(sample);
                      void handleParseAiShift(sample);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] hover:bg-amber-50 border border-[#E0D9CE] hover:border-amber-300 text-[10.5px] font-semibold text-zinc-700 transition-colors cursor-pointer truncate max-w-xs"
                  >
                    {sample}
                  </button>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleParseAiShift()}
                  disabled={isParsingAiShift || !aiShiftInput.trim()}
                  className="px-4 py-2 rounded-xl bg-[#181615] hover:bg-[#E84A27] text-white text-xs font-black flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isParsingAiShift ? "animate-spin" : ""}`} />
                  <span>{isParsingAiShift ? "Parsing with AI..." : "Parse Update & Preview Diff"}</span>
                </button>
              </div>
            </div>

            {aiShiftError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {aiShiftError}
              </div>
            )}

            {/* Step 2: Live Diff & Editable Override Form */}
            {aiShiftProposal && (
              <div className="space-y-4 pt-3 border-t border-[#EAE5DC]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[#E84A27]">
                    2. Review &amp; Tweak Proposed Updates Before Pushing
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-400">
                    All fields below are editable
                  </span>
                </div>

                {/* Live Feed Card Simulation Banner */}
                <div className="p-4 rounded-2xl bg-[#181615] text-white space-y-2 shadow-inner">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#E84A27] text-white text-xs font-bold whitespace-nowrap">
                      {aiShiftProposal.popup_meta.residency_status === "next_confirmed"
                        ? `⏳ ${aiShiftProposal.popup_meta.dates_label}`
                        : aiShiftProposal.popup_meta.residency_status === "between_residencies"
                        ? "✦ Pop-Up · Seasonal"
                        : "🔥 Pop-Up · Live"}
                    </span>
                    {aiShiftProposal.price_nok && (
                      <span className="px-2.5 py-1 rounded-full bg-[#E84A27] text-white text-xs font-bold whitespace-nowrap">
                        {aiShiftProposal.price_nok} kr
                      </span>
                    )}
                  </div>
                  <div className="pt-2">
                    <div className="text-xs font-extrabold text-[#E84A27]">
                      {aiShiftProposal.popup_meta.daily_hours}
                      {aiShiftProposal.popup_meta.portion_cap
                        ? ` · ${aiShiftProposal.popup_meta.portion_cap}`
                        : ""}
                    </div>
                    <div className="font-comico font-black text-lg text-white leading-tight mt-0.5">
                      {aiShiftProposal.signature_dish}
                    </div>
                    <div className="text-xs font-semibold text-white/90 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#E84A27] shrink-0" />
                      <span>
                        {spot.name}
                        {aiShiftProposal.popup_meta.host_venue_name
                          ? ` @ ${aiShiftProposal.popup_meta.host_venue_name.split(",")[0].trim()}`
                          : ""}{" "}
                        · {aiShiftProposal.neighborhood}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Side-by-Side Diff + Editable Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FAF7F2] p-4 rounded-2xl border border-[#EAE5DC]">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                      Residency Status
                    </label>
                    <select
                      value={aiShiftProposal.popup_meta.residency_status}
                      onChange={(e) =>
                        setAiShiftProposal({
                          ...aiShiftProposal,
                          popup_meta: {
                            ...aiShiftProposal.popup_meta,
                            residency_status: e.target.value as any,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-white border border-[#DDD6C9]"
                    >
                      <option value="next_confirmed">⏳ next_confirmed (Upcoming Date)</option>
                      <option value="active">🔥 active (Live Drop Now)</option>
                      <option value="between_residencies">✦ between_residencies (Seasonal / TBA)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                      Top-Left Dates Badge (`dates_label`)
                    </label>
                    <input
                      type="text"
                      value={aiShiftProposal.popup_meta.dates_label}
                      onChange={(e) =>
                        setAiShiftProposal({
                          ...aiShiftProposal,
                          popup_meta: {
                            ...aiShiftProposal.popup_meta,
                            dates_label: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-white border border-[#DDD6C9]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                      Host Venue Name (`host_venue_name`)
                    </label>
                    <input
                      type="text"
                      value={aiShiftProposal.popup_meta.host_venue_name}
                      onChange={(e) =>
                        setAiShiftProposal({
                          ...aiShiftProposal,
                          popup_meta: {
                            ...aiShiftProposal.popup_meta,
                            host_venue_name: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-white border border-[#DDD6C9]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                      Neighborhood (`was: {spot.neighborhood}`)
                    </label>
                    <input
                      type="text"
                      value={aiShiftProposal.neighborhood}
                      onChange={(e) =>
                        setAiShiftProposal({
                          ...aiShiftProposal,
                          neighborhood: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-white border border-[#DDD6C9]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                      Host Address (`was: {spot.address}`)
                    </label>
                    <input
                      type="text"
                      value={aiShiftProposal.address}
                      onChange={(e) =>
                        setAiShiftProposal({
                          ...aiShiftProposal,
                          address: e.target.value,
                          popup_meta: {
                            ...aiShiftProposal.popup_meta,
                            host_address: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-white border border-[#DDD6C9]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                      Drop Subtitle / Hours (`daily_hours`)
                    </label>
                    <input
                      type="text"
                      value={aiShiftProposal.popup_meta.daily_hours}
                      onChange={(e) =>
                        setAiShiftProposal({
                          ...aiShiftProposal,
                          opening_hours_text: e.target.value,
                          popup_meta: {
                            ...aiShiftProposal.popup_meta,
                            daily_hours: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-white border border-[#DDD6C9]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                      Batch / Portion Cap (`portion_cap`)
                    </label>
                    <input
                      type="text"
                      value={aiShiftProposal.popup_meta.portion_cap || ""}
                      onChange={(e) =>
                        setAiShiftProposal({
                          ...aiShiftProposal,
                          popup_meta: {
                            ...aiShiftProposal.popup_meta,
                            portion_cap: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-white border border-[#DDD6C9]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                      Signature Dish
                    </label>
                    <input
                      type="text"
                      value={aiShiftProposal.signature_dish}
                      onChange={(e) =>
                        setAiShiftProposal({
                          ...aiShiftProposal,
                          signature_dish: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-white border border-[#DDD6C9]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                      Dish Price (NOK)
                    </label>
                    <input
                      type="number"
                      value={aiShiftProposal.price_nok ?? ""}
                      onChange={(e) =>
                        setAiShiftProposal({
                          ...aiShiftProposal,
                          price_nok: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      placeholder="e.g. 75"
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-white border border-[#DDD6C9]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                      Latitude (`was: {spot.latitude}`)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={aiShiftProposal.latitude}
                      onChange={(e) =>
                        setAiShiftProposal({
                          ...aiShiftProposal,
                          latitude: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-white border border-[#DDD6C9]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                      Longitude (`was: {spot.longitude}`)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={aiShiftProposal.longitude}
                      onChange={(e) =>
                        setAiShiftProposal({
                          ...aiShiftProposal,
                          longitude: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-white border border-[#DDD6C9]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#EAE5DC]">
                  <button
                    type="button"
                    onClick={() => setIsAiShiftOpen(false)}
                    className="px-4 py-2 text-xs font-bold rounded-xl text-zinc-500 hover:text-[#181615] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleApplyAiShift()}
                    disabled={isApplyingAiShift}
                    className="px-6 py-2.5 text-xs font-black rounded-xl bg-[#E84A27] hover:bg-[#d03d1b] text-white shadow-md shadow-[#E84A27]/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Rocket className={`w-3.5 h-3.5 ${isApplyingAiShift ? "animate-bounce" : ""}`} />
                    <span>
                      {isApplyingAiShift
                        ? "Syncing JSON + Venues + Food Posts..."
                        : "Apply & Push to Production 🚀"}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
