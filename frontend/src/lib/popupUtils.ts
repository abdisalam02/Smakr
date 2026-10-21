import type { Venue } from "@/types";

export interface PopupStatus {
  status: "none" | "upcoming" | "active" | "grace" | "expired" | "dormant";
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
  if (!venue || venue.spot_type !== "popup") {
    return { status: "none" };
  }

  const meta = getPopupMeta(venue);
  if (meta?.residency_status) {
    if (meta.residency_status === "between_residencies") {
      return {
        status: "dormant",
        label: "Between Residencies",
        isPulsingMarker: false,
        isDimmedCard: false,
        hideMapPin: true,
      };
    }
    if (meta.residency_status === "next_confirmed") {
      return {
        status: "upcoming",
        label: meta.date_label ? `Next Drop · ${meta.date_label}` : "Next Drop Confirmed",
        isPulsingMarker: false,
        isDimmedCard: false,
        hideMapPin: false,
      };
    }
    if (meta.residency_status === "active") {
      return {
        status: "active",
        daysLeft: 3,
        label: meta.date_label ? `Live Now · ${meta.date_label}` : "Live Now",
        isPulsingMarker: true,
        isDimmedCard: false,
        hideMapPin: false,
      };
    }
  }

  if (!venue.popup_end_date) {
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
  if (venue.spot_type !== "popup") return true;
  const meta = getPopupMeta(venue);
  if (meta?.residency_status === "between_residencies") return true;
  if (!venue.popup_end_date && !meta?.residency_status) return true;
  const status = getPopupStatus(venue);
  return status.status !== "expired";
}

import type { PopupResidencyMeta } from "@/types";

export function getPopupMeta(venue?: Venue | null): PopupResidencyMeta | null {
  if (!venue) return null;
  if (venue.popup_meta) return venue.popup_meta;
  const signals = venue.vibe_signals as Record<string, unknown> | undefined;
  if (signals?.popup_meta && typeof signals.popup_meta === "object") {
    return signals.popup_meta as PopupResidencyMeta;
  }
  return null;
}

export function getPopupUrgencyLabel(venue?: Venue | null): string {
  if (!venue) return "Pop-up";
  const st = getPopupStatus(venue);
  const meta = getPopupMeta(venue);
  if (meta?.residency_status === "between_residencies" || st.status === "dormant") {
    return "BETWEEN RESIDENCIES";
  }
  if (meta?.residency_status === "next_confirmed" || st.status === "upcoming") {
    return meta?.date_label ? `NEXT DROP · ${meta.date_label}` : st.label || "NEXT DROP CONFIRMED";
  }
  if (st.status === "active") {
    if (st.daysLeft !== undefined && st.daysLeft <= 1) {
      return "🔥 TODAY ONLY";
    }
    if (st.daysLeft !== undefined && st.daysLeft <= 3) {
      return `⚡ ${st.daysLeft} DAYS LEFT`;
    }
    if (meta?.date_label) {
      return `LIVE NOW · ${meta.date_label}`;
    }
    return `🔥 ${st.daysLeft || 3} DAYS LEFT`;
  }
  if (st.status === "grace") {
    return "ENDED";
  }
  return meta?.date_label || "Pop-up Event";
}

/**
 * Returns a numeric urgency sort score (lower = ending sooner = ranks first)
 */
export function getPopupUrgencyScore(venue?: Venue | null): number {
  if (!venue) return 999;
  const st = getPopupStatus(venue);
  if (st.status === "active") {
    return st.daysLeft ?? 5;
  }
  if (st.status === "upcoming") {
    return 100;
  }
  if (st.status === "grace") {
    return 500;
  }
  if (st.status === "dormant") {
    return 700;
  }
  return 999;
}

