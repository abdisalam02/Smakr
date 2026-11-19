/**
 * Canonical URL slugifier for Oslo venue & pop-up share links (`/spot/[slug]`).
 * Normalizes Norwegian letters (ø/å/æ), diacritics, and punctuation consistently
 * across SSR routes, OG images, deep links, and share sheets.
 */
export function slugifyVenue(value: string): string {
  return value
    .trim()
    .replace(/[øØ]/g, "o")
    .replace(/[åÅ]/g, "a")
    .replace(/[æÆ]/g, "ae")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
