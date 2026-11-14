import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { requireAdmin } from "@/app/api/admin/_auth";

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV !== "development") {
      const auth = await requireAdmin();
      if (!auth.ok) {
        return NextResponse.json(
          { error: "Forbidden. Admin access required." },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { name, svg } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Missing icon name" }, { status: 400 });
    }
    if (!svg || typeof svg !== "string") {
      return NextResponse.json({ error: "Missing SVG content" }, { status: 400 });
    }

    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const publicFoodDir = path.resolve(process.cwd(), "public/icons/food");
    if (!fs.existsSync(publicFoodDir)) {
      fs.mkdirSync(publicFoodDir, { recursive: true });
    }

    // High supersampling rasterization with trim and 16px transparent safety margin
    const svgBuffer = Buffer.from(svg);
    const trimmed = await sharp(svgBuffer, { density: 300 }).trim().toBuffer();
    const webpBuffer = await sharp(trimmed)
      .resize(160, 160, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .extend({
        top: 16,
        bottom: 16,
        left: 16,
        right: 16,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 92, effort: 6 })
      .toBuffer();

    const targetPath = path.join(publicFoodDir, `${cleanName}.webp`);
    fs.writeFileSync(targetPath, webpBuffer);

    // Keep k_chicken and fried_chicken in sync if either is baked
    if (cleanName === "k_chicken") {
      fs.writeFileSync(path.join(publicFoodDir, "fried_chicken.webp"), webpBuffer);
    } else if (cleanName === "fried_chicken") {
      fs.writeFileSync(path.join(publicFoodDir, "k_chicken.webp"), webpBuffer);
    }

    return NextResponse.json({
      success: true,
      file: `/icons/food/${cleanName}.webp`,
      size: webpBuffer.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Failed to save studio icon:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
