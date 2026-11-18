import type { PopupResidencyMeta, Venue } from "@/types";

export type PopupLifecycleState = "live" | "upcoming" | "passed" | "tba";

export interface PopupLifecycle {
  state: PopupLifecycleState;
  /** Hero / detail sheet pill label */
  badgeLabel: string;
  /** Compact dock / spotlight line */
  shortDateLabel: string;
  /** Clean single date text without duplicating hours */
  dateDisplay: string | null;
  /** Distinct service hours text (null if redundant with dateDisplay) */
  hoursDisplay: string | null;
  hasLocation: boolean;
}

export interface PopupStatus {
  status: "none" | "upcoming" | "active" | "grace" | "expired" | "dormant";
  lifecycle?: PopupLifecycleState;
  daysLeft?: number;
  label?: string;
  isPulsingMarker?: boolean;
  isDimmedCard?: boolean;
  hideMapPin?: boolean;
}

const MONTH_INDEX: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

const GENERIC_HOSTS = new Set(["", "oslo", "oslo, norway", "location tba", "tba", "roaming", "oslo pop-up"]);

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function parseEndOfDayMs(raw?: string | null): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split("-").map(Number);
    return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
  }
  const t = new Date(trimmed).getTime();
  return Number.isNaN(t) ? null : t;
}

function parseStartOfDayMs(raw?: string | null): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split("-").map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
  }
  const t = new Date(trimmed).getTime();
  return Number.isNaN(t) ? null : t;
}

/**
 * Fallback parser for freeform `dates_label` strings like "Nov 14 · 12:00 Drop",
 * "Nov 14–15", "Nov 14-15", or "Oct 24 – Nov 2" when explicit ISO columns are absent.
 */
function parseDatesFromLabel(label?: string | null, referenceYear = new Date().getFullYear()): {
  startMs: number | null;
  endMs: number | null;
  formattedRange: string | null;
} {
  if (!label) return { startMs: null, endMs: null, formattedRange: null };
  const matches = [
    ...label.matchAll(
      /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?!\s*:)(?:\s*(?:[-–—]|to)\s*(\d{1,2})(?!\s*:))?\b/gi
    ),
  ];
  if (matches.length === 0) return { startMs: null, endMs: null, formattedRange: null };

  const firstMonth = MONTH_INDEX[matches[0][1].toLowerCase()];
  const firstDay = parseInt(matches[0][2], 10);
  const lastMatch = matches[matches.length - 1];
  const lastMonth = MONTH_INDEX[lastMatch[1].toLowerCase()];
  const explicitEndDay = lastMatch[3] ? parseInt(lastMatch[3], 10) : NaN;
  const lastDay =
    Number.isFinite(explicitEndDay) && explicitEndDay >= 1 && explicitEndDay <= 31
      ? explicitEndDay
      : parseInt(lastMatch[2], 10);
  if (firstMonth === undefined || lastMonth === undefined) {
    return { startMs: null, endMs: null, formattedRange: null };
  }

  const endYear = lastMonth < firstMonth ? referenceYear + 1 : referenceYear;
  const startDate = new Date(referenceYear, firstMonth, firstDay, 0, 0, 0, 0);
  const endDate = new Date(endYear, lastMonth, lastDay, 23, 59, 59, 999);
  const isRange = firstMonth !== lastMonth || firstDay !== lastDay;
  const formattedRange = isRange
    ? `${formatShortDate(startDate)} – ${formatShortDate(endDate)}`
    : formatShortDate(endDate);

  return { startMs: startDate.getTime(), endMs: endDate.getTime(), formattedRange };
}

/**
 * Resolves a concrete upcoming drop Date when `popup_meta.next_drop_date`
 * (or an upcoming `popup_start_date`) points to today or a future date.
 */
export function getPopupUpcomingDropDate(
  venue?: Venue | null,
  nowMs = Date.now()
): Date | null {
  if (!venue || !isPopupVenue(venue)) return null;
  const meta = getPopupMeta(venue);
  const lifecycle = resolvePopupLifecycle(venue, nowMs);
  const raw =
    meta?.next_drop_date ||
    (lifecycle.state === "upcoming" ? venue.popup_start_date : null) ||
    null;
  if (!raw) return null;

  const trimmed = raw.trim();
  let parsed: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split("-").map(Number);
    parsed = new Date(y, m - 1, d, 12, 0, 0, 0);
  } else {
    parsed = new Date(trimmed);
  }
  if (Number.isNaN(parsed.getTime())) return null;

  // Treat today's scheduled drop as still addable within a 12h grace window.
  if (parsed.getTime() < nowMs - 12 * 60 * 60 * 1000) return null;
  return parsed;
}

