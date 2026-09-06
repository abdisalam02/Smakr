"use client";

import React, { useState } from "react";
import { X, Camera, Plus } from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { FOOD_CATEGORIES, INITIAL_FOOD_SPOTS } from "@/lib/foodSeeds";
import { FoodCategory, FoodPost } from "@/types";

const PRESET_PHOTOS = [
  { label: "Vietnamese Coffee", url: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=1200&q=80" },
  { label: "Bánh Mì / Sandwich", url: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=1200&q=80" },
  { label: "Cardamom Knot", url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80" },
  { label: "Ramen Bowl", url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80" },
  { label: "Smash Burger", url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80" },
  { label: "Artisanal Pizza", url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80" },
  { label: "Fish & Chips", url: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80" },
  { label: "Gelato", url: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=1200&q=80" },
];

export function CreateFoodPostModal() {
  const isCreateBiteModalOpen = useCityPulseStore((state) => state.isCreateBiteModalOpen);
  const setIsCreateBiteModalOpen = useCityPulseStore((state) => state.setIsCreateBiteModalOpen);
  const addFoodPost = useCityPulseStore((state) => state.addFoodPost);
  const currentUser = useCityPulseStore((state) => state.currentUser);

  const [dishName, setDishName] = useState("");
  const [spotId, setSpotId] = useState(INITIAL_FOOD_SPOTS[0].id);
  const [category, setCategory] = useState<FoodCategory>("coffee");
  const [priceNok, setPriceNok] = useState<number>(78);
  const [rating, setRating] = useState<number>(9.5);
  const [tasteTagsStr, setTasteTagsStr] = useState("Creamy, Iced, Coconut");
  const [reviewText, setReviewText] = useState("");
  const [imageUrl, setImageUrl] = useState(PRESET_PHOTOS[0].url);

  if (!isCreateBiteModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim()) return;

    const selectedSpot = INITIAL_FOOD_SPOTS.find((s) => s.id === spotId) || INITIAL_FOOD_SPOTS[0];
    const tags = tasteTagsStr
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newPost: FoodPost = {
      id: `post-${Date.now()}`,
      spot_id: selectedSpot.id,
      spot_name: selectedSpot.name,
      spot_address: selectedSpot.address,
      spot_neighborhood: selectedSpot.city,
      spot_coords: [selectedSpot.longitude, selectedSpot.latitude],
      dish_name: dishName.trim(),
      category,
      image_url: imageUrl,
      price_nok: Number(priceNok) || 0,
      rating: Number(rating) || 9.0,
      taste_tags: tags.length > 0 ? tags : ["Delicious", "OsloEats"],
      review_text: reviewText.trim() || "Delicious meal in Oslo! Highly recommended.",
      author: currentUser || {
        id: "user-1",
        name: "Astrid Lindholm",
        handle: "@astrid_eats_oslo",
        avatar_url:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
        badge: "Verified Foodie",
      },
      likes_count: 1,
      saves_count: 0,
      created_at_relative: "Just now",
      item_availability: "Available Now",
    };

    addFoodPost(newPost);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-zinc-900">Post a Dish or Beverage</h2>
            <p className="text-xs text-zinc-500">Share what you had in Oslo</p>
          </div>
          <button
            onClick={() => setIsCreateBiteModalOpen(false)}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 no-scrollbar text-xs">
          <div>
            <label className="block font-semibold text-zinc-800 mb-1">
              Dish or Drink Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Iced Coconut Coffee"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-800 mb-1">
                Spot / Restaurant
              </label>
              <select
                value={spotId}
                onChange={(e) => setSpotId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-900"
              >
                {INITIAL_FOOD_SPOTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-800 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodCategory)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-900"
              >
                {FOOD_CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-800 mb-1">
                Price (NOK)
              </label>
              <input
                type="number"
                min="0"
                value={priceNok}
                onChange={(e) => setPriceNok(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-900 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-800 mb-1">
                Rating ({rating}/10)
              </label>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.1"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full accent-zinc-900 cursor-pointer mt-2"
              />
            </div>
          </div>

          {/* Preset Photos */}
          <div>
            <label className="block font-semibold text-zinc-800 mb-1.5 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-zinc-500" />
              <span>Select Photo Preset (or enter URL)</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {PRESET_PHOTOS.map((p) => (
                <button
                  type="button"
                  key={p.label}
                  onClick={() => setImageUrl(p.url)}
                  className={`text-[10px] font-medium py-1.5 px-2 rounded-lg border text-center transition-all ${
                    imageUrl === p.url
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <input
              type="url"
              placeholder="Or paste custom image link..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-900"
            />
          </div>

          {/* Taste Tags */}
          <div>
            <label className="block font-semibold text-zinc-800 mb-1">
              Taste Notes (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Iced, Creamy, Crispy, Rich"
              value={tasteTagsStr}
              onChange={(e) => setTasteTagsStr(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-900"
            />
          </div>

          {/* Review */}
          <div>
            <label className="block font-semibold text-zinc-800 mb-1">
              Review & Tips
            </label>
            <textarea
              rows={2}
              placeholder="What did you like about it?"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-900"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs shadow-xs transition-colors"
          >
            Post Dish
          </button>
        </form>
      </div>
    </div>
  );
}
