"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, X, Loader2, ShieldAlert } from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { useGeolocation } from "@/hooks/useGeolocation";
import {
  hasSeenLocationPrompt,
  markLocationPromptSeen,
} from "@/lib/locationPrompt";

type PermissionState = "granted" | "denied" | "prompt" | "unknown";

/**
 * One-time "find food near you" card.
 *
 * - Auto-shows once, the first time the map is opened, and is remembered in
 *   localStorage so it never nags on every visit.
 * - "Find me" can reopen it on demand when location is blocked.
 * - It never auto-triggers the browser permission prompt; that only happens
 *   after the user taps "Allow location".
 */
export function LocationPrompt() {
  const userLocation = useCityPulseStore((state) => state.userLocation);
  const viewMode = useCityPulseStore((state) => state.viewMode);
  const { requestLocation, loading } = useGeolocation();

  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<PermissionState>("unknown");
  const shownOnce = useRef(false);

  const insecureContext =
    typeof window !== "undefined" && !window.isSecureContext;

  // Track the browser's geolocation permission.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) return;
    let cancelled = false;
    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        if (cancelled) return;
        const sync = () => setPermission(status.state as PermissionState);
        sync();
        status.onchange = sync;
      })
      .catch(() => {
        if (!cancelled) setPermission("prompt");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-open once on the first map entry (never again).
  useEffect(() => {
    if (viewMode !== "map" || userLocation || open) return;
    if (shownOnce.current || hasSeenLocationPrompt()) return;
    const timer = window.setTimeout(() => {
      shownOnce.current = true;
      markLocationPromptSeen();
      setOpen(true);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [viewMode, userLocation, open]);

  // "Find me" can explicitly reopen the help card.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("smakr:open-location-prompt", onOpen as EventListener);
    return () =>
      window.removeEventListener("smakr:open-location-prompt", onOpen as EventListener);
  }, []);

  // Close as soon as we have a fix.
  useEffect(() => {
    if (userLocation) setOpen(false);
  }, [userLocation]);

  if (!open || userLocation) return null;

  const blocked = permission === "denied" || insecureContext;

  const dismiss = () => {
    setOpen(false);
    markLocationPromptSeen();
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 lg:bottom-8 z-[55] flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-sm rounded-3xl border border-white/60 dark:border-white/10 bg-[#FAF7F2]/95 dark:bg-[#181615]/95 backdrop-blur-xl shadow-[0_18px_44px_rgba(24,22,21,0.22)] p-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div className="flex items-start gap-3">
          <span className="shrink-0 mt-0.5 w-10 h-10 rounded-2xl bg-[#E84A27]/12 text-[#E84A27] flex items-center justify-center">
            {blocked ? (
              <ShieldAlert className="w-5 h-5" />
            ) : (
              <Navigation className="w-5 h-5" />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="font-comico text-sm uppercase tracking-tight text-[#181615] dark:text-white">
              {blocked ? "Turn location on" : "Find food near you"}
            </p>
            <p className="text-[11.5px] text-zinc-600 dark:text-zinc-400 leading-relaxed mt-1">
              {insecureContext
                ? "Location needs a secure HTTPS connection on this network. Open Smakr over HTTPS (or localhost via USB) to use Find me."
                : blocked
                ? "Location is blocked for this site. Allow it in your browser settings, then try again — we only use it to centre the map on you."
                : "Share your location once so Smakr can centre the map on you and surface the closest dishes."}
            </p>

            <div className="flex items-center gap-2 mt-3">
              {!blocked && (
                <button
                  type="button"
                  onClick={() => {
                    markLocationPromptSeen();
                    requestLocation(true);
                  }}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E84A27] hover:bg-[#d23e1d] disabled:opacity-60 text-white text-[11px] font-bold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5" />
                  )}
                  <span>{loading ? "Locating…" : "Allow location"}</span>
                </button>
              )}
              {blocked && !insecureContext && (
                <button
                  type="button"
                  onClick={() => {
                    markLocationPromptSeen();
                    requestLocation(true);
                  }}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E84A27] hover:bg-[#d23e1d] disabled:opacity-60 text-white text-[11px] font-bold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Navigation className="w-3.5 h-3.5" />
                  )}
                  <span>{loading ? "Locating…" : "Try again"}</span>
                </button>
              )}
              <button
                type="button"
                onClick={dismiss}
                className="px-2.5 py-2 rounded-xl text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
              >
                {blocked ? "Got it" : "Not now"}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="shrink-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
