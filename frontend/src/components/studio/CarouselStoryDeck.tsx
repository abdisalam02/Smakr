"use client";

import React, { useCallback, useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { Download, Loader2, Maximize2, Snowflake, Sparkles, Ticket, X } from "lucide-react";
import { comico, anton } from "@/lib/fonts";
import { SmakrMascotRig } from "@/components/studio/SmakrMascotRig";
import { OFFICIAL_SMAKR_MASCOT_CONFIG } from "@/lib/officialSmakrMascot";

export type StoryPresetId = "how-smakr-works" | "oslo-snowfall-bowls" | "oslo-popup-radar";
export type StoryAspectId = "1:1" | "4:5" | "3:4" | "9:16";

function getStoryNativeHeight(aspect: StoryAspectId): number {
  if (aspect === "9:16") return 1920;
  if (aspect === "3:4") return 1440;
  if (aspect === "1:1") return 1080;
  return 1350;
}

const STORY_PRESET_LABELS: Record<StoryPresetId, string> = {
  "how-smakr-works": "How Smakr Works (5 Slides)",
  "oslo-snowfall-bowls": "❄️ Early Snow: 3 Steaming Bowls — 2 Slides",
  "oslo-popup-radar": "🎟️ Oslo Pop-Up Radar: U Wan Sum, Mint on Wheels & Crantz — 4 Slides",
};

interface SlidePinData {
  id: string;
  label?: string;
  iconSrc: string;
  highlighted?: boolean;
  pos45: React.CSSProperties;
  pos916: React.CSSProperties;
}

interface DarkCardData {
  img: string;
  price: string;
  rating: string;
  title: string;
  spot: string;
  area: string;
  quote: string;
  initial: string;
  author: string;
  fires: number;
  tilt: string;
  pos45: React.CSSProperties;
  pos916: React.CSSProperties;
}

interface EarlySnowBowlTile {
  id: string;
  img: string;
  title: string;
  description: string;
  price: string;
  tilt: string;
}

interface EarlySnowRevealSpot {
  pinNum: 1 | 2 | 3;
  pinLabel: string;
  pinIcon: string;
  dishImg: string;
  dishEyebrow: string;
  name: string;
  rating: string;
  location: string;
  description: string;
  highlighted?: boolean;
  pinPos916: React.CSSProperties;
  pinPos45: React.CSSProperties;
  cardPos916: React.CSSProperties;
  cardPos45: React.CSSProperties;
}

const SLIDE_1_MAP_PINS: SlidePinData[] = [
  {
    id: "kfried",
    label: "175°C K-Fried · 4.8★",
    iconSrc: "/icons/food/k_chicken.webp",
    highlighted: true,
    pos45: { left: 224, top: 325 },
    pos916: { left: 215, top: 530 },
  },
  {
    id: "digg",
    label: "Digg · 148 kr",
    iconSrc: "/icons/food/pizza.webp",
    pos45: { left: 118, top: 416 },
    pos916: { left: 108, top: 690 },
  },
  {
    id: "ochaya",
    label: "Ochaya · 78 kr",
    iconSrc: "/icons/food/matcha_cup.webp",
    pos45: { left: 700, top: 364 },
    pos916: { left: 695, top: 590 },
  },
  {
    id: "dimsum",
    label: "Dim Sum · 145 kr",
    iconSrc: "/icons/food/dumplings.webp",
    pos45: { right: 114, top: 636 },
    pos916: { right: 96, top: 930 },
  },
  {
    id: "handbakt",
    label: "Håndbakt · 59 kr",
    iconSrc: "/icons/food/croissant.webp",
    pos45: { right: 226, top: 790 },
    pos916: { right: 205, top: 1160 },
  },
  {
    id: "fuglen",
    label: "Fuglen Coffee",
    iconSrc: "/icons/food/coffee.webp",
    pos45: { right: 162, top: 922 },
    pos916: { right: 145, top: 1365 },
  },
];

const SLIDE_2_DISH_CARDS: DarkCardData[] = [
  {
    img: "/ad-slides/matcha.jpg",
    price: "78 kr",
    rating: "4.9",
    title: "Biscoff Matcha",
    spot: "Ochaya",
    area: "Sentrum",
    quote: "Rich ceremonial matcha topped with cold biscoff cream foam.",
    initial: "M",
    author: "@maja",
    fires: 9,
    tilt: "rotate(-5deg)",
    pos45: { left: 32, top: 312 },
    pos916: { left: 36, top: 430 },
  },
  {
    img: "/ad-slides/miso_tonkotsu.webp",
    price: "215 kr",
    rating: "4.9",
    title: "Spicy Miso Tonkotsu Ramen",
    spot: "Miso Ramen",
    area: "Sentrum",
    quote: "Rich miso pork bone broth, tender chashu & seasoned ajitama egg.",
    initial: "K",
    author: "@kenji",
    fires: 18,
    tilt: "rotate(4.5deg)",
    pos45: { right: 32, top: 320 },
    pos916: { right: 36, top: 446 },
  },
  {
    img: "/ad-slides/dumplings_yumcha.webp",
    price: "145 kr",
    rating: "4.8",
    title: "Steamed Dumplings",
    spot: "Yum Cha",
    area: "Majorstuen",
    quote: "Handmade soup dumplings bursting with ginger-scented pork broth.",
    initial: "L",
    author: "@llnh",
    fires: 12,
    tilt: "rotate(-4deg)",
    pos45: { left: 36, bottom: 110 },
    pos916: { left: 38, bottom: 175 },
  },
  {
    img: "/ad-slides/bolle.jpg",
    price: "135 kr",
    rating: "4.7",
    title: "Boller",
    spot: "Daglig Brød",
    area: "Gamlebyen",
    quote: "Warm artisan sourdough buns — pistachio, brunost, biscoff & cinnamon.",
    initial: "S",
    author: "@smak",
    fires: 14,
    tilt: "rotate(4deg)",
    pos45: { right: 34, bottom: 102 },
    pos916: { right: 36, bottom: 162 },
  },
];

const SLIDE_5_TOP_PINS: SlidePinData[] = [
  {
    id: "koie",
    label: "Koie Ramen",
    iconSrc: "/icons/food/ramen.webp",
    highlighted: true,
    pos45: { left: 96, top: 256 },
    pos916: { left: 92, top: 382 },
  },
  {
    id: "mini-wine",
    iconSrc: "/icons/food/drinks.webp",
    pos45: { left: 368, top: 288 },
    pos916: { left: 362, top: 448 },
  },
  {
    id: "mini-pizza",
    iconSrc: "/icons/food/pizza.webp",
    pos45: { left: 132, top: 484 },
    pos916: { left: 120, top: 720 },
  },
  {
    id: "mini-croissant",
    iconSrc: "/icons/food/croissant.webp",
    pos45: { left: 688, top: 282 },
    pos916: { left: 684, top: 428 },
  },
  {
    id: "s5-kfried",
    label: "175°C K-Fried",
    iconSrc: "/icons/food/k_chicken.webp",
    pos45: { right: 86, top: 258 },
    pos916: { right: 82, top: 386 },
  },
];

const EARLY_SNOW_SLIDE_1_BOWLS: EarlySnowBowlTile[] = [
  {
    id: "bowl-1",
    img: "/ad-slides/hrimnir_spicy_miso.webp",
    title: "Spicy Miso Ramen",
    description:
      "Slow-cooked chicken paitan broth with pork belly chashu, pickled daikon, chashu egg, fried cabbage, spring onion & handmade noodles.",
    price: "270 kr",
    tilt: "rotate(-3deg) translateY(6px)",
  },
  {
    id: "bowl-2",
    img: "/ad-slides/sapporo_red_miso.webp",
    title: "Miso Ramen",
    description:
      "With pork rib, egg and spring onions in a broth of beef, pork, chicken, fish and vegetables.",
    price: "195 kr",
    tilt: "rotate(2deg) translateY(-8px)",
  },
  {
    id: "bowl-3",
    img: "/ad-slides/emoi_pho.jpg",
    title: "Pho",
    description: "Slow cooked beef broth with rice noodles and herbs",
    price: "269 kr",
    tilt: "rotate(-2.5deg) translateY(6px)",
  },
];

const EARLY_SNOW_SLIDE_2_SPOTS: EarlySnowRevealSpot[] = [
  {
    pinNum: 1,
    pinLabel: "Hrimnir Ramen",
    pinIcon: "/icons/food/ramen.webp",
    dishImg: "/ad-slides/hrimnir_spicy_miso.webp",
    dishEyebrow: "SPICY MISO RAMEN · 270 KR",
    name: "Hrimnir Ramen",
    rating: "4.4",
    location: "Fredensborg · Maridalsveien 9A",
    description:
      "Slow-cooked chicken paitan broth with pork belly chashu, pickled daikon, chashu egg & handmade noodles.",
    pinPos916: { left: 720, top: 44, transform: "translateX(-50%)" },
    pinPos45: { left: 720, top: 16, transform: "translateX(-50%)" },
    cardPos916: { left: 485, top: 166, width: 470 },
    cardPos45: { left: 485, top: 124, width: 460 },
  },
  {
    pinNum: 2,
    pinLabel: "Sapporo Ramen Bar",
    pinIcon: "/icons/food/ramen.webp",
    dishImg: "/ad-slides/sapporo_red_miso.webp",
    dishEyebrow: "MISO RAMEN · 195 KR",
    name: "Sapporo Ramen Bar",
    rating: "4.4",
    location: "Vulkan · Maridalsveien 21",
    description:
      "With pork rib, egg and spring onions in a broth of beef, pork, chicken, fish and vegetables.",
    pinPos916: { left: 245, top: 380, transform: "translateX(-50%)" },
    pinPos45: { left: 245, top: 224, transform: "translateX(-50%)" },
    cardPos916: { left: 10, top: 502, width: 470 },
    cardPos45: { left: 10, top: 332, width: 460 },
  },
  {
    pinNum: 3,
    pinLabel: "Em Oi!",
    pinIcon: "/icons/food/noodles.webp",
    dishImg: "/ad-slides/emoi_pho.jpg",
    dishEyebrow: "PHO · 269 KR",
    name: "Em Oi!",
    rating: "4.7",
    location: "Grønland · Brugata",
    description: "Slow cooked beef broth with rice noodles and herbs.",
    pinPos916: { left: 700, top: 750, transform: "translateX(-50%)" },
    pinPos45: { left: 690, top: 474, transform: "translateX(-50%)" },
    cardPos916: { left: 465, top: 872, width: 470 },
    cardPos45: { left: 455, top: 582, width: 460 },
  },
];

interface SlideMetaEntry {
  num: 1 | 2 | 3 | 4 | 5;
  pillLabel: string;
  fileSlug: string;
}

const SLIDE_META: SlideMetaEntry[] = [
  { num: 1, pillLabel: "01 · MASCOT HOOK", fileSlug: "smakr_story_slide_01" },
  { num: 2, pillLabel: "02 · DISCOVER LOCALLY", fileSlug: "smakr_story_slide_02" },
  { num: 3, pillLabel: "03 · 1-TAP RADAR (DUAL)", fileSlug: "smakr_story_slide_03" },
  { num: 4, pillLabel: "04 · LIVE HOURS & SPOT", fileSlug: "smakr_story_slide_04" },
  { num: 5, pillLabel: "05 · SMAKR PICK + CTA", fileSlug: "smakr_story_slide_05" },
];

const SNOWFALL_SLIDE_META: SlideMetaEntry[] = [
  { num: 1, pillLabel: "01 · SNOWFALL BOWL TEASER", fileSlug: "smakr_early_snow_slide_01" },
  { num: 2, pillLabel: "02 · 3 OSLO SPOTS REVEALED", fileSlug: "smakr_early_snow_slide_02" },
];

const POPUP_SLIDE_META: SlideMetaEntry[] = [
  { num: 1, pillLabel: "01 · POP-UP RADAR", fileSlug: "smakr_popup_slide_01" },
  { num: 2, pillLabel: "02 · U WAN' SAM?", fileSlug: "smakr_popup_slide_02_uwansam" },
  { num: 3, pillLabel: "03 · MINT ON WHEELS", fileSlug: "smakr_popup_slide_03_mint" },
  { num: 4, pillLabel: "04 · CRANTZ COOKIES", fileSlug: "smakr_popup_slide_04_crantz" },
];

interface PopupPolaroidCard {
  id: string;
  img: string;
  title: string;
  teaser: string;
  pill: string;
  rotate: string;
  pos916: React.CSSProperties;
  pos45: React.CSSProperties;
}

const POPUP_SLIDE_1_POLAROIDS: PopupPolaroidCard[] = [
  {
    id: "popup-uwansum",
    img: "/ad-slides/u_wan_sum_popup.webp",
    title: "Vietnamese Egg & Coconut Phin Coffee",
    teaser: "Confirmed Oslo drop in 6 days (Nov 22)",
    pill: "Pop-Up #1 →",
    rotate: "rotate(-3deg)",
    pos916: { left: 10, top: 28, width: 320 },
    pos45: { left: 6, top: 6, width: 292 },
  },
  {
    id: "popup-mint",
    img: "/uploads/seeds/mint-on-wheels_mint-on-wheels-dish-1_1794239080384_7a5025e0.webp",
    title: "Double Biscoff Uji Matcha",
    teaser: "Just popped up at Mike's Corner (Nov 14)",
    pill: "75 kr",
    rotate: "rotate(2.5deg)",
    pos916: { right: 10, top: 52, width: 316 },
    pos45: { right: 6, top: 18, width: 290 },
  },
  {
    id: "popup-crantz",
    img: "/ad-slides/crantz_cookies_popup.webp",
    title: "Molten Biscoff & Kinder NYC Cookies",
    teaser: "100+ recipe tests · Next drop loading",
    pill: "50–60 kr",
    rotate: "rotate(-1.5deg)",
    pos916: { right: 24, bottom: 26, width: 324 },
    pos45: { right: 12, bottom: 6, width: 296 },
  },
];

interface PopupRevealSpot {
  id: string;
  pinLabel: string;
  pinIcon: string;
  img: string;
  name: string;
  locationLine: string;
  statusPill: string;
  dishPill: string;
  description: string;
  pinPos916: React.CSSProperties;
  pinPos45: React.CSSProperties;
  cardPos916: React.CSSProperties;
  cardPos45: React.CSSProperties;
}

const POPUP_SLIDE_2_SPOTS: PopupRevealSpot[] = [
  {
    id: "uwansum",
    pinLabel: "Tullinløkka · Nov 22",
    pinIcon: "/icons/food/coffee.webp",
    img: "/ad-slides/u_wan_sum_popup.webp",
    name: "U WAN SUM",
    locationLine: "📍 Tullinløkka · Next Drop: Sun Nov 22",
    statusPill: "🔥 NOV 22 DROP",
    dishPill: "✨ Vietnamese Egg & Phin Coffee",
    description:
      "Vietnamese Robusta phin coffee meets Egyptian hospitality by Amira Nasr El Din. Catch their next live drop at Tullinløkka on Nov 22.",
    pinPos916: { left: 110, top: 44, transform: "translateX(-50%)" },
    pinPos45: { left: 108, top: 16, transform: "translateX(-50%)" },
    cardPos916: { right: 0, top: 24, width: 735 },
    cardPos45: { right: 0, top: 8, width: 730 },
  },
  {
    id: "mint",
    pinLabel: "Oslobukta / Løren",
    pinIcon: "/icons/food/matcha_cup.webp",
    img: "/uploads/seeds/mint-on-wheels_mint-on-wheels-dish-1_1794239080384_7a5025e0.webp",
    name: "MINT ON WHEELS",
    locationLine: "📍 Oslobukta / Løren · Roaming Matcha Cart",
    statusPill: "⏳ NOV 14 MIKE'S CORNER",
    dishPill: "🍵 Double Biscoff Matcha · 75 kr",
    description:
      "Ceremonial Uji, Kyoto matcha on wheels. Just wrapped a 1-day drop at Mike's Corner—track their next Oslo street stop on Smakr.",
    pinPos916: { right: 86, top: 416 },
    pinPos45: { right: 82, top: 234 },
    cardPos916: { left: 0, top: 374, width: 735 },
    cardPos45: { left: 0, top: 204, width: 730 },
  },
  {
    id: "crantz",
    pinLabel: "Bjørvika & Vulkan",
    pinIcon: "/icons/food/croissant.webp",
    img: "/ad-slides/crantz_cookies_popup.webp",
    name: "CRANTZ COOKIES",
    locationLine: "📍 Bjørvika & Vulkan · Pop-Up Bakery",
    statusPill: "🍪 NEXT DROP LOADING",
    dishPill: "✨ Biscoff & Kinder Cookies · 50–60 kr",
    description:
      "Handmade chunky NYC-style cookies with molten cores by sisters Felicia & Adele. Known for sell-out drops at Bjørvika and Vulkan.",
    pinPos916: { left: 110, top: 752, transform: "translateX(-50%)" },
    pinPos45: { left: 108, top: 452 },
    cardPos916: { right: 0, top: 718, width: 735 },
    cardPos45: { right: 0, top: 414, width: 730 },
  },
];

const SANS_STACK =
  'var(--font-jakarta), "Plus Jakarta Sans", var(--font-dmsans), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const WORDMARK_STYLE: React.CSSProperties = {
  fontFamily: `${comico.style.fontFamily}, sans-serif`,
  fontSize: 48,
  color: "#e84a27",
  letterSpacing: "0.05em",
  lineHeight: 1,
  filter:
    "drop-shadow(2px 0 0 rgba(255,255,255,0.92)) drop-shadow(-2px 0 0 rgba(255,255,255,0.92)) drop-shadow(0 2px 0 rgba(255,255,255,0.92)) drop-shadow(0 -2px 0 rgba(255,255,255,0.92))",
};

