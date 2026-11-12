"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles, X } from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";

/**
 * Global toast banner. Rendered once in the root layout so `showToast()` works
 * on every route (home, /admin, /mascot-studio, …).
 */
export function ToastBanner() {
  const toastMessage = useCityPulseStore((state) => state.toastMessage);
  const clearToast = useCityPulseStore((state) => state.clearToast);

  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          key={toastMessage}
          initial={{ opacity: 0, y: -14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 420, damping: 30, mass: 0.7 }}
          className="fixed top-20 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:max-w-md z-[200] flex items-center justify-between gap-3 pl-4 pr-3 py-2.5 rounded-2xl bg-zinc-900/95 text-white text-xs font-medium shadow-2xl backdrop-blur-md border border-zinc-700/60 overflow-hidden pointer-events-auto"
        >
          <span
            aria-hidden="true"
            className="absolute left-0 top-0 bottom-0 w-1 bg-[#E84A27]"
          />
          <span className="flex items-center gap-2 flex-1 min-w-0 leading-relaxed">
            <span className="w-6 h-6 rounded-full bg-[#E84A27]/20 text-[#FF9A7C] flex items-center justify-center shrink-0">
              <Sparkles className="w-3 h-3" />
            </span>
            <span className="truncate">{toastMessage}</span>
          </span>
          <button
            onClick={clearToast}
            className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors shrink-0 cursor-pointer"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <motion.span
            aria-hidden="true"
            className="absolute bottom-0 left-0 h-0.5 bg-[#E84A27]/70"
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 4.5, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
