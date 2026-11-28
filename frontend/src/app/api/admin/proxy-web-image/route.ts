import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_auth";
import { isDeliveryAppImageUrl } from "@/lib/admin/imageSource";
import { fetchSafeRemoteImage } from "@/lib/admin/safeRemoteImage";

export const runtime = "nodejs";

/**
 * Admin-only same-origin preview proxy so Seeding Lab thumbnails from arbitrary
 * restaurant/review domains render cleanly under the app's strict `img-src` CSP
 * without whitelisting wildcard external image hosts.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const url = (req.nextUrl.searchParams.get("url") || "").trim();
  const fallback = (req.nextUrl.searchParams.get("fallback") || "").trim();
  const referer = (req.nextUrl.searchParams.get("referer") || "").trim();

  if (!url && !fallback) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  if (
    isDeliveryAppImageUrl(url) ||
    isDeliveryAppImageUrl(fallback) ||
    isDeliveryAppImageUrl(referer)
  ) {
    return NextResponse.json({ error: "Delivery app image blocked." }, { status: 403 });
  }

  let result = url ? await fetchSafeRemoteImage(url, { referer }) : null;
  if (!result && fallback && fallback !== url) {
    result = await fetchSafeRemoteImage(fallback, { referer });
  }

  if (!result) {
    return NextResponse.json({ error: "Image could not be fetched." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
