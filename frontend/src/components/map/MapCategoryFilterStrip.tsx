"use client";

import React, { useState } from "react";
import { SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";

export function MapCategoryFilterStrip() {
  const selectedGroup = useCityPulseStore((state) => state.selectedGroup);
  const selectedSpotKind = useCityPulseStore((state) => state.selectedSpotKind);
  const openNow = useCityPulseStore((state) => state.filters.open_now);
  const mapCategory = useCityPulseStore((state) => state.mapCategory);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isAllActive =
    !selectedGroup &&
    !selectedSpotKind &&
    !openNow &&
    (mapCategory === "all" || !mapCategory);

  const isPopupsActive = selectedSpotKind === "popup";
  const isMatchaCoffeeActive =
    selectedGroup === "coffee_tea" || mapCategory === "coffee";
  const isBakeryActive = selectedGroup === "pastries_bakery";
  const isNoodlesActive = selectedGroup === "noodles_soup";
  const isStreetFoodActive = selectedGroup === "sandwiches_handhelds";
  const isOpenNowActive = Boolean(openNow);

  const activeFilterLabel = isPopupsActive
    ? "Pop-ups"
    : isMatchaCoffeeActive
    ? "Matcha & Coffee"
    : isBakeryActive
    ? "Bakery"
    : isNoodlesActive
    ? "Noodles"
    : isStreetFoodActive
    ? "Street Food"
    : isOpenNowActive
    ? "Open Now"
    : "All";

  const handleSelectAll = () => {
    useCityPulseStore.setState((state) => ({
      selectedGroup: null,
      selectedDishCategory: null,
      selectedSpotKind: null,
      selectedCuisine: null,
      mapCategory: "all",
      feedCategory: "all",
      filters: {
        ...state.filters,
        spot_type: "all",
        open_now: null,
      },
    }));
  };

  const handleSelectPopups = () => {
    if (isPopupsActive) {
      handleSelectAll();
    } else {
      useCityPulseStore.setState((state) => ({
        selectedGroup: null,
        selectedDishCategory: null,
        selectedSpotKind: "popup",
        mapCategory: "all",
        filters: {
          ...state.filters,
          spot_type: "popup",
        },
      }));
    }
  };

  const handleSelectGroup = (groupKey: string) => {
    if (selectedGroup === groupKey) {
      handleSelectAll();
    } else {
      useCityPulseStore.setState((state) => ({
        selectedGroup: groupKey,
        selectedDishCategory: null,
        selectedSpotKind: null,
        mapCategory: "all",
        filters: {
          ...state.filters,
          spot_type: "all",
        },
      }));
    }
  };

  const handleToggleOpenNow = () => {
    useCityPulseStore.setState((state) => ({
      filters: {
        ...state.filters,
        open_now: state.filters.open_now ? null : true,
      },
    }));
  };

  const pillClass = (active: boolean) =>
    `shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs select-none transition-all cursor-pointer border ${
      active
        ? "bg-[#E84A27] text-white font-bold border-[#E84A27] shadow-sm scale-102"
        : "bg-[#FAF7F2]/85 backdrop-blur-md text-[#181615] font-semibold border-white/70 shadow-[0_4px_20px_rgba(24,22,21,0.08)] hover:bg-[#FAF7F2]"
    }`;

  return (
    <div
      role="region"
      aria-label="Map categories"
      className="pointer-events-auto flex items-center gap-1.5 py-1 px-3 max-w-full"
    >
      {/* Collapse / Expand Toggle Pill */}
      <button
        type="button"
        onClick={() => setIsCollapsed((prev) => !prev)}
        aria-label={isCollapsed ? "Expand filters" : "Collapse filters"}
        className="shrink-0 bg-[#FAF7F2]/85 backdrop-blur-md text-[#181615] border border-white/70 shadow-[0_4px_20px_rgba(24,22,21,0.08)] rounded-full px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 hover:bg-[#FAF7F2] active:scale-95 transition-all cursor-pointer select-none"
      >
        {isCollapsed ? (
          <>
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#E84A27] shrink-0" />
            <span>Filters</span>
            <span className="text-[#E84A27] font-extrabold">
              ({activeFilterLabel})
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[#E84A27] shrink-0 -mr-0.5" />
          </>
        ) : (
          <>
            <ChevronLeft className="w-3.5 h-3.5 text-[#E84A27] shrink-0 -ml-0.5" />
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#181615]/75 shrink-0" />
          </>
        )}
      </button>

      <div
        className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar transition-all duration-300 ${
          isCollapsed
            ? "max-w-0 opacity-0 -translate-x-4 overflow-hidden pointer-events-none"
            : "max-w-full opacity-100 translate-x-0"
        }`}
      >
        <button
          type="button"
          onClick={handleSelectAll}
          className={pillClass(isAllActive)}
        >
          <span>All</span>
        </button>

        <button
          type="button"
          onClick={handleSelectPopups}
          className={pillClass(isPopupsActive)}
        >
          <span>🔥 Pop-ups</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectGroup("coffee_tea")}
          className={pillClass(isMatchaCoffeeActive)}
        >
          <span>🍵 Matcha & Coffee</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectGroup("pastries_bakery")}
          className={pillClass(isBakeryActive)}
        >
          <span>🥐 Bakery</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectGroup("noodles_soup")}
          className={pillClass(isNoodlesActive)}
        >
          <span>🍜 Noodles</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectGroup("sandwiches_handhelds")}
          className={pillClass(isStreetFoodActive)}
        >
          <span>🌮 Street Food</span>
        </button>

        <button
          type="button"
          onClick={handleToggleOpenNow}
          className={pillClass(isOpenNowActive)}
        >
          <span>🟢 Open Now</span>
        </button>
      </div>
    </div>
  );
}
