"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { MapControls } from "@/components/map/MapControls";
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
import {
  buildOpenPeepsSvg,
  openPeepsConfigFromPreset,
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
  if (visual) visual.style.transform = isSelected ? "scale(1.3)" : "scale(1.0)";
  const glyph = root.querySelector<HTMLElement>(".pin-glyph");
  if (glyph) glyph.style.filter = isSelected ? PIN_SHADOW_SELECTED : PIN_SHADOW_DEFAULT;
}

function buildUserAvatarPuckElement(
  avatarUrl?: string | null,
  avatarConfig?: OpenPeepsConfig | null,
  mascotConfig?: MascotConfig | null,
  useMascot = false
): HTMLDivElement {
  const container = document.createElement("div");
  container.className =
    "relative flex flex-col items-center group cursor-pointer select-none pointer-events-auto";

  // Small "You're here" caption above the puck.
  const badge = document.createElement("div");
  badge.className =
    "bg-white/90 text-zinc-700 font-semibold text-[10px] leading-none px-2 py-1 rounded-full shadow-sm border border-black/5 whitespace-nowrap mb-0.5";
  badge.textContent = "You're here";

  // Character body wrapper with radar ripple under the feet
  const bodyWrapper = document.createElement("div");
  bodyWrapper.className = "relative flex flex-col items-center justify-center";

  // Radar ripple: soft pulsing circle under the avatar
  const ripple = document.createElement("div");
  ripple.className =
    "absolute -bottom-1 w-11 h-3 rounded-full bg-[#e84a27] animate-ping opacity-35 pointer-events-none";
  ripple.style.animationDuration = "2.4s";

  // Soft shadow oval under avatar feet
  const shadow = document.createElement("div");
  shadow.className =
    "absolute -bottom-0.5 w-9 h-2.5 rounded-full bg-black/25 blur-[1px] pointer-events-none";

  // Character avatar container showing head + torso (unclipped)
  const charContainer = document.createElement("div");
  charContainer.className =
    "relative w-12 h-14 flex items-center justify-center filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.18)] transition-transform group-hover:scale-110";

  const renderSvgInto = (svgStr: string) => {
    charContainer.innerHTML = svgStr;
    const svgEl = charContainer.querySelector("svg");
    if (svgEl) {
      svgEl.style.width = "100%";
      svgEl.style.height = "100%";
      svgEl.style.display = "block";
      svgEl.style.overflow = "visible";
    }
  };

  if (avatarUrl) {
    const img = document.createElement("img");
    img.src = avatarUrl;
    img.alt = "You";
    img.className = "w-full h-full object-contain block pointer-events-none";
    charContainer.appendChild(img);
  } else if (useMascot) {
    // Admins / official accounts use the Smakr mascot — matching the header avatar.
    renderSvgInto(buildMascotSVGString(mascotConfig ?? undefined, false, 48, 56));
  } else {
    renderSvgInto(buildOpenPeepsSvg(avatarConfig ?? openPeepsConfigFromPreset("male1")));
  }

  bodyWrapper.appendChild(ripple);
  bodyWrapper.appendChild(shadow);
  bodyWrapper.appendChild(charContainer);

  container.appendChild(badge);
  container.appendChild(bodyWrapper);
  return container;
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
  root.style.width = "38px";
  root.style.height = "38px";
  root.style.margin = "0";
  root.style.padding = "0";
  root.style.cursor = "pointer";
  root.style.userSelect = "none";

  const categoryKey = venue.food_category || (venue.place_type === "cafe" ? "coffee" : "all");
  const iconSvg = FOOD_PIN_SVG_MAP[categoryKey] || FOOD_PIN_SVG_MAP.all;
  // A curated emoji (set by the admin importer) overrides the default SVG pin.
  const curatedIcon = venue.icon ? String(venue.icon).replace(/[<>&"']/g, "").trim() : "";
  const pinGlyph = curatedIcon
    ? `<span style="font-size:26px;line-height:1;">${curatedIcon}</span>`
    : iconSvg.replace('width="20" height="20"', 'width="32" height="32"');

  const inner = document.createElement("div");
  inner.className = "pin-visual";
  inner.style.width = "100%";
  inner.style.height = "100%";
  inner.style.display = "flex";
  inner.style.alignItems = "center";
  inner.style.justifyContent = "center";
  inner.style.position = "relative";
  inner.style.transition = "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)";

  inner.innerHTML = `
    <!-- Clean Standalone Food Icon with Soft Map Shadow -->
    <div class="pin-glyph" style="
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: ${PIN_SHADOW_DEFAULT};
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), filter 0.2s ease;
    ">
      ${pinGlyph}
    </div>
  `;

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

    // Filter venues based on craving category, neighborhood & open status
    const visibleVenues = currentVenues.filter((venue) => {
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
      const pinKey = `${venue.icon ?? ""}|${venue.food_category}|${venue.name}`;

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

        const activeMap = mapInstance.current;
        if (!activeMap) return;

        const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

        if (isMobile) {
          // Mobile: the bottom sheet covers the lower map, so pad the camera.
          const containerH =
            activeMap.getContainer()?.clientHeight ||
            (typeof window !== "undefined" ? window.innerHeight : 650);
          const bottomPad = Math.min(340, Math.max(220, Math.round(containerH * 0.44)));

          activeMap.flyTo({
            center: [current.longitude, current.latitude],
            zoom: 15.5,
            essential: true,
            duration: 500,
            padding: { top: 60, bottom: bottomPad, left: 0, right: 0 },
          });
        } else {
          // Desktop: master-detail split — the map is never covered by a sheet.
          activeMap.flyTo({
            center: [current.longitude, current.latitude],
            zoom: 15.5,
            essential: true,
            duration: 500,
            padding: { top: 0, bottom: 0, left: 0, right: 0 },
          });
        }
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
  }, [setSelectedVenue]);

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

  const openWeeklyVenue = useCallback(() => {
    const state = useCityPulseStore.getState();
    state.selectVenueById(state.weeklyPick.venue_id);
  }, []);

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

    const width = 38;
    const height = Math.round((width * MASCOT_VIEWBOX_HEIGHT) / MASCOT_VIEWBOX_WIDTH);

    function buildWeeklyElement(): HTMLDivElement {
      const root = document.createElement("div");
      root.className =
        "relative flex flex-col items-center group cursor-pointer select-none pointer-events-auto";
      root.appendChild(buildWeeklyBadge());
      const circle = document.createElement("div");
      circle.className =
        "relative w-10 h-10 rounded-full border-2 border-white shadow-lg bg-stone-100 overflow-hidden ring-2 ring-[#e84a27] flex items-center justify-center";
      if (pick.mascot_avatar_url) {
        const img = document.createElement("img");
        img.src = pick.mascot_avatar_url;
        img.alt = "✦ Smakr Pick";
        img.className = "w-full h-full object-cover object-top block pointer-events-none";
        circle.appendChild(img);
      } else {
        const svgStr = buildMascotSVGString(config, false, 40, 40);
        circle.innerHTML = svgStr;
        const svg = circle.querySelector("svg");
        if (svg) {
          // Crop to the head so the avatar sits centred in the circular marker.
          svg.setAttribute("viewBox", "38 15 200 200");
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
        openWeeklyVenue();
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
        "relative w-10 h-10 rounded-full border-2 border-white shadow-lg bg-stone-100 overflow-hidden ring-2 ring-[#e84a27] flex items-center justify-center";
      if (pick.mascot_avatar_url) {
        const img = document.createElement("img");
        img.src = pick.mascot_avatar_url;
        img.alt = "✦ Smakr Pick";
        img.className = "w-full h-full object-cover object-top block pointer-events-none";
        circle.appendChild(img);
      } else {
        const svgStr = buildMascotSVGString(config, false, 40, 40);
        circle.innerHTML = svgStr;
        const svg = circle.querySelector("svg");
        if (svg) {
          // Crop to the head so the avatar sits centred in the circular marker.
          svg.setAttribute("viewBox", "38 15 200 200");
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

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: mapCenter,
      zoom: mapZoom,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      maxPitch: 60,
      minZoom: 9,
      maxZoom: 19,
      doubleClickZoom: true,
    });

    mapInstance.current = map;

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

    map.on("load", () => {
      isMapReadyRef.current = true;
      setIsMapReady(true);
      map.resize();
      scheduleMarkerAttachment();
    });

    map.on("styledata", () => {
      map.resize();
    });

    map.on("style.load", () => {
      if (!isMapReadyRef.current) return;
      map.resize();
      scheduleMarkerAttachment();
    });

    // Auto-dismiss floating venue preview card if zoomed out past city level
    map.on("zoom", () => {
      if (map.getZoom() < 13.8) {
        const state = useCityPulseStore.getState();
        if (state.selectedVenue) {
          state.setSelectedVenue(null);
        }
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
      if (mapInstance.current) mapInstance.current.resize();
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
  }, [venues, selectedVenue, mapCategory, mapNeighborhood, openNow, renderMarkers]);

  // 2.5 Auto-fit map camera when category filter changes
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

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
  }, [mapCategory, venues]);

  // 3. Switch style safely on theme change
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    const styles = getMapStyles();
    const newStyle = styles[activeTheme];
    map.setStyle(newStyle);
  }, [activeTheme]);

  // 4. Center updates
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    map.resize();
    const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
    const containerH = map.getContainer()?.clientHeight || (typeof window !== "undefined" ? window.innerHeight : 650);
    const bottomPad = isMobile ? Math.min(340, Math.max(220, Math.round(containerH * 0.44))) : 0;

    map.flyTo({
      center: [mapCenter[0], mapCenter[1]],
      zoom: mapZoom,
      pitch: 20,
      essential: true,
      duration: 800,
      padding: {
        top: isMobile ? 60 : 0,
        bottom: bottomPad,
        left: 0,
        right: 0,
      },
    });
  }, [mapCenter, mapZoom]);

  // 4b. Synchronize User Avatar Geolocation Puck
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReadyRef.current) return;

    if (!userLocation) {
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
        userLocationMarkerRef.current = null;
      }
      return;
    }

    const { lat, lon } = userLocation;

    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.remove();
      userLocationMarkerRef.current = null;
    }

    const isNiwacheOrAdmin =
      currentUser?.role === "admin" ||
      (currentUser?.handle || "").toLowerCase().includes("niwache");
    const el = buildUserAvatarPuckElement(
      currentUser?.avatar_url,
      currentUser?.avatar_config,
      mascotConfig,
      !currentUser?.avatar_url && isNiwacheOrAdmin
    );
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

    const distanceText = selectedVenue.distance_meters
      ? formatDistance(selectedVenue.distance_meters)
      : "";

    const addressText = selectedVenue.address
      ? selectedVenue.address
      : selectedVenue.neighborhood
      ? `${selectedVenue.neighborhood}, Oslo`
      : "Oslo";

    const imageUrl = selectedVenue.cover_image_url || "/images/placeholder-venue.jpg";
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${selectedVenue.latitude},${selectedVenue.longitude}`;

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

            <div style="display: flex; align-items: center; gap: 4px; margin-top: 2px;">
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
              ${distanceText ? `<span style="font-size: 10.5px; color: #059669; font-weight: 600;">· ${distanceText}</span>` : ""}
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
      className: "smakr-pin-card-popup",
    })
      .setLngLat([selectedVenue.longitude, selectedVenue.latitude])
      .setDOMContent(popupNode)
      .addTo(map);

    venuePopupRef.current = popup;
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
        className={`absolute inset-0 w-full h-full transition-opacity duration-500 ease-out ${
          isMapReady ? "opacity-100" : "opacity-0"
        }`}
        style={{ width: "100%", height: "100%" }}
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

      <MapControls
        onZoomIn={() => mapInstance.current?.zoomIn()}
        onZoomOut={() => mapInstance.current?.zoomOut()}
        onToggleTheme={cycleTheme}
        isDarkTheme={activeTheme === "aquarelle"}
      />
    </div>
  );
}
