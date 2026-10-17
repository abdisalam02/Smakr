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
import { FOOD_PIN_SVG_MAP } from "@/components/food/FoodIcons";
import { formatDistance } from "@/lib/math";
import { getPopupStatus } from "@/lib/popupUtils";
import { getVenueLiveOpenStatus } from "@/lib/openingHours";
import {
  buildOpenPeepsSvg,
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

/**
 * Updates a pin's selected/unselected visuals IN PLACE. Markers are created once
 * and only mutated afterwards, so store updates never tear down and rebuild the
 * marker DOM (which caused layout thrash and frame drops).
 */
function applyPinState(root: HTMLElement, isSelected: boolean) {
  root.dataset.selected = isSelected ? "1" : "0";
  root.style.zIndex = isSelected ? "35" : "15";
  const visual = root.querySelector<HTMLElement>(".pin-visual");
  if (visual) visual.style.transform = isSelected ? "scale(1.16)" : "scale(1.0)";
  const puck = root.querySelector<HTMLElement>(".smakr-map-puck");
  const iconContainer = root.querySelector<HTMLElement>(".smakr-puck-icon");
  const arrow = root.querySelector<HTMLElement>(".smakr-puck-arrow");
  if (puck) {
    if (isSelected) {
      puck.style.background = "rgba(255, 250, 244, 0.88)";
      puck.style.border = "2px solid #E84A27";
      puck.style.boxShadow = "0 0 0 4px rgba(232, 74, 39, 0.22), 0 6px 16px rgba(232, 74, 39, 0.30)";
    } else {
      puck.style.background = "rgba(255, 252, 247, 0.74)";
      puck.style.border = "1.5px solid rgba(255, 255, 255, 0.92)";
      puck.style.boxShadow = "0 3px 10px rgba(24, 22, 21, 0.14)";
    }
  }
  if (iconContainer) {
    iconContainer.style.filter = "none";
  }
  if (arrow) {
    arrow.style.borderTopColor = isSelected ? "#E84A27" : "rgba(24, 22, 21, 0.55)";
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
  root.className = "select-none pointer-events-none z-40";

  const container = document.createElement("div");
  container.className =
    "puck-scale relative flex flex-col items-center select-none pointer-events-none transition-transform duration-150 ease-out";
  container.style.transformOrigin = "bottom center";
  container.style.willChange = "transform";

  // High-visibility GPS Medallion wrapper with pulsing radar halo
  const bodyWrapper = document.createElement("div");
  bodyWrapper.className = "relative flex items-center justify-center";

  // Radar ripple: expanding warm orange halo ring around the medallion
  const ripple = document.createElement("div");
  ripple.className =
    "absolute -inset-1.5 rounded-full bg-[#e84a27]/25 border border-[#e84a27]/60 animate-ping pointer-events-none";
  ripple.style.animationDuration = "2.2s";

  // Crisp circular medallion so avatar pops against any map street/building color (no black)
  const charContainer = document.createElement("div");
  charContainer.className =
    "relative w-12 h-12 rounded-full bg-[#FAF7F2] border-2 border-[#E84A27] overflow-hidden flex items-center justify-center";
  charContainer.style.boxShadow =
    "0 0 0 2.5px #FFFFFF, 0 8px 20px rgba(232, 74, 39, 0.25)";

  const renderSvgInto = (svgStr: string, isMascotEngine = false) => {
    // Strip any internal ground shadow (<g data-layer="ambience">) so no grey oval appears
    const cleaned = svgStr.replace(/<g data-layer="ambience">[\s\S]*?<\/g>/g, "");
    charContainer.innerHTML = cleaned;
    const svgEl = charContainer.querySelector("svg");
    if (svgEl) {
      if (isMascotEngine) {
        svgEl.setAttribute("viewBox", "28 8 220 220");
        svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
      }
      svgEl.style.width = "100%";
      svgEl.style.height = "100%";
      svgEl.style.display = "block";
      svgEl.style.overflow = "hidden";
    }
  };

  if (useMascot) {
    renderSvgInto(buildMascotSVGString(mascotConfig ?? undefined, false, 48, 48), true);
  } else if (avatarUrl) {
    const img = document.createElement("img");
    img.src = avatarUrl;
    img.alt = "You";
    img.className = "w-full h-full object-cover block pointer-events-none";
    charContainer.appendChild(img);
  } else if (avatarConfig) {
    renderSvgInto(buildOpenPeepsSvg(avatarConfig), false);
  } else {
    renderSvgInto(buildOpenPeepsSvg(getOrCreateGuestOpenPeepsConfig()), false);
  }

  // Always-visible "● YOU" live GPS badge in warm ivory + Burnt Paprika (no black)
  const badge = document.createElement("div");
  badge.className =
    "puck-badge -mt-2 relative z-10 bg-[#FAF7F2] text-[#E84A27] font-extrabold text-[8.5px] tracking-wider uppercase leading-none px-2 py-0.5 rounded-full shadow-md border border-[#E84A27]/35 whitespace-nowrap flex items-center gap-1";
  badge.innerHTML = `<span style="width:5px;height:5px;border-radius:9999px;background:#10b981;box-shadow:0 0 6px #10b981;display:inline-block;"></span><span>YOU</span>`;

  bodyWrapper.appendChild(ripple);
  bodyWrapper.appendChild(charContainer);

  container.appendChild(bodyWrapper);
  container.appendChild(badge);
  root.appendChild(container);
  return root;
}

/**
 * Calibrated zoom + viewport-responsive scale:
 * - Scales smoothly with map zoom (0.84 at city overview -> 1.04 at neighborhood -> 1.20 at street level)
 * - Adapts to map container width so the avatar remains proportional on mobile split-view and desktop.
 */
function applyPuckZoomScale(rootEl: HTMLElement, zoom: number, containerWidth?: number) {
  const scaleEl = rootEl.querySelector<HTMLElement>(".puck-scale") ?? rootEl;
  const zoomScale = Math.max(0.84, Math.min(1.22, 0.84 + Math.max(0, zoom - 11.5) * 0.085));
  const width =
    containerWidth ??
    (typeof window !== "undefined" ? window.innerWidth : 400);
  const viewportFactor = width < 420 ? 0.95 : width > 960 ? 1.06 : 1.0;
  const finalScale = zoomScale * viewportFactor;
  scaleEl.style.transform = `scale(${finalScale.toFixed(3)})`;
}

function createAquarellePinElement(
  venue: Venue,
  isSelected: boolean,
  onClick: () => void
): HTMLDivElement {
  const root = document.createElement("div");
  root.className = "maplibregl-marker";
  root.style.position = "absolute";
  root.style.top = "0";
  root.style.left = "0";
  root.style.width = "40px";
  root.style.height = "48px";
  root.style.margin = "0";
  root.style.padding = "0";
  root.style.cursor = "pointer";
  root.style.userSelect = "none";

  const popupStatus = getPopupStatus(venue);
  const categoryKey = venue.food_category || (venue.place_type === "cafe" ? "coffee" : "all");
  const iconSvg = FOOD_PIN_SVG_MAP[categoryKey] || FOOD_PIN_SVG_MAP.all;
  // A curated emoji (set by the admin importer) overrides the default SVG pin.
  const curatedIcon = venue.icon
    ? String(venue.icon).replace(/[<>&"']/g, "").trim()
    : venue.spot_type === "food_truck"
    ? "🚚"
    : venue.spot_type === "popup"
    ? "🎪"
    : "";
  const pinGlyph = curatedIcon
    ? `<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;font-size:20px;line-height:1;text-align:center;font-family:'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif;transform:translateY(0.5px);">${curatedIcon}</span>`
    : iconSvg.replace('width="20" height="20"', 'width="22" height="22"');

  const inner = document.createElement("div");
  inner.className = "pin-visual";
  inner.style.width = "100%";
  inner.style.height = "100%";
  inner.style.display = "flex";
  inner.style.alignItems = "flex-start";
  inner.style.justifyContent = "center";
  inner.style.position = "relative";
  inner.style.transformOrigin = "bottom center";
  inner.style.transition = "transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)";

  const haloHtml = popupStatus.isPulsingMarker
    ? `<div style="position:absolute;top:-5px;left:-5px;width:44px;height:44px;border-radius:9999px;border:2px solid #f59e0b;background:rgba(245,158,11,0.2);animation:ping 1.6s cubic-bezier(0,0,0.2,1) infinite;pointer-events:none;"></div>`
    : "";

  inner.innerHTML = `
    <!-- Warm Translucent Glass Map Puck (34x34px, centered glyph, no muddy grey shadow) -->
    ${haloHtml}
    <div class="smakr-map-puck" style="
      width: 34px;
      height: 34px;
      border-radius: 9999px;
      background: rgba(255, 252, 247, 0.74);
      backdrop-filter: blur(8px) saturate(140%);
      -webkit-backdrop-filter: blur(8px) saturate(140%);
      border: 1.5px solid rgba(255, 255, 255, 0.92);
      box-shadow: 0 3px 10px rgba(24, 22, 21, 0.14);
      display: grid;
      place-items: center;
      padding: 0;
      position: relative;
      transition: transform 150ms cubic-bezier(0.22, 1, 0.36, 1), background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      cursor: pointer;
    ">
      <div class="smakr-puck-icon" style="width:22px;height:22px;display:grid;place-items:center;line-height:1;margin:0;padding:0;">
        ${pinGlyph}
      </div>
      <!-- Subtle pointer triangle -->
      <div class="smakr-puck-arrow" style="
        position: absolute;
        bottom: -4.5px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 4.5px solid rgba(24, 22, 21, 0.55);
        transition: border-top-color 0.2s ease;
      "></div>
    </div>
  `;

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
  const markersMap = useRef<Map<string, maplibregl.Marker>>(new Map());
  const weeklyMarkerRef = useRef<maplibregl.Marker | null>(null);
  const venuePopupRef = useRef<maplibregl.Popup | null>(null);
  const isMapReadyRef = useRef(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // Fast, responsive Streets v2 default
  const [activeTheme, setActiveTheme] = useState<"streets" | "dataviz" | "aquarelle">("streets");
  const [currentZoom, setCurrentZoom] = useState(13.8);
  const venues = useCityPulseStore((state) => state.venues);
  const selectedVenue = useCityPulseStore((state) => state.selectedVenue);
  const setSelectedVenue = useCityPulseStore((state) => state.setSelectedVenue);
  const setIsVenueDetailModalOpen = useCityPulseStore((state) => state.setIsVenueDetailModalOpen);
  const mapCategory = useCityPulseStore((state) => state.mapCategory);
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
      // Venue pins need bottom clearance for the descending inspection card.
      // Avatar locate centering uses compact clearance so the puck sits at screen center.
      const isVenuePin =
        reason === "venue-pin" ||
        (reason === "mapCenter-effect" && Boolean(useCityPulseStore.getState().selectedVenue));
      const bottomPad = isMobile
        ? isVenuePin
          ? Math.min(380, Math.max(280, Math.round(containerH * 0.45)))
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

  // Synchronize markers to MapLibre
  const renderMarkers = useCallback(() => {
    const map = mapInstance.current;
    if (!map || !isMapReadyRef.current) return;

    const currentVenues = useCityPulseStore.getState().venues;
    const currentSelected = useCityPulseStore.getState().selectedVenue;
    const currentMapCategory = useCityPulseStore.getState().mapCategory;
    const currentNeighborhood = useCityPulseStore.getState().mapNeighborhood;
    const currentOpenNow = useCityPulseStore.getState().filters.open_now;
    // The Weekly Pick venue is represented by the "Smakr Pick" mascot marker, so
    // its own food pin is suppressed to avoid stacking two pins in one place.
    const currentWeeklyVenueId = useCityPulseStore.getState().weeklyPick.venue_id;

    // Filter venues based on craving category, neighborhood & open status
    const visibleVenues = currentVenues.filter((venue) => {
      if (currentWeeklyVenueId && venue.id === currentWeeklyVenueId) return false;

      // Suppress pins for ended pop-ups in grace period or expired pop-ups
      const popupStatus = getPopupStatus(venue);
      if (popupStatus.hideMapPin) return false;

      if (currentMapCategory !== "all") {
        const categoryMatch =
          venue.food_category === currentMapCategory ||
          (currentMapCategory === "coffee" && venue.place_type === "cafe");
        if (!categoryMatch) return false;
      }
      if (
        currentNeighborhood !== "all" &&
        venue.neighborhood !== currentNeighborhood
      ) {
        return false;
      }
      if (currentOpenNow && !venue.open_now) return false;
      return true;
    });

    // Remove markers that are no longer visible (rare) — never rebuild the rest.
    const visibleIds = new Set(visibleVenues.map((v) => v.id));
    markersMap.current.forEach((marker, id) => {
      if (!visibleIds.has(id)) {
        marker.remove();
        markersMap.current.delete(id);
      }
    });

    // Create only new markers; update existing ones in place (position + state).
    // A pin is only rebuilt when its visual identity (icon/category/name) changes.
    visibleVenues.forEach((venue) => {
      const isSelected = currentSelected?.id === venue.id;
      const popupStatus = getPopupStatus(venue);
      const pinKey = `${venue.icon ?? ""}|${venue.spot_type ?? ""}|${popupStatus.status}|${venue.food_category}|${venue.name}`;

      let existing = markersMap.current.get(venue.id);
      if (existing && existing.getElement().dataset.pinKey !== pinKey) {
        existing.remove();
        markersMap.current.delete(venue.id);
        existing = undefined;
      }
      if (existing) {
        existing.setLngLat([venue.longitude, venue.latitude]);
        applyPinState(existing.getElement(), isSelected);
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

      const el = createAquarellePinElement(venue, isSelected, handleSelect);
      el.dataset.pinKey = pinKey;

      const marker = new maplibregl.Marker({
        element: el,
        anchor: "center",
      })
        .setLngLat([venue.longitude, venue.latitude])
        .addTo(map);

      markersMap.current.set(venue.id, marker);
    });
  }, [setSelectedVenue, flyToTarget]);

  // Floating "Pick of the Week" badge attached to the mascot marker
  const buildWeeklyBadge = useCallback((): HTMLDivElement => {
    const badge = document.createElement("div");
    badge.textContent = "✦ Smakr Pick";
    Object.assign(badge.style, {
      position: "absolute",
      bottom: "calc(100% - 2px)",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#e84a27",
      color: "#ffffff",
      fontSize: "9px",
      fontWeight: "700",
      letterSpacing: "0.01em",
      whiteSpace: "nowrap",
      padding: "2px 6px",
      borderRadius: "999px",
      border: "1px solid rgba(255,255,255,0.55)",
      boxShadow: "0 2px 8px rgba(232, 74, 39, 0.35)",
      pointerEvents: "none",
      zIndex: "60",
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

  // Anchor the customizable Smakr mascot exclusively to the Weekly Pick.
  // (No user GPS tracking is attached to the mascot.)
  const renderWeeklyMarker = useCallback(() => {
    const map = mapInstance.current;
    if (!map || !isMapReadyRef.current) return;

    const state = useCityPulseStore.getState();
    const pick = state.weeklyPick;
    const config = state.mascotConfig;
    const [lng, lat] = pick.coords;
    if (typeof lng !== "number" || typeof lat !== "number") return;

    function buildWeeklyElement(): HTMLDivElement {
      const root = document.createElement("div");
      root.className =
        "relative flex flex-col items-center group cursor-pointer select-none pointer-events-auto";
      root.appendChild(buildWeeklyBadge());
      const circle = document.createElement("div");
      circle.className =
        "relative w-11 h-11 rounded-full border-2 border-[#E84A27] shadow-[0_0_0_2px_#FFFFFF,0_6px_16px_rgba(232,74,39,0.35)] bg-[#FAF7F2] overflow-hidden flex items-center justify-center transition-transform duration-150 group-hover:scale-110";
      if (pick.mascot_avatar_url) {
        const img = document.createElement("img");
        img.src = pick.mascot_avatar_url;
        img.alt = "✦ Smakr Pick";
        img.className = "w-full h-full object-cover object-top block pointer-events-none";
        circle.appendChild(img);
      } else {
        const svgStr = buildMascotSVGString(config, false, 44, 44).replace(
          /<g data-layer="ambience">[\s\S]*?<\/g>/g,
          ""
        );
        circle.innerHTML = svgStr;
        const svg = circle.querySelector("svg");
        if (svg) {
          svg.setAttribute("viewBox", "32 10 212 212");
          svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
          svg.style.width = "100%";
          svg.style.height = "100%";
          svg.style.display = "block";
        }
      }
      root.appendChild(circle);
      return root;
    }

    if (!weeklyMarkerRef.current) {
      const el = buildWeeklyElement();
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        void openWeeklyVenue();
      });

      const marker = new maplibregl.Marker({
        element: el,
        anchor: "bottom",
      })
        .setLngLat([lng, lat])
        .addTo(map);

      weeklyMarkerRef.current = marker;
    } else {
      const el = weeklyMarkerRef.current.getElement();
      el.innerHTML = "";
      el.className =
        "relative flex flex-col items-center group cursor-pointer select-none pointer-events-auto";
      el.appendChild(buildWeeklyBadge());
      const circle = document.createElement("div");
      circle.className =
        "relative w-11 h-11 rounded-full border-2 border-[#E84A27] shadow-[0_0_0_2px_#FFFFFF,0_6px_16px_rgba(232,74,39,0.35)] bg-[#FAF7F2] overflow-hidden flex items-center justify-center transition-transform duration-150 group-hover:scale-110";
      if (pick.mascot_avatar_url) {
        const img = document.createElement("img");
        img.src = pick.mascot_avatar_url;
        img.alt = "✦ Smakr Pick";
        img.className = "w-full h-full object-cover object-top block pointer-events-none";
        circle.appendChild(img);
      } else {
        const svgStr = buildMascotSVGString(config, false, 44, 44).replace(
          /<g data-layer="ambience">[\s\S]*?<\/g>/g,
          ""
        );
        circle.innerHTML = svgStr;
        const svg = circle.querySelector("svg");
        if (svg) {
          svg.setAttribute("viewBox", "32 10 212 212");
          svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
          svg.style.width = "100%";
          svg.style.height = "100%";
          svg.style.display = "block";
        }
      }
      el.appendChild(circle);
      weeklyMarkerRef.current.setLngLat([lng, lat]);
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
      setCurrentZoom(z);
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
    });

    // After a large pan / pitch, force a repaint so no canvas region is left
    // blank. IMPORTANT: never call `map.resize()` here — resize re-enters
    // `moveend`, which recurses/loops and can leave the canvas half-rendered.
    map.on("moveend", () => {
      map.triggerRepaint();
      const c = map.getCenter();
      console.info("[locate] camera settled", {
        instanceId,
        center: `${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}`,
        zoom: +map.getZoom().toFixed(2),
      });
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
      markersMap.current.forEach((m) => m.remove());
      markersMap.current.clear();
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

  // 2. Re-render markers when venues, selection, or filters change
  useEffect(() => {
    renderMarkers();
  }, [venues, selectedVenue, mapCategory, mapNeighborhood, openNow, weeklyPick.venue_id, renderMarkers]);

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

    const matching = venues.filter((v) => {
      if (mapCategory === "coffee" && v.place_type === "cafe") return true;
      return v.food_category === mapCategory;
    });

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

    const isNiwacheOrAdmin =
      currentUser?.role === "admin" ||
      Boolean(currentUser?.is_official) ||
      (currentUser?.handle || "").toLowerCase().includes("niwache") ||
      (currentUser?.handle || "").toLowerCase().includes("smak");
    const avatarSig = `${currentUser?.avatar_url || ""}:${currentUser?.role || ""}:${JSON.stringify(currentUser?.avatar_config || {})}:${JSON.stringify(mascotConfig || {})}`;

    // If marker already exists and avatar identity has not changed, just update position smoothly
    if (userLocationMarkerRef.current && lastAvatarSigRef.current === avatarSig) {
      userLocationMarkerRef.current.setLngLat([lon, lat]);
      return;
    }

    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.remove();
      userLocationMarkerRef.current = null;
    }

    lastAvatarSigRef.current = avatarSig;
    const el = buildUserAvatarPuckElement(
      currentUser?.avatar_url,
      currentUser?.avatar_config,
      mascotConfig,
      Boolean(isNiwacheOrAdmin)
    );
    applyPuckZoomScale(el, map.getZoom());

    const marker = new maplibregl.Marker({
      element: el,
      anchor: "bottom",
    })
      .setLngLat([lon, lat])
      .addTo(map);

    userLocationMarkerRef.current = marker;
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
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${selectedVenue.latitude},${selectedVenue.longitude}`;

    const isWeeklyPickVenue = selectedVenue.id === weeklyPick.venue_id;
    const weekNumber =
      (weeklyPick.week_label || "41").replace(/[^0-9]/g, "") || "41";

    if (isWeeklyPickVenue) {
      const pickDishImage = weeklyPick.dish_image || imageUrl;
      popupNode.innerHTML = `
        <div style="
          background: #FAF7F2;
          border: 1.5px solid #F0CFC2;
          border-radius: 20px;
          box-shadow: 0 14px 34px rgba(232, 74, 39, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          width: 312px;
          max-width: 90vw;
          position: relative;
          font-family: inherit;
        ">
          <!-- Warm Editorial Smakr Pick Header Ribbon (No Black) -->
          <div style="
            background: #FFF3ED;
            color: #7C2D12;
            padding: 7px 11px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #F5D5C8;
          ">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="
                background: #E84A27;
                color: #FFFFFF;
                font-size: 9px;
                font-weight: 800;
                letter-spacing: 0.06em;
                text-transform: uppercase;
                padding: 2px 7px;
                border-radius: 999px;
              ">✦ Smakr Pick</span>
              <span style="font-size: 10px; font-weight: 700; color: #9A3412;">
                Drop #${weekNumber}
              </span>
            </div>
            <button id="smakr-popup-close-btn" style="
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: rgba(232, 74, 39, 0.10);
              border: none;
              color: #9A3412;
              font-size: 11px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
            ">✕</button>
          </div>

          <div style="padding: 10px 11px;">
            <!-- Featured Dish + Spot Row -->
            <div style="display: flex; gap: 11px; align-items: center;">
              <div style="
                position: relative;
                width: 76px;
                height: 76px;
                border-radius: 14px;
                overflow: hidden;
                flex-shrink: 0;
                background: #F5EFE3;
                border: 1px solid #E6DDD0;
              ">
                <img src="${pickDishImage}" alt="${weeklyPick.dish_name}" style="width: 100%; height: 100%; object-fit: cover;" />
                <span style="
                  position: absolute;
                  bottom: 4px;
                  right: 4px;
                  background: #E84A27;
                  color: #FFFFFF;
                  font-size: 9.5px;
                  font-weight: 800;
                  padding: 1.5px 5.5px;
                  border-radius: 6px;
                  box-shadow: 0 2px 6px rgba(232, 74, 39, 0.35);
                ">${weeklyPick.price_nok} kr</span>
              </div>

              <div style="flex: 1; min-width: 0;">
                <div style="
                  font-size: 9.5px;
                  font-weight: 800;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                  color: #E84A27;
                ">Featured Dish</div>
                <div style="
                  font-family: var(--font-comico, sans-serif);
                  font-size: 15px;
                  color: #292524;
                  font-weight: bold;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                ">
                  ${weeklyPick.dish_name}
                </div>

                <div style="
                  font-size: 11.5px;
                  font-weight: 700;
                  color: #57534E;
                  margin-top: 1px;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                ">
                  📍 ${selectedVenue.name}
                </div>

                <div style="display: flex; align-items: center; gap: 4px; margin-top: 3px; flex-wrap: wrap;">
                  <span style="
                    background: #FEF3C7;
                    color: #92400E;
                    border: 1px solid #FDE68A;
                    font-size: 9.5px;
                    font-weight: bold;
                    padding: 1px 6px;
                    border-radius: 999px;
                    display: inline-flex;
                    align-items: center;
                    gap: 2px;
                  ">
                    <span style="color: #D97706;">★</span> ${ratingVal}
                  </span>
                  <span style="
                    background: ${openStatus.isOpen ? '#ecfdf5' : '#fef2f2'};
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
                </div>
              </div>
            </div>

            <!-- Mascot Drop Note Quote Box -->
            <div style="
              margin-top: 8px;
              padding: 7px 9px;
              border-radius: 10px;
              background: #FFF6F2;
              border: 1px solid #F5D5C8;
              border-left: 3px solid #E84A27;
              font-size: 11.5px;
              font-style: italic;
              font-weight: 600;
              color: #44403C;
              line-height: 1.35;
            ">
              &ldquo;${weeklyPick.speech_bubble}&rdquo;
            </div>

            <!-- Action Row -->
            <div style="display: flex; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.06);">
              <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="
                flex: 1;
                padding: 5px 8px;
                border-radius: 9px;
                background: #ffffff;
                border: 1px solid rgba(0,0,0,0.12);
                color: #181615;
                font-size: 10.5px;
                font-weight: 700;
                text-align: center;
                text-decoration: none;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 3px;
              ">
                <span>Directions</span> ↗
              </a>

              <button id="smakr-popup-menu-btn" style="
                flex: 1.25;
                padding: 5px 8px;
                border-radius: 9px;
                background: #E84A27;
                border: none;
                color: #ffffff;
                font-family: var(--font-comico, sans-serif);
                font-size: 10.5px;
                font-weight: bold;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 3px;
                box-shadow: 0 2px 6px rgba(232,74,39,0.28);
              ">
                <span>Spot &amp; Menu</span> →
              </button>
            </div>
          </div>
        </div>
      `;
    } else {
      popupNode.innerHTML = `
      <div style="
        background: #fbf9f5;
        border: 1.5px solid rgba(0, 0, 0, 0.08);
        border-radius: 18px;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
        padding: 10px 11px;
        width: 295px;
        max-width: 88vw;
        position: relative;
        font-family: inherit;
      ">
        <button id="smakr-popup-close-btn" style="
          position: absolute;
          top: 6px;
          right: 6px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(0,0,0,0.06);
          border: none;
          color: #71717a;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        ">✕</button>

        <div style="display: flex; gap: 11px; align-items: center;">
          <div style="
            width: 74px;
            height: 74px;
            border-radius: 14px;
            overflow: hidden;
            flex-shrink: 0;
            background: #e4d9c8;
            border: 1px solid rgba(0,0,0,0.08);
          ">
            <img src="${imageUrl}" alt="${selectedVenue.name}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>

          <div style="flex: 1; min-width: 0;">
            <div style="
              font-family: var(--font-comico, sans-serif);
              font-size: 15px;
              color: #181615;
              font-weight: bold;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              padding-right: 22px;
            ">
              ${selectedVenue.name}
            </div>

            <div style="display: flex; align-items: center; gap: 4px; margin-top: 2px; flex-wrap: wrap;">
              <span style="
                background: #181615;
                color: #ffffff;
                font-size: 10px;
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
                background: ${openStatus.isOpen ? '#ecfdf5' : '#fef2f2'};
                color: ${openStatus.isOpen ? '#047857' : '#b91c1c'};
                border: 1px solid ${openStatus.isOpen ? '#a7f3d0' : '#fecaca'};
                font-size: 9.5px;
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
              ${distanceText ? `<span style="font-size: 10px; color: #059669; font-weight: 600;">· ${distanceText}</span>` : ""}
            </div>

            <div style="
              font-size: 11px;
              color: #71717a;
              margin-top: 4px;
              line-height: 1.35;
              word-break: break-word;
            ">
              📍 ${addressText}
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.06);">
          <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="
            flex: 1;
            padding: 4px 8px;
            border-radius: 8px;
            background: #ffffff;
            border: 1px solid rgba(0,0,0,0.1);
            color: #3f3f46;
            font-size: 10.5px;
            font-weight: 600;
            text-align: center;
            text-decoration: none;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 3px;
          ">
            <span>Map</span> ↗
          </a>

          <button id="smakr-popup-menu-btn" style="
            flex: 1;
            padding: 4px 8px;
            border-radius: 8px;
            background: #e84a27;
            border: none;
            color: #ffffff;
            font-family: var(--font-comico, sans-serif);
            font-size: 10.5px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 2px;
            box-shadow: 0 1px 4px rgba(232,74,39,0.2);
          ">
            <span>Details</span> →
          </button>
        </div>
      </div>
    `;
    }

    popupNode.querySelector("#smakr-popup-close-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      setSelectedVenue(null);
    });

    popupNode.querySelector("#smakr-popup-menu-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      setIsVenueDetailModalOpen(true);
    });

    const popup = new maplibregl.Popup({
      offset: [0, 24],
      anchor: "top",
      closeButton: false,
      closeOnClick: false,
      // Focusing an off-screen popup button makes the browser scroll the
      // overflow-hidden map container sideways mid-flight.
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
      <div className="hidden lg:flex absolute left-4 bottom-6 z-20 items-center gap-1 p-1 rounded-xl bg-white/95 backdrop-blur-md border border-zinc-200 shadow-md text-xs">
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
