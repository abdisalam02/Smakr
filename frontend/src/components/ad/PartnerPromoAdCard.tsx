"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import {
  Download,
  Flame,
  Star,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { toPng } from "html-to-image";
import type { Venue } from "@/types";
import { OfficialSmakrMascot } from "@/lib/officialSmakrMascot";

export type AdAspectRatio = "4:5" | "9:16";

export interface PartnerPromoAdProps {
  venue?: Venue | null;
  aspectRatio: AdAspectRatio;
  headline?: string;
  subheadline?: string;
  hookType?: "front_door" | "delivery_markup" | "food_radar";
}

export const PRESET_PARTNER_HOOKS = {
  front_door: {
    hook: "✦ FOR OSLO CHEFS & OWNERS",
    headline: "Google Maps is showing a photo of your front door.",
    subheadline: "Google defaults to closed storefronts, napkins, and wrong hours. Put your real 4:3 dish hero on Oslo's food radar.",
  },
  delivery_markup: {
    hook: "✦ DIRECT FOOD DISCOVERY",
    headline: "Your 185 kr burger shouldn't say 275 kr on delivery apps.",
    subheadline: "Third-party delivery apps inflate your prices. Smakr displays your real in-house NOK price and direct kitchen status.",
  },
  food_radar: {
    hook: "✦ LIVE KITCHEN REMOTE",
    headline: "Put your real dish on Oslo's live food radar.",
    subheadline: "Warm cardamom buns out of the oven? Last 10 ramen bowls? Update your live card from your phone with zero passwords.",
  },
};