function DarkTitaniumIPhone({
  screenImgUrl,
  widthPx,
  imgStyle,
  children,
}: {
  screenImgUrl: string;
  widthPx: number;
  imgStyle?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  const scale = widthPx / 398;
  const scaledW = Math.round(398 * scale);
  const scaledH = Math.round(860 * scale);

  return (
    <div style={{ width: scaledW, height: scaledH, position: "relative", flexShrink: 0 }}>
      <div
        style={{
          position: "relative",
          width: 398,
          height: 860,
          flexShrink: 0,
          userSelect: "none",
          transform: `scale(${scale.toFixed(4)})`,
          transformOrigin: "top left",
        }}
      >
        {/* Physical Flush Titanium Hairline Buttons */}
        <div
          style={{
            position: "absolute",
            background: "#2D2B28",
            border: "0.5px solid rgba(255,255,255,0.08)",
            zIndex: 5,
            borderRadius: 2,
            left: -2,
            top: 165,
            width: 2.5,
            height: 38,
          }}
        />
        <div
          style={{
            position: "absolute",
            background: "#2D2B28",
            border: "0.5px solid rgba(255,255,255,0.08)",
            zIndex: 5,
            borderRadius: 2,
            left: -2,
            top: 225,
            width: 2.5,
            height: 68,
          }}
        />
        <div
          style={{
            position: "absolute",
            background: "#2D2B28",
            border: "0.5px solid rgba(255,255,255,0.08)",
            zIndex: 5,
            borderRadius: 2,
            left: -2,
            top: 310,
            width: 2.5,
            height: 68,
          }}
        />
        <div
          style={{
            position: "absolute",
            background: "#2D2B28",
            border: "0.5px solid rgba(255,255,255,0.08)",
            zIndex: 5,
            borderRadius: 2,
            right: -2,
            top: 235,
            width: 2.5,
            height: 90,
          }}
        />

        {/* Ultra-Sleek Dark Titanium Chassis */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            background: "#181716",
            borderRadius: 48,
            padding: 4,
            border: "1px solid #2D2B28",
            boxShadow:
              "inset 0 0 0 1px rgba(255, 255, 255, 0.12), 0 10px 24px rgba(24, 22, 21, 0.22), -18px 30px 58px rgba(24, 22, 21, 0.25)",
          }}
        >
          <div
            style={{
              position: "relative",
              width: 388,
              height: 850,
              borderRadius: 44,
              overflow: "hidden",
              background: "#FAF7F2",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={screenImgUrl}
              alt="Smakr app screen"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                ...imgStyle,
              }}
            />

            {children && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 20,
                  pointerEvents: "none",
                }}
              >
                {children}
              </div>
            )}

            {/* Dynamic Island */}
            <div
              style={{
                position: "absolute",
                top: 12,
                left: "50%",
                transform: "translateX(-50%)",
                width: 104,
                height: 26,
                background: "#000000",
                borderRadius: 999,
                zIndex: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 10px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#090B0E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: "50%",
                    background: "#147A8A",
                    boxShadow: "0 0 2px #1CC5DC",
                  }}
                />
              </div>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#0D0F12",
                }}
              />
            </div>

            <div
              style={{
                position: "absolute",
                top: 3,
                left: "50%",
                transform: "translateX(-50%)",
                width: 42,
                height: 2.5,
                borderRadius: 2,
                background: "#0A0908",
                zIndex: 42,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background:
                  "linear-gradient(118deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.01) 32%, transparent 52%)",
                borderRadius: 44,
                zIndex: 45,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideBackdrop({
  is916,
  mapTransform,
  scrimColor = "rgba(250, 247, 242, 0.14)",
  topFade = true,
  bottomFade = false,
}: {
  is916: boolean;
  mapTransform?: string;
  scrimColor?: string;
  topFade?: boolean;
  bottomFade?: boolean;
}) {
  const bgSrc = is916 ? "/ad-slides/pure_oslo_map_9_16.png" : "/ad-slides/pure_oslo_map_4_5.png";
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bgSrc}
        alt="Oslo MapLibre backdrop"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "saturate(0.97) contrast(1.02)",
          transform: mapTransform,
          transformOrigin: "center center",
          display: "block",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: scrimColor,
          zIndex: 1,
        }}
      />
      {topFade && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(250, 247, 242, 0.94) 0%, rgba(250, 247, 242, 0.78) 16%, rgba(250, 247, 242, 0.30) 27%, rgba(250, 247, 242, 0) 38%)",
            zIndex: 2,
          }}
        />
      )}
      {bottomFade && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(0deg, rgba(250, 247, 242, 0.96) 0%, rgba(250, 247, 242, 0.78) 14%, rgba(250, 247, 242, 0.25) 26%, rgba(250, 247, 242, 0) 36%)",
            zIndex: 2,
          }}
        />
      )}
    </div>
  );
}

const SNOW_PARTICLES: Array<{
  left: number;
  top: number;
  size: number;
  opacity: number;
  rotate?: number;
  blur?: number;
  kind: "flake" | "orb";
}> = [
  { left: 42, top: 64, size: 38, opacity: 0.92, rotate: 12, kind: "flake" },
  { left: 174, top: 148, size: 22, opacity: 0.85, rotate: 35, kind: "flake" },
  { left: 268, top: 78, size: 18, opacity: 0.88, kind: "orb" },
  { left: 804, top: 82, size: 32, opacity: 0.9, rotate: -18, kind: "flake" },
  { left: 952, top: 132, size: 44, opacity: 0.95, rotate: 24, kind: "flake" },
  { left: 1008, top: 264, size: 22, opacity: 0.85, kind: "orb" },
  { left: 54, top: 342, size: 30, opacity: 0.88, rotate: 42, kind: "flake" },
  { left: 366, top: 360, size: 26, opacity: 0.72, rotate: 10, blur: 1.5, kind: "flake" },
  { left: 664, top: 344, size: 28, opacity: 0.82, rotate: -22, kind: "flake" },
  { left: 942, top: 386, size: 34, opacity: 0.88, rotate: -28, kind: "flake" },
  { left: 486, top: 472, size: 16, opacity: 0.82, kind: "orb" },
  { left: 64, top: 584, size: 34, opacity: 0.88, rotate: 15, kind: "flake" },
  { left: 982, top: 616, size: 40, opacity: 0.92, rotate: -14, blur: 1, kind: "flake" },
  { left: 530, top: 678, size: 24, opacity: 0.8, rotate: 30, kind: "flake" },
  { left: 144, top: 788, size: 20, opacity: 0.82, kind: "orb" },
  { left: 884, top: 802, size: 26, opacity: 0.86, rotate: 22, kind: "flake" },
  { left: 48, top: 960, size: 30, opacity: 0.88, rotate: -20, kind: "flake" },
  { left: 472, top: 928, size: 18, opacity: 0.8, kind: "orb" },
  { left: 996, top: 1020, size: 28, opacity: 0.88, rotate: 18, kind: "flake" },
  { left: 112, top: 1440, size: 30, opacity: 0.88, rotate: 15, kind: "flake" },
  { left: 620, top: 1500, size: 26, opacity: 0.84, rotate: -25, kind: "flake" },
  { left: 970, top: 1640, size: 38, opacity: 0.92, rotate: 20, kind: "flake" },
  { left: 180, top: 1720, size: 22, opacity: 0.86, kind: "orb" },
];

function EarlySnowfallOverlay({ is916 }: { is916: boolean }) {
  const maxTop = is916 ? 1860 : 1290;
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 5,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {SNOW_PARTICLES.filter((p) => p.top <= maxTop).map((p, idx) =>
        p.kind === "flake" ? (
          <svg
            key={idx}
            width={p.size}
            height={p.size}
            viewBox="0 0 32 32"
            fill="none"
            style={{
              position: "absolute",
              left: p.left,
              top: p.top,
              opacity: p.opacity,
              transform: p.rotate ? `rotate(${p.rotate}deg)` : undefined,
              filter: `${p.blur ? `blur(${p.blur}px) ` : ""}drop-shadow(0 2px 6px rgba(30, 64, 175, 0.25))`,
            }}
          >
            {/* 6-branch winter snowflake crystal with crisp ice-blue edge + snow-white core */}
            <g stroke="#38BDF8" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.62">
              <path d="M16 2.5V29.5" />
              <path d="M4.3 9.25L27.7 22.75" />
              <path d="M27.7 9.25L4.3 22.75" />
              <path d="M12.5 6.2L16 9.2L19.5 6.2" />
              <path d="M12.5 25.8L16 22.8L19.5 25.8" />
            </g>
            <g stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 2.5V29.5" />
              <path d="M4.3 9.25L27.7 22.75" />
              <path d="M27.7 9.25L4.3 22.75" />
              <path d="M12.5 6.2L16 9.2L19.5 6.2" />
              <path d="M12.5 25.8L16 22.8L19.5 25.8" />
              <path d="M6.8 14L10.3 12.6L9.4 8.9" />
              <path d="M25.2 18L21.7 19.4L22.6 23.1" />
              <path d="M22.6 8.9L21.7 12.6L25.2 14" />
              <path d="M9.4 23.1L10.3 19.4L6.8 18" />
            </g>
          </svg>
        ) : (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.96) 0%, rgba(186,230,253,0.58) 52%, rgba(56,189,248,0) 76%)",
              opacity: p.opacity,
            }}
          />
        )
      )}
    </div>
  );
}

function SlideBrandHeader({ fontSize }: { fontSize?: number }) {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
      }}
    >
      <span style={fontSize ? { ...WORDMARK_STYLE, fontSize } : WORDMARK_STYLE}>SMAKR</span>
    </div>
  );
}

function BareSlideHeader({
  is916,
  headline,
  subheadline,
  headlineSize,
  subheadlineSize,
  maxWidth = 920,
  showDivider = false,
}: {
  is916: boolean;
  headline: React.ReactNode;
  subheadline?: string;
  headlineSize?: number;
  subheadlineSize?: number;
  maxWidth?: number;
  showDivider?: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 30,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <SlideBrandHeader fontSize={is916 ? 54 : 46} />
      {showDivider ? (
        <div
          aria-hidden="true"
          style={{
            width: 112,
            height: 3.5,
            borderRadius: 999,
            background: "rgba(232, 74, 39, 0.56)",
            marginTop: is916 ? 14 : 10,
            marginBottom: is916 ? 14 : 10,
          }}
        />
      ) : null}
      <div
        style={{
          marginTop: showDivider ? 0 : is916 ? 18 : 12,
          fontFamily: SANS_STACK,
          fontSize: headlineSize ?? (is916 ? 56 : 50),
          fontWeight: 800,
          lineHeight: 1.08,
          letterSpacing: "-0.025em",
          color: "#181615",
          maxWidth,
          textShadow: "0 2px 14px rgba(250, 247, 242, 0.96), 0 0 2px rgba(250, 247, 242, 0.9)",
        }}
      >
        {headline}
      </div>
      {subheadline ? (
        <div
          style={{
            marginTop: is916 ? 12 : 8,
            fontSize: subheadlineSize ?? (is916 ? 20.5 : 18.5),
            lineHeight: 1.35,
            fontWeight: 600,
            color: "#292524",
            maxWidth: 860,
            textShadow: "0 1px 10px rgba(250, 247, 242, 0.96)",
          }}
        >
          {subheadline}
        </div>
      ) : null}
    </div>
  );
}

function MinimalStoryFooter({
  totalDots,
  activeIndex,
  rightPrompt,
}: {
  totalDots: number;
  activeIndex: number;
  rightPrompt?: string;
}) {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 32,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
        {Array.from({ length: totalDots }, (_, idx) => {
          const isActive = idx + 1 === activeIndex;
          return (
            <div
              key={idx}
              style={{
                width: isActive ? 24 : 6,
                height: 6,
                borderRadius: 999,
                background: isActive ? "#e84a27" : "rgba(24, 22, 21, 0.24)",
                boxShadow: "0 1px 4px rgba(255,255,255,0.65)",
              }}
            />
          );
        })}
      </div>

      {rightPrompt ? (
        <div
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: "#181615",
            letterSpacing: "-0.01em",
            textShadow: "0 1px 10px rgba(250, 247, 242, 0.95), 0 0 2px rgba(250, 247, 242, 0.95)",
          }}
        >
          {rightPrompt}
        </div>
      ) : (
        <div />
      )}
    </div>
  );
}

