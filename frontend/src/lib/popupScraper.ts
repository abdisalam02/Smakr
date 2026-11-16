/**
 * Hybrid pop-up scrape pipeline — shared, environment-agnostic helpers.
 *
 * IMPORTANT: never import `playwright` (or any Node-only module) at the top
 * level of this file. It is imported by the `/api/admin/sync-popups` route,
 * and a static Playwright import would drag a browser driver into the Next.js
 * build. The CLI (`scripts/sync-popups.ts`) dynamically imports Playwright and
 * passes plain text in here.
 *
 * Pass 1 (Playwright / local, $0) runs in the CLI.
 * Pass 2 (Apify Instagram fallback) lives here so the API route can reuse it.
 * Pass 3 (Norwegian/English drop parser + report builder) lives here too.
 */

export interface PopupWatchTarget {
  handle: string;
  name: string;
  site?: string;
  /** Optional hints used to match an existing `venues` row. */
  venueMatch?: {
    name?: string;
    instagram?: string;
    neighborhood?: string;
  };
}

export const POPUP_WATCHLIST: PopupWatchTarget[] = [
  {
    handle: "uwansamofficial",
    name: "U WAN SUM",
    site: "https://uwansam.no",
    venueMatch: { name: "u wan sum", instagram: "uwansamofficial", neighborhood: "sentrum" },
  },
  {
    handle: "mintonwheels",
    name: "Mint on Wheels",
    venueMatch: { name: "mint on wheels", instagram: "mintonwheels" },
  },
  {
    handle: "crantzcookies",
    name: "Crantz Cookies",
    site: "https://crantz.no",
    venueMatch: { name: "crantz cookies", instagram: "crantzcookies" },
  },
  {
    handle: "called_chewiess",
    name: "Called Chewiess",
    venueMatch: { name: "called chewiess", instagram: "called_chewiess" },
  },
];

export type ScrapeSourceKind = "tiktok" | "website" | "apify";

export interface ScrapeSource {
  kind: ScrapeSourceKind;
  url: string;
  ok: boolean;
  fetched_at: string;
  /** Profile bio / site intro copy. */
  bio?: string;
  /** Latest 3 captions / announcements (newest first). */
  snippets: string[];
  error?: string;
}

export interface ParsedDrop {
  drop_dates: string | null;
  drop_hours: string | null;
  location: string | null;
  neighborhood: string;
  confidence: number;
  evidence: {
    dates?: string;
    times?: string;
    location?: string;
  };
}

export interface PopupReportEntry {
  handle: string;
  name: string;
  site?: string;
  sources: ScrapeSource[];
  raw_snippets: string[];
  drop_dates: string | null;
  drop_hours: string | null;
  location: string | null;
  neighborhood: string;
  confidence: number;
  checked_at: string;
}

export interface PopupSyncReport {
  generated_at: string;
  apify_enabled: boolean;
  watchlist: string[];
  entries: PopupReportEntry[];
}

/* ------------------------------------------------------------------ */
/* Pass 3 — Norwegian / English drop date, time & location parser      */
/* ------------------------------------------------------------------ */

const MONTHS: Record<string, string> = {
  januar: "jan",
  january: "jan",
  jan: "jan",
  februar: "feb",
  february: "feb",
  feb: "feb",
  mars: "mar",
  march: "mar",
  mar: "mar",
  april: "apr",
  apr: "apr",
  mai: "mai",
  may: "mai",
  juni: "jun",
  june: "jun",
  jun: "jun",
  juli: "jul",
  july: "jul",
  jul: "jul",
  august: "aug",
  aug: "aug",
  september: "sep",
  sept: "sep",
  sep: "sep",
  oktober: "okt",
  october: "okt",
  okt: "okt",
  oct: "okt",
  november: "nov",
  nov: "nov",
  desember: "des",
  december: "des",
  des: "des",
  dec: "des",
};

const MONTH_PATTERN = Object.keys(MONTHS)
  .sort((a, b) => b.length - a.length)
  .join("|");

