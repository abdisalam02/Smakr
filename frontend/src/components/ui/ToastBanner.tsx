"use client";

import React from "react";
import { X } from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";

/**
 * Global toast banner. Rendered once in the root layout so `showToast()` works
 * on every route (home, /admin, /mascot-studio, …).
 */
export function ToastBanner() {
  const toastMessage = useCityPulseStore((state) => state.toastMessage);
  const clearToast = useCityPulseStore((state) => state.clearToast);

  if (!toastMessage) return null;

  return (
    <div className="fixed top-20 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:max-w-md z-[200] flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-zinc-900/95 text-white text-xs font-medium shadow-2xl backdrop-blur-md border border-zinc-700/60 animate-in fade-in slide-in-from-top-3 duration-200">
      <span className="flex-1 leading-relaxed">{toastMessage}</span>
      <button
        onClick={clearToast}
        className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors shrink-0"
        aria-label="Dismiss message"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
