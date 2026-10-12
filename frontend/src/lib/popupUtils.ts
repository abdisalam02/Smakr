import type { Venue } from "@/types";

export interface PopupStatus {
  status: "none" | "upcoming" | "active" | "grace" | "expired";
  daysLeft?: number;
  label?: string;
  isPulsingMarker?: boolean;
  isDimmedCard?: boolean;
  hideMapPin?: boolean;
}

/**
 * Calculates the real-time operational status for a pop-up residency
 */
export function getPopupStatus(venue?: Venue | null): PopupStatus {
  if (!venue || venue.spot_type !== "popup" || !venue.popup_end_date) {
    return { status: "none" };
  }

  const now = Date.now();
  const end = new Date(venue.popup_end_date).getTime();
  const start = venue.popup_start_date ? new Date(venue.popup_start_date).getTime() : 0;

  if (Number.isNaN(end)) return { status: "none" };

  const oneDayMs = 1000 * 60 * 60 * 24;
  const daysDiff = (end - now) / oneDayMs;

  // 1. Not started yet
  if (start && now < start) {
    const daysUntil = Math.ceil((start - now) / oneDayMs);
    return {
      status: "upcoming",
      label: `✦ Pop-up opens in ${daysUntil}d`,
      isPulsingMarker: false,
      isDimmedCard: false,
      hideMapPin: false,
    };
  }

  // 2. Active Pop-up
  if (daysDiff >= 0) {
    const daysLeft = Math.ceil(daysDiff);
    const label =
      daysLeft <= 1
        ? "🔥 Pop-up · Last Day!"
        : `🔥 Pop-up · ${daysLeft} Days Left`;
    return {
      status: "active",
      daysLeft,
      label,
      isPulsingMarker: true,
      isDimmedCard: false,
      hideMapPin: false,
    };
  }

  // 3. Post-Close Grace Period (Within 7 days after ending)
  const gracePeriodDays = Math.abs(daysDiff);
  if (gracePeriodDays <= 7) {
    const endDateObj = new Date(venue.popup_end_date);
    const formatted = endDateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return {
      status: "grace",
      label: `✕ Pop-up Ended · ${formatted}`,
      isPulsingMarker: false,
      isDimmedCard: true, // Greys out at 50% opacity in feed
      hideMapPin: true,    // Map pin is hidden
    };
  }

  // 4. Auto-archived (Ended more than 7 days ago)
  return {
    status: "expired",
    hideMapPin: true,
    isDimmedCard: true,
  };
}

/**
 * Filter predicate: returns true if a venue/dish should be visible in the active public feed
 */
export function isVisibleInFeed(venue?: Venue | null): boolean {
  if (!venue) return true;
  if (venue.spot_type !== "popup" || !venue.popup_end_date) return true;
  const status = getPopupStatus(venue);
  // Exclude pop-ups older than end_date + 7 days
  return status.status !== "expired";
}
