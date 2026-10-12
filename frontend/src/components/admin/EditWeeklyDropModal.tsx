"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, Check, Sparkles, Upload } from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { broadcastWeeklyPick, uploadDishPhoto } from "@/lib/supabase/data";
import { WeeklyPick } from "@/types";

interface EditWeeklyDropModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditWeeklyDropModal({ isOpen, onClose }: EditWeeklyDropModalProps) {
  const weeklyPick = useCityPulseStore((state) => state.weeklyPick);
  const setWeeklyPick = useCityPulseStore((state) => state.setWeeklyPick);
  const venues = useCityPulseStore((state) => state.venues);
  const showToast = useCityPulseStore((state) => state.showToast);

  const [venueId, setVenueId] = useState(weeklyPick.venue_id);
  const [dishName, setDishName] = useState(weeklyPick.dish_name);
  const [dishImage, setDishImage] = useState(weeklyPick.dish_image);
  const [speechBubble, setSpeechBubble] = useState(weeklyPick.speech_bubble);
  const [priceNok, setPriceNok] = useState(String(weeklyPick.price_nok || ""));
  const [weekLabel, setWeekLabel] = useState(weeklyPick.week_label || "This Week's Pick");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVenueId(weeklyPick.venue_id);
      setDishName(weeklyPick.dish_name);
      setDishImage(weeklyPick.dish_image);
      setSpeechBubble(weeklyPick.speech_bubble);
      setPriceNok(String(weeklyPick.price_nok || ""));
      setWeekLabel(weeklyPick.week_label || "This Week's Pick");
    }
  }, [isOpen, weeklyPick]);

  if (!isOpen) return null;

  const selectedVenue = venues.find((v) => v.id === venueId);

  const handleVenueChange = (newVenueId: string) => {
    setVenueId(newVenueId);
    const v = venues.find((x) => x.id === newVenueId);
    if (v) {
      if (v.cover_image_url && !dishImage) setDishImage(v.cover_image_url);
      if (v.signature_dishes?.[0] && !dishName) setDishName(v.signature_dishes[0]);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { url, error } = await uploadDishPhoto(file);
    if (error || !url) {
      showToast(error ?? "Upload failed.");
      return;
    }
    setDishImage(url);
    showToast("Photo uploaded.");
  };

  const handleSave = async () => {
    if (!venueId) {
      showToast("Select a venue for the Weekly Drop.");
      return;
    }
    setIsSaving(true);
    try {
      const v = venues.find((x) => x.id === venueId);
      const coords: [number, number] = v ? [v.longitude, v.latitude] : weeklyPick.coords;
      const parsedPrice = priceNok.trim() ? Number(priceNok) : 0;

      const updatedPick: WeeklyPick = {
        id: `weekly-pick-${venueId}`,
        venue_id: venueId,
        dish_name: dishName.trim() || "Chef's pick",
        dish_image: dishImage.trim() || "/images/placeholder-dish.jpg",
        speech_bubble: speechBubble.trim(),
        coords,
        price_nok: parsedPrice,
        week_label: weekLabel.trim() || "This Week's Pick",
        active: true,
      };

      setWeeklyPick(updatedPick);

      const { error } = await broadcastWeeklyPick({
        venueId,
        dishName: updatedPick.dish_name,
        dishImage: updatedPick.dish_image,
        priceNok: updatedPick.price_nok,
        speechBubble: updatedPick.speech_bubble,
        weekLabel: updatedPick.week_label,
        latitude: coords[1],
        longitude: coords[0],
      });

      if (error) {
        showToast("Drop updated locally. Supabase broadcast sync failed.");
      } else {
        showToast("✦ Weekly Drop updated live across Oslo!");
      }
      onClose();
    } catch {
      showToast("Failed to broadcast Weekly Drop.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#181615] text-zinc-100 rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/30">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-[#e84a27]/20 text-[#e84a27]">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="font-comico text-base text-white tracking-wide">
              Edit Weekly Drop
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs no-scrollbar">
          {/* Spotlight Venue */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">
              Spotlight Venue
            </label>
            <select
              value={venueId}
              onChange={(e) => handleVenueChange(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-hidden focus:border-[#e84a27]"
            >
              <option value="" disabled className="bg-zinc-900 text-zinc-400">
                Choose venue…
              </option>
              {venues.map((v) => (
                <option key={v.id} value={v.id} className="bg-zinc-900 text-white">
                  {v.name} ({v.neighborhood || v.city || "Oslo"})
                </option>
              ))}
            </select>
          </div>

          {/* Dish Name & Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">
                Dish Name
              </label>
              <input
                type="text"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                placeholder="Spicy Miso Ramen"
                className="w-full text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-hidden focus:border-[#e84a27]"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">
                Price (NOK)
              </label>
              <input
                type="number"
                value={priceNok}
                onChange={(e) => setPriceNok(e.target.value)}
                placeholder="185"
                className="w-full text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-hidden focus:border-[#e84a27]"
              />
            </div>
          </div>

          {/* Week Label */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">
              Week Label
            </label>
            <input
              type="text"
              value={weekLabel}
              onChange={(e) => setWeekLabel(e.target.value)}
              placeholder="Drop 42 · Autumn Warmer"
              className="w-full text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-hidden focus:border-[#e84a27]"
            />
          </div>

          {/* Mascot Speech Bubble Hot-Take */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">
              Mascot Speech Bubble Note
            </label>
            <textarea
              rows={3}
              value={speechBubble}
              onChange={(e) => setSpeechBubble(e.target.value)}
              placeholder="Rich, 16-hour broth that warms your soul on rainy Oslo afternoons."
              className="w-full text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-hidden focus:border-[#e84a27]"
            />
          </div>

          {/* Dish Image */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">
              Dish Image
            </label>
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                {dishImage ? (
                  <Image src={dishImage} alt="Dish" fill unoptimized className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500">
                    🍜
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <input
                  type="text"
                  value={dishImage}
                  onChange={(e) => setDishImage(e.target.value)}
                  placeholder="https://… or upload photo"
                  className="w-full text-xs px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-hidden focus:border-[#e84a27]"
                />
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[11px] font-semibold text-white cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-[#e84a27]" />
                  <span>Upload photo</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-white/10 bg-black/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-[#e84a27]/25 transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSaving ? "Broadcasting…" : "Save & Broadcast"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
