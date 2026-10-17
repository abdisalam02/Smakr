"use client";

import React, { useState } from "react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { DietaryTag, FoodCategory, SpotType } from "@/types";
import { ChevronDown, ChevronUp, SlidersHorizontal, RotateCcw, Bookmark } from "lucide-react";
import {
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
  MatchaIcon,
  PastaIcon,
  DumplingIcon,
  StreetFoodIcon,
  FriedChickenIcon,
  KebabIcon,
  PhoIcon,
  CurryIcon,
} from "@/components/food/FoodIcons";

const CATEGORY_ICON_MAP: Record<
  FoodCategory,
  React.ComponentType<{ className?: string }>
> = {
  all: AllFoodIcon,
  coffee: CoffeeIcon,
  bakery: BakeryIcon,
  ramen: RamenIcon,
  burger: BurgerIcon,
  pizza: PizzaIcon,
  street_food: StreetFoodIcon,
  sushi: SushiIcon,
  dessert: DessertIcon,
  drinks: DrinksIcon,
  matcha: MatchaIcon,
  pasta: PastaIcon,
  dumplings: DumplingIcon,
  tacos: TacoIcon,
  bao: DumplingIcon,
  fried_chicken: FriedChickenIcon,
  kebab: KebabIcon,
  vietnamese: PhoIcon,
  indian: CurryIcon,
};

type Pill =
  | { kind: "category"; id: FoodCategory; label: string }
  | { kind: "dietary"; id: DietaryTag; label: string; emoji: string };

const PILLS: Pill[] = [
  { kind: "category", id: "all", label: "All" },
  { kind: "category", id: "dumplings", label: "Dumplings" },
  { kind: "category", id: "coffee", label: "Coffee & Drinks" },
  { kind: "category", id: "matcha", label: "Matcha" },
  { kind: "category", id: "bakery", label: "Bakeries" },
  { kind: "category", id: "ramen", label: "Ramen" },
  { kind: "category", id: "tacos", label: "Tacos" },
  { kind: "category", id: "pasta", label: "Pasta" },
  { kind: "category", id: "burger", label: "Burgers" },
  { kind: "category", id: "fried_chicken", label: "Fried Chicken" },
  { kind: "category", id: "kebab", label: "Kebab" },
  { kind: "category", id: "vietnamese", label: "Vietnamese" },
  { kind: "category", id: "indian", label: "Indian" },
  { kind: "dietary", id: "vegan", label: "Vegan", emoji: "🌱" },
  { kind: "dietary", id: "halal", label: "Halal", emoji: "" },
  { kind: "category", id: "pizza", label: "Pizza" },
  { kind: "category", id: "street_food", label: "Street Food" },
  { kind: "category", id: "sushi", label: "Sushi" },
  { kind: "category", id: "dessert", label: "Sweets" },
  { kind: "category", id: "drinks", label: "Bars" },
];

const CUISINES: { id: FoodCategory; label: string; emoji: string }[] = [
  { id: "dumplings", label: "Dumplings", emoji: "🥟" },
  { id: "bao", label: "Bao", emoji: "🥟" },
  { id: "ramen", label: "Ramen", emoji: "🍜" },
  { id: "tacos", label: "Tacos", emoji: "🌮" },
  { id: "pizza", label: "Pizza", emoji: "🍕" },
  { id: "burger", label: "Burgers", emoji: "🍔" },
  { id: "fried_chicken", label: "Fried Chicken", emoji: "🍗" },
  { id: "kebab", label: "Kebab", emoji: "🥙" },
  { id: "vietnamese", label: "Vietnamese", emoji: "🍲" },
  { id: "indian", label: "Indian", emoji: "🍛" },
  { id: "bakery", label: "Bakery", emoji: "🥐" },
  { id: "coffee", label: "Coffee", emoji: "☕" },
  { id: "matcha", label: "Matcha", emoji: "🍵" },
  { id: "sushi", label: "Sushi", emoji: "🍣" },
  { id: "pasta", label: "Pasta", emoji: "🍝" },
  { id: "dessert", label: "Dessert", emoji: "🍰" },
  { id: "drinks", label: "Bars", emoji: "🍸" },
];

interface FeedFilterBarProps {
  compact?: boolean;
}

