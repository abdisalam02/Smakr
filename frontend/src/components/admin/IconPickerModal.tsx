"use client";

import React, { useState, useMemo } from "react";
import { X, Search, Sparkles } from "lucide-react";
import { FOOD_ICONS_CATALOG, searchFoodIcons } from "@/lib/foodIconsCatalog";

interface IconPickerModalProps {
  currentIcon?: string;
  onSelect: (icon: string) => void;
  onClose: () => void;
}

const CATEGORY_TABS = [
  { id: "all", label: "All" },
  { id: "dumplings", label: "Dumplings" },
  { id: "tacos", label: "Tacos & Street" },
  { id: "ramen", label: "Ramen" },
  { id: "pizza", label: "Pizza & Burgers" },
  { id: "bakery", label: "Bakery" },
  { id: "coffee", label: "Coffee & Matcha" },
  { id: "dessert", label: "Sweets" },
  { id: "drinks", label: "Drinks" },
  { id: "spots", label: "Trucks & Pop-ups" },
];

export function IconPickerModal({ currentIcon, onSelect, onClose }: IconPickerModalProps) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredIcons = useMemo(() => {
    let list = searchFoodIcons(query);
    if (activeTab !== "all") {
      if (activeTab === "tacos") {
        list = list.filter((i) => i.category === "tacos" || i.category === "street_food");
      } else if (activeTab === "pizza") {
        list = list.filter((i) => i.category === "pizza" || i.category === "burger");
      } else if (activeTab === "coffee") {
        list = list.filter((i) => i.category === "coffee" || i.category === "matcha");
      } else {
        list = list.filter((i) => i.category === activeTab);
      }
    }
    return list;
  }, [query, activeTab]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="w-full sm:max-w-md max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[#FAF7F2] dark:bg-[#1c1a19] border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#e84a27]/10 text-[#e84a27] flex items-center justify-center text-base">
              {currentIcon || "✨"}
            </span>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-comico">
                Choose Food / Spot Icon
              </h3>
              <p className="text-[11px] text-zinc-500">Searchable catalog — sticks to venue & map pins</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-black/5 dark:border-white/5 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search icons (e.g. dumpling, truck, taco, coffee, pizza)…"
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-[#e84a27] focus:ring-1 focus:ring-[#e84a27]"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setQuery("");
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#e84a27] text-white shadow-xs"
                    : "bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Icons Grid */}
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-4 sm:grid-cols-5 gap-2 no-scrollbar">
          {filteredIcons.map((item) => {
            const isSelected = currentIcon === item.emoji;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelect(item.emoji);
                  onClose();
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all active:scale-95 text-center ${
                  isSelected
                    ? "bg-[#e84a27]/10 border-[#e84a27] ring-2 ring-[#e84a27]/20"
                    : "bg-white dark:bg-white/5 border-black/5 dark:border-white/10 hover:border-[#e84a27]/40 shadow-2xs"
                }`}
                title={item.name}
              >
                <span className="text-2xl leading-none select-none">{item.emoji}</span>
                <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-300 mt-1 truncate max-w-full">
                  {item.name.split("/")[0].trim()}
                </span>
              </button>
            );
          })}
          {filteredIcons.length === 0 && (
            <div className="col-span-full py-8 text-center text-xs text-zinc-500">
              No matching icons found for &ldquo;{query}&rdquo;.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            {filteredIcons.length} available icons
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold hover:bg-zinc-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
