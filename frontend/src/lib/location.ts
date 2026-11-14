/**
 * Oslo Postal Code & Neighborhood Resolver + Clean Street Formatter
 */

export interface FormattedOsloLocation {
  street: string;
  neighborhood: string;
  postalCode: string | null;
  fullClean: string;
}

const POSTAL_NEIGHBORHOOD_MAP: { min: number; max: number; name: string }[] = [
  { min: 150, max: 169, name: 'Sentrum / Kvadraturen' },
  { min: 170, max: 179, name: 'St. Hanshaugen' },
  { min: 180, max: 185, name: 'Torggata / Sentrum' },
  { min: 186, max: 188, name: 'Grønland' },
  { min: 190, max: 194, name: 'Bjørvika / Gamlebyen' },
  { min: 250, max: 269, name: 'Frogner / Vika' },
  { min: 270, max: 289, name: 'Majorstuen / Uranienborg' },
  { min: 350, max: 369, name: 'Majorstuen' },
  { min: 450, max: 489, name: 'Sagene / Torshov' },
  { min: 550, max: 569, name: 'Grünerløkka' },
  { min: 650, max: 656, name: 'Tøyen' },
  { min: 660, max: 689, name: 'Helsfyr / Ensjø' },
];

/**
 * Resolves a 4-digit Oslo postal code to its canonical neighborhood name.
 */
export function resolveOsloPostalCode(postalCodeStr: string): string | null {
  const code = parseInt(postalCodeStr.trim(), 10);
  if (isNaN(code)) return null;

  for (const range of POSTAL_NEIGHBORHOOD_MAP) {
    if (code >= range.min && code <= range.max) {
      return range.name;
    }
  }
  return null;
}

const NEIGHBORHOOD_DISPLAY_MAP: Record<string, string> = {
  bjorvika: "Bjørvika",
  "bjørvika": "Bjørvika",
  oslobukta: "Bjørvika",
  grunerlokka: "Grünerløkka",
  "grünerløkka": "Grünerløkka",
  gronland: "Grønland",
  "grønland": "Grønland",
  toyen: "Tøyen",
  "tøyen": "Tøyen",
  torggata: "Torggata",
  sentrum: "Sentrum",
  frogner: "Frogner",
  majorstuen: "Majorstuen",
  st_hanshaugen: "St. Hanshaugen",
  sthanshaugen: "St. Hanshaugen",
  "st. hanshaugen": "St. Hanshaugen",
  sagene: "Sagene",
  torshov: "Torshov",
  kampen: "Kampen",
  hasle: "Hasle",
  vulkan: "Vulkan",
  groruddalen: "Groruddalen",
};