const WEEKDAY_PATTERN =
  "mandag|man|tirsdag|tir|onsdag|ons|torsdag|tor|fredag|fre|l[øo]rdag|l[øo]r|s[øo]ndag|s[øo]n|monday|mon|tuesday|tue|wednesday|wed|thursday|thu|friday|fri|saturday|sat|sunday|sun";

const RELATIVE_DATE_PATTERN =
  "i\\s*dag|i\\s*morgen|denne\\s*helgen|denne\\s*helga|neste\\s*helg|neste\\s*uke|denne\\s*uken|this\\s*weekend|next\\s*weekend|this\\s*week|next\\s*week|today|tomorrow";

const SELLOUT_PATTERN = /til\s*tomt|until\s*sold\s*out|sold\s*out|s[åa]\s*lenge\s*det\s*varer/i;

interface LocationRule {
  label: string;
  match: RegExp;
  neighborhood: string;
}

/** Specific places before broad districts so "Tullinløkka" wins over "Sentrum". */
const LOCATION_RULES: LocationRule[] = [
  { label: "Tullinløkka", match: /tullinl[øo]kka/i, neighborhood: "sentrum" },
  { label: "Mike's Corner", match: /mike'?s\s*corner/i, neighborhood: "sentrum" },
  { label: "Oslobukta", match: /oslobukta/i, neighborhood: "sentrum" },
  { label: "Bjørvika", match: /bj[øo]rvika/i, neighborhood: "sentrum" },
  { label: "Vulkan", match: /vulkan/i, neighborhood: "grunerlokka" },
  { label: "Løren", match: /l[øo]ren/i, neighborhood: "løren" },
  { label: "Grünerløkka", match: /gr[üu]nerl[øo]kka/i, neighborhood: "grunerlokka" },
  { label: "Sofienberg", match: /sofienberg/i, neighborhood: "grunerlokka" },
  { label: "St. Hanshaugen", match: /st\.?\s*hanshaugen/i, neighborhood: "st. hanshaugen" },
  { label: "Torggata", match: /torggata/i, neighborhood: "torggata" },
  { label: "Grønland", match: /gr[øo]nland/i, neighborhood: "gronland" },
  { label: "Tøyen", match: /t[øo]yen/i, neighborhood: "toyen" },
  { label: "Frogner", match: /frogner/i, neighborhood: "frogner" },
  { label: "Kampen", match: /kampen/i, neighborhood: "kampen" },
  { label: "Aker Brygge", match: /aker\s*brygge/i, neighborhood: "sentrum" },
  { label: "Sentrum", match: /\bsentrum\b/i, neighborhood: "sentrum" },
];

const HOST_STOPWORDS = new Set([
  "oslo",
  "norge",
  "norway",
  "instagram",
  "tiktok",
  "facebook",
  "drop",
  "popup",
  "pop-up",
  "pop",
  "up",
  "the",
  "this",
  "next",
  "sold",
  "out",
  "today",
  "tomorrow",
  "saturday",
  "sunday",
  "lørdag",
  "søndag",
]);

function normalizeText(input: string): string {
  return input
    .replace(/\u00a0/g, " ")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\r/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, " \n ")
    .trim();
}

