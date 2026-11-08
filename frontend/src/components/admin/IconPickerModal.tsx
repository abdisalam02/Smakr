"use client";

import React, { useState, useMemo } from "react";
import { X, Search } from "lucide-react";
import { searchFoodIcons, FoodIconEntry } from "@/lib/foodIconsCatalog";
import {
  SmakrFoodIcon,
  DISH_ICON_WEBP,
  GROUP_FILTER_WEBP,
  SMAKR_ICON_SVG_BODIES,
  isCustomFoodIcon,
} from "@/components/food/FoodIcons";

interface IconPickerModalProps {
  currentIcon?: string;
  initialTab?: string;
  onSelect: (icon: string, item?: FoodIconEntry) => void;
  onClose: () => void;
}

const CATEGORY_TABS = [
  { id: "all", label: "All" },
  { id: "custom", label: "✦ Custom Art" },
  { id: "chicken", label: "Chicken & Grill" },
  { id: "pizza", label: "Pizza, Pasta & Burgers" },
  { id: "bakery", label: "Bakery & Breads" },
  { id: "coffee", label: "Coffee & Matcha" },
  { id: "ramen", label: "Ramen, Pho & Asian" },
  { id: "dumplings", label: "Dumplings & Bao" },
  { id: "tacos", label: "Tacos & Street" },
  { id: "sushi", label: "Sushi & Seafood" },
  { id: "indian", label: "Curry & Rice Bowls" },
  { id: "dessert", label: "Sweets & Gelato" },
  { id: "drinks", label: "Wine & Drinks" },
  { id: "spots", label: "Trucks & Pop-ups" },
];

function hasSmakrCustomIcon(id: string): boolean {
  return Boolean(
    id in DISH_ICON_WEBP ||
      id in SMAKR_ICON_SVG_BODIES ||
      isCustomFoodIcon(id)
  );
}

