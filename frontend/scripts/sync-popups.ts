/**
 * sync-popups.ts — hybrid pop-up scrape pipeline (run with `tsx`).
 *
 *   npm run sync:popups
 *   npm run sync:popups -- --handles=uwansamofficial,crantzcookies
 *   npm run sync:popups -- --apify-only
 *
 * Pass 1: local Playwright Chromium ($0) reads TikTok bios/captions + official
 *         websites. Playwright is imported dynamically so the script still runs
 *         (and the Next.js build still compiles) when it is not installed.
 * Pass 2: Apify Instagram profile fallback, only when Pass 1 found no date.
 * Pass 3: Norwegian/English drop parser writes public/popup-sync-report.json.
 */
import fs from "fs";
import path from "path";

// Load .env.local / .env when invoked via CLI (`npx tsx`) so APIFY_API_TOKEN is visible.
for (const envName of [".env.local", ".env"]) {
  const candidates = [
    path.join(process.cwd(), envName),
    path.join(process.cwd(), "frontend", envName),
  ];
  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (key && !(key in process.env)) process.env[key] = val;
    }
    break;
  }
}
import {
  POPUP_WATCHLIST,
  buildPopupReport,
  createReportEntry,
  fetchInstagramViaApify,
  hasDetectedDate,
  isApifyEnabled,
  type PopupReportEntry,
  type PopupWatchTarget,
  type ScrapeSource,
} from "../src/lib/popupScraper";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

type PlaywrightBrowser = {
  newContext: (options: Record<string, unknown>) => Promise<PlaywrightContext>;
  close: () => Promise<void>;
};
type PlaywrightContext = {
  addInitScript: (script: { content: string }) => Promise<void>;
  route: (pattern: string, handler: (route: PlaywrightRoute) => Promise<void> | void) => Promise<void>;
  newPage: () => Promise<PlaywrightPage>;
  close: () => Promise<void>;
};
type PlaywrightRoute = {
  request: () => { resourceType: () => string };
  abort: () => Promise<void>;
  continue: () => Promise<void>;
};
type PlaywrightPage = {
  goto: (url: string, options?: Record<string, unknown>) => Promise<unknown>;
  waitForTimeout: (ms: number) => Promise<void>;
  evaluate: <T>(fn: () => T) => Promise<T>;
  close: () => Promise<void>;
};

function resolvePublicDir(): string {
  const cwd = process.cwd();
  const direct = path.join(cwd, "public");
  if (fs.existsSync(direct)) return direct;
  return path.join(cwd, "frontend", "public");
}

function parseArgs(argv: string[]) {
  const handles = argv
    .filter((arg) => arg.startsWith("--handles="))
    .flatMap((arg) => arg.slice("--handles=".length).split(","))
    .map((handle) => handle.trim().replace(/^@/, "").toLowerCase())
    .filter(Boolean);

  return {
    apifyOnly: argv.includes("--apify-only"),
    noPlaywright: argv.includes("--no-playwright"),
    handles,
  };
}

function selectTargets(handles: string[]): PopupWatchTarget[] {
  if (handles.length === 0) return POPUP_WATCHLIST;
  return POPUP_WATCHLIST.filter((target) =>
    handles.includes(target.handle.replace(/^@/, "").toLowerCase())
  );
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === "TimeoutError") return "Timed out";
    return err.message;
  }
  return "Unknown error";
}