export function PartnerPromoAdCard({
  venue,
  aspectRatio = "4:5",
  headline,
  subheadline,
  hookType = "front_door",
}: PartnerPromoAdProps) {
  const adCardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const activeHook = PRESET_PARTNER_HOOKS[hookType] || PRESET_PARTNER_HOOKS.front_door;
  const displayHeadline = headline || activeHook.headline;
  const displaySubheadline = subheadline || activeHook.subheadline;

  const venueName = venue?.name || "Digg Pizza Grønland";
  const venueAddress = venue?.address || "Grønlandsleiret 1";
  const venueNeighborhood = venue?.neighborhood || venue?.city || "Grønland";
  const venueDish = venue?.signature_dishes?.[0] || "Spicy Diavola with Hot Honey";
  const venueCover =
    venue?.cover_image_url ||
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1000&q=80";

  const handleDownloadPng = async () => {
    if (!adCardRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(adCardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `smakr-partner-ad-${aspectRatio.replace(":", "x")}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export error", err);
    } finally {
      setIsExporting(false);
    }
  };

  const isStory = aspectRatio === "9:16";

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Visual Canvas Container to Export */}
      <div
        ref={adCardRef}
        style={{
          width: isStory ? "450px" : "480px",
          height: isStory ? "800px" : "600px",
        }}
        className="relative bg-[#F5EFE4] text-[#181615] p-5 sm:p-7 flex flex-col justify-between overflow-hidden rounded-[28px] shadow-2xl border-2 border-[#181615]/15 select-none"
      >
        {/* Subtle MapLibre & Street Grid Pattern Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(24,22,21,0.18) 1px, transparent 0), linear-gradient(to right, rgba(24,22,21,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(24,22,21,0.06) 1px, transparent 1px)`,
            backgroundSize: `24px 24px, 48px 48px, 48px 48px`,
          }}
        />

        {/* Soft Warm Radial Vignette (No neon, pure warm paper contrast) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(245,239,228,0.2) 0%, rgba(235,225,208,0.65) 100%)",
          }}
        />

        {/* Vintage Inset Poster Border */}
        <div className="absolute inset-2.5 sm:inset-3 border border-[#181615]/15 rounded-[22px] pointer-events-none" />

        {/* =========================================================================
            TOP EDITORIAL HEADER
            ========================================================================= */}
        <div className="relative z-10 space-y-2">
          {/* Top Pill Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F2]/90 border border-[#181615]/12 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#E84A27]" />
              <span className="font-comico text-xs tracking-wider uppercase text-[#181615]">
                SMAKR OSLO · FOR KITCHENS
              </span>
            </div>

            <div className="text-[10px] font-mono tracking-widest text-[#181615]/60 uppercase">
              OSLO FOOD RADAR
            </div>
          </div>

          {/* Headline & Subtitle */}
          <div className="space-y-1">
            <h2
              className={`font-comico font-black text-[#181615] tracking-tight leading-[1.08] ${
                isStory ? "text-2xl" : "text-xl sm:text-[23px]"
              }`}
            >
              {displayHeadline}
            </h2>
            <p className="text-[11.5px] text-[#2B1810]/75 leading-snug font-medium max-w-md">
              {displaySubheadline}
            </p>
          </div>
        </div>

        {/* =========================================================================
            CENTER VISUAL — TACTILE CUTOUT STACK ("Before" Google vs Smakr Venue Card)
            ========================================================================= */}
        <div className="relative z-10 my-auto py-2 flex items-center justify-center">
          {/* BEHIND: DRAB GOOGLE DEFAULT LISTING (Tilted -4deg, muted stone) */}
          <div
            style={{ transform: "rotate(-4deg) translateX(-18px)" }}
            className="w-56 sm:w-60 p-3 rounded-2xl bg-[#E8E2D7] border border-[#181615]/20 opacity-70 shadow-md pointer-events-none select-none"
          >
            <div className="flex items-center justify-between text-[9px] font-mono text-[#181615]/60 mb-1.5">
              <span>Google Maps Default</span>
              <span className="text-red-700 font-bold">Unclaimed</span>
            </div>
            {/* Blurry Closed Front Door Photo */}
            <div className="relative aspect-[16/10] rounded-xl bg-zinc-300 overflow-hidden flex items-center justify-center border border-[#181615]/10">
              <div className="text-center p-2">
                <div className="text-xl">🚪</div>
                <div className="text-[9px] font-mono text-zinc-600 mt-0.5">
                  Drab front door photo
                </div>
              </div>
            </div>
            <div className="mt-1.5 space-y-0.5">
              <div className="text-[11px] font-bold text-zinc-700 truncate">
                {venueName} (Google Listing)
              </div>
              <div className="text-[9.5px] text-zinc-500">
                Closed doors · $$$ Delivery fees
              </div>
            </div>
          </div>

          {/* FOREGROUND: CRISP AUTHENTIC SMAKR VENUE CARD (Tilted +1deg, elevated) */}
          <div
            style={{
              transform: "rotate(1.5deg) translateX(12px)",
              boxShadow: "0 20px 40px rgba(24,22,21,0.22)",
            }}
            className="w-64 sm:w-72 p-3 sm:p-3.5 rounded-3xl bg-[#FAF7F2] border-2 border-[#181615] text-[#181615] select-none"
          >
            {/* Real 4:3 Dish Hero Photo */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#181615]/15 bg-stone-200">
              <Image
                src={venueCover}
                alt={venueDish}
                fill
                unoptimized
                className="object-cover"
                sizes="300px"
              />

              {/* Dark bottom scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent pointer-events-none" />

              {/* Tilted Burnt Paprika Price Sticker (-1.5deg) */}
              <div
                style={{ transform: "rotate(-1.5deg)" }}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-[#E84A27] text-white font-comico text-sm font-black shadow-md border border-white/20"
              >
                185 kr
              </div>

              {/* Live Kitchen Status Pill */}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FAF7F2]/95 backdrop-blur-md text-[10px] font-bold text-[#E84A27] shadow-xs border border-[#181615]/10">
                <Flame className="w-3 h-3 fill-[#E84A27] text-[#E84A27]" />
                <span>Fresh Batch</span>
              </div>

              {/* Dish Name Overlay at Bottom */}
              <div className="absolute bottom-2 left-2.5 right-2.5 text-white">
                <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider font-mono">
                  Signature Dish
                </p>
                <p className="font-comico text-sm font-bold truncate leading-tight">
                  {venueDish}
                </p>
              </div>
            </div>

            {/* Venue Meta Info */}
            <div className="mt-2.5 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <h4 className="font-comico text-base font-black text-[#181615] truncate">
                  {venueName}
                </h4>
                <div className="flex items-center gap-0.5 text-xs font-bold text-[#181615] shrink-0 font-comico">
                  <Star className="w-3.5 h-3.5 fill-[#E84A27] text-[#E84A27]" />
                  <span>4.9</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-[#2B1810]/70">
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-[#E84A27] shrink-0" />
                  <span className="truncate">{venueAddress} · {venueNeighborhood}</span>
                </span>
                <span className="flex items-center gap-1 font-bold text-emerald-800 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                  <span>Open til 22:30</span>
                </span>
              </div>

              {/* Insider Taste Note */}
              <div className="pt-1 border-t border-[#181615]/10 text-[10px] text-[#2B1810]/85 italic line-clamp-1">
                ✦ Authentic in-house preparation with direct Oslo kitchen remote.
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            BOTTOM MASCOT + STREET-LEVEL CALL TO ACTION
            ========================================================================= */}
        <div className="relative z-10 flex items-end justify-between gap-3 pt-1">
          {/* Mascot with Comic Speech Bubble */}
          <div className="flex items-center gap-2">
            <div className="w-11 h-11 rounded-2xl bg-[#FAF7F2] border-2 border-[#181615] flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
              <OfficialSmakrMascot size={36} />
            </div>

            {/* Comic Speech Bubble */}
            <div className="relative p-2 rounded-2xl bg-[#FAF7F2] border-2 border-[#181615] text-[#181615] shadow-xs max-w-[170px] sm:max-w-[190px]">
              <p className="text-[10px] font-bold leading-tight">
                Own this spot? Claim your card in 30 seconds.
              </p>
              {/* Triangle Tail */}
              <div
                style={{
                  position: "absolute",
                  left: "-7px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 0,
                  height: 0,
                  borderTop: "6px solid transparent",
                  borderBottom: "6px solid transparent",
                  borderRight: "7px solid #181615",
                }}
              />
            </div>
          </div>

          {/* High-Contrast Tactile Footer Action Bar */}
          <div className="px-4 py-2.5 rounded-2xl bg-[#181615] text-[#FAF7F2] border-2 border-[#181615] shadow-md text-right">
            <div className="font-comico text-sm font-black tracking-tight flex items-center justify-end gap-1 text-white">
              <span>smakr.no</span>
              <span className="text-[#E84A27]">/partner</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#E84A27]" />
            </div>
            <div className="text-[9.5px] font-mono text-[#FAF7F2]/75">
              Free forever for Oslo kitchens
            </div>
          </div>
        </div>
      </div>

      {/* Control Actions Outside Canvas */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={isExporting}
          onClick={handleDownloadPng}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#E84A27] hover:bg-[#D23E1D] text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? "Rendering Image…" : `Download ${aspectRatio} PNG`}</span>
        </button>
      </div>
    </div>
  );
}
