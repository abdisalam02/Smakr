import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import sharp from "sharp";
import { requireAdmin } from "@/app/api/admin/_auth";
import { isDeliveryAppImageUrl } from "@/lib/admin/imageSource";
import { fetchSafeRemoteImage } from "@/lib/admin/safeRemoteImage";

export const runtime = "nodejs";

const STORAGE_BUCKET = "dish-photos";

async function fetchValidImageBuffer(url: string, referer?: string): Promise<Buffer | null> {
  const remote = await fetchSafeRemoteImage(url, { referer });
  if (!remote || remote.buffer.length < 512) return null;
  try {
    const meta = await sharp(remote.buffer).metadata();
    if (!meta.width || !meta.height) return null;
    return remote.buffer;
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
