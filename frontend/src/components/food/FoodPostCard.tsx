"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ThumbsUp,
  MapPin,
  ArrowUpRight,
  Bookmark,
} from "lucide-react";
import { FoodPost } from "@/types";
import { useCityPulseStore } from "@/store/useCityPulseStore";

interface FoodPostCardProps {
  post: FoodPost;
}

export function FoodPostCard({ post }: FoodPostCardProps) {
  const likedPostIds = useCityPulseStore((state) => state.likedPostIds);
  const savedPostIds = useCityPulseStore((state) => state.savedPostIds);
  const toggleLikePost = useCityPulseStore((state) => state.toggleLikePost);
  const toggleSavePost = useCityPulseStore((state) => state.toggleSavePost);
  const flyToSpot = useCityPulseStore((state) => state.flyToSpot);

  const isLiked = likedPostIds.has(post.id);
  const isSaved = savedPostIds.has(post.id);
  const [showHeart, setShowHeart] = useState(false);

  const handleDoubleTap = () => {
    if (!isLiked) toggleLikePost(post.id);
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 700);
  };

  const handleFlyToRadar = (e: React.MouseEvent) => {
    e.stopPropagation();
    flyToSpot(post.spot_coords, post.spot_id);
  };

  return (
    <article
      onClick={handleFlyToRadar}
      onDoubleClick={handleDoubleTap}
      className="group relative w-full aspect-[4/5] rounded-3xl overflow-hidden border border-zinc-200/70 shadow-sm hover:shadow-md transition-all duration-300 select-none cursor-pointer bg-zinc-900"
    >
      {/* Full-bleed Photo Background */}
      <Image
        src={post.image_url}
        alt={post.dish_name}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
        priority
      />

      {/* Cinematic Vignette Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/35 pointer-events-none" />

      {/* Quick Heart Burst on Double Tap */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in-50 duration-200">
          <div className="p-4 rounded-full bg-white/20 backdrop-blur-md">
            <ThumbsUp className="w-12 h-12 text-white fill-orange-500 stroke-white" />
          </div>
        </div>
      )}

      {/* Top Floating Info: Price Tag & Rating Badge */}
      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-auto">
        <span className="px-3 py-1 rounded-full bg-black/55 backdrop-blur-md text-white font-mono font-semibold text-xs border border-white/15 shadow-xs">
          {post.price_nok} NOK
        </span>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-zinc-900 font-bold text-xs shadow-xs">
            <span className="text-amber-500 text-[10px]">★</span>
            <span className="font-mono">{post.rating}</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSavePost(post.id);
            }}
            className={`p-1.5 rounded-full backdrop-blur-md border transition-all ${
              isSaved
                ? "bg-white text-zinc-900 border-white"
                : "bg-black/40 text-white/80 border-white/15 hover:bg-black/60"
            }`}
            title={isSaved ? "Saved" : "Save dish"}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-zinc-900" : ""}`} />
          </button>
        </div>
      </div>

      {/* Bottom Content Area Directly on Image */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pt-8 text-white flex flex-col justify-end space-y-2 pointer-events-auto">
        {/* Dish Title & Location */}
        {/* Dish Title, Location & Insider Foodie Comment */}
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-snug drop-shadow-sm">
            {post.dish_name}
          </h3>
          <p className="text-xs text-zinc-300 font-medium flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-[#ff5500] shrink-0" />
            <span className="font-semibold text-white">{post.spot_name}</span>
            {post.spot_neighborhood && (
              <span className="text-zinc-300 font-normal">
                · {post.spot_neighborhood}
              </span>
            )}
          </p>
          {/* Insider Foodie Review / Comment */}
          {post.review_text && (
            <p className="text-[11.5px] text-zinc-200/95 leading-relaxed line-clamp-2 mt-1.5 font-normal italic drop-shadow-xs bg-black/35 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/10">
              "{post.review_text}"
            </p>
          )}
        </div>

        {/* User Profile, Likes & Map Action */}
        <div className="pt-2 border-t border-white/15 flex items-center justify-between gap-2">
          {/* User Profile */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/30 shrink-0 bg-zinc-800">
              <Image
                src={post.author.avatar_url}
                alt={post.author.name}
                fill
                className="object-cover"
                sizes="24px"
              />
            </div>
            <span className="text-xs text-zinc-200 font-medium truncate">
              {post.author.handle}
            </span>
          </div>

          {/* Thumbs Up & Map Link Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Thumbs Up Recommend */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLikePost(post.id);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md transition-all ${
                isLiked
                  ? "bg-orange-500 text-white shadow-xs"
                  : "bg-white/15 hover:bg-white/25 text-white border border-white/15"
              }`}
            >
              <ThumbsUp
                className={`w-3 h-3 ${isLiked ? "fill-white" : ""}`}
              />
              <span className="font-mono text-xs">{post.likes_count}</span>
            </button>

            {/* Direct Map Fly-To */}
            <button
              onClick={handleFlyToRadar}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-zinc-900 hover:bg-zinc-100 font-semibold text-xs shadow-xs transition-colors"
              title="Locate restaurant on map"
            >
              <span>Map</span>
              <ArrowUpRight className="w-3 h-3 text-zinc-600" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
