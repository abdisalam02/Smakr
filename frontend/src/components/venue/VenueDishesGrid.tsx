"use client";

import React from "react";
import { Bookmark } from "lucide-react";
import type { FoodPost } from "@/types";

interface VenueDishesGridProps {
  dishes: FoodPost[];
  title?: string;
  savedPostIds: Set<string>;
  onToggleSave: (postId: string) => void;
  onSelectDish: (dish: FoodPost) => void;
}

export function VenueDishesGrid({
  dishes,
  title = "Dishes You Can't Miss",
  savedPostIds,
  onToggleSave,
  onSelectDish,
}: VenueDishesGridProps) {
  if (dishes.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-comico font-normal text-[18px] tracking-tight uppercase text-[#181615] dark:text-white">
          {title}
        </h4>
        <span className="px-2 py-0.5 rounded-full bg-[#EFE9DF] dark:bg-white/10 text-[#181615] dark:text-white font-comico text-[11px] tabular-nums">
          {dishes.length}
        </span>
      </div>

      <div
        data-horizontal-carousel="true"
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 pb-1 [touch-action:pan-x_pan-y]"
      >
        {dishes.map((dish) => {
          const isSaved = savedPostIds.has(dish.id);
          const imgSrc =
            dish.image_url?.startsWith("/api/places/photos") &&
            !dish.image_url.includes("w=")
              ? `${dish.image_url}&w=420`
              : dish.image_url;

          return (
            <article
              key={dish.id}
              onClick={() => onSelectDish(dish)}
              className="group w-[156px] sm:w-[172px] shrink-0 snap-start cursor-pointer flex flex-col gap-1.5"
            >
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#181615] border border-[#181615]/10 dark:border-white/10 shadow-xs transition-transform duration-200 group-active:scale-[0.97]">
                {imgSrc ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={imgSrc}
                    alt={dish.dish_name}
                    loading="eager"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                ) : null}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSave(dish.id);
                  }}
                  aria-label={isSaved ? "Saved to your list" : "Save dish"}
                  className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md border transition-all cursor-pointer active:scale-90 ${
                    isSaved
                      ? "bg-[#E84A27] text-white border-[#E84A27]"
                      : "bg-black/45 text-white/90 border-white/20 hover:bg-black/70"
                  }`}
                >
                  <Bookmark
                    className={`w-3.5 h-3.5 ${isSaved ? "fill-white" : ""}`}
                  />
                </button>

                {typeof dish.price_nok === "number" && dish.price_nok > 0 && (
                  <span className="absolute bottom-2 right-2 z-10 px-2 py-0.5 rounded-full bg-[#E84A27] text-white font-comico font-normal text-[10.5px] shadow-sm">
                    {dish.price_nok} kr
                  </span>
                )}
              </div>

              <h5 className="font-comico font-normal text-[13px] leading-[1.2] uppercase text-[#181615] dark:text-white line-clamp-2 px-0.5 group-hover:text-[#E84A27] transition-colors">
                {dish.dish_name}
              </h5>
            </article>
          );
        })}
      </div>
    </div>
  );
}
