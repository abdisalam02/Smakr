"use client";

import React from "react";
import { FoodCategoryBar } from "./FoodCategoryBar";
import { FoodPostCard } from "./FoodPostCard";
import { FoodSpotCard } from "./FoodSpotCard";
import { FoodViewSlider } from "./FoodViewSlider";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { Plus, UtensilsCrossed, MapPin } from "lucide-react";
import { FOOD_CATEGORIES } from "@/lib/foodSeeds";
import { isVisibleInFeed } from "@/lib/popupUtils";

export function FoodFeed() {
  const venues = useCityPulseStore((state) => state.venues);
  const foodPosts = useCityPulseStore((state) => state.foodPosts);
  const currentCategory = useCityPulseStore((state) => state.feedCategory);
  const feedMode = useCityPulseStore((state) => state.feedMode);
  const searchQuery = useCityPulseStore((state) => state.filters.search_query);
  const spotTypeFilter = useCityPulseStore((state) => state.filters.spot_type);
  const priceTierFilter = useCityPulseStore((state) => state.filters.price_tier);
  const staffPicksOnly = useCityPulseStore((state) => state.filters.staff_picks_only);
  const currentUser = useCityPulseStore((state) => state.currentUser);
  const setFeedCategory = useCityPulseStore((state) => state.setFeedCategory);
  const openCreateDish = useCityPulseStore((state) => state.openCreateDish);

  const filteredPosts = foodPosts.filter((post) => {
    // Hide drafts from public
    if (currentUser?.role !== "admin") {
      if (post.is_published === false || post.is_archived === true) return false;
    }

    if (currentCategory !== "all" && post.category !== currentCategory) {
      return false;
    }

    const linkedVenue = venues.find((v) => v.id === post.spot_id);

    // Expired pop-ups
    if (!isVisibleInFeed(linkedVenue)) return false;

    // Spot Type filter
    if (spotTypeFilter && spotTypeFilter !== "all") {
      const vType = linkedVenue?.spot_type || "restaurant";
      if (vType !== spotTypeFilter) return false;
    }

    // Price Tier filter
    if (priceTierFilter) {
      if (post.price_tier && post.price_tier === priceTierFilter) {
        // match
      } else if (linkedVenue?.price_level && linkedVenue.price_level === priceTierFilter) {
        // match
      } else if (typeof post.price_nok === "number" && post.price_nok > 0) {
        const tier = post.price_nok <= 120 ? "$" : post.price_nok <= 250 ? "$$" : "$$$";
        if (tier !== priceTierFilter) return false;
      } else {
        return false;
      }
    }

    // Staff Picks only
    if (staffPicksOnly && !post.is_official_pick) return false;

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

  const filteredVenues = venues
    .filter((venue) => {
      if (!isVisibleInFeed(venue)) return false;

      // Spot Type filter
      if (spotTypeFilter && spotTypeFilter !== "all") {
        const vType = venue.spot_type || "restaurant";
        if (vType !== spotTypeFilter) return false;
      }

      // Price Tier filter
      if (priceTierFilter && venue.price_level !== priceTierFilter) return false;

      // Staff Picks only
      if (staffPicksOnly && !venue.is_official_pick) return false;

      if (currentCategory !== "all") {
        if (venue.food_category !== currentCategory) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = venue.name.toLowerCase().includes(q);
        const matchAddress = venue.address.toLowerCase().includes(q);
        const matchCity = venue.city.toLowerCase().includes(q);
        const matchDishes = venue.signature_dishes?.some((d) =>
          d.toLowerCase().includes(q)
        );
        if (!matchName && !matchAddress && !matchCity && !matchDishes)
          return false;
      }
      return true;
    })
    .sort((a, b) => (a.distance_meters || 9999) - (b.distance_meters || 9999));

  const activeCategoryDef = FOOD_CATEGORIES.find((c) => c.id === currentCategory) || FOOD_CATEGORIES[0];

  return (
    <div className="flex-1 flex flex-col w-full h-full overflow-hidden bg-[#fafafa] relative">
      {/* Category Icon Filter Bar */}
      <FoodCategoryBar />

      {/* Feed Container */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5 no-scrollbar pb-36">
        {/* Header Bar */}
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 pb-2 border-b border-zinc-200/60">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                {feedMode === "food" ? activeCategoryDef.label : "Oslo Food Spots"}
              </h2>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                {feedMode === "food" ? filteredPosts.length : filteredVenues.length}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {feedMode === "food"
                ? activeCategoryDef.shortDesc
                : "Curated Oslo eateries, cafes & restaurants"}
            </p>
          </div>

          <button
            onClick={() => openCreateDish()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Dish</span>
          </button>
        </div>

        {/* Posts Grid or Spots Grid */}
        {feedMode === "food" ? (
          filteredPosts.length === 0 ? (
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
          )
        ) : (
          filteredVenues.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-zinc-200/80 p-8 space-y-3 max-w-md mx-auto">
              <MapPin className="w-8 h-8 text-zinc-400 mx-auto" />
              <h3 className="text-sm font-semibold text-zinc-900">No spots found</h3>
              <p className="text-xs text-zinc-500">
                Try choosing another category or reset your search.
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
              {filteredVenues.map((venue) => (
                <FoodSpotCard key={venue.id} venue={venue} />
              ))}
            </div>
          )
        )}
      </div>

      {/* Floating Glassmorphism Slider */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20 pointer-events-none">
        <FoodViewSlider
          dishesCount={filteredPosts.length}
          spotsCount={filteredVenues.length}
        />
      </div>
    </div>
  );
}
