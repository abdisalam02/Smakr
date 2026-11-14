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
    <div className="pointer-events-none fixed top-14 left-3.5 right-3.5 z-30 flex justify-center">
      <div className="pointer-events-auto inline-flex items-center gap-2 max-w-full rounded-full border border-white/60 dark:border-white/10 bg-[#FAF7F2]/90 dark:bg-[#181615]/90 backdrop-blur-xl shadow-[0_10px_28px_rgba(24,22,21,0.14)] pl-3 pr-1.5 py-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
        {blocked ? (
          <ShieldAlert className="w-3.5 h-3.5 text-[#E84A27] shrink-0" />
        ) : (
          <MapPin className="w-3.5 h-3.5 text-[#E84A27] shrink-0" />
        )}
        <span className="text-[11.5px] font-semibold text-[#181615] dark:text-[#FAF7F2] truncate">
          {insecureContext
            ? "Location needs HTTPS in Oslo"
            : blocked
            ? "Enable location in browser settings"
            : "Find food near you in Oslo"}
        </span>

        {!insecureContext && (
          <button
            type="button"
            onClick={() => {
              markLocationPromptSeen();
              requestLocation(true);
            }}
            disabled={loading}
            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E84A27] hover:bg-[#d23e1d] disabled:opacity-60 text-white text-[11px] font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            <span>{loading ? "…" : blocked ? "Retry" : "Allow"}</span>
          </button>
        )}

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss location prompt"
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
