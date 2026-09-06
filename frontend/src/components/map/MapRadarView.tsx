"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { MapControls } from "@/components/map/MapControls";
import { fetchVenueDetail } from "@/lib/api";
import { Venue } from "@/types";
import { FOOD_CATEGORIES } from "@/lib/foodSeeds";
import { createAvatarElement } from "@/components/avatar/AnimatedAvatars";
import {
  FOOD_PIN_SVG_MAP,
  AllFoodIcon,
  BakeryIcon,
  CoffeeIcon,
  RamenIcon,
  BurgerIcon,
  PizzaIcon,
  TacoIcon,
  SushiIcon,
  DessertIcon,
  DrinksIcon,
} from "@/components/food/FoodIcons";
import { FoodCategory } from "@/types";

const CATEGORY_ICON_MAP: Record<FoodCategory, React.ComponentType<{ className?: string }>> = {
  all: AllFoodIcon,
  coffee: CoffeeIcon,
  bakery: BakeryIcon,
  ramen: RamenIcon,
  burger: BurgerIcon,
  pizza: PizzaIcon,
  street_food: TacoIcon,
  sushi: SushiIcon,
  dessert: DessertIcon,
  drinks: DrinksIcon,
};

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
  root.style.zIndex = isSelected ? "35" : "15";

  const categoryKey = venue.food_category || (venue.place_type === "cafe" ? "coffee" : "all");
  const iconSvg = FOOD_PIN_SVG_MAP[categoryKey] || FOOD_PIN_SVG_MAP.all;

  const inner = document.createElement("div");
  inner.className = "pin-visual";
  inner.style.width = "100%";
  inner.style.height = "100%";
  inner.style.display = "flex";
  inner.style.alignItems = "center";
  inner.style.justifyContent = "center";
  inner.style.position = "relative";
  inner.style.transition = "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)";
  inner.style.transform = isSelected ? "scale(1.3)" : "scale(1.0)";

  inner.innerHTML = `
    <!-- Clean Standalone Food Icon with Soft Map Shadow -->
    <div style="
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: ${
        isSelected
          ? "drop-shadow(0 4px 10px rgba(255, 85, 0, 0.65)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35))"
          : "drop-shadow(0 3px 6px rgba(0, 0, 0, 0.35)) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))"
      };
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), filter 0.2s ease;
    ">
      ${iconSvg.replace('width="20" height="20"', 'width="32" height="32"')}
    </div>

    <!-- Hover Tooltip -->
    <div class="pin-tooltip" style="
      position: absolute;
      bottom: calc(100% + 5px);
      left: 50%;
      transform: translateX(-50%);
      background: #ffffff;
      color: #221e19;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid #dcd4c3;
      box-shadow: 0 4px 12px rgba(60, 48, 34, 0.15);
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
      pointer-events: none;
      display: none;
      z-index: 60;
    ">
      <span>${venue.name}</span>
      <span style="color: #6b6459; font-weight: normal; margin-left: 4px;">• ${venue.vibe?.seat_label || "Active"}</span>
    </div>
  `;

  const tooltip = inner.querySelector(".pin-tooltip") as HTMLDivElement;

  root.addEventListener("mouseenter", () => {
    if (tooltip) tooltip.style.display = "block";
    inner.style.transform = isSelected ? "scale(1.3)" : "scale(1.15)";
  });

  root.addEventListener("mouseleave", () => {
    if (tooltip) tooltip.style.display = "none";
    inner.style.transform = isSelected ? "scale(1.22)" : "scale(1.0)";
  });

  root.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });

  root.appendChild(inner);
  return root;
}

