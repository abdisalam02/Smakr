import { NextRequest, NextResponse } from "next/server";
import dns from "dns/promises";
import net from "net";
import { requireAdmin } from "@/app/api/admin/_auth";
import { isDeliveryAppImageUrl } from "@/lib/admin/imageSource";

export const runtime = "nodejs";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const SUBPAGE_PATTERN = /\/(menu|meny|mat|food|galleri|gallery|om-oss|about)(?:[/?#_-]|$)/i;
const SUBPAGE_TEXT_PATTERN = /\b(menu|meny|mat|food|galleri|gallery|om oss|about)\b/i;

const JUNK_URL_PATTERN =
  /logo|icon|favicon|avatar|badge|spinner|arrow|flag|facebook|instagram|tiktok|wolt|foodora|deliveryhero|tripadvisor-badge|pixel|analytics|doubleclick|gravatar|recaptcha|cookie|klarna|vipps/i;

const BAD_EXT_PATTERN = /\.(svg|ico|gif|pdf|mp4|webm|woff2?|ttf|eot|css|js)(?:[?#]|$)/i;

const TINY_THUMB_QUERY_PATTERN = /[?&](?:w|width|h|height)=(?:[1-9]|[1-9]\d|1[0-9]\d|2[0-4]\d)(?:&|$)/i;
const TINY_THUMB_DIM_PATTERN =
  /(?:^|[-_/])(?:16|24|32|48|50|64|75|80|96|100|120|150)x(?:16|24|32|48|50|64|75|80|96|100|120|150)(?:\.|[-_/]|$)/i;

export interface ScrapedWebsitePhoto {
  url: string;
  altText: string;
  pageUrl: string;
  source: "website";
}

function isPrivateIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) {
    const parts = ip.split(".").map((n) => Number(n));
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
    return false;
  }
  if (family === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) return true;
    if (lower.startsWith("::ffff:")) {
      const mapped = lower.slice("::ffff:".length);
      if (net.isIP(mapped) === 4) return isPrivateIp(mapped);
    }
    return false;
  }
  return true;
}

async function assertSafePublicUrl(rawUrl: string): Promise<URL> {
  let normalized = rawUrl.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }
  const parsed = new URL(normalized);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http:// and https:// website URLs are allowed.");
  }

  const host = parsed.hostname.toLowerCase();
  if (
    !host ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "0.0.0.0" ||
    host === "[::1]"
  ) {
    throw new Error("Blocked private or localhost URL.");
  }

  if (net.isIP(host)) {
    if (isPrivateIp(host)) {
      throw new Error("Blocked private IP address.");
    }
    return parsed;
  }

  const records = await dns.lookup(host, { all: true });
  if (!records || records.length === 0) {
    throw new Error("Could not resolve website hostname.");
  }
  for (const rec of records) {
    if (isPrivateIp(rec.address)) {
      throw new Error("Website resolves to a private network address.");
    }
  }

  return parsed;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .trim();
}

function pickBestSrcsetUrl(srcset: string): string | null {
  const candidates = srcset
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const parts = entry.split(/\s+/);
      const url = parts[0];
      const descriptor = parts[1] || "";
      let score = 0;
      if (descriptor.endsWith("w")) {
        score = parseInt(descriptor.slice(0, -1), 10) || 0;
      } else if (descriptor.endsWith("x")) {
        score = Math.round((parseFloat(descriptor.slice(0, -1)) || 1) * 1000);
      }
      return { url, score };
    })
    .filter((c) => Boolean(c.url));

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].url;
}