function SignatureFoodiesScribble({ width = 440 }: { width?: number }) {
  return (
    <svg
      width={width}
      viewBox="0 0 560 132"
      fill="none"
      aria-label="for the foodies"
      style={{ display: "block", overflow: "visible", userSelect: "none" }}
    >
      {/* "for the" white halo + ink */}
      <text
        x="38"
        y="96"
        textAnchor="start"
        style={{
          fontFamily: `${comico.style.fontFamily}, sans-serif`,
          fontSize: "42px",
          fontWeight: 900,
          letterSpacing: "0.06em",
          fill: "#FFFFFF",
          stroke: "#FFFFFF",
          strokeWidth: "7px",
          strokeLinejoin: "round",
          strokeLinecap: "round",
          paintOrder: "stroke fill",
        }}
      >
        FOR THE
      </text>
      <text
        x="38"
        y="96"
        textAnchor="start"
        style={{
          fontFamily: `${comico.style.fontFamily}, sans-serif`,
          fontSize: "42px",
          fontWeight: 900,
          letterSpacing: "0.06em",
          fill: "#181615",
        }}
      >
        FOR THE
      </text>

      {/* "big backs" white halo + ink */}
      <text
        x="265"
        y="96"
        textAnchor="start"
        style={{
          fontFamily: `${comico.style.fontFamily}, sans-serif`,
          fontSize: "45px",
          fontWeight: 900,
          letterSpacing: "0.05em",
          fill: "#FFFFFF",
          stroke: "#FFFFFF",
          strokeWidth: "7px",
          strokeLinejoin: "round",
          strokeLinecap: "round",
          paintOrder: "stroke fill",
        }}
      >
        BIG BACKS
      </text>
      <text
        x="265"
        y="96"
        textAnchor="start"
        style={{
          fontFamily: `${comico.style.fontFamily}, sans-serif`,
          fontSize: "45px",
          fontWeight: 900,
          letterSpacing: "0.05em",
          fill: "#181615",
        }}
      >
        BIG BACKS
      </text>

      {/* Orange strikethrough over BIG BACKS */}
      <path
        d="M 255 75 C 340 70, 440 78, 528 73"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 255 75 C 340 70, 440 78, 528 73"
        fill="none"
        stroke="#E84A27"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Tilted "✦ FOODIES" correction above */}
      <g transform="translate(392, 24) rotate(-6)">
        <text
          x="0"
          y="0"
          textAnchor="middle"
          style={{
            fontFamily: `${comico.style.fontFamily}, sans-serif`,
            fontSize: "30px",
            fontWeight: 900,
            letterSpacing: "0.04em",
            fill: "#FFFFFF",
            stroke: "#FFFFFF",
            strokeWidth: "7px",
            strokeLinejoin: "round",
            strokeLinecap: "round",
            paintOrder: "stroke fill",
          }}
        >
          ✦ FOODIES
        </text>
        <text
          x="0"
          y="0"
          textAnchor="middle"
          style={{
            fontFamily: `${comico.style.fontFamily}, sans-serif`,
            fontSize: "30px",
            fontWeight: 900,
            letterSpacing: "0.04em",
            fill: "#E84A27",
          }}
        >
          ✦ FOODIES
        </text>
      </g>

      {/* Curved arrow pointing from FOODIES to strikethrough */}
      <path
        d="M 435 30 C 460 39, 466 51, 456 64 M 448 56 L 456 64 L 465 54"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 435 30 C 460 39, 466 51, 456 64 M 448 56 L 456 64 L 465 54"
        fill="none"
        stroke="#E84A27"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PerfectedMapPin({
  iconSrc,
  label,
  highlighted = false,
  size,
  pinNum,
  style,
}: {
  iconSrc: string;
  label?: string;
  highlighted?: boolean;
  size?: number;
  pinNum?: number;
  style?: React.CSSProperties;
}) {
  const circleSize = size ?? (highlighted ? 56 : label ? 44 : 40);
  const imgSize = Math.round(circleSize * 0.68);
  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        zIndex: highlighted ? 26 : 22,
        ...style,
      }}
    >
      {label && (
        <div
          style={{
            background: highlighted ? "#e84a27" : "#181615",
            color: "#FFFFFF",
            fontFamily: SANS_STACK,
            fontSize: highlighted ? 13 : 12,
            fontWeight: 800,
            lineHeight: 1.15,
            padding: highlighted ? "4px 12px" : "3.5px 10px",
            borderRadius: 999,
            whiteSpace: "nowrap",
            marginBottom: 6,
            boxShadow: highlighted
              ? "0 8px 18px rgba(232, 74, 39, 0.34)"
              : "0 6px 14px rgba(24, 22, 21, 0.22)",
          }}
        >
          {label}
        </div>
      )}

      <div
        style={{
          position: "relative",
          width: circleSize,
          height: circleSize,
          borderRadius: "50%",
          background: highlighted ? "#FFFBF7" : "#FFFFFF",
          border: highlighted ? "2.5px solid #e84a27" : "1.5px solid rgba(24, 22, 21, 0.14)",
          boxShadow: highlighted
            ? "0 0 0 6px rgba(232, 74, 39, 0.20), 0 12px 24px rgba(232, 74, 39, 0.26)"
            : "0 8px 18px rgba(24, 22, 21, 0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconSrc}
          alt={label ?? "Food spot pin"}
          style={{
            width: imgSize,
            height: imgSize,
            objectFit: "contain",
            display: "block",
          }}
        />
        {typeof pinNum === "number" && (
          <span
            style={{
              position: "absolute",
              top: -5,
              right: -5,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "#e84a27",
              color: "#FFFFFF",
              fontSize: 12.5,
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #FFFFFF",
              boxShadow: "0 4px 10px rgba(232, 74, 39, 0.38)",
            }}
          >
            {pinNum}
          </span>
        )}
      </div>

      {/* Tiny pointer stem */}
      <div
        style={{
          width: 8,
          height: 8,
          transform: "rotate(45deg)",
          background: highlighted ? "#e84a27" : "#FFFFFF",
          marginTop: -4,
          borderRadius: 1,
          boxShadow: "0 3px 6px rgba(24, 22, 21, 0.16)",
        }}
      />
    </div>
  );
}

function DarkFooterDishCard({ card, is916 }: { card: DarkCardData; is916: boolean }) {
  const pos = is916 ? card.pos916 : card.pos45;
  const cardH = is916 ? 336 : 308;
  return (
    <div
      style={{
        position: "absolute",
        width: 292,
        height: cardH,
        borderRadius: 22,
        overflow: "hidden",
        boxShadow: "0 24px 52px rgba(24, 22, 21, 0.24)",
        border: "1.5px solid rgba(255, 255, 255, 0.65)",
        transform: card.tilt,
        zIndex: 25,
        background: "#181615",
        ...pos,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={card.img}
        alt={card.title}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />

      {/* Dark Bottom Scrim */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(16,14,13,0) 24%, rgba(16,14,13,0.72) 50%, rgba(14,12,11,0.96) 72%, #0E0C0B 100%)",
        }}
      />

      {/* Top Overlay Badges */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          right: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 4,
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              background: "#e84a27",
              color: "#FAF7F2",
              fontSize: 12,
              fontWeight: 900,
              padding: "4px 10px",
              borderRadius: 999,
              boxShadow: "0 4px 10px rgba(232,74,39,0.36)",
            }}
          >
            {card.price}
          </span>
          <span
            style={{
              background: "rgba(24, 22, 21, 0.78)",
              color: "#FFFFFF",
              fontSize: 11.5,
              fontWeight: 800,
              padding: "4px 9px",
              borderRadius: 999,
            }}
          >
            <span style={{ color: "#FBBF24" }}>★</span> {card.rating}
          </span>
        </div>

        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "rgba(24, 22, 21, 0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            color: "#e84a27",
          }}
        >
          ✦
        </div>
      </div>

      {/* Bottom Content */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "0 13px 12px 13px",
          zIndex: 4,
          color: "#FFFFFF",
        }}
      >
        <div
          style={{
            fontSize: 16.5,
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
            textShadow: "0 1px 4px rgba(0,0,0,0.65)",
          }}
        >
          {card.title}
        </div>
        <div
          style={{
            marginTop: 4,
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 10.5,
            fontWeight: 700,
            color: "rgba(255,255,255,0.88)",
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: "#e84a27" }}>📍</span>
          <span>{card.spot}</span>
          <span
            style={{
              background: "#16A34A",
              color: "#FFFFFF",
              fontSize: 9.5,
              fontWeight: 800,
              padding: "1.5px 6px",
              borderRadius: 999,
            }}
          >
            ✓ Verified
          </span>
          <span style={{ color: "rgba(255,255,255,0.65)" }}>· {card.area}</span>
        </div>

        <div
          style={{
            marginTop: 7,
            background: "rgba(255, 255, 255, 0.09)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: 10,
            padding: "6px 9px",
            fontSize: 10.5,
            lineHeight: 1.32,
            color: "rgba(255,255,255,0.92)",
            fontStyle: "italic",
          }}
        >
          <span style={{ color: "#e84a27", fontStyle: "normal", marginRight: 4 }}>✦</span>
          “{card.quote}”
        </div>

        <div
          style={{
            marginTop: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.16)",
                fontSize: 10,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {card.initial}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
              {card.author}
            </span>
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                background: "rgba(255,255,255,0.12)",
                color: "#FFFFFF",
                fontSize: 10.5,
                fontWeight: 800,
                padding: "4px 9px",
                borderRadius: 999,
              }}
            >
              🔥 {card.fires}
            </span>
            <span
              style={{
                background: "#FFFFFF",
                color: "#181615",
                fontSize: 11,
                fontWeight: 800,
                padding: "4px 11px",
                borderRadius: 999,
              }}
            >
              Map
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FrostedLiveCtaCard({
  subtitle = "Live dish radar, verified prices & weekly handpicked drops across Oslo.",
  bare = false,
}: {
  subtitle?: string;
  bare?: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 28,
        ...(bare
          ? {
              padding: "6px 12px",
            }
          : {
              background: "rgba(255, 255, 255, 0.94)",
              backdropFilter: "blur(12px)",
              borderRadius: 24,
              padding: "16px 38px",
              boxShadow: "0 18px 44px rgba(24, 22, 21, 0.14)",
              border: "2px solid rgba(24, 22, 21, 0.12)",
            }),
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: `${comico.style.fontFamily}, sans-serif`,
          fontSize: 13,
          fontWeight: 400,
          letterSpacing: "0.08em",
          color: "#e84a27",
          textTransform: "uppercase",
        }}
      >
        ✦ LIVE IN OSLO
      </div>
      <div
        style={{
          fontFamily: SANS_STACK,
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: "-0.025em",
          color: "#181615",
          marginTop: 2,
          lineHeight: 1.15,
        }}
      >
        Try it live at{" "}
        <span style={{ color: "#e84a27", fontFamily: `${comico.style.fontFamily}, sans-serif`, fontWeight: 400 }}>
          smakr.no
        </span>
      </div>
      {subtitle ? (
        <div
          style={{
            fontFamily: SANS_STACK,
            fontSize: 13,
            fontWeight: 600,
            color: "#57534E",
            marginTop: 5,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

function SnowfallSpeechBubble({ is916 }: { is916: boolean }) {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 26,
        flex: 1,
        maxWidth: is916 ? 520 : 495,
        padding: is916 ? "28px 36px 30px 44px" : "24px 30px 26px 38px",
        filter: "drop-shadow(0 16px 26px rgba(24, 22, 21, 0.20))",
      }}
    >
      {/* Hand-drawn sketchy ink speech bubble with left pointer tail */}
      <svg
        viewBox="0 0 520 156"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          overflow: "visible",
          pointerEvents: "none",
        }}
      >
        <path
          d="M 52 10 C 165 6, 360 7, 496 11 C 510 12, 514 26, 513 62 C 513 108, 511 136, 498 143 C 350 148, 175 147, 56 144 C 44 143, 40 132, 40 100 L 2 84 L 40 62 C 40 28, 42 12, 52 10 Z"
          fill="#FFFFFF"
          stroke="#181615"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Subtle sketchy ink accent lines matching hand-drawn banner style */}
        <path
          d="M 74 20 Q 150 18 220 20 M 340 134 Q 425 133 488 135 M 58 131 Q 108 133 145 132"
          stroke="#181615"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.22"
        />
      </svg>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          fontFamily: `${comico.style.fontFamily}, sans-serif`,
          fontSize: is916 ? 34 : 30,
          fontWeight: 900,
          lineHeight: 1.18,
          color: "#181615",
          letterSpacing: "0.02em",
          WebkitTextStroke: "0.55px #181615",
        }}
      >
        Warm yourself with{" "}
        <span
          style={{
            color: "#e84a27",
            fontFamily: `${comico.style.fontFamily}, sans-serif`,
            WebkitTextStroke: "0.55px #e84a27",
          }}
        >
          these 3 bowls.
        </span>
      </div>
    </div>
  );
}

