import { Venue } from "@/types";

export interface VenueOpenStatus {
  status: "open" | "closing" | "closed" | "unknown";
  label: string;
  isOpen: boolean | null;
  statusText: string;
  detailText?: string;
  badgeText: string;
  color: "green" | "orange" | "zinc";
}

const UNKNOWN_HOURS_STATUS: VenueOpenStatus = {
  status: "unknown",
  label: "Hours on Google Maps",
  isOpen: null,
  statusText: "Hours on Google Maps",
  badgeText: "Hours on Google Maps",
  color: "zinc",
};

function formatStatus(
  isOpen: boolean,
  currentMinutes: number,
  targetMinutes: number,
  timeLabel: string
): VenueOpenStatus {
  if (isOpen) {
    const minutesLeft = targetMinutes - currentMinutes;
    if (minutesLeft > 0 && minutesLeft <= 45) {
      return {
        status: "closing",
        label: `Closes ${timeLabel}`,
        isOpen: true,
        statusText: `Closes ${timeLabel}`,
        detailText: `Closes in ${minutesLeft}m`,
        badgeText: `🟠 Closes ${timeLabel}`,
        color: "orange",
      };
    }
    return {
      status: "open",
      label: `Open · til ${timeLabel}`,
      isOpen: true,
      statusText: `Open · til ${timeLabel}`,
      detailText: `Closes ${timeLabel}`,
      badgeText: `🟢 Open · til ${timeLabel}`,
      color: "green",
    };
  }

  return {
    status: "closed",
    label: `Closed · Opens ${timeLabel}`,
    isOpen: false,
    statusText: `Closed · Opens ${timeLabel}`,
    detailText: `Opens ${timeLabel}`,
    badgeText: `● Closed · Opens ${timeLabel}`,
    color: "zinc",
  };
}

function evaluateTimeRange(
  currentMinutes: number,
  startH: number,
  startM: number,
  endH: number,
  endM: number,
  openStr: string,
  closeStr: string
): VenueOpenStatus {
  const startMin = startH * 60 + startM;
  let endMin = endH * 60 + endM;
  if (endMin <= startMin) {
    // Overnight closing (e.g. 18:00 - 02:00 or 16:00 - 00:00)
    endMin += 24 * 60;
  }
  const effectiveNow =
    endMin > 24 * 60 && currentMinutes < startMin && currentMinutes + 24 * 60 < endMin
      ? currentMinutes + 24 * 60
      : currentMinutes;

  if (effectiveNow >= startMin && effectiveNow < endMin) {
    return formatStatus(true, effectiveNow, endMin, closeStr);
  }
  return formatStatus(false, currentMinutes, startMin, openStr);
}

const OSLO_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Oslo",
  weekday: "long",
  hour: "numeric",
  minute: "numeric",
  hour12: false,
});

/**
 * Calculates live opening status for an Oslo venue based on local Oslo time,
 * food truck schedules, or verified weekly opening_hours JSONB.
 * Never fabricates fallback hours when structured opening hours are absent.
 */
export function getVenueLiveOpenStatus(
  venue: Partial<Venue> | null | undefined
): VenueOpenStatus {
  if (!venue) {
    return UNKNOWN_HOURS_STATUS;
  }

  // 1. Get current Oslo time (Europe/Oslo CET/CEST)
  const osloParts = OSLO_TIME_FORMATTER.formatToParts(new Date());

  const weekday = (osloParts.find((p) => p.type === "weekday")?.value || "").toLowerCase();
  const parsedHour = parseInt(osloParts.find((p) => p.type === "hour")?.value || "0", 10);
  const hour = parsedHour === 24 ? 0 : parsedHour;
  const minute = parseInt(osloParts.find((p) => p.type === "minute")?.value || "0", 10);
  const currentMinutes = hour * 60 + minute;

  // 2. Food Truck with explicit schedule string (e.g. "Thurs–Sat 18:00–23:00")
  if (venue.spot_type === "food_truck" && venue.location_schedule) {
    const sched = venue.location_schedule.toLowerCase();
    const isWeekendSched =
      sched.includes("thurs") ||
      sched.includes("fri") ||
      sched.includes("sat") ||
      sched.includes("sun");
    const isWeekendDay =
      weekday.includes("thursday") ||
      weekday.includes("friday") ||
      weekday.includes("saturday") ||
      weekday.includes("sunday");

    if (isWeekendSched && !isWeekendDay) {
      return {
        status: "closed",
        label: "Closed today",
        isOpen: false,
        statusText: "Closed today",
        detailText: venue.location_schedule,
        badgeText: "● Closed today",
        color: "zinc",
      };
    }

    const timeMatch = sched.match(
      /(\d{1,2})[:.]?(\d{2})?\s*[-–—]\s*(\d{1,2})[:.]?(\d{2})?/
    );
    if (timeMatch) {
      return evaluateTimeRange(
        currentMinutes,
        parseInt(timeMatch[1], 10),
        parseInt(timeMatch[2] || "0", 10),
        parseInt(timeMatch[3], 10),
        parseInt(timeMatch[4] || "0", 10),
        `${timeMatch[1].padStart(2, "0")}:${timeMatch[2] || "00"}`,
        `${timeMatch[3].padStart(2, "0")}:${timeMatch[4] || "00"}`
      );
    }
  }

  // 3. Verified Opening Hours JSONB (`mon`..`sun` or weekday names)
  const hoursJson = venue.opening_hours_json;
  if (hoursJson && typeof hoursJson === "object" && Object.keys(hoursJson).length > 0) {
    const dayPrefix = weekday.slice(0, 3);
    for (const [dayKey, timeStr] of Object.entries(hoursJson)) {
      if (typeof timeStr !== "string") continue;
      if (dayKey.toLowerCase().includes(dayPrefix)) {
        const normalized = timeStr.toLowerCase();
        if (normalized.includes("closed") || normalized.includes("stengt")) {
          return {
            status: "closed",
            label: "Closed today",
            isOpen: false,
            statusText: "Closed today",
            detailText: "Closed today",
            badgeText: "● Closed today",
            color: "zinc",
          };
        }
        if (/open\s*24|24\s*h|døgnåpen/i.test(normalized)) {
          return {
            status: "open",
            label: "Open 24h",
            isOpen: true,
            statusText: "Open 24h",
            detailText: "Open 24h",
            badgeText: "🟢 Open 24h",
            color: "green",
          };
        }
        const timeMatch = timeStr.match(
          /(\d{1,2})[:.]?(\d{2})?\s*[-–—]\s*(\d{1,2})[:.]?(\d{2})?/
        );
        if (timeMatch) {
          return evaluateTimeRange(
            currentMinutes,
            parseInt(timeMatch[1], 10),
            parseInt(timeMatch[2] || "0", 10),
            parseInt(timeMatch[3], 10),
            parseInt(timeMatch[4] || "0", 10),
            `${timeMatch[1].padStart(2, "0")}:${timeMatch[2] || "00"}`,
            `${timeMatch[3].padStart(2, "0")}:${timeMatch[4] || "00"}`
          );
        }
      }
    }
  }

  // 4. Empty or unparseable opening hours: never fabricate fallback hours.
  return UNKNOWN_HOURS_STATUS;
}
