"use client";

import { useState, useCallback } from "react";
import { useCityPulseStore } from "@/store/useCityPulseStore";

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

    const applyPosition = (lat: number, lon: number, isRealGps: boolean) => {
      const coords = { lat, lon };
      setUserLocation(coords);
      setMapCenter([coords.lon, coords.lat], 15.5);
      setMobileSheetState("peek"); // Collapses feed sheet so user sees their cute ragdoll!
      setLoading(false);
      void isRealGps;
    };

    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      const current = useCityPulseStore.getState().userLocation;
      if (!current) {
        applyPosition(59.9171, 10.7516, false);
      }
      showToast("📍 Geolocation not supported. Drag your ragdoll or tap the map to place it!");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        applyPosition(position.coords.latitude, position.coords.longitude, true);
      },
      (err) => {
        console.warn("Geolocation request failed or blocked:", err.message);
        setError(err.message);
        setLoading(false);

        // Check if user already has a marker
        const currentLoc = useCityPulseStore.getState().userLocation;
        if (!currentLoc) {
          // Default to Torggata / Youngstorget so ragdoll is on map and immediately draggable
          applyPosition(59.9171, 10.7516, false);
        } else {
          setMobileSheetState("peek");
        }

        // On mobile local IP testing (http://10.x.x.x), Chromium blocks GPS due to insecure context
        const isHttpMobile =
          typeof window !== "undefined" &&
          window.location.protocol === "http:" &&
          window.location.hostname !== "localhost" &&
          window.location.hostname !== "127.0.0.1";

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
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0, // Never use stale cached position
      }
    );
  }, [setUserLocation, setMapCenter, setMobileSheetState, showToast]);

  return { requestLocation, loading, error };
}