function SnowRevealFloatingCard({ spot, is916 }: { spot: EarlySnowRevealSpot; is916: boolean }) {
  const pos = is916 ? spot.cardPos916 : spot.cardPos45;
  const thumbSize = is916 ? 120 : 106;
  return (
    <div
      style={{
        position: "absolute",
        background: "#FFFFFF",
        borderRadius: 22,
        padding: is916 ? "16px 18px" : "14px 16px",
        boxShadow: "0 22px 48px rgba(24, 22, 21, 0.14)",
        display: "flex",
        alignItems: "center",
        gap: is916 ? 16 : 14,
        zIndex: 28,
        ...pos,
      }}
    >
      <div style={{ position: "relative", flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={spot.dishImg}
          alt={spot.name}
          style={{
            width: thumbSize,
            height: thumbSize,
            borderRadius: 16,
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span
            style={{
              fontFamily: `${comico.style.fontFamily}, sans-serif`,
              fontSize: 13,
              fontWeight: 400,
              letterSpacing: "0.04em",
              color: "#e84a27",
              textTransform: "uppercase",
            }}
          >
            {spot.dishEyebrow}
          </span>
          <span
            style={{
              fontFamily: `${comico.style.fontFamily}, sans-serif`,
              background: "rgba(24, 22, 21, 0.88)",
              color: "#FFFFFF",
              fontSize: 12,
              fontWeight: 400,
              letterSpacing: "0.03em",
              padding: "2.5px 8px",
              borderRadius: 999,
              flexShrink: 0,
            }}
          >
            <span style={{ color: "#FBBF24" }}>★</span> {spot.rating}
          </span>
        </div>

        <div
          style={{
            fontFamily: SANS_STACK,
            fontSize: is916 ? 22 : 20,
            fontWeight: 800,
            color: "#181615",
            lineHeight: 1.15,
            marginTop: 2,
          }}
        >
          {spot.name}
        </div>

        <div
          style={{
            fontSize: is916 ? 13 : 12,
            fontWeight: 700,
            color: "#57534E",
            marginTop: 4,
          }}
        >
          <span style={{ color: "#e84a27", marginRight: 4 }}>📍</span>
          {spot.location}
        </div>
      </div>
    </div>
  );
}

function EarlySnowSlideCanvas({
  slideNum,
  aspect,
}: {
  slideNum: 1 | 2;
  aspect: StoryAspectId;
}) {
  const is916 = aspect === "9:16";
  const is34 = aspect === "3:4";
  const is11 = aspect === "1:1";
  const h = getStoryNativeHeight(aspect);
  const topPad = is916 ? 96 : is11 ? 38 : is34 ? 62 : 52;
  const bottomPad = slideNum === 1 ? (is916 ? 92 : is11 ? 26 : is34 ? 52 : 44) : is916 ? 64 : is11 ? 24 : is34 ? 46 : 40;
  const sidePad = 56;

  return (
    <div
      style={{
        width: 1080,
        height: h,
        position: "relative",
        fontFamily: SANS_STACK,
        color: "#181615",
        background: "#FAF7F2",
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <SlideBackdrop
        is916={is916}
        mapTransform={
          slideNum === 2
            ? is916
              ? "scale(1.36) translate(-1%, 2%)"
              : "scale(1.34) translate(-1%, 3%)"
            : undefined
        }
        scrimColor={slideNum === 2 ? "rgba(250, 247, 242, 0.16)" : "rgba(250, 247, 242, 0.22)"}
      />
      <EarlySnowfallOverlay is916={is916} />

      <div
        style={{
          width: 1080,
          height: h,
          position: "relative",
          zIndex: 10,
          padding: `${topPad}px ${sidePad}px ${bottomPad}px ${sidePad}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          boxSizing: "border-box",
        }}
      >
        {slideNum === 1 ? (
          <>
            <BareSlideHeader
              is916={is916}
              showDivider
              headline={
                <>
                  Snow is here
                  <br />
                  <span style={{ color: "#e84a27", fontFamily: SANS_STACK, fontWeight: 800 }}>
                    earlier than expected.
                  </span>
                </>
              }
            />

            {/* Middle Stage: Navy Sherpa Mascot (left) + Speech Bubble pointing to mouth (right) */}
            <div
              style={{
                position: "relative",
                zIndex: 24,
                width: "100%",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                gap: is916 ? 26 : 22,
                marginTop: is916 ? 12 : 4,
              }}
            >
              <div
                style={{
                  position: "relative",
                  flexShrink: 0,
                  marginLeft: is916 ? -18 : -10,
                  filter: "drop-shadow(0 24px 40px rgba(24, 22, 21, 0.22))",
                }}
              >
                <SmakrMascotRig
                  frameMode="bust-only"
                  bodyPose="jacket-2"
                  face="explaining"
                  head={OFFICIAL_SMAKR_MASCOT_CONFIG.peepsHead}
                  accessories="glasses-2"
                  facialHair="none"
                  skinColor={OFFICIAL_SMAKR_MASCOT_CONFIG.skinColor}
                  clothingColor="#1E2738"
                  innerClothingColor="#FAF7F2"
                  sherpaColor="#C8B79E"
                  jacketStyle="navy-sherpa"
                  hatColor={OFFICIAL_SMAKR_MASCOT_CONFIG.hatColor}
                  headContrastColor={OFFICIAL_SMAKR_MASCOT_CONFIG.hairColor}
                  size={is916 ? 470 : is11 ? 300 : 375}
                  stickerOutline
                />
              </div>

              <div
                style={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "flex-start",
                  marginLeft: is916 ? -54 : -44,
                  paddingTop: is916 ? 78 : is11 ? 32 : 54,
                }}
              >
                <SnowfallSpeechBubble is916={is916} />
              </div>
            </div>

            {/* Bottom warm-oat fade so titles & descriptions under the 3 bowls stay crisp */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: is916 ? 560 : is11 ? 330 : 410,
                background:
                  "linear-gradient(to top, rgba(250, 247, 242, 0.96) 0%, rgba(250, 247, 242, 0.80) 58%, rgba(250, 247, 242, 0) 100%)",
                zIndex: 18,
                pointerEvents: "none",
              }}
            />

            {/* 3 tilted dish photos in one bottom row with titles & descriptions underneath (no locations) */}
            <div
              style={{
                position: "relative",
                zIndex: 28,
                width: "100%",
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                alignItems: "start",
                gap: is916 ? 20 : 18,
                marginBottom: is916 ? 26 : is11 ? 6 : 14,
              }}
            >
              {EARLY_SNOW_SLIDE_1_BOWLS.map((bowl) => (
                <div
                  key={bowl.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: is916 ? 316 : is11 ? 186 : 248,
                      borderRadius: 22,
                      border: "4px solid #FFFFFF",
                      boxShadow: "0 20px 42px rgba(24, 22, 21, 0.22)",
                      transform: bowl.tilt,
                      overflow: "hidden",
                      background: "#FAF7F2",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={bowl.img}
                      alt={bowl.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        background: "#e84a27",
                        color: "#FFFFFF",
                        fontFamily: `${comico.style.fontFamily}, sans-serif`,
                        fontSize: 15,
                        fontWeight: 400,
                        letterSpacing: "0.03em",
                        padding: "4px 11px",
                        borderRadius: 999,
                        boxShadow: "0 6px 14px rgba(24, 22, 21, 0.26)",
                      }}
                    >
                      {bowl.price}
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: is916 ? 20 : 14,
                      fontFamily: SANS_STACK,
                      fontSize: is916 ? 24 : 20.5,
                      fontWeight: 800,
                      lineHeight: 1.15,
                      letterSpacing: "-0.02em",
                      color: "#181615",
                      textShadow: "0 1px 8px rgba(250, 247, 242, 0.96)",
                    }}
                  >
                    {bowl.title}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: is916 ? 16 : 14,
                      fontWeight: 600,
                      lineHeight: 1.32,
                      color: "#57534E",
                      maxWidth: 295,
                      textShadow: "0 1px 6px rgba(250, 247, 242, 0.96)",
                    }}
                  >
                    {bowl.description}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <BareSlideHeader
              is916={is916}
              showDivider
              headline={
                <>
                  3 noodle kitchens
                  <br />
                  <span style={{ color: "#e84a27", fontFamily: SANS_STACK, fontWeight: 800 }}>
                    worth bracing the cold for.
                  </span>
                </>
              }
            />

            <div
              style={{
                position: "relative",
                zIndex: 20,
                width: "100%",
                flex: 1,
                marginTop: is916 ? 12 : is11 ? 2 : 6,
                transform: is11 ? "scale(0.84)" : undefined,
                transformOrigin: "top center",
              }}
            >
              {/* Dashed route trail linking Hrimnir -> Sapporo -> Em Oi! icon centers 1:1 */}
              <svg
                aria-hidden="true"
                width={968}
                height={is916 ? 1280 : 880}
                viewBox={is916 ? "0 0 968 1280" : "0 0 968 880"}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  zIndex: 18,
                  pointerEvents: "none",
                }}
              >
                <path
                  d={
                    is916
                      ? "M 720 110 C 620 265, 340 275, 245 446 C 325 615, 580 640, 700 816"
                      : "M 720 76 C 620 175, 340 185, 245 284 C 325 395, 575 415, 690 534"
                  }
                  fill="none"
                  stroke="#e84a27"
                  strokeWidth="5"
                  strokeDasharray="12 12"
                  strokeLinecap="round"
                  opacity="0.76"
                />
              </svg>

              {EARLY_SNOW_SLIDE_2_SPOTS.map((spot) => (
                <React.Fragment key={spot.pinNum}>
                  <PerfectedMapPin
                    iconSrc={spot.pinIcon}
                    label={spot.pinLabel}
                    highlighted={spot.highlighted}
                    size={is916 ? 78 : 66}
                    style={is916 ? spot.pinPos916 : spot.pinPos45}
                  />
                  <SnowRevealFloatingCard spot={spot} is916={is916} />
                </React.Fragment>
              ))}

              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  bottom: is916 ? 42 : 16,
                  zIndex: 30,
                }}
              >
                <FrostedLiveCtaCard bare subtitle="" />
              </div>
            </div>

            {/* Bottom warm-oat fade matching Slide 1 */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: is916 ? 340 : is11 ? 185 : 240,
                background:
                  "linear-gradient(to top, rgba(250, 247, 242, 0.96) 0%, rgba(250, 247, 242, 0.80) 58%, rgba(250, 247, 242, 0) 100%)",
                zIndex: 18,
                pointerEvents: "none",
              }}
            />

            <MinimalStoryFooter totalDots={2} activeIndex={2} />
          </>
        )}
      </div>
    </div>
  );
}

function UWanSamPeekingEyes({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.85)} viewBox="0 0 88 74" fill="none" aria-hidden="true">
      {/* Left eyebrow + eye */}
      <path d="M 10 14 Q 24 6, 38 14" stroke="#42170D" strokeWidth="4.2" strokeLinecap="round" />
      <ellipse cx="24" cy="34" rx="15" ry="16" fill="#FFFFFF" stroke="#42170D" strokeWidth="4.2" />
      <path d="M 9 30 Q 24 27, 39 30" stroke="#42170D" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="29" cy="38" r="7.5" fill="#42170D" />
      {/* Right eyebrow + eye */}
      <path d="M 50 14 Q 64 6, 78 14" stroke="#42170D" strokeWidth="4.2" strokeLinecap="round" />
      <ellipse cx="64" cy="34" rx="15" ry="16" fill="#FFFFFF" stroke="#42170D" strokeWidth="4.2" />
      <path d="M 49 30 Q 64 27, 79 30" stroke="#42170D" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="59" cy="38" r="7.5" fill="#42170D" />
      {/* Tiny nose + smirk */}
      <ellipse cx="44" cy="52" rx="5.5" ry="4" fill="#FFFFFF" stroke="#42170D" strokeWidth="3.4" />
      <path d="M 24 63 Q 44 70, 62 61" stroke="#42170D" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function PopupCardFooterBar({ label }: { label: string }) {
  return (
    <div
      style={{
        height: 46,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 14px",
        marginTop: 6,
      }}
    >
      <span
        style={{
          fontFamily: `${comico.style.fontFamily}, sans-serif`,
          fontSize: 21,
          fontWeight: 400,
          color: "#FAF7F2",
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function PopupRadarSlideCanvas({
  slideNum,
  aspect,
}: {
  slideNum: 1 | 2 | 3 | 4;
  aspect: StoryAspectId;
}) {
  const is916 = aspect === "9:16";
  const is34 = aspect === "3:4";
  const is11 = aspect === "1:1";
  const h = getStoryNativeHeight(aspect);
  const sidePad = 52;

  if (slideNum === 1) {
    const topPad = is916 ? 84 : is11 ? 34 : is34 ? 62 : 50;
    const bottomPad = is916 ? 56 : is11 ? 24 : is34 ? 44 : 38;
    const fanScale = is916 ? 1.02 : is11 ? 0.78 : is34 ? 0.96 : 0.94;

    return (
      <div
        style={{
          width: 1080,
          height: h,
          position: "relative",
          fontFamily: SANS_STACK,
          color: "#181615",
          background: "#FAF7F2",
          overflow: "hidden",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <SlideBackdrop is916={is916} scrimColor="rgba(250, 247, 242, 0.22)" topFade bottomFade />

        {/* Bottom warm-oat fade so staircase cards & footer stay crisp */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: is916 ? 340 : is11 ? 210 : 260,
            background:
              "linear-gradient(to top, rgba(250, 247, 242, 0.96) 0%, rgba(250, 247, 242, 0.80) 58%, rgba(250, 247, 242, 0) 100%)",
            zIndex: 6,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            width: 1080,
            height: h,
            position: "relative",
            zIndex: 10,
            padding: `${topPad}px ${sidePad}px ${bottomPad}px ${sidePad}px`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          {/* Top Brand + Headline + Mascot Row */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span
                style={{
                  fontFamily: `${comico.style.fontFamily}, sans-serif`,
                  fontSize: is916 ? 78 : is11 ? 56 : 68,
                  color: "#e84a27",
                  letterSpacing: "0.06em",
                  lineHeight: 1,
                }}
              >
                SMAKR
              </span>
              <div
                aria-hidden="true"
                style={{
                  width: 112,
                  height: 3.5,
                  borderRadius: 999,
                  background: "rgba(232, 74, 39, 0.56)",
                  marginTop: is916 ? 14 : 10,
                }}
              />
            </div>

            <div
              style={{
                width: "100%",
                maxWidth: 920,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: is916 ? 22 : 18,
                marginTop: is916 ? 24 : is11 ? 8 : 16,
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  filter: "drop-shadow(0 18px 34px rgba(24, 22, 21, 0.22))",
                }}
              >
                <SmakrMascotRig
                  frameMode="bust-only"
                  bodyPose="jacket-2"
                  face={OFFICIAL_SMAKR_MASCOT_CONFIG.peepsFace}
                  head={OFFICIAL_SMAKR_MASCOT_CONFIG.peepsHead}
                  accessories="glasses-2"
                  facialHair="none"
                  skinColor={OFFICIAL_SMAKR_MASCOT_CONFIG.skinColor}
                  clothingColor="#1E2738"
                  innerClothingColor="#FAF7F2"
                  sherpaColor="#C8B79E"
                  jacketStyle="navy-sherpa"
                  hatColor={OFFICIAL_SMAKR_MASCOT_CONFIG.hatColor}
                  headContrastColor={OFFICIAL_SMAKR_MASCOT_CONFIG.hairColor}
                  size={is916 ? 345 : is11 ? 240 : 300}
                  stickerOutline
                />
              </div>

              <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: SANS_STACK,
                    fontSize: is916 ? 54 : is11 ? 38 : 45,
                    fontWeight: 900,
                    lineHeight: 1.05,
                    letterSpacing: "-0.03em",
                    color: "#181615",
                  }}
                >
                  Oslo&apos;s pop-up scene
                  <br />
                  <span style={{ color: "#e84a27" }}>is moving fast.</span>
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    background: "#FDECE7",
                    color: "#181615",
                    borderRadius: 999,
                    padding: is916 ? "10px 20px" : "7px 15px",
                    fontSize: is916 ? 19.5 : is11 ? 15 : 17.5,
                    fontWeight: 900,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginTop: is916 ? 16 : 10,
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  + HERE FOR THE WEEKEND · GONE BY MONDAY
                </div>
              </div>
            </div>
          </div>

          {/* Center-Lower Stage: 3 Tilted Burnt-Paprika Food Polaroids in a Left-to-Right Staircase */}
          <div
            style={{
              position: "relative",
              width: 976,
              height: is916 ? 560 : 490,
              marginTop: is916 ? 12 : 4,
              transform: `scale(${fanScale})`,
              transformOrigin: "center center",
            }}
          >
            {/* Ghost Step 0 (Top-Left, dimmed continuation with blurred placeholder content) */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: -255,
                top: -64,
                width: 342,
                background: "#C87D6A",
                borderRadius: 30,
                padding: 14,
                boxShadow: "0 18px 40px rgba(24, 22, 21, 0.14)",
                transform: "rotate(-8deg)",
                opacity: 0.68,
                zIndex: 4,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  height: 296,
                  borderRadius: 22,
                  overflow: "hidden",
                  background: "#EDE6DA",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/ad-slides/u_wan_sum_egg_coffee.webp"
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "blur(8px) saturate(0.55)",
                    opacity: 0.48,
                    transform: "scale(1.1)",
                  }}
                />
              </div>
              <div
                style={{
                  height: 46,
                  marginTop: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: SANS_STACK,
                    fontSize: 21,
                    fontWeight: 900,
                    color: "#FAF7F2",
                    filter: "blur(3.5px)",
                    opacity: 0.55,
                    letterSpacing: "0.04em",
                  }}
                >
                  OSLO POP-UP
                </span>
              </div>
            </div>

            {/* Step 1 (Left, highest): U WAN' SAM? (Cream #F5EFE0 + Maroon #42170D) */}
            <div
              style={{
                position: "absolute",
                left: 14,
                top: 0,
                width: 342,
                background: "#F5EFE0",
                borderRadius: 30,
                padding: 14,
                boxShadow: "0 24px 48px rgba(24, 22, 21, 0.22)",
                transform: "rotate(-6deg)",
                zIndex: 10,
              }}
            >
              <div
                style={{
                  height: 296,
                  borderRadius: 22,
                  overflow: "hidden",
                  background: "#FAF7F2",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/ad-slides/u_wan_sum_egg_coffee.webp"
                  alt="U Wan Sam Egg Coffee"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
              <div
                style={{
                  height: 46,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  marginTop: 6,
                }}
              >
                <UWanSamPeekingEyes size={30} />
                <span
                  style={{
                    fontFamily: SANS_STACK,
                    fontSize: 22,
                    fontWeight: 900,
                    color: "#42170D",
                    letterSpacing: "-0.02em",
                  }}
                >
                  U WAN&apos; SAM?
                </span>
              </div>
            </div>

            {/* Step 2 (Center, middle): MINT ON WHEELS (Forest Matcha #3B6E52 + Sage Mint #D6E6C8) */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 64,
                width: 348,
                background: "#3B6E52",
                borderRadius: 30,
                padding: 14,
                boxShadow: "0 28px 56px rgba(24, 22, 21, 0.26)",
                transform: "translateX(-50%) rotate(2.5deg)",
                zIndex: 18,
              }}
            >
              <div
                style={{
                  height: 302,
                  borderRadius: 22,
                  overflow: "hidden",
                  background: "#FAF7F2",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/uploads/seeds/mint-on-wheels_mint-on-wheels-dish-1_1794239080384_7a5025e0.webp"
                  alt="Mint on Wheels Double Biscoff Matcha"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
              <div
                style={{
                  height: 46,
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 6,
                }}
              >
                <span
                  style={{
                    fontFamily: SANS_STACK,
                    fontSize: 26,
                    fontWeight: 900,
                    fontStyle: "italic",
                    color: "#D6E6C8",
                    letterSpacing: "-0.03em",
                  }}
                >
                  mint.
                </span>
                <span
                  style={{
                    fontFamily: SANS_STACK,
                    fontSize: 11.5,
                    fontWeight: 800,
                    color: "rgba(214, 230, 200, 0.88)",
                    letterSpacing: "0.08em",
                  }}
                >
                  ON WHEELS
                </span>
              </div>
            </div>

            {/* Step 3 (Right, lowest): CRANTZ COOKIES (Royal Cobalt #1E2B7B + Blush Pink #F9B4CE) */}
            <div
              style={{
                position: "absolute",
                right: 14,
                top: 128,
                width: 342,
                background: "#1E2B7B",
                borderRadius: 30,
                padding: 14,
                boxShadow: "0 32px 64px rgba(24, 22, 21, 0.30)",
                transform: "rotate(-5deg)",
                zIndex: 25,
              }}
            >
              <div
                style={{
                  height: 296,
                  borderRadius: 22,
                  overflow: "hidden",
                  background: "#FAF7F2",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/ad-slides/crantz_cookies_popup.webp"
                  alt="Crantz Cookies molten chocolate"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
              <div
                style={{
                  height: 46,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 6,
                }}
              >
                <span
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: 25,
                    fontWeight: 700,
                    fontStyle: "italic",
                    color: "#F9B4CE",
                    letterSpacing: "0.01em",
                  }}
                >
                  Crantz Cookies
                </span>
              </div>
            </div>

            {/* Ghost Step 4 (Bottom-Right, dimmed continuation with blurred placeholder content) */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                right: -255,
                top: 192,
                width: 342,
                background: "#7B5A65",
                borderRadius: 30,
                padding: 14,
                boxShadow: "0 18px 40px rgba(24, 22, 21, 0.14)",
                transform: "rotate(-3deg)",
                opacity: 0.68,
                zIndex: 4,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  height: 296,
                  borderRadius: 22,
                  overflow: "hidden",
                  background: "#EDE6DA",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/ad-slides/crantz_cookies_popup.webp"
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "blur(8px) saturate(0.55)",
                    opacity: 0.48,
                    transform: "scale(1.1)",
                  }}
                />
              </div>
              <div
                style={{
                  height: 46,
                  marginTop: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: SANS_STACK,
                    fontSize: 21,
                    fontWeight: 900,
                    color: "#FAF7F2",
                    filter: "blur(3.5px)",
                    opacity: 0.55,
                    letterSpacing: "0.04em",
                  }}
                >
                  NEXT DROP
                </span>
              </div>
            </div>
          </div>

          {/* Description text under the cards, aligned left */}
          <div
            style={{
              width: "100%",
              textAlign: "left",
              paddingLeft: 14,
              marginTop: is916 ? 24 : is11 ? 12 : 18,
            }}
          >
            <div
              style={{
                fontSize: is916 ? 29 : is11 ? 21 : 25,
                fontWeight: 700,
                lineHeight: 1.32,
                color: "#3F3A36",
                maxWidth: 820,
              }}
            >
              Phin-dripped egg coffee, Kyoto matcha on wheels, and molten NYC cookies. Here is where they drop next.
            </div>
          </div>

          {/* Minimal Orange-on-Cream Footer */}
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "inline-flex", alignItems: "center", gap: is916 ? 10 : 8 }}>
              {[1, 2, 3, 4].map((dot) => (
                <span
                  key={dot}
                  style={{
                    width: dot === 1 ? (is916 ? 32 : 24) : (is916 ? 9 : 7),
                    height: is916 ? 8 : 6,
                    borderRadius: 999,
                    background: dot === 1 ? "#e84a27" : "rgba(232, 74, 39, 0.28)",
                  }}
                />
              ))}
            </div>
            <div
              style={{
                color: "#e84a27",
                fontSize: is916 ? 22 : 18,
                fontWeight: 900,
                letterSpacing: "0.02em",
              }}
            >
              01 / 04 · Next: U WAN&apos; SAM? →
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SLIDES 2, 3, 4: Dedicated Pop-Up Spotlights (U WAN' SAM?, Mint on Wheels, Crantz Cookies)
  const topPad = is916 ? 76 : is11 ? 30 : is34 ? 54 : 44;
  const bottomPad = is916 ? 54 : is11 ? 24 : is34 ? 42 : 36;
  const cardH = is916 ? 880 : is11 ? 460 : is34 ? 690 : 640;

  const isMirrored = slideNum === 3;
  const spotlightCfg =
    slideNum === 3
      ? {
          bg: "#F7F4EB",
          primary: "#2D5A3C",
          accent: "#A82035",
          secondaryAccent: "#A82035",
          topWarmth: "rgba(46, 90, 59, 0.12)",
          spotlight916:
            "radial-gradient(ellipse 32% 16% at 26% 51%, rgba(247, 244, 235, 0) 0%, rgba(247, 244, 235, 0.78) 58%, rgba(247, 244, 235, 0.98) 100%)",
          spotlight45:
            "radial-gradient(ellipse 34% 20% at 26% 50%, rgba(247, 244, 235, 0) 0%, rgba(247, 244, 235, 0.78) 58%, rgba(247, 244, 235, 0.98) 100%)",
          mapTransform: is916 ? "scale(1.45) translate(-26%, -10%)" : "scale(1.40) translate(-26%, -10%)",
          storyText:
            "OSLO'S ROAMING CEREMONIAL UJI MATCHA BAR WHISKING SMALL-BATCH KYOTO TEA ON WHEELS. AFTER SUMMER DROPS AT LØREN TORG, THEIR '26 FALL EDITION MENU BRINGS BISCOFF BUTTER, CREMÈ BRÛLEE, AND COOKIES & CREAM MATCHA STRAIGHT TO OSLOBUKTA.",
          nextDropText: "🎟️ RECENT DROP: MIKE'S CORNER · NEXT TBA",
          addressText: "Operagata 77d · Oslobukta",
          facts: ["UJI CEREMONIAL", "DOUBLE BISCOFF", "MATCHA CART", "@MINTONWHEEELS"],
          heroSrc: "/ad-slides/mint_cups_outdoor.jpg",
          heroAlt: "Mint on Wheels Outdoor 4-Cup Matcha Pours",
          bottomPhotos: [
            {
              src: "/ad-slides/mint_double_biscoff.webp",
              alt: "Mint on Wheels Double Biscoff Matcha Cup",
            },
            { src: "/ad-slides/mint_photo_2.webp", alt: "Mint on Wheels 4-Cup Iced Matcha Lineup" },
            { src: "/ad-slides/mint_photo_3.webp", alt: "Mint on Wheels Ceremonial Whisk" },
          ] as Array<{ src: string; alt: string; style?: React.CSSProperties }>,
          nextLabel: "03 / 04 · Next: Crantz Cookies →",
        }
      : slideNum === 4
        ? {
            bg: "#F3F7FC",
            primary: "#1E2B7B",
            accent: "#F45D8E",
            secondaryAccent: "#F45D8E",
            topWarmth: "rgba(30, 43, 123, 0.12)",
            spotlight916:
              "radial-gradient(ellipse 32% 16% at 74% 51%, rgba(243, 247, 252, 0) 0%, rgba(243, 247, 252, 0.78) 58%, rgba(243, 247, 252, 0.98) 100%)",
            spotlight45:
              "radial-gradient(ellipse 34% 20% at 74% 50%, rgba(243, 247, 252, 0) 0%, rgba(243, 247, 252, 0.78) 58%, rgba(243, 247, 252, 0.98) 100%)",
            mapTransform: is916 ? "scale(1.42) translate(6%, -8%)" : "scale(1.38) translate(6%, -8%)",
            storyText:
              "STARTED IN OSLO BY SISTERS FELICIA AND ADELE AFTER TESTING 100+ DOUGH RECIPES INSPIRED BY LONDON'S ICONIC BAKERIES. FAMOUS FOR CHUNKY NYC-STYLE COOKIES STUFFED WITH MOLTEN BISCOFF ('THE GOLDEN ONE'), KINDER DREAM, AND FLAKY SEA SALT DARK CHOCOLATE.",
            nextDropText: "🎟️ NEXT OSLO DROP LOADING",
            addressText: "Dronning Eufemias gate 22 · Bjørvika",
            facts: ["NYC THICK-BAKED", "MOLTEN CENTERS", "WEEKEND DROPS", "@CRANTZCOOKIES"],
            heroSrc: "/ad-slides/crantz_cookies_popup.webp",
            heroAlt: "Crantz Cookies molten chocolate",
            bottomPhotos: [
              { src: "/ad-slides/crantz_photo_2.webp", alt: "Crantz Cookies Molten Center" },
              { src: "/ad-slides/crantz_photo_3.webp", alt: "Crantz Cookies Tray Stack" },
              { src: "/images/popups/crantz-cookie-3.jpg", alt: "Crantz Cookies Biscoff The Golden One" },
            ] as Array<{ src: string; alt: string; style?: React.CSSProperties }>,
            nextLabel: "04 / 04 · Track Pop-Ups on smakr.no ↗",
          }
        : {
            bg: "#F5EFE0",
            primary: "#42170D",
            accent: "#1D4ED8",
            secondaryAccent: "#1D4ED8",
            topWarmth: "rgba(66, 23, 13, 0.14)",
            spotlight916:
              "radial-gradient(ellipse 30% 9% at 74% 46.5%, rgba(245, 239, 224, 0.96) 0%, rgba(245, 239, 224, 0.78) 52%, rgba(245, 239, 224, 0) 100%), radial-gradient(ellipse 30% 12% at 74% 55.5%, rgba(245, 239, 224, 0) 0%, rgba(245, 239, 224, 0.78) 58%, rgba(245, 239, 224, 0.98) 100%)",
            spotlight45:
              "radial-gradient(ellipse 32% 11% at 74% 46%, rgba(245, 239, 224, 0.96) 0%, rgba(245, 239, 224, 0.78) 52%, rgba(245, 239, 224, 0) 100%), radial-gradient(ellipse 32% 15% at 74% 54.5%, rgba(245, 239, 224, 0) 0%, rgba(245, 239, 224, 0.78) 58%, rgba(245, 239, 224, 0.98) 100%)",
            mapTransform: is916 ? "scale(1.42) translate(14%, 2%)" : "scale(1.38) translate(14%, 2%)",
            storyText:
              "Born after a trip to Vietnam and rooted in Cairo hospitality, founder Amira Nasr El Din built U WAN' SAM? around one simple question: “You want some?” Expect slow-dripped Vietnamese Robusta phin coffee, creamy egg & coconut foam cups, and iced hibiscus at their roaming Oslo pop-ups.",
            nextDropText: "🎟️ NEXT OSLO DROP · SUN NOV 22",
            addressText: "Kristian Augusts gate 21 · Tullinløkka",
            facts: ["Slow-Drip Phin", "Vietnam × Cairo", "Roaming Pop-Up", "@uwansamofficial"],
            heroSrc: "/ad-slides/u_wan_sum_ricefield.jpg",
            heroAlt: "U Wan Sam Vietnamese iced coffee",
            bottomPhotos: [
              { src: "/ad-slides/u_wan_sum_egg_coffee.webp", alt: "U Wan Sam Egg Coffee" },
              { src: "/ad-slides/u_wan_sum_popup.webp", alt: "U Wan Sam Pop-Up Service" },
              { src: "/ad-slides/u_wan_sum_photo_1.webp", alt: "U Wan Sam Vietnamese Iced Coffee" },
            ],
            nextLabel: "02 / 04 · Next: Mint on Wheels →",
          };

  const heroPhotoBlock = (
    <div
      style={{
        position: "relative",
        height: cardH,
        borderRadius: 28,
        overflow: "hidden",
        boxShadow: "0 22px 48px rgba(24, 22, 21, 0.16)",
        background: spotlightCfg.primary,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={spotlightCfg.heroSrc}
        alt={spotlightCfg.heroAlt}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );

  const storyAndPinBlock = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: cardH,
        padding: is916 ? "0 8px" : "0 4px",
        boxSizing: "border-box",
      }}
    >
      <div>
        <div
          style={{
            fontFamily: `${anton.style.fontFamily}, Impact, "Arial Black", sans-serif`,
            fontSize: is916 ? 56 : is11 ? 38 : 46,
            fontWeight: 400,
            letterSpacing: "0.03em",
            color: spotlightCfg.accent,
            textTransform: "uppercase",
            lineHeight: 0.95,
          }}
        >
          STORY
        </div>

        <div
          style={{
            marginTop: is916 ? 24 : 14,
            fontFamily: `${comico.style.fontFamily}, sans-serif`,
            fontSize: is916 ? 26 : is11 ? 17 : 21,
            lineHeight: 1.38,
            color: spotlightCfg.primary,
            letterSpacing: "0.01em",
          }}
        >
          {spotlightCfg.storyText}
        </div>

        <div
          style={{
            marginTop: is916 ? 22 : 12,
            fontFamily: `${anton.style.fontFamily}, Impact, "Arial Narrow", sans-serif`,
            fontSize: is916 ? 28 : is11 ? 20 : 24,
            fontWeight: 400,
            letterSpacing: "0.04em",
            color: spotlightCfg.accent,
            textTransform: "uppercase",
          }}
        >
          {spotlightCfg.nextDropText}
        </div>
      </div>

      {/* Exposed Map Pin centered in the spotlight */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          marginTop: is916 ? 14 : 6,
        }}
      >
        {/* Paper Pushpin SVG */}
        <svg
          width={is916 ? 46 : 36}
          height={is916 ? 54 : 42}
          viewBox="0 0 64 76"
          fill="none"
          style={{
            marginBottom: is916 ? -14 : -10,
            zIndex: 2,
            filter: "drop-shadow(0 6px 10px rgba(24, 22, 21, 0.28))",
          }}
        >
          <path d="M28 36 L22 70 C21.6 72.5 24.8 73.2 25.8 70.8 L35 37 Z" fill="#C4C4C4" />
          <circle cx="34" cy="21" r="18" fill="#EF3E36" />
          <ellipse
            cx="26"
            cy="14"
            rx="4.8"
            ry="2.8"
            transform="rotate(-32 26 14)"
            fill="rgba(255, 255, 255, 0.55)"
          />
        </svg>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "inline-flex",
            alignItems: "center",
            background: spotlightCfg.bg,
            border: `1.5px solid ${spotlightCfg.accent}`,
            borderRadius: 999,
            padding: is916 ? "10px 22px" : "7px 15px",
            boxShadow: "0 12px 28px rgba(24, 22, 21, 0.20)",
          }}
        >
          <span
            style={{
              fontFamily: SANS_STACK,
              fontSize: is916 ? 17.5 : 13.5,
              fontWeight: 800,
              color: spotlightCfg.primary,
              letterSpacing: "0.01em",
              whiteSpace: "nowrap",
            }}
          >
            {spotlightCfg.addressText}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div
      style={{
        width: 1080,
        height: h,
        position: "relative",
        fontFamily: SANS_STACK,
        color: spotlightCfg.primary,
        background: spotlightCfg.bg,
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* Full-canvas Oslo Map with radial cream spotlight */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={is916 ? "/ad-slides/pure_oslo_map_9_16.png" : "/ad-slides/pure_oslo_map_4_5.png"}
          alt="Oslo pop-up map"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: spotlightCfg.mapTransform,
            transformOrigin: "center center",
            filter: "saturate(0.98) contrast(1.04)",
            display: "block",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: is916 ? spotlightCfg.spotlight916 : spotlightCfg.spotlight45,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, ${spotlightCfg.topWarmth} 0%, rgba(255, 255, 255, 0) 24%)`,
          }}
        />
      </div>

      <div
        style={{
          width: 1080,
          height: h,
          position: "relative",
          zIndex: 10,
          padding: `${topPad}px ${sidePad}px ${bottomPad}px ${sidePad}px`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: is916 ? 26 : is11 ? 14 : 20,
          boxSizing: "border-box",
        }}
      >
        {/* Top Smakr Header (Consistent on Slides 2, 3, 4) */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", width: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span
              style={{
                fontFamily: `${comico.style.fontFamily}, sans-serif`,
                fontSize: is916 ? 56 : is11 ? 40 : 48,
                color: "#e84a27",
                letterSpacing: "0.06em",
                lineHeight: 1,
                textShadow: "none",
                filter: "none",
              }}
            >
              SMAKR
            </span>
            <div
              aria-hidden="true"
              style={{
                width: 112,
                height: 3.5,
                borderRadius: 999,
                background: "rgba(232, 74, 39, 0.56)",
                marginTop: is916 ? 14 : 10,
              }}
            />
          </div>
        </div>

        {/* Freestanding Brand Logo */}
        {slideNum === 3 ? (
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: is916 ? 18 : 12,
              paddingTop: is916 ? 36 : is11 ? 14 : 22,
              paddingBottom: is916 ? 16 : 8,
            }}
          >
            <span
              style={{
                fontFamily: SANS_STACK,
                fontSize: is916 ? 96 : is11 ? 64 : 80,
                fontWeight: 900,
                fontStyle: "italic",
                color: "#2E5A3B",
                letterSpacing: "-0.04em",
                lineHeight: 0.95,
              }}
            >
              mint.
            </span>
            <span
              style={{
                fontFamily: SANS_STACK,
                fontSize: is916 ? 34 : is11 ? 22 : 28,
                fontWeight: 900,
                color: "#2E5A3B",
                letterSpacing: "0.10em",
              }}
            >
              ON WHEELS
            </span>
          </div>
        ) : slideNum === 4 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: is916 ? 18 : 12,
              paddingTop: is916 ? 36 : is11 ? 14 : 22,
              paddingBottom: is916 ? 16 : 8,
            }}
          >
            <span
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: is916 ? 88 : is11 ? 58 : 74,
                fontWeight: 700,
                fontStyle: "italic",
                color: "#1E2B7B",
                letterSpacing: "-0.01em",
                lineHeight: 1,
                textShadow: "0 4px 0 #FFA6C4",
              }}
            >
              Crantz Cookies
            </span>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: is916 ? 28 : 20,
              paddingTop: is916 ? 36 : is11 ? 14 : 22,
              paddingBottom: is916 ? 16 : 8,
            }}
          >
            <UWanSamPeekingEyes size={is916 ? 116 : is11 ? 76 : 94} />
            <div
              style={{
                fontFamily: SANS_STACK,
                fontSize: is916 ? 88 : is11 ? 58 : 72,
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: "#42170D",
                lineHeight: 1,
              }}
            >
              U WAN&apos; SAM?
            </div>
          </div>
        )}

        {/* Main Stage: Mirrored on Slide 3 for subtle visual variety */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMirrored
              ? is916
                ? "1fr 1.05fr"
                : "1fr 1fr"
              : is916
                ? "1.05fr 1fr"
                : "1fr 1fr",
            gap: is916 ? 34 : 22,
            alignItems: "start",
            marginTop: is916 ? 18 : 8,
          }}
        >
          {isMirrored ? (
            <>
              {storyAndPinBlock}
              {heroPhotoBlock}
            </>
          ) : (
            <>
              {heroPhotoBlock}
              {storyAndPinBlock}
            </>
          )}
        </div>

        {/* Floating Quick Facts Values (alternating accent & primary) */}
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: is916 ? "0 8px" : "0 4px",
            marginTop: is916 ? 10 : 4,
            marginBottom: is916 ? 6 : 2,
          }}
        >
          {spotlightCfg.facts.map((val, idx) => (
            <div key={val} style={{ display: "inline-flex", alignItems: "center", gap: 14 }}>
              <span
                style={{
                  fontFamily: `${anton.style.fontFamily}, Impact, "Arial Narrow", sans-serif`,
                  fontSize: is916 ? 25 : is11 ? 18 : 21,
                  fontWeight: 400,
                  letterSpacing: "0.04em",
                  color: idx % 2 === 0 ? spotlightCfg.accent : spotlightCfg.primary,
                  textTransform: "uppercase",
                }}
              >
                {val}
              </span>
              {idx < 3 && (
                <span style={{ color: spotlightCfg.secondaryAccent, fontSize: is916 ? 20 : 15, fontWeight: 900 }}>
                  •
                </span>
              )}
            </div>
          ))}
        </div>

        {/* 3 Authentic Pop-Up Photos in one proportionate portrait row at the bottom */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: is916 ? 18 : 12,
            marginTop: is916 ? 6 : 2,
            marginBottom: is916 ? 10 : 4,
          }}
        >
          {spotlightCfg.bottomPhotos.map((item, idx) => (
            <div
              key={item.src || `thumb-${idx}`}
              style={{
                height: is916 ? 310 : is11 ? 165 : 225,
                borderRadius: 22,
                overflow: "hidden",
                boxShadow: "0 12px 28px rgba(24, 22, 21, 0.14)",
                background: spotlightCfg.primary,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={item.alt}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  ...item.style,
                }}
              />
            </div>
          ))}
        </div>

        {/* Bottom Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: is916 ? 10 : 8 }}>
            {[1, 2, 3, 4].map((dot) => (
              <span
                key={dot}
                style={{
                  width: dot === slideNum ? (is916 ? 32 : 24) : (is916 ? 9 : 7),
                  height: is916 ? 8 : 6,
                  borderRadius: 999,
                  background: dot === slideNum ? "#e84a27" : "rgba(232, 74, 39, 0.28)",
                }}
              />
            ))}
          </div>

          <div
            style={{
              color: "#e84a27",
              fontSize: is916 ? 22 : 18,
              fontWeight: 900,
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            {slideNum === 4
              ? "Check out more on smakr.no ↗"
              : slideNum === 2
                ? "02 / 04 · Next: Mint on Wheels →"
                : "03 / 04 · Next: Crantz Cookies →"}
          </div>
        </div>
      </div>
    </div>
  );
}

function StorySlideCanvas({
  slideNum,
  aspect,
}: {
  slideNum: 1 | 2 | 3 | 4 | 5;
  aspect: StoryAspectId;
}) {
  const is916 = aspect === "9:16";
  const is34 = aspect === "3:4";
  const is11 = aspect === "1:1";
  const h = getStoryNativeHeight(aspect);
  const topPad = is916 ? 94 : is11 ? 36 : is34 ? 60 : 50;
  const bottomPad = is916 ? 64 : is11 ? 24 : is34 ? 46 : 40;
  const sidePad = 56;

  return (
    <div
      style={{
        width: 1080,
        height: h,
        position: "relative",
        fontFamily: SANS_STACK,
        color: "#181615",
        background: "#FAF7F2",
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <SlideBackdrop
        is916={is916}
        mapTransform={
          slideNum === 3
            ? "scale(1.06) translate(0%, 2%)"
            : slideNum === 4
              ? "scale(1.12) translate(-6%, 2%)"
              : undefined
        }
        scrimColor="rgba(250, 247, 242, 0.10)"
      />

      {/* Slide 1 full-canvas Oslo pins */}
      {slideNum === 1 &&
        SLIDE_1_MAP_PINS.map((pin) => (
          <PerfectedMapPin
            key={pin.id}
            iconSrc={pin.iconSrc}
            label={pin.label}
            highlighted={pin.highlighted}
            style={is916 ? pin.pos916 : pin.pos45}
          />
        ))}

      {/* Slide 2 corner tilted dark-footer dish cards */}
      {slideNum === 2 &&
        SLIDE_2_DISH_CARDS.map((card, idx) => (
          <DarkFooterDishCard key={idx} card={card} is916={is916} />
        ))}

      {/* Slide 5 scattered top Oslo pins */}
      {slideNum === 5 &&
        SLIDE_5_TOP_PINS.map((pin) => (
          <PerfectedMapPin
            key={pin.id}
            iconSrc={pin.iconSrc}
            label={pin.label}
            highlighted={pin.highlighted}
            size={pin.label ? (pin.highlighted ? 58 : 44) : 34}
            style={is916 ? pin.pos916 : pin.pos45}
          />
        ))}

      <div
        style={{
          width: 1080,
          height: h,
          position: "relative",
          zIndex: 10,
          padding: `${topPad}px ${sidePad}px ${bottomPad}px ${sidePad}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          boxSizing: "border-box",
        }}
      >
        {/* SLIDE 1: HOOK — SHRUGGING MASCOT IN OSLO */}
        {slideNum === 1 && (
          <>
            <BareSlideHeader
              is916={is916}
              showDivider
              headline={
                <>
                  What’s actually worth
                  <br />
                  <span style={{ color: "#e84a27" }}>eating in Oslo</span> right now?
                </>
              }
              subheadline="Skip the tourist traps. Follow live dish drops and verified local spots."
            />

            <div
              style={{
                position: "relative",
                zIndex: 25,
                width: "100%",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                paddingBottom: is916 ? 68 : 28,
              }}
            >
              {/* Warm elliptical radar glow underneath shrugging mascot */}
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    bottom: 8,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: is916 ? 560 : 510,
                    height: 82,
                    borderRadius: "50%",
                    background:
                      "radial-gradient(ellipse, rgba(232, 74, 39, 0.16) 0%, rgba(232, 74, 39, 0.04) 68%, transparent 82%)",
                    border: "1.5px solid rgba(232, 74, 39, 0.24)",
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "relative",
                    zIndex: 24,
                    filter: "drop-shadow(0 24px 40px rgba(24, 22, 21, 0.20))",
                  }}
                >
                  <SmakrMascotRig
                    frameMode="bust-only"
                    bodyPose="shrug"
                    face="calm"
                    head={OFFICIAL_SMAKR_MASCOT_CONFIG.peepsHead}
                    accessories="glasses-2"
                    facialHair="none"
                    skinColor={OFFICIAL_SMAKR_MASCOT_CONFIG.skinColor}
                    clothingColor="#e84a27"
                    innerClothingColor="#FAF7F2"
                    hatColor={OFFICIAL_SMAKR_MASCOT_CONFIG.hatColor}
                    headContrastColor={OFFICIAL_SMAKR_MASCOT_CONFIG.hairColor}
                    size={is916 ? 510 : 438}
                    stickerOutline
                  />
                </div>
              </div>

              <div style={{ marginTop: is916 ? 96 : 64, position: "relative", zIndex: 28 }}>
                <SignatureFoodiesScribble width={is916 ? 480 : 445} />
              </div>
            </div>

            <MinimalStoryFooter
              totalDots={5}
              activeIndex={1}
              rightPrompt="Swipe to explore the feed →"
            />
          </>
        )}

        {/* SLIDE 2: DISCOVER LOCALLY */}
        {slideNum === 2 && (
          <>
            <BareSlideHeader
              is916={is916}
              showDivider
              headline={
                <>
                  Discover <span style={{ color: "#e84a27" }}>Locally.</span>
                </>
              }
              subheadline="Real dish prices, verified spot ratings, and honest diner notes."
            />

            <div
              style={{
                position: "relative",
                zIndex: 30,
                width: "100%",
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DarkTitaniumIPhone
                screenImgUrl="/ad-slides/real_screen_no_pizza_feed_75.png"
                widthPx={is916 ? 415 : 352}
              />
            </div>

            <MinimalStoryFooter
              totalDots={5}
              activeIndex={2}
              rightPrompt="Tap any dish to locate on radar →"
            />
          </>
        )}

        {/* SLIDE 3: 1-TAP FEED TO MAP (DUAL PHONE + CURVED DASHED ARROW) */}
        {slideNum === 3 && (
          <>
            <BareSlideHeader
              is916={is916}
              showDivider
              headline={
                <>
                  Craving something
                  <br />
                  <span style={{ color: "#e84a27" }}>in the feed?</span>
                </>
              }
              subheadline="Find it on the map in one tap."
            />

            {(() => {
              const phoneW = is916 ? 388 : 356;
              const phoneH = Math.round((860 * phoneW) / 398);
              const gap = 48;
              const startX = (968 - (phoneW * 2 + gap)) / 2;
              const dotX = Math.round(startX + phoneW * 0.78);
              const dotY = Math.round(phoneH * 0.52);
              const targetX = Math.round(startX + phoneW + gap + phoneW * 0.13);
              const targetY = Math.round(phoneH * 0.49);

              return (
                <div
                  style={{
                    position: "relative",
                    zIndex: 25,
                    width: "100%",
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: 968,
                      height: phoneH,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap,
                    }}
                  >
                    {/* Left Phone: Feed */}
                    <DarkTitaniumIPhone
                      screenImgUrl="/ad-slides/real_screen_no_pizza_feed_75.png"
                      widthPx={phoneW}
                    >
                      {/* Orange tap indicator on Kardemommebolle card */}
                      <div
                        style={{
                          position: "absolute",
                          right: 36,
                          top: 432,
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: "#e84a27",
                          border: "3px solid #FFFFFF",
                          boxShadow:
                            "0 0 0 6px rgba(232, 74, 39, 0.25), 0 6px 14px rgba(232, 74, 39, 0.42)",
                        }}
                      />
                    </DarkTitaniumIPhone>

                    {/* Right Phone: Zoomed Tøyen Map + Floating Håndbakt Popup + Peek Bottom Sheet */}
                    <DarkTitaniumIPhone
                      screenImgUrl="/ad-slides/pure_oslo_map_9_16.png"
                      widthPx={phoneW}
                      imgStyle={{
                        transform: "scale(2.15) translate(-19%, 1%)",
                        transformOrigin: "center center",
                      }}
                    >
                      {/* Top in-app chrome */}
                      <div
                        style={{
                          position: "absolute",
                          top: 50,
                          left: 14,
                          right: 14,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div
                          style={{
                            background: "rgba(255,255,255,0.92)",
                            borderRadius: 999,
                            padding: "6px 13px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            boxShadow: "0 4px 12px rgba(24,22,21,0.10)",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: `${comico.style.fontFamily}, sans-serif`,
                              fontSize: 15,
                              color: "#e84a27",
                              letterSpacing: "0.04em",
                            }}
                          >
                            SMAKR
                          </span>
                          <span style={{ fontSize: 9.5, fontWeight: 700, color: "#78716C" }}>
                            OSLO
                          </span>
                        </div>

                        <div
                          style={{
                            background: "rgba(255,255,255,0.92)",
                            borderRadius: 999,
                            padding: "6px 12px",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#181615",
                            boxShadow: "0 4px 12px rgba(24,22,21,0.10)",
                          }}
                        >
                          Sign In
                        </div>
                      </div>

                      {/* Map utility controls */}
                      <div
                        style={{
                          position: "absolute",
                          top: 98,
                          right: 14,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            background: "rgba(255,255,255,0.94)",
                            borderRadius: 999,
                            padding: "6px 11px",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#181615",
                            boxShadow: "0 4px 12px rgba(24,22,21,0.10)",
                          }}
                        >
                          <span style={{ color: "#e84a27", marginRight: 4 }}>➤</span>Find me
                        </div>
                        <div
                          style={{
                            background: "rgba(255,255,255,0.94)",
                            borderRadius: 12,
                            width: 32,
                            padding: "4px 0",
                            textAlign: "center",
                            fontSize: 16,
                            fontWeight: 700,
                            color: "#57534E",
                            boxShadow: "0 4px 12px rgba(24,22,21,0.10)",
                            lineHeight: 1.4,
                          }}
                        >
                          <div>+</div>
                          <div style={{ borderTop: "1px solid rgba(24,22,21,0.08)" }}>−</div>
                        </div>
                      </div>

                      {/* Highlighted Croissant Pin over Tøyen */}
                      <PerfectedMapPin
                        iconSrc="/icons/food/croissant.webp"
                        highlighted
                        size={42}
                        style={{ right: 56, bottom: 298 }}
                      />

                      {/* Floating White Håndbakt Tøyen Venue Popup */}
                      <div
                        style={{
                          position: "absolute",
                          left: 20,
                          right: 20,
                          top: 342,
                          background: "#FFFFFF",
                          borderRadius: 18,
                          padding: 12,
                          boxShadow: "0 18px 38px rgba(24, 22, 21, 0.22)",
                        }}
                      >
                        <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/ad-slides/handbakt_bolle.webp"
                            alt="Håndbakt Tøyen"
                            style={{
                              width: 72,
                              height: 72,
                              borderRadius: 12,
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 15,
                                  fontWeight: 900,
                                  color: "#181615",
                                  lineHeight: 1.15,
                                }}
                              >
                                Håndbakt Tøyen
                              </span>
                              <span style={{ fontSize: 13, color: "#78716C", fontWeight: 700 }}>
                                ✕
                              </span>
                            </div>

                            <div
                              style={{
                                marginTop: 4,
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                flexWrap: "wrap",
                              }}
                            >
                              <span
                                style={{
                                  background: "#181615",
                                  color: "#FFFFFF",
                                  fontSize: 10,
                                  fontWeight: 800,
                                  padding: "2px 6px",
                                  borderRadius: 999,
                                }}
                              >
                                <span style={{ color: "#FBBF24" }}>★</span> 4.8
                              </span>
                              <span
                                style={{
                                  background: "#ECFDF5",
                                  color: "#15803D",
                                  fontSize: 10,
                                  fontWeight: 800,
                                  padding: "2px 7px",
                                  borderRadius: 999,
                                }}
                              >
                                • Open · til 18:00
                              </span>
                            </div>

                            <div style={{ fontSize: 10, fontWeight: 700, color: "#78716C", marginTop: 3 }}>
                              • 600m
                            </div>
                            <div style={{ fontSize: 10.5, fontWeight: 600, color: "#57534E", marginTop: 2 }}>
                              <span style={{ color: "#e84a27", marginRight: 3 }}>📍</span>
                              Tøyen · Kjølberggata 21
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            marginTop: 10,
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              border: "1px solid rgba(24,22,21,0.14)",
                              borderRadius: 10,
                              padding: "7px 0",
                              textAlign: "center",
                              fontSize: 11.5,
                              fontWeight: 800,
                              color: "#181615",
                              background: "#FFFFFF",
                            }}
                          >
                            Map ↗
                          </div>
                          <div
                            style={{
                              borderRadius: 10,
                              padding: "7px 0",
                              textAlign: "center",
                              fontSize: 11.5,
                              fontWeight: 800,
                              color: "#FFFFFF",
                              background: "#e84a27",
                            }}
                          >
                            Details →
                          </div>
                        </div>
                      </div>

                      {/* Bottom Peek Sheet */}
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          bottom: 0,
                          height: 274,
                          background: "#FAF7F2",
                          borderTopLeftRadius: 22,
                          borderTopRightRadius: 22,
                          boxShadow: "0 -10px 26px rgba(24,22,21,0.14)",
                          overflow: "hidden",
                          padding: "8px 14px 0 14px",
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 4,
                            borderRadius: 999,
                            background: "rgba(24,22,21,0.16)",
                            margin: "0 auto 10px auto",
                          }}
                        />
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 10,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: `${comico.style.fontFamily}, sans-serif`,
                              fontSize: 16,
                              color: "#e84a27",
                            }}
                          >
                            FEED
                          </span>
                          <span
                            style={{
                              background: "#FFFFFF",
                              border: "1px solid rgba(24,22,21,0.08)",
                              borderRadius: 999,
                              padding: "4px 10px",
                              fontSize: 10.5,
                              fontWeight: 700,
                              color: "#e84a27",
                            }}
                          >
                            ✦ Smakr Pick <span style={{ color: "#57534E" }}>· Em Oi! ⌄</span>
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                          {["Filters ⌄", "Saved", "POP-UPS"].map((chip) => (
                            <span
                              key={chip}
                              style={{
                                background: "#FFFFFF",
                                border: "1px solid rgba(24,22,21,0.09)",
                                borderRadius: 999,
                                padding: "4px 10px",
                                fontSize: 10.5,
                                fontWeight: 700,
                                color: "#181615",
                              }}
                            >
                              {chip}
                            </span>
                          ))}
                          <span
                            style={{
                              background: "#e84a27",
                              borderRadius: 999,
                              padding: "4px 11px",
                              fontSize: 10.5,
                              fontWeight: 800,
                              color: "#FFFFFF",
                            }}
                          >
                            All
                          </span>
                        </div>
                        <div
                          style={{
                            position: "relative",
                            height: 158,
                            borderRadius: 16,
                            overflow: "hidden",
                            background: "#181615",
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/ad-slides/bolle.jpg"
                            alt="Kveitemjøl"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              left: "50%",
                              bottom: 18,
                              transform: "translateX(-50%)",
                              background: "#FFFFFF",
                              borderRadius: 999,
                              padding: "5px 8px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                              boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
                            }}
                          >
                            <span
                              style={{
                                background: "#e84a27",
                                color: "#FFFFFF",
                                fontSize: 11,
                                fontWeight: 800,
                                padding: "5px 12px",
                                borderRadius: 999,
                              }}
                            >
                              Dishes · 19
                            </span>
                            <span
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                background: "#181615",
                                color: "#FFFFFF",
                                fontSize: 15,
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              +
                            </span>
                          </div>
                        </div>
                      </div>
                    </DarkTitaniumIPhone>

                    {/* Connecting Dashed Orange Curved Arrow */}
                    <svg
                      aria-hidden="true"
                      viewBox={`0 0 968 ${phoneH}`}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 36,
                        pointerEvents: "none",
                        overflow: "visible",
                      }}
                    >
                      <path
                        d={`M ${dotX} ${dotY} C ${dotX + 38} ${dotY - 56}, ${targetX - 38} ${targetY - 52}, ${targetX} ${targetY}`}
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="8"
                        strokeDasharray="11 9"
                        strokeLinecap="round"
                      />
                      <path
                        d={`M ${dotX} ${dotY} C ${dotX + 38} ${dotY - 56}, ${targetX - 38} ${targetY - 52}, ${targetX} ${targetY}`}
                        fill="none"
                        stroke="#e84a27"
                        strokeWidth="4.5"
                        strokeDasharray="11 9"
                        strokeLinecap="round"
                      />
                      <path
                        d={`M ${targetX - 11} ${targetY - 12} L ${targetX + 3} ${targetY + 2} L ${targetX - 13} ${targetY + 8}`}
                        fill="none"
                        stroke="#e84a27"
                        strokeWidth="4.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              );
            })()}

            <MinimalStoryFooter
              totalDots={5}
              activeIndex={3}
              rightPrompt="Tap Details → for hours & menu"
            />
          </>
        )}

        {/* SLIDE 4: TAP ANY PIN — LIVE HOURS & SIGNATURE DISH */}
        {slideNum === 4 && (
          <>
            <BareSlideHeader
              is916={is916}
              showDivider
              headline={
                <>
                  Tap any pin on the map.
                  <br />
                  <span style={{ color: "#e84a27" }}>See live hours &amp; distance.</span>
                </>
              }
              subheadline="Instant spot cards show whether the kitchen is open right now before you walk over."
            />

            <div
              style={{
                position: "relative",
                zIndex: 25,
                width: "100%",
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 44,
              }}
            >
              <DarkTitaniumIPhone
                screenImgUrl="/ad-slides/real_screen_04_venue_sheet.png"
                widthPx={is916 ? 410 : 374}
              />

              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 18,
                }}
              >
                <div style={{ position: "relative", height: 74, width: 74 }}>
                  <PerfectedMapPin
                    iconSrc="/icons/food/k_chicken.webp"
                    highlighted
                    size={68}
                    style={{ left: 3, top: 0 }}
                  />
                </div>

                {/* Card 1: 175°C K-FRIED Popup Card */}
                <div
                  style={{
                    width: "100%",
                    background: "#FFFFFF",
                    borderRadius: 24,
                    padding: 18,
                    boxShadow: "0 22px 50px rgba(24, 22, 21, 0.14)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/ad-slides/kfried_cover.webp"
                      alt="175°C K-FRIED"
                      style={{
                        width: 82,
                        height: 82,
                        borderRadius: 16,
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 19, fontWeight: 900, color: "#181615" }}>
                        175°C K-FRIED
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 13.5,
                          fontWeight: 800,
                        }}
                      >
                        <span style={{ color: "#181615" }}>
                          <span style={{ color: "#F59E0B" }}>★</span> 4.8
                        </span>
                        <span style={{ color: "#15803D" }}>• Open · til 22:30</span>
                      </div>
                      <div
                        style={{
                          marginTop: 5,
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: "#57534E",
                        }}
                      >
                        <span style={{ color: "#e84a27", marginRight: 5 }}>📍</span>
                        Norway, Oslo, Vulkan, NO
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 14,
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        border: "1px solid rgba(24,22,21,0.12)",
                        borderRadius: 12,
                        padding: "10px 0",
                        textAlign: "center",
                        fontSize: 14,
                        fontWeight: 800,
                        color: "#181615",
                        background: "#FFFFFF",
                      }}
                    >
                      Map ↗
                    </div>
                    <div
                      style={{
                        borderRadius: 12,
                        padding: "10px 0",
                        textAlign: "center",
                        fontSize: 14,
                        fontWeight: 800,
                        color: "#FFFFFF",
                        background: "#e84a27",
                      }}
                    >
                      Details →
                    </div>
                  </div>
                </div>

                {/* Card 2: Signature Dish Card */}
                <div
                  style={{
                    width: "100%",
                    background: "#FFFFFF",
                    borderRadius: 24,
                    padding: 18,
                    boxShadow: "0 22px 50px rgba(24, 22, 21, 0.14)",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/ad-slides/chicken.jpg"
                      alt="Korean Fried Chicken"
                      style={{
                        width: 112,
                        height: 112,
                        borderRadius: 16,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        left: 6,
                        bottom: 6,
                        background: "rgba(24,22,21,0.85)",
                        color: "#FFFFFF",
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "2.5px 7px",
                        borderRadius: 999,
                      }}
                    >
                      <span style={{ color: "#FBBF24" }}>★</span> 4.8
                    </span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 900,
                          letterSpacing: "0.06em",
                          color: "#e84a27",
                          textTransform: "uppercase",
                        }}
                      >
                        SIGNATURE DISH · 159 KR
                      </span>
                      <span
                        style={{
                          background: "#ECFDF5",
                          color: "#15803D",
                          fontSize: 10.5,
                          fontWeight: 800,
                          padding: "2.5px 8px",
                          borderRadius: 999,
                        }}
                      >
                        • Open · til 22:30
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: 18.5,
                        fontWeight: 900,
                        color: "#181615",
                        marginTop: 4,
                        lineHeight: 1.15,
                      }}
                    >
                      Korean Fried Chicken
                    </div>

                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: "#57534E",
                        marginTop: 4,
                      }}
                    >
                      <span style={{ color: "#e84a27", marginRight: 4 }}>📍</span>
                      175°C K-Fried · Vulkan · 350m walk
                    </div>

                    <div
                      style={{
                        marginTop: 10,
                        paddingTop: 9,
                        borderTop: "1px solid rgba(24,22,21,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11.5,
                          fontStyle: "italic",
                          color: "#57534E",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        <span style={{ color: "#e84a27", fontStyle: "normal", marginRight: 4 }}>
                          ✦
                        </span>
                        “Double-fried extra crispy chicken in sweet garlic s...”
                      </span>
                      <span
                        style={{
                          background: "#e84a27",
                          color: "#FFFFFF",
                          fontSize: 11.5,
                          fontWeight: 800,
                          padding: "4px 11px",
                          borderRadius: 999,
                          flexShrink: 0,
                        }}
                      >
                        Order ↗
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <MinimalStoryFooter
              totalDots={5}
              activeIndex={4}
              rightPrompt="Plus one curated drop every week →"
            />
          </>
        )}

        {/* SLIDE 5: WEEKLY DROP & CTA — NAVY SHERPA MASCOT POINTING AT SMAKR PICK */}
        {slideNum === 5 && (
          <>
            <BareSlideHeader
              is916={is916}
              showDivider
              headline={
                <>
                  Your live Oslo food map.
                  <br />
                  <span style={{ color: "#e84a27" }}>Plus one Smakr Pick</span> every week.
                </>
              }
              subheadline="Every pin is a verified spot. Open the radar and go eat well."
            />

            <div
              style={{
                position: "relative",
                zIndex: 25,
                width: "100%",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: is916 ? 44 : 26,
                paddingBottom: is916 ? 30 : 12,
              }}
            >
              {/* Mascot + Pick Card + Scribble Row */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 32,
                  }}
                >
                  <div
                    style={{
                      filter: "drop-shadow(0 24px 40px rgba(24, 22, 21, 0.22))",
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "center",
                    }}
                  >
                    <SmakrMascotRig
                      frameMode="bust-only"
                      bodyPose="jacket-2"
                      face="loving-grin"
                      head={OFFICIAL_SMAKR_MASCOT_CONFIG.peepsHead}
                      accessories="glasses-2"
                      facialHair="none"
                      skinColor={OFFICIAL_SMAKR_MASCOT_CONFIG.skinColor}
                      clothingColor="#1E2738"
                      innerClothingColor="#FAF7F2"
                      sherpaColor="#C8B79E"
                      jacketStyle="navy-sherpa"
                      hatColor={OFFICIAL_SMAKR_MASCOT_CONFIG.hatColor}
                      headContrastColor={OFFICIAL_SMAKR_MASCOT_CONFIG.hairColor}
                      size={is916 ? 405 : 352}
                      flip
                      stickerOutline
                    />
                  </div>

                  {/* Framed + SMAKR PICK Boller Card */}
                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        position: "absolute",
                        top: -22,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "#e84a27",
                        color: "#FFFFFF",
                        fontSize: 13.5,
                        fontWeight: 900,
                        letterSpacing: "0.08em",
                        padding: "6px 18px",
                        borderRadius: 999,
                        whiteSpace: "nowrap",
                        boxShadow: "0 10px 22px rgba(232, 74, 39, 0.36)",
                        zIndex: 6,
                      }}
                    >
                      ✦ SMAKR PICK
                    </div>

                    <div
                      style={{
                        width: is916 ? 460 : 440,
                        height: is916 ? 490 : 438,
                        borderRadius: 28,
                        overflow: "hidden",
                        position: "relative",
                        border: "4px solid #FFFFFF",
                        boxShadow: "0 26px 56px rgba(24, 22, 21, 0.20)",
                        background: "#FAF7F2",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/ad-slides/bolle.jpg"
                        alt="Boller at Daglig Brød"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />

                      {/* Star rating badge top right */}
                      <span
                        style={{
                          position: "absolute",
                          top: 14,
                          right: 14,
                          background: "rgba(24, 22, 21, 0.85)",
                          color: "#FFFFFF",
                          fontSize: 12.5,
                          fontWeight: 800,
                          padding: "4px 10px",
                          borderRadius: 999,
                        }}
                      >
                        <span style={{ color: "#FBBF24" }}>★</span> 4.7
                      </span>

                      {/* Overlapping frosted warm pick details sheet */}
                      <div
                        style={{
                          position: "absolute",
                          left: 12,
                          right: 12,
                          bottom: 12,
                          background: "rgba(255, 255, 255, 0.90)",
                          backdropFilter: "blur(12px)",
                          borderRadius: 20,
                          padding: "14px 16px",
                          boxShadow: "0 12px 30px rgba(24, 22, 21, 0.14)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                          }}
                        >
                          <span style={{ fontSize: 22, fontWeight: 900, color: "#181615" }}>
                            Boller
                          </span>
                          <span
                            style={{
                              background: "#e84a27",
                              color: "#FFFFFF",
                              fontSize: 14,
                              fontWeight: 900,
                              padding: "4px 12px",
                              borderRadius: 999,
                            }}
                          >
                            135 kr
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: 13.5,
                            fontWeight: 700,
                            color: "#57534E",
                            marginTop: 2,
                          }}
                        >
                          <span style={{ color: "#e84a27", marginRight: 5 }}>📍</span>
                          Daglig Brød · Gamlebyen
                        </div>

                        <div
                          style={{
                            marginTop: 10,
                            background: "rgba(255, 255, 255, 0.78)",
                            borderRadius: 12,
                            padding: "9px 11px",
                            fontSize: 12.5,
                            lineHeight: 1.38,
                            color: "#292524",
                            fontStyle: "italic",
                          }}
                        >
                          <span style={{ color: "#e84a27", fontStyle: "normal", marginRight: 4 }}>
                            ✦
                          </span>
                          “Extremely rich, warm artisan sourdough buns — pistachio, brunost, biscoff
                          &amp; cinnamon straight from the hearth.”
                        </div>

                        <div
                          style={{
                            marginTop: 10,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#57534E",
                          }}
                        >
                          <span
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              background: "#e84a27",
                              color: "#FFFFFF",
                              fontSize: 11,
                              fontWeight: 900,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            S
                          </span>
                          <span>@smak · Weekly Radar Drop</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <SignatureFoodiesScribble width={is916 ? 450 : 410} />
                </div>
              </div>

              <FrostedLiveCtaCard />
            </div>

            <MinimalStoryFooter totalDots={5} activeIndex={5} />
          </>
        )}
      </div>
    </div>
  );
}

export function CarouselStoryDeck() {
  const [presetId, setPresetId] = useState<StoryPresetId>("how-smakr-works");
  const [aspect, setAspect] = useState<StoryAspectId>("4:5");
  const [focusedSlide, setFocusedSlide] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [exportingNum, setExportingNum] = useState<number | "all" | null>(null);

  const slideRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const activeSlides =
    presetId === "oslo-snowfall-bowls"
      ? SNOWFALL_SLIDE_META
      : presetId === "oslo-popup-radar"
        ? POPUP_SLIDE_META
        : SLIDE_META;
  const activePresetLabel = STORY_PRESET_LABELS[presetId];
  const is916 = aspect === "9:16";
  const is11 = aspect === "1:1";
  const nativeH = getStoryNativeHeight(aspect);
  // Scale 2-slide decks larger for comfortable inspection while fitting 5-slide decks side-by-side
  const previewScale =
    activeSlides.length === 2
      ? is916
        ? 0.285
        : is11
          ? 0.34
          : 0.315
      : is916
        ? 0.24
        : is11
          ? 0.30
          : 0.285;
  const previewW = Math.round(1080 * previewScale);
  const previewH = Math.round(nativeH * previewScale);

  const selectPreset = (nextId: StoryPresetId) => {
    setPresetId(nextId);
    setFocusedSlide(null);
  };

  const renderSlideCanvas = (slideNum: 1 | 2 | 3 | 4 | 5) =>
    presetId === "oslo-snowfall-bowls" ? (
      <EarlySnowSlideCanvas slideNum={slideNum === 2 ? 2 : 1} aspect={aspect} />
    ) : presetId === "oslo-popup-radar" ? (
      <PopupRadarSlideCanvas slideNum={slideNum === 2 || slideNum === 3 || slideNum === 4 ? slideNum : 1} aspect={aspect} />
    ) : (
      <StorySlideCanvas slideNum={slideNum} aspect={aspect} />
    );

  const exportSingleSlide = useCallback(
    async (slideNum: 1 | 2 | 3 | 4 | 5) => {
      const node = slideRefs.current[slideNum];
      if (!node) return;
      const meta = activeSlides.find((s) => s.num === slideNum);
      if (!meta) return;
      const aspectSlug = aspect.replace(":", "_");
      const blob = await toBlob(node, {
        width: 1080,
        height: nativeH,
        pixelRatio: 3,
        cacheBust: true,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
          margin: "0",
        },
      });
      if (!blob) return;
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${meta.fileSlug}_${presetId}_${aspectSlug}_3x.png`;
      link.href = blobUrl;
      link.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    },
    [activeSlides, aspect, nativeH, presetId]
  );

  const handleExportOne = async (slideNum: 1 | 2 | 3 | 4 | 5) => {
    try {
      setExportingNum(slideNum);
      await exportSingleSlide(slideNum);
    } finally {
      setExportingNum(null);
    }
  };

  const handleExportAll = async () => {
    try {
      setExportingNum("all");
      for (const meta of activeSlides) {
        await exportSingleSlide(meta.num);
        await new Promise((resolve) => setTimeout(resolve, 180));
      }
    } finally {
      setExportingNum(null);
    }
  };

  return (
    <div className="w-full max-w-[1680px] mx-auto px-4 pb-8 pt-2">
      {/* Studio Deck Control Bar */}
      <div className="rounded-2xl bg-[#1C1A18] border border-white/10 p-3.5 mb-5 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        {/* Preset Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 mr-1">
            Deck Data
          </span>
          <button
            type="button"
            onClick={() => selectPreset("how-smakr-works")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              presetId === "how-smakr-works"
                ? "bg-[#e84a27] text-white shadow-sm"
                : "bg-white/5 text-zinc-300 hover:bg-white/10"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Preset 1: {STORY_PRESET_LABELS["how-smakr-works"]}</span>
          </button>

          <button
            type="button"
            onClick={() => selectPreset("oslo-snowfall-bowls")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              presetId === "oslo-snowfall-bowls"
                ? "bg-[#e84a27] text-white shadow-sm"
                : "bg-white/5 text-zinc-300 hover:bg-white/10"
            }`}
          >
            <Snowflake className="w-3.5 h-3.5" />
            <span>Preset 2: {STORY_PRESET_LABELS["oslo-snowfall-bowls"]}</span>
          </button>

          <button
            type="button"
            onClick={() => selectPreset("oslo-popup-radar")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              presetId === "oslo-popup-radar"
                ? "bg-[#e84a27] text-white shadow-sm"
                : "bg-white/5 text-zinc-300 hover:bg-white/10"
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Preset 3: {STORY_PRESET_LABELS["oslo-popup-radar"]}</span>
          </button>
        </div>

        {/* Aspect + Batch Export */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setAspect("1:1")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                aspect === "1:1" ? "bg-white text-stone-900" : "text-zinc-400 hover:text-white"
              }`}
            >
              1:1 (1080×1080)
            </button>
            <button
              type="button"
              onClick={() => setAspect("4:5")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                aspect === "4:5" ? "bg-white text-stone-900" : "text-zinc-400 hover:text-white"
              }`}
            >
              4:5 (1080×1350)
            </button>
            <button
              type="button"
              onClick={() => setAspect("3:4")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                aspect === "3:4" ? "bg-white text-stone-900" : "text-zinc-400 hover:text-white"
              }`}
            >
              3:4 (1080×1440 · IG)
            </button>
            <button
              type="button"
              onClick={() => setAspect("9:16")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                aspect === "9:16" ? "bg-white text-stone-900" : "text-zinc-400 hover:text-white"
              }`}
            >
              9:16 (1080×1920)
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportAll}
            disabled={exportingNum !== null}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#e84a27] hover:bg-[#d64120] disabled:opacity-60 text-white text-xs font-extrabold shadow-md transition-all cursor-pointer"
          >
            {exportingNum === "all" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>
              {exportingNum === "all"
                ? `Exporting ${activeSlides.length} Slides (@3x)...`
                : `Export All ${activeSlides.length} (@3x PNG · ${aspect})`}
            </span>
          </button>
        </div>
      </div>

      {/* Slide Overview Row */}
      <div className="flex flex-wrap justify-center gap-5">
        {activeSlides.map((meta) => (
          <div key={meta.num} className="flex flex-col items-center gap-2.5">
            <div className="w-full flex items-center justify-between gap-2 px-1">
              <span className="bg-[#e84a27] text-[#FAF7F2] text-[11px] font-extrabold px-3 py-1 rounded-full tracking-wide shadow-sm">
                {meta.pillLabel}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFocusedSlide(meta.num)}
                  title="Zoom preview"
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleExportOne(meta.num)}
                  disabled={exportingNum !== null}
                  title="Download @3x PNG"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-[#e84a27] text-white text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {exportingNum === meta.num ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Download className="w-3 h-3" />
                  )}
                  <span>@3x</span>
                </button>
              </div>
            </div>

            <div
              style={{
                width: previewW,
                height: previewH,
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 16px 38px rgba(0, 0, 0, 0.38)",
                border: "2px solid rgba(255,255,255,0.88)",
                position: "relative",
                background: "#FAF7F2",
              }}
            >
              <div
                ref={(el) => {
                  slideRefs.current[meta.num] = el;
                }}
                style={{
                  width: 1080,
                  height: nativeH,
                  transform: `scale(${previewScale})`,
                  transformOrigin: "top left",
                }}
              >
                {renderSlideCanvas(meta.num)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Zoom Inspection Modal */}
      {focusedSlide !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setFocusedSlide(null)}
        >
          <div
            className="relative flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-extrabold text-white bg-[#e84a27] px-3 py-1 rounded-full">
                {activeSlides.find((s) => s.num === focusedSlide)?.pillLabel} · {activePresetLabel}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportOne(focusedSlide)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e84a27] text-white text-xs font-bold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download @3x PNG</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFocusedSlide(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {(() => {
              const modalScale = is916 ? 0.42 : is11 ? 0.64 : 0.56;
              return (
                <div
                  style={{
                    width: Math.round(1080 * modalScale),
                    height: Math.round(nativeH * modalScale),
                    borderRadius: 20,
                    overflow: "hidden",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.65)",
                    border: "2px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <div
                    style={{
                      width: 1080,
                      height: nativeH,
                      transform: `scale(${modalScale})`,
                      transformOrigin: "top left",
                    }}
                  >
                    {renderSlideCanvas(focusedSlide)}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
