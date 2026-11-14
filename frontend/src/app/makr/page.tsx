"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Instagram,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  Ticket,
  Upload,
  X,
} from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { SmakrFoodIcon } from "@/components/food/FoodIcons";
import type { DietaryTag, FoodCategory, Neighborhood } from "@/types";
import type { PendingSubmission } from "@/lib/pendingQueue";

type MakrTab = "popup" | "photos";

const OSLO_NEIGHBORHOODS: { id: Neighborhood; label: string }[] = [
  { id: "sentrum", label: "Sentrum" },
  { id: "grunerlokka", label: "Grünerløkka" },
  { id: "torggata", label: "Torggata" },
  { id: "gronland", label: "Grønland" },
  { id: "toyen", label: "Tøyen" },
  { id: "frogner", label: "Frogner" },
  { id: "kampen", label: "Kampen" },
];

const DIETARY_OPTIONS: { id: DietaryTag; label: string }[] = [
  { id: "halal", label: "Halal" },
  { id: "vegan", label: "Vegan" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "gluten_free", label: "Gluten-Free" },
  { id: "spicy", label: "Spicy" },
];

const DISH_ICONS: { key: string; label: string; category: FoodCategory }[] = [
  { key: "popup", label: "Pop-Up", category: "street_food" },
  { key: "bakery", label: "Bakery", category: "bakery" },
  { key: "matcha", label: "Matcha", category: "coffee" },
  { key: "coffee", label: "Coffee", category: "coffee" },
  { key: "ramen", label: "Ramen", category: "ramen" },
  { key: "burger", label: "Smash", category: "burger" },
  { key: "tacos", label: "Tacos", category: "tacos" },
  { key: "dumplings", label: "Dumplings", category: "dumplings" },
  { key: "fried_chicken", label: "Chicken", category: "street_food" },
  { key: "dessert", label: "Sweet", category: "dessert" },
];

