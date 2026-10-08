"use client";

import React, { useEffect, useState } from "react";
import { X, Loader2, Check, Send } from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * In-app Beta Feedback drawer — a lightweight, mobile-first bottom sheet that
 * lets private-beta testers report bugs, missing spots, or design notes.
 *
 * Submissions are written to `public.beta_feedback` with the reporter's account
 * plus device/viewport context attached for debugging.
 */

const CATEGORIES = [
  { id: "bug", emoji: "🐛", label: "Bug / Glitch" },
  { id: "missing", emoji: "🍜", label: "Missing Spot / Dish" },
  { id: "design", emoji: "✨", label: "Design / Vibe" },
  { id: "other", emoji: "💬", label: "Other" },
] as const;

type FeedbackCategory = (typeof CATEGORIES)[number]["id"];

export function BetaFeedbackDrawer() {
  const isOpen = useCityPulseStore((state) => state.isBetaFeedbackOpen);
  const setIsOpen = useCityPulseStore((state) => state.setIsBetaFeedbackOpen);
  const currentUser = useCityPulseStore((state) => state.currentUser);
  const showToast = useCityPulseStore((state) => state.showToast);

  const [category, setCategory] = useState<FeedbackCategory>("bug");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset the form each time the drawer opens.
  useEffect(() => {
    if (!isOpen) return;
    setCategory("bug");
    setText("");
    setSubmitting(false);
  }, [isOpen]);

  // Escape closes.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  const close = () => setIsOpen(false);

  const handleSubmit = async () => {
    const feedback = text.trim();
    if (!feedback) {
      showToast("Add a few words first ✍️");
      return;
    }

    setSubmitting(true);
    const supabase = getSupabaseBrowserClient();

    const device_info = {
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      screen:
        typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "",
      pathname: typeof window !== "undefined" ? window.location.pathname : "",
    };

    let ok = false;
    if (supabase) {
      const { error } = await supabase.from("beta_feedback").insert({
        user_id: currentUser?.id || null,
        user_email: currentUser?.email || null,
        user_handle: currentUser?.handle || null,
        category,
        feedback,
        device_info,
      });
      ok = !error;
      if (error) console.warn("[beta] feedback insert failed:", error.message);
    }

    setSubmitting(false);
    setIsOpen(false);
    showToast(
      ok
        ? "🙌 Feedback received! Thanks for shaping Smakr."
        : "Couldn't send feedback — please try again."
    );
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Send beta feedback"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={close}
      />

      {/* Drawer surface */}
      <div className="relative w-full sm:max-w-md bg-[#FAF7F2] dark:bg-[#181615] rounded-t-[28px] sm:rounded-[28px] border-t border-black/10 dark:border-white/10 shadow-2xl p-5 pb-8 max-h-[92dvh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-3 duration-200">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-comico text-xl leading-tight text-zinc-900 dark:text-zinc-100">
              ✦ Send Beta Feedback
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Found a glitch, bad pin, or missing spot? Let us know.
            </p>
          </div>
          <button
            onClick={close}
            aria-label="Close feedback"
            className="shrink-0 p-2 -mt-1 -mr-1 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category selector */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {CATEGORIES.map((c) => {
            const active = category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                aria-pressed={active}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-bold transition-all active:scale-[0.98] ${
                  active
                    ? "border-[#e84a27] bg-[#e84a27]/10 text-[#e84a27]"
                    : "border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 hover:border-[#e84a27]/40"
                }`}
              >
                <span>{c.emoji}</span>
                <span className="truncate">{c.label}</span>
                {active && <Check className="w-3 h-3 ml-auto shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Feedback textarea */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Tell us what happened or what you'd love to see..."
          className="mt-3 w-full px-3.5 py-3 text-sm rounded-2xl bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-[#e84a27] focus:ring-1 focus:ring-[#e84a27] transition-all resize-none"
        />
        <p className="text-[10px] text-zinc-400 mt-1.5">
          We&apos;ll attach your account and device info to help us debug.
        </p>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-60 text-white font-bold text-sm shadow-md shadow-[#e84a27]/25 transition-all active:scale-[0.99]"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Send feedback</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
