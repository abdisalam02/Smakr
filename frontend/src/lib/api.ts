import { Venue, VenueDetail, LiveCheckin, WifiSpeedTest, SavedCollection } from "@/types";

function getApiBase() {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    return `http://${host}:8001/api/v1`;
  }
  return "http://localhost:8001/api/v1";
}

export async function fetchNearbyVenues(params: {
  lat: number;
  lon: number;
  radius_meters?: number;
  place_type?: string | null;
  has_outlets?: boolean | null;
  silent_zone?: boolean | null;
  open_late?: boolean | null;
  outdoor_seating?: boolean | null;
  dog_friendly?: boolean | null;
  min_download_mbps?: number | null;
  vibe_status?: string | null;
}): Promise<Venue[]> {
  const searchParams = new URLSearchParams();
  searchParams.append("lat", params.lat.toString());
  searchParams.append("lon", params.lon.toString());
  searchParams.append("radius_meters", (params.radius_meters || 5000).toString());

  if (params.place_type) searchParams.append("place_type", params.place_type);
  if (params.has_outlets !== null && params.has_outlets !== undefined) searchParams.append("has_outlets", params.has_outlets.toString());
  if (params.silent_zone !== null && params.silent_zone !== undefined) searchParams.append("silent_zone", params.silent_zone.toString());
  if (params.open_late !== null && params.open_late !== undefined) searchParams.append("open_late", params.open_late.toString());
  if (params.outdoor_seating !== null && params.outdoor_seating !== undefined) searchParams.append("outdoor_seating", params.outdoor_seating.toString());
  if (params.dog_friendly !== null && params.dog_friendly !== undefined) searchParams.append("dog_friendly", params.dog_friendly.toString());
  if (params.min_download_mbps) searchParams.append("min_download_mbps", params.min_download_mbps.toString());
  if (params.vibe_status) searchParams.append("vibe_status", params.vibe_status);

  const res = await fetch(`${getApiBase()}/venues/nearby?${searchParams.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch venues: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchVenueDetail(venueId: string): Promise<VenueDetail> {
  const res = await fetch(`${getApiBase()}/venues/${venueId}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch venue details: ${res.statusText}`);
  }
  return res.json();
}

export async function submitCheckin(
  venueId: string,
  payload: {
    seat_level: number;
    noise_level: number;
    outlets_available: boolean;
    comment?: string;
    user_id?: string;
  }
): Promise<LiveCheckin> {
  const res = await fetch(`${getApiBase()}/venues/${venueId}/checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to submit check-in: ${res.statusText}`);
  }
  return res.json();
}

export async function executeSpeedTest(
  venueId: string,
  onProgress?: (stage: "ping" | "downloading" | "complete", progress: number) => void
): Promise<WifiSpeedTest> {
  // 1. Measure Ping Latency
  if (onProgress) onProgress("ping", 20);
  const pingStart = performance.now();
  await fetch(`${getApiBase()}/speedtest/ping?t=${Date.now()}`, { cache: "no-store" });
  const pingEnd = performance.now();
  const pingMs = Math.round(pingEnd - pingStart);

  // 2. Measure Download Throughput (Fetch 1MB payload)
  if (onProgress) onProgress("downloading", 50);
  const dlStart = performance.now();
  const response = await fetch(`${getApiBase()}/speedtest/payload?size_kb=1024&t=${Date.now()}`, {
    cache: "no-store",
  });
  const blob = await response.blob();
  const dlEnd = performance.now();

  const durationSeconds = (dlEnd - dlStart) / 1000.0;
  const bytesReceived = blob.size;
  const bitsLoaded = bytesReceived * 8;
  const speedMbps = Math.round((bitsLoaded / durationSeconds / (1024 * 1024)) * 10) / 10;

  if (onProgress) onProgress("complete", 100);

  // 3. Post verified speed test to backend
  const logRes = await fetch(`${getApiBase()}/venues/${venueId}/speedtest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      download_mbps: Math.max(1.0, speedMbps),
      ping_ms: Math.max(1.0, pingMs),
      network_ssid: "Venue-WiFi",
    }),
  });

  if (!logRes.ok) {
    throw new Error(`Failed to log speed test: ${logRes.statusText}`);
  }
  return logRes.json();
}

export async function fetchCollections(): Promise<SavedCollection[]> {
  const res = await fetch(`${getApiBase()}/collections`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch collections");
  return res.json();
}

export async function fetchCollectionVenues(collectionId: string): Promise<Venue[]> {
  const res = await fetch(`${getApiBase()}/collections/${collectionId}/venues`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch collection venues");
  return res.json();
}
