import { NextRequest, NextResponse } from "next/server";
import { ingestGooglePhotoToSupabase } from "@/lib/storage/ingestGooglePhoto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const refOrUrl = typeof body?.refOrUrl === "string" ? body.refOrUrl.trim() : "";

    if (!refOrUrl) {
      return NextResponse.json(
        { success: false, error: "Missing required parameter 'refOrUrl'" },
        { status: 400 }
      );
    }

    const publicUrl = await ingestGooglePhotoToSupabase(refOrUrl);

    return NextResponse.json({
      success: true,
      publicUrl,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Ingestion failed" },
      { status: 500 }
    );
  }
}
