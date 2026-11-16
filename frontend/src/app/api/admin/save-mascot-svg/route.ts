import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { requireAdmin } from "@/app/api/admin/_auth";

export async function POST(req: Request) {
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
    const { svg } = body;

    if (typeof svg !== "string" || svg.trim().length < 200 || !svg.includes("<svg")) {
      return NextResponse.json(
        { error: "Missing or invalid SVG markup." },
        { status: 400 }
      );
    }

    const normalized = svg.trim().startsWith("<?xml")
      ? svg.trim()
      : `<?xml version="1.0" encoding="UTF-8"?>\n${svg.trim()}`;

    const targetPath = path.join(process.cwd(), "public", "mascot", "smakr-pick-pointing.svg");
    await fs.writeFile(targetPath, normalized, "utf8");

    return NextResponse.json({
      success: true,
      path: "/mascot/smakr-pick-pointing.svg",
      bytes: Buffer.byteLength(normalized, "utf8"),
    });
  } catch (err) {
    console.error("Failed to sync official mascot SVG:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
