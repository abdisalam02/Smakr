"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Upload,
  Camera,
  Trash2,
  Check,
  Sparkles,
  Utensils,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { uploadDishPhoto } from "@/lib/supabase/data";
import type { PartnerDishItem } from "./PartnerRestaurantCardPreview";
import type { DietaryTag, FoodCategory } from "@/types";

const DIETARY_CHOICES: { id: DietaryTag; label: string }[] = [
  { id: "halal", label: "Halal" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten_free", label: "Gluten-Free" },
];

const AVAILABILITY_CHOICES = [
  { id: "available", label: "Available Now", badgeBg: "bg-emerald-600 text-white" },
  { id: "fresh_batch", label: "Fresh From Oven", badgeBg: "bg-amber-500 text-white" },
  { id: "weekend", label: "Weekend Only", badgeBg: "bg-purple-600 text-white" },
  { id: "sold_out", label: "Sold Out Today", badgeBg: "bg-zinc-800 text-zinc-300" },
];

export interface PartnerDishCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  dish: PartnerDishItem | null;
  venuePlaceId?: string | null;
  venueName?: string;
  category?: FoodCategory;
  extraPhotos?: string[];
  onSaveDish: (dish: PartnerDishItem) => void;
  onDeleteDish?: (dishId: string) => void;
  showToast: (msg: string, type?: "success" | "error") => void;
}

