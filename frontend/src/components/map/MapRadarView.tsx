"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as maplibregl from "maplibre-gl";

// Next.js/Turbopack cannot emit MapLibre v6's ESM worker (it would 404 next to
// the hashed app chunk), so both worker files are self-hosted from
// `public/maplibre/` and pointed to once here, before any Map is constructed.
if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
}

/**
 * Increments for every MapLibre instance so the `[locate]` diagnostics can tell
 * apart "the camera moved" from "the whole map was torn down and re-created at
 * its initial centre" (a common cause of an unexpected jump to the start spot).
 */
let MAP_INSTANCE_SEQ = 0;
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { MapControls } from "@/components/map/MapControls";
import { useGeolocation } from "@/hooks/useGeolocation";
import { fetchVenueDetail } from "@/lib/api";
import { Venue } from "@/types";
import {
  createMascotDOMElement,
  buildMascotSVGString,
  MASCOT_VIEWBOX_WIDTH,
  MASCOT_VIEWBOX_HEIGHT,
} from "@/components/avatar/MascotCharacter";
import {
  OFFICIAL_SMAKR_MASCOT_CONFIG,
  getOfficialSmakrMascotConfig,
} from "@/lib/officialSmakrMascot";
import {
  FOOD_PIN_SVG_MAP,
  isCustomFoodIcon,
  resolveCustomIconKey,
  DISH_ICON_WEBP,
  FILTER_CATEGORY_WEBP,
} from "@/components/food/FoodIcons";
import { resolveEntityTaxonomy, resolveVenueDisplayBadge, resolveDishIconKey } from "@/lib/taxonomy";
import { getIconDisplay } from "@/lib/iconRegistry";
import { formatDistance } from "@/lib/math";
import { getDirectionsUrl } from "@/lib/location";
import { getPopupStatus, getPopupUrgencyLabel } from "@/lib/popupUtils";
import { getVenueLiveOpenStatus } from "@/lib/openingHours";
import {
  buildOpenPeepsSvg,
  ensureBustAvatarSvg,
  getOrCreateGuestOpenPeepsConfig,
  type OpenPeepsConfig,
} from "@/lib/onboardingAvatar";
import type { MascotConfig } from "@/types/mascot";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || "ThoacZP1opK329U6AvTz";

function getMapStyles() {
  if (MAPTILER_KEY) {
    return {
      streets: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
      dataviz: `https://api.maptiler.com/maps/dataviz-light/style.json?key=${MAPTILER_KEY}`,
      aquarelle: `https://api.maptiler.com/maps/aquarelle-v4/style.json?key=${MAPTILER_KEY}`,
    };
  }

  return {
    streets: "https://demotiles.maplibre.org/style.json",
    dataviz: "https://demotiles.maplibre.org/style.json",
    aquarelle: "https://demotiles.maplibre.org/style.json",
  };
}

// Fixed-position marker builder:
// Root node MUST be absolute with top:0, left:0 so MapLibre's translate3d() math places it precisely at its GPS point
const PIN_SHADOW_SELECTED =
  "drop-shadow(0 4px 10px rgba(232, 74, 39, 0.65)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35))";
const PIN_SHADOW_DEFAULT =
  "drop-shadow(0 3px 6px rgba(0, 0, 0, 0.35)) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))";

function getMapMascotDimensions(zoom: number): { width: number; height: number } {
  // Prominently sized mascot bust (~76px x 62px at default zoom 13.5) framing the 50px dish pin
  const height = Math.round(Math.min(92, Math.max(56, (zoom - 10) * 9 + 44)));
  const width = Math.round(height * 0.82);
  return { width, height };
}

function getUserAvatarDimensions(zoom: number): { width: number; height: number } {
  // Calibrated so user bust matches the visual head/torso volume of the Smakr mascot (~48px x 40px at zoom 13.5)
  const height = Math.round(Math.min(58, Math.max(36, (zoom - 10) * 5 + 31)));
  const width = Math.round(height * 0.82);
  return { width, height };
}

/**
 * Updates a pin's selected/unselected visuals IN PLACE. Markers are created once
 * and only mutated afterwards, so store updates never tear down and rebuild the
 * marker DOM (which caused layout thrash and frame drops).
 */
function applyPinState(root: HTMLElement, isSelected: boolean) {
  const isPopup = root.dataset.isPopup === "1";
  const isWeeklyPick = root.dataset.isWeeklyPick === "1";
  root.dataset.selected = isSelected ? "1" : "0";
  root.style.zIndex = isSelected ? "55" : isWeeklyPick ? "44" : "15";
  const visual = root.querySelector<HTMLElement>(".pin-visual");
  if (visual) visual.style.transform = isSelected ? "scale(1.14)" : "scale(1.0)";
  const puck = root.querySelector<HTMLElement>(".smakr-map-puck");
  const iconContainer = root.querySelector<HTMLElement>(".smakr-puck-icon");
  const dot = root.querySelector<HTMLElement>(".smakr-puck-dot");
  const baseIconPx = isWeeklyPick ? 44 : 39;
  const selectedIconPx = isWeeklyPick ? 48 : 43;
  if (puck) {
    if (isPopup) {
      if (isSelected) {
        puck.style.background = "#FFFFFF";
        puck.style.border = "1.5px solid #E84A27";
        puck.style.boxShadow = "0 0 0 3px rgba(232, 74, 39, 0.18), 0 6px 16px rgba(232, 74, 39, 0.20)";
      } else {
        puck.style.background = "#FAF7F2";
        puck.style.border = "1.5px solid rgba(232, 74, 39, 0.65)";
        puck.style.boxShadow = "0 3px 8px rgba(24, 22, 21, 0.12)";
      }
    } else {
      puck.style.background = "transparent";
      puck.style.border = "none";
      puck.style.borderRadius = "0";
      puck.style.boxShadow = "none";
      puck.style.overflow = "visible";
    }
  }
  if (iconContainer) {
    if (isPopup) {
      iconContainer.style.filter = "none";
    } else if (isSelected) {
      iconContainer.style.width = `${selectedIconPx}px`;
      iconContainer.style.height = `${selectedIconPx}px`;
      iconContainer.style.filter = "url(#smakr-diecut-default)";
      const svg = iconContainer.querySelector("svg");
      if (svg) {
        svg.setAttribute("width", `${selectedIconPx}`);
        svg.setAttribute("height", `${selectedIconPx}`);
      }
      const img = iconContainer.querySelector("img");
      if (img) {
        img.style.width = `${selectedIconPx}px`;
        img.style.height = `${selectedIconPx}px`;
      }
    } else {
      iconContainer.style.width = `${baseIconPx}px`;
      iconContainer.style.height = `${baseIconPx}px`;
      iconContainer.style.filter = "url(#smakr-diecut-default)";
      const svg = iconContainer.querySelector("svg");
      if (svg) {
        svg.setAttribute("width", `${baseIconPx}`);
        svg.setAttribute("height", `${baseIconPx}`);
      }
      const img = iconContainer.querySelector("img");
      if (img) {
        img.style.width = `${baseIconPx}px`;
        img.style.height = `${baseIconPx}px`;
      }
    }
  }
  if (dot) {
    if (isSelected) {
      dot.style.background = "#E84A27";
      dot.style.borderColor = "#E84A27";
      dot.style.transform = isPopup ? "translateX(-50%) scale(1.35)" : "scale(1.35)";
      dot.style.boxShadow = "0 0 0 2px rgba(232, 74, 39, 0.25), 0 2px 5px rgba(232, 74, 39, 0.4)";
    } else {
      dot.style.background = "#FAF7F2";
      dot.style.borderColor = isPopup ? "#E84A27" : "rgba(24, 22, 21, 0.28)";
      dot.style.transform = isPopup ? "translateX(-50%) scale(1.0)" : "scale(1.0)";
      dot.style.boxShadow = isPopup ? "0 1px 3px rgba(232, 74, 39, 0.35)" : "0 1px 3px rgba(24, 22, 21, 0.35)";
    }
  }
}