function toIcsUtcString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeIcsText(val: string): string {
  return val
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

/**
 * Generates and downloads an RFC 5545 `.ics` calendar file client-side (zero login).
 */
export function downloadPopupCalendarIcs(venue: Venue): boolean {
  if (typeof window === "undefined") return false;
  const dropDate = getPopupUpcomingDropDate(venue);
  if (!dropDate) return false;

  const meta = getPopupMeta(venue);
  const lifecycle = resolvePopupLifecycle(venue);
  const rawTimeText = meta?.next_drop_date || "";
  const hasExplicitIsoTime =
    /T\d{2}:\d{2}/.test(rawTimeText) && !/T00:00(:00)?(\.\d+)?Z?$/.test(rawTimeText);

  let start = new Date(dropDate.getTime());
  let end = new Date(dropDate.getTime() + 3 * 60 * 60 * 1000);

  if (!hasExplicitIsoTime && lifecycle.hoursDisplay) {
    const m = lifecycle.hoursDisplay.match(/(\d{1,2})[:.](\d{2})(?:\s*[-–—]\s*(\d{1,2})[:.](\d{2}))?/);
    if (m) {
      start = new Date(dropDate.getFullYear(), dropDate.getMonth(), dropDate.getDate(), Number(m[1]), Number(m[2]), 0);
      if (m[3]) {
        end = new Date(dropDate.getFullYear(), dropDate.getMonth(), dropDate.getDate(), Number(m[3]), Number(m[4] || "0"), 0);
        if (end.getTime() <= start.getTime()) {
          end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
        }
      } else {
        end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
      }
    }
  }

  const hostName =
    meta?.host_venue_name && !/tba|host/i.test(meta.host_venue_name)
      ? meta.host_venue_name
      : null;
  const locationParts = [hostName, meta?.host_address || venue.address || "Oslo, Norway"].filter(Boolean);
  const spotUrl = `https://smakr.no/?spot=${encodeURIComponent(venue.id)}`;
  const description = [
    venue.description || `${venue.name} pop-up drop in Oslo.`,
    lifecycle.hoursDisplay ? `Hours: ${lifecycle.hoursDisplay}` : null,
    `Details: ${spotUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Smakr//Oslo Pop-Up Radar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${venue.id}-${start.getTime()}@smakr.no`,
    `DTSTAMP:${toIcsUtcString(new Date())}`,
    `DTSTART:${toIcsUtcString(start)}`,
    `DTEND:${toIcsUtcString(end)}`,
    `SUMMARY:${escapeIcsText(`${venue.name} Pop-Up Drop`)}`,
    `LOCATION:${escapeIcsText(locationParts.join(", "))}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `URL:${spotUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  const blob = new Blob([lines.join("\r\n") + "\r\n"], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const slug = venue.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  anchor.href = url;
  anchor.download = `${slug || venue.id}-drop.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

/**
 * Helper to identify whether a venue is a pop-up residency regardless of
 * naming variants ("popup", "pop_up", "popup-...", or presence of popup_meta).
 */
export function isPopupVenue(venue?: Venue | null): boolean {
  if (!venue) return false;
  return (
    venue.spot_type === "popup" ||
    venue.spot_type === "pop_up" ||
    venue.id.startsWith("popup") ||
    Boolean(venue.popup_meta)
  );
}

/**
 * Single source of truth for a pop-up's 4 lifecycle states:
 * `live` | `upcoming` | `passed` | `tba`.
 */
export function resolvePopupLifecycle(
  venue?: Venue | null,
  nowMs = Date.now()
): PopupLifecycle {
  const meta = getPopupMeta(venue);
  const rawDateLabel = (meta?.date_label || meta?.dates_label || "").trim();
  const isExplicitTba =
    meta?.residency_status === "between_residencies" ||
    rawDateLabel.toLowerCase().includes("tba");

  const startMs = parseStartOfDayMs(venue?.popup_start_date);
  const endMs = parseEndOfDayMs(venue?.popup_end_date);
  const parsedLabel = parseDatesFromLabel(rawDateLabel, new Date(nowMs).getFullYear());

  const effectiveStart = startMs ?? parsedLabel.startMs;
  const effectiveEnd = endMs ?? parsedLabel.endMs;

  const hostRaw = (meta?.host_venue_name || meta?.host_address || venue?.address || "").trim();
  const hasLocation =
    !GENERIC_HOSTS.has(hostRaw.toLowerCase()) &&
    typeof venue?.latitude === "number" &&
    typeof venue?.longitude === "number" &&
    venue.latitude !== 0;

  const rawHours = (
    meta?.daily_hours ||
    meta?.event_hours ||
    venue?.current_opening_hours_text ||
    ""
  ).trim();

  const dateDisplay =
    effectiveStart && effectiveEnd && formatShortDate(new Date(effectiveStart)) !== formatShortDate(new Date(effectiveEnd))
      ? `${formatShortDate(new Date(effectiveStart))} – ${formatShortDate(new Date(effectiveEnd))}`
      : effectiveEnd
      ? formatShortDate(new Date(effectiveEnd))
      : parsedLabel.formattedRange || (rawDateLabel && !isExplicitTba ? rawDateLabel : null);

  // Deduplicate hours if rawHours repeats the date string (e.g. "Thu Nov 14 · 12:00 until sold out")
  let hoursDisplay: string | null = rawHours || null;
  if (hoursDisplay && dateDisplay) {
    const cleanHours = hoursDisplay
      .replace(/^(mon|tue|wed|thu|fri|sat|sun)[a-z]*\s+/i, "")
      .replace(new RegExp(`^${dateDisplay.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[·•\\-]?\\s*`, "i"), "")
      .trim();
    hoursDisplay = cleanHours && cleanHours.toLowerCase() !== dateDisplay.toLowerCase() ? cleanHours : null;
  }

  // 1. Explicit TBA / between residencies with no scheduled drop
  if (isExplicitTba && (!effectiveEnd || effectiveEnd < nowMs)) {
    return {
      state: "tba",
      badgeLabel: "Next Drop TBA",
      shortDateLabel: "Next drop TBA",
      dateDisplay: null,
      hoursDisplay: null,
      hasLocation: false,
    };
  }

  // 2. Passed drop (end date is strictly in the past — overrides stale "active" status)
  if (effectiveEnd !== null && effectiveEnd < nowMs) {
    const shortEnded = formatShortDate(new Date(effectiveEnd));
    return {
      state: "passed",
      badgeLabel: `Last Pop-Up · ${shortEnded}`,
      shortDateLabel: `Last pop-up · ${shortEnded}`,
      dateDisplay: shortEnded,
      hoursDisplay: null,
      hasLocation,
    };
  }

  // 3. Upcoming confirmed drop
  if ((effectiveStart !== null && effectiveStart > nowMs) || meta?.residency_status === "next_confirmed") {
    const labelSuffix = dateDisplay ? ` · ${dateDisplay}` : "";
    return {
      state: "upcoming",
      badgeLabel: `Upcoming${labelSuffix}`,
      shortDateLabel: dateDisplay ? `Upcoming · ${dateDisplay}` : "Upcoming drop",
      dateDisplay,
      hoursDisplay,
      hasLocation,
    };
  }

  // 4. Live drop (within start..end or active without an expired end date)
  if (
    (effectiveStart !== null && effectiveEnd !== null && nowMs >= effectiveStart && nowMs <= effectiveEnd) ||
    meta?.residency_status === "active" ||
    (effectiveEnd !== null && effectiveEnd >= nowMs)
  ) {
    return {
      state: "live",
      badgeLabel: dateDisplay ? `Live Drop · ${dateDisplay}` : "Live Pop-Up",
      shortDateLabel: dateDisplay ? `Live · ${dateDisplay}` : "Live now",
      dateDisplay,
      hoursDisplay,
      hasLocation,
    };
  }

  // Fallback when a pop-up has neither dates nor active status
  return {
    state: "tba",
    badgeLabel: "Next Drop TBA",
    shortDateLabel: "Next drop TBA",
    dateDisplay: null,
    hoursDisplay: null,
    hasLocation: false,
  };
}

/**
 * Calculates the operational status for a pop-up residency from `resolvePopupLifecycle`.
 */
export function getPopupStatus(venue?: Venue | null): PopupStatus {
  if (!venue || !isPopupVenue(venue)) {
    return { status: "none" };
  }

  const lifecycle = resolvePopupLifecycle(venue);

  if (lifecycle.state === "tba") {
    return {
      status: "dormant",
      lifecycle: "tba",
      label: lifecycle.badgeLabel,
      isPulsingMarker: false,
      isDimmedCard: false,
      hideMapPin: true,
    };
  }

  if (lifecycle.state === "passed") {
    return {
      status: "grace",
      lifecycle: "passed",
      label: lifecycle.badgeLabel,
      isPulsingMarker: false,
      isDimmedCard: true,
      // Keep anchored (muted) at its last host venue so foodies see where it last popped up
      hideMapPin: !lifecycle.hasLocation,
    };
  }

  if (lifecycle.state === "upcoming") {
    return {
      status: "upcoming",
      lifecycle: "upcoming",
      label: lifecycle.badgeLabel,
      isPulsingMarker: false,
      isDimmedCard: false,
      hideMapPin: false,
    };
  }

  const endMs = parseEndOfDayMs(venue.popup_end_date);
  const daysLeft = endMs ? Math.max(1, Math.ceil((endMs - Date.now()) / (1000 * 60 * 60 * 24))) : 3;

  return {
    status: "active",
    lifecycle: "live",
    daysLeft,
    label: lifecycle.badgeLabel,
    isPulsingMarker: true,
    isDimmedCard: false,
    hideMapPin: false,
  };
}

/**
 * Filter predicate: returns true if a venue/dish should be visible in the active public feed.
 */
export function isVisibleInFeed(venue?: Venue | null): boolean {
  if (!venue) return true;
  if (!isPopupVenue(venue)) return true;
  return true;
}

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
  return resolvePopupLifecycle(venue).badgeLabel.toUpperCase();
}

/**
 * Returns a numeric urgency sort score (lower = live/soonest = ranks first)
 */
export function getPopupUrgencyScore(venue?: Venue | null): number {
  if (!venue) return 999;
  const st = getPopupStatus(venue);
  if (st.status === "active") return st.daysLeft ?? 5;
  if (st.status === "upcoming") return 100;
  if (st.status === "grace") return 500;
  if (st.status === "dormant") return 700;
  return 999;
}

