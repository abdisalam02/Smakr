"use client";

import React from "react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { DietaryTag, FoodCategory } from "@/types";
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
  street_food: TacoIcon,
  sushi: SushiIcon,
  dessert: DessertIcon,
  drinks: DrinksIcon,
};

type Pill =
  | { kind: "category"; id: FoodCategory; label: string }
  | { kind: "dietary"; id: DietaryTag; label: string; emoji: string };

/**
 * ONE unified, horizontally-scrollable pill row — craving categories first, then
 * dietary toggles, then the secondary categories. Replaces the old stacked
 * category + dietary rows.
 */
const PILLS: Pill[] = [
  { kind: "category", id: "all", label: "All" },
  { kind: "category", id: "coffee", label: "Coffee & Drinks" },
  { kind: "category", id: "bakery", label: "Bakeries" },
  { kind: "category", id: "ramen", label: "Ramen" },
  { kind: "category", id: "burger", label: "Burgers" },
  { kind: "dietary", id: "vegan", label: "Vegan", emoji: "🌱" },
  { kind: "dietary", id: "halal", label: "Halal", emoji: "" },
  { kind: "category", id: "pizza", label: "Pizza" },
  { kind: "category", id: "street_food", label: "Street Food" },
  { kind: "category", id: "sushi", label: "Sushi" },
  { kind: "category", id: "dessert", label: "Sweets" },
  { kind: "category", id: "drinks", label: "Bars" },
];

interface FeedFilterBarProps {
  compact?: boolean;
}

export function FeedFilterBar({ compact = false }: FeedFilterBarProps) {
  const currentCategory = useCityPulseStore((state) => state.feedCategory);
  const setFeedCategory = useCityPulseStore((state) => state.setFeedCategory);
  const selectedDietary = useCityPulseStore((state) => state.selectedDietary);
  const toggleDietary = useCityPulseStore((state) => state.toggleDietary);

  return (
    <div
      className={`w-full bg-[#fbf9f5]/90 backdrop-blur-md border-b border-black/[0.06] ${
        compact ? "py-1.5" : "py-2"
      }`}
    >
      <div className="w-full overflow-x-auto no-scrollbar px-3 snap-x snap-mandatory">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 min-w-max">
          {PILLS.map((pill) => {
            const isActive =
              pill.kind === "category"
                ? currentCategory === pill.id
                : selectedDietary.includes(pill.id);

            const Icon = pill.kind === "category" ? CATEGORY_ICON_MAP[pill.id] : null;

            return (
              <button
                key={`${pill.kind}-${pill.id}`}
                onClick={() =>
                  pill.kind === "category"
                    ? setFeedCategory(pill.id)
                    : toggleDietary(pill.id)
                }
                aria-pressed={isActive}
                className={`snap-start shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all select-none active:scale-[0.97] ${
                  isActive
                    ? "text-white border-transparent font-semibold shadow-xs"
                    : "bg-white/80 text-zinc-600 border-zinc-200/70 hover:bg-white hover:text-zinc-900 font-medium"
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
    </div>
  );
}