export function PartnerDishCardModal({
  isOpen,
  onClose,
  dish,
  venueName = "Your Kitchen",
  category = "street_food",
  onSaveDish,
  onDeleteDish,
  showToast,
}: PartnerDishCardModalProps) {
  const [name, setName] = useState(dish?.dishName || "");
  const [price, setPrice] = useState<number | "">(dish?.priceNok ?? 185);
  const [imageUrl, setImageUrl] = useState(dish?.imageUrl || "");
  const [tasteNote, setTasteNote] = useState(dish?.tasteNote || "");
  const [dietary, setDietary] = useState<DietaryTag[]>(
    (dish?.dietaryTags as DietaryTag[]) || []
  );
  const [availability, setAvailability] = useState<string>("available");
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(dish?.dishName || "");
      setPrice(dish?.priceNok ?? 185);
      setImageUrl(dish?.imageUrl || "");
      setTasteNote(dish?.tasteNote || "");
      setDietary((dish?.dietaryTags as DietaryTag[]) || []);
      setAvailability("available");
      setIsUploading(false);
    }
  }, [isOpen, dish]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file (JPEG or PNG)", "error");
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      showToast("Photo must be smaller than 12MB", "error");
      return;
    }

    setIsUploading(true);

    try {
      // Direct upload to Supabase storage dish-photos bucket
      const res = await uploadDishPhoto(file);
      if (res.url) {
        setImageUrl(res.url);
        showToast("Dish photo uploaded", "success");
      } else {
        // Fallback to data URL for instant live preview
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          if (dataUrl) {
            setImageUrl(dataUrl);
            showToast("Dish photo loaded", "success");
          }
        };
        reader.readAsDataURL(file);
      }
    } catch {
      // Local fallback
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (dataUrl) setImageUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      showToast("Please enter a dish title", "error");
      return;
    }
    const cleanPrice = price === "" ? null : Number(price);
    const item: PartnerDishItem = {
      id: dish?.id || `dish_${Date.now()}`,
      dishName: name.trim(),
      priceNok: cleanPrice,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      tasteNote: tasteNote.trim() || `Prepared fresh in-house at ${venueName}.`,
      category,
      dietaryTags: dietary,
    };
    onSaveDish(item);
    showToast(dish ? "Dish updated in your card" : "Dish added to your card");
    onClose();
  };

  const currentAvailabilityBadge =
    AVAILABILITY_CHOICES.find((a) => a.id === availability) || AVAILABILITY_CHOICES[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-[#FAF7F2] dark:bg-[#1C1917] rounded-[28px] border border-[#181615]/10 shadow-2xl flex flex-col overflow-hidden z-10 max-h-[92dvh]"
        >
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-[#181615]/10 flex items-center justify-between shrink-0 bg-white/70 dark:bg-[#181615]/70 backdrop-blur-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#e84a27]" />
                <h3 className="font-comico text-sm sm:text-base font-bold text-[#181615] dark:text-white">
                  {dish ? "Edit Menu Dish" : "Add Dish to Card"}
                </h3>
              </div>
              <p className="text-[10px] text-[#6E655F]">
                Saves directly to your restaurant card preview
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#6E655F] hover:text-[#181615] cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Card Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
            {/* Visual 4:3 Photo Stage */}
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 border border-black/10 shadow-md group">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={name || "Dish photo"}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-2 p-4 text-center">
                  <Utensils className="w-8 h-8 opacity-40 text-white" />
                  <span className="text-xs font-semibold text-zinc-300">
                    Upload your kitchen photo below
                  </span>
                </div>
              )}

              {/* Gradient scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

              {/* Top Controls: Price sticker (left) and Availability (right) */}
              <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 z-10">
                {/* Editable Price Sticker */}
                <div className="inline-flex items-center gap-1 bg-[#e84a27] text-white px-3 py-1 rounded-full shadow-md rotate-[-1.5deg] border border-white/20">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) =>
                      setPrice(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="185"
                    className="w-14 bg-transparent text-xs font-bold text-white focus:outline-none placeholder-white/60 text-right"
                  />
                  <span className="text-xs font-bold font-sans">kr</span>
                  <span className="text-[10px] opacity-75 ml-0.5">✎</span>
                </div>

                {/* Availability status dropdown button */}
                <button
                  type="button"
                  onClick={() => {
                    const idx = AVAILABILITY_CHOICES.findIndex(
                      (a) => a.id === availability
                    );
                    const next =
                      AVAILABILITY_CHOICES[(idx + 1) % AVAILABILITY_CHOICES.length];
                    setAvailability(next.id);
                  }}
                  className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1 border border-white/15 ${currentAvailabilityBadge.badgeBg}`}
                  title="Click to cycle status"
                >
                  <span>{currentAvailabilityBadge.label}</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>
              </div>

              {/* Upload Button Overlay */}
              <div className="absolute bottom-3 right-3 z-10">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-full bg-[#181615]/85 hover:bg-[#e84a27] text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-md border border-white/25 shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-[#e84a27]" />
                      <span>{imageUrl ? "Change Photo" : "Upload Photo"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Clean Form Details Below Photo (No big white blocks!) */}
            <div className="space-y-3 pt-1">
              {/* Field 1: Dish Title */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#181615] dark:text-white flex items-center justify-between">
                  <span>Dish Title *</span>
                  <span className="text-[10px] text-[#6E655F]">Click to edit</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tonkotsu Deluxe, Cardamom Knot"
                  className="w-full h-11 px-3.5 rounded-xl border border-[#181615]/15 bg-white dark:bg-[#181615] text-xs font-bold text-[#181615] dark:text-white placeholder:text-[#6E655F]/50 focus:border-[#e84a27] outline-hidden shadow-2xs"
                />
              </div>

              {/* Field 2: Taste Note / Preparation */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#181615] dark:text-white flex items-center justify-between">
                  <span>✦ Taste Note / Insider Description</span>
                  <span className="text-[10px] text-[#6E655F]">Click to edit</span>
                </label>
                <textarea
                  rows={2}
                  value={tasteNote}
                  onChange={(e) => setTasteNote(e.target.value)}
                  placeholder="Describe flavour, broth hours, homemade sauce, or what makes it special..."
                  className="w-full p-3 rounded-xl border border-[#181615]/15 bg-white dark:bg-[#181615] text-xs font-normal text-[#181615] dark:text-white placeholder:text-[#6E655F]/50 focus:border-[#e84a27] outline-hidden resize-none leading-relaxed shadow-2xs"
                />
              </div>

              {/* Field 3: Dietary Tags */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#181615] dark:text-white">
                  Dietary Badges
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DIETARY_CHOICES.map((tag) => {
                    const active = dietary.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          setDietary((prev) =>
                            active
                              ? prev.filter((d) => d !== tag.id)
                              : [...prev, tag.id]
                          );
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                          active
                            ? "bg-[#e84a27] text-white border-[#e84a27] shadow-xs"
                            : "bg-white dark:bg-[#181615] text-[#6E655F] border-[#181615]/10 hover:border-[#181615]/25"
                        }`}
                      >
                        {active ? `✓ ${tag.label}` : tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-5 py-3.5 border-t border-[#181615]/10 flex items-center justify-between gap-3 bg-white/70 dark:bg-[#181615]/70 backdrop-blur-xs shrink-0">
            {dish && onDeleteDish ? (
              <button
                type="button"
                onClick={() => {
                  onDeleteDish(dish.id);
                  onClose();
                }}
                className="px-3 py-2 rounded-xl border border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white dark:bg-[#181615] border border-[#181615]/15 text-xs font-bold text-[#6E655F] hover:text-[#181615] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-[#e84a27] hover:bg-[#d43d1c] text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Save Dish to Card</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
