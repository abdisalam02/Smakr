import { Venue } from "@/types";

export interface VenueOpenStatus {
  isOpen: boolean;
  statusText: string;
  detailText?: string;
  badgeText: string;
  color: 'green' | 'orange' | 'zinc';
}

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
        isOpen: true,
        statusText: `Closes ${timeLabel}`,
        detailText: `Closes in ${minutesLeft}m`,
        badgeText: `🟠 Closes ${timeLabel}`,
        color: 'orange',
      };
    }
    return {
      isOpen: true,
      statusText: `Open · til ${timeLabel}`,
      detailText: `Closes ${timeLabel}`,
      badgeText: `🟢 Open · til ${timeLabel}`,
      color: 'green',
    };
  }

  return {
    isOpen: false,
    statusText: `Closed · Opens ${timeLabel}`,
    detailText: `Opens ${timeLabel}`,
    badgeText: `● Closed · Opens ${timeLabel}`,
    color: 'zinc',
  };
}

/**
 * Calculates live opening status for an Oslo venue based on local Oslo time,
 * food truck schedules, or weekly opening hours.
 */
export function getVenueLiveOpenStatus(
  venue: Partial<Venue> | null | undefined
): VenueOpenStatus {
  if (!venue) {
    return {
      isOpen: false,
      statusText: "Closed",
      badgeText: "● Closed",
      color: "zinc",
    };
  }

  // 1. Get current Oslo time (CET/CEST)
  const now = new Date();
  const osloParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Oslo",
    weekday: "long",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);

  const weekday = (osloParts.find((p) => p.type === "weekday")?.value || "").toLowerCase();
  const hour = parseInt(osloParts.find((p) => p.type === "hour")?.value || "0", 10);
  const minute = parseInt(osloParts.find((p) => p.type === "minute")?.value || "0", 10);
  const currentMinutes = hour * 60 + minute;

  // 2. Food Truck with custom schedule string (e.g. "Thurs–Sat 18:00–23:00")
  if (venue.spot_type === "food_truck" && venue.location_schedule) {
    const sched = venue.location_schedule.toLowerCase();
    const isWeekendSched = sched.includes("thurs") || sched.includes("fri") || sched.includes("sat") || sched.includes("sun");
    const isWeekendDay = weekday.includes("thursday") || weekday.includes("friday") || weekday.includes("saturday") || weekday.includes("sunday");

    if (isWeekendSched && !isWeekendDay) {
      return {
        isOpen: false,
        statusText: "Closed today",
        detailText: venue.location_schedule,
        badgeText: "● Closed today",
        color: "zinc",
      };
    }

    // Check time range in schedule like "18:00–23:00" or "18-23"
    const timeMatch = sched.match(/(\d{1,2})[:.]?(\d{2})?\s*[-–—]\s*(\d{1,2})[:.]?(\d{2})?/);
    if (timeMatch) {
      const startH = parseInt(timeMatch[1], 10);
      const startM = parseInt(timeMatch[2] || "0", 10);
      const endH = parseInt(timeMatch[3], 10);
      const endM = parseInt(timeMatch[4] || "0", 10);
      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;

      if (currentMinutes >= startMin && currentMinutes < endMin) {
        const closeStr = `${timeMatch[3]}:${timeMatch[4] || "00"}`;
        return formatStatus(true, currentMinutes, endMin, closeStr);
      }
      const openStr = `${timeMatch[1]}:${timeMatch[2] || "00"}`;
      return formatStatus(false, currentMinutes, startMin, openStr);
    }
  }

  // 3. Opening Hours JSON or descriptions if present
  const hoursJson = venue.opening_hours_json;
  if (hoursJson && typeof hoursJson === "object") {
    // Look for matching day key in JSON
    for (const [dayKey, timeStr] of Object.entries(hoursJson)) {
      if (dayKey.toLowerCase().includes(weekday.slice(0, 3))) {
        if (timeStr.toLowerCase().includes("closed") || timeStr.toLowerCase().includes("stengt")) {
          return {
            isOpen: false,
            statusText: "Closed today",
            detailText: "Closed today",
            badgeText: "● Closed today",
            color: "zinc",
          };
        }
        const timeMatch = timeStr.match(/(\d{1,2})[:.]?(\d{2})?\s*[-–—]\s*(\d{1,2})[:.]?(\d{2})?/);
        if (timeMatch) {
          const startMin = parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2] || "0", 10);
          const endMin = parseInt(timeMatch[3], 10) * 60 + parseInt(timeMatch[4] || "0", 10);
          if (currentMinutes >= startMin && currentMinutes < endMin) {
            const closeStr = `${timeMatch[3]}:${timeMatch[4] || "00"}`;
            return formatStatus(true, currentMinutes, endMin, closeStr);
          }
          const openStr = `${timeMatch[1]}:${timeMatch[2] || "00"}`;
          return formatStatus(false, currentMinutes, startMin, openStr);
        }
      }
    }
  }

  // 4. Time-of-day sanity check in Oslo:
  const isEarlyMorning = currentMinutes < 7 * 60; // Before 07:00
  const isLateNight = currentMinutes >= 23 * 60 + 30; // After 23:30

  if (isEarlyMorning) {
    return {
      isOpen: false,
      statusText: "Closed · Opens 08:00",
      detailText: "Opens later today",
      badgeText: "● Closed · Opens 08:00",
      color: "zinc",
    };
  }

  if (isLateNight) {
    return {
      isOpen: false,
      statusText: "Closed for the night",
      detailText: "Closed for the night",
      badgeText: "● Closed for night",
      color: "zinc",
    };
  }

  // 5. Category-specific realistic Oslo hours
  const isBakeryOrCoffee =
    venue.food_category === "coffee" ||
    venue.food_category === "bakery" ||
    (venue.signature_dishes || []).some((d) => /coffee|latte|croissant|cardamom|bakery/i.test(d));

  if (isBakeryOrCoffee) {
    // Coffee/Bakery: open 07:30 to 18:00
    if (currentMinutes >= 7 * 60 + 30 && currentMinutes < 18 * 60) {
      return formatStatus(true, currentMinutes, 18 * 60, "18:00");
    }
    return formatStatus(false, currentMinutes, 7 * 60 + 30, "07:30");
  }

  // General Oslo restaurants & food spots: open 11:30 to 22:30
  if (currentMinutes >= 11 * 60 + 30 && currentMinutes < 22 * 60 + 30) {
    return formatStatus(true, currentMinutes, 22 * 60 + 30, "22:30");
  }

  if (currentMinutes < 11 * 60 + 30) {
    return formatStatus(false, currentMinutes, 11 * 60 + 30, "11:30");
  }

  return {
    isOpen: false,
    statusText: "Closed for the night",
    detailText: "Closed for the night",
    badgeText: "● Closed for night",
    color: "zinc",
  };
}
