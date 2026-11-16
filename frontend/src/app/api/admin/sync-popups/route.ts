import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/app/api/admin/_auth";
import type { PendingSubmission } from "@/lib/pendingQueue";
import {
  POPUP_WATCHLIST,
  buildPopupReport,
  createReportEntry,
  fetchInstagramViaApify,
  hasDetectedDate,
  isApifyEnabled,
  isScheduleChange,
  normalizeScheduleValue,
  type PopupReportEntry,
  type PopupSyncReport,
  type PopupWatchTarget,
  type ScrapeSource,
} from "@/lib/popupScraper";

export const runtime = "nodejs";
export const maxDuration = 300;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

interface VenueRow {
  id: string;
  name: string | null;
  address: string | null;
  neighborhood: string | null;
  current_opening_hours_text: string | null;
  vibe_signals: Record<string, unknown> | null;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unknown error";
}

function findReportPath(): string | null {
  const candidates = [
    path.join(process.cwd(), "public", "popup-sync-report.json"),
    path.join(process.cwd(), "frontend", "public", "popup-sync-report.json"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractHtmlBlocks(html: string): string[] {
  const blocks: string[] = [];
  const noise =
    /(samtykke til informasjonskapsler|vi og våre partnere|informasjonskapsler|personopplysninger|mva sats|drag the slider|fit the puzzle)/i;
  const pattern = /<(p|h1|h2|h3|h4|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const text = stripTags(match[2]);
    if (text.length >= 24 && text.length <= 300 && !noise.test(text)) blocks.push(text);
  }
  return blocks;
}

/** Cheap live website read (no browser) used by `mode: "report"`. */
async function fetchWebsiteSource(url: string): Promise<ScrapeSource> {
  const fetched_at = new Date().toISOString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "nb-NO,nb;q=0.9,en;q=0.8",
      },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const blocks = extractHtmlBlocks(html);
    const bio = stripTags(html).slice(0, 800);
    return {
      kind: "website",
      url,
      ok: true,
      fetched_at,
      bio: bio || undefined,
      snippets: blocks.slice(0, 3),
    };
  } catch (err) {
    return {
      kind: "website",
      url,
      ok: false,
      fetched_at,
      snippets: [],
      error: errorMessage(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

function selectTargets(rawHandles: unknown): PopupWatchTarget[] {
  if (!Array.isArray(rawHandles) || rawHandles.length === 0) return POPUP_WATCHLIST;
  const wanted = new Set(
    rawHandles
      .map((handle) => String(handle).trim().replace(/^@/, "").toLowerCase())
      .filter(Boolean)
  );
  return POPUP_WATCHLIST.filter((target) => wanted.has(target.handle.toLowerCase()));
}

function instagramFromSignals(signals: Record<string, unknown> | null): string {
  const sig = (signals || {}) as Record<string, unknown>;
  const meta = (sig.popup_meta || {}) as Record<string, unknown>;
  const raw = meta.instagram || sig.instagram || "";
  return String(raw).replace(/^@/, "").toLowerCase().trim();
}

function matchVenue(target: PopupWatchTarget, venues: VenueRow[]): VenueRow | null {
  const handle = target.handle.replace(/^@/, "").toLowerCase();
  const wantedName = (target.venueMatch?.name || target.name).toLowerCase();

  for (const venue of venues) {
    if (instagramFromSignals(venue.vibe_signals) === handle) return venue;
  }
  for (const venue of venues) {
    const name = (venue.name || "").toLowerCase();
    if (name && (name.includes(wantedName) || wantedName.includes(name))) return venue;
  }
  return null;
}

function currentSchedule(venue: VenueRow) {
  const sig = (venue.vibe_signals || {}) as Record<string, unknown>;
  const meta = (sig.popup_meta || {}) as Record<string, unknown>;
  const pick = (...values: unknown[]) =>
    values.find((value): value is string => typeof value === "string" && value.trim().length > 0) || null;

  return {
    drop_dates: pick(meta.dates_label, meta.dates),
    drop_hours: pick(meta.daily_hours, meta.hours, venue.current_opening_hours_text),
    location: pick(meta.host_venue_name, meta.location, venue.address),
  };
}

function isLocationChange(detected: string | null, current: string | null): boolean {
  if (!detected) return false;
  const next = normalizeScheduleValue(detected);
  const prev = normalizeScheduleValue(current);
  if (!next) return false;
  if (!prev) return true;
  return !prev.includes(next) && !next.includes(prev);
}

function stableSubmissionId(handle: string, entry: PopupReportEntry): string {
  let hash = 0;
  for (const char of `${handle}|${entry.drop_dates || ""}|${entry.location || ""}`) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return `popup-sync-${handle}-${Math.abs(hash).toString(36)}`;
}

function buildSubmission(
  target: PopupWatchTarget,
  entry: PopupReportEntry,
  venue: VenueRow | null
): PendingSubmission {
  const snippet =
    entry.raw_snippets[0] ||
    entry.sources.find((source) => source.bio)?.bio ||
    "Schedule detected from live social/website checks.";
  const sourceLabel =
    entry.sources
      .filter((source) => source.ok)
      .map((source) => source.kind)
      .join(" + ") || "live checks";

  return {
    id: stableSubmissionId(target.handle, entry),
    kind: "makr_popup",
    status: "pending",
    created_at: new Date().toISOString(),
    venue_id: venue?.id,
    venue_name: target.name,
    neighborhood: entry.neighborhood || venue?.neighborhood || "sentrum",
    address: entry.location || venue?.address || undefined,
    is_location_tba: !entry.location,
    instagram_handle: target.handle,
    drop_dates: entry.drop_dates || undefined,
    drop_hours: entry.drop_hours || undefined,
    category: "street_food",
    icon_key: "popup",
    review_text: snippet.replace(/\s+/g, " ").slice(0, 280),
    vibe_note: `Auto-detected via ${sourceLabel} (confidence ${entry.confidence}).`,
    is_local_pick: false,
  };
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json().catch(() => ({}))) as {
      mode?: "apify" | "report";
      handles?: string[];
    };
    const mode = body.mode === "report" ? "report" : "apify";
    const targets = selectTargets(body.handles);

    if (targets.length === 0) {
      return NextResponse.json({
        success: true,
        mode,
        detected: 0,
        queuedCount: 0,
        report: buildPopupReport([]),
        warning: "No watchlist handles matched the request.",
      });
    }

    /* --------------------------------------------------------------- */
    /* Read the latest CLI report (report mode only)                    */
    /* --------------------------------------------------------------- */
    let baseReport: PopupSyncReport | null = null;
    if (mode === "report") {
      const reportPath = findReportPath();
      if (reportPath) {
        try {
          baseReport = JSON.parse(fs.readFileSync(reportPath, "utf8")) as PopupSyncReport;
        } catch (err) {
          console.warn("[api/admin/sync-popups] could not read report:", err);
        }
      }
    }

    /* --------------------------------------------------------------- */
    /* Pass 3 + optionally Pass 2 (Apify) / live website checks         */
    /* --------------------------------------------------------------- */
    const entries: PopupReportEntry[] = [];

    for (const target of targets) {
      const sources: ScrapeSource[] = [];

      if (mode === "report" && baseReport) {
        const previous = baseReport.entries?.find((entry) => entry.handle === target.handle);
        if (previous?.sources?.length) sources.push(...previous.sources);
      }

      if (mode === "report" && target.site) {
        sources.push(await fetchWebsiteSource(target.site));
      }

      const needsApify =
        mode === "apify" || !hasDetectedDate(createReportEntry(target, sources));

      if (needsApify && isApifyEnabled()) {
        sources.push(await fetchInstagramViaApify(target.handle));
      }

      if (mode === "apify" && sources.length === 0) {
        sources.push({
          kind: "apify",
          url: `https://www.instagram.com/${target.handle}`,
          ok: false,
          fetched_at: new Date().toISOString(),
          snippets: [],
          error: "APIFY_API_TOKEN is not configured and Playwright is CLI-only.",
        });
      }

      entries.push(createReportEntry(target, sources));
    }

    const report = buildPopupReport(entries);

    /* --------------------------------------------------------------- */
    /* Compare with current venues + queue pending changes              */
    /* --------------------------------------------------------------- */
    const { data: venueData, error: venuesError } = await auth.adminClient
      .from("venues")
      .select(
        "id, name, address, neighborhood, current_opening_hours_text, vibe_signals"
      )
      .order("id", { ascending: true });

    if (venuesError) {
      return NextResponse.json(
        { success: false, error: `Could not load venues: ${venuesError.message}` },
        { status: 500 }
      );
    }

    const venues = (venueData || []) as VenueRow[];
    const fallbackAnchor = venues[0] || null;

    if (!fallbackAnchor) {
      return NextResponse.json({
        success: true,
        mode,
        detected: 0,
        queuedCount: 0,
        report,
        warning: "No venues exist to anchor the pending queue.",
      });
    }

    const existingItems: PendingSubmission[] = [];
    for (const venue of venues) {
      const sig = (venue.vibe_signals || {}) as Record<string, unknown>;
      const queue = Array.isArray(sig.pending_makr_queue)
        ? (sig.pending_makr_queue as PendingSubmission[])
        : [];
      existingItems.push(...queue);
    }
    const existingKeys = new Set(
      existingItems.map(
        (item) =>
          `${normalizeScheduleValue(item.instagram_handle)}|${normalizeScheduleValue(
            item.drop_dates
          )}|${normalizeScheduleValue(item.address || item.neighborhood)}`
      )
    );

    const updates = new Map<string, { venue: VenueRow; items: PendingSubmission[] }>();
    let detected = 0;
    let queuedCount = 0;

    for (const target of targets) {
      const entry = entries.find((candidate) => candidate.handle === target.handle);
      if (!entry) continue;

      const matched = matchVenue(target, venues);
      const anchor = matched || fallbackAnchor;
      const current = currentSchedule(anchor);

      const dateOrTimeChanged = isScheduleChange(
        {
          drop_dates: entry.drop_dates,
          drop_hours: entry.drop_hours,
          location: null,
        },
        { drop_dates: current.drop_dates, drop_hours: current.drop_hours, location: null }
      );
      const locationChanged = isLocationChange(entry.location, current.location);
      const hasSomething = hasDetectedDate(entry) || Boolean(entry.location);

      if (!hasSomething || (!dateOrTimeChanged && !locationChanged)) continue;

      detected += 1;

      const submission = buildSubmission(target, entry, matched);
      const dedupeKey = `${normalizeScheduleValue(submission.instagram_handle)}|${normalizeScheduleValue(
        submission.drop_dates
      )}|${normalizeScheduleValue(submission.address || submission.neighborhood)}`;

      if (existingKeys.has(dedupeKey)) continue;
      existingKeys.add(dedupeKey);

      const bucket = updates.get(anchor.id) || { venue: anchor, items: [] };
      bucket.items.push(submission);
      updates.set(anchor.id, bucket);
      queuedCount += 1;
    }

    for (const { venue, items } of updates.values()) {
      const sig = (venue.vibe_signals || {}) as Record<string, unknown>;
      const existing = Array.isArray(sig.pending_makr_queue)
        ? (sig.pending_makr_queue as PendingSubmission[])
        : [];
      const nextQueue = [...items, ...existing.filter((item) => !items.some((next) => next.id === item.id))].slice(
        0,
        50
      );

      const { error: updateError } = await auth.adminClient
        .from("venues")
        .update({
          vibe_signals: {
            ...sig,
            pending_makr_queue: nextQueue,
          },
        })
        .eq("id", venue.id);

      if (updateError) {
        console.error("[api/admin/sync-popups] queue update failed:", updateError);
        return NextResponse.json(
          { success: false, error: `Could not save pending queue: ${updateError.message}` },
          { status: 500 }
        );
      }
    }

    if (queuedCount > 0) {
      revalidateTag("venues");
    }

    return NextResponse.json({
      success: true,
      mode,
      detected,
      queuedCount,
      report,
    });
  } catch (err) {
    console.error("[api/admin/sync-popups]", err);
    return NextResponse.json(
      { success: false, error: errorMessage(err) },
      { status: 500 }
    );
  }
}
