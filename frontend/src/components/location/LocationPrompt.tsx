"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, X, Loader2 } from "lucide-react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { useGeolocation } from "@/hooks/useGeolocation";

type PermissionState = "granted" | "denied" | "prompt" | "unknown";

/**
 * Asks for location when we don't have a fix yet.
 *
 * - Watches the browser permission state.
 * - Fires the browser's own permission popup once, automatically, on first load.
 * - If it's blocked, shows an actionable card ("allow it in your browser
 *   settings, then retry") so testers can recover without hunting for a button.
 */
export function LocationPrompt() {
  const userLocation = useCityPulseStore((state) => state.userLocation);
  const { requestLocation, loading } = useGeolocation();
  const [permission, setPermission] = useState<PermissionState>("unknown");
  const [dismissed, setDismissed] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const autoRequested = useRef(false);

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
        // Safari < 16 / unsupported — treated as "prompt" below.
        if (!cancelled) setPermission("prompt");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Ask once, automatically, when we have no fix and haven't been told "no".
  useEffect(() => {
    if (userLocation || autoRequested.current) return;
    if (permission === "granted") return;
    if (permission === "denied") {
      setAttempted(true);
      return;
    }
    autoRequested.current = true;
    const t = setTimeout(() => {
      setAttempted(true);
      requestLocation();
    }, 1200);
    return () => clearTimeout(t);
  }, [permission, userLocation, requestLocation]);

  if (userLocation || dismissed) return null;
  // Don't flash before we've actually tried.
  if (!attempted) return null;

  const blocked = permission === "denied";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 lg:bottom-8 z-[45] flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-black/10 bg-white/95 dark:bg-stone-900/95 backdrop-blur shadow-xl px-4 py-3 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <span className="shrink-0 mt-0.5 w-8 h-8 rounded-full bg-[#e84a27]/10 text-[#e84a27] flex items-center justify-center">
          <MapPin className="w-4 h-4" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            {blocked ? "Location is blocked" : "See what's near you"}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">
            {blocked
              ? "Allow location for this site in your browser settings, then tap Retry — we only use it to centre the map on you."
              : "Share your location so Smakr can centre the map on you and surface the closest dishes."}
          </p>

          <div className="flex items-center gap-1.5 mt-2.5">
            <button
              onClick={() => requestLocation()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#e84a27] hover:bg-[#d23e1d] disabled:opacity-60 text-white text-[11px] font-bold shadow-sm transition-all active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Navigation className="w-3.5 h-3.5" />
              )}
              <span>{loading ? "Locating…" : blocked ? "Retry" : "Allow location"}</span>
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="px-2.5 py-2 rounded-xl text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="shrink-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