export function IconPickerModal({
  currentIcon,
  initialTab = "all",
  onSelect,
  onClose,
}: IconPickerModalProps) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState(initialTab === "filter_group" ? "all" : initialTab);

  const filteredIcons = useMemo(() => {
    // Parent filter groups belong strictly in the filter bar, never on individual dish/spot pins
    let list = searchFoodIcons(query).filter(
      (i) => i.category !== "filter_group" && !(i.id in GROUP_FILTER_WEBP)
    );
    if (activeTab !== "all") {
      if (activeTab === "custom") {
        list = list.filter((i) => i.isCustomArt || hasSmakrCustomIcon(i.id));
      } else if (activeTab === "chicken") {
        list = list.filter(
          (i) =>
            i.category !== "filter_group" &&
            (i.category === "k_chicken" ||
              i.category === "fried_chicken" ||
              i.category === "kebab" ||
              i.id === "k_chicken" ||
              i.id === "fried_chicken")
        );
      } else if (activeTab === "pizza") {
        list = list.filter(
          (i) =>
            i.category !== "filter_group" &&
            (i.category === "pizza" ||
              i.category === "pasta" ||
              i.category === "burger" ||
              i.id === "pizza" ||
              i.id === "pasta")
        );
      } else if (activeTab === "bakery") {
        list = list.filter(
          (i) =>
            i.category !== "filter_group" &&
            (i.category === "bakery" ||
              i.category === "cinnamon_roll" ||
              i.category === "naan" ||
              i.id === "cinnamon_roll" ||
              i.id === "croissant" ||
              i.id === "cardamom_bun")
        );
      } else if (activeTab === "coffee") {
        list = list.filter(
          (i) =>
            i.category !== "filter_group" &&
            (i.category === "coffee" || i.category === "matcha")
        );
      } else if (activeTab === "ramen") {
        list = list.filter(
          (i) =>
            i.category !== "filter_group" &&
            (i.category === "ramen" ||
              i.category === "vietnamese" ||
              i.id === "banh_mi" ||
              i.id === "pho")
        );
      } else if (activeTab === "dumplings") {
        list = list.filter(
          (i) =>
            i.category !== "filter_group" &&
            (i.category === "dumplings" || i.category === "bao")
        );
      } else if (activeTab === "tacos") {
        list = list.filter(
          (i) =>
            i.category !== "filter_group" &&
            (i.category === "tacos" || i.category === "street_food")
        );
      } else if (activeTab === "sushi") {
        list = list.filter(
          (i) =>
            i.category !== "filter_group" &&
            (i.category === "sushi" ||
              i.id === "nordic_seafood" ||
              i.id === "poke")
        );
      } else if (activeTab === "indian") {
        list = list.filter(
          (i) =>
            i.category !== "filter_group" &&
            (i.category === "indian" ||
              i.category === "naan" ||
              i.category === "mandi_rice" ||
              i.id === "curry" ||
              i.id === "mandi_rice")
        );
      } else {
        list = list.filter((i) => i.category === activeTab);
      }
    }

    // Deduplicate visuals in the picker grid so aliases/duplicates don't repeat
    const seenVisuals = new Set<string>();
    return list.filter((item) => {
      const isCustom = Boolean(item.isCustomArt || hasSmakrCustomIcon(item.id));
      const visualKey = isCustom ? item.id : item.emoji;
      if (seenVisuals.has(visualKey)) return false;
      seenVisuals.add(visualKey);
      return true;
    });
  }, [query, activeTab]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-[#181615]/30 backdrop-blur-[2px] p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="w-full sm:max-w-lg max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[#FAF7F2] text-[#181615] border border-[#E6DDD0] shadow-[-8px_12px_36px_rgba(24,22,21,0.18)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#E6DDD0] bg-[#FAF7F2]/95">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#E84A27]/12 border border-[#E84A27]/25 text-[#E84A27] flex items-center justify-center text-base overflow-hidden p-1">
              {currentIcon && hasSmakrCustomIcon(currentIcon) ? (
                <SmakrFoodIcon name={currentIcon} className="w-7 h-7 object-contain" />
              ) : (
                currentIcon || "✨"
              )}
            </span>
            <div>
              <h3
                className="text-base font-extrabold text-[#181615] tracking-tight"
                style={{ fontFamily: "var(--font-comico), sans-serif" }}
              >
                Choose Dish &amp; Spot Icon
              </h3>
              <p className="text-[11px] font-medium text-[#6B6459]">
                Custom hand-painted WebPs, duotone vectors &amp; foodie glyphs
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#181615]/6 hover:bg-[#181615]/12 flex items-center justify-center text-[#181615] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar & Category Chips */}
        <div className="p-3.5 border-b border-[#E6DDD0] bg-white/60 space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6459]" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search icons (e.g. k_chicken, pizza, pasta, ramen, croissant)…"
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-[#FAF7F2] border border-[#D8CFC0] text-xs font-semibold text-[#181615] placeholder:text-[#181615]/40 focus:outline-none focus:border-[#E84A27] focus:ring-2 focus:ring-[#E84A27]/15 transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6459] hover:text-[#181615]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setQuery("");
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] whitespace-nowrap border transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#E84A27] text-white border-[#E84A27] font-bold shadow-xs"
                    : "bg-[#F3EDE2] hover:bg-[#EAE1D3] border-[#E2D9C8] text-[#181615]/80 font-semibold"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Icons Grid */}
        <div className="flex-1 overflow-y-auto p-3.5 grid grid-cols-4 sm:grid-cols-5 gap-2 no-scrollbar bg-[#FAF7F2]">
          {filteredIcons.map((item) => {
            const isCustom = Boolean(item.isCustomArt || hasSmakrCustomIcon(item.id));
            const isSelected = isCustom
              ? currentIcon === item.id || currentIcon === item.category
              : currentIcon === item.emoji;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(isCustom ? item.id : item.emoji, item);
                  onClose();
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all active:scale-95 text-center cursor-pointer ${
                  isSelected
                    ? "bg-[#E84A27]/12 border-[#E84A27] ring-2 ring-[#E84A27]/20"
                    : "bg-white/90 border-[#E6DDD0] hover:border-[#E84A27]/45 shadow-[0_1px_4px_rgba(24,22,21,0.04)]"
                }`}
                title={item.name}
              >
                {isCustom ? (
                  <div className="w-8 h-8 flex items-center justify-center select-none">
                    <SmakrFoodIcon name={item.id} className="w-8 h-8 object-contain" />
                  </div>
                ) : (
                  <span className="text-2xl leading-none select-none">{item.emoji}</span>
                )}
                <span className="text-[10px] font-semibold text-[#181615]/85 mt-1.5 truncate max-w-full">
                  {item.name.split("/")[0].split("(")[0].trim()}
                </span>
              </button>
            );
          })}
          {filteredIcons.length === 0 && (
            <div className="col-span-full py-8 text-center text-xs font-medium text-[#6B6459]">
              No matching icons found for &ldquo;{query}&rdquo;.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#E6DDD0] bg-[#FAF7F2]/95 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#6B6459]">
            {filteredIcons.length} available icons
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-[#F3EDE2] hover:bg-[#EAE1D3] border border-[#E2D9C8] text-[#181615] text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
