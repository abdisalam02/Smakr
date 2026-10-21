"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Sparkles,
  Upload,
  Camera,
  Check,
  Loader2,
  Clock,
  Store,
  Ticket,
  MapPin,
  ChefHat,
  Zap,
  Flame,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Search,
} from "lucide-react";
import { FOOD_CATEGORIES } from "@/lib/foodSeeds";
import type { Venue, DietaryTag, FoodCategory, PopupResidencyMeta, ResidencyStatus } from "@/types";
import type { PartnerDishItem } from "./PartnerRestaurantCardPreview";
import { useCityPulseStore } from "@/store/useCityPulseStore";

export interface UnifiedPartnerWizardSheetProps {
  isOpen: boolean;
  onClose: () => void;
  partnerType: "restaurant" | "popup";
  onPartnerTypeChange: (type: "restaurant" | "popup") => void;
  initialStep?: 1 | 2 | 3 | 4;
  venue: Venue | null;
  // Editable fields
  venueName: string;
  onVenueNameChange: (v: string) => void;
  category: FoodCategory;
  onCategoryChange: (c: FoodCategory) => void;
  neighborhood: string;
  onNeighborhoodChange: (n: string) => void;
  address: string;
  onAddressChange: (a: string) => void;
  openingHours: string;
  onOpeningHoursChange: (h: string) => void;
  coverImageUrl: string;
  onCoverImageUrlChange: (u: string) => void;
  // Pop-up fields
  popupMeta: PopupResidencyMeta | null;
  onPopupMetaChange: (m: PopupResidencyMeta) => void;
  // Dish fields
  dish: PartnerDishItem;
  onDishChange: (d: PartnerDishItem) => void;
  // Photos from place
  venuePhotos: string[];
  // Submission
  onSubmitClaim: (contactData: {
    name: string;
    role: string;
    email: string;
    phone: string;
    orgNumber: string;
    instagramHandle: string;
    kitchenStatus: "normal" | "fresh_batch" | "low_stock";
  }) => Promise<void>;
}

const STEPS = [
  { n: 1 as const, label: "Spot & Host" },
  { n: 2 as const, label: "Dish & Price" },
  { n: 3 as const, label: "Hero Photo" },
  { n: 4 as const, label: "Claim & Remote" },
];