function cleanPhrase(value: string): string {
  return value
    .replace(/^[\s.,;:!?•·|/\\-]+/, "")
    .replace(/[\s.,;:!?•·|/\\-]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalMonth(word: string): string {
  return MONTHS[word.toLowerCase()] || "nov";
}

/** First date-ish phrase in the text, in a stable human form. */
export function extractDropDate(text: string): { value: string; matched: string } | null {
  const input = normalizeText(text);
  if (!input) return null;

  // 22. nov / 22. november / 22-24. nov
  const dayMonth = new RegExp(
    `\\b(\\d{1,2})\\.?\\s*(?:${MONTH_PATTERN})\\.?(?:\\s*(?:-|–|—|til|to)\\s*(\\d{1,2})\\.?)?\\b`,
    "i"
  ).exec(input);
  if (dayMonth) {
    const monthWord = dayMonth[0].match(new RegExp(`(${MONTH_PATTERN})`, "i"))?.[1] || "nov";
    const month = canonicalMonth(monthWord);
    const end = dayMonth[2];
    const value = end ? `${dayMonth[1]}.–${end}. ${month}` : `${dayMonth[1]}. ${month}`;
    return { value, matched: cleanPhrase(dayMonth[0]) };
  }

  // Nov 22 / November 22-24
  const monthDay = new RegExp(
    `\\b(?:${MONTH_PATTERN})\\.?\\s*(\\d{1,2})(?:\\s*(?:-|–|—|til|to)\\s*(\\d{1,2}))?\\b`,
    "i"
  ).exec(input);
  if (monthDay) {
    const monthWord = monthDay[0].match(new RegExp(`(${MONTH_PATTERN})`, "i"))?.[1] || "nov";
    const month = canonicalMonth(monthWord);
    const end = monthDay[2];
    const value = end ? `${monthDay[1]}.–${end}. ${month}` : `${monthDay[1]}. ${month}`;
    return { value, matched: cleanPhrase(monthDay[0]) };
  }

  // 14/11 or 14.11.2026 (no month word)
  const numeric = /\b(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?\b/.exec(input);
  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      const monthKeys = [
        "jan",
        "feb",
        "mar",
        "apr",
        "mai",
        "jun",
        "jul",
        "aug",
        "sep",
        "okt",
        "nov",
        "des",
      ];
      return { value: `${day}. ${monthKeys[month - 1]}`, matched: numeric[0] };
    }
  }

  // Thu–Sun / torsdag til søndag
  const weekday = new RegExp(
    `\\b(?:${WEEKDAY_PATTERN})(?:dag)?\\s*(?:-|–|—|til|to|og|&)\\s*(?:${WEEKDAY_PATTERN})(?:dag)?\\b`,
    "i"
  ).exec(input);
  if (weekday) return { value: cleanPhrase(weekday[0]), matched: weekday[0] };

  const singleWeekday = new RegExp(`\\b(?:${WEEKDAY_PATTERN})(?:dag)?\\b`, "i").exec(input);
  if (singleWeekday) {
    return { value: cleanPhrase(singleWeekday[0]), matched: singleWeekday[0] };
  }

  const relative = new RegExp(`\\b(?:${RELATIVE_DATE_PATTERN})\\b`, "i").exec(input);
  if (relative) return { value: cleanPhrase(relative[0]), matched: relative[0] };

  return null;
}

/** First opening-time phrase in the text. */
export function extractDropHours(text: string): { value: string; matched: string } | null {
  const input = normalizeText(text);
  if (!input) return null;

  const range = /\b(\d{1,2})[:.](\d{2})\s*(?:-|–|—|til|to)\s*(\d{1,2})[:.](\d{2})\b/i.exec(input);
  if (range) {
    const sellout = SELLOUT_PATTERN.test(input) ? " (til tomt)" : "";
    return {
      value: `${range[1]}:${range[2]}–${range[3]}:${range[4]}${sellout}`,
      matched: range[0],
    };
  }

  // "kl 12 til 18" / "at 12-18" — bare-hour ranges only when anchored to a
  // time word, so date ranges like "22-24 nov" never match here.
  const bareRange =
    /\b(?:kl\.?|klokka|at)\s*(\d{1,2})(?::(\d{2}))?\s*(?:-|–|—|til|to)\s*(\d{1,2})(?::(\d{2}))?\b/i.exec(
      input
    );
  if (bareRange) {
    const startHour = Number(bareRange[1]);
    const endHour = Number(bareRange[3]);
    if (startHour <= 23 && endHour <= 23) {
      const sellout = SELLOUT_PATTERN.test(input) ? " (til tomt)" : "";
      return {
        value: `${bareRange[1]}:${bareRange[2] || "00"}–${bareRange[3]}:${bareRange[4] || "00"}${sellout}`,
        matched: bareRange[0],
      };
    }
  }

  const from = /\b(?:fra|from)\s*(\d{1,2})(?:[:.](\d{2}))?\b/i.exec(input);
  if (from) {
    const time = `${from[1]}:${from[2] || "00"}`;
    const sellout = SELLOUT_PATTERN.test(input) ? " (til tomt)" : "";
    return { value: `${time}${sellout}`, matched: from[0] };
  }

  const single = /\b(\d{1,2})[:.](\d{2})\b/.exec(input);
  if (single) {
    const hour = Number(single[1]);
    if (hour >= 0 && hour <= 23) {
      const sellout = SELLOUT_PATTERN.test(input) ? " (til tomt)" : "";
      return { value: `${single[1]}:${single[2]}${sellout}`, matched: single[0] };
    }
  }

  if (SELLOUT_PATTERN.test(input)) {
    return { value: "Til tomt", matched: "til tomt" };
  }

  return null;
}

/** First known Oslo venue / neighborhood phrase in the text. */
export function extractLocation(text: string): {
  value: string;
  matched: string;
  neighborhood: string;
} | null {
  const input = normalizeText(text);
  if (!input) return null;

  for (const rule of LOCATION_RULES) {
    const found = input.match(rule.match);
    if (found) {
      return {
        value: rule.label,
        matched: found[0],
        neighborhood: rule.neighborhood,
      };
    }
  }

  // Conservative host fallback: "hos X", "at X", "på X".
  const host = /\b(?:hos|at|p[åa]|ved)\s+([A-ZÆØÅ][\w'’.&-]*(?:\s+[A-ZÆØÅ][\w'’.&-]*){0,3})/.exec(
    input
  );
  if (host) {
    const candidate = cleanPhrase(host[1]);
    const words = candidate.split(/\s+/);
    const first = words[0]?.toLowerCase();
    if (
      candidate.length >= 3 &&
      candidate.length <= 48 &&
      !words.some((w) => HOST_STOPWORDS.has(w.toLowerCase())) &&
      !HOST_STOPWORDS.has(first)
    ) {
      return { value: candidate, matched: host[0], neighborhood: "sentrum" };
    }
  }

  return null;
}