/** Read a profile page without depending on TikTok's volatile class names. */
async function scrapeTikTok(page: PlaywrightPage, target: PopupWatchTarget): Promise<ScrapeSource> {
  const url = `https://www.tiktok.com/@${target.handle}`;
  const fetched_at = new Date().toISOString();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25_000 });
    await page.waitForTimeout(1_800);

    const data = await page.evaluate(() => {
      const meta = (name: string) =>
        document
          .querySelector(`meta[name="${name}"],meta[property="${name}"]`)
          ?.getAttribute("content") || "";

      const captions = Array.from(
        document.querySelectorAll(
          '[data-e2e="browse-video-desc"], [data-e2e="user-post-item-desc"], [data-e2e="search-card-desc"]'
        )
      )
        .map((el) => (el.textContent || "").replace(/\s+/g, " ").trim())
        .filter(Boolean);

      const bio = Array.from(
        document.querySelectorAll('[data-e2e="user-bio"], [data-e2e="user-subtitle"]')
      )
        .map((el) => (el.textContent || "").trim())
        .filter(Boolean)
        .join(" · ");

      const lines = (document.body?.innerText || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      return {
        meta: meta("og:description") || meta("description"),
        bio,
        captions,
        lines,
      };
    });

    const junkLine =
      /^(log in|sign up|for you|following|explore|upload|about|terms|privacy|cookies|©|tiktok|minidramaserier|vilkår og retningslinjer|skaff deg appen|logg inn|registrer deg|se mer|følg|for deg|utforsk|last opp|mer|norsk|english)$/i;
    const noise =
      /(finner ikke kontoen|ser du etter videoer|vis undertekster|drag the slider|fit the puzzle|samtykke til informasjonskapsler|vi og våre partnere|informasjonskapsler|personopplysninger|mva sats|^[0-9a-f]{20,}$)/i;
    const scheduleSignal =
      /(\d{1,2}[:.]\d{2}|\b\d{1,2}\.?\s*(jan|feb|mar|apr|mai|may|jun|jul|aug|sep|okt|oct|nov|des|dec)\b|l[øo]rdag|s[øo]ndag|mandag|tirsdag|onsdag|torsdag|fredag|saturday|sunday|drop|pop[- ]?up|hos\s|kl\.?\s*\d|til\s*tomt)/i;

    const fallbackLines = data.lines
      .filter(
        (line) =>
          line.length >= 14 &&
          line.length <= 240 &&
          !junkLine.test(line) &&
          !noise.test(line)
      )
      .slice(0, 12);
    const prioritizedLines = fallbackLines.filter((line) => scheduleSignal.test(line));

    const snippets = (
      data.captions.length
        ? data.captions
        : prioritizedLines.length
        ? prioritizedLines
        : fallbackLines
    ).slice(0, 3);
    const bio = data.bio || data.meta || "";
    const ok = Boolean(bio || snippets.length);

    return {
      kind: "tiktok",
      url,
      ok,
      fetched_at,
      bio: bio || undefined,
      snippets,
      error: ok ? undefined : "TikTok returned no readable bio/captions (bot wall?)",
    };
  } catch (err) {
    return {
      kind: "tiktok",
      url,
      ok: false,
      fetched_at,
      snippets: [],
      error: errorMessage(err),
    };
  }
}

async function scrapeWebsite(page: PlaywrightPage, site: string): Promise<ScrapeSource> {
  const fetched_at = new Date().toISOString();
  try {
    await page.goto(site, { waitUntil: "domcontentloaded", timeout: 25_000 });
    await page.waitForTimeout(1_200);

    const data = await page.evaluate(() => {
      const meta = (name: string) =>
        document
          .querySelector(`meta[name="${name}"],meta[property="${name}"]`)
          ?.getAttribute("content") || "";

      const blocks = Array.from(document.querySelectorAll("h1, h2, h3, p, li"))
        .map((el) => (el.textContent || "").replace(/\s+/g, " ").trim())
        .filter(
          (text) =>
            text.length >= 24 &&
            text.length <= 300 &&
            !/(samtykke til informasjonskapsler|vi og våre partnere|informasjonskapsler|mva sats)/i.test(
              text
            )
        );

      return {
        meta: meta("og:description") || meta("description"),
        blocks,
      };
    });

    const snippets = data.blocks.slice(0, 3);
    const bio = data.meta || data.blocks[0] || "";
    const ok = Boolean(bio || snippets.length);

    return {
      kind: "website",
      url: site,
      ok,
      fetched_at,
      bio: bio || undefined,
      snippets,
      error: ok ? undefined : "Website returned no readable text",
    };
  } catch (err) {
    return {
      kind: "website",
      url: site,
      ok: false,
      fetched_at,
      snippets: [],
      error: errorMessage(err),
    };
  }
}

