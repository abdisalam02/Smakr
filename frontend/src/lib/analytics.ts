"use client";

import posthog from "posthog-js";

export type TrafficSource =
  | "tiktok"
  | "instagram"
  | "snapchat"
  | "facebook"
  | "google"
  | "shared_link"
  | "direct";

export type SpotOpenSource =
  | "map"
  | "feed"
  | "popup_radar"
  | "locals_picks"
  | "deep_link";

let initialized = false;
let enabled = false;

export function detectTrafficSource(): {
  traffic_source: TrafficSource;
  is_in_app_webview: boolean;
} {
  if (typeof window === "undefined") {
    return { traffic_source: "direct", is_in_app_webview: false };
  }

  const ua = navigator.userAgent || "";
  const ref = (document.referrer || "").toLowerCase();
  const params = new URLSearchParams(window.location.search);
  const utm = (params.get("utm_source") || "").toLowerCase();
  const pathname = window.location.pathname || "/";

  const isTikTokUA = /TikTok|BytedanceWebview|Musical_ly/i.test(ua);
  const isInstagramUA = /Instagram/i.test(ua);
  const isSnapchatUA = /Snapchat/i.test(ua);
  const isFacebookUA = /FBAN|FBAV|FB_IAB/i.test(ua);

  const is_in_app_webview =
    isTikTokUA || isInstagramUA || isSnapchatUA || isFacebookUA;

  if (isTikTokUA || ref.includes("tiktok.com") || utm === "tiktok") {
    return { traffic_source: "tiktok", is_in_app_webview };
  }
  if (isInstagramUA || ref.includes("instagram.com") || ref.includes("l.instagram") || utm === "instagram" || utm === "ig") {
    return { traffic_source: "instagram", is_in_app_webview };
  }
  if (isSnapchatUA || ref.includes("snapchat.com") || utm === "snapchat") {
    return { traffic_source: "snapchat", is_in_app_webview };
  }
  if (isFacebookUA || ref.includes("facebook.com") || ref.includes("fb.me") || utm === "facebook") {
    return { traffic_source: "facebook", is_in_app_webview };
  }
  if (ref.includes("google.") || utm === "google") {
    return { traffic_source: "google", is_in_app_webview };
  }
  if (pathname.startsWith("/spot/") || params.has("spot")) {
    return { traffic_source: "shared_link", is_in_app_webview };
  }

  return { traffic_source: "direct", is_in_app_webview };
}

export function initPostHog(): boolean {
  if (typeof window === "undefined") return false;
  if (initialized) return enabled;
  initialized = true;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) {
    enabled = false;
    return false;
  }

  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

  posthog.init(key, {
    api_host: host,
    person_profiles: "identified_only",
    autocapture: false,
    capture_pageview: true,
    capture_pageleave: true,
  });

  const { traffic_source, is_in_app_webview } = detectTrafficSource();
  posthog.register({
    traffic_source,
    is_in_app_webview,
  });

  enabled = true;
  return true;
}

export function trackEvent(
  eventName:
    | "smakr_landing"
    | "tab_switched"
    | "filter_applied"
    | "spot_opened"
    | "directions_clicked"
    | "calendar_added"
    | "spot_saved"
    | "spot_shared",
  properties?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  if (!initialized) initPostHog();
  if (!enabled) return;
  try {
    posthog.capture(eventName, properties);
  } catch {
    // Analytics must never interrupt UX.
  }
}
