import { VibeStatus } from "@/types";

export function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function formatDistance(meters: number | null | undefined): string {
  if (meters === null || meters === undefined) return "";
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return "No check-ins yet";
  const date = new Date(isoString);
  const now = new Date();
  const diffMinutes = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60000));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export function getVibeColor(status: VibeStatus): {
  bg: string;
  border: string;
  text: string;
  dot: string;
  label: string;
} {
  switch (status) {
    case "optimal":
      return {
        bg: "bg-[#edf6f0]",
        border: "border-[#b8dec4]",
        text: "text-[#2e6843]",
        dot: "bg-[#3e7953]",
        label: "Optimal",
      };
    case "moderate":
      return {
        bg: "bg-[#fcf5e8]",
        border: "border-[#edd8b2]",
        text: "text-[#9e6717]",
        dot: "bg-[#c28421]",
        label: "Moderate",
      };
    case "packed":
    default:
      return {
        bg: "bg-[#fbeeed]",
        border: "border-[#ecc3bf]",
        text: "text-[#9c3426]",
        dot: "bg-[#b84534]",
        label: "Packed",
      };
  }
}
