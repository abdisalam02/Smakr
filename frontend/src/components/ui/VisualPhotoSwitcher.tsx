"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Camera, RefreshCw, Check, Link as LinkIcon, Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
import { uploadDishPhoto } from "@/lib/supabase/data";

export interface VisualPhotoSwitcherProps {
  currentImageUrl: string;
  venuePlaceId?: string | null;
  venueName?: string;
  category?: string;
  extraPhotos?: string[];
  onSelectPhoto: (url: string) => void;
  className?: string;
  label?: string;
}

// Curated high-resolution culinary photography library
const CATEGORY_PRESETS: Record<string, string[]> = {
  ramen: [
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=1200&q=80",
  ],
  burger: [
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=1200&q=80",
  ],
  pizza: [
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=1200&q=80",
  ],
  bakery: [
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=80",
  ],
  coffee: [
    "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
  ],
  fried_chicken: [
    "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=1200&q=80",
  ],
  street_food: [
    "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=1200&q=80",
  ],
  sushi: [
    "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=80",
  ],
  pasta: [
    "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=80",
  ],
  tacos: [
    "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1200&q=80",
  ],
  dessert: [
    "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=1200&q=80",
  ],
};

export function toPhotoUrl(p: unknown): string | null {
  if (!p) return null;
  if (typeof p === "string") {
    const s = p.trim();
    if (!s) return null;
    if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/api/places/photos") || s.startsWith("data:")) {
      return s;
    }
    if (s.startsWith("places/")) {
      return `/api/places/photos?ref=${encodeURIComponent(s)}&w=800`;
    }
    return s;
  }
  if (typeof p === "object") {
    const obj = p as Record<string, any>;
    if (obj.photo_reference && typeof obj.photo_reference === "string") {
      return `/api/places/photos?ref=${encodeURIComponent(obj.photo_reference)}&w=800`;
    }
    if (obj.name && typeof obj.name === "string") {
      return `/api/places/photos?ref=${encodeURIComponent(obj.name)}&w=800`;
    }
    if (typeof obj.url === "string") return obj.url;
    if (typeof obj.uri === "string") return obj.uri;
  }
  return null;
}

export function toThumbnailUrl(url: string): string {
  if (!url) return "";
  if (url.includes("/api/places/photos")) {
    if (url.includes("w=")) {
      return url.replace(/w=\d+/, "w=200");
    }
    if (url.includes("maxwidth=")) {
      return url.replace(/maxwidth=\d+/, "w=200");
    }
    return url.includes("?") ? `${url}&w=200` : `${url}?w=200`;
  }
  return url;
}