/** Full Pass 3 parse of one blob of text. */
export function parseDropText(text: string): ParsedDrop {
  const date = extractDropDate(text);
  const hours = extractDropHours(text);
  const location = extractLocation(text);

  let confidence = 0.1;
  if (date) confidence += 0.4;
  if (hours) confidence += 0.25;
  if (location) confidence += 0.25;

  return {
    drop_dates: date?.value ?? null,
    drop_hours: hours?.value ?? null,
    location: location?.value ?? null,
    neighborhood: location?.neighborhood ?? "sentrum",
    confidence: Math.min(1, Math.round(confidence * 100) / 100),
    evidence: {
      dates: date?.matched,
      times: hours?.matched,
      location: location?.matched,
    },
  };
}

/** Combine the newest caption first, then bio, then older captions. */
export function sourceText(source: ScrapeSource): string {
  return [source.snippets[0], source.bio, ...source.snippets.slice(1)]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join("\n");
}

export function parseDropFromSources(sources: ScrapeSource[]): ParsedDrop {
  const usable = sources.filter((source) => source.ok);
  const text = usable
    .sort((a, b) => b.fetched_at.localeCompare(a.fetched_at))
    .map(sourceText)
    .join("\n");
  return parseDropText(text);
}

/* ------------------------------------------------------------------ */
/* Pass 2 — Apify Instagram profile fallback                           */
/* ------------------------------------------------------------------ */

export const APIFY_INSTAGRAM_ACTOR = "apify~instagram-profile-scraper";

export function isApifyEnabled(token: string | undefined = process.env.APIFY_API_TOKEN): boolean {
  return Boolean(token && token.trim());
}

export interface ApifyFetchOptions {
  token?: string;
  timeoutMs?: number;
}

/**
 * Pull a profile biography + the latest 3 captions through Apify's
 * run-sync-get-dataset-items endpoint. Never throws.
 */