export function FeedFilterBar({ compact = false }: FeedFilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const currentCategory = useCityPulseStore((state) => state.feedCategory);
  const setFeedCategory = useCityPulseStore((state) => state.setFeedCategory);
  const selectedDietary = useCityPulseStore((state) => state.selectedDietary);
  const toggleDietary = useCityPulseStore((state) => state.toggleDietary);

  const spotTypeFilter = useCityPulseStore((state) => state.filters.spot_type);
  const setSpotTypeFilter = useCityPulseStore((state) => state.setSpotTypeFilter);

  const priceTierFilter = useCityPulseStore((state) => state.filters.price_tier);
  const setPriceTierFilter = useCityPulseStore((state) => state.setPriceTierFilter);

  const staffPicksOnly = useCityPulseStore((state) => state.filters.staff_picks_only);
  const toggleStaffPicksOnly = useCityPulseStore((state) => state.toggleStaffPicksOnly);

  const savedOnly = useCityPulseStore((state) => state.filters.saved_only);
  const toggleSavedOnly = useCityPulseStore((state) => state.toggleSavedOnly);
  const savedPostIds = useCityPulseStore((state) => state.savedPostIds);

  const openNow = useCityPulseStore((state) => state.filters.open_now);
  const setFilters = useCityPulseStore((state) => state.setFilters);
  const resetFilters = useCityPulseStore((state) => state.resetFilters);

  // Active filters count (excluding category all)
  const activeExtraFiltersCount =
    (spotTypeFilter && spotTypeFilter !== "all" ? 1 : 0) +
    (priceTierFilter ? 1 : 0) +
    (staffPicksOnly ? 1 : 0) +
    (savedOnly ? 1 : 0) +
    (openNow ? 1 : 0) +
    selectedDietary.length;

  const hasAnyActiveFilter =
    activeExtraFiltersCount > 0 || currentCategory !== "all";

  const handleResetAll = () => {
    resetFilters();
    setFeedCategory("all");
    setSpotTypeFilter("all");
    setPriceTierFilter(null);
  };

  return (
    <div className="w-full bg-[#fbf9f5]/90 dark:bg-[#181615]/90 backdrop-blur-md border-b border-black/[0.06] dark:border-white/[0.08] transition-all">
      {/* Horizontal Pill Row with Inline Trigger */}
      <div
        className={`w-full overflow-x-auto no-scrollbar px-3 snap-x snap-mandatory flex items-center gap-1.5 ${
          compact ? "py-1.5" : "py-2"
        }`}
      >
        {/* [ ⚡ Filters ▾ ] Accordion Toggle Pill */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all select-none active:scale-95 ${
            isExpanded || activeExtraFiltersCount > 0
              ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xs"
              : "bg-white dark:bg-white/10 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-white/15 hover:bg-zinc-100 dark:hover:bg-white/15"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
          {activeExtraFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#e84a27] text-white text-[10px] font-bold flex items-center justify-center">
              {activeExtraFiltersCount}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 opacity-70" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          )}
        </button>

        {/* Horizontal Category & Dietary Pills */}
        <div className="flex items-center gap-1.5 min-w-max">
          {/* Functional Saved (N) Hit-List Filter Pill */}
          <button
            type="button"
            onClick={toggleSavedOnly}
            aria-pressed={Boolean(savedOnly)}
            className={`snap-start shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all select-none active:scale-[0.97] ${
              savedOnly
                ? "text-white border-transparent font-semibold shadow-xs bg-[#e84a27]"
                : "bg-white/80 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 border-zinc-200/70 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white font-medium"
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${savedOnly ? "fill-white text-white" : "text-amber-500 fill-amber-500/20"}`} />
            <span className="tracking-tight whitespace-nowrap">
              Saved{savedPostIds.size > 0 ? ` (${savedPostIds.size})` : ""}
            </span>
          </button>

          {PILLS.map((pill) => {
            const isActive =
              !savedOnly &&
              (pill.kind === "category"
                ? currentCategory === pill.id
                : selectedDietary.includes(pill.id));

            const Icon = pill.kind === "category" ? CATEGORY_ICON_MAP[pill.id] : null;

            return (
              <button
                key={`${pill.kind}-${pill.id}`}
                onClick={() => {
                  if (savedOnly) toggleSavedOnly();
                  if (pill.kind === "category") {
                    setFeedCategory(pill.id);
                  } else {
                    toggleDietary(pill.id);
                  }
                }}
                aria-pressed={isActive}
                className={`snap-start shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all select-none active:scale-[0.97] ${
                  isActive
                    ? "text-white border-transparent font-semibold shadow-xs"
                    : "bg-white/80 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 border-zinc-200/70 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white font-medium"
                }`}
                style={isActive ? { backgroundColor: "#e84a27" } : undefined}
              >
                {Icon ? (
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-zinc-500"}`} />
                ) : (
                  pill.kind === "dietary" &&
                  pill.emoji && <span aria-hidden>{pill.emoji}</span>
                )}
                <span className="tracking-tight whitespace-nowrap">{pill.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inline Accordion (shifts feed cards down naturally, no modal) */}
      {isExpanded && (
        <div className="w-full border-t border-black/[0.06] dark:border-white/[0.08] bg-[#f7f4ed]/95 dark:bg-[#151413]/95 px-4 py-3.5 space-y-3.5 animate-in slide-in-from-top-2 duration-200">
          {/* Dimension 1: Spot Type */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Spot Type
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "all" as const, label: "All Types", icon: "✦" },
                { id: "restaurant" as const, label: "Sit-down", icon: "🍽️" },
                { id: "food_truck" as const, label: "Food Trucks", icon: "🚚" },
                { id: "popup" as const, label: "Pop-ups & Residencies", icon: "🎪" },
              ].map((st) => {
                const isActive = (spotTypeFilter || "all") === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSpotTypeFilter(st.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all active:scale-95 ${
                      isActive
                        ? "bg-[#e84a27] text-white border-[#e84a27] font-bold shadow-xs"
                        : "bg-white dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:bg-zinc-100"
                    }`}
                  >
                    <span>{st.icon}</span>
                    <span>{st.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dimension 2: Cuisines & Specialities */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Cuisines & Craving
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {CUISINES.map((c) => {
                const isActive = currentCategory === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFeedCategory(isActive ? "all" : c.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1 transition-all active:scale-95 ${
                      isActive
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold border-transparent shadow-xs"
                        : "bg-white dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:bg-zinc-100"
                    }`}
                  >
                    <span>{c.emoji}</span>
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dimension 3: Dietary Tags */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Dietary Preferences
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "vegan" as const, label: "Vegan", emoji: "🌱" },
                { id: "vegetarian" as const, label: "Vegetarian-Friendly", emoji: "🌿" },
                { id: "halal" as const, label: "Halal", emoji: "✦" },
                { id: "gluten_free" as const, label: "Gluten-Free", emoji: "🌾" },
              ].map((d) => {
                const isActive = selectedDietary.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDietary(d.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1 transition-all active:scale-95 ${
                      isActive
                        ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs"
                        : "bg-white dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:bg-zinc-100"
                    }`}
                  >
                    <span>{d.emoji}</span>
                    <span>{d.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dimension 4: Vibe, Status & Price Tier */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-black/[0.05] dark:border-white/[0.06]">
            <div className="flex flex-wrap items-center gap-2">
              {/* Open Now toggle */}
              <button
                type="button"
                onClick={() => setFilters({ open_now: !openNow })}
                className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all ${
                  openNow
                    ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs"
                    : "bg-white dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:bg-zinc-100"
                }`}
              >
                <span>🟢</span>
                <span>Open Now</span>
              </button>

              {/* Staff Picks toggle */}
              <button
                type="button"
                onClick={toggleStaffPicksOnly}
                className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all ${
                  staffPicksOnly
                    ? "bg-[#e84a27] text-white border-[#e84a27] font-bold shadow-xs"
                    : "bg-white dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:bg-zinc-100"
                }`}
              >
                <span>✦</span>
                <span>Staff Picks</span>
              </button>

              {/* Price Tier Segmented Pill */}
              <div className="flex items-center gap-0.5 bg-white dark:bg-white/5 p-0.5 rounded-full border border-zinc-200 dark:border-white/10">
                {(["$", "$$", "$$$"] as const).map((tier) => {
                  const isActive = priceTierFilter === tier;
                  return (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setPriceTierFilter(isActive ? null : tier)}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold transition-all ${
                        isActive
                          ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xs"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                      }`}
                      title={`Price range ${tier}`}
                    >
                      {tier}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reset All Filters button */}
            {hasAnyActiveFilter && (
              <button
                type="button"
                onClick={handleResetAll}
                className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-medium transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
