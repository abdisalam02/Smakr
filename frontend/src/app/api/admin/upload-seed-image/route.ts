import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const STORAGE_BUCKET = "dish-photos";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getAdminClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function slugify(val: string): string {
  return val
    .toLowerCase()
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/æ/g, "ae")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

function getLocalUploadDir(): string {
  const p1 = path.join(process.cwd(), "public", "uploads", "seeds");
  if (fs.existsSync(path.join(process.cwd(), "public"))) return p1;
  const p2 = path.join(process.cwd(), "frontend", "public", "uploads", "seeds");
  return p2;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const spotId = (formData.get("spotId") as string) || "seed";
    const dishId = (formData.get("dishId") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No image file provided in form-data." }, { status: 400 });
    }

    const mimeType = file.type || "";
    const validMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/heic",
      "image/heif",
    ];

    if (mimeType && !validMimes.includes(mimeType.toLowerCase())) {
      return NextResponse.json(
        { error: `Unsupported image format: ${mimeType}. Please upload JPEG, PNG, WebP, or AVIF.` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const rawBuffer = Buffer.from(arrayBuffer);

    // Process buffer with Sharp: auto-orient, max 1080px width, WebP quality 84
    const webpBuffer = await sharp(rawBuffer)
      .rotate()
      .resize({ width: 1080, withoutEnlargement: true })
      .webp({ quality: 84 })
      .toBuffer();

    const cleanSpotId = slugify(spotId) || "spot";
    const cleanDishId = dishId ? `_${slugify(dishId)}` : "";
    const uniqueSuffix = crypto.randomBytes(4).toString("hex");
    const filename = `${cleanSpotId}${cleanDishId}_${Date.now()}_${uniqueSuffix}.webp`;
    const storageKey = `uploads/${filename}`;

    // 1. Try uploading to Supabase Storage bucket dish-photos
    let supabaseCdnUrl: string | null = null;
    const supabase = getAdminClient();

    if (supabase) {
      try {
        const { error: uploadErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(storageKey, webpBuffer, {
            contentType: "image/webp",
            upsert: true,
          });

        if (!uploadErr) {
          const { data: pubData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(storageKey);
          if (pubData?.publicUrl) {
            supabaseCdnUrl = pubData.publicUrl;
          }
        } else {
          console.warn("[upload-seed-image] Supabase Storage upload error:", uploadErr.message);
        }
      } catch (sErr: any) {
        console.warn("[upload-seed-image] Supabase Storage exception:", sErr.message);
      }
    }

    // 2. Local Fallback Guard: always save copy locally to frontend/public/uploads/seeds/
    const localDir = getLocalUploadDir();
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const localFilePath = path.join(localDir, filename);
    fs.writeFileSync(localFilePath, webpBuffer);
    const localPublicUrl = `/uploads/seeds/${filename}`;

    // Prefer Supabase CDN URL if available; otherwise use reliable local public path
    const finalUrl = supabaseCdnUrl || localPublicUrl;

    return NextResponse.json({
      success: true,
      url: finalUrl,
      supabaseUrl: supabaseCdnUrl,
      localUrl: localPublicUrl,
      isSupabase: Boolean(supabaseCdnUrl),
      filename,
      sizeBytes: webpBuffer.length,
    });
  } catch (err: any) {
    console.error("[upload-seed-image] Internal error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process image upload." },
      { status: 500 }
    );
  }
}
