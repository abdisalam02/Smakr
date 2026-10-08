"use client";

import { useState, useCallback } from "react";
import { useCityPulseStore } from "@/store/useCityPulseStore";

const FALLBACK_COORDS = { lat: 59.9171, lon: 10.7516 }; // Oslo Sentrum

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

    const place = (lat: number, lon: number, recenter: boolean) => {
      const coords = { lat, lon };
      setUserLocation(coords);
      if (recenter) {
        setMapCenter([coords.lon, coords.lat], 15.5);
        setMobileSheetState("peek"); // Collapses feed sheet so the puck is visible.
        setLoading(false);
      }
    };

    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      if (!useCityPulseStore.getState().userLocation) {
        place(FALLBACK_COORDS.lat, FALLBACK_COORDS.lon, true);
      }
      showToast("📍 Geolocation not supported. Drag your ragdoll or tap the map to place it!");
      setLoading(false);
      return;
    }

    const isHttpMobile =
      window.location.protocol === "http:" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1";

    const onError = (err: GeolocationPositionError) => {
      console.warn("Geolocation request failed or blocked:", err.message);
      setError(err.message);
      setLoading(false);

      if (!useCityPulseStore.getState().userLocation) {
        // Default to Torggata / Youngstorget so the puck is on the map (draggable).
        place(FALLBACK_COORDS.lat, FALLBACK_COORDS.lon, true);
      } else {
        setMobileSheetState("peek");
      }

      if (isHttpMobile) {
        showToast(
          "📍 Mobile browsers require HTTPS for real GPS over Wi-Fi. Drag your ragdoll or tap the map to place it anywhere!",
          6000
        );
      } else {
        showToast(
          "📍 GPS unavailable or permission denied. Drag your ragdoll or tap the map to set your location!",
          5500
        );
      }
    };

    // Stage 1 — fast, network-based fix (usually sub-second). Avoids the cold
    // GPS-satellite lock that made "find me" take ~3s.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        place(latitude, longitude, true);

        // Stage 2 — refine with a high-accuracy GPS fix in the background. Only
        // nudges the puck; it never re-flies the camera.
        navigator.geolocation.getCurrentPosition(
          (refined) => place(refined.coords.latitude, refined.coords.longitude, false),
          () => {},
          { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
      },
      onError,
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 6000 }
    );
  }, [setUserLocation, setMapCenter, setMobileSheetState, showToast]);

  return { requestLocation, loading, error };
}
