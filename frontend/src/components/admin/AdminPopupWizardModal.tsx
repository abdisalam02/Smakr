"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Sparkles,
  Ticket,
  Store,
  MapPin,
  Calendar,
  Clock,
  Coins,
  ChefHat,
  Upload,
  Camera,
  Check,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Flame,
  Search,
  ExternalLink,
  Zap,
} from "lucide-react";
import { FOOD_CATEGORIES } from "@/lib/foodSeeds";
import type { Venue, DietaryTag, FoodCategory, PopupResidencyMeta, ResidencyStatus, FoodPost, Neighborhood } from "@/types";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { PopupEventCard } from "@/components/food/PopupEventCard";
import { TimeSlotPicker, DateWindowPicker } from "@/components/ui/TimeSlotPicker";
import { VisualPhotoSwitcher } from "@/components/ui/VisualPhotoSwitcher";
import { insertVenue, updateVenue as updateVenueDb, insertFoodPost } from "@/lib/supabase/data";

export interface AdminPopupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPopupVenue?: Venue | null;
}

const PRESET_HOT_TEMPER = {
  popupName: "Hot Temper Ramen",
  guestChef: "Hot Temper / Chef Ole",
  hostVenueQuery: "Becco",
  datesLabel: "Oct 24–26, 2026",
  dailyHours: "17:00 – Late (til tomt)",
  portionCap: "80 bowls/night",
  entryType: "walk_in" as const,
  dishName: "Tokyo Duck Shio Ramen",
  priceNok: 195,
  category: "ramen" as FoodCategory,
  tasteNote: "Rich roasted duck broth with house-made alkaline noodles, charred leeks, and fragrant yuzu oil.",
  imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80",
};

