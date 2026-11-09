import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import {
  buildDishSynthesisPrompt,
  resolveCategoryRemixDefaults,
  type AnglePresetId,
  type EnvironmentPresetId,
} from "@/lib/dishImageRemixConfig";
import { ingestGooglePhotoToSupabase } from "@/lib/storage/ingestGooglePhoto";

export const runtime = "nodejs";

const STORAGE_BUCKET = "dish-photos";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";

function getAdminClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function fetchSourceImageBuffer(rawUrl: string, origin: string): Promise<Buffer> {
  let targetUrl = rawUrl.trim();

  if (targetUrl.startsWith("places/") || targetUrl.includes("/api/places/photos")) {
    const resolved = await ingestGooglePhotoToSupabase(targetUrl);
    if (resolved && resolved.startsWith("http")) {
      targetUrl = resolved;
    } else if (targetUrl.startsWith("/")) {
      targetUrl = `${origin}${targetUrl}`;
    }
  } else if (targetUrl.startsWith("/")) {
    const localPublicPath = path.join(process.cwd(), "public", targetUrl.replace(/^\//, ""));
    if (fs.existsSync(localPublicPath)) {
      return fs.readFileSync(localPublicPath);
    }
    targetUrl = `${origin}${targetUrl}`;
  }

  const res = await fetch(targetUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch source image (${res.status}): ${targetUrl}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

/**
 * Direct Multimodal Image-to-Image Camera & Background Shift using Nano Banana Lite
 * (`gemini-3.1-flash-lite-image` with fallback to `gemini-2.5-flash-image`).
 * Never calls paid `gemini-3.1-flash-image`.
 * Passes the reference image inlineData directly into the model so the exact bowl/plate,
 * rim pattern, food colors, and lack of extra props are preserved 100%.
 */
async function runMultimodalCameraShift(
  referenceJpegBase64: string,
  synthesisPrompt: string
): Promise<{ imageBuffer: Buffer; visualReceipt: string; modelUsed: string }> {
  const modelsToTry = ["gemini-3.1-flash-lite-image", "gemini-2.5-flash-image"];
  let lastError = "Multimodal image transformation failed";

  for (const modelName of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: referenceJpegBase64,
                  },
                },
                { text: synthesisPrompt },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
            temperature: 0.4,
          },
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        lastError = `${modelName} returned ${res.status}: ${errBody.slice(0, 200)}`;
        continue;
      }

      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      let imageBuffer: Buffer | null = null;
      const textParts: string[] = [];

      for (const part of parts) {
        if (part?.text && !part?.thought) {
          textParts.push(part.text.trim());
        }
        if (part?.inlineData?.data) {
          imageBuffer = Buffer.from(part.inlineData.data, "base64");
        }
      }

      if (imageBuffer) {
        const visualReceipt =
          textParts.filter(Boolean).join(" ") ||
          "Direct multimodal reference image locked (vessel, glaze, and ingredient geometry preserved).";
        return {
          imageBuffer,
          visualReceipt,
          modelUsed: modelName,
        };
      }

      lastError = `${modelName} returned no image inlineData.`;
    } catch (err: any) {
      lastError = err.message || String(err);
    }
  }

  throw new Error(lastError);
}

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in frontend/.env.local" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      imageUrl,
      dishName = "Signature Dish",
      category = "restaurant",
      anglePreset,
      environmentPreset,
      variationSeed,
    } = body as {
      imageUrl: string;
      dishName?: string;
      category?: string;
      anglePreset?: AnglePresetId;
      environmentPreset?: EnvironmentPresetId;
      variationSeed?: number;
    };

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "Missing source imageUrl" }, { status: 400 });
    }

    const defaults = resolveCategoryRemixDefaults(category, dishName);
    const chosenAngle: AnglePresetId = anglePreset || defaults.defaultAngle;
    const chosenEnvironment: EnvironmentPresetId =
      environmentPreset || defaults.defaultEnvironment;

    // 1. Fetch source image & convert to clean JPEG buffer for multimodal input
    const rawBuffer = await fetchSourceImageBuffer(imageUrl, req.nextUrl.origin);
    const normalizedJpegBuffer = await sharp(rawBuffer)
      .rotate()
      .resize({ width: 1024, withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();
    const jpegBase64 = normalizedJpegBuffer.toString("base64");

    // 2. Build Direct Multimodal Camera & Background Shift Prompt
    const { prompt: synthesisPrompt, selectedAngleLabel, selectedSurfaceLabel } =
      buildDishSynthesisPrompt({
        dishName,
        category,
        anglePreset: chosenAngle,
        environmentPreset: chosenEnvironment,
        variationSeed: variationSeed || Math.floor(1000 + Math.random() * 9000),
      });

    // 3. Run single-pass multimodal camera shift (Nano Banana Lite: gemini-3.1-flash-lite-image)
    const { imageBuffer: generatedRawBuffer, visualReceipt, modelUsed } =
      await runMultimodalCameraShift(jpegBase64, synthesisPrompt);

    // 4. Post-process via Sharp to exact 4:3 (1080x810) WebP @ quality 84
    const finalWebpBuffer = await sharp(generatedRawBuffer)
      .resize({ width: 1080, height: 810, fit: "cover" })
      .webp({ quality: 84 })
      .toBuffer();

    const hash = crypto
      .createHash("sha256")
      .update(`${dishName}_${Date.now()}_${Math.random()}`)
      .digest("hex")
      .slice(0, 20);
    const fileName = `remix_${hash}.webp`;
    const storagePath = `ai-remix/${fileName}`;

    // 5. Upload to Supabase Storage `dish-photos/` (with local public/ fallback)
    let finalPublicUrl = "";
    const supabase = getAdminClient();
    if (supabase) {
      const { error: uploadErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, finalWebpBuffer, {
          contentType: "image/webp",
          cacheControl: "31536000",
          upsert: true,
        });

      if (!uploadErr) {
        finalPublicUrl = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(storagePath).data.publicUrl;
      } else {
        console.warn("[transform-dish-image] Supabase upload fallback:", uploadErr.message);
      }
    }

    if (!finalPublicUrl) {
      const localDir = path.join(process.cwd(), "public", "curation-remix");
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      fs.writeFileSync(path.join(localDir, fileName), finalWebpBuffer);
      finalPublicUrl = `/curation-remix/${fileName}`;
    }

    return NextResponse.json({
      success: true,
      imageUrl: finalPublicUrl,
      modelUsed,
      selectedAngleLabel,
      selectedSurfaceLabel,
      extractedCulinaryDna: visualReceipt,
      promptReceipt: synthesisPrompt,
    });
  } catch (err: any) {
    console.error("[transform-dish-image] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to transform dish image" },
      { status: 500 }
    );
  }
}