export function MapRadarView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markersMap = useRef<Map<string, maplibregl.Marker>>(new Map());
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Fast, responsive Streets v2 default
  const [activeTheme, setActiveTheme] = useState<"streets" | "dataviz" | "aquarelle">("streets");
  const venues = useCityPulseStore((state) => state.venues);
  const selectedVenue = useCityPulseStore((state) => state.selectedVenue);
  const setSelectedVenue = useCityPulseStore((state) => state.setSelectedVenue);
  const mapCategory = useCityPulseStore((state) => state.mapCategory);
  const setMapCategory = useCityPulseStore((state) => state.setMapCategory);
  const mapCenter = useCityPulseStore((state) => state.mapCenter);
  const mapZoom = useCityPulseStore((state) => state.mapZoom);
  const userLocation = useCityPulseStore((state) => state.userLocation);

  // Synchronize markers to MapLibre
  const renderMarkers = useCallback(() => {
    const map = mapInstance.current;
    if (!map) return;

    const currentVenues = useCityPulseStore.getState().venues;
    const currentSelected = useCityPulseStore.getState().selectedVenue;
    const currentMapCategory = useCityPulseStore.getState().mapCategory;

    // Filter venues based on selected food craving
    const visibleVenues = currentVenues.filter((venue) => {
      if (currentMapCategory === "all") return true;
      if (venue.food_category === currentMapCategory) return true;
      if (currentMapCategory === "coffee" && venue.place_type === "cafe") return true;
      return false;
    });

    // Remove existing markers
    markersMap.current.forEach((m) => m.remove());
    markersMap.current.clear();

    // Attach all venue markers
    visibleVenues.forEach((venue) => {
      const isSelected = currentSelected?.id === venue.id;

      const handleSelect = async () => {
        try {
          const detail = await fetchVenueDetail(venue.id);
          setSelectedVenue(detail);
        } catch {
          setSelectedVenue({
            ...venue,
            recent_checkins: [],
            recent_speed_tests: [],
          });
        }

        map.flyTo({
          center: [venue.longitude, venue.latitude],
          zoom: 15.5,
          essential: true,
          duration: 500,
        });
      };

      const el = createAquarellePinElement(venue, isSelected, handleSelect);

      const marker = new maplibregl.Marker({
        element: el,
        anchor: "center",
      })
        .setLngLat([venue.longitude, venue.latitude])
        .addTo(map);

      markersMap.current.set(venue.id, marker);
    });
  }, [setSelectedVenue]);

  // Synchronize Lordicon Foodie Avatar Marker to MapLibre
  const renderUserMarker = useCallback(() => {
    const map = mapInstance.current;
    if (!map) return;
    const loc = useCityPulseStore.getState().userLocation;
    if (!loc) return;

    if (!userMarkerRef.current) {
      const el = createAvatarElement();

      const marker = new maplibregl.Marker({
        element: el,
        anchor: "bottom",
      })
        .setLngLat([loc.lon, loc.lat])
        .addTo(map);

      userMarkerRef.current = marker;
    } else {
      userMarkerRef.current.setLngLat([loc.lon, loc.lat]);
    }
  }, []);

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
      maxPitch: 0,
      minZoom: 9,
      maxZoom: 19,
      doubleClickZoom: true,
    });

    mapInstance.current = map;

    map.on("load", () => {
      map.resize();
      renderMarkers();
      renderUserMarker();
    });

    map.on("style.load", () => {
      renderMarkers();
      renderUserMarker();
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
      if (userMarkerRef.current) userMarkerRef.current.remove();
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // 2. Re-render markers when venues or selection changes
  useEffect(() => {
    renderMarkers();
  }, [venues, selectedVenue, mapCategory, renderMarkers]);

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
    map.flyTo({
      center: [mapCenter[0], mapCenter[1]],
      zoom: mapZoom,
      essential: true,
      duration: 700,
    });
  }, [mapCenter, mapZoom]);

  // 5. User GPS point (Lordicon foodie avatar)
  useEffect(() => {
    renderUserMarker();
  }, [userLocation, renderUserMarker]);

  function cycleTheme() {
    if (activeTheme === "streets") setActiveTheme("dataviz");
    else if (activeTheme === "dataviz") setActiveTheme("aquarelle");
    else setActiveTheme("streets");
  }

  return (
    <div className="relative w-full h-full min-h-[500px] flex-1 overflow-hidden bg-[#f6f3ee]">
      {/* Map Canvas */}
      <div
        ref={mapContainer}
        className="absolute inset-0 w-full h-full"
        style={{ width: "100%", height: "100%" }}
      />

      {/* FLOATING MAP CRAVING FILTER BAR (Full-width directly under top nav) */}
      <div className="absolute top-3 left-3 right-3 sm:left-4 sm:right-4 z-20 overflow-x-auto no-scrollbar pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-zinc-200/80 shadow-md shadow-zinc-950/5">
        {FOOD_CATEGORIES.map((cat) => {
          const isActive = mapCategory === cat.id;
          const Icon = CATEGORY_ICON_MAP[cat.id] || AllFoodIcon;
          return (
            <button
              key={cat.id}
              onClick={() => setMapCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all select-none ${
                isActive
                  ? "bg-[#ff5500] text-white font-bold shadow-md shadow-[#ff5500]/25"
                  : "bg-transparent hover:bg-zinc-100 text-zinc-600 hover:text-zinc-950 font-medium"
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

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
