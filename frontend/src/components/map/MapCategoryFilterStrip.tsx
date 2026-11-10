"use client";

import React from "react";
import { useCityPulseStore } from "@/store/useCityPulseStore";

export function MapCategoryFilterStrip() {
  const selectedGroup = useCityPulseStore((state) => state.selectedGroup);
  const selectedSpotKind = useCityPulseStore((state) => state.selectedSpotKind);
  const openNow = useCityPulseStore((state) => state.filters.open_now);
  const mapCategory = useCityPulseStore((state) => state.mapCategory);

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
        ? "bg-[#e84a27] text-white font-bold border-[#e84a27] shadow-sm scale-102"
        : "bg-white/90 dark:bg-[#181615]/90 backdrop-blur-md text-zinc-800 dark:text-zinc-200 font-semibold border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-[#201D1A]"
    }`;

  return (
    <div
      role="region"
      aria-label="Map categories"
      className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-1 max-w-full"
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
  );
}
