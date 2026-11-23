import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import dns from "dns/promises";
import net from "net";
import sharp from "sharp";
import { requireAdmin } from "@/app/api/admin/_auth";
import { isDeliveryAppImageUrl } from "@/lib/admin/imageSource";

export const runtime = "nodejs";

const STORAGE_BUCKET = "dish-photos";
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

function isPrivateIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some(Number.isNaN)) return true;
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

async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
  const parsed = new URL(rawUrl.trim());
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http/https URLs are supported.");
  }
  const host = parsed.hostname.toLowerCase();
  if (
    !host ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    throw new Error("Blocked private host.");
  }
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error("Blocked private IP.");
    return parsed;
  }
  const records = await dns.lookup(host, { all: true });
  if (!records.length || records.some((r) => isPrivateIp(r.address))) {
    throw new Error("Blocked private DNS resolution.");
  }
  return parsed;
}

async function fetchValidImageBuffer(url: string, referer?: string): Promise<Buffer | null> {
  try {
    const safeUrl = await assertPublicHttpUrl(url);
    // Instagram/Facebook lookaside crawler URLs always redirect to HTML login pages
    if (/lookaside\.(instagram|fbsbx)\.com/i.test(safeUrl.hostname)) {
      return null;
    }

    const headers: Record<string, string> = {
      "User-Agent": BROWSER_UA,
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    };
    if (referer && /^https?:\/\//i.test(referer)) {
      headers.Referer = referer;
    }

    const res = await fetch(safeUrl.toString(), {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers,
    });
    if (!res.ok) return null;

    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (ct.includes("text/html") || ct.includes("application/json")) return null;

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;

    // Validate Sharp can decode it as a real image
    const meta = await sharp(buf).metadata();
    if (!meta.width || !meta.height) return null;
    return buf;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as {
      imageUrl?: string;
      thumbnailUrl?: string;
      pageUrl?: string;
    };

    const primaryUrl = (body.imageUrl || "").trim();
    const fallbackThumbUrl = (body.thumbnailUrl || "").trim();
    const referer = (body.pageUrl || "").trim();

    if (!primaryUrl && !fallbackThumbUrl) {
      return NextResponse.json({ error: "Missing imageUrl" }, { status: 400 });
    }

    if (isDeliveryAppImageUrl(primaryUrl) || isDeliveryAppImageUrl(referer)) {
      return NextResponse.json(
        { error: "Wolt/Foodora images cannot be ingested." },
        { status: 400 }
      );
    }

    // Already hosted on our Supabase Storage CDN
    if (primaryUrl.includes("supabase.co/storage/v1/object/public/dish-photos")) {
      return NextResponse.json({
        success: true,
        publicUrl: primaryUrl,
        usedFallbackThumbnail: false,
      });
    }

    let rawBuffer = primaryUrl ? await fetchValidImageBuffer(primaryUrl, referer) : null;
    let usedFallbackThumbnail = false;

    if (!rawBuffer && fallbackThumbUrl && fallbackThumbUrl !== primaryUrl) {
      rawBuffer = await fetchValidImageBuffer(fallbackThumbUrl);
      if (rawBuffer) usedFallbackThumbnail = true;
    }

    if (!rawBuffer) {
      return NextResponse.json(
        {
          error:
            "Source site blocked hotlinking/download (common on Instagram/Facebook) and no cached thumbnail could be fetched.",
        },
        { status: 422 }
      );
    }

    const webpBuffer = await sharp(rawBuffer)
      .rotate()
      .resize({ width: 1080, withoutEnlargement: true })
      .webp({ quality: 84 })
      .toBuffer();

    const hash = crypto
      .createHash("sha256")
      .update(usedFallbackThumbnail ? fallbackThumbUrl : primaryUrl)
      .digest("hex")
      .slice(0, 24);
    const storagePath = `web-ingest/${hash}.webp`;

    const supabase = auth.adminClient;
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin client not configured." },
        { status: 500 }
      );
    }

    const { error: uploadErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, webpBuffer, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true,
      });

    if (uploadErr) {
      return NextResponse.json(
        { error: `Supabase Storage upload failed: ${uploadErr.message}` },
        { status: 502 }
      );
    }

    const publicUrl = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath).data.publicUrl;

    return NextResponse.json({
      success: true,
      publicUrl,
      usedFallbackThumbnail,
    });
  } catch (err: any) {
    console.error("[ingest-external-image] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to ingest external image" },
      { status: 500 }
    );
  }
}