async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.onload = () => {
      const src = typeof reader.result === "string" ? reader.result : "";
      if (!src) return reject(new Error("Empty image"));
      const img = new Image();
      img.onerror = () => resolve(src);
      img.onload = () => {
        const maxSide = 960;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(src);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

export default function MakrStudioPage() {
  const venues = useCityPulseStore((s) => s.venues);
  const addPendingSubmission = useCityPulseStore((s) => s.addPendingSubmission);
  const showToast = useCityPulseStore((s) => s.showToast);

  const [tab, setTab] = useState<MakrTab>("popup");
  const [submitting, setSubmitting] = useState(false);
  const [submittedItem, setSubmittedItem] = useState<PendingSubmission | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tab 1 — Drop a Pop-Up
  const [popupName, setPopupName] = useState("");
  const [popupInstagram, setPopupInstagram] = useState("");
  const [popupNeighborhood, setPopupNeighborhood] = useState<Neighborhood>("sentrum");
  const [popupAddress, setPopupAddress] = useState("");
  const [isLocationTba, setIsLocationTba] = useState(false);
  const [dropDates, setDropDates] = useState("");
  const [dropHours, setDropHours] = useState("");
  const [heroDishName, setHeroDishName] = useState("");
  const [heroDishPrice, setHeroDishPrice] = useState("");
  const [popupIconKey, setPopupIconKey] = useState("popup");
  const [popupDietary, setPopupDietary] = useState<DietaryTag[]>([]);
  const [popupPhoto, setPopupPhoto] = useState<string | null>(null);
  const [popupNote, setPopupNote] = useState("");

  // Tab 2 — Add Spot & Dish Photos
  const [spotQuery, setSpotQuery] = useState("");
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [customSpotName, setCustomSpotName] = useState("");
  const [photoInstagram, setPhotoInstagram] = useState("");
  const [photoDishName, setPhotoDishName] = useState("");
  const [photoDishPrice, setPhotoDishPrice] = useState("");
  const [photoNote, setPhotoNote] = useState("");
  const [photoFiles, setPhotoFiles] = useState<string[]>([]);

  const selectedVenue = useMemo(
    () => venues.find((v) => v.id === selectedVenueId) ?? null,
    [venues, selectedVenueId]
  );

  const matchingVenues = useMemo(() => {
    const q = spotQuery.trim().toLowerCase();
    if (!q) return venues.slice(0, 8);
    return venues
      .filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          (v.neighborhood || "").toLowerCase().includes(q) ||
          (v.address || "").toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [venues, spotQuery]);

  const activeDishIcon = useMemo(
    () => DISH_ICONS.find((d) => d.key === popupIconKey) ?? DISH_ICONS[0],
    [popupIconKey]
  );

  const toggleDietary = (tag: DietaryTag) => {
    setPopupDietary((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handlePopupPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file);
      setPopupPhoto(dataUrl);
    } catch {
      setErrorMsg("Could not read that photo. Please try a JPG or PNG.");
    }
  };

  const handleGalleryPhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 3);
    if (files.length === 0) return;
    try {
      const encoded = await Promise.all(files.map((f) => compressImageFile(f)));
      setPhotoFiles((prev) => [...prev, ...encoded].slice(0, 3));
    } catch {
      setErrorMsg("Could not process one of the selected photos.");
    }
  };

  const submitPopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!popupName.trim()) {
      setErrorMsg("Give your pop-up a name to continue.");
      return;
    }
    if (!heroDishName.trim()) {
      setErrorMsg("Add a hero dish name so Oslo foodies know what to order.");
      return;
    }

    setSubmitting(true);
    const parsedPrice = heroDishPrice.trim() ? Number(heroDishPrice) : null;
    const submission: PendingSubmission = {
      id: `makr-popup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      kind: "makr_popup",
      status: "pending",
      created_at: new Date().toISOString(),
      venue_name: popupName.trim(),
      instagram_handle: popupInstagram.trim().replace(/^@/, "") || undefined,
      neighborhood: popupNeighborhood,
      address: isLocationTba ? "Oslo" : popupAddress.trim() || OSLO_NEIGHBORHOODS.find((n) => n.id === popupNeighborhood)?.label || "Oslo",
      is_location_tba: isLocationTba,
      drop_dates: dropDates.trim() || "Next Drop TBA",
      drop_hours: dropHours.trim() || undefined,
      dish_name: heroDishName.trim(),
      price_nok: parsedPrice && !Number.isNaN(parsedPrice) && parsedPrice > 0 ? Math.round(parsedPrice) : null,
      category: activeDishIcon.category,
      icon_key: activeDishIcon.key,
      dietary_tags: popupDietary,
      photo_url: popupPhoto || undefined,
      review_text: popupNote.trim() || undefined,
    };

    try {
      addPendingSubmission(submission);
      const res = await fetch("/api/makr/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Could not send pop-up submission.");
      }
      setSubmittedItem(submission);
      showToast("Pop-up sent to Smakr Radar queue ✨");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Could not send pop-up submission.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitPhotos = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const spotTitle = selectedVenue?.name || customSpotName.trim();
    if (!spotTitle) {
      setErrorMsg("Pick an Oslo spot or enter your spot name first.");
      return;
    }
    if (photoFiles.length === 0) {
      setErrorMsg("Attach at least 1 photo of your dish or storefront.");
      return;
    }

    setSubmitting(true);
    const parsedPrice = photoDishPrice.trim() ? Number(photoDishPrice) : null;
    const submission: PendingSubmission = {
      id: `makr-photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      kind: "makr_photos",
      status: "pending",
      created_at: new Date().toISOString(),
      venue_id: selectedVenue?.id,
      venue_name: spotTitle,
      neighborhood: selectedVenue?.neighborhood || "sentrum",
      address: selectedVenue?.address || "Oslo",
      latitude: selectedVenue?.latitude,
      longitude: selectedVenue?.longitude,
      instagram_handle: photoInstagram.trim().replace(/^@/, "") || undefined,
      dish_name: photoDishName.trim() || undefined,
      price_nok: parsedPrice && !Number.isNaN(parsedPrice) && parsedPrice > 0 ? Math.round(parsedPrice) : null,
      category: selectedVenue?.food_category || "street_food",
      photo_url: photoFiles[0],
      extra_photos: photoFiles.slice(1),
      review_text: photoNote.trim() || undefined,
    };

    try {
      addPendingSubmission(submission);
      const res = await fetch("/api/makr/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Could not upload photos.");
      }
      setSubmittedItem(submission);
      showToast("Photos sent for Smakr approval ✨");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Could not upload photos.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmittedItem(null);
    setErrorMsg(null);
    setPopupName("");
    setPopupInstagram("");
    setPopupAddress("");
    setDropDates("");
    setDropHours("");
    setHeroDishName("");
    setHeroDishPrice("");
    setPopupPhoto(null);
    setPopupNote("");
    setPhotoDishName("");
    setPhotoDishPrice("");
    setPhotoNote("");
    setPhotoFiles([]);
  };

  return (
    <main className="min-h-dvh bg-[#FAF7F2] text-[#181615] px-4 pt-20 pb-20">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#181615]/75 hover:text-[#181615] bg-white border border-[#181615]/10 px-3.5 py-2 rounded-full shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Oslo Radar</span>
          </Link>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181615] text-[#FAF7F2] text-[10px] font-black uppercase tracking-[0.12em]">
            <Sparkles className="w-3 h-3 text-[#E84A27]" />
            No Login Required
          </span>
        </div>

        <header className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#E84A27]">
            Smakr for Kitchens, Bakers &amp; Pop-Ups
          </p>
          <h1 className="font-comico font-normal text-[32px] sm:text-[38px] leading-[1.0] uppercase tracking-wide text-[#181615]">
            SMAKR MAKR STUDIO
          </h1>
          <p className="text-[13.5px] leading-relaxed text-[#181615]/75 max-w-lg">
            Got a weekend pop-up in Oslo or want fresh photos on your spot&apos;s card? Drop
            everything right here — no account or password required.
          </p>
        </header>

        {submittedItem ? (
          <section className="rounded-3xl bg-white border-2 border-[#4E8752]/40 p-6 sm:p-8 text-center shadow-sm space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#4E8752]/15 text-[#4E8752] flex items-center justify-center mx-auto">
              <Check className="w-7 h-7" />
            </div>
            <h2 className="font-comico font-normal text-2xl uppercase text-[#181615]">
              {submittedItem.kind === "makr_popup"
                ? "Pop-Up Sent to Smakr Radar"
                : "Photos Sent for Approval"}
            </h2>
            <p className="text-sm text-[#181615]/75 max-w-md mx-auto leading-relaxed">
              We&apos;ve queued <span className="font-bold text-[#181615]">{submittedItem.venue_name}</span>{" "}
              for our Oslo editors. Once approved, it goes live on the Oslo radar map &amp; feed.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-3 rounded-2xl bg-[#E84A27] hover:bg-[#d63e1c] text-white font-bold text-xs cursor-pointer"
              >
                Submit another drop
              </button>
              <Link
                href="/"
                className="px-5 py-3 rounded-2xl bg-[#181615] text-white font-bold text-xs"
              >
                Return to Oslo Map
              </Link>
            </div>
          </section>
        ) : (
          <>
            {/* 2 Clean Studio Tabs */}
            <div
              role="tablist"
              className="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-[#EDE7DD] border border-[#181615]/10"
            >
              <button
                type="button"
                role="tab"
                aria-selected={tab === "popup"}
                onClick={() => {
                  setTab("popup");
                  setErrorMsg(null);
                }}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  tab === "popup"
                    ? "bg-[#181615] text-[#FAF7F2] shadow-sm"
                    : "text-[#181615]/70 hover:text-[#181615]"
                }`}
              >
                <Ticket className="w-4 h-4 text-[#E84A27]" />
                <span>🎟️ Drop a Pop-Up</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={tab === "photos"}
                onClick={() => {
                  setTab("photos");
                  setErrorMsg(null);
                }}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  tab === "photos"
                    ? "bg-[#181615] text-[#FAF7F2] shadow-sm"
                    : "text-[#181615]/70 hover:text-[#181615]"
                }`}
              >
                <Camera className="w-4 h-4 text-[#E84A27]" />
                <span>📸 Add Spot &amp; Dish Photos</span>
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-semibold text-rose-800">
                {errorMsg}
              </div>
            )}

            {tab === "popup" ? (
              <form
                onSubmit={submitPopup}
                className="rounded-3xl bg-white border border-[#181615]/10 p-5 sm:p-6 shadow-xs space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-[#181615]">Pop-Up Name *</span>
                    <input
                      type="text"
                      required
                      value={popupName}
                      onChange={(e) => setPopupName(e.target.value)}
                      placeholder="e.g. Biscoff Bake Club"
                      className="w-full rounded-xl bg-[#FAF7F2] border border-[#181615]/15 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E84A27]"
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-[#181615] flex items-center gap-1">
                      <Instagram className="w-3.5 h-3.5 text-[#E84A27]" />
                      @Instagram Handle
                    </span>
                    <input
                      type="text"
                      value={popupInstagram}
                      onChange={(e) => setPopupInstagram(e.target.value)}
                      placeholder="@uwansum.oslo"
                      className="w-full rounded-xl bg-[#FAF7F2] border border-[#181615]/15 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E84A27]"
                    />
                  </label>
                </div>

                {/* Location + TBA Toggle */}
                <div className="space-y-3 rounded-2xl bg-[#FAF7F2] border border-[#181615]/10 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#181615] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#E84A27]" />
                      Oslo Neighborhood &amp; Street
                    </span>

                    <button
                      type="button"
                      onClick={() => setIsLocationTba((v) => !v)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                        isLocationTba
                          ? "bg-[#E84A27] text-white border-[#E84A27]"
                          : "bg-white text-[#181615]/75 border-[#181615]/15"
                      }`}
                    >
                      {isLocationTba ? "✓ Location TBA / Roaming" : "Location TBA / Roaming"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={popupNeighborhood}
                      onChange={(e) => setPopupNeighborhood(e.target.value as Neighborhood)}
                      className="rounded-xl bg-white border border-[#181615]/15 px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-[#E84A27]"
                    >
                      {OSLO_NEIGHBORHOODS.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.label}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      disabled={isLocationTba}
                      value={isLocationTba ? "Roaming Pop-Up · Address TBA" : popupAddress}
                      onChange={(e) => setPopupAddress(e.target.value)}
                      placeholder="Street address (e.g. Torggata 18)"
                      className="rounded-xl bg-white border border-[#181615]/15 px-3.5 py-2.5 text-sm disabled:opacity-60 focus:outline-none focus:border-[#E84A27]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-[#181615]">Drop Dates</span>
                    <input
                      type="text"
                      value={dropDates}
                      onChange={(e) => setDropDates(e.target.value)}
                      placeholder="e.g. Sat–Sun, 16–17 Nov"
                      className="w-full rounded-xl bg-[#FAF7F2] border border-[#181615]/15 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E84A27]"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-[#181615]">Hours</span>
                    <input
                      type="text"
                      value={dropHours}
                      onChange={(e) => setDropHours(e.target.value)}
                      placeholder="e.g. 12:00 – Sold Out"
                      className="w-full rounded-xl bg-[#FAF7F2] border border-[#181615]/15 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E84A27]"
                    />
                  </label>
                </div>

                {/* Hero Dish & NOK Price */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="block space-y-1.5 sm:col-span-2">
                    <span className="text-xs font-bold text-[#181615]">Hero Dish Name *</span>
                    <input
                      type="text"
                      required
                      value={heroDishName}
                      onChange={(e) => setHeroDishName(e.target.value)}
                      placeholder="e.g. Salted Egg Cloud Coffee"
                      className="w-full rounded-xl bg-[#FAF7F2] border border-[#181615]/15 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E84A27]"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-[#181615]">Price (NOK)</span>
                    <input
                      type="number"
                      min="1"
                      value={heroDishPrice}
                      onChange={(e) => setHeroDishPrice(e.target.value)}
                      placeholder="85"
                      className="w-full rounded-xl bg-[#FAF7F2] border border-[#181615]/15 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E84A27]"
                    />
                  </label>
                </div>

                {/* Dish Icon Selector */}
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-[#181615]">Dish Pin Icon</span>
                  <div className="flex flex-wrap gap-2">
                    {DISH_ICONS.map((item) => {
                      const active = popupIconKey === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setPopupIconKey(item.key)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                            active
                              ? "bg-[#181615] text-[#FAF7F2] border-[#181615]"
                              : "bg-[#FAF7F2] text-[#181615]/80 border-[#181615]/15 hover:border-[#E84A27]"
                          }`}
                        >
                          <SmakrFoodIcon name={item.key} className="w-4 h-4" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dietary Tags */}
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-[#181615]">Dietary Tags</span>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_OPTIONS.map((tag) => {
                      const active = popupDietary.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleDietary(tag.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                            active
                              ? "bg-[#4E8752] text-white border-[#4E8752]"
                              : "bg-[#FAF7F2] text-[#181615]/75 border-[#181615]/15"
                          }`}
                        >
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hero Photo Upload */}
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-[#181615]">Hero Dish Photo</span>
                  {popupPhoto ? (
                    <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-[#181615]/15">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={popupPhoto} alt="Pop-up hero preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPopupPhoto(null)}
                        aria-label="Remove photo"
                        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-[#181615]/80 text-white flex items-center justify-center cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#181615]/20 bg-[#FAF7F2] hover:border-[#E84A27] py-6 px-4 cursor-pointer transition-colors">
                      <Upload className="w-5 h-5 text-[#E84A27]" />
                      <span className="text-xs font-bold text-[#181615]">Tap to upload a dish or pop-up photo</span>
                      <span className="text-[11px] text-[#181615]/55">JPG or PNG, cropped cleanly for the Oslo radar</span>
                      <input type="file" accept="image/*" onChange={handlePopupPhotoUpload} className="sr-only" />
                    </label>
                  )}
                </div>

                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-[#181615]">Short Drop Note (optional)</span>
                  <textarea
                    rows={2}
                    value={popupNote}
                    onChange={(e) => setPopupNote(e.target.value)}
                    placeholder="What makes this pop-up worth crossing town for?"
                    className="w-full rounded-xl bg-[#FAF7F2] border border-[#181615]/15 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E84A27]"
                  />
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#E84A27] hover:bg-[#d63e1c] disabled:opacity-60 text-white font-bold text-sm py-3.5 px-5 shadow-[0_6px_18px_rgba(232,74,39,0.28)] transition-all cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Pop-Up…</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Pop-Up to Smakr Radar</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form
                onSubmit={submitPhotos}
                className="rounded-3xl bg-white border border-[#181615]/10 p-5 sm:p-6 shadow-xs space-y-5"
              >
                {/* Searchable Spot Selector */}
                <div className="space-y-2.5">
                  <span className="block text-xs font-bold text-[#181615]">
                    Select Existing Oslo Spot *
                  </span>

                  <div className="relative">
                    <Search className="w-4 h-4 text-[#181615]/45 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={spotQuery}
                      onChange={(e) => {
                        setSpotQuery(e.target.value);
                        if (selectedVenueId) setSelectedVenueId(null);
                      }}
                      placeholder="Search your spot (e.g. Ochaya, Koie, U WAN SUM)..."
                      className="w-full rounded-xl bg-[#FAF7F2] border border-[#181615]/15 pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E84A27]"
                    />
                  </div>

                  {selectedVenue ? (
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-[#181615] text-[#FAF7F2] px-3.5 py-2.5">
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{selectedVenue.name}</p>
                        <p className="text-[11px] text-[#FAF7F2]/70 truncate">
                          {selectedVenue.neighborhood} · {selectedVenue.address}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedVenueId(null)}
                        className="text-xs font-bold text-[#E84A27] shrink-0 cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="max-h-44 overflow-y-auto rounded-xl border border-[#181615]/10 divide-y divide-[#181615]/8 bg-[#FAF7F2]">
                      {matchingVenues.length > 0 ? (
                        matchingVenues.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => {
                              setSelectedVenueId(v.id);
                              setSpotQuery(v.name);
                            }}
                            className="w-full px-3.5 py-2 text-left hover:bg-white transition-colors flex items-center justify-between gap-2 cursor-pointer"
                          >
                            <span className="text-xs font-bold text-[#181615] truncate">{v.name}</span>
                            <span className="text-[11px] text-[#181615]/60 shrink-0">{v.neighborhood}</span>
                          </button>
                        ))
                      ) : (
                        <div className="p-3 space-y-2">
                          <p className="text-[11px] text-[#181615]/60">
                            Can&apos;t see your spot? Enter the spot name directly below:
                          </p>
                          <input
                            type="text"
                            value={customSpotName}
                            onChange={(e) => setCustomSpotName(e.target.value)}
                            placeholder="Custom spot name in Oslo"
                            className="w-full rounded-lg bg-white border border-[#181615]/15 px-3 py-2 text-xs"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="block space-y-1.5 sm:col-span-2">
                    <span className="text-xs font-bold text-[#181615]">Dish Name (optional)</span>
                    <input
                      type="text"
                      value={photoDishName}
                      onChange={(e) => setPhotoDishName(e.target.value)}
                      placeholder="e.g. Pistachio Matcha Cloud"
                      className="w-full rounded-xl bg-[#FAF7F2] border border-[#181615]/15 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E84A27]"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-[#181615]">Price (NOK)</span>
                    <input
                      type="number"
                      min="1"
                      value={photoDishPrice}
                      onChange={(e) => setPhotoDishPrice(e.target.value)}
                      placeholder="79"
                      className="w-full rounded-xl bg-[#FAF7F2] border border-[#181615]/15 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E84A27]"
                    />
                  </label>
                </div>

                {/* Upload 1-3 Photos */}
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-[#181615]">
                    Upload 1–3 Dish or Storefront Photos *
                  </span>

                  {photoFiles.length > 0 && (
                    <div className="grid grid-cols-3 gap-2.5">
                      {photoFiles.map((src, i) => (
                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-[#181615]/15">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setPhotoFiles((prev) => prev.filter((_, idx) => idx !== i))}
                            aria-label="Remove photo"
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#181615]/80 text-white flex items-center justify-center cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {photoFiles.length < 3 && (
                    <label className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#181615]/20 bg-[#FAF7F2] hover:border-[#E84A27] py-6 px-4 cursor-pointer transition-colors">
                      <Upload className="w-5 h-5 text-[#E84A27]" />
                      <span className="text-xs font-bold text-[#181615]">
                        Select up to {3 - photoFiles.length} high-res photo{3 - photoFiles.length > 1 ? "s" : ""}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryPhotosUpload}
                        className="sr-only"
                      />
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-[#181615]">@Instagram (optional)</span>
                    <input
                      type="text"
                      value={photoInstagram}
                      onChange={(e) => setPhotoInstagram(e.target.value)}
                      placeholder="@yourkitchen"
                      className="w-full rounded-xl bg-[#FAF7F2] border border-[#181615]/15 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E84A27]"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-[#181615]">Kitchen Note (optional)</span>
                    <input
                      type="text"
                      value={photoNote}
                      onChange={(e) => setPhotoNote(e.target.value)}
                      placeholder="New menu item or storefront update"
                      className="w-full rounded-xl bg-[#FAF7F2] border border-[#181615]/15 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E84A27]"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#181615] hover:bg-[#2c2826] disabled:opacity-60 text-white font-bold text-sm py-3.5 px-5 shadow-sm transition-all cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Photos…</span>
                    </>
                  ) : (
                    <>
                      <span>Send Photos for Approval</span>
                      <ArrowRight className="w-4 h-4 text-[#E84A27]" />
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}