function buildUserAvatarPuckElement(
  avatarUrl?: string | null,
  avatarConfig?: OpenPeepsConfig | null,
  mascotConfig?: MascotConfig | null,
  useMascot = false
): HTMLDivElement {
  // MapLibre MUST exclusively own the root's `style.transform` (translate3d).
  // All zoom/viewport scaling is applied strictly to the inner `.puck-scale` child.
  const root = document.createElement("div");
  root.className = "select-none pointer-events-auto cursor-pointer group";
  root.style.zIndex = "60";

  const container = document.createElement("div");
  container.className =
    "puck-scale relative flex flex-col items-center select-none pointer-events-none transition-transform duration-150 ease-out";
  container.style.transformOrigin = "bottom center";
  container.style.willChange = "transform";

  const initialDims = getUserAvatarDimensions(13.5);
  // Free-standing Open Peeps Bust Sticker (synchronized with Smakr Pick dimensions)
  const charContainer = document.createElement("div");
  charContainer.className =
    "puck-char relative flex items-end justify-center overflow-visible";
  charContainer.style.width = `${initialDims.width}px`;
  charContainer.style.height = `${initialDims.height}px`;
  // Crisp white die-cut vinyl sticker outline + soft elevation shadow
  charContainer.style.filter =
    "drop-shadow(1.5px 0 0 #FFFFFF) drop-shadow(-1.5px 0 0 #FFFFFF) drop-shadow(0 1.5px 0 #FFFFFF) drop-shadow(0 -1.5px 0 #FFFFFF) drop-shadow(0 3px 6px rgba(0, 0, 0, 0.22))";

  const renderSvgInto = (svgStr: string, _isMascotEngine = false) => {
    const cleaned = svgStr.replace(/<g data-layer="ambience">[\s\S]*?<\/g>/g, "");
    charContainer.innerHTML = cleaned;
    const svgEl = charContainer.querySelector("svg");
    if (svgEl) {
      svgEl.setAttribute("preserveAspectRatio", "xMidYMax meet");
      svgEl.style.width = "100%";
      svgEl.style.height = "100%";
      svgEl.style.display = "block";
      svgEl.style.overflow = "visible";
    }
  };

  if (avatarConfig) {
    renderSvgInto(buildOpenPeepsSvg(avatarConfig), false);
  } else if (avatarUrl && avatarUrl.startsWith("data:image/svg+xml")) {
    renderSvgInto(ensureBustAvatarSvg(avatarUrl), false);
  } else if (useMascot) {
    renderSvgInto(
      buildMascotSVGString(
        mascotConfig ?? getOfficialSmakrMascotConfig(),
        false,
        MASCOT_VIEWBOX_WIDTH,
        MASCOT_VIEWBOX_HEIGHT
      ),
      true
    );
  } else {
    renderSvgInto(buildOpenPeepsSvg(getOrCreateGuestOpenPeepsConfig()), false);
  }

  // Subtle warm-paper editorial micro-pill
  const badge = document.createElement("div");
  badge.className =
    "puck-badge -mt-1.5 relative z-20 bg-[#FAF7F2]/95 backdrop-blur-xs text-[#181615]/85 font-bold text-[7.5px] tracking-[0.06em] uppercase leading-none px-1.5 py-0.5 rounded-full shadow-[0_1px_4px_rgba(24,22,21,0.14)] border border-[#181615]/12 whitespace-nowrap flex items-center gap-1 group-hover:scale-105 transition-transform";
  badge.style.fontFamily = "var(--font-comico), sans-serif";
  badge.innerHTML = `<span style="width:4px;height:4px;border-radius:9999px;background:#10B981;display:inline-block;"></span><span>You</span>`;

  // Glowing emerald GPS radar pulse dot directly beneath the bust
  const gpsDotWrapper = document.createElement("div");
  gpsDotWrapper.className = "relative flex items-center justify-center mt-0.5";

  const ripple = document.createElement("div");
  ripple.className =
    "absolute w-4 h-4 rounded-full bg-[#10B981]/30 border border-[#10B981]/50 animate-ping pointer-events-none";
  ripple.style.animationDuration = "2s";

  const gpsDot = document.createElement("div");
  gpsDot.className =
    "relative z-10 w-2 h-2 rounded-full bg-[#10B981] border-2 border-white shadow-[0_0_8px_#10B981]";

  gpsDotWrapper.appendChild(ripple);
  gpsDotWrapper.appendChild(gpsDot);

  container.appendChild(charContainer);
  container.appendChild(badge);
  container.appendChild(gpsDotWrapper);
  root.appendChild(container);
  return root;
}

/**
 * Calibrated zoom-responsive scale for user avatar bust.
 */
function applyPuckZoomScale(rootEl: HTMLElement, zoom: number, _containerWidth?: number) {
  const { width, height } = getUserAvatarDimensions(zoom);
  const charEl = rootEl.querySelector<HTMLElement>(".puck-char");
  if (charEl) {
    charEl.style.width = `${width}px`;
    charEl.style.height = `${height}px`;
  }
  const scaleEl = rootEl.querySelector<HTMLElement>(".puck-scale") ?? rootEl;
  scaleEl.style.transform = "scale(1)";
}