function isCleanPhotoCandidate(resolvedUrl: string, altText = ""): boolean {
  const lower = resolvedUrl.toLowerCase();
  if (!lower.startsWith("http://") && !lower.startsWith("https://")) return false;
  if (lower.startsWith("data:") || lower.startsWith("blob:")) return false;
  if (isDeliveryAppImageUrl(resolvedUrl)) return false;
  if (BAD_EXT_PATTERN.test(lower)) return false;
  if (JUNK_URL_PATTERN.test(lower)) return false;
  if (TINY_THUMB_QUERY_PATTERN.test(lower)) return false;
  if (TINY_THUMB_DIM_PATTERN.test(lower)) return false;
  if (/\b(logo|favicon|icon|avatar|spinner)\b/i.test(altText)) return false;
  return true;
}

function resolveCandidateUrl(raw: string, baseUrl: string): string | null {
  const cleaned = decodeHtmlEntities(raw).replace(/^['"]|['"]$/g, "").trim();
  if (!cleaned || cleaned.startsWith("data:") || cleaned.startsWith("javascript:")) return null;
  try {
    return new URL(cleaned, baseUrl).toString();
  } catch {
    return null;
  }
}

function extractSubpageLinks(html: string, baseUrl: URL): string[] {
  const found: string[] = [];
  const seen = new Set<string>([baseUrl.href.replace(/\/$/, "")]);
  const anchorRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(html)) !== null) {
    const rawHref = decodeHtmlEntities(match[1] || "");
    const linkText = match[2].replace(/<[^>]+>/g, " ").trim();
    if (!rawHref || rawHref.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(rawHref)) {
      continue;
    }

    let resolved: URL;
    try {
      resolved = new URL(rawHref, baseUrl);
    } catch {
      continue;
    }

    if (resolved.origin !== baseUrl.origin) continue;
    if (BAD_EXT_PATTERN.test(resolved.pathname)) continue;

    const normalized = resolved.href.replace(/#.*$/, "").replace(/\/$/, "");
    if (seen.has(normalized)) continue;

    const matchesPath = SUBPAGE_PATTERN.test(resolved.pathname + resolved.search);
    const matchesText = SUBPAGE_TEXT_PATTERN.test(linkText);
    if (!matchesPath && !matchesText) continue;

    seen.add(normalized);
    found.push(resolved.toString());
    if (found.length >= 2) break;
  }

  return found;
}

function extractImagesFromHtml(html: string, pageUrl: string): ScrapedWebsitePhoto[] {
  const results: ScrapedWebsitePhoto[] = [];
  const seen = new Set<string>();

  const pushCandidate = (rawUrl: string | null | undefined, altText = "") => {
    if (!rawUrl) return;
    const resolved = resolveCandidateUrl(rawUrl, pageUrl);
    if (!resolved || seen.has(resolved)) return;
    const cleanAlt = decodeHtmlEntities(altText).slice(0, 120);
    if (!isCleanPhotoCandidate(resolved, cleanAlt)) return;
    seen.add(resolved);
    results.push({
      url: resolved,
      altText: cleanAlt,
      pageUrl,
      source: "website",
    });
  };

  // 1. Open Graph / Twitter meta images
  const metaRegex = /<meta\b[^>]*>/gi;
  let metaMatch: RegExpExecArray | null;
  while ((metaMatch = metaRegex.exec(html)) !== null) {
    const tag = metaMatch[0];
    const isOgImg =
      /(?:property|name)=["'](?:og:image|og:image:secure_url|twitter:image)["']/i.test(tag);
    if (!isOgImg) continue;
    const contentMatch = tag.match(/content=["']([^"']+)["']/i);
    if (contentMatch?.[1]) {
      pushCandidate(contentMatch[1], "Featured site photo");
    }
  }

  // 2. <img> tags (preferring highest-width srcset, then data-src / src)
  const imgRegex = /<img\b[^>]*>/gi;
  let imgMatch: RegExpExecArray | null;
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    const tag = imgMatch[0];
    const widthAttr = tag.match(/\bwidth=["']?(\d+)["']?/i);
    const heightAttr = tag.match(/\bheight=["']?(\d+)["']?/i);
    if (
      (widthAttr && Number(widthAttr[1]) > 0 && Number(widthAttr[1]) < 180) ||
      (heightAttr && Number(heightAttr[1]) > 0 && Number(heightAttr[1]) < 140)
    ) {
      continue;
    }

    const altMatch = tag.match(/\balt=["']([^"']*)["']/i);
    const altText = altMatch?.[1] || "";

    const srcsetMatch =
      tag.match(/\b(?:data-srcset|srcset)=["']([^"']+)["']/i);
    const bestFromSrcset = srcsetMatch?.[1] ? pickBestSrcsetUrl(srcsetMatch[1]) : null;
    const dataSrcMatch = tag.match(/\b(?:data-src|data-lazy-src|data-original)=["']([^"']+)["']/i);
    const srcMatch = tag.match(/\bsrc=["']([^"']+)["']/i);

    pushCandidate(bestFromSrcset || dataSrcMatch?.[1] || srcMatch?.[1], altText);
  }

  // 3. <source srcset="...">
  const sourceRegex = /<source\b[^>]*srcset=["']([^"']+)["'][^>]*>/gi;
  let sourceMatch: RegExpExecArray | null;
  while ((sourceMatch = sourceRegex.exec(html)) !== null) {
    const best = pickBestSrcsetUrl(sourceMatch[1]);
    pushCandidate(best, "");
  }

  // 4. Inline CSS background-image: url(...)
  const bgRegex = /background-image\s*:\s*url\(([^)]+)\)/gi;
  let bgMatch: RegExpExecArray | null;
  while ((bgMatch = bgRegex.exec(html)) !== null) {
    pushCandidate(bgMatch[1], "");
  }

  return results;
}

async function fetchPageHtml(url: string): Promise<{ html: string; finalUrl: string } | null> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,nb;q=0.8",
      },
    });
    if (!res.ok) return null;
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("text/html") && !ct.includes("application/xhtml")) return null;
    const finalUrl = res.url || url;
    await assertSafePublicUrl(finalUrl);
    const html = await res.text();
    return { html, finalUrl };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as {
      websiteUrl?: string;
      spotName?: string;
    };

    const rawUrl = (body.websiteUrl || "").trim();
    if (!rawUrl) {
      return NextResponse.json({ error: "Missing websiteUrl" }, { status: 400 });
    }

    let safeUrl: URL;
    try {
      safeUrl = await assertSafePublicUrl(rawUrl);
    } catch (secErr: any) {
      return NextResponse.json(
        { error: secErr?.message || "Invalid or blocked website URL" },
        { status: 400 }
      );
    }

    const home = await fetchPageHtml(safeUrl.toString());
    if (!home) {
      return NextResponse.json(
        { error: `Could not fetch HTML from ${safeUrl.hostname}.` },
        { status: 502 }
      );
    }

    const homeBase = new URL(home.finalUrl);
    const subpageUrls = extractSubpageLinks(home.html, homeBase);
    const subpagesSettled = await Promise.allSettled(
      subpageUrls.map((subUrl) => fetchPageHtml(subUrl))
    );

    const pages: Array<{ html: string; finalUrl: string }> = [home];
    for (const s of subpagesSettled) {
      if (s.status === "fulfilled" && s.value) {
        pages.push(s.value);
      }
    }

    const deduped: ScrapedWebsitePhoto[] = [];
    const seenUrls = new Set<string>();
    for (const page of pages) {
      for (const photo of extractImagesFromHtml(page.html, page.finalUrl)) {
        if (seenUrls.has(photo.url)) continue;
        seenUrls.add(photo.url);
        deduped.push(photo);
        if (deduped.length >= 24) break;
      }
      if (deduped.length >= 24) break;
    }

    return NextResponse.json({
      success: true,
      photos: deduped,
      pagesCrawled: pages.map((p) => p.finalUrl),
      domain: homeBase.hostname.replace(/^www\./, ""),
    });
  } catch (err: any) {
    console.error("[scrape-website-photos] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to scrape website photos" },
      { status: 500 }
    );
  }
}