export function normalizeOsloNeighborhoodDisplay(raw?: string | null): string {
  if (!raw || !raw.trim()) return "Oslo";
  const trimmed = raw.trim();
  const key = trimmed.toLowerCase();
  if (NEIGHBORHOOD_DISPLAY_MAP[key]) return NEIGHBORHOOD_DISPLAY_MAP[key];
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Strips redundant ", Norway", ", Oslo", repeating city labels, and extracts clean street address
 * and postal-code-resolved neighborhood.
 */
export function formatOsloLocation(
  rawAddress?: string | null,
  fallbackNeighborhood?: string | null
): FormattedOsloLocation {
  if (!rawAddress || !rawAddress.trim()) {
    const nh = normalizeOsloNeighborhoodDisplay(fallbackNeighborhood);
    return {
      street: nh,
      neighborhood: nh,
      postalCode: null,
      fullClean: nh,
    };
  }

  // 1. Remove redundant country and duplicate mentions
  let clean = rawAddress
    .replace(/,\s*Norway\b/gi, '')
    .replace(/,\s*Norge\b/gi, '')
    .trim();

  // 2. Extract postal code + city (e.g. "0154 Oslo" or "2000 Lillestrøm")
  const postalCityMatch = clean.match(/\b(\d{4})\s+([A-Za-zæøåÆØÅ]+)\b/);
  const postalOnlyMatch = clean.match(/\b(\d{4})\b/);
  const postalCode = postalCityMatch ? postalCityMatch[1] : (postalOnlyMatch ? postalOnlyMatch[1] : null);
  const extractedCity = postalCityMatch ? postalCityMatch[2] : null;

  const resolvedNeighborhood = postalCode && postalCode.startsWith('0')
    ? resolveOsloPostalCode(postalCode)
    : (extractedCity && extractedCity.toLowerCase() !== 'oslo' ? extractedCity : null);

  // 3. Clean street component by removing postal code + city
  let street = clean
    .replace(/\b\d{4}\s+[A-Za-zæøåÆØÅ]+\b/gi, '')
    .replace(/\b\d{4}\b/g, '')
    .replace(/,\s*Oslo\b/gi, '')
    .replace(/,\s*[A-Za-zæøåÆØÅ]+\b/gi, (match) => {
      const word = match.replace(/^[,\s]+/, '');
      return word.toLowerCase() === (extractedCity || '').toLowerCase() ? '' : match;
    })
    .replace(/\s+/g, ' ')
    .trim();

  // Strip trailing/leading commas
  street = street.replace(/^[,\s]+|[,\s]+$/g, '').trim();

  // Neighborhood resolution precedence: Postal code match > fallback neighborhood > 'Oslo'
  const neighborhood = normalizeOsloNeighborhoodDisplay(
    resolvedNeighborhood ||
    (fallbackNeighborhood && fallbackNeighborhood.toLowerCase() !== 'all' && fallbackNeighborhood.toLowerCase() !== 'oslo'
      ? fallbackNeighborhood
      : (extractedCity || 'Oslo'))
  );

  const fullClean = street ? `${street} · ${neighborhood}` : neighborhood;

  return {
    street: street || neighborhood,
    neighborhood,
    postalCode,
    fullClean,
  };
}

/**
 * Generates an authoritative Google Maps Directions URL.
 * Uses the official Google Maps URLs Directions API:
 * https://www.google.com/maps/dir/?api=1&destination=name+address&destination_place_id=...
 * Passing name and formatted address preserves the readable destination label
 * in Google Maps navigation, while destination_place_id binds directly to the verified place.
 */
export function getDirectionsUrl(venue?: {
  name?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  google_place_id?: string | null;
  google_maps_uri?: string | null;
} | null): string {
  if (!venue) return "https://www.google.com/maps";

  const destParts = [venue.name, venue.address].filter(Boolean);
  const destQuery = destParts.length > 0
    ? destParts.join(", ")
    : (venue.latitude && venue.longitude ? `${venue.latitude},${venue.longitude}` : "Oslo");

  const encodedDest = encodeURIComponent(destQuery);

  if (venue.google_place_id && !venue.google_place_id.startsWith("mock:")) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodedDest}&destination_place_id=${encodeURIComponent(venue.google_place_id)}`;
  }

  if (venue.latitude && venue.longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodedDest}`;
  }

  // Fallback to direct URI when place ID or coordinates are absent
  if (venue.google_maps_uri && !venue.google_maps_uri.includes("q=place_id:")) {
    return venue.google_maps_uri;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${encodedDest}`;
}

/**
 * Deduplicates venue street + neighborhood for map cards and bottom sheets so
 * "Sentrum · Sentrum" or "Oslo · Oslo" never appear.
 */
export function formatVenueLocationLine(venue?: {
  address?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  spot_type?: string | null;
  popup_start_date?: string | null;
  popup_end_date?: string | null;
  popup_meta?: {
    residency_status?: string;
    dates_label?: string;
    host_address?: string;
  } | null;
} | null): string {
  if (!venue) return "Oslo";

  const isPopup = venue.spot_type === "popup" || venue.spot_type === "pop_up";
  const datesLabel = (venue.popup_meta?.dates_label || "").toLowerCase();
  const isBetweenDrops =
    isPopup &&
    (venue.popup_meta?.residency_status === "between_residencies" ||
      datesLabel.includes("tba") ||
      (!venue.popup_start_date && !venue.popup_end_date && !venue.popup_meta?.dates_label));

  const rawAddr = (venue.popup_meta?.host_address || venue.address || "").trim();
  const cleanFirstPart = rawAddr
    .split(",")[0]
    ?.replace(/\b\d{4}\s+[A-Za-zæøåÆØÅ]+\b/gi, "")
    .replace(/\b\d{4}\b/g, "")
    .trim();

  const parsed = formatOsloLocation(rawAddr, venue.neighborhood);
  const nh = normalizeOsloNeighborhoodDisplay(
    venue.neighborhood && String(venue.neighborhood) !== "all"
      ? String(venue.neighborhood)
      : parsed.neighborhood
  );

  const genericSet = new Set(["", "oslo", "norway", "norge", "tba", "roaming", "location tba"]);
  const addrLower = (cleanFirstPart || "").toLowerCase();
  const nhLower = nh.toLowerCase();

  if (isBetweenDrops && (genericSet.has(addrLower) || addrLower === nhLower)) {
    return "Roaming Pop-Up · Oslo";
  }

  if (!cleanFirstPart || genericSet.has(addrLower) || addrLower === nhLower) {
    return nh || "Oslo";
  }

  if (isBetweenDrops) {
    return "Roaming Pop-Up · Oslo";
  }

  return `${cleanFirstPart} · ${nh}`;
}