function createAquarellePinElement(
  venue: Venue,
  isSelected: boolean,
  onClick: () => void,
  overrideIconKey?: string | null,
  isWeeklyPickVenue = false
): HTMLDivElement {
  const root = document.createElement("div");
  root.className = "maplibregl-marker";
  root.style.position = "absolute";
  root.style.top = "0";
  root.style.left = "0";
  root.style.width = isWeeklyPickVenue ? "52px" : "48px";
  root.style.height = isWeeklyPickVenue ? "58px" : "54px";
  root.style.margin = "0";
  root.style.padding = "0";
  root.style.cursor = "pointer";
  root.style.userSelect = "none";
  root.style.overflow = "visible";

  const isPopup = venue.spot_type === "popup";
  root.dataset.isPopup = isPopup ? "1" : "0";
  root.dataset.isWeeklyPick = isWeeklyPickVenue ? "1" : "0";

  const popupStatus = getPopupStatus(venue);
  const kitchenStatus = venue.kitchen_status?.status;
  const isFreshBatch = kitchenStatus === "fresh_batch";
  const isLowStock = kitchenStatus === "low_stock";
  const isSoldOut = kitchenStatus === "sold_out";

  const taxonomy = resolveEntityTaxonomy(venue);
  const venueBadge = resolveVenueDisplayBadge(venue);
  const dishCustomKey = resolveCustomIconKey(taxonomy.dishCategory);
  const explicitVenueIcon = venue.icon ? resolveCustomIconKey(venue.icon) : null;
  const badgePinKey = resolveCustomIconKey(venueBadge.pinIcon);
  const categoryKey = overrideIconKey || badgePinKey || explicitVenueIcon || taxonomy.dishCategory || venue.food_category || "all";
  const rawIcon =
    !overrideIconKey && venue.icon
      ? String(venue.icon).replace(/[<>&"']/g, "").trim()
      : "";
  const customKey =
    (overrideIconKey ? resolveCustomIconKey(overrideIconKey) : null) ||
    badgePinKey ||
    explicitVenueIcon ||
    dishCustomKey ||
    resolveCustomIconKey(rawIcon) ||
    resolveCustomIconKey(categoryKey);
  const isCustomVectorKey = Boolean(customKey);
  const iconKey = customKey || overrideIconKey || rawIcon || categoryKey;
  const iconSvg = FOOD_PIN_SVG_MAP[iconKey] || FOOD_PIN_SVG_MAP[categoryKey] || FOOD_PIN_SVG_MAP.all;
  const curatedIcon = isCustomVectorKey
    ? ""
    : rawIcon
    ? rawIcon
    : venue.spot_type === "food_truck"
    ? "🚚"
    : venue.spot_type === "popup"
    ? "✨"
    : "";
  const pinIconPx = isWeeklyPickVenue ? 44 : 39;
  const puckPx = isWeeklyPickVenue ? 50 : 46;
  const webpUrl =
    DISH_ICON_WEBP[iconKey] ||
    FILTER_CATEGORY_WEBP[iconKey] ||
    (categoryKey ? DISH_ICON_WEBP[categoryKey] || FILTER_CATEGORY_WEBP[categoryKey] : null);
  const pinGlyph = webpUrl
    ? `<img src="${webpUrl}" width="${pinIconPx}" height="${pinIconPx}" alt="${iconKey}" style="width:${pinIconPx}px;height:${pinIconPx}px;object-fit:contain;display:block;user-select:none;pointer-events:none;" />`
    : curatedIcon
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="${pinIconPx}" height="${pinIconPx}" viewBox="-2 -2 28 28" style="overflow:visible !important; display:block;"><text x="12" y="13" font-size="21" text-anchor="middle" dominant-baseline="central" style="font-family:'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif; user-select:none;">${curatedIcon}</text></svg>`
    : iconSvg
        .replace(/width="\d+"/, `width="${pinIconPx}"`)
        .replace(/height="\d+"/, `height="${pinIconPx}"`);

  const inner = document.createElement("div");
  inner.className = "pin-visual";
  inner.style.width = "100%";
  inner.style.height = "100%";
  inner.style.display = "flex";
  inner.style.flexDirection = "column";
  inner.style.alignItems = "center";
  inner.style.justifyContent = "flex-start";
  inner.style.position = "relative";
  inner.style.boxSizing = "border-box";
  inner.style.transformOrigin = "bottom center";
  inner.style.transition = "transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)";

  const haloHtml = isPopup
    ? `<div style="position:absolute;top:-6px;left:-6px;width:50px;height:50px;border-radius:16px;border:2px solid #E84A27;background:rgba(232,74,39,0.22);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;pointer-events:none;"></div>`
    : isFreshBatch
    ? `<div style="position:absolute;top:-6px;left:-6px;width:46px;height:46px;border-radius:9999px;border:2px solid #e84a27;background:rgba(232,74,39,0.25);animation:ping 1.4s cubic-bezier(0,0,0.2,1) infinite;pointer-events:none;"></div>`
    : popupStatus.isPulsingMarker
    ? `<div style="position:absolute;top:-5px;left:-5px;width:44px;height:44px;border-radius:9999px;border:2px solid #f59e0b;background:rgba(245,158,11,0.2);animation:ping 1.6s cubic-bezier(0,0,0.2,1) infinite;pointer-events:none;"></div>`
    : "";

  let kitchenBadgeHtml = "";
  if (isFreshBatch) {
    kitchenBadgeHtml = `<div title="Fresh Batch Live" style="position:absolute;top:-5px;right:-5px;width:16px;height:16px;border-radius:9999px;background:#e84a27;color:white;font-size:10px;display:grid;place-items:center;box-shadow:0 1px 4px rgba(0,0,0,0.3);border:1.5px solid #fff;line-height:1;z-index:2;">🔥</div>`;
  } else if (isLowStock) {
    kitchenBadgeHtml = `<div title="Few Left Today" style="position:absolute;top:-5px;right:-5px;width:16px;height:16px;border-radius:9999px;background:#d97706;color:white;font-size:10px;display:grid;place-items:center;box-shadow:0 1px 4px rgba(0,0,0,0.3);border:1.5px solid #fff;line-height:1;z-index:2;">⚡</div>`;
  } else if (isSoldOut) {
    kitchenBadgeHtml = `<div title="Sold Out" style="position:absolute;top:-5px;right:-5px;width:16px;height:16px;border-radius:9999px;background:#57534e;color:white;font-size:9px;display:grid;place-items:center;box-shadow:0 1px 4px rgba(0,0,0,0.3);border:1.5px solid #fff;line-height:1;z-index:2;">✕</div>`;
  }

  if (isPopup) {
    inner.innerHTML = `
      <!-- Distinct Pop-up Ticket Badge (38x38px rounded-xl, #FAF7F2, #E84A27 border) -->
      ${haloHtml}
      <div class="smakr-map-puck" style="
        width: 31px;
        height: 31px;
        border-radius: 10px;
        background: #FAF7F2;
        border: 2px solid #E84A27;
        box-shadow: 0 4px 12px rgba(232, 74, 39, 0.22);
        display: grid;
        place-items: center;
        padding: 0;
        position: relative;
        transition: transform 150ms cubic-bezier(0.22, 1, 0.36, 1), background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        cursor: pointer;
      ">
        <!-- Floating Micro-Pill: 🔥 POP-UP -->
        <div style="
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: #E84A27;
          color: #FFFFFF;
          font-family: var(--font-comico, sans-serif);
          font-size: 7.5px;
          font-weight: 900;
          letter-spacing: 0.04em;
          padding: 1px 5.5px;
          border-radius: 9999px;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(232, 74, 39, 0.35);
          pointer-events: none;
          z-index: 10;
        ">🔥 POP-UP</div>
        ${kitchenBadgeHtml}
        <div class="smakr-puck-icon" style="width:18px;height:18px;display:grid;place-items:center;line-height:1;margin:0;padding:0;">
          ${pinGlyph}
        </div>
        <!-- Ground GPS anchor dot -->
        <div class="smakr-puck-dot" style="position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); width: 5.5px; height: 5.5px; border-radius: 9999px; background: #FAF7F2; border: 1px solid #E84A27; box-shadow: 0 1px 3px rgba(232, 74, 39, 0.35); transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;"></div>
      </div>
    `;
  } else {
    inner.innerHTML = `
      <!-- Die-Cut Floating Dish Silhouette Pin (Crisp, perfectly centered ground dot) -->
      ${haloHtml}
      <div class="smakr-map-puck" style="
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        padding: 0;
        margin: 0;
        background: transparent !important;
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        overflow: visible !important;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        transition: transform 150ms cubic-bezier(0.22, 1, 0.36, 1);
        cursor: pointer;
      ">
        ${kitchenBadgeHtml}
        <div class="smakr-puck-icon" style="
          width: ${pinIconPx}px;
          height: ${pinIconPx}px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          margin: 0;
          padding: 0;
          flex-shrink: 0;
          overflow: visible !important;
          filter: url(#smakr-diecut-default);
          transition: filter 0.2s ease, width 0.15s ease, height 0.15s ease;
        ">
          ${pinGlyph}
        </div>
        <!-- Ground GPS anchor dot centered directly beneath the floating icon -->
        <div class="smakr-puck-dot" style="width: 6px; height: 6px; border-radius: 9999px; background: #FAF7F2; border: 1px solid rgba(24, 22, 21, 0.28); box-shadow: 0 1px 3px rgba(24, 22, 21, 0.35); margin-top: 1px; flex-shrink: 0; transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;"></div>
      </div>
    `;
  }

  const puckEl = inner.querySelector<HTMLElement>(".smakr-map-puck");
  if (puckEl) {
    puckEl.addEventListener("mouseenter", () => {
      if (root.dataset.selected !== "1") {
        puckEl.style.transform = "scale(1.10)";
      }
    });
    puckEl.addEventListener("mouseleave", () => {
      if (root.dataset.selected !== "1") {
        puckEl.style.transform = "scale(1.0)";
      }
    });
    puckEl.addEventListener("mousedown", () => {
      puckEl.style.transform = "scale(0.95)";
    });
    puckEl.addEventListener("mouseup", () => {
      puckEl.style.transform = root.dataset.selected === "1" ? "scale(1.0)" : "scale(1.10)";
    });
  }

  root.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });

  root.appendChild(inner);
  applyPinState(root, isSelected);
  return root;
}

export function MapRadarView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markerPoolRef = useRef<Map<string, { marker: maplibregl.Marker; rootEl: HTMLElement }>>(new Map());
  const prevSelectedVenueIdRef = useRef<string | null>(null);
  const weeklyMarkerRef = useRef<maplibregl.Marker | null>(null);
  const venuePopupRef = useRef<maplibregl.Popup | null>(null);
  const isMapReadyRef = useRef(false);
  const [isMapReady, setIsMapReady] = useState(false);
  // Future Map Filter slot
  const [isMapFilterOpen, setIsMapFilterOpen] = useState(false);
  void isMapFilterOpen;
  void setIsMapFilterOpen;

  // Fast, responsive Streets v2 default
  const [activeTheme, setActiveTheme] = useState<"streets" | "dataviz" | "aquarelle">("streets");
  const venues = useCityPulseStore((state) => state.venues);
  const foodPosts = useCityPulseStore((state) => state.foodPosts);
  const selectedVenue = useCityPulseStore((state) => state.selectedVenue);
  const setSelectedVenue = useCityPulseStore((state) => state.setSelectedVenue);
  const setIsVenueDetailModalOpen = useCityPulseStore((state) => state.setIsVenueDetailModalOpen);
  const mapCategory = useCityPulseStore((state) => state.mapCategory);
  const feedCategory = useCityPulseStore((state) => state.feedCategory);
  const selectedGroup = useCityPulseStore((state) => state.selectedGroup);
  const selectedDishCategory = useCityPulseStore((state) => state.selectedDishCategory);
  const selectedSpotKind = useCityPulseStore((state) => state.selectedSpotKind);
  const selectedCuisine = useCityPulseStore((state) => state.selectedCuisine);
  const selectedDietary = useCityPulseStore((state) => state.selectedDietary);
  const spotTypeFilter = useCityPulseStore((state) => state.filters.spot_type);
  const priceTierFilter = useCityPulseStore((state) => state.filters.price_tier);
  const staffPicksOnly = useCityPulseStore((state) => state.filters.staff_picks_only);
  const savedOnly = useCityPulseStore((state) => state.filters.saved_only);
  const savedPostIds = useCityPulseStore((state) => state.savedPostIds);
  const mapNeighborhood = useCityPulseStore((state) => state.mapNeighborhood);
  const openNow = useCityPulseStore((state) => state.filters.open_now);
  const mapCenter = useCityPulseStore((state) => state.mapCenter);
  const mapZoom = useCityPulseStore((state) => state.mapZoom);
  const weeklyPick = useCityPulseStore((state) => state.weeklyPick);
  const mascotConfig = useCityPulseStore((state) => state.mascotConfig);
  const userLocation = useCityPulseStore((state) => state.userLocation);
  const currentUser = useCityPulseStore((state) => state.currentUser);
  const mobileSheetState = useCityPulseStore((state) => state.mobileSheetState);
  const userLocationMarkerRef = useRef<maplibregl.Marker | null>(null);
  const lastAvatarSigRef = useRef<string>("");
  const isProgrammaticFlightRef = useRef(false);
  const { requestLocation } = useGeolocation();

  // Unified smooth flight logic matching the venue pins on the map
  const flyToTarget = useCallback(
    (lng: number, lat: number, targetZoom = 15.5, reason = "unspecified") => {
      const map = mapInstance.current;
      if (!map) {
        console.info("[locate] flyTo skipped (no map).", { reason });
        return;
      }

      const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
      const containerH =
        map.getContainer()?.clientHeight ||
        (typeof window !== "undefined" ? window.innerHeight : 650);
      // Venue pins and weekly-pick need bottom clearance for the popup card above the bottom sheet.
      const isVenuePin =
        reason === "venue-pin" ||
        reason === "weekly-pick" ||
        (reason === "mapCenter-effect" && Boolean(useCityPulseStore.getState().selectedVenue));
      const bottomPad = isMobile
        ? isVenuePin
          ? Math.min(380, Math.max(260, Math.round(containerH * 0.45)))
          : Math.min(160, Math.max(80, Math.round(containerH * 0.20)))
        : 0;

      const from = map.getCenter();
      console.info("[locate] flyTo", {
        reason,
        target: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        from: `${from.lat.toFixed(6)}, ${from.lng.toFixed(6)}`,
        zoom: targetZoom,
        bottomPad,
      });

      isProgrammaticFlightRef.current = true;
      map.flyTo({
        center: [lng, lat],
        zoom: targetZoom,
        essential: true,
        // Explicit duration instead of speed + maxDuration: MapLibre derives the
        // duration from distance and clamps it to 0 once it exceeds maxDuration,
        // which made longer flights snap instantly while short ones glided. A
        // fixed duration makes every camera move (venue pins, feed "Map" pills and
        // the locate-me button) animate identically and smoothly.
        duration: 850,
        curve: 1.35,
        pitch: 0,
        padding: {
          top: isMobile ? 60 : 0,
          bottom: bottomPad,
          left: 0,
          right: 0,
        },
      });

      map.once("moveend", () => {
        isProgrammaticFlightRef.current = false;
      });
    },
    []
  );

  const handleLocateMe = useCallback(() => {
    const store = useCityPulseStore.getState();
    store.setIsLocating(true);
    console.info("[locate] button pressed", {
      storedUserLocation: store.userLocation,
      willFlyTo: store.userLocation
        ? [store.userLocation.lon, store.userLocation.lat]
        : "no stored fix — asking the browser only",
    });
    if (store.selectedVenue) {
      store.setSelectedVenue(null);
    }
    store.setMobileSheetState("peek");

    if (userLocation) {
      flyToTarget(userLocation.lon, userLocation.lat, 15.5, "locate-button");
    }
    requestLocation(true);
  }, [userLocation, flyToTarget, requestLocation]);

  // Trigger map resize on mobile sheet gestures and initial load
  useEffect(() => {
    if (!mapInstance.current) return;
    const handleResize = () => mapInstance.current?.resize();
    window.addEventListener("resize", handleResize);
    const timer = setTimeout(handleResize, 350);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, [mobileSheetState]);

  // Synchronize markers to MapLibre via reusable DOM Marker Pool
  const renderMarkers = useCallback(() => {
    const map = mapInstance.current;
    if (!map || !isMapReadyRef.current) return;

    const state = useCityPulseStore.getState();
    const currentVenues = state.venues;
    const currentPosts = state.foodPosts;
    const currentSelectedId = state.selectedVenue?.id;
    const currentMapCategory = state.mapCategory;
    const currentFeedCategory = state.feedCategory;
    const currentGroup = state.selectedGroup;
    const currentDishCat = state.selectedDishCategory;
    const currentSpotKind = state.selectedSpotKind;
    const currentCuisine = state.selectedCuisine;
    const currentDietary = state.selectedDietary;
    const currentSpotType = state.filters.spot_type;
    const currentPriceTier = state.filters.price_tier;
    const currentStaffPicks = state.filters.staff_picks_only;
    const currentSavedOnly = state.filters.saved_only;
    const currentSavedIds = state.savedPostIds;
    const currentNeighborhood = state.mapNeighborhood;
    const currentOpenNow = state.filters.open_now;

    // Group posts by spot_id for fast O(1) venue-level dish matching
    const postsByVenueId = new Map<string, typeof currentPosts>();
    for (const p of currentPosts) {
      if (p.is_archived || p.is_published === false) continue;
      const list = postsByVenueId.get(p.spot_id);
      if (list) list.push(p);
      else postsByVenueId.set(p.spot_id, [p]);
    }

    const overrideIconByVenueId = new Map<string, string>();

    // Filter venues based on all 7 active store filter axes
    const visibleVenues = currentVenues.filter((venue) => {
      // Suppress pins for ended pop-ups in grace period or expired pop-ups
      const popupStatus = getPopupStatus(venue);
      if (popupStatus.hideMapPin) return false;

      const venuePosts = postsByVenueId.get(venue.id) ?? [];
      const venueTax = resolveEntityTaxonomy(venue);

      // 1. Taxonomy: Child dish category, Parent group, or legacy Category
      if (currentDishCat) {
        const venueMatches =
          venueTax.dishCategory === currentDishCat ||
          venue.food_category === currentDishCat;
        const matchingPost = venuePosts.find((p) => {
          const pTax = resolveEntityTaxonomy(venue, p);
          return pTax.dishCategory === currentDishCat || p.category === currentDishCat;
        });
        if (!venueMatches && !matchingPost) return false;
        overrideIconByVenueId.set(venue.id, currentDishCat);
      } else if (currentGroup) {
        const venueMatches = venueTax.group.id === currentGroup;
        const matchingPost = venuePosts.find(
          (p) => resolveEntityTaxonomy(venue, p).group.id === currentGroup
        );
        if (!venueMatches && !matchingPost) return false;
        const explicitIcon = venue.icon ? resolveCustomIconKey(venue.icon) : null;
        const matchedDishKey = explicitIcon || (matchingPost
          ? resolveEntityTaxonomy(venue, matchingPost).dishCategory || matchingPost.category
          : venueTax.dishCategory || venue.food_category);
        if (matchedDishKey) {
          overrideIconByVenueId.set(venue.id, matchedDishKey);
        }
      } else if (currentMapCategory !== "all" || currentFeedCategory !== "all") {
        const activeCat =
          currentFeedCategory !== "all" ? currentFeedCategory : currentMapCategory;
        const venueMatches =
          venue.food_category === activeCat || venueTax.dishCategory === activeCat;
        const matchingPost = venuePosts.find(
          (p) =>
            p.category === activeCat ||
            resolveEntityTaxonomy(venue, p).dishCategory === activeCat
        );
        if (!venueMatches && !matchingPost) return false;
      }

      // 2. Spot Kind / Spot Type
      if (currentSpotKind && venueTax.spotKind !== currentSpotKind) {
        return false;
      }
      if (currentSpotType && currentSpotType !== "all") {
        const vType = venue.spot_type || "restaurant";
        if (vType !== currentSpotType) return false;
      }

      // 3. Cuisine
      if (currentCuisine) {
        const venueHasCuisine = (venueTax.cuisines as string[]).includes(currentCuisine);
        const postHasCuisine = venuePosts.some((p) =>
          (resolveEntityTaxonomy(venue, p).cuisines as string[]).includes(currentCuisine)
        );
        if (!venueHasCuisine && !postHasCuisine) return false;
      }

      // 4. Dietary
      if (currentDietary.length > 0) {
        const vTags = venue.dietary_tags ?? [];
        const venueMatchesDiet = currentDietary.every((t) => vTags.includes(t));
        const postMatchesDiet = venuePosts.some((p) => {
          const pTags = p.dietary_tags ?? vTags;
          return currentDietary.every((t) => pTags.includes(t));
        });
        if (!venueMatchesDiet && !postMatchesDiet) return false;
      }

      // 5. Price Tier
      if (currentPriceTier) {
        const venueMatchesPrice = venue.price_level === currentPriceTier;
        const postMatchesPrice = venuePosts.some((p) => {
          if (p.price_tier === currentPriceTier) return true;
          if (typeof p.price_nok === "number" && p.price_nok > 0) {
            const tier = p.price_nok <= 120 ? "$" : p.price_nok <= 250 ? "$$" : "$$$";
            return tier === currentPriceTier;
          }
          return false;
        });
        if (!venueMatchesPrice && !postMatchesPrice) return false;
      }

      // 6. Staff Picks & Saved
      if (currentStaffPicks) {
        const postPicked = venuePosts.some((p) => p.is_official_pick);
        if (!venue.is_official_pick && !postPicked) return false;
      }
      if (currentSavedOnly) {
        const postSaved = venuePosts.some((p) => currentSavedIds.has(p.id));
        if (!currentSavedIds.has(venue.id) && !postSaved) return false;
      }

      // 7. Neighborhood & Open Now
      if (
        currentNeighborhood !== "all" &&
        venue.neighborhood !== currentNeighborhood
      ) {
        return false;
      }
      if (currentOpenNow && !venue.open_now) return false;
      return true;
    });

    const visibleIds = new Set(visibleVenues.map((v) => v.id));
    const allStoreVenueIds = new Set(currentVenues.map((v) => v.id));

    // 1. Maintain pool: hide filtered markers (zero DOM destruction!), prune deleted venues
    markerPoolRef.current.forEach((entry, id) => {
      if (!allStoreVenueIds.has(id)) {
        entry.marker.remove();
        markerPoolRef.current.delete(id);
      } else if (!visibleIds.has(id)) {
        // Zero-allocation hide: pin remains anchored on map canvas without repainting
        entry.rootEl.style.display = "none";
      } else {
        entry.rootEl.style.display = "";
      }
    });

    // 2. Reconcile or create markers for visible venues
    const currentWeeklyVenueId = state.weeklyPick.venue_id;
    visibleVenues.forEach((venue) => {
      const isSelected = currentSelectedId === venue.id;
      const isWeeklyPickVenue = venue.id === currentWeeklyVenueId;
      const popupStatus = getPopupStatus(venue);
      const kitchenStatus = venue.kitchen_status?.status ?? "normal";
      const overrideIconKey = overrideIconByVenueId.get(venue.id) ?? null;
      const venueTax = resolveEntityTaxonomy(venue);
      const venueBadge = resolveVenueDisplayBadge(venue);
      const badgePinKey = resolveCustomIconKey(venueBadge.pinIcon) || "";
      const dishKey = resolveCustomIconKey(venueTax.dishCategory) || venueTax.dishCategory;
      const pinKey = `v4|${badgePinKey}|${venue.icon ?? ""}|${dishKey}|${venue.spot_type ?? ""}|${popupStatus.status}|${kitchenStatus}|${venue.food_category}|${venue.name}|${venue.popup_end_date ?? ""}|${overrideIconKey ?? ""}|${isWeeklyPickVenue ? "1" : "0"}`;

      let existing = markerPoolRef.current.get(venue.id);
      if (existing && existing.rootEl.dataset.pinKey !== pinKey) {
        existing.marker.remove();
        markerPoolRef.current.delete(venue.id);
        existing = undefined;
      }
      if (existing) {
        existing.marker.setLngLat([venue.longitude, venue.latitude]);
        existing.rootEl.style.display = "";
        applyPinState(existing.rootEl, isSelected);
        return;
      }

      const handleSelect = async () => {
        // Read the freshest venue snapshot so the handler never goes stale.
        const current =
          useCityPulseStore.getState().venues.find((v) => v.id === venue.id) ?? venue;
        try {
          const detail = await fetchVenueDetail(venue.id);
          setSelectedVenue(detail);
        } catch {
          setSelectedVenue({
            ...current,
            recent_checkins: [],
            recent_speed_tests: [],
          });
        }

        flyToTarget(current.longitude, current.latitude, 15.5, "venue-pin");
      };

      const el = createAquarellePinElement(
        venue,
        isSelected,
        handleSelect,
        overrideIconKey,
        isWeeklyPickVenue
      );
      el.dataset.pinKey = pinKey;

      const marker = new maplibregl.Marker({
        element: el,
        anchor: "center",
      })
        .setLngLat([venue.longitude, venue.latitude])
        .addTo(map);

      markerPoolRef.current.set(venue.id, { marker, rootEl: el });
    });
  }, [setSelectedVenue, flyToTarget]);

  // Floating "Pick of the Week" badge attached to the mascot marker
  const buildWeeklyBadge = useCallback((): HTMLDivElement => {
    const badge = document.createElement("div");
    badge.textContent = "Smakr Pick";
    Object.assign(badge.style, {
      position: "absolute",
      bottom: "calc(100% - 2px)",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#e84a27",
      color: "#ffffff",
      fontFamily: "var(--font-comico, sans-serif)",
      fontSize: "8px",
      fontWeight: "700",
      letterSpacing: "0.02em",
      whiteSpace: "nowrap",
      padding: "1.5px 6px",
      borderRadius: "999px",
      border: "none",
      boxShadow: "0 2px 8px rgba(232, 74, 39, 0.35)",
      pointerEvents: "none",
      zIndex: "45",
    } as Partial<CSSStyleDeclaration>);
    return badge;
  }, []);

  const openWeeklyVenue = useCallback(async () => {
    const state = useCityPulseStore.getState();
    const pick = state.weeklyPick;
    const [lng, lat] = pick.coords;
    const existingVenue = state.venues.find((v) => v.id === pick.venue_id);

    // Stay on the map view (never force-open the full-screen restaurant detail sheet)
    state.setIsVenueDetailModalOpen(false);
    if (state.mobileSheetState !== "peek") {
      state.setMobileSheetState("peek");
    }

    if (existingVenue) {
      try {
        const detail = await fetchVenueDetail(existingVenue.id);
        setSelectedVenue(detail);
      } catch {
        setSelectedVenue({
          ...existingVenue,
          recent_checkins: [],
          recent_speed_tests: [],
        });
      }
    } else {
      setSelectedVenue({
        id: pick.venue_id,
        name: pick.dish_name,
        address: "Oslo, Norway",
        neighborhood: "sentrum",
        latitude: lat,
        longitude: lng,
        city: "Oslo",
        place_type: "cafe",
        food_category: "coffee",
        cover_image_url: pick.dish_image,
        vibe: {
          seat_score: 8,
          seat_label: "Available",
          noise_score: 4,
          noise_label: "Lively",
          outlets_percentage: 50,
          outlets_label: "Available",
          overall_status: "optimal",
          overall_score: 8,
          active_checkins_count: 1,
          last_checkin_at: null,
          is_live: true,
          decay_factor: 1,
          avg_download_mbps: null,
          avg_ping_ms: null,
        },
        has_wifi: true,
        has_outlets: true,
        silent_zone: false,
        outdoor_seating: false,
        dog_friendly: false,
        open_late: false,
        baseline_seats: 10,
        baseline_noise: 5,
        baseline_outlets: true,
        recent_checkins: [],
        recent_speed_tests: [],
      });
    }

    flyToTarget(lng, lat, 15.6, "weekly-pick");
  }, [setSelectedVenue, flyToTarget]);

  // Anchor the official Smakr pointing mascot bust exclusively to the Weekly Pick (beside venue pin).
  const renderWeeklyMarker = useCallback(() => {
    const map = mapInstance.current;
    if (!map || !isMapReadyRef.current) return;

    const state = useCityPulseStore.getState();
    const pick = state.weeklyPick;
    const [lng, lat] = pick.coords;
    if (typeof lng !== "number" || typeof lat !== "number") return;

    // Check if any filter is active and whether the Weekly Pick venue passes the active filter
    const hasActiveFilter =
      Boolean(state.selectedDishCategory) ||
      Boolean(state.selectedGroup) ||
      state.mapCategory !== "all" ||
      state.feedCategory !== "all" ||
      Boolean(state.selectedSpotKind) ||
      Boolean(state.selectedCuisine) ||
      state.selectedDietary.length > 0 ||
      Boolean(state.filters.spot_type && state.filters.spot_type !== "all") ||
      Boolean(state.filters.price_tier) ||
      Boolean(state.filters.staff_picks_only) ||
      Boolean(state.filters.saved_only) ||
      state.mapNeighborhood !== "all" ||
      Boolean(state.filters.open_now);

    if (hasActiveFilter) {
      const pickPoolEntry = markerPoolRef.current.get(pick.venue_id);
      const isPickVenueVisible = pickPoolEntry
        ? pickPoolEntry.rootEl.style.display !== "none"
        : false;
      if (!isPickVenueVisible) {
        if (weeklyMarkerRef.current) {
          weeklyMarkerRef.current.getElement().style.display = "none";
        }
        return;
      }
    }

    // Shared sizing formula with "YOU" bust so both busts match across all zoom levels
    const currentZoom = map.getZoom();
    const { width: bustWidth, height: bustHeight } = getMapMascotDimensions(currentZoom);

    // Screen-space collision avoidance against the user's "YOU" avatar marker
    let placeRight = false;
    if (state.userLocation) {
      try {
        const youPt = map.project([state.userLocation.lon, state.userLocation.lat]);
        const pickPt = map.project([lng, lat]);
        if (Math.hypot(youPt.x - pickPt.x, youPt.y - pickPt.y) < 58) {
          placeRight = youPt.x < pickPt.x;
        }
      } catch {}
    }

    const updateInnerPlacement = (
      inner: HTMLElement,
      badge: HTMLElement,
      imgEl?: HTMLImageElement | null
    ) => {
      // In smakr-pick-pointing.svg, index fingertip is at (0.9387 * width, 0.5145 * height).
      // The 50px weekly pick puck radius is 25px, with inner food icon extending to radius 21px.
      const leftOffset = placeRight
        ? 16 - Math.round(0.0613 * bustWidth)
        : -16 - Math.round(0.9387 * bustWidth);
      const topOffset = -Math.round(0.5145 * bustHeight) - 2;
      inner.style.left = `${leftOffset}px`;
      inner.style.top = `${topOffset}px`;
      inner.style.transform = "none";
      inner.style.transformOrigin = "center center";
      badge.style.transform = "translateX(-50%)";
      if (imgEl) {
        imgEl.style.transform = placeRight ? "scaleX(-1)" : "none";
      }
    };

    if (!weeklyMarkerRef.current) {
      // Root element is owned by MapLibre for GPS projection: MUST be absolute top:0 left:0
      // NEVER set style.transform on root!
      const root = document.createElement("div");
      root.className = "maplibregl-marker weekly-pick-marker-root";
      root.style.position = "absolute";
      root.style.top = "0";
      root.style.left = "0";
      root.style.width = "0px";
      root.style.height = "0px";
      root.style.margin = "0";
      root.style.padding = "0";
      root.style.pointerEvents = "none";
      root.style.zIndex = "45";
      root.style.display = "block";

      const inner = document.createElement("div");
      inner.className =
        "weekly-pick-bust-inner relative flex flex-col items-center group cursor-pointer select-none pointer-events-auto transition-transform duration-200";
      inner.style.position = "absolute";
      inner.style.zIndex = "45";

      const badge = buildWeeklyBadge();
      inner.appendChild(badge);

      const bustContainer = document.createElement("div");
      bustContainer.style.width = `${bustWidth}px`;
      bustContainer.style.height = `${bustHeight}px`;
      bustContainer.style.position = "relative";
      bustContainer.style.filter = "drop-shadow(0 6px 14px rgba(24, 22, 21, 0.22))";

      bustContainer.innerHTML = `
        <img
          src="/mascot/smakr-pick-pointing.svg"
          alt="Smakr Pick"
          width="${bustWidth}"
          height="${bustHeight}"
          style="display:block; width:100%; height:100%; object-fit:contain; pointer-events:none;"
        />
      `;

      inner.appendChild(bustContainer);
      updateInnerPlacement(inner, badge, bustContainer.querySelector("img"));

      inner.addEventListener("click", (e) => {
        e.stopPropagation();
        void openWeeklyVenue();
      });

      root.appendChild(inner);

      const marker = new maplibregl.Marker({
        element: root,
        anchor: "center",
      })
        .setLngLat([lng, lat])
        .addTo(map);

      weeklyMarkerRef.current = marker;
    } else {
      // Re-anchor to freshest coordinates and update inner offsets without touching root.style.transform
      weeklyMarkerRef.current.setLngLat([lng, lat]);
      const root = weeklyMarkerRef.current.getElement();
      root.className = "maplibregl-marker weekly-pick-marker-root";
      root.style.position = "absolute";
      root.style.top = "0";
      root.style.left = "0";
      root.style.width = "0px";
      root.style.height = "0px";
      root.style.margin = "0";
      root.style.padding = "0";
      root.style.pointerEvents = "none";
      root.style.zIndex = "45";
      root.style.display = "block";
      root.innerHTML = "";

      const inner = document.createElement("div");
      inner.className =
        "weekly-pick-bust-inner relative flex flex-col items-center group cursor-pointer select-none pointer-events-auto transition-transform duration-200";
      inner.style.position = "absolute";
      inner.style.zIndex = "45";

      const badge = buildWeeklyBadge();
      inner.appendChild(badge);

      const bustContainer = document.createElement("div");
      bustContainer.style.width = `${bustWidth}px`;
      bustContainer.style.height = `${bustHeight}px`;
      bustContainer.style.position = "relative";
      bustContainer.style.filter = "drop-shadow(0 6px 14px rgba(24, 22, 21, 0.22))";

      bustContainer.innerHTML = `
        <img
          src="/mascot/smakr-pick-pointing.svg"
          alt="Smakr Pick"
          width="${bustWidth}"
          height="${bustHeight}"
          style="display:block; width:100%; height:100%; object-fit:contain; pointer-events:none;"
        />
      `;

      inner.appendChild(bustContainer);
      updateInnerPlacement(inner, badge, bustContainer.querySelector("img"));

      inner.addEventListener("click", (e) => {
        e.stopPropagation();
        void openWeeklyVenue();
      });

      root.appendChild(inner);
    }
  }, [buildWeeklyBadge, openWeeklyVenue]);

  // 1. Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const styles = getMapStyles();
    const styleUrl = styles[activeTheme];

    const currentCenter = useCityPulseStore.getState().mapCenter;
    const currentZoom = useCityPulseStore.getState().mapZoom;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: currentCenter,
      zoom: currentZoom,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      maxPitch: 60,
      minZoom: 9,
      maxZoom: 19,
      doubleClickZoom: true,
    });

    mapInstance.current = map;
    if (typeof window !== "undefined") {
      (window as unknown as { __cityPulseMap?: maplibregl.Map }).__cityPulseMap = map;
    }
    const instanceId = ++MAP_INSTANCE_SEQ;
    console.info("[locate] map created", {
      instanceId,
      initialCenter: `${mapCenter[1].toFixed(6)}, ${mapCenter[0].toFixed(6)}`,
      initialZoom: mapZoom,
    });

    // Attach marker DOM only when the main thread is idle so the MapLibre boot
    // never competes with hydration/paint for frame budget. Falls back to rAF.
    const attachMarkers = () => {
      renderMarkers();
      renderWeeklyMarker();
    };
    const scheduleMarkerAttachment = () => {
      const ric = (
        window as unknown as {
          requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
        }
      ).requestIdleCallback;
      if (typeof ric === "function") ric(attachMarkers, { timeout: 400 });
      else requestAnimationFrame(attachMarkers);
    };

    // Guarded resize: `map.resize()` can synchronously re-enter `moveend`, which
    // previously recursed into "Maximum call stack size exceeded". The flag is
    // released on the next macrotask so genuine later resizes still work.
    let resizing = false;
    const safeResize = () => {
      if (resizing || !mapInstance.current) return;
      resizing = true;
      try {
        map.resize();
      } finally {
        setTimeout(() => {
          resizing = false;
        }, 0);
      }
    };

    map.on("load", () => {
      isMapReadyRef.current = true;
      setIsMapReady(true);
      safeResize();
      scheduleMarkerAttachment();
      // Catch a late layout pass (mobile browser chrome / sheet settling).
      requestAnimationFrame(() => safeResize());
    });

    map.on("styledata", () => {
      map.triggerRepaint();
    });

    map.on("style.load", () => {
      if (!isMapReadyRef.current) return;
      safeResize();
      scheduleMarkerAttachment();
    });

    // Auto-dismiss the floating venue card when the user zooms OUT past city
    // level. Guard on a *decreasing* zoom so the programmatic fly-IN (from a
    // zoomed-out view) doesn't immediately clear the card that was just opened.
    let lastZoom = map.getZoom();
    map.on("zoom", () => {
      const z = map.getZoom();
      const zoomingOut = z < lastZoom;
      lastZoom = z;
      if (z < 13.8 && zoomingOut && !isProgrammaticFlightRef.current) {
        const state = useCityPulseStore.getState();
        if (state.selectedVenue) {
          state.setSelectedVenue(null);
        }
      }
      if (userLocationMarkerRef.current) {
        const el = userLocationMarkerRef.current.getElement();
        if (el) applyPuckZoomScale(el, z, mapContainer.current?.clientWidth);
      }
      renderWeeklyMarker();
    });

    // After a large pan / pitch, force a repaint so no canvas region is left
    // blank. IMPORTANT: never call `map.resize()` here — resize re-enters
    // `moveend`, which recurses/loops and can leave the canvas half-rendered.
    map.on("moveend", () => {
      map.triggerRepaint();
      renderWeeklyMarker();
      if (process.env.NODE_ENV !== "production") {
        const c = map.getCenter();
        console.info("[locate] camera settled", {
          instanceId,
          center: `${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}`,
          zoom: +map.getZoom().toFixed(2),
        });
      }
    });

    // Single click on empty map: deselects venue card and minimizes feed to peek if expanded
    map.on("click", () => {
      const state = useCityPulseStore.getState();
      if (state.selectedVenue || state.bottomSheetOpen) {
        state.setSelectedVenue(null);
        state.setBottomSheetOpen(false);
      }
      if (state.mobileSheetState !== "peek") {
        state.setMobileSheetState("peek");
      }
    });

    const handleResize = () => {
      safeResize();
      if (userLocationMarkerRef.current && mapInstance.current) {
        const el = userLocationMarkerRef.current.getElement();
        if (el) {
          applyPuckZoomScale(
            el,
            mapInstance.current.getZoom(),
            mapContainer.current?.clientWidth
          );
        }
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (mapContainer.current) resizeObserver.observe(mapContainer.current);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      markerPoolRef.current.forEach(({ marker }) => marker.remove());
      markerPoolRef.current.clear();
      if (weeklyMarkerRef.current) weeklyMarkerRef.current.remove();
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
        userLocationMarkerRef.current = null;
      }
      isMapReadyRef.current = false;
      setIsMapReady(false);
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // 2. Re-render / filter markers when venues or any active store filter changes (selection decoupled)
  useEffect(() => {
    renderMarkers();
    renderWeeklyMarker();
  }, [
    venues,
    foodPosts,
    mapCategory,
    feedCategory,
    selectedGroup,
    selectedDishCategory,
    selectedSpotKind,
    selectedCuisine,
    selectedDietary,
    spotTypeFilter,
    priceTierFilter,
    staffPicksOnly,
    savedOnly,
    savedPostIds,
    mapNeighborhood,
    openNow,
    weeklyPick.venue_id,
    renderMarkers,
    renderWeeklyMarker,
  ]);

  // 2.1 Decoupled O(1) selection highlight update — never loops or rebuilds markers
  useEffect(() => {
    const currentId = selectedVenue?.id ?? null;
    const prevId = prevSelectedVenueIdRef.current;
    if (prevId === currentId) return;

    if (prevId) {
      const prevEntry = markerPoolRef.current.get(prevId);
      if (prevEntry) {
        applyPinState(prevEntry.rootEl, false);
      }
    }
    if (currentId) {
      const nextEntry = markerPoolRef.current.get(currentId);
      if (nextEntry) {
        applyPinState(nextEntry.rootEl, true);
      }
    }
    prevSelectedVenueIdRef.current = currentId;
  }, [selectedVenue]);

  // 2.5 Auto-fit map camera ONLY when the user actively changes the category filter.
  // Never fire on mount, and never fire on venue list updates or geolocation fixes.
  const prevCategoryRef = useRef<string>(mapCategory);
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (prevCategoryRef.current === mapCategory) return;
    prevCategoryRef.current = mapCategory;

    const venues = useCityPulseStore.getState().venues;

    if (mapCategory === "all") {
      map.flyTo({
        center: [10.7516, 59.9171],
        zoom: 13.5,
        duration: 800,
        essential: true,
      });
      return;
    }

    const matching = venues.filter((v) => v.food_category === mapCategory);

    const validSpots = matching.filter(
      (v) =>
        typeof v.longitude === "number" &&
        !isNaN(v.longitude) &&
        typeof v.latitude === "number" &&
        !isNaN(v.latitude)
    );

    if (validSpots.length === 0) return;

    if (validSpots.length === 1) {
      map.flyTo({
        center: [validSpots[0].longitude, validSpots[0].latitude],
        zoom: 15.5,
        duration: 800,
        essential: true,
      });
      return;
    }

    try {
      const bounds = new maplibregl.LngLatBounds(
        [validSpots[0].longitude, validSpots[0].latitude],
        [validSpots[0].longitude, validSpots[0].latitude]
      );
      for (let i = 1; i < validSpots.length; i++) {
        bounds.extend([validSpots[i].longitude, validSpots[i].latitude]);
      }

      const container = map.getContainer();
      const w = container?.clientWidth || (typeof window !== "undefined" ? window.innerWidth : 360);
      const h = container?.clientHeight || (typeof window !== "undefined" ? window.innerHeight : 600);

      // Ensure padding doesn't exceed container dimensions to prevent NaN bounds
      const padTop = Math.max(20, Math.min(60, Math.floor(h * 0.1)));
      const padBottom = Math.max(30, Math.min(100, Math.floor(h * 0.2)));
      const padSide = Math.max(20, Math.min(45, Math.floor(w * 0.1)));

      if (h - padTop - padBottom > 60 && w - padSide * 2 > 60) {
        map.fitBounds(bounds, {
          padding: { top: padTop, bottom: padBottom, left: padSide, right: padSide },
          maxZoom: 15.2,
          duration: 850,
        });
      } else {
        const center = bounds.getCenter();
        map.flyTo({
          center: [center.lng, center.lat],
          zoom: 13.8,
          duration: 800,
          essential: true,
        });
      }
    } catch (err) {
      console.warn("Map auto-fit failed gracefully:", err);
    }
  }, [mapCategory]);

  // 3. Switch style safely on theme change
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    const styles = getMapStyles();
    const newStyle = styles[activeTheme];
    map.setStyle(newStyle);
  }, [activeTheme]);

  // 4. Synchronize MapLibre camera with store `mapCenter` & `mapZoom`
  useEffect(() => {
    console.info("[locate] mapCenter effect fired", {
      mapCenter: `${mapCenter[1].toFixed(6)}, ${mapCenter[0].toFixed(6)}`,
      mapZoom,
      hasStoredUserLocation: Boolean(userLocation),
    });
    flyToTarget(mapCenter[0], mapCenter[1], mapZoom, "mapCenter-effect");
  }, [mapCenter, mapZoom, flyToTarget]);

  // 4b. Synchronize User Avatar Geolocation Puck
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReadyRef.current) return;

    if (!userLocation) {
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
        userLocationMarkerRef.current = null;
        lastAvatarSigRef.current = "";
      }
      return;
    }

    const { lat, lon } = userLocation;

    const isOfficial =
      currentUser?.role === "admin" || Boolean(currentUser?.is_official);
    const avatarSig = `${currentUser?.avatar_url || ""}:${currentUser?.role || ""}:${JSON.stringify(currentUser?.avatar_config || {})}:${JSON.stringify(mascotConfig || {})}`;

    // If marker already exists and avatar identity has not changed, just update position smoothly
    if (userLocationMarkerRef.current && lastAvatarSigRef.current === avatarSig) {
      userLocationMarkerRef.current.setLngLat([lon, lat]);
      renderWeeklyMarker();
      return;
    }

    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.remove();
      userLocationMarkerRef.current = null;
    }

    lastAvatarSigRef.current = avatarSig;
    const hasCustomAvatar = Boolean(
      currentUser?.avatar_config ||
      (currentUser?.avatar_url && currentUser.avatar_url.startsWith("data:image/svg+xml"))
    );
    const el = buildUserAvatarPuckElement(
      currentUser?.avatar_url,
      currentUser?.avatar_config,
      mascotConfig,
      Boolean(isOfficial && !hasCustomAvatar)
    );
    applyPuckZoomScale(el, map.getZoom());

    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const latestLoc = useCityPulseStore.getState().userLocation;
      const targetLon = latestLoc ? latestLoc.lon : lon;
      const targetLat = latestLoc ? latestLoc.lat : lat;
      map.flyTo({
        center: [targetLon, targetLat],
        zoom: Math.max(map.getZoom(), 15.2),
        duration: 650,
        essential: true,
      });
    });

    const marker = new maplibregl.Marker({
      element: el,
      anchor: "bottom",
    })
      .setLngLat([lon, lat])
      .addTo(map);

    userLocationMarkerRef.current = marker;
    renderWeeklyMarker();
  }, [
    userLocation,
    currentUser?.avatar_url,
    currentUser?.avatar_config,
    currentUser?.handle,
    currentUser?.role,
    mascotConfig,
    isMapReady,
  ]);

  // 5. Weekly Pick mascot anchor (re-anchors + recolours on dispatch/config change)
  useEffect(() => {
    renderWeeklyMarker();
    const onBrandUpdate = () => renderWeeklyMarker();
    window.addEventListener("smakr:brand-mascot-updated", onBrandUpdate);
    return () => window.removeEventListener("smakr:brand-mascot-updated", onBrandUpdate);
  }, [weeklyPick, mascotConfig, renderWeeklyMarker]);

  // 6. Synchronize active venue popup card directly under marker pin
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReady) return;

    if (venuePopupRef.current) {
      venuePopupRef.current.remove();
      venuePopupRef.current = null;
    }

    if (!selectedVenue) return;

    const popupNode = document.createElement("div");
    popupNode.className = "smakr-map-venue-card";

    const ratingVal = selectedVenue.google_rating != null
      ? selectedVenue.google_rating.toFixed(1)
      : "4.8";

    const openStatus = getVenueLiveOpenStatus(selectedVenue);

    const distanceText = selectedVenue.distance_meters
      ? formatDistance(selectedVenue.distance_meters)
      : "";

    const addressText = selectedVenue.address
      ? selectedVenue.address
      : selectedVenue.neighborhood
      ? `${selectedVenue.neighborhood}, Oslo`
      : "Oslo";

    const curatedDishPhoto = useCityPulseStore
      .getState()
      .foodPosts.find((p) => p.spot_id === selectedVenue.id && p.image_url && !p.is_archived)?.image_url;
    const imageUrl =
      curatedDishPhoto || selectedVenue.cover_image_url || "/images/placeholder-venue.jpg";
    const googleMapsUrl = getDirectionsUrl(selectedVenue);

    const isWeeklyPickVenue = selectedVenue.id === weeklyPick.venue_id;
    const displayImage = isWeeklyPickVenue
      ? weeklyPick.dish_image || imageUrl
      : imageUrl;

    const taxonomy = resolveEntityTaxonomy(selectedVenue);
    const venueBadge = resolveVenueDisplayBadge(selectedVenue);
    const spotKindSvg = (FOOD_PIN_SVG_MAP[taxonomy.spotKind] || FOOD_PIN_SVG_MAP.restaurant)
      .replace('width="20" height="20"', 'width="18" height="18"');
    const matchingFoodPost = useCityPulseStore.getState().foodPosts.find(
      (p) => (p.spot_id === selectedVenue.id || p.spot_name === selectedVenue.name) && p.dish_name && !p.is_archived
    );
    const signatureDishName = isWeeklyPickVenue
      ? weeklyPick.dish_name
      : (selectedVenue.signature_dishes && selectedVenue.signature_dishes[0]) ||
        matchingFoodPost?.dish_name ||
        (selectedVenue.vibe_signals as any)?.signature_dish ||
        (selectedVenue.vibe_signals as any)?.dish_highlight ||
        taxonomy.dishCategory ||
        taxonomy.spotLabel ||
        "";
    const signaturePrice = isWeeklyPickVenue && weeklyPick.price_nok
      ? `${weeklyPick.price_nok} kr`
      : matchingFoodPost?.price_nok
      ? `${matchingFoodPost.price_nok} kr`
      : "";

    const dishIconKey = resolveDishIconKey(signatureDishName, selectedVenue.food_category);
    const dishIconDisplay = getIconDisplay(dishIconKey);
    const dishChipIconHtml =
      dishIconDisplay.type === "webp"
        ? `<img src="${dishIconDisplay.value}" width="16" height="16" style="object-fit:contain;display:inline-block;" alt="${dishIconDisplay.label}"/>`
        : `<span style="display:inline-flex;width:16px;height:16px;align-items:center;justify-content:center;">${dishIconDisplay.value}</span>`;

    popupNode.innerHTML = `
      <div style="
        width: 290px;
        max-width: 88vw;
        display: flex;
        flex-direction: column;
        gap: 6px;
        animation: smakrPopupEnter 0.24s cubic-bezier(0.22, 1, 0.36, 1) both;
      ">
        <style>
          @keyframes smakrPopupEnter {
            from { opacity: 0; transform: translateY(-6px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        </style>

        <div style="
          background: rgba(250, 247, 242, 0.94);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid ${isWeeklyPickVenue ? "rgba(232, 74, 39, 0.35)" : "rgba(255, 255, 255, 0.65)"};
          border-radius: 18px;
          box-shadow: 0 12px 32px rgba(24, 22, 21, 0.16);
          padding: 10px;
          position: relative;
          font-family: inherit;
        ">
        <button id="smakr-popup-close-btn" style="
          position: absolute;
          top: 8px;
          right: 8px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(24, 22, 21, 0.07);
          border: none;
          color: #57534E;
          font-size: 11px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        ">✕</button>

        <!-- Header: Flag + ONE Main Tag (e.g. 🇮🇳 INDIAN, 🇻🇳 VIETNAMESE, 🇯🇵 MATCHA) + Price Level -->
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:7px;padding-bottom:5px;border-bottom:1px solid rgba(24,22,21,0.06);padding-right:24px;">
          ${venueBadge.flag ? `
            <span style="display:inline-flex;align-items:center;justify-content:center;font-size:14px;line-height:1;flex-shrink:0;">
              ${venueBadge.flag}
            </span>
          ` : ""}
          <span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.04em;color:#e84a27;font-family:var(--font-comico, sans-serif);">
            ${venueBadge.mainTag}
          </span>
          ${selectedVenue.price_level ? `
            <span style="font-size:10px;color:#78716c;font-weight:700;">
              · ${selectedVenue.price_level}
            </span>
          ` : ""}
        </div>

        <div style="display: flex; gap: 10px; align-items: center;">
          <div style="
            position: relative;
            width: 68px;
            height: 68px;
            border-radius: 13px;
            overflow: hidden;
            flex-shrink: 0;
            background: #e4d9c8;
            border: 1px solid rgba(24, 22, 21, 0.08);
          ">
            <img src="${displayImage}" alt="${selectedVenue.name}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>

          <div style="flex: 1; min-width: 0;">
            ${
              isWeeklyPickVenue
                ? `<div style="margin-bottom: 2px;">
                    <span style="
                      background: #E84A27;
                      color: #FFFFFF;
                      font-family: var(--font-comico, sans-serif);
                      font-size: 9px;
                      font-weight: bold;
                      letter-spacing: 0.04em;
                      text-transform: uppercase;
                      padding: 1.5px 6.5px;
                      border-radius: 999px;
                      display: inline-block;
                      border: none;
                    ">Smakr Pick</span>
                  </div>`
                : ""
            }

            <div style="display: flex; align-items: baseline; justify-content: space-between; gap: 6px;">
              <span style="
                font-family: var(--font-comico, sans-serif);
                font-size: 14.5px;
                color: #181615;
                font-weight: bold;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              ">
                ${selectedVenue.name}
              </span>
              ${
                signaturePrice
                  ? `<span style="font-size: 11px; font-weight: 800; color: #e84a27; flex-shrink: 0; font-family: var(--font-comico, sans-serif);">${signaturePrice}</span>`
                  : ""
              }
            </div>

            <div style="display: flex; align-items: center; gap: 4px; margin-top: 2px; flex-wrap: wrap;">
              <span style="
                background: #181615;
                color: #ffffff;
                font-size: 9.5px;
                font-weight: bold;
                padding: 1px 5px;
                border-radius: 5px;
                display: inline-flex;
                align-items: center;
                gap: 2px;
              ">
                <span style="color: #f59e0b;">★</span> ${ratingVal}
              </span>
              <span style="
                background: ${openStatus.isOpen ? 'rgba(236, 253, 245, 0.85)' : 'rgba(254, 242, 242, 0.85)'};
                color: ${openStatus.isOpen ? '#047857' : '#b91c1c'};
                border: 1px solid ${openStatus.isOpen ? '#a7f3d0' : '#fecaca'};
                font-size: 9px;
                font-weight: 700;
                padding: 1px 6px;
                border-radius: 999px;
                display: inline-flex;
                align-items: center;
                gap: 3px;
              ">
                <span style="width: 5px; height: 5px; border-radius: 50%; background: ${openStatus.isOpen ? '#10b981' : '#ef4444'};"></span>
                ${openStatus.statusText}
              </span>
              ${distanceText ? `<span style="font-size: 9.5px; color: #059669; font-weight: 600;">· ${distanceText}</span>` : ""}
            </div>

            <!-- Signature Dish Chip -->
            ${
              signatureDishName
                ? `<div style="display:flex;align-items:center;gap:4px;margin-top:4px;padding:2px 6px;border-radius:8px;background:rgba(255,255,255,0.7);border:1px solid rgba(24,22,21,0.08);">
                    <span style="display:inline-flex;align-items:center;flex-shrink:0;">${dishChipIconHtml}</span>
                    <span style="font-size:10px;font-weight:700;color:#181615;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;">
                      ${signatureDishName}
                    </span>
                  </div>`
                : ""
            }
          </div>
        </div>

            <div style="
              font-size: 10.5px;
              color: #57534E;
              margin-top: 5px;
              line-height: 1.3;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            ">
              ${isWeeklyPickVenue && weeklyPick.dish_name ? `✦ ${weeklyPick.dish_name} · ${addressText}` : `📍 ${addressText}`}
            </div>
        </div>

        <!-- Floating Action Buttons (Outside card, matching exact card width) -->
        <div style="display: flex; gap: 7px; width: 100%; box-sizing: border-box;">
          <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="
            flex: 1;
            height: 36px;
            padding: 0 10px;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.94);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(24, 22, 21, 0.12);
            color: #181615;
            font-size: 11.5px;
            font-weight: 700;
            text-align: center;
            text-decoration: none;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            box-shadow: 0 4px 14px rgba(24, 22, 21, 0.08);
            box-sizing: border-box;
            cursor: pointer;
          ">
            <span>Map</span> ↗
          </a>

          <button id="smakr-popup-menu-btn" style="
            flex: 1.25;
            height: 36px;
            padding: 0 12px;
            border-radius: 12px;
            background: #e84a27;
            border: none;
            color: #ffffff;
            font-family: var(--font-comico, sans-serif);
            font-size: 11.5px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            box-shadow: 0 4px 14px rgba(232, 74, 39, 0.32);
            box-sizing: border-box;
          ">
            <span>Details</span> →
          </button>
        </div>
      </div>
    `;

    popupNode.querySelector("#smakr-popup-close-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      setSelectedVenue(null);
    });

    popupNode.querySelector("#smakr-popup-menu-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      setIsVenueDetailModalOpen(true);
    });

    const popup = new maplibregl.Popup({
      offset: isWeeklyPickVenue ? [0, 14] : [0, 22],
      anchor: "top",
      closeButton: false,
      closeOnClick: false,
      focusAfterOpen: false,
      className: "smakr-pin-card-popup",
    })
      .setLngLat([selectedVenue.longitude, selectedVenue.latitude])
      .setDOMContent(popupNode);

    venuePopupRef.current = popup;

    const resetContainerScroll = () => {
      const container = map.getContainer();
      let node: HTMLElement | null = container;
      while (node) {
        if (node.scrollLeft !== 0) node.scrollLeft = 0;
        node = node.parentElement;
      }
    };

    // Mount only once the camera has landed so the card never starts off-screen.
    const attach = () => {
      if (venuePopupRef.current !== popup) return;
      popup.addTo(map);
      const popupEl = popup.getElement();
      if (popupEl) {
        popupEl.style.zIndex = "120";
      }
      resetContainerScroll();
    };
    if (map.isMoving()) {
      map.once("moveend", attach);
    } else {
      requestAnimationFrame(() => (map.isMoving() ? map.once("moveend", attach) : attach()));
    }

    return () => {
      map.off("moveend", attach);
    };
  }, [selectedVenue, isMapReady, setSelectedVenue, setIsVenueDetailModalOpen]);

  function cycleTheme() {
    if (activeTheme === "streets") setActiveTheme("dataviz");
    else if (activeTheme === "dataviz") setActiveTheme("aquarelle");
    else setActiveTheme("streets");
  }

  return (
    <div className="relative w-full h-full min-h-[500px] flex-1 overflow-hidden bg-[var(--background,#f6f3ee)]">
      {/* Shared SVG Die-Cut Sticker Filters for Map Markers */}
      <svg width="0" height="0" style={{ position: "absolute", pointerEvents: "none", overflow: "visible" }} aria-hidden="true">
        <defs>
          {/* Default Unselected Sticker Outline (#FAF7F2 Warm Cream, 1.8px stroke + subtle ground shadow) */}
          <filter id="smakr-diecut-default" x="-35%" y="-35%" width="170%" height="170%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="0.9" result="dilated" />
            <feFlood floodColor="#FAF7F2" result="strokeColor" />
            <feComposite in="strokeColor" in2="dilated" operator="in" result="stroke" />
            <feDropShadow in="stroke" dx="0" dy="2.5" stdDeviation="1.8" floodColor="#181615" floodOpacity="0.30" result="shadow" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="stroke" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Selected Active Sticker Outline: Solid Cream Inner Stroke + Thin Delicate Orange Outer Rim + Warm Glow */}
          <filter id="smakr-diecut-selected" x="-45%" y="-45%" width="190%" height="190%">
            {/* Thin delicate outer orange rim (~0.7px outer whisper) */}
            <feMorphology in="SourceAlpha" operator="dilate" radius="1.5" result="dilatedOuter" />
            <feFlood floodColor="#E84A27" floodOpacity="0.75" result="orangeColor" />
            <feComposite in="orangeColor" in2="dilatedOuter" operator="in" result="orangeRim" />
            {/* Soft warm orange elevation halo */}
            <feDropShadow in="orangeRim" dx="0" dy="2.5" stdDeviation="2.4" floodColor="#E84A27" floodOpacity="0.32" result="orangeGlow" />

            {/* Clean solid warm cream (#FAF7F2) inner sticker stroke (1.8px) */}
            <feMorphology in="SourceAlpha" operator="dilate" radius="0.9" result="dilatedInner" />
            <feFlood floodColor="#FAF7F2" result="whiteColor" />
            <feComposite in="whiteColor" in2="dilatedInner" operator="in" result="whiteStroke" />

            {/* Merge: Glow -> Thin Orange Rim -> Solid Cream Stroke -> Original Graphic */}
            <feMerge>
              <feMergeNode in="orangeGlow" />
              <feMergeNode in="orangeRim" />
              <feMergeNode in="whiteStroke" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Map Canvas — kept mounted (opacity only) so MapLibre can measure it */}
      <div
        ref={mapContainer}
        className={`absolute inset-0 w-full h-full ${isMapReady ? "opacity-100" : "opacity-0"}`}
        style={{
          width: "100%",
          height: "100%",
          // Own GPU layer. Without this the WebGL canvas can be composited at a
          // stale size (partially painted / "blocked" regions) on mobile GPUs.
          transform: "translateZ(0)",
          willChange: "transform",
        }}
      />

      {/* Style Switcher Pills (Bottom-left on desktop only, completely clear of filters and feed) */}
      <div className="hidden lg:flex absolute left-4 bottom-6 z-20 items-center gap-1 p-1 rounded-xl bg-[#FAF7F2]/55 dark:bg-[#181615]/55 backdrop-blur-md border border-white/40 shadow-sm text-xs">
        <button
          onClick={() => setActiveTheme("streets")}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
            activeTheme === "streets"
              ? "bg-zinc-900 text-white shadow-xs"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          Streets
        </button>
        <button
          onClick={() => setActiveTheme("dataviz")}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
            activeTheme === "dataviz"
              ? "bg-zinc-900 text-white shadow-xs"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          Dataviz
        </button>
        <button
          onClick={() => setActiveTheme("aquarelle")}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
            activeTheme === "aquarelle"
              ? "bg-zinc-900 text-white shadow-xs"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          Aquarelle
        </button>
      </div>

      {/* Original Floating Controls (Find me + Plus/Minus in original top-right spot) */}
      <MapControls
        onZoomIn={() => mapInstance.current?.zoomIn()}
        onZoomOut={() => mapInstance.current?.zoomOut()}
        onLocate={handleLocateMe}
        onToggleTheme={cycleTheme}
        isDarkTheme={activeTheme === "aquarelle"}
      />
    </div>
  );
}