const DIETARY_CHOICES: { id: DietaryTag; label: string }[] = [
  { id: "halal", label: "Halal" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten_free", label: "Gluten-Free" },
];

export function UnifiedPartnerWizardSheet({
  isOpen,
  onClose,
  partnerType,
  onPartnerTypeChange,
  initialStep = 1,
  venue,
  venueName,
  onVenueNameChange,
  category,
  onCategoryChange,
  neighborhood,
  onNeighborhoodChange,
  address,
  onAddressChange,
  openingHours,
  onOpeningHoursChange,
  coverImageUrl,
  onCoverImageUrlChange,
  popupMeta,
  onPopupMetaChange,
  dish,
  onDishChange,
  venuePhotos,
  onSubmitClaim,
}: UnifiedPartnerWizardSheetProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialStep);
  const showToast = useCityPulseStore((s) => s.showToast);

  useEffect(() => {
    if (isOpen && initialStep) {
      setStep(initialStep);
    }
  }, [isOpen, initialStep]);

  // Host search for pop-ups
  const [hostQuery, setHostQuery] = useState("");
  const [hostResults, setHostResults] = useState<any[]>([]);
  const [isSearchingHost, setIsSearchingHost] = useState(false);

  // Claim contact state
  const [applicantName, setApplicantName] = useState("");
  const [applicantRole, setApplicantRole] = useState("owner");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [applicantOrg, setApplicantOrg] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [kitchenStatus, setKitchenStatus] = useState<"normal" | "fresh_batch" | "low_stock">("fresh_batch");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Debounced search for host venue in pop-up mode
  useEffect(() => {
    if (!hostQuery.trim() || hostQuery.length < 2) {
      setHostResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setIsSearchingHost(true);
      try {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(hostQuery + " Oslo")}`);
        const data = await res.json();
        const list = data.results ?? (data.place ? [data.place] : []);
        setHostResults(list.slice(0, 4));
      } catch {
        setHostResults([]);
      } finally {
        setIsSearchingHost(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [hostQuery]);

  const handleSelectHostPlace = (p: any) => {
    onPopupMetaChange({
      ...popupMeta,
      residency_status: popupMeta?.residency_status || "active",
      host_venue_name: p.name,
      host_address: p.formatted_address || "Oslo",
    });
    setHostResults([]);
    setHostQuery(p.name);
    showToast(`Bound host venue: ${p.name}`);
  };

  const handleFileUpload = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/partner/upload-dish-photo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        onCoverImageUrlChange(data.url);
        onDishChange({ ...dish, imageUrl: data.url });
        showToast("Photo uploaded successfully");
      } else {
        showToast(data.error || "Upload failed. Try another photo.");
      }
    } catch {
      showToast("Network error uploading photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim()) {
      showToast("Enter your name first.");
      return;
    }
    if (!applicantEmail.trim() || !applicantEmail.includes("@")) {
      showToast("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitClaim({
        name: applicantName.trim(),
        role: applicantRole,
        email: applicantEmail.trim(),
        phone: applicantPhone.trim(),
        orgNumber: applicantOrg.trim(),
        instagramHandle: instagramHandle.trim(),
        kitchenStatus,
      });
    } catch (err: any) {
      showToast(err.message || "Failed to submit partner claim.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isPopup = partnerType === "popup";

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

        {/* Unified Bottom Sheet Container */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative w-full max-w-2xl max-h-[92dvh] bg-[#FAF7F2] text-[#181615] border-t sm:border border-[#181615]/10 rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* =========================================================================
              STICKY HEADER: LIVE MINI-PREVIEW + 4-STEP INDICATOR
              ========================================================================= */}
          <div className="pt-3 pb-3 px-4 sm:px-6 bg-[#F5EFE4] border-b border-[#181615]/10 shrink-0 space-y-2.5">
            <div className="w-10 h-1 rounded-full bg-[#181615]/20 mx-auto sm:hidden" />

            {/* Top Bar with Entity Toggle & Close */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/70 border border-[#181615]/10 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => onPartnerTypeChange("restaurant")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    !isPopup ? "bg-[#181615] text-[#FAF7F2] shadow-xs" : "text-[#6B6459] hover:text-[#181615]"
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Restaurant</span>
                </button>
                <button
                  type="button"
                  onClick={() => onPartnerTypeChange("popup")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    isPopup ? "bg-[#E84A27] text-white shadow-xs" : "text-[#6B6459] hover:text-[#181615]"
                  }`}
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Pop-up Residency</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full bg-white/80 hover:bg-white text-zinc-600 transition-colors cursor-pointer"
                aria-label="Close wizard"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Mini-Card Preview */}
            <div className="p-2.5 rounded-2xl bg-white border border-[#181615]/10 shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-[#181615]/10">
                  {coverImageUrl || dish.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverImageUrl || dish.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">
                      {isPopup ? "🎟️" : "🍽️"}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-comico text-sm text-[#181615] truncate font-bold">
                      {venueName || (isPopup ? "Pop-up Brand" : "Spot Name")}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#E84A27]/10 text-[#E84A27]">
                      {dish.priceNok || 185} kr
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8a8073] truncate font-medium">
                    {isPopup
                      ? popupMeta?.host_venue_name || "Pick Host Venue"
                      : `${address || "Oslo"} · ${openingHours || "Hours"}`}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                ● Live Mini-Preview
              </span>
            </div>

            {/* 4-Step Progress Indicator */}
            <div className="flex items-center justify-between gap-1 pt-1 text-[11px] font-bold">
              {STEPS.map((s, idx) => {
                const isCurrent = step === s.n;
                const isPast = step > s.n;
                return (
                  <React.Fragment key={s.n}>
                    <button
                      type="button"
                      onClick={() => setStep(s.n)}
                      className={`flex items-center gap-1.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-[#181615] text-[#FAF7F2] shadow-xs"
                          : isPast
                          ? "bg-emerald-100 text-emerald-800"
                          : "text-[#8a8073] hover:text-[#181615]"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono ${
                          isPast ? "bg-emerald-600 text-white" : isCurrent ? "bg-[#E84A27] text-white" : "bg-black/10"
                        }`}
                      >
                        {isPast ? "✓" : s.n}
                      </span>
                      <span className="truncate">{s.label}</span>
                    </button>
                    {idx < STEPS.length - 1 && (
                      <span className="text-zinc-300 dark:text-zinc-600">→</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* =========================================================================
              SCROLLABLE WIZARD BODY (STEPS 1 TO 4)
              ========================================================================= */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 no-scrollbar">
            {/* STEP 1: SPOT & HOST */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <h3 className="font-comico text-lg font-bold text-[#181615]">
                    {isPopup ? "Step 1: Pop-up Brand & Host Venue" : "Step 1: Restaurant Details"}
                  </h3>
                  <p className="text-xs text-[#8a8073]">
                    {isPopup
                      ? "Bind your chef brand to an Oslo host bar, gallery, or kitchen."
                      : "Set official name, neighborhood, and regular dining schedule."}
                  </p>
                </div>

                {/* Spot or Brand Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#181615]">
                    {isPopup ? "Pop-up Collective / Brand Name *" : "Venue Name *"}
                  </label>
                  <input
                    type="text"
                    value={venueName}
                    onChange={(e) => onVenueNameChange(e.target.value)}
                    placeholder={isPopup ? "e.g. Hot Temper Ramen" : "e.g. Koie Ramen Torggata"}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#181615]/10 bg-white text-xs font-semibold focus:outline-none focus:border-[#E84A27]"
                  />
                </div>

                {isPopup ? (
                  <>
                    {/* Guest Chef */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#181615]">
                        Guest Chef(s) / Kitchen Team
                      </label>
                      <input
                        type="text"
                        value={popupMeta?.guest_chef || ""}
                        onChange={(e) =>
                          onPopupMetaChange({
                            ...popupMeta,
                            guest_chef: e.target.value,
                            residency_status: popupMeta?.residency_status || "active",
                          })
                        }
                        placeholder="e.g. Chef Ole & Linn"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#181615]/10 bg-white text-xs font-semibold focus:outline-none focus:border-[#E84A27]"
                      />
                    </div>

                    {/* Host Venue Search */}
                    <div className="space-y-1.5 p-3 rounded-2xl bg-[#F5EFE4] border border-[#181615]/10">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#181615] flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#E84A27]" />
                          <span>Host Venue (Wine Bar, Cafe, or Pop-up Space)</span>
                        </label>
                        {popupMeta?.host_venue_name && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                            Bound: {popupMeta.host_venue_name}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={hostQuery}
                          onChange={(e) => setHostQuery(e.target.value)}
                          placeholder="Search Oslo venue (e.g. Becco, Fuglen, Trekanten)..."
                          className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-[#181615]/10 bg-white text-xs text-[#181615] focus:outline-none focus:border-[#E84A27]"
                        />
                        {isSearchingHost && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-[#E84A27]" />
                        )}
                      </div>
                      {hostResults.length > 0 && (
                        <div className="rounded-xl border border-[#181615]/10 bg-white divide-y divide-stone-100 overflow-hidden shadow-sm">
                          {hostResults.map((r, i) => (
                            <button
                              key={`host-res-${i}`}
                              type="button"
                              onClick={() => handleSelectHostPlace(r)}
                              className="w-full text-left p-2.5 hover:bg-orange-50 flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer"
                            >
                              <div className="min-w-0">
                                <span className="font-bold text-[#181615] block truncate">{r.name}</span>
                                <span className="text-[10px] text-stone-500 truncate block">{r.formatted_address}</span>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E84A27] text-white shrink-0">
                                Select Host →
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Residency Status Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#181615]">Residency Lifecycle State</label>
                      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white border border-[#181615]/10">
                        <button
                          type="button"
                          onClick={() =>
                            onPopupMetaChange({ ...popupMeta, residency_status: "active" })
                          }
                          className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                            (popupMeta?.residency_status || "active") === "active"
                              ? "bg-[#E84A27] text-white shadow-xs"
                              : "text-[#6B6459] hover:text-[#181615]"
                          }`}
                        >
                          🔥 Active Now
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onPopupMetaChange({ ...popupMeta, residency_status: "next_confirmed" })
                          }
                          className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                            popupMeta?.residency_status === "next_confirmed"
                              ? "bg-amber-500 text-black shadow-xs"
                              : "text-[#6B6459] hover:text-[#181615]"
                          }`}
                        >
                          📅 Next Drop
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onPopupMetaChange({ ...popupMeta, residency_status: "between_residencies" })
                          }
                          className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                            popupMeta?.residency_status === "between_residencies"
                              ? "bg-stone-800 text-white shadow-xs"
                              : "text-[#6B6459] hover:text-[#181615]"
                          }`}
                        >
                          ⏸ Dormant
                        </button>
                      </div>
                    </div>

                    {/* Dates & Hours */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#181615]">Date Range / Window</label>
                        <input
                          type="text"
                          value={popupMeta?.date_label || ""}
                          onChange={(e) =>
                            onPopupMetaChange({
                              ...popupMeta,
                              date_label: e.target.value,
                              residency_status: popupMeta?.residency_status || "active",
                            })
                          }
                          placeholder="e.g. This Weekend (Oct 24–26)"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#181615]/10 bg-white text-xs font-semibold focus:outline-none focus:border-[#E84A27]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#181615]">Daily Service Hours</label>
                        <input
                          type="text"
                          value={popupMeta?.event_hours || ""}
                          onChange={(e) =>
                            onPopupMetaChange({
                              ...popupMeta,
                              event_hours: e.target.value,
                              residency_status: popupMeta?.residency_status || "active",
                            })
                          }
                          placeholder="e.g. 17:00 – Sold Out (til tomt)"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#181615]/10 bg-white text-xs font-semibold focus:outline-none focus:border-[#E84A27]"
                        />
                      </div>
                    </div>

                    {/* Batch Limit & RSVP URL */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#181615]">Batch Cap / Portions</label>
                        <input
                          type="text"
                          value={popupMeta?.batch_limit || ""}
                          onChange={(e) =>
                            onPopupMetaChange({
                              ...popupMeta,
                              batch_limit: e.target.value,
                              residency_status: popupMeta?.residency_status || "active",
                            })
                          }
                          placeholder="e.g. 80 bowls/day"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#181615]/10 bg-white text-xs font-semibold focus:outline-none focus:border-[#E84A27]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#181615]">Ticket / RSVP Link (Optional)</label>
                        <input
                          type="url"
                          value={popupMeta?.rsvp_url || ""}
                          onChange={(e) =>
                            onPopupMetaChange({
                              ...popupMeta,
                              rsvp_url: e.target.value,
                              residency_status: popupMeta?.residency_status || "active",
                            })
                          }
                          placeholder="https://tikkio.com/..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#181615]/10 bg-white text-xs font-mono focus:outline-none focus:border-[#E84A27]"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Category Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#181615]">Food Category &amp; Radar Pin</label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 max-h-36 overflow-y-auto no-scrollbar p-1 rounded-2xl bg-white border border-[#181615]/10">
                        {FOOD_CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => onCategoryChange(cat.id as FoodCategory)}
                            className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                              category === cat.id
                                ? "bg-[#E84A27] text-white shadow-xs"
                                : "text-stone-700 hover:bg-stone-50"
                            }`}
                          >
                            <span className="text-base">{cat.emoji}</span>
                            <span className="text-[10px] truncate max-w-full">{cat.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Address & Neighborhood */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#181615]">Oslo Street Address *</label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => onAddressChange(e.target.value)}
                          placeholder="e.g. Torggata 22"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#181615]/10 bg-white text-xs font-semibold focus:outline-none focus:border-[#E84A27]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#181615]">Neighborhood</label>
                        <input
                          type="text"
                          value={neighborhood}
                          onChange={(e) => onNeighborhoodChange(e.target.value)}
                          placeholder="e.g. Torggata, Grünerløkka"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#181615]/10 bg-white text-xs font-semibold focus:outline-none focus:border-[#E84A27]"
                        />
                      </div>
                    </div>

                    {/* Opening Hours */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#181615]">Regular Opening Hours *</label>
                      <input
                        type="text"
                        value={openingHours}
                        onChange={(e) => onOpeningHoursChange(e.target.value)}
                        placeholder="e.g. Mon–Sat 11:00–22:00 · Sun Closed"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#181615]/10 bg-white text-xs font-semibold focus:outline-none focus:border-[#E84A27]"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* STEP 2: SIGNATURE DISH & PRICE */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <h3 className="font-comico text-lg font-bold text-[#181615]">
                    Step 2: Signature Dish &amp; Pricing
                  </h3>
                  <p className="text-xs text-[#8a8073]">
                    What dish makes people cross the city to eat here?
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-[#181615]">Headline Dish Name *</label>
                    <input
                      type="text"
                      value={dish.dishName}
                      onChange={(e) => onDishChange({ ...dish, dishName: e.target.value })}
                      placeholder="e.g. Spicy Miso Tonkotsu Ramen"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#181615]/10 bg-white text-xs font-semibold focus:outline-none focus:border-[#E84A27]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#181615]">In-House Price (NOK) *</label>
                    <input
                      type="number"
                      value={dish.priceNok ?? ""}
                      onChange={(e) => onDishChange({ ...dish, priceNok: Number(e.target.value) || 0 })}
                      placeholder="185"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#181615]/10 bg-white text-xs font-bold focus:outline-none focus:border-[#E84A27]"
                    />
                  </div>
                </div>

                {/* 1-Line Kitchen Taste Note */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#181615]">
                    ✦ 1-Line Kitchen Taste Note
                  </label>
                  <textarea
                    rows={2}
                    value={dish.tasteNote || ""}
                    onChange={(e) => onDishChange({ ...dish, tasteNote: e.target.value })}
                    placeholder="14-hour pork broth with springy noodles, charred chashu, and fragrant rayu chili oil."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#181615]/10 bg-white text-xs leading-relaxed focus:outline-none focus:border-[#E84A27] resize-none"
                  />
                </div>

                {/* Dietary Tags */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#181615]">Dietary Options</label>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_CHOICES.map((d) => {
                      const active = dish.dietaryTags?.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            const prev = dish.dietaryTags || [];
                            const next = active ? prev.filter((t) => t !== d.id) : [...prev, d.id];
                            onDishChange({ ...dish, dietaryTags: next });
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                            active
                              ? "bg-[#181615] text-white border-[#181615]"
                              : "bg-white text-stone-600 border-[#181615]/10 hover:border-stone-400"
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: HERO PHOTO */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <h3 className="font-comico text-lg font-bold text-[#181615]">
                    Step 3: Signature Food Photo
                  </h3>
                  <p className="text-xs text-[#8a8073]">
                    Upload a high-res photo from your kitchen or pick from existing venue photos.
                  </p>
                </div>

                {/* Upload Action Card */}
                <div className="p-4 rounded-2xl bg-white border border-[#181615]/10 flex flex-col items-center justify-center gap-2.5 text-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E84A27] hover:bg-[#D43D1C] disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    {uploadingPhoto ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading from Camera Roll…</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        <span>Upload Custom Photo</span>
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-[#8a8073]">JPG, PNG or WEBP · Crisp appetizing lighting recommended</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleFileUpload(f);
                    }}
                    className="hidden"
                  />
                </div>

                {/* Photo Grid from Google / Venue */}
                {venuePhotos.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#181615]">
                      Or Pick From Venue Photos:
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {venuePhotos.slice(0, 8).map((photoUrl, i) => (
                        <button
                          key={`v-p-${i}`}
                          type="button"
                          onClick={() => {
                            onCoverImageUrlChange(photoUrl);
                            onDishChange({ ...dish, imageUrl: photoUrl });
                            showToast("Selected dish cover photo");
                          }}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                            coverImageUrl === photoUrl
                              ? "border-[#E84A27] ring-2 ring-[#E84A27]/30"
                              : "border-transparent hover:border-[#181615]/30"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photoUrl}
                            alt={`Photo ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {coverImageUrl === photoUrl && (
                            <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#E84A27] text-white flex items-center justify-center">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: LIVE STATUS & CLAIM REMOTE */}
            {step === 4 && (
              <form onSubmit={handleFinalSubmit} className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <h3 className="font-comico text-lg font-bold text-[#181615]">
                    Step 4: Live Kitchen Remote &amp; Claim
                  </h3>
                  <p className="text-xs text-[#8a8073]">
                    Set your initial batch status and receive your private kitchen link.
                  </p>
                </div>

                {/* Kitchen Status Selector */}
                <div className="space-y-1.5 p-3 rounded-2xl bg-white border border-[#181615]/10">
                  <label className="text-xs font-bold text-[#181615]">Initial Kitchen Status</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setKitchenStatus("fresh_batch")}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        kitchenStatus === "fresh_batch"
                          ? "bg-orange-500 text-white shadow-xs"
                          : "bg-stone-50 text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      🔥 Fresh Batch
                    </button>
                    <button
                      type="button"
                      onClick={() => setKitchenStatus("low_stock")}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        kitchenStatus === "low_stock"
                          ? "bg-amber-500 text-black shadow-xs"
                          : "bg-stone-50 text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      ⚡ Few Left
                    </button>
                    <button
                      type="button"
                      onClick={() => setKitchenStatus("normal")}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        kitchenStatus === "normal"
                          ? "bg-[#181615] text-white shadow-xs"
                          : "bg-stone-50 text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      ✓ Normal
                    </button>
                  </div>
                </div>

                {/* Contact Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#181615]">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      placeholder="e.g. Martin Solberg"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#181615]/10 bg-white text-xs font-semibold focus:outline-none focus:border-[#E84A27]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#181615]">Role at Venue *</label>
                    <select
                      value={applicantRole}
                      onChange={(e) => setApplicantRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#181615]/10 bg-white text-xs font-semibold focus:outline-none focus:border-[#E84A27]"
                    >
                      <option value="owner">Owner / Founder</option>
                      <option value="chef">Head Chef / Pop-up Host</option>
                      <option value="manager">General Manager</option>
                      <option value="staff">Kitchen Staff</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#181615]">Business Email *</label>
                    <input
                      type="email"
                      required
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      placeholder="chef@restaurant.no"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#181615]/10 bg-white text-xs font-semibold focus:outline-none focus:border-[#E84A27]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#181615]">Instagram Handle</label>
                    <input
                      type="text"
                      value={instagramHandle}
                      onChange={(e) => setInstagramHandle(e.target.value)}
                      placeholder="@restaurant_oslo"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#181615]/10 bg-white text-xs font-semibold focus:outline-none focus:border-[#E84A27]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#181615]">Norwegian Phone</label>
                    <input
                      type="tel"
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                      placeholder="e.g. 91234567"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#181615]/10 bg-white text-xs font-semibold focus:outline-none focus:border-[#E84A27]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#181615]">Org. Number (Optional)</label>
                    <input
                      type="text"
                      value={applicantOrg}
                      onChange={(e) => setApplicantOrg(e.target.value.replace(/\s+/g, ""))}
                      placeholder="9 digits"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#181615]/10 bg-white text-xs font-mono focus:outline-none focus:border-[#E84A27]"
                    />
                  </div>
                </div>

                {/* Final Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-[#E84A27] hover:bg-[#D43D1C] disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 min-h-[44px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deploying Changes &amp; Generating Remote…</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Publish Card &amp; Get Kitchen Remote Link</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* =========================================================================
              STICKY BOTTOM NAVIGATION (MIN-H 44PX TOUCH TARGETS)
              ========================================================================= */}
          <div className="p-3 sm:p-4 bg-[#F5EFE4] border-t border-[#181615]/10 flex items-center justify-between gap-3 shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-100 border border-[#181615]/10 text-xs font-bold text-[#181615] transition-all cursor-pointer min-h-[44px]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            ) : (
              <span />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as any)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E84A27] hover:bg-[#D43D1C] text-white text-xs font-bold shadow-md transition-all cursor-pointer min-h-[44px]"
              >
                <span>Continue: {STEPS[step]?.label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
