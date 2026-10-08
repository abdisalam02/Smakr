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

    const store = useCityPulseStore.getState();

    // Dismiss active venue card so the map cleanly focuses on the user puck
    if (store.selectedVenue) {
      store.setSelectedVenue(null);
    }

    const place = (lat: number, lon: number, recenter: boolean) => {
      const coords = { lat, lon };
      const current = useCityPulseStore.getState().userLocation;
      setUserLocation(coords);

      if (recenter) {
        // Only trigger camera fly if location is new or moved significantly (> 25m)
        const movedSignificantly =
          !current ||
          Math.abs(current.lat - lat) > 0.00025 ||
          Math.abs(current.lon - lon) > 0.00025;

        if (movedSignificantly) {
          setMapCenter([coords.lon, coords.lat], 15.5);
          setMobileSheetState("peek");
        }
        setLoading(false);
      }
    };

    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      if (!useCityPulseStore.getState().userLocation) {
        place(FALLBACK_COORDS.lat, FALLBACK_COORDS.lon, true);
      }
      showToast("📍 Geolocation is not supported by your browser.", 4500);
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

      const currentLoc = useCityPulseStore.getState().userLocation;
      if (!currentLoc) {
        // Default to Torggata / Youngstorget so the puck is on the map.
        place(FALLBACK_COORDS.lat, FALLBACK_COORDS.lon, true);
      } else {
        setMapCenter([currentLoc.lon, currentLoc.lat], 15.5);
        setMobileSheetState("peek");
      }

      if (isHttpMobile) {
        showToast(
          "📍 Mobile browsers require HTTPS for GPS over Wi-Fi.",
          5000
        );
      } else {
        showToast(
          "📍 GPS unavailable or permission denied.",
          4500
        );
      }
    };

    // Use high accuracy directly so it resolves the user's actual GPS / Wi-Fi position
    // instead of coarse ISP routing nodes.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        place(latitude, longitude, true);
      },
      (geoErr) => {
        // If high-accuracy timed out, fall back to coarse network lookup
        if (geoErr.code === geoErr.TIMEOUT) {
          navigator.geolocation.getCurrentPosition(
            (fallbackPos) => {
              place(fallbackPos.coords.latitude, fallbackPos.coords.longitude, true);
            },
            onError,
            { enableHighAccuracy: false, timeout: 6000, maximumAge: 30000 }
          );
        } else {
          onError(geoErr);
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );
  }, [setUserLocation, setMapCenter, setMobileSheetState, showToast]);

  return { requestLocation, loading, error };
}
