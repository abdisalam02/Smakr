export type DishImageSource =
  | "google"
  | "serpapi_maps"
  | "supabase"
  | "upload"
  | "website"
  | "web_search"
  | "wolt"
  | "foodora"
  | "ai_polish"
  | "unknown";

export type PhotoVisionBucket = "food" | "venue_vibe" | "junk";

export interface PhotoVisionTag {
  bucket: PhotoVisionBucket;
  description?: string;
  source?: DishImageSource;
}

export function isDeliveryAppImageUrl(rawUrl?: string | null): boolean {
  const url = (rawUrl || "").trim().toLowerCase();
  if (!url) return false;
  return (
    url.includes("wolt.com") ||
    url.includes("deliveryhero.io") ||
    url.includes("foodora.")
  );
}

export function detectImageSource(
  rawUrl?: string | null,
  hint?: DishImageSource | null
): DishImageSource {
  const url = (rawUrl || "").trim();
  if (!url) return "unknown";
  const lower = url.toLowerCase();

  if (
    lower.includes("imageproxy.wolt.com") ||
    lower.includes("wolt-menu-images-cdn.wolt.com") ||
    lower.includes("wolt.com")
  ) {
    return "wolt";
  }

  if (lower.includes("deliveryhero.io") || lower.includes("foodora.")) {
    return "foodora";
  }

  if (lower.includes("supabase.co/storage/") || lower.includes("supabase.co")) {
    if (lower.includes("/ai-remix/")) return "ai_polish";
    if (lower.includes("/google-cache/")) return hint === "serpapi_maps" ? "serpapi_maps" : "google";
    if (lower.includes("/uploads/")) return "upload";
    if (lower.includes("/popups/")) return "supabase";
    return hint && hint !== "unknown" ? hint : "supabase";
  }

  if (lower.startsWith("/curation-remix/")) return "ai_polish";
  if (lower.startsWith("/uploads/")) return "upload";

  if (lower.includes("serpapi.com")) return "serpapi_maps";

  if (
    lower.includes("googleapis.com") ||
    lower.includes("googleusercontent.com") ||
    lower.includes("/api/places/photos") ||
    lower.startsWith("places/")
  ) {
    return hint === "serpapi_maps" ? "serpapi_maps" : "google";
  }

  if (lower.startsWith("http://") || lower.startsWith("https://")) {
    return hint === "web_search" ? "web_search" : "website";
  }

  return "unknown";
}

export function isValidDishPhotoUrl(rawUrl?: string | null): boolean {
  const url = (rawUrl || "").trim();
  if (!url) return false;
  const hasValidPrefix =
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("/api/places/photos") ||
    url.startsWith("/curation-remix/") ||
    url.startsWith("/uploads/");
  const isBadDishShot = /streetview|facade|building|\/icons\/food\//i.test(url);
  return hasValidPrefix && !isBadDishShot;
}

export function isValidVenueCoverUrl(rawUrl?: string | null): boolean {
  const url = (rawUrl || "").trim();
  if (!url) return false;
  const hasValidPrefix =
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("/api/places/photos") ||
    url.startsWith("/curation-remix/") ||
    url.startsWith("/uploads/");
  // Venue covers and place_photos explicitly allow exterior, storefront, logo, and interior shots.
  const isFallbackIcon = /\/icons\/food\//i.test(url);
  return hasValidPrefix && !isFallbackIcon;
}

export function getSourceBadgeMeta(source: DishImageSource): {
  label: string;
  className: string;
  isWarning: boolean;
} {
  switch (source) {
    case "wolt":
      return {
        label: "⚠️ WOLT",
        className: "bg-rose-600 text-white border-rose-700",
        isWarning: true,
      };
    case "foodora":
      return {
        label: "⚠️ FOODORA",
        className: "bg-rose-600 text-white border-rose-700",
        isWarning: true,
      };
    case "serpapi_maps":
      return {
        label: "SERP",
        className: "bg-sky-700/90 text-white border-sky-800",
        isWarning: false,
      };
    case "google":
      return {
        label: "GOOGLE",
        className: "bg-zinc-900/85 text-white border-zinc-700",
        isWarning: false,
      };
    case "upload":
      return {
        label: "UPLOAD",
        className: "bg-emerald-700/90 text-white border-emerald-800",
        isWarning: false,
      };
    case "ai_polish":
      return {
        label: "AI POLISH",
        className: "bg-[#E84A27] text-white border-[#c83b1c]",
        isWarning: false,
      };
    case "supabase":
      return {
        label: "CDN",
        className: "bg-emerald-800/85 text-white border-emerald-900",
        isWarning: false,
      };
    case "web_search":
      return {
        label: "WEB SEARCH",
        className: "bg-teal-700/90 text-white border-teal-800",
        isWarning: false,
      };
    case "website":
      return {
        label: "WEB",
        className: "bg-amber-700/90 text-white border-amber-800",
        isWarning: false,
      };
    default:
      return {
        label: "URL",
        className: "bg-zinc-700/85 text-white border-zinc-800",
        isWarning: false,
      };
  }
}
