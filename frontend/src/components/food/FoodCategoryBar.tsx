"use client";

import React from "react";
import { FOOD_CATEGORIES } from "@/lib/foodSeeds";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { FoodCategory } from "@/types";
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
} from "./FoodIcons";

interface FoodCategoryBarProps {
  compact?: boolean;
}

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

export function FoodCategoryBar({ compact = false }: FoodCategoryBarProps) {
  const currentCategory = useCityPulseStore((state) => state.feedCategory);
  const setFeedCategory = useCityPulseStore((state) => state.setFeedCategory);
  const foodPosts = useCityPulseStore((state) => state.foodPosts);

  const getCategoryCount = (catId: FoodCategory) => {
    if (catId === "all") return foodPosts.length;
    return foodPosts.filter((p) => p.category === catId).length;
  };

  return (
    <div
      className={`w-full overflow-x-auto no-scrollbar ${
        compact
          ? "py-2 px-3 bg-transparent"
          : "py-2.5 px-4 bg-[#FAF7F2]/65 dark:bg-[#181615]/65 backdrop-blur-xl border-b border-black/[0.06]"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 min-w-max">
        {FOOD_CATEGORIES.map((cat) => {
          const isActive = currentCategory === cat.id;
          const count = getCategoryCount(cat.id);
          const Icon = CATEGORY_ICON_MAP[cat.id] || AllFoodIcon;

          return (
            <button
              key={cat.id}
              onClick={() => setFeedCategory(cat.id)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all select-none ${
                isActive
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold shadow-xs"
                  : "bg-white/55 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/15 text-zinc-700 dark:text-zinc-200 font-normal backdrop-blur-sm border border-black/[0.06] dark:border-white/10"
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 transition-colors ${
                  isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-900"
                }`}
              />
              <span className="tracking-tight">{cat.label}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-zinc-200/60 text-zinc-600"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