const PRESET_NOLO = {
  popupName: "Nolo Burger Crew",
  guestChef: "Nolo Street Collective",
  hostVenueQuery: "Trekanten",
  datesLabel: "Nov 07–09, 2026",
  dailyHours: "16:00 – Sold Out",
  portionCap: "120 burgers/day",
  entryType: "walk_in" as const,
  dishName: "Dry-Aged Double Smash",
  priceNok: 185,
  category: "burger" as FoodCategory,
  tasteNote: "Ultra-crispy lacy edges, double Norwegian cheddar, pickled red onions, and toasted potato bun.",
  imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
};

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

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Ingestion inputs
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [isExtractingTiktok, setIsExtractingTiktok] = useState(false);
  const [igFlyerText, setIgFlyerText] = useState("");
  const [isParsingFlyer, setIsParsingFlyer] = useState(false);

  // Pop-up entity fields
  const [popupName, setPopupName] = useState("");
  const [guestChef, setGuestChef] = useState("");
  const [residencyStatus, setResidencyStatus] = useState<ResidencyStatus>("active");
  const [locationType, setLocationType] = useState<"venue" | "outdoor">("venue");
  const [hostSearch, setHostSearch] = useState("");
  const [selectedHostVenue, setSelectedHostVenue] = useState<Venue | null>(null);
  const [hostAddress, setHostAddress] = useState("Oslo, Norway");
  const [hostCoords, setHostCoords] = useState<{ lat: number; lng: number }>({ lat: 59.9139, lng: 10.7522 });
  const [datesLabel, setDatesLabel] = useState("");
  const [dailyHours, setDailyHours] = useState("17:00 – Late");
  const [portionCap, setPortionCap] = useState("");
  const [entryType, setEntryType] = useState<"walk_in" | "rsvp" | "ticketed" | "guest_list">("walk_in");
  const [ticketUrl, setTicketUrl] = useState("");
  const [socialUrl, setSocialUrl] = useState("");

  // Dish & Photo fields
  const [dishName, setDishName] = useState("");
  const [priceNok, setPriceNok] = useState<number | string>(195);
  const [category, setCategory] = useState<FoodCategory>("ramen");
  const [tasteNote, setTasteNote] = useState("");
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [tiktokThumbnail, setTiktokThumbnail] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  // Initialize or reset when opened
  useEffect(() => {
    if (!isOpen) return;
    if (editingPopupVenue) {
      setPopupName(editingPopupVenue.name);
      const meta = editingPopupVenue.popup_meta;
      if (meta) {
        setGuestChef(meta.guest_chef || "");
        setResidencyStatus(meta.residency_status || "active");
        setDatesLabel(meta.dates_label || "");
        setDailyHours(meta.daily_hours || meta.event_hours || "17:00 – Late");
        setPortionCap(meta.portion_cap || "");
        setEntryType(meta.entry_type || "walk_in");
        setTicketUrl(meta.ticket_url || "");
        setSocialUrl(meta.tiktok_url || meta.instagram_url || "");
        if (meta.host_venue_name) {
          const matched = venues.find(
            (v) => v.name.toLowerCase() === meta.host_venue_name?.toLowerCase()
          );
          if (matched) setSelectedHostVenue(matched);
        }
      }
      setHostAddress(editingPopupVenue.address || "Oslo");
      setHostCoords({
        lat: editingPopupVenue.latitude || 59.9139,
        lng: editingPopupVenue.longitude || 10.7522,
      });
      setDishName(editingPopupVenue.signature_dishes?.[0] || `${editingPopupVenue.name} Special`);
      setSelectedImageUrl(editingPopupVenue.cover_image_url || "");
      setStep(2);
    } else {
      // Default empty state
      setStep(1);
      setTiktokUrl("");
      setIgFlyerText("");
      setPopupName("");
      setGuestChef("");
      setResidencyStatus("active");
      setSelectedHostVenue(null);
      setHostSearch("");
      setHostAddress("Oslo, Norway");
      setHostCoords({ lat: 59.9139, lng: 10.7522 });
      setDatesLabel("This Weekend");
      setDailyHours("17:00 – Late");
      setPortionCap("80 bowls/night");
      setEntryType("walk_in");
      setTicketUrl("");
      setSocialUrl("");
      setDishName("");
      setPriceNok(195);
      setCategory("ramen");
      setTasteNote("");
      setSelectedImageUrl(PRESET_HOT_TEMPER.imageUrl);
      setTiktokThumbnail("");
    }
  }, [isOpen, editingPopupVenue, venues]);

  // Host search filter
  const hostMatches = hostSearch.trim()
    ? venues.filter((v) => v.name.toLowerCase().includes(hostSearch.toLowerCase())).slice(0, 5)
    : [];

  const handleSelectHost = (v: Venue) => {
    setSelectedHostVenue(v);
    setHostSearch(v.name);
    setHostAddress(v.address || "Oslo");
    setHostCoords({ lat: v.latitude, lng: v.longitude });
  };

  // Preset loaders
  const loadPreset = (preset: typeof PRESET_HOT_TEMPER) => {
    setPopupName(preset.popupName);
    setGuestChef(preset.guestChef);
    setDatesLabel(preset.datesLabel);
    setDailyHours(preset.dailyHours);
    setPortionCap(preset.portionCap);
    setEntryType(preset.entryType);
    setDishName(preset.dishName);
    setPriceNok(preset.priceNok);
    setCategory(preset.category);
    setTasteNote(preset.tasteNote);
    setSelectedImageUrl(preset.imageUrl);

    const matchedHost = venues.find((v) =>
      v.name.toLowerCase().includes(preset.hostVenueQuery.toLowerCase())
    );
    if (matchedHost) {
      handleSelectHost(matchedHost);
    } else {
      setHostSearch(preset.hostVenueQuery);
    }
    setStep(2);
  };

  // TikTok Extractor
  const handleExtractTiktok = async () => {
    if (!tiktokUrl.trim()) return;
    setIsExtractingTiktok(true);
    try {
      const res = await fetch("/api/ai/extract-food-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: tiktokUrl.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "TikTok extraction failed");
      const data = json.data;
      if (data) {
        if (data.dish_name) setDishName(data.dish_name);
        if (data.price_nok) setPriceNok(data.price_nok);
        if (data.review_text) setTasteNote(data.review_text);
        if (data.image_url) {
          setSelectedImageUrl(data.image_url);
          setTiktokThumbnail(data.image_url);
        }
        if (data.spot_name && !popupName) {
          setPopupName(data.spot_name);
        }
        setSocialUrl(tiktokUrl.trim());
        showToast("TikTok dish metadata extracted", "success");
        setStep(2);
      }
    } catch (err: any) {
      showToast(err.message || "Could not parse TikTok link", "error");
    } finally {
      setIsExtractingTiktok(false);
    }
  };

  // AI Flyer / IG Caption Parser
  const handleParseFlyer = async () => {
    if (!igFlyerText.trim()) return;
    setIsParsingFlyer(true);
    try {
      const res = await fetch("/api/admin/ai-curate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "parse-popup-drop",
          rawText: igFlyerText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Flyer parsing failed");

      if (data.popupName) setPopupName(data.popupName);
      if (data.guestChef) setGuestChef(data.guestChef);
      if (data.dishName) setDishName(data.dishName);
      if (data.priceNok) setPriceNok(data.priceNok);
      if (data.category) setCategory(data.category as FoodCategory);
      if (data.dailyHours) setDailyHours(data.dailyHours);
      if (data.portionCap) setPortionCap(data.portionCap);
      if (data.tasteNote) setTasteNote(data.tasteNote);
      if (data.hostVenueQuery) {
        const host = venues.find((v) =>
          v.name.toLowerCase().includes(data.hostVenueQuery.toLowerCase())
        );
        if (host) handleSelectHost(host);
        else setHostSearch(data.hostVenueQuery);
      }
      showToast("Drop flyer parsed successfully", "success");
      setStep(2);
    } catch (err: any) {
      showToast(err.message || "Failed to parse flyer text", "error");
    } finally {
      setIsParsingFlyer(false);
    }
  };

  // Preview synthetic venue & post objects
  const previewVenue: Venue = {
    id: editingPopupVenue?.id || `popup_${Date.now()}`,
    name: popupName || "Oslo Pop-Up Residency",
    address: hostAddress || "Oslo, Norway",
    city: "Oslo",
    neighborhood: (selectedHostVenue?.neighborhood || "sentrum") as Neighborhood,
    latitude: hostCoords.lat,
    longitude: hostCoords.lng,
    cover_image_url: selectedImageUrl,
    spot_type: "pop_up",
    food_category: category,
    signature_dishes: [dishName || "Signature Drop"],
    current_opening_hours_text: dailyHours,
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
    vibe: (editingPopupVenue?.vibe || {
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
    }) as any,
    popup_meta: {
      brand_id: editingPopupVenue?.popup_meta?.brand_id || `brand_${Date.now()}`,
      residency_status: residencyStatus,
      host_venue_name: selectedHostVenue?.name || hostSearch || "Host Bar / Venue",
      host_address: hostAddress,
      guest_chef: guestChef || undefined,
      dates_label: datesLabel || "Upcoming Weekend",
      daily_hours: dailyHours,
      event_hours: dailyHours,
      portion_cap: portionCap || undefined,
      entry_type: entryType,
      ticket_url: ticketUrl || undefined,
      tiktok_url: socialUrl || undefined,
      bring_back_count: editingPopupVenue?.popup_meta?.bring_back_count || 12,
    },
  };

  const previewPost: FoodPost = {
    id: `post_${previewVenue.id}`,
    spot_id: previewVenue.id,
    spot_name: previewVenue.name,
    spot_address: hostAddress || "Oslo, Norway",
    spot_neighborhood: (selectedHostVenue?.neighborhood || "sentrum") as Neighborhood,
    spot_coords: [hostCoords.lng, hostCoords.lat],
    dish_name: dishName || "Signature Pop-up Special",
    price_nok: typeof priceNok === "number" ? priceNok : parseInt(priceNok as string, 10) || 195,
    category,
    image_url: selectedImageUrl,
    review_text: tasteNote || "Oslo chef residency drop with limited quantities.",
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
    spot_type: "pop_up",
    is_drop: true,
    drop_badge: "⏳ Limited Batch",
  };

  // Final Publish Handler
  const handlePublish = async () => {
    if (!popupName.trim()) {
      showToast("Please enter a pop-up brand name", "error");
      setStep(2);
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
          imageUrl: finalVenue.cover_image_url || undefined,
          spotType: "pop_up",
          locationSchedule: finalVenue.location_schedule || undefined,
          popupStartDate: finalVenue.popup_start_date || undefined,
          popupEndDate: finalVenue.popup_end_date || undefined,
          popupMeta: finalVenue.popup_meta || undefined,
        }).catch(() => {});
        showToast(`Updated residency: ${finalVenue.name}`, "success");
      } else {
        addVenue(finalVenue);
        addFoodPost(previewPost);

        const venueRes = await insertVenue({
          name: finalVenue.name,
          address: finalVenue.address,
          category: category,
          latitude: finalVenue.latitude,
          longitude: finalVenue.longitude,
          imageUrl: finalVenue.cover_image_url || undefined,
          spotType: "pop_up",
          locationSchedule: finalVenue.location_schedule || undefined,
          popupStartDate: finalVenue.popup_start_date || undefined,
          popupEndDate: finalVenue.popup_end_date || undefined,
          popupMeta: finalVenue.popup_meta || undefined,
          neighborhood: (finalVenue.neighborhood || "sentrum") as any,
        });

        const persistedVenueId = venueRes.venue?.id || finalVenue.id;
        const authUser = useCityPulseStore.getState().currentUser;
        if (authUser?.id) {
          await insertFoodPost({
            venueId: persistedVenueId,
            authorId: authUser.id,
            dishName: dishName || "Signature Drop",
            dishImage: selectedImageUrl || null,
            priceNok: typeof priceNok === "number" ? priceNok : priceNok ? Number(priceNok) || null : null,
            reviewText: tasteNote || "",
            category: category,
            isOfficialPick: true,
          }).catch(() => {});
        }

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
        className="relative z-10 w-full max-w-2xl bg-[#FAF7F2] dark:bg-[#1C1917] rounded-3xl border border-[#181615]/10 shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]"
      >
        {/* Header with Step Tracker */}
        <div className="px-5 py-4 border-b border-[#181615]/10 flex items-center justify-between bg-[#F5EFE4] dark:bg-[#181615]/50">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-[#E84A27] text-white flex items-center justify-center text-xs font-bold font-comico">
              🎟️
            </span>
            <div>
              <h3 className="font-comico text-sm sm:text-base font-black text-[#181615] dark:text-white uppercase tracking-tight">
                {editingPopupVenue ? "Edit Pop-up Residency" : "New Pop-up Drop Wizard"}
              </h3>
              <p className="text-[11px] text-zinc-500 font-medium">
                Step {step} of 4: {step === 1 ? "Smart Ingestion" : step === 2 ? "Brand & Host" : step === 3 ? "Dish & Photos" : "Review & Publish"}
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

        {/* Step Progression Bar */}
        <div className="grid grid-cols-4 border-b border-[#181615]/10 text-center text-[10px] font-bold uppercase tracking-wider">
          {[
            { n: 1, label: "Ingest" },
            { n: 2, label: "Brand" },
            { n: 3, label: "Dish" },
            { n: 4, label: "Publish" },
          ].map((s) => (
            <button
              key={s.n}
              type="button"
              onClick={() => setStep(s.n as any)}
              className={`py-2 transition-colors cursor-pointer border-b-2 ${
                step === s.n
                  ? "border-[#E84A27] text-[#E84A27] bg-[#FAF7F2]"
                  : step > s.n
                  ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
                  : "border-transparent text-zinc-400"
              }`}
            >
              {s.n}. {s.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* STEP 1: SMART INGESTION & PRESETS */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Option A: TikTok Ingestion */}
              <div className="p-4 rounded-2xl bg-[#F5EFE4] dark:bg-[#23201D] border border-[#181615]/10 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">🎵</span>
                  <label className="text-xs font-bold text-[#181615] dark:text-white">
                    1-Tap TikTok Scraping
                  </label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={tiktokUrl}
                    onChange={(e) => setTiktokUrl(e.target.value)}
                    placeholder="Paste TikTok video link (e.g. https://vm.tiktok.com/...)"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/15 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#E84A27]"
                  />
                  <button
                    type="button"
                    onClick={handleExtractTiktok}
                    disabled={isExtractingTiktok || !tiktokUrl.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[#181615] hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {isExtractingTiktok ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-[#E84A27]" />}
                    <span>Fetch</span>
                  </button>
                </div>
              </div>

              {/* Option B: Flyer / IG Caption Parser */}
              <div className="p-4 rounded-2xl bg-[#F5EFE4] dark:bg-[#23201D] border border-[#181615]/10 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">📋</span>
                  <label className="text-xs font-bold text-[#181615] dark:text-white">
                    Drop Announcement Flyer / Caption
                  </label>
                </div>
                <textarea
                  rows={3}
                  value={igFlyerText}
                  onChange={(e) => setIgFlyerText(e.target.value)}
                  placeholder="Paste Instagram announcement caption, dates, or flyer transcript..."
                  className="w-full p-3 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/15 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#E84A27] resize-none"
                />
                <button
                  type="button"
                  onClick={handleParseFlyer}
                  disabled={isParsingFlyer || !igFlyerText.trim()}
                  className="w-full py-2.5 rounded-xl bg-[#E84A27] hover:bg-[#D43D1C] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isParsingFlyer ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Parse Drop Details with AI</span>
                </button>
              </div>

              {/* Option C: Instant Oslo Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                  Or Load Ready Oslo Drop Preset
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => loadPreset(PRESET_HOT_TEMPER)}
                    className="p-3 rounded-2xl bg-white dark:bg-[#23201D] border border-[#181615]/10 hover:border-[#E84A27] text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-white">
                      <span>🍜 Hot Temper Ramen</span>
                      <span className="text-[10px] text-[#E84A27] font-mono">195 kr</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1 truncate">
                      At Becco · 80 bowls/night
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => loadPreset(PRESET_NOLO)}
                    className="p-3 rounded-2xl bg-white dark:bg-[#23201D] border border-[#181615]/10 hover:border-[#E84A27] text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-white">
                      <span>🍔 Nolo Burger Crew</span>
                      <span className="text-[10px] text-[#E84A27] font-mono">185 kr</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1 truncate">
                      At Trekanten · 120 burgers
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: BRAND & HOST SPOT BINDING */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Lifecycle State Switcher */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Residency Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "active" as const, label: "🔥 Live Now", desc: "Currently running" },
                    { id: "next_confirmed" as const, label: "📅 Next Drop", desc: "Confirmed date" },
                    { id: "between_residencies" as const, label: "⏸ Between Runs", desc: "Open petition" },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setResidencyStatus(st.id)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        residencyStatus === st.id
                          ? "border-[#E84A27] bg-[#E84A27]/10 text-[#E84A27] font-bold"
                          : "border-[#181615]/10 bg-white dark:bg-[#23201D] text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      <div className="text-xs font-bold">{st.label}</div>
                      <div className="text-[10px] opacity-75">{st.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Format Assistant Bar */}
              <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#E84A27] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Assistant: Paste raw flyer caption, text, or notes</span>
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={igFlyerText}
                    onChange={(e) => setIgFlyerText(e.target.value)}
                    placeholder="e.g. Hot Temper at Becco this weekend, duck ramen 195 kr, walk in..."
                    className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/15 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#E84A27]"
                  />
                  <button
                    type="button"
                    onClick={handleParseFlyer}
                    disabled={isParsingFlyer || !igFlyerText.trim()}
                    className="px-3.5 py-2 rounded-xl bg-[#E84A27] hover:bg-[#D43D1C] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer transition-all"
                  >
                    {isParsingFlyer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>Format with AI</span>
                  </button>
                </div>
              </div>

              {/* Brand Name & Chef */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Pop-up Brand Name *
                  </label>
                  <input
                    type="text"
                    value={popupName}
                    onChange={(e) => setPopupName(e.target.value)}
                    placeholder="e.g. Hot Temper Ramen"
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#23201D] border border-[#181615]/15 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#E84A27]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Guest Chef / Collective
                  </label>
                  <input
                    type="text"
                    value={guestChef}
                    onChange={(e) => setGuestChef(e.target.value)}
                    placeholder="e.g. Chef Ole / Nolo Crew"
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#23201D] border border-[#181615]/15 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#E84A27]"
                  />
                </div>
              </div>

              {/* Host Venue vs Outdoor Spot Selector */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-[#F5EFE4] dark:bg-[#23201D] border border-[#181615]/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#181615] dark:text-white">
                    Where is this pop-up happening?
                  </label>
                  <div className="flex items-center gap-1 p-0.5 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/10">
                    <button
                      type="button"
                      onClick={() => setLocationType("venue")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        locationType === "venue"
                          ? "bg-[#181615] text-white"
                          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                      }`}
                    >
                      🍷 Host Bar / Venue
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocationType("outdoor")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        locationType === "outdoor"
                          ? "bg-[#181615] text-white"
                          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                      }`}
                    >
                      🌳 Outdoor / Park
                    </button>
                  </div>
                </div>

                {locationType === "venue" ? (
                  <div className="space-y-1.5 pt-1">
                    <div className="relative">
                      <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={hostSearch}
                        onChange={(e) => setHostSearch(e.target.value)}
                        placeholder="Search existing host spot (e.g. Becco, Fuglen, Trekanten)..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/15 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#E84A27]"
                      />
                    </div>
                    {hostMatches.length > 0 && (
                      <div className="p-1 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/10 space-y-1 max-h-36 overflow-y-auto">
                        {hostMatches.map((h) => (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => handleSelectHost(h)}
                            className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-[#F5EFE4] dark:hover:bg-white/10 flex items-center justify-between cursor-pointer"
                          >
                            <span className="font-bold text-zinc-900 dark:text-white">{h.name}</span>
                            <span className="text-[10px] text-zinc-500">{h.neighborhood || "Oslo"}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1 pt-1">
                    <input
                      type="text"
                      value={hostAddress}
                      onChange={(e) => {
                        setHostAddress(e.target.value);
                        setSelectedHostVenue(null);
                      }}
                      placeholder="e.g. Prindsens Hage, Youngstorget Market, Tøyen Torg..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/15 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#E84A27]"
                    />
                  </div>
                )}
              </div>

              {/* Dates & Daily Hours with tactile pickers */}
              <DateWindowPicker
                value={datesLabel}
                onChange={setDatesLabel}
              />

              <TimeSlotPicker
                label="Daily Hours / Schedule"
                value={dailyHours}
                onChange={setDailyHours}
              />

              {/* Portion Cap & Entry Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Portion Cap / Batch Limit
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {["50 / day", "80 / day", "120 / day", "Unlimited til tomt"].map((cap) => (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => setPortionCap(cap)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          portionCap === cap
                            ? "bg-[#181615] text-white border-[#181615]"
                            : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                        }`}
                      >
                        {cap}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={portionCap}
                    onChange={(e) => setPortionCap(e.target.value)}
                    placeholder="Or custom cap (e.g. 100 burgers)"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#23201D] border border-[#181615]/15 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#E84A27]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Entry Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "walk_in", label: "Walk-in Only" },
                      { id: "ticketed", label: "Ticketed / RSVP" },
                    ].map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setEntryType(e.id as any)}
                        className={`py-2 px-2.5 rounded-xl border text-center text-xs font-bold cursor-pointer transition-all ${
                          entryType === e.id
                            ? "border-[#E84A27] bg-[#E84A27]/10 text-[#E84A27]"
                            : "border-[#181615]/10 bg-white dark:bg-[#23201D] text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {e.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DISH & PHOTOS */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Dish Name & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Signature Dish Name *
                  </label>
                  <input
                    type="text"
                    value={dishName}
                    onChange={(e) => setDishName(e.target.value)}
                    placeholder="e.g. Tokyo Duck Shio Ramen"
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#23201D] border border-[#181615]/15 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#E84A27]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Price (NOK)
                  </label>
                  <input
                    type="number"
                    value={priceNok}
                    onChange={(e) => setPriceNok(e.target.value)}
                    placeholder="195"
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#23201D] border border-[#181615]/15 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#E84A27]"
                  />
                </div>
              </div>

              {/* Category & Taste Note */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Food Category
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(["ramen", "burger", "street_food", "pizza", "pastrami", "bakery"] as FoodCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-all cursor-pointer ${
                        category === cat
                          ? "bg-[#E84A27] text-white"
                          : "bg-white dark:bg-[#23201D] border border-[#181615]/10 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      {cat.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Editorial Taste Note
                </label>
                <textarea
                  rows={2}
                  value={tasteNote}
                  onChange={(e) => setTasteNote(e.target.value)}
                  placeholder="One crisp, sensory sentence describing flavors, broth, crunch, or crust..."
                  className="w-full p-3 rounded-xl bg-white dark:bg-[#23201D] border border-[#181615]/15 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#E84A27] resize-none"
                />
              </div>

              {/* Reusable Visual Photo Switcher */}
              <VisualPhotoSwitcher
                label="Residency Hero Photo"
                currentImageUrl={selectedImageUrl}
                venuePlaceId={selectedHostVenue?.google_place_id}
                venueName={selectedHostVenue?.name || popupName}
                category={category}
                extraPhotos={[tiktokThumbnail, selectedHostVenue?.cover_image_url].filter(Boolean) as string[]}
                onSelectPhoto={(url) => setSelectedImageUrl(url)}
              />
            </div>
          )}

          {/* STEP 4: LIVE PREVIEW & PUBLISH */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Live Card Preview
                </span>
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#F5EFE4] dark:bg-[#23201D] text-[10px] font-bold">
                  {(["active", "next_confirmed", "between_residencies"] as ResidencyStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setResidencyStatus(st)}
                      className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${
                        residencyStatus === st ? "bg-[#E84A27] text-white" : "text-zinc-500"
                      }`}
                    >
                      {st === "active" ? "Active" : st === "next_confirmed" ? "Next Drop" : "Between Runs"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rendered Card */}
              <div className="max-w-md mx-auto">
                <PopupEventCard venue={previewVenue} post={previewPost} />
              </div>

              {/* Summary Stats */}
              <div className="p-3.5 rounded-2xl bg-[#F5EFE4] dark:bg-[#23201D] border border-[#181615]/10 text-xs space-y-1.5">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Host Venue:</span>
                  <span className="font-bold text-zinc-900 dark:text-white">{previewVenue.popup_meta?.host_venue_name}</span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Dates &amp; Hours:</span>
                  <span className="font-bold text-zinc-900 dark:text-white">{datesLabel} · {dailyHours}</span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Batch Portion Cap:</span>
                  <span className="font-bold text-[#E84A27]">{portionCap || "Uncapped walk-in"}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-[#181615]/10 bg-[#F5EFE4] dark:bg-[#181615]/50 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2.5 rounded-2xl bg-white dark:bg-[#23201D] border border-[#181615]/10 text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 cursor-pointer hover:bg-zinc-100"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as any)}
              className="px-5 py-2.5 rounded-2xl bg-[#181615] hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing}
              className="px-6 py-2.5 rounded-2xl bg-[#E84A27] hover:bg-[#D43D1C] text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RocketIcon className="w-4 h-4" />}
              <span>{editingPopupVenue ? "Save Residency Changes" : "Publish Pop-Up Drop to Radar"}</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function RocketIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}
