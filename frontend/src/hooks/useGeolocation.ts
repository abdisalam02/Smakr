"use client";

import { useState, useCallback } from "react";
import { useCityPulseStore } from "@/store/useCityPulseStore";

/**
 * Two-stage geolocation:
 *   1) a fast, coarse (network / Wi-Fi) fix — resolves in about a second and
 *      flies the camera straight away;
 *   2) a background high-accuracy GPS fix that only nudges the puck, never
 *      re-flies the camera.
 *
 * It never *invents* a location: if the browser blocks or fails geolocation we
 * leave `userLocation` null (the LocationPrompt asks for permission instead)
 * rather than dropping a fake "You're here" puck on top of the Smakr Pick.
 */

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

    // Dismiss an active venue card so the puck becomes the focus.
    if (useCityPulseStore.getState().selectedVenue) {
      useCityPulseStore.getState().setSelectedVenue(null);
    }

    const place = (lat: number, lon: number, recenter: boolean) => {
      const current = useCityPulseStore.getState().userLocation;
      setUserLocation({ lat, lon });
      if (!recenter) return;
      // Only fly when the fix is new or meaningfully different (> ~25m).
      const moved =
        !current ||
        Math.abs(current.lat - lat) > 0.00025 ||
        Math.abs(current.lon - lon) > 0.00025;
      if (moved) {
        setMapCenter([lon, lat], 15.5);
        setMobileSheetState("peek");
      }
    };

    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      showToast("📍 This browser can't share your location.", 4500);
      return;
    }

    const isHttpMobile =
      window.location.protocol === "http:" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1";

    const fail = (err: GeolocationPositionError) => {
      console.warn("Geolocation failed or blocked:", err.message);
      setError(err.message);
      setLoading(false);

      // If we already have a fix, just re-centre on it — never jump elsewhere.
      const currentLoc = useCityPulseStore.getState().userLocation;
      if (currentLoc) {
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

    // Stage 1 — fast coarse fix (network / Wi-Fi), usually well under a second.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        place(position.coords.latitude, position.coords.longitude, true);
        setLoading(false);

        // Stage 2 — refine in the background; nudges the puck only.
        navigator.geolocation.getCurrentPosition(
          (refined) => place(refined.coords.latitude, refined.coords.longitude, false),
          () => {},
          { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
      },
      () => {
        // Coarse fix failed → attempt a single high-accuracy fix before failing.
        navigator.geolocation.getCurrentPosition(
          (position) => {
            place(position.coords.latitude, position.coords.longitude, true);
            setLoading(false);
          },
          fail,
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 5000 }
    );
  }, [setUserLocation, setMapCenter, setMobileSheetState, showToast]);

  return { requestLocation, loading, error };
}