export async function fetchInstagramViaApify(
  handle: string,
  options: ApifyFetchOptions = {}
): Promise<ScrapeSource> {
  const token = (options.token ?? process.env.APIFY_API_TOKEN ?? "").trim();
  const fetched_at = new Date().toISOString();
  const url = `https://api.apify.com/v2/acts/${APIFY_INSTAGRAM_ACTOR}/run-sync-get-dataset-items?token=${encodeURIComponent(
    token
  )}`;

  if (!token) {
    return {
      kind: "apify",
      url: `https://www.instagram.com/${handle}`,
      ok: false,
      fetched_at,
      snippets: [],
      error: "APIFY_API_TOKEN is not configured",
    };
  }

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 45_000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [handle], resultsLimit: 3 }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return {
        kind: "apify",
        url: `https://www.instagram.com/${handle}`,
        ok: false,
        fetched_at,
        snippets: [],
        error: `Apify HTTP ${res.status}${detail ? `: ${detail.slice(0, 180)}` : ""}`,
      };
    }

    const payload = await res.json().catch(() => null);
    const dataset = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { items?: unknown[] })?.items)
      ? ((payload as { items: unknown[] }).items as unknown[])
      : [];

    const profile = (dataset[0] || {}) as {
      biography?: unknown;
      latestPosts?: Array<{ caption?: unknown; text?: unknown }>;
    };

    const bio = typeof profile.biography === "string" ? profile.biography : "";
    const posts = Array.isArray(profile.latestPosts) ? profile.latestPosts : [];
    const snippets = posts
      .slice(0, 3)
      .map((post) => String(post?.caption ?? post?.text ?? "").trim())
      .filter(Boolean);

    return {
      kind: "apify",
      url: `https://www.instagram.com/${handle}`,
      ok: Boolean(bio || snippets.length),
      fetched_at,
      bio: bio || undefined,
      snippets,
      error: bio || snippets.length ? undefined : "Apify returned no biography or captions",
    };
  } catch (err) {
    return {
      kind: "apify",
      url: `https://www.instagram.com/${handle}`,
      ok: false,
      fetched_at,
      snippets: [],
      error:
        err instanceof Error && err.name === "AbortError"
          ? `Apify timed out after ${Math.round(timeoutMs / 1000)}s`
          : err instanceof Error
          ? err.message
          : "Unknown Apify error",
    };
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* Report builder (shared by CLI + API route)                          */
/* ------------------------------------------------------------------ */

export function createReportEntry(
  target: PopupWatchTarget,
  sources: ScrapeSource[]
): PopupReportEntry {
  const parsed = parseDropFromSources(sources);
  return {
    handle: target.handle,
    name: target.name,
    site: target.site,
    sources,
    raw_snippets: sources
      .flatMap((source) => [source.bio || "", ...source.snippets])
      .map((text) => text.trim())
      .filter(Boolean)
      .slice(0, 12),
    drop_dates: parsed.drop_dates,
    drop_hours: parsed.drop_hours,
    location: parsed.location,
    neighborhood: parsed.neighborhood,
    confidence: parsed.confidence,
    checked_at: new Date().toISOString(),
  };
}

export function buildPopupReport(
  entries: PopupReportEntry[],
  now: Date = new Date()
): PopupSyncReport {
  return {
    generated_at: now.toISOString(),
    apify_enabled: isApifyEnabled(),
    watchlist: entries.map((entry) => entry.handle),
    entries,
  };
}

/** True when Pass 3 found a concrete (non-empty) date for this entry. */
export function hasDetectedDate(entry: Pick<PopupReportEntry, "drop_dates">): boolean {
  return Boolean(entry.drop_dates && entry.drop_dates.trim());
}

/** Case/whitespace-insensitive comparison for schedule text. */
export function normalizeScheduleValue(value: string | null | undefined): string {
  return (value || "")
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[.,;:]/g, "")
    .trim();
}

/**
 * A detected schedule is "new" when it exists and differs from what the venue
 * already stores. Missing detection is never treated as a change.
 */
export function isScheduleChange(
  detected: { drop_dates: string | null; drop_hours: string | null; location: string | null },
  current: { drop_dates?: string | null; drop_hours?: string | null; location?: string | null }
): boolean {
  const pairs: Array<[string | null, string | null | undefined]> = [
    [detected.drop_dates, current.drop_dates],
    [detected.drop_hours, current.drop_hours],
    [detected.location, current.location],
  ];

  for (const [next, prev] of pairs) {
    if (!next) continue;
    if (normalizeScheduleValue(next) !== normalizeScheduleValue(prev)) return true;
  }
  return false;
}
