import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Simple in-memory rate limiting: 10 uploads per 10 mins per IP
// Note: In distributed serverless environments, this protects per-instance; for cluster-wide limits use Redis.
const uploadRateMap = new Map<string, { count: number; expiresAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const now = Date.now();
    const rateData = uploadRateMap.get(ip);
    if (rateData && rateData.expiresAt > now) {
      if (rateData.count >= 10) {
        return NextResponse.json(
          { success: false, error: "Too many uploads. Please wait a few minutes." },
          { status: 429 }
        );
      }
      rateData.count++;
    } else {
      uploadRateMap.set(ip, { count: 1, expiresAt: now + 10 * 60 * 1000 });
    }

    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Storage backend not configured." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: "Missing file in upload payload." },
        { status: 400 }
      );
    }

    // Size limit: 4MB
    const MAX_SIZE = 4 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "Photo must be under 4MB." },
        { status: 400 }
      );
    }

    // MIME type check
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Only JPG, PNG, and WebP images are allowed." },
        { status: 400 }
      );
    }

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const randomHex = crypto.randomBytes(12).toString("hex");
    const filePath = `partner-uploads/partner_${Date.now()}_${randomHex}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Verify magic bytes to block masqueraded binary files
    const isJpeg = buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isWebp = buffer.length > 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
    const isAvif = buffer.length > 12 && buffer.toString("ascii", 4, 8) === "ftyp" && (buffer.toString("ascii", 8, 12) === "avif" || buffer.toString("ascii", 8, 12) === "avis");

    if (!isJpeg && !isPng && !isWebp && !isAvif) {
      return NextResponse.json(
        { success: false, error: "Invalid image file. Binary signature does not match a valid photo." },
        { status: 400 }
      );
    }

    const { error: uploadError } = await supabase.storage
      .from("dish-photos")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { success: false, error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: publicData } = supabase.storage
      .from("dish-photos")
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicData.publicUrl,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Upload error" },
      { status: 500 }
    );
  }
}
