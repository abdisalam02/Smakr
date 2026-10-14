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

/**
 * Strips redundant ", Norway", ", Oslo", repeating city labels, and extracts clean street address
 * and postal-code-resolved neighborhood.
 */
export function formatOsloLocation(
  rawAddress?: string | null,
  fallbackNeighborhood?: string | null
): FormattedOsloLocation {
  if (!rawAddress || !rawAddress.trim()) {
    const nh = fallbackNeighborhood?.trim() || 'Oslo';
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

  // 2. Extract postal code (e.g. "0190 Oslo" or "0366")
  const postalMatch = clean.match(/\b(0\d{3})\b/);
  const postalCode = postalMatch ? postalMatch[1] : null;
  const resolvedNeighborhood = postalCode ? resolveOsloPostalCode(postalCode) : null;

  // 3. Clean street component by removing postal code and Oslo suffix
  let street = clean
    .replace(/\b0\d{3}\s+Oslo\b/gi, '')
    .replace(/\b0\d{3}\b/g, '')
    .replace(/,\s*Oslo\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip trailing commas
  street = street.replace(/,\s*$/, '').trim();

  // Neighborhood resolution precedence: Postal code match > fallback neighborhood > 'Oslo'
  const neighborhood =
    resolvedNeighborhood ||
    (fallbackNeighborhood && fallbackNeighborhood.toLowerCase() !== 'all' && fallbackNeighborhood.toLowerCase() !== 'oslo'
      ? fallbackNeighborhood
      : 'Oslo');

  const fullClean = street ? `${street} · ${neighborhood}` : neighborhood;

  return {
    street: street || neighborhood,
    neighborhood,
    postalCode,
    fullClean,
  };
}
