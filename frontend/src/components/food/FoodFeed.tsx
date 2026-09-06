"use client";

import React from "react";
import { FoodCategoryBar } from "./FoodCategoryBar";
import { FoodPostCard } from "./FoodPostCard";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { Plus, UtensilsCrossed } from "lucide-react";
import { FOOD_CATEGORIES } from "@/lib/foodSeeds";

export function FoodFeed() {
  const foodPosts = useCityPulseStore((state) => state.foodPosts);
  const currentCategory = useCityPulseStore((state) => state.feedCategory);
  const searchQuery = useCityPulseStore((state) => state.filters.search_query);
  const setFeedCategory = useCityPulseStore((state) => state.setFeedCategory);
  const setIsCreateBiteModalOpen = useCityPulseStore((state) => state.setIsCreateBiteModalOpen);

  const filteredPosts = foodPosts.filter((post) => {
    if (currentCategory !== "all" && post.category !== currentCategory) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = post.dish_name.toLowerCase().includes(q);
      const matchSpot = post.spot_name.toLowerCase().includes(q);
      const matchTags = post.taste_tags.some((t) => t.toLowerCase().includes(q));
      const matchReview = post.review_text.toLowerCase().includes(q);
      if (!matchName && !matchSpot && !matchTags && !matchReview) {
        return false;
      }
    }

    return true;
  });

  const activeCategoryDef = FOOD_CATEGORIES.find((c) => c.id === currentCategory) || FOOD_CATEGORIES[0];

  return (
    <div className="flex-1 flex flex-col w-full h-full overflow-hidden bg-[#fafafa]">
      {/* Category Icon Filter Bar */}
      <FoodCategoryBar />

      {/* Feed Container */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5 no-scrollbar">
        {/* Header Bar */}
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 pb-2 border-b border-zinc-200/60">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                {activeCategoryDef.label}
              </h2>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                {filteredPosts.length}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {activeCategoryDef.shortDesc}
            </p>
          </div>

          <button
            onClick={() => setIsCreateBiteModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Dish</span>
          </button>
        </div>

        {/* Posts Grid */}
        {filteredPosts.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-zinc-200/80 p-8 space-y-3 max-w-md mx-auto">
            <UtensilsCrossed className="w-8 h-8 text-zinc-400 mx-auto" />
            <h3 className="text-sm font-semibold text-zinc-900">No dishes found</h3>
            <p className="text-xs text-zinc-500">
              Try choosing another craving category or reset your search.
            </p>
            <button
              onClick={() => setFeedCategory("all")}
              className="mt-2 px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-medium text-xs transition-colors"
            >
              Show All
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {filteredPosts.map((post) => (
              <FoodPostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