export function VisualPhotoSwitcher({
  currentImageUrl,
  venuePlaceId,
  venueName,
  category = "all",
  extraPhotos = [],
  onSelectPhoto,
  className = "",
  label = "Photo Cover & Gallery",
}: VisualPhotoSwitcherProps) {
  const [googlePhotos, setGooglePhotos] = useState<string[]>([]);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState(currentImageUrl || "");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-fetch Google photos if placeId or venueName provided
  const fetchGooglePhotos = async () => {
    setIsLoadingGoogle(true);
    try {
      if (venuePlaceId) {
        const res = await fetch(`/api/places/details?place_id=${encodeURIComponent(venuePlaceId)}`);
        const data = await res.json();
        const photos = data?.place?.photos || [];
        const mapped = photos
          .map(toPhotoUrl)
          .filter((u: any): u is string => Boolean(u))
          .slice(0, 10);
        if (mapped.length > 0) {
          setGooglePhotos(mapped);
          return;
        }
      }
      if (venueName) {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(venueName + " Oslo")}`);
        const data = await res.json();
        const photos = data?.place?.photos || [];
        const mapped = photos
          .map(toPhotoUrl)
          .filter((u: any): u is string => Boolean(u))
          .slice(0, 10);
        setGooglePhotos(mapped);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  useEffect(() => {
    if (venuePlaceId || venueName) {
      void fetchGooglePhotos();
    }
  }, [venuePlaceId, venueName]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Try Supabase dish-photos bucket
      const res = await uploadDishPhoto(file);
      if (res.url) {
        onSelectPhoto(res.url);
        return;
      }
      // Fallback to local Data URI if guest / no auth
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          onSelectPhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      // Fallback
    } finally {
      setIsUploading(false);
    }
  };

  // Compile unique candidate photos
  const candidates: string[] = [];
  if (currentImageUrl) candidates.push(currentImageUrl);
  extraPhotos.forEach((p) => {
    if (p && !candidates.includes(p)) candidates.push(p);
  });
  googlePhotos.forEach((p) => {
    if (p && !candidates.includes(p)) candidates.push(p);
  });
  const catKey = category.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const presetList = CATEGORY_PRESETS[catKey] || CATEGORY_PRESETS.street_food || [];
  presetList.forEach((p) => {
    if (p && !candidates.includes(p)) candidates.push(p);
  });

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <label className="text-xs font-bold text-[#181615] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-[#E84A27]" />
            <span>{label}</span>
          </span>
          <span className="text-[10px] font-mono font-medium text-zinc-400">
            {candidates.length} sources
          </span>
        </label>
      )}

      {/* Main Bar: Active Preview on Left + Action Buttons on Right */}
      <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#FAF7F2] border border-[#181615]/10">
        {/* Left: Active 96×72px Thumbnail */}
        <div className="relative w-24 h-[72px] min-w-[96px] min-h-[72px] rounded-xl overflow-hidden bg-zinc-200 border border-[#181615]/10 shrink-0">
          {currentImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentImageUrl}
              alt="Active cover"
              className="w-full h-full object-cover block"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400">
              <Camera className="w-6 h-6" />
            </div>
          )}
          <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded-md bg-black/75 text-white text-[9px] font-mono font-bold">
            Live
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="h-8 px-3 rounded-xl bg-white hover:bg-zinc-50 border border-[#181615]/15 text-[#181615] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E84A27]" />
              ) : (
                <Camera className="w-3.5 h-3.5 text-[#E84A27]" />
              )}
              <span>Upload Photo</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {(venuePlaceId || venueName) && (
              <button
                type="button"
                disabled={isLoadingGoogle}
                onClick={fetchGooglePhotos}
                className="h-8 px-2.5 rounded-xl bg-white hover:bg-zinc-50 border border-[#181615]/15 text-[#181615] text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                title="Fetch photos from Google Places"
              >
                <RefreshCw
                  className={`w-3 h-3 text-[#E84A27] ${isLoadingGoogle ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Google Photos</span>
              </button>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowUrlInput((prev) => !prev)}
              className="text-[11px] font-medium text-zinc-500 hover:text-[#E84A27] underline cursor-pointer"
            >
              {showUrlInput ? "Hide image link" : "Or paste image link"}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden/Collapsible Direct Link Input */}
      {showUrlInput && (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#181615]/10 animate-in fade-in">
          <LinkIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-1" />
          <input
            type="url"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="Paste public image link (https://...)"
            className="flex-1 text-xs font-medium focus:outline-none text-[#181615]"
          />
          <button
            type="button"
            onClick={() => {
              if (manualUrl.trim()) onSelectPhoto(manualUrl.trim());
              setShowUrlInput(false);
            }}
            className="px-2.5 py-1 rounded-lg bg-[#E84A27] text-white text-xs font-bold cursor-pointer"
          >
            Apply
          </button>
        </div>
      )}

      {/* Horizontal Strip of Clickable 60×60px Thumbnails */}
      {candidates.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Tap to Switch Photo ({candidates.length})
          </span>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {candidates.map((photoUrl, idx) => {
              const isSelected = currentImageUrl === photoUrl;
              return (
                <button
                  key={`${photoUrl.slice(0, 32)}_${idx}`}
                  type="button"
                  onClick={() => onSelectPhoto(photoUrl)}
                  className={`relative w-[60px] h-[60px] min-w-[60px] min-h-[60px] max-w-[60px] max-h-[60px] rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#E84A27] ring-2 ring-[#E84A27]/20 scale-102 shadow-xs"
                      : "border-black/10 hover:border-black/30 opacity-80 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={toThumbnailUrl(photoUrl)}
                    alt={`Photo candidate ${idx + 1}`}
                    className="w-full h-full object-cover block"
                    referrerPolicy="no-referrer"
                  />
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#E84A27] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
