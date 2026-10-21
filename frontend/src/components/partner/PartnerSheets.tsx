"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Upload,
  Camera,
  Check,
  Loader2,
  Sparkles,
  Clock,
  Truck,
  Store,
  Coins,
  ShieldCheck,
  HelpCircle,
  Plus,
} from "lucide-react";
import { FOOD_CATEGORIES } from "@/lib/foodSeeds";
import type { DietaryTag, FoodCategory, SpotType, PopupResidencyMeta } from "@/types";
import type { PartnerDishItem } from "./PartnerRestaurantCardPreview";
import { VisualPhotoSwitcher } from "@/components/ui/VisualPhotoSwitcher";

const DIETARY_CHOICES: { id: DietaryTag; label: string }[] = [
  { id: "halal", label: "Halal" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten_free", label: "Gluten-Free" },
];

/* =========================================================================
   BASE DRAWER CONTAINER
   ========================================================================= */
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function BaseDrawer({ isOpen, onClose, title, subtitle, children }: DrawerProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs"
        />

        {/* Modal / Sheet container */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative w-full max-w-xl max-h-[90dvh] bg-[var(--surface)] border border-[var(--surface-border)] rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* Header */}
          <div className="pt-3 pb-3 px-5 sm:px-6 border-b border-[var(--surface-border)] flex flex-col items-center shrink-0">
            <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 mb-3 sm:hidden" />
            <div className="w-full flex items-center justify-between gap-3">
              <div>
                <h3 className="font-comico text-lg sm:text-xl text-zinc-950 dark:text-white font-bold">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full bg-[var(--surface-raised)] hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 no-scrollbar">
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/* =========================================================================
   1. EDIT COVER PHOTO SHEET
   ========================================================================= */
interface EditCoverPhotoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhoto: string;
  venuePhotos: string[];
  onSelectPhoto: (url: string) => void;
  onUploadSuccess: (url: string) => void;
  showToast: (msg: string) => void;
}

export function EditCoverPhotoSheet({
  isOpen,
  onClose,
  currentPhoto,
  venuePhotos,
  onSelectPhoto,
  onUploadSuccess,
  showToast,
}: EditCoverPhotoSheetProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      showToast("Photo must be under 4MB.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/partner/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || "Upload failed. Try another photo.");
        return;
      }
      onUploadSuccess(data.url);
      showToast("Cover photo uploaded!");
      onClose();
    } catch {
      showToast("Network error uploading photo.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Restaurant Cover Photo"
      subtitle="Select an authentic shot or upload a high-resolution hero photo."
    >
      {/* Upload button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-98 disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying &amp; Uploading…</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Upload New Photo (Max 4MB)</span>
            </>
          )}
        </button>
      </div>

      {/* Available Photos Grid */}
      {venuePhotos.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
            Available Google &amp; Venue Photos ({venuePhotos.length})
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {venuePhotos.map((url, idx) => {
              const isSelected = currentPhoto === url;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onSelectPhoto(url);
                    showToast("Cover photo updated");
                    onClose();
                  }}
                  className={`group relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#e84a27] ring-2 ring-[#e84a27]/30 scale-[1.02]"
                      : "border-[var(--surface-border)] hover:border-zinc-400"
                  }`}
                >
                  <Image
                    src={url}
                    alt="Venue photo option"
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="160px"
                  />
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#e84a27] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </BaseDrawer>
  );
}

/* =========================================================================
   2. EDIT HOURS & SPOT INFO SHEET
   ========================================================================= */
interface EditHoursSheetProps {
  isOpen: boolean;
  onClose: () => void;
  spotType: SpotType | "standard" | "pop_up";
  setSpotType: (type: "standard" | "food_truck" | "pop_up") => void;
  openingHours: string;
  setOpeningHours: (h: string) => void;
  locationSchedule: string;
  setLocationSchedule: (s: string) => void;
  popupMeta?: PopupResidencyMeta | null;
  setPopupMeta?: (meta: PopupResidencyMeta) => void;
  showToast: (msg: string) => void;
}

export function EditHoursSheet({
  isOpen,
  onClose,
  spotType,
  setSpotType,
  openingHours,
  setOpeningHours,
  locationSchedule,
  setLocationSchedule,
  popupMeta,
  setPopupMeta,
  showToast,
}: EditHoursSheetProps) {
  const [localType, setLocalType] = useState<"standard" | "food_truck" | "pop_up">(
    spotType === "food_truck" ? "food_truck" : spotType === "pop_up" || spotType === "popup" ? "pop_up" : "standard"
  );
  const [localHours, setLocalHours] = useState(openingHours);
  const [localSchedule, setLocalSchedule] = useState(locationSchedule);
  const [localHostVenue, setLocalHostVenue] = useState(popupMeta?.host_venue_name || "");
  const [localGuestChef, setLocalGuestChef] = useState(popupMeta?.guest_chef || "");
  const [localDateLabel, setLocalDateLabel] = useState(popupMeta?.date_label || "");
  const [localBatchLimit, setLocalBatchLimit] = useState(
    popupMeta?.batch_limit ? String(popupMeta.batch_limit) : ""
  );

  const handleSave = () => {
    setSpotType(localType);
    setOpeningHours(localHours.trim());
    setLocationSchedule(localSchedule.trim());
    if (setPopupMeta && (localType === "pop_up")) {
      setPopupMeta({
        ...popupMeta,
        host_venue_name: localHostVenue.trim() || undefined,
        guest_chef: localGuestChef.trim() || undefined,
        date_label: localDateLabel.trim() || undefined,
        batch_limit: localBatchLimit.trim() || undefined,
      });
    }
    showToast("Opening hours and spot details updated");
    onClose();
  };

  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Opening Hours &amp; Spot Format"
      subtitle="Correct your closing times, mobile truck schedule or pop-up residency."
    >
      <div className="space-y-4">
        {/* Format Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
            Spot Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "standard", label: "Restaurant / Cafe", icon: Store },
              { id: "food_truck", label: "Food Truck", icon: Truck },
              { id: "pop_up", label: "Pop-Up Residency", icon: Clock },
            ].map((opt) => {
              const Icon = opt.icon;
              const isSelected = localType === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLocalType(opt.id as any)}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#e84a27] bg-[#e84a27]/10 text-[#e84a27] font-bold"
                      : "border-[var(--surface-border)] bg-[var(--surface-raised)] text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Regular Hours Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
            Opening Hours Summary
          </label>
          <input
            type="text"
            value={localHours}
            onChange={(e) => setLocalHours(e.target.value)}
            placeholder="e.g. Mon-Fri: 11:00-22:00, Sat-Sun: 12:00-22:00"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-raised)] text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#e84a27]"
          />
          <p className="text-[11px] text-zinc-400">
            Shown prominently on your card when Google Maps has outdated closing hours.
          </p>
        </div>

        {/* Food Truck Schedule */}
        {localType === "food_truck" && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
              Food Truck Schedule &amp; Pitch
            </label>
            <input
              type="text"
              value={localSchedule}
              onChange={(e) => setLocalSchedule(e.target.value)}
              placeholder="e.g. Youngstorget Tue-Sat 12-19 · Torggata Sun 13-18"
              className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-[var(--surface-raised)] text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        )}

        {/* Pop-Up Residency Details */}
        {localType === "pop_up" && (
          <div className="space-y-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
              <span>🎪</span>
              <span>Pop-Up Residency Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                  Host Venue Name
                </label>
                <input
                  type="text"
                  value={localHostVenue}
                  onChange={(e) => setLocalHostVenue(e.target.value)}
                  placeholder="e.g. Becco Wine Bar"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#e84a27]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                  Guest Chef / Concept
                </label>
                <input
                  type="text"
                  value={localGuestChef}
                  onChange={(e) => setLocalGuestChef(e.target.value)}
                  placeholder="e.g. Hot Temper Ramen Crew"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#e84a27]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                  Residency Dates
                </label>
                <input
                  type="text"
                  value={localDateLabel}
                  onChange={(e) => setLocalDateLabel(e.target.value)}
                  placeholder="e.g. Oct 24 – Oct 28"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#e84a27]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                  Daily Batch Limit (Portions)
                </label>
                <input
                  type="number"
                  value={localBatchLimit}
                  onChange={(e) => setLocalBatchLimit(e.target.value)}
                  placeholder="e.g. 80"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#e84a27]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          Save Hours &amp; Format
        </button>
      </div>
    </BaseDrawer>
  );
}

/* =========================================================================
   3. EDIT SIGNATURE DISH SHEET
   ========================================================================= */
interface EditDishSheetProps {
  isOpen: boolean;
  onClose: () => void;
  dishName: string;
  setDishName: (name: string) => void;
  priceNok: number | "";
  setPriceNok: (price: number | "") => void;
  dishImageUrl: string;
  setDishImageUrl: (url: string) => void;
  tasteNote: string;
  setTasteNote: (note: string) => void;
  category: FoodCategory;
  setCategory: (cat: FoodCategory) => void;
  dietaryTags: DietaryTag[];
  setDietaryTags: (tags: DietaryTag[]) => void;
  venuePhotos: string[];
  venueName?: string;
  showToast: (msg: string) => void;
}

export function EditDishSheet({
  isOpen,
  onClose,
  dishName,
  setDishName,
  priceNok,
  setPriceNok,
  dishImageUrl,
  setDishImageUrl,
  tasteNote,
  setTasteNote,
  category,
  setCategory,
  dietaryTags,
  setDietaryTags,
  venuePhotos,
  venueName,
  showToast,
}: EditDishSheetProps) {
  const [localName, setLocalName] = useState(dishName);
  const [localPrice, setLocalPrice] = useState<number | "">(priceNok);
  const [localImage, setLocalImage] = useState(dishImageUrl);
  const [localNote, setLocalNote] = useState(tasteNote);
  const [localCategory, setLocalCategory] = useState<FoodCategory>(category);
  const [localTags, setLocalTags] = useState<DietaryTag[]>(dietaryTags);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingNote, setIsGeneratingNote] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial on open
  React.useEffect(() => {
    if (isOpen) {
      setLocalName(dishName);
      setLocalPrice(priceNok);
      setLocalImage(dishImageUrl);
      setLocalNote(tasteNote);
      setLocalCategory(category);
      setLocalTags(dietaryTags);
    }
  }, [isOpen, dishName, priceNok, dishImageUrl, tasteNote, category, dietaryTags]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      showToast("Photo must be under 4MB.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/partner/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || "Upload failed.");
        return;
      }
      setLocalImage(data.url);
      showToast("Dish photo uploaded!");
    } catch {
      showToast("Network error uploading photo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateTasteNote = async () => {
    if (!localName.trim()) {
      showToast("Enter dish name first.");
      return;
    }
    setIsGeneratingNote(true);
    try {
      const res = await fetch("/api/admin/ai-curate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "generate-dish-note",
          dishName: localName.trim(),
          venueName: venueName || "Oslo Spot",
          category: localCategory,
        }),
      });
      const data = await res.json();
      if (data.tasteNote || data.note) {
        setLocalNote((data.tasteNote || data.note).slice(0, 160));
        showToast("Taste note generated!");
      }
    } catch {
      showToast("Could not generate note.");
    } finally {
      setIsGeneratingNote(false);
    }
  };

  const toggleTag = (tag: DietaryTag) => {
    setLocalTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = () => {
    if (!localName.trim()) {
      showToast("Please enter a dish name.");
      return;
    }
    setDishName(localName.trim());
    setPriceNok(localPrice);
    setDishImageUrl(localImage);
    setTasteNote(localNote.trim());
    setCategory(localCategory);
    setDietaryTags(localTags);
    showToast("Signature dish updated!");
    onClose();
  };

  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Signature Dish"
      subtitle="The headline item shown on your radar card and feed."
    >
      <div className="space-y-4">
        {/* Dish Name & Price */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              Dish Name
            </label>
            <input
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              placeholder="e.g. Spicy Miso Tonkotsu Ramen"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-raised)] text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#e84a27]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              In-House NOK Price
            </label>
            <input
              type="number"
              min={1}
              max={2000}
              value={localPrice}
              onChange={(e) =>
                setLocalPrice(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="e.g. 185"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-raised)] text-xs font-mono font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-[#e84a27]"
            />
          </div>
        </div>

        {/* Dish Photo Picker & Upload */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              Dish Photo
            </label>
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#e84a27] hover:underline cursor-pointer"
            >
              <Upload className="w-3 h-3" />
              <span>Upload File</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileUpload}
            className="hidden"
          />

          {localImage && (
            <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-[var(--surface-border)] bg-zinc-900">
              <Image
                src={localImage}
                alt="Selected dish"
                fill
                unoptimized
                className="object-cover"
                sizes="400px"
              />
              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-mono">
                Selected
              </span>
            </div>
          )}

          {venuePhotos.length > 0 && (
            <div className="grid grid-cols-4 gap-2 pt-1">
              {venuePhotos.slice(0, 4).map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLocalImage(url)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer ${
                    localImage === url
                      ? "border-[#e84a27] ring-2 ring-[#e84a27]/30"
                      : "border-[var(--surface-border)] opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={url} alt="Option" fill unoptimized className="object-cover" sizes="90px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Taste Note with AI Refine Button */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              Insider Taste Note (Max 160 characters)
            </label>
            <button
              type="button"
              disabled={isGeneratingNote}
              onClick={handleGenerateTasteNote}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#e84a27] hover:underline cursor-pointer disabled:opacity-50"
            >
              {isGeneratingNote ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              <span>AI Taste Note</span>
            </button>
          </div>

          <textarea
            rows={2}
            value={localNote}
            onChange={(e) => setLocalNote(e.target.value.slice(0, 160))}
            placeholder="e.g. 14-hour rich pork broth, springy noodles, and pickled bamboo with roasted garlic chili oil."
            className="w-full px-3.5 py-2 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-raised)] text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#e84a27] leading-relaxed"
          />
        </div>

        {/* Dietary tags */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
            Dietary Tags
          </label>
          <div className="flex flex-wrap gap-1.5">
            {DIETARY_CHOICES.map((choice) => {
              const isSelected = localTags.includes(choice.id);
              return (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => toggleTag(choice.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#e84a27] text-white shadow-xs"
                      : "bg-[var(--surface-raised)] text-zinc-700 dark:text-zinc-300 border border-[var(--surface-border)] hover:border-zinc-400"
                  }`}
                >
                  {choice.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          Save Signature Dish
        </button>
      </div>
    </BaseDrawer>
  );
}

/* =========================================================================
   4. SUBMIT CLAIM SHEET
   ========================================================================= */
interface SubmitClaimSheetProps {
  isOpen: boolean;
  onClose: () => void;
  venueName: string;
  venueId: string;
  venueAddress?: string;
  neighborhood?: string;
  proposedCard: Record<string, unknown>;
  onSuccess: (claimId: string) => void;
  showToast: (msg: string) => void;
}

export function SubmitClaimSheet({
  isOpen,
  onClose,
  venueName,
  venueId,
  venueAddress,
  neighborhood,
  proposedCard,
  onSuccess,
  showToast,
}: SubmitClaimSheetProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("owner");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orgNumber, setOrgNumber] = useState("");
  const [websiteHoneypot, setWebsiteHoneypot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid business email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/partner/propose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId,
          venueName,
          venueAddress,
          neighborhood,
          website: websiteHoneypot,
          applicant: {
            name: name.trim(),
            role,
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            orgNumber: orgNumber.trim(),
          },
          proposedCard,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Submission failed. Please check details.");
        setIsSubmitting(false);
        return;
      }

      showToast("Claim submitted successfully!");
      onSuccess(data.claimId);
      onClose();
    } catch {
      setError("Network error while submitting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Verify Restaurant Ownership"
      subtitle={`Submit your proposed card for ${venueName} to receive your Kitchen Remote.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Name & Role */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              Your Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Martin Solberg"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-raised)] text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#e84a27]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              Your Role at Venue *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-raised)] text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#e84a27]"
            >
              <option value="owner">Owner / Founder</option>
              <option value="chef">Head Chef / Cook</option>
              <option value="manager">General Manager</option>
              <option value="staff">Staff / Contributor</option>
            </select>
          </div>
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              Business Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. chef@diggpizza.no"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-raised)] text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#e84a27]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              Norwegian Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 91234567"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-raised)] text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#e84a27]"
            />
          </div>
        </div>

        {/* Org number */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
            Norwegian Org. Number (Brønnøysund 9 digits)
          </label>
          <input
            type="text"
            value={orgNumber}
            onChange={(e) => setOrgNumber(e.target.value.replace(/\s+/g, ""))}
            placeholder="e.g. 987654321"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-raised)] text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:border-[#e84a27]"
          />
        </div>

        {/* Honeypot */}
        <input
          type="text"
          value={websiteHoneypot}
          onChange={(e) => setWebsiteHoneypot(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Submitting Verification…</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Submit Verification Claim &amp; Deploy Changes</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-zinc-500 text-center leading-snug">
          We review within 2 working days. Once approved, your updates go live on the Oslo radar, and we send your private Kitchen Remote link to your email.
        </p>
      </form>
    </BaseDrawer>
  );
}

/* =========================================================================
   6. PARTNER MULTI-DISH EDITOR SHEET
   ========================================================================= */
export interface PartnerDishEditorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  dish: PartnerDishItem | null;
  venuePlaceId?: string | null;
  venueName?: string;
  category?: FoodCategory;
  onSaveDish: (dish: PartnerDishItem) => void;
  onDeleteDish?: (dishId: string) => void;
  showToast: (msg: string, type?: "success" | "error") => void;
}

export function PartnerDishEditorSheet({
  isOpen,
  onClose,
  dish,
  venuePlaceId,
  venueName,
  category = "street_food",
  onSaveDish,
  onDeleteDish,
  showToast,
}: PartnerDishEditorSheetProps) {
  const [name, setName] = useState(dish?.dishName || "");
  const [price, setPrice] = useState<number | "">(dish?.priceNok ?? 185);
  const [imageUrl, setImageUrl] = useState(dish?.imageUrl || "");
  const [tasteNote, setTasteNote] = useState(dish?.tasteNote || "");
  const [dishCategory, setDishCategory] = useState<FoodCategory>(
    (dish?.category as FoodCategory) || category
  );
  const [dietary, setDietary] = useState<DietaryTag[]>(
    (dish?.dietaryTags as DietaryTag[]) || []
  );

  React.useEffect(() => {
    if (isOpen) {
      setName(dish?.dishName || "");
      setPrice(dish?.priceNok ?? 185);
      setImageUrl(dish?.imageUrl || "");
      setTasteNote(dish?.tasteNote || "");
      setDishCategory((dish?.category as FoodCategory) || category);
      setDietary((dish?.dietaryTags as DietaryTag[]) || []);
    }
  }, [isOpen, dish, category]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) {
      showToast("Please enter a dish name", "error");
      return;
    }
    const cleanPrice = price === "" ? null : Number(price);
    const item: PartnerDishItem = {
      id: dish?.id || `dish_${Date.now()}`,
      dishName: name.trim(),
      priceNok: cleanPrice,
      imageUrl,
      tasteNote: tasteNote.trim() || `Prepared fresh in-house at ${venueName || "our kitchen"}.`,
      category: dishCategory,
      dietaryTags: dietary,
    };
    onSaveDish(item);
    showToast("Dish saved");
    onClose();
  };

  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={dish ? "Edit Menu Dish" : "Add Menu Dish"}
      subtitle={venueName ? `For ${venueName}` : undefined}
    >
      <div className="space-y-5">
        {/* Visual Photo Switcher */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-900 dark:text-white">
            Dish Photo
          </label>
          <VisualPhotoSwitcher
            currentImageUrl={imageUrl}
            onSelectPhoto={setImageUrl}
            venuePlaceId={venuePlaceId}
            venueName={venueName}
            category={dishCategory}
            label="Dish Photo"
          />
        </div>

        {/* Name and Price */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-zinc-900 dark:text-white">
              Dish Title *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Karaage Chicken, Tonkotsu Ramen"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-raised)] text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:border-[#e84a27]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-900 dark:text-white">
              Price (NOK)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="185"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-raised)] text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:border-[#e84a27]"
            />
          </div>
        </div>

        {/* Taste Note / Description */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-900 dark:text-white">
            Taste Note &amp; Ingredients
          </label>
          <textarea
            rows={2}
            value={tasteNote}
            onChange={(e) => setTasteNote(e.target.value)}
            placeholder="Special flavours, homemade sauces, allergens..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-raised)] text-xs font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#e84a27]"
          />
        </div>

        {/* Dietary tags */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-900 dark:text-white">
            Dietary Info
          </label>
          <div className="flex flex-wrap gap-2">
            {DIETARY_CHOICES.map((tag) => {
              const active = dietary.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    setDietary((prev) =>
                      active ? prev.filter((d) => d !== tag.id) : [...prev, tag.id]
                    );
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-[#181615] text-white shadow-2xs"
                      : "bg-[var(--surface-raised)] border border-[var(--surface-border)] text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {active ? `✓ ${tag.label}` : tag.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 flex items-center justify-between gap-3 border-t border-[var(--surface-border)]">
          {dish && onDeleteDish ? (
            <button
              type="button"
              onClick={() => {
                onDeleteDish(dish.id);
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl border border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-xs font-bold cursor-pointer transition-colors"
            >
              Remove Dish
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--surface-border)] text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-[#e84a27] hover:bg-[#d23e1d] text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              Save Dish
            </button>
          </div>
        </div>
      </div>
    </BaseDrawer>
  );
}
