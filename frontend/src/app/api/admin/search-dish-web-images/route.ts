import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireAdmin } from "@/app/api/admin/_auth";
import { isDeliveryAppImageUrl } from "@/lib/admin/imageSource";

export const runtime = "nodejs";

const SERPAPI_EXCLUSION_SUFFIX =
  "-site:wolt.com -site:foodora.no -site:deliveryhero.io -site:shutterstock.com -site:istockphoto.com";

const BLOCKED_STOCK_OR_DELIVERY =
  /wolt\.com|foodora\.|deliveryhero\.io|shutterstock\.com|istockphoto\.com|gettyimages\.|alamy\.|dreamstime\.|123rf\.|depositphotos\.|vecteezy\./i;

/**
 * Serper free accounts reject advanced operators (`-site:`, `site:`, quotes, `OR`).
 * Clean the query for Serper and rely on `filterAndNormalizeResults` to strip
 * Wolt/Foodora/DeliveryHero and stock-photo URLs server-side.
 */
function sanitizeQueryForSerper(rawQuery: string): string {
  return rawQuery
    .replace(/(?:^|\s)-?site:\S+/gi, " ")
    .replace(/\bOR\b/g, " ")
    .replace(/["""'']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export interface WebSearchImageResult {
  imageUrl: string;
  thumbnailUrl: string;
  title: string;
  domain: string;
  pageUrl: string;
  width: number | null;
  height: number | null;
  source: "web_search";
}

function resolveServerEnv(keyName: string): string {
  const fromEnv = process.env[keyName];
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  try {
    for (const candidate of [
      path.join(process.cwd(), ".env.local"),
      path.join(process.cwd(), "frontend", ".env.local"),
    ]) {
      if (!fs.existsSync(candidate)) continue;
      const content = fs.readFileSync(candidate, "utf8");
      const m = content.match(new RegExp(`^${keyName}=(.+)$`, "m"));
      if (m?.[1]) return m[1].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    // ignore fs read errors on serverless runtimes
  }
  return "";
}

function extractDomain(urlStr: string): string {
  try {
    return new URL(urlStr).hostname.replace(/^www\./i, "");
  } catch {
    return "web";
  }
}

function filterAndNormalizeResults(items: WebSearchImageResult[]): WebSearchImageResult[] {
  const seen = new Set<string>();
  const clean: WebSearchImageResult[] = [];

  for (const item of items) {
    const imgUrl = (item.imageUrl || "").trim();
    const pageUrl = (item.pageUrl || "").trim();
    if (!imgUrl || !/^https?:\/\//i.test(imgUrl)) continue;
    if (seen.has(imgUrl)) continue;
    if (isDeliveryAppImageUrl(imgUrl) || isDeliveryAppImageUrl(pageUrl)) continue;
    if (BLOCKED_STOCK_OR_DELIVERY.test(imgUrl) || BLOCKED_STOCK_OR_DELIVERY.test(pageUrl)) {
      continue;
    }
    if (typeof item.width === "number" && item.width > 0 && item.width < 350) {
      continue;
    }

    seen.add(imgUrl);
    clean.push({
      ...item,
      imageUrl: imgUrl,
      thumbnailUrl: item.thumbnailUrl || imgUrl,
      domain: item.domain || extractDomain(pageUrl || imgUrl),
      source: "web_search",
    });
  }

  return clean;
}

async function querySerperImages(
  apiKey: string,
  q: string
): Promise<WebSearchImageResult[]> {
  const cleanQ = sanitizeQueryForSerper(q);
  const res = await fetch("https://google.serper.dev/images", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: cleanQ,
      gl: "no",
      hl: "en",
      num: 20,
    }),
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });

  if (!res.ok) {
    const errText = (await res.text()).slice(0, 200);
    throw new Error(`Serper returned HTTP ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as {
    images?: Array<{
      title?: string;
      imageUrl?: string;
      imageWidth?: number;
      imageHeight?: number;
      thumbnailUrl?: string;
      source?: string;
      domain?: string;
      link?: string;
    }>;
  };

  const mapped: WebSearchImageResult[] = (data.images || []).map((img) => {
    const pageUrl = img.link || "";
    return {
      imageUrl: img.imageUrl || "",
      thumbnailUrl: img.thumbnailUrl || img.imageUrl || "",
      title: (img.title || "").trim(),
      domain: (img.domain || "").replace(/^www\./i, "") || extractDomain(pageUrl || img.imageUrl || ""),
      pageUrl,
      width: typeof img.imageWidth === "number" ? img.imageWidth : null,
      height: typeof img.imageHeight === "number" ? img.imageHeight : null,
      source: "web_search",
    };
  });

  return filterAndNormalizeResults(mapped);
}

async function querySerpApiImages(
  apiKey: string,
  q: string
): Promise<WebSearchImageResult[]> {
  const queryWithExclusions = q.includes("-site:wolt.com")
    ? q
    : `${q} ${SERPAPI_EXCLUSION_SUFFIX}`.trim();
  const params = new URLSearchParams({
    engine: "google_images",
    q: queryWithExclusions,
    gl: "no",
    hl: "en",
    api_key: apiKey,
  });

  const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`, {
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });

  if (!res.ok) {
    const errText = (await res.text()).slice(0, 200);
    throw new Error(`SerpApi returned HTTP ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as {
    images_results?: Array<{
      title?: string;
      original?: string;
      thumbnail?: string;
      source?: string;
      link?: string;
      original_width?: number;
      original_height?: number;
    }>;
  };

  const mapped: WebSearchImageResult[] = (data.images_results || []).slice(0, 18).map((img) => {
    const pageUrl = img.link || "";
    return {
      imageUrl: img.original || "",
      thumbnailUrl: img.thumbnail || img.original || "",
      title: (img.title || "").trim(),
      domain: extractDomain(pageUrl || img.original || ""),
      pageUrl,
      width: typeof img.original_width === "number" ? img.original_width : null,
      height: typeof img.original_height === "number" ? img.original_height : null,
      source: "web_search",
    };
  });

  return filterAndNormalizeResults(mapped);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as {
      spotName?: string;
      dishName?: string;
      neighborhood?: string;
      mode?: "dish" | "venue_cover";
      customQuery?: string;
    };

    const spotName = (body.spotName || "").trim();
    const dishName = (body.dishName || "").trim();
    const mode = body.mode === "venue_cover" ? "venue_cover" : "dish";
    const customQuery = (body.customQuery || "").trim();

    if (!spotName && !customQuery) {
      return NextResponse.json({ error: "Missing spotName or customQuery" }, { status: 400 });
    }

    const serperKey = resolveServerEnv("SERPER_API_KEY");
    const serpApiKey = resolveServerEnv("SERPAPI_API_KEY");

    if (!serperKey && !serpApiKey) {
      return NextResponse.json(
        {
          error:
            "SERPER_API_KEY is not configured. Add SERPER_API_KEY (2,500 free searches at serper.dev) to frontend/.env.local.",
        },
        { status: 400 }
      );
    }

    const primaryQuery = customQuery
      ? customQuery
      : mode === "venue_cover"
      ? `${spotName} Oslo restaurant exterior interior`
      : dishName
      ? `${spotName} ${dishName} Oslo`
      : `${spotName} food Oslo`;

    const broaderFallbackQuery =
      !customQuery && mode === "dish" && dishName
        ? `${spotName} Oslo ${dishName.split(/\s+/).slice(0, 2).join(" ")}`
        : null;

    const runQuery = async (q: string): Promise<{ results: WebSearchImageResult[]; provider: "serper" | "serpapi" }> => {
      if (serperKey) {
        try {
          const results = await querySerperImages(serperKey, q);
          return { results, provider: "serper" };
        } catch (serperErr) {
          if (!serpApiKey) throw serperErr;
          console.warn("[search-dish-web-images] Serper failed, falling back to SerpApi:", serperErr);
        }
      }
      const results = await querySerpApiImages(serpApiKey, q);
      return { results, provider: "serpapi" };
    };

    let queryUsed = primaryQuery;
    let { results, provider } = await runQuery(primaryQuery);

    if (results.length < 4 && broaderFallbackQuery) {
      const broader = await runQuery(broaderFallbackQuery);
      if (broader.results.length > results.length) {
        const merged = filterAndNormalizeResults([...results, ...broader.results]);
        results = merged;
        queryUsed = broaderFallbackQuery;
        provider = broader.provider;
      }
    }

    return NextResponse.json({
      success: true,
      results,
      queryUsed,
      provider,
    });
  } catch (err: any) {
    console.error("[search-dish-web-images] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Web image search failed" },
      { status: 500 }
    );
  }
}
