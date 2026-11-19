"use client";

import { useEffect, useRef } from "react";
import { detectTrafficSource, initPostHog, trackEvent } from "@/lib/analytics";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const landedRef = useRef(false);

  useEffect(() => {
    const ok = initPostHog();
    if (!ok || landedRef.current) return;
    landedRef.current = true;

    const { traffic_source, is_in_app_webview } = detectTrafficSource();
    const params = new URLSearchParams(window.location.search);
    const initial_view = window.location.pathname.startsWith("/spot/")
      ? "spot_share"
      : params.get("view") || "map";

    trackEvent("smakr_landing", {
      traffic_source,
      initial_view,
      is_in_app_webview,
    });
  }, []);

  return <>{children}</>;
}
