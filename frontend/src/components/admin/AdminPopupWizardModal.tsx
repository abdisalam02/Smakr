"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Camera,
  Upload,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Instagram,
  Mail,
  Check,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { FOOD_CATEGORIES } from "@/lib/foodSeeds";
import type { Venue, FoodCategory, ResidencyStatus, FoodPost, Neighborhood } from "@/types";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { PopupEventCard } from "@/components/food/PopupEventCard";
import { insertVenue, updateVenue as updateVenueDb, uploadDishPhoto } from "@/lib/supabase/data";

export interface AdminPopupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPopupVenue?: Venue | null;
}

const QUICK_PHOTO_PRESETS = [
  { label: "🍜 Ramen", url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80", cat: "ramen" as FoodCategory },
  { label: "🍔 Smashburger", url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80", cat: "burger" as FoodCategory },
  { label: "🥐 Bakery", url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80", cat: "bakery" as FoodCategory },
  { label: "🌮 Tacos", url: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1200&q=80", cat: "street_food" as FoodCategory },
  { label: "🍕 Pizza", url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80", cat: "pizza" as FoodCategory },
  { label: "🥪 Sando", url: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80", cat: "pastrami" as FoodCategory },
];

export function AdminPopupWizardModal({
  isOpen,
  onClose,
  editingPopupVenue,
}: AdminPopupWizardModalProps) {
  const venues = useCityPulseStore((s) => s.venues);
  const addVenue = useCityPulseStore((s) => s.addVenue);
  const updateVenue = useCityPulseStore((s) => s.updateVenue);
  const addFoodPost = useCityPulseStore((s) => s.addFoodPost);
  const showToast = useCityPulseStore((s) => s.showToast);

  // Form Fields
  const [popupName, setPopupName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [category, setCategory] = useState<FoodCategory>("street_food");
  const [isDateTba, setIsDateTba] = useState(false);
  const [datesLabel, setDatesLabel] = useState("");
  const [hostSearch, setHostSearch] = useState("");
  const [dailyHours, setDailyHours] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [priceNok, setPriceNok] = useState<number | string>("");
  const [portionCap, setPortionCap] = useState("");
  const [guestChef, setGuestChef] = useState("");

  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // File upload handler
  const handleFileSelected = async (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setSelectedImageUrl(objectUrl);
    setIsUploadingPhoto(true);

    try {
      const { url } = await uploadDishPhoto(file);
      if (url) {
        setSelectedImageUrl(url);
        showToast("Photo uploaded successfully", "success");
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            setSelectedImageUrl(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setSelectedImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Populate fields on open or edit
  useEffect(() => {
    if (!isOpen) return;
    if (editingPopupVenue) {
      setPopupName(editingPopupVenue.name);
      setDescription(editingPopupVenue.description || "");
      setSelectedImageUrl(editingPopupVenue.cover_image_url || "");
      setCategory(editingPopupVenue.food_category || "street_food");
      const meta = editingPopupVenue.popup_meta;
      const isTba = Boolean(
        meta?.dates_label?.toLowerCase().includes("tba") ||
        meta?.residency_status === "between_residencies" ||
        meta?.host_venue_name?.toLowerCase().includes("tba")
      );
      setIsDateTba(isTba);
      setDatesLabel(meta?.dates_label || "");
      setHostSearch(meta?.host_venue_name && !meta.host_venue_name.toLowerCase().includes("tba") ? meta.host_venue_name : "");
      setDailyHours(meta?.daily_hours || meta?.event_hours || editingPopupVenue.current_opening_hours_text || "");
      setSocialUrl(meta?.instagram_url || meta?.tiktok_url || "");
      setContactEmail(meta?.ticket_url || editingPopupVenue.website_uri?.replace(/^mailto:/, "") || "");
      setPortionCap(meta?.portion_cap || "");
      setGuestChef(meta?.guest_chef || "");
      setPriceNok("");
    } else {
      setPopupName("");
      setDescription("");
      setSelectedImageUrl("");
      setCategory("street_food");
      setIsDateTba(false);
      setDatesLabel("");
      setHostSearch("");
      setDailyHours("");
      setSocialUrl("");
      setContactEmail("");
      setPriceNok("");
      setPortionCap("");
      setGuestChef("");
      setShowOptionalDetails(false);
    }
  }, [isOpen, editingPopupVenue]);

  // Derived effective values
  const effectiveDatesLabel = isDateTba ? "Dates TBA" : datesLabel || "Upcoming Drop";
  const effectiveHostName = isDateTba ? "Location TBA" : hostSearch || "Oslo Pop-Up";
  const effectiveStatus: ResidencyStatus = isDateTba ? "between_residencies" : "active";

  const previewVenue: Venue = {
    id: editingPopupVenue?.id || `popup_${Date.now()}`,
    name: popupName || "Oslo Pop-Up Residency",
    description: description || undefined,
    address: isDateTba ? "Oslo, Norway" : hostSearch ? `${hostSearch}, Oslo` : "Oslo, Norway",
    city: "Oslo",
    neighborhood: "sentrum" as Neighborhood,
    latitude: 59.9139,
    longitude: 10.7522,
    cover_image_url: selectedImageUrl,
    spot_type: "popup",
    food_category: category,
    signature_dishes: [],
    current_opening_hours_text: isDateTba ? undefined : dailyHours || undefined,
    website_uri: contactEmail.startsWith("http") ? contactEmail : contactEmail ? `mailto:${contactEmail}` : undefined,
    place_type: "cafe",
    has_wifi: true,
    has_outlets: false,
    silent_zone: false,
    outdoor_seating: false,
    dog_friendly: false,
    open_late: false,
    baseline_seats: 25,
    baseline_noise: 50,
    baseline_outlets: false,
    vibe: {
      overall_score: 9.4,
      noise_level: "moderate",
      busyness: "optimal",
      vibe_status: "optimal",
      active_checkins_count: 8,
      last_checkin_at: null,
      is_live: true,
      decay_factor: 1,
      avg_download_mbps: null,
      avg_ping_ms: null,
    } as any,
    popup_meta: {
      brand_id: editingPopupVenue?.popup_meta?.brand_id || `brand_${Date.now()}`,
      residency_status: effectiveStatus,
      host_venue_name: effectiveHostName,
      host_address: isDateTba ? "Oslo, Norway" : hostSearch || "Oslo, Norway",
      guest_chef: guestChef || undefined,
      dates_label: effectiveDatesLabel,
      daily_hours: isDateTba ? undefined : dailyHours || undefined,
      event_hours: isDateTba ? undefined : dailyHours || undefined,
      portion_cap: portionCap || undefined,
      entry_type: "walk_in",
      ticket_url: contactEmail.startsWith("http") ? contactEmail : undefined,
      instagram_url: socialUrl ? (socialUrl.startsWith("http") ? socialUrl : `https://instagram.com/${socialUrl.replace(/^@/, "")}`) : undefined,
      bring_back_count: editingPopupVenue?.popup_meta?.bring_back_count || 0,
    },
  };

  const previewPost: FoodPost = {
    id: `post_${previewVenue.id}`,
    spot_id: previewVenue.id,
    spot_name: previewVenue.name,
    spot_address: previewVenue.address,
    spot_neighborhood: "sentrum" as Neighborhood,
    spot_coords: [10.7522, 59.9139],
    dish_name: popupName || "Oslo Pop-Up Drop",
    price_nok: typeof priceNok === "number" ? priceNok : priceNok ? parseInt(priceNok as string, 10) || null : null,
    category,
    image_url: selectedImageUrl,
    review_text: description || "Oslo culinary residency drop.",
    rating: 9.6,
    taste_tags: [category, "limited drop"],
    dietary_tags: [],
    author: {
      name: guestChef || "Smakr Editorial",
      handle: "@smakr_oslo",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
      badge: "Chef",
    },
    likes_count: 0,
    saves_count: 0,
    created_at_relative: "Just now",
    spot_type: "popup",
    is_drop: true,
    drop_badge: isDateTba ? "⏳ Announcing Soon" : "Limited Batch",
  };

  const handlePublish = async () => {
    if (!popupName.trim()) {
      showToast("Please enter a pop-up brand name", "error");
      return;
    }

    setIsPublishing(true);
    try {
      const finalVenue: Venue = {
        ...previewVenue,
      };

      if (editingPopupVenue) {
        updateVenue(finalVenue.id, finalVenue);
        await updateVenueDb(finalVenue.id, {
          name: finalVenue.name,
          address: finalVenue.address,
          description: description || undefined,
          imageUrl: finalVenue.cover_image_url || undefined,
          spotType: "popup",
          popupMeta: finalVenue.popup_meta || undefined,
        }).catch(() => {});
        showToast(`Updated residency: ${finalVenue.name}`, "success");
      } else {
        addVenue(finalVenue);

        await insertVenue({
          name: finalVenue.name,
          address: finalVenue.address,
          category: category,
          latitude: finalVenue.latitude,
          longitude: finalVenue.longitude,
          imageUrl: finalVenue.cover_image_url || undefined,
          description: description || undefined,
          currentOpeningHoursText: isDateTba ? undefined : dailyHours || undefined,
          spotType: "popup",
          popupMeta: finalVenue.popup_meta || undefined,
          neighborhood: "sentrum" as any,
        }).catch(() => {});

        showToast("Pop-up published to live Oslo Radar!", "success");
      }

      onClose();
    } catch (err: any) {
      showToast(err.message || "Failed to publish pop-up", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-[#181615]/70 backdrop-blur-sm"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="relative z-10 w-full max-w-4xl bg-[#FAF7F2] dark:bg-[#1C1917] rounded-3xl border border-[#181615]/10 shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#181615]/10 flex items-center justify-between bg-[#F5EFE4] dark:bg-[#181615]/50">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#E84A27] text-white flex items-center justify-center text-sm font-bold font-comico shrink-0 shadow-2xs">
              🎟️
            </span>
            <div>
              <h3 className="font-comico text-base sm:text-lg font-black text-[#181615] dark:text-white uppercase tracking-tight">
                {editingPopupVenue ? "Edit Pop-up Residency" : "Create Pop-Up Drop"}
              </h3>
              <p className="text-[11px] text-zinc-500 font-medium">
                Photo, brand concept, social handle, and drop timing for Oslo radar
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: 2-Column Responsive Layout */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Input Fields (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. HERO PHOTO DROPZONE */}
            <div className="p-4 rounded-2xl bg-[#F5EFE4] dark:bg-[#23201D] border border-[#181615]/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#181615] dark:text-white flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#E84A27]" />
                  <span>Residency Photo / Poster *</span>
                </label>
                <span className="text-[10px] text-zinc-500 font-medium">Upload or 1-tap food presets</span>
              </div>

              <div className="flex items-start gap-3.5">
                {/* Visual Dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-28 rounded-2xl overflow-hidden shrink-0 border-2 border-dashed border-[#181615]/20 hover:border-[#E84A27] bg-white dark:bg-[#181615] shadow-xs relative flex flex-col items-center justify-center cursor-pointer group transition-all"
                >
                  {selectedImageUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedImageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[11px] font-bold transition-opacity">
                        Replace
                      </div>
                    </>
                  ) : isUploadingPhoto ? (
                    <Loader2 className="w-6 h-6 animate-spin text-[#E84A27]" />
                  ) : (
                    <div className="text-center p-2">
                      <Upload className="w-5 h-5 mx-auto text-[#E84A27] mb-1" />
                      <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 block leading-tight">
                        Upload Image
                      </span>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelected(f);
                  }}
                />

                <div className="flex-1 space-y-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-xl bg-white dark:bg-[#181615] hover:bg-black/5 dark:hover:bg-white/10 border border-[#181615]/15 text-xs font-bold text-[#181615] dark:text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#E84A27]" />
                    <span>{selectedImageUrl ? "Replace Photo" : "Upload File from Device"}</span>
                  </button>

                  <input
                    type="url"
                    value={selectedImageUrl}
                    onChange={(e) => setSelectedImageUrl(e.target.value)}
                    placeholder="Or paste public photo URL (https://...)"
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/15 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#E84A27]"
                  />

                  {/* 1-Tap Food Presets */}
                  <div className="flex flex-wrap gap-1">
                    {QUICK_PHOTO_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setSelectedImageUrl(preset.url);
                          setCategory(preset.cat);
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          selectedImageUrl === preset.url
                            ? "bg-[#E84A27] text-white border-[#E84A27]"
                            : "bg-white dark:bg-[#181615] text-zinc-700 dark:text-zinc-300 border-[#181615]/10 hover:border-black/30"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. POP-UP BRAND & STORY */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>Pop-up Brand Name / Title *</span>
                  <span className="text-[10px] text-zinc-400">Required</span>
                </label>
                <input
                  type="text"
                  value={popupName}
                  onChange={(e) => setPopupName(e.target.value)}
                  placeholder="e.g. U WAN SUM, Hot Temper Ramen, Nolo Burger Crew..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#23201D] border border-[#181615]/15 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#E84A27] font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Concept Story / Dish Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell diners what this pop-up is serving (e.g. Sourdough pastries & artisan brioche drops in Oslo)..."
                  className="w-full p-3 rounded-xl bg-white dark:bg-[#23201D] border border-[#181615]/15 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#E84A27] resize-none"
                />
              </div>
            </div>

            {/* 3. SOCIALS & COMMUNITY CONTACT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5 text-pink-600" />
                  <span>Instagram Profile / Handle</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">@</span>
                  <input
                    type="text"
                    value={socialUrl.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "")}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      setSocialUrl(val ? (val.startsWith("http") ? val : `https://instagram.com/${val.replace(/^@/, "")}`) : "");
                    }}
                    placeholder="u_wan_sum or handle"
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-white dark:bg-[#23201D] border border-[#181615]/15 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#E84A27]"
                  />
                </div>
                <p className="text-[10px] text-zinc-400">Diners follow this for drop updates</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Contact Email or RSVP Link</span>
                </label>
                <input
                  type="text"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@bakery.no or https://..."
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#23201D] border border-[#181615]/15 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#E84A27]"
                />
                <p className="text-[10px] text-zinc-400">Optional info link</p>
              </div>
            </div>

            {/* 4. DROP TIMING & SCHEDULE */}
            <div className="p-4 rounded-2xl bg-[#F5EFE4] dark:bg-[#23201D] border border-[#181615]/10 space-y-3">
              <label className="text-xs font-bold text-[#181615] dark:text-white block">
                Drop Schedule &amp; Operational Status
              </label>

              {/* 2-way status toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsDateTba(false)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    !isDateTba
                      ? "bg-[#181615] text-white border-[#181615] shadow-xs"
                      : "bg-white dark:bg-[#181615] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Live or Confirmed Drop</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDateTba(true)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isDateTba
                      ? "bg-[#E84A27] text-white border-[#E84A27] shadow-xs"
                      : "bg-white dark:bg-[#181615] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-stone-300" />
                  <span>Dates TBA / Inactive</span>
                </button>
              </div>

              {/* When ACTIVE: Show clean Dates, Host & Hours */}
              {!isDateTba ? (
                <div className="pt-2 border-t border-[#181615]/10 space-y-3 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        Dates Window
                      </label>
                      <input
                        type="text"
                        value={datesLabel}
                        onChange={(e) => setDatesLabel(e.target.value)}
                        placeholder="e.g. Oct 24–26 or This Weekend"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/15 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#E84A27]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        Host Venue or Location
                      </label>
                      <input
                        type="text"
                        value={hostSearch}
                        onChange={(e) => setHostSearch(e.target.value)}
                        placeholder="e.g. Becco, Fuglen, Trekanten, Youngstorget"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/15 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#E84A27]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                      <span>Opening Hours</span>
                      <span className="text-[10px] text-zinc-400">Quick select</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {["17:00 – Late", "16:00 – Sold Out", "12:00 – 18:00", "Thu–Sun 17:00"].map((hrs) => (
                        <button
                          key={hrs}
                          type="button"
                          onClick={() => setDailyHours(hrs)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                            dailyHours === hrs
                              ? "bg-[#181615] text-white border-[#181615]"
                              : "bg-white dark:bg-[#181615] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                          }`}
                        >
                          {hrs}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={dailyHours}
                      onChange={(e) => setDailyHours(e.target.value)}
                      placeholder="e.g. 17:00 – Late (til tomt)"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/15 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#E84A27]"
                    />
                  </div>
                </div>
              ) : (
                /* When TBA / Inactive: Simple explanation */
                <div className="pt-2 border-t border-[#181615]/10 animate-in fade-in duration-200">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Card displays marked as <strong>Inactive</strong> without dates or location. Diners can read the story and follow Instagram for the drop announcement.
                  </p>
                </div>
              )}
            </div>

            {/* 5. OPTIONAL DETAILS DRAWER */}
            <div>
              <button
                type="button"
                onClick={() => setShowOptionalDetails(!showOptionalDetails)}
                className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer transition-colors"
              >
                <span>{showOptionalDetails ? "Hide optional details" : "+ Add category, price, or batch limit"}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showOptionalDetails ? "rotate-180" : ""}`} />
              </button>

              {showOptionalDetails && (
                <div className="mt-3 p-3.5 rounded-2xl bg-white dark:bg-[#23201D] border border-[#181615]/10 space-y-3 animate-in fade-in duration-200">
                  {/* Category Chips */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                      Food Category
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {FOOD_CATEGORIES.slice(0, 8).map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id as FoodCategory)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                            category === cat.id
                              ? "bg-[#181615] text-white border-[#181615]"
                              : "bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                        Estimated Price (NOK)
                      </label>
                      <input
                        type="number"
                        value={priceNok}
                        onChange={(e) => setPriceNok(e.target.value)}
                        placeholder="e.g. 195 (optional)"
                        className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#E84A27]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                        Portion / Batch Cap
                      </label>
                      <input
                        type="text"
                        value={portionCap}
                        onChange={(e) => setPortionCap(e.target.value)}
                        placeholder="e.g. 80 bowls/day"
                        className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#E84A27]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Live Card Preview (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-start space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 self-start">
              Live Feed Preview
            </span>
            <div className="w-full max-w-[340px]">
              <PopupEventCard venue={previewVenue} post={previewPost} />
            </div>
            <p className="text-[11px] text-zinc-400 text-center max-w-[280px]">
              This is exactly how diners will see the pop-up card in the Oslo food feed.
            </p>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-[#181615]/10 bg-[#F5EFE4] dark:bg-[#181615]/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl bg-white dark:bg-[#23201D] border border-[#181615]/10 text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 cursor-pointer hover:bg-zinc-100"
          >
            <span>Cancel</span>
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="px-6 py-2.5 rounded-2xl bg-[#E84A27] hover:bg-[#D43D1C] text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isPublishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 fill-white" />
            )}
            <span>{editingPopupVenue ? "Save Residency Changes" : "Publish Pop-Up Now"}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
