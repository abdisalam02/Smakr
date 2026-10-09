"use client";

import { useState, useCallback } from "react";
import { useCityPulseStore } from "@/store/useCityPulseStore";

/**
 * Two-stage geolocation:
 *   1) a fast, coarse (network / Wi-Fi) fix — resolves quickly and flies the
 *      camera straight away;
 *   2) a background high-accuracy GPS fix — nudges the puck, and re-centres the
 *      camera if the coarse fix was badly wrong.
 *
 * It never *invents* a location: if the browser blocks or fails geolocation we
 * leave `userLocation` null (the LocationPrompt asks for permission instead)
 * rather than dropping a fake "You're here" puck on top of the Smakr Pick.
 *
 * All steps log to the console under the `[locate]` prefix.
 */

/** Great-circle distance in metres between two lat/lng points. */
function approxMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function useGeolocation() {
  const setUserLocation = useCityPulseStore((state) => state.setUserLocation);
  const setMapCenter = useCityPulseStore((state) => state.setMapCenter);
  const setMobileSheetState = useCityPulseStore((state) => state.setMobileSheetState);
  const showToast = useCityPulseStore((state) => state.showToast);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    setLoading(true);
    setError(null);
    console.info("[locate] requesting geolocation…");

    // Dismiss an active venue card so the puck becomes the focus.
    if (useCityPulseStore.getState().selectedVenue) {
      useCityPulseStore.getState().setSelectedVenue(null);
    }

    const place = (lat: number, lon: number, recenter: boolean, tag: string) => {
      const current = useCityPulseStore.getState().userLocation;
      setUserLocation({ lat, lon });
      const moved = !current ? Infinity : approxMeters(current.lat, current.lon, lat, lon);
      console.info("[locate] fix applied", {
        tag,
        lat: +lat.toFixed(6),
        lon: +lon.toFixed(6),
        recenter,
        movedMeters: Number.isFinite(moved) ? Math.round(moved) : "first-fix",
      });
      if (!recenter) return;
      // Only fly when the fix is new or meaningfully different (> ~25m).
      if (moved > 25) {
        setMapCenter([lon, lat], 15.5);
        setMobileSheetState("peek");
      }
    };

    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      console.warn("[locate] geolocation unsupported");
      showToast("📍 This browser can't share your location.", 4500);
      return;
    }

    const isHttpMobile =
      window.location.protocol === "http:" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1";

    const fail = (err: GeolocationPositionError, stage: string) => {
      console.warn("[locate] failed", { stage, code: err.code, message: err.message });
      setError(err.message);
      setLoading(false);

      // If we already have a fix, just re-centre on it — never jump elsewhere.
      const currentLoc = useCityPulseStore.getState().userLocation;
      if (currentLoc) {
        console.info("[locate] re-centring on last known fix", currentLoc);
        setMapCenter([currentLoc.lon, currentLoc.lat], 15.5);
        setMobileSheetState("peek");
      }

      if (err.code === err.PERMISSION_DENIED) {
        showToast(
          "📍 Location is blocked — allow it for this site in your browser settings to see spots near you.",
          6000
        );
      } else if (isHttpMobile) {
        showToast("📍 Mobile browsers need HTTPS for GPS over Wi-Fi.", 5000);
      } else {
        showToast("📍 Couldn't get your location — check that GPS is switched on.", 4500);
      }
    };

    // Stage 1 — fast coarse fix (network / Wi-Fi).
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coarse = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
        };
        console.info("[locate] coarse fix", coarse);
        place(coarse.lat, coarse.lon, true, "coarse");
        setLoading(false);

        // Stage 2 — refine in the background.
        navigator.geolocation.getCurrentPosition(
          (refined) => {
            const r = {
              lat: refined.coords.latitude,
              lon: refined.coords.longitude,
              accuracy: Math.round(refined.coords.accuracy),
            };
            // If the accurate fix disagrees with the coarse one by more than
            // ~150m, the coarse fix was wrong → re-centre on the real position.
            const drift = approxMeters(coarse.lat, coarse.lon, r.lat, r.lon);
            console.info("[locate] refined fix", { ...r, driftMeters: Math.round(drift) });
            place(r.lat, r.lon, drift > 150, "refined");
          },
          () => console.info("[locate] refined fix unavailable (coarse kept)"),
          { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
      },
      () => {
        // Coarse fix failed → attempt a single high-accuracy fix before failing.
        navigator.geolocation.getCurrentPosition(
          (position) => {
            place(
              position.coords.latitude,
              position.coords.longitude,
              true,
              "high-accuracy-fallback"
            );
            setLoading(false);
          },
          (err) => fail(err, "high-accuracy"),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 5000 }
    );
  }, [setUserLocation, setMapCenter, setMobileSheetState, showToast]);

  return { requestLocation, loading, error };
}
