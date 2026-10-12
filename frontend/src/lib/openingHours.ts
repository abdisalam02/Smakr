import { Venue } from "@/types";

export interface VenueOpenStatus {
  isOpen: boolean;
  statusText: string;
  detailText?: string;
}

/**
 * Calculates live opening status for an Oslo venue based on local Oslo time,
 * food truck schedules, or weekly opening hours.
 */
export function getVenueLiveOpenStatus(
  venue: Partial<Venue> | null | undefined
): VenueOpenStatus {
  if (!venue) {
    return { isOpen: false, statusText: "Closed" };
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
      return { isOpen: false, statusText: "Closed", detailText: venue.location_schedule };
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
        return { isOpen: true, statusText: "Open now", detailText: `Closes ${timeMatch[3]}:${timeMatch[4] || "00"}` };
      }
      return { isOpen: false, statusText: "Closed", detailText: `Opens ${timeMatch[1]}:${timeMatch[2] || "00"}` };
    }
  }

  // 3. Opening Hours JSON or descriptions if present
  const hoursJson = venue.opening_hours_json;
  if (hoursJson && typeof hoursJson === "object") {
    // Look for matching day key in JSON
    for (const [dayKey, timeStr] of Object.entries(hoursJson)) {
      if (dayKey.toLowerCase().includes(weekday.slice(0, 3))) {
        if (timeStr.toLowerCase().includes("closed") || timeStr.toLowerCase().includes("stengt")) {
          return { isOpen: false, statusText: "Closed today" };
        }
        const timeMatch = timeStr.match(/(\d{1,2})[:.]?(\d{2})?\s*[-–—]\s*(\d{1,2})[:.]?(\d{2})?/);
        if (timeMatch) {
          const startMin = parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2] || "0", 10);
          const endMin = parseInt(timeMatch[3], 10) * 60 + parseInt(timeMatch[4] || "0", 10);
          if (currentMinutes >= startMin && currentMinutes < endMin) {
            return { isOpen: true, statusText: "Open now", detailText: `Closes ${timeMatch[3]}:${timeMatch[4] || "00"}` };
          }
          return { isOpen: false, statusText: "Closed", detailText: `Opens ${timeMatch[1]}:${timeMatch[2] || "00"}` };
        }
      }
    }
  }

  // 4. Time-of-day sanity check in Oslo:
  // Before 07:00 or after 23:30, normal food establishments are closed.
  const isEarlyMorning = currentMinutes < 7 * 60; // Before 07:00
  const isLateNight = currentMinutes >= 23 * 60 + 30; // After 23:30

  if (isEarlyMorning || isLateNight) {
    return {
      isOpen: false,
      statusText: "Closed",
      detailText: isEarlyMorning ? "Opens later today" : "Closed for the night",
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
      return { isOpen: true, statusText: "Open now", detailText: "Closes 18:00" };
    }
    return { isOpen: false, statusText: "Closed", detailText: "Opens 07:30" };
  }

  // General Oslo restaurants & food spots: open 11:30 to 22:30
  if (currentMinutes >= 11 * 60 + 30 && currentMinutes < 22 * 60 + 30) {
    return { isOpen: true, statusText: "Open now", detailText: "Closes 22:30" };
  }

  if (currentMinutes < 11 * 60 + 30) {
    return { isOpen: false, statusText: "Closed", detailText: "Opens 11:30" };
  }

  return { isOpen: false, statusText: "Closed", detailText: "Closed for the night" };
}