async function launchPlaywright(): Promise<{
  browser: PlaywrightBrowser | null;
  context: PlaywrightContext | null;
}> {
  try {
    // Dynamic import keeps the browser driver out of the Next.js bundle and
    // lets this script run without Playwright installed.
    const playwright = (await import("playwright")) as unknown as {
      chromium: { launch: (options?: Record<string, unknown>) => Promise<PlaywrightBrowser> };
    };

    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: USER_AGENT,
      locale: "nb-NO",
      timezoneId: "Europe/Oslo",
      viewport: { width: 1280, height: 900 },
    });

    // tsx/esbuild adds a `__name()` helper to transpiled callbacks; make it a
    // no-op in the page so `page.evaluate` works when run through tsx.
    await context.addInitScript({ content: "window.__name = window.__name || (fn => fn);" });

    // Text only: skip images/media/fonts for speed and fewer bot signals.
    await context.route("**/*", async (route) => {
      const type = route.request().resourceType();
      if (type === "image" || type === "media" || type === "font") {
        await route.abort();
        return;
      }
      await route.continue();
    });

    return { browser, context };
  } catch (err) {
    console.warn(
      `\n⚠ Playwright disabled (${errorMessage(err)}). ` +
        `Pass 1 will be skipped — Apify fallback only.\n` +
        `  Install it with: npm install -D playwright && npx playwright install chromium\n`
    );
    return { browser: null, context: null };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const targets = selectTargets(args.handles);
  const entries: PopupReportEntry[] = [];

  console.log("╭──────────────────────────────────────────────────────────╮");
  console.log("│  SMO / Smakr — pop-up schedule sync                      │");
  console.log("╰──────────────────────────────────────────────────────────╯");
  console.log(`Watchlist: ${targets.map((target) => `@${target.handle}`).join(", ")}`);
  console.log(`Apify: ${isApifyEnabled() ? "enabled" : "disabled (APIFY_API_TOKEN missing)"}`);

  let context: PlaywrightContext | null = null;
  let browser: PlaywrightBrowser | null = null;

  if (!args.apifyOnly && !args.noPlaywright) {
    const launched = await launchPlaywright();
    browser = launched.browser;
    context = launched.context;
    console.log(`Pass 1 (Playwright): ${context ? "ready" : "skipped"}`);
  } else {
    console.log("Pass 1 (Playwright): skipped by flag");
  }

  try {
    for (const target of targets) {
      const sources: ScrapeSource[] = [];

      if (context) {
        const page = await context.newPage();
        try {
          const tiktok = await scrapeTikTok(page, target);
          sources.push(tiktok);
          console.log(
            `  @${target.handle} tiktok: ${tiktok.ok ? `${tiktok.snippets.length} snippets` : tiktok.error}`
          );

          if (target.site) {
            const website = await scrapeWebsite(page, target.site);
            sources.push(website);
            console.log(
              `  @${target.handle} site:   ${website.ok ? `${website.snippets.length} snippets` : website.error}`
            );
          }
        } finally {
          await page.close().catch(() => undefined);
        }
      }

      let entry = createReportEntry(target, sources);

      // Pass 2 — only spend Apify credits when Pass 1 found no date.
      if (!hasDetectedDate(entry) && isApifyEnabled()) {
        console.log(`  @${target.handle} → Apify fallback…`);
        const apify = await fetchInstagramViaApify(target.handle);
        sources.push(apify);
        entry = createReportEntry(target, sources);
        console.log(
          `  @${target.handle} apify:  ${apify.ok ? `${apify.snippets.length} captions` : apify.error}`
        );
      }

      entries.push(entry);
      console.log(
        `  ✓ @${target.handle} → ${entry.drop_dates || "no date"}${entry.drop_hours ? ` · ${entry.drop_hours}` : ""}${
          entry.location ? ` · ${entry.location}` : ""
        } (${entry.confidence})`
      );
    }
  } finally {
    await context?.close().catch(() => undefined);
    await browser?.close().catch(() => undefined);
  }

  const report = buildPopupReport(entries);
  const publicDir = resolvePublicDir();
  fs.mkdirSync(publicDir, { recursive: true });
  const outPath = path.join(publicDir, "popup-sync-report.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

  console.log("\n──────────────────────────────────────────────────────────");
  console.log(`Report: ${outPath}`);
  console.log(
    `Detected dates: ${entries.filter(hasDetectedDate).length}/${entries.length} · ` +
      `Apify: ${report.apify_enabled ? "on" : "off"}`
  );
  console.log("──────────────────────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error("[sync-popups] fatal:", err);
  process.exitCode = 1;
});
