import { ImageResponse } from "next/og";
import {
  fetchFoodPostsServer,
  fetchVenuesServer,
} from "@/lib/supabase/serverData";
import { slugifyVenue } from "@/lib/slugify";
import { isPopupVenue, resolvePopupLifecycle } from "@/lib/popupUtils";
import { formatOsloLocation } from "@/lib/location";

export const runtime = "nodejs";
export const alt = "Smakr Oslo Spot Share Card";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function SpotOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [venues, foodPosts] = await Promise.all([
    fetchVenuesServer(),
    fetchFoodPostsServer(),
  ]);

  const normalized = slugifyVenue(slug);
  const venue =
    venues.find(
      (v) =>
        v.id === slug ||
        v.id.toLowerCase() === slug.toLowerCase() ||
        slugifyVenue(v.name) === normalized
    ) ?? null;

  const heroPost = venue
    ? foodPosts.find(
        (p) => p.spot_id === venue.id && !p.is_archived && p.is_published !== false
      ) ?? null
    : null;

  const venueName = venue?.name || "Smakr Oslo";
  const dishName = heroPost?.dish_name || venue?.signature_dishes?.[0] || "Oslo Food Discovery";
  const priceLabel =
    heroPost?.price_nok && heroPost.price_nok > 0 ? `${heroPost.price_nok} kr` : null;
  const isPopup = venue ? isPopupVenue(venue) : false;
  const lifecycle = venue && isPopup ? resolvePopupLifecycle(venue) : null;
  const loc = formatOsloLocation(venue?.address, venue?.city);
  const neighborhood = loc.neighborhood || "Oslo";

  const rawImg = heroPost?.image_url || venue?.cover_image_url || "";
  const absoluteImg =
    rawImg.startsWith("http://") || rawImg.startsWith("https://") ? rawImg : null;

  const badgeText = isPopup
    ? lifecycle?.shortDateLabel || "Oslo Pop-Up"
    : priceLabel || "Oslo Radar";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#FAF7F2",
          color: "#181615",
          padding: "44px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Left Editorial Details */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            paddingRight: "36px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span
              style={{
                fontSize: "26px",
                fontWeight: 900,
                letterSpacing: "0.06em",
                color: "#E84A27",
              }}
            >
              SMAKR · OSLO
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span
                style={{
                  backgroundColor: "#E84A27",
                  color: "#FAF7F2",
                  fontSize: "22px",
                  fontWeight: 800,
                  padding: "8px 20px",
                  borderRadius: "999px",
                }}
              >
                {badgeText}
              </span>
              {isPopup && priceLabel && (
                <span
                  style={{
                    backgroundColor: "#181615",
                    color: "#FAF7F2",
                    fontSize: "22px",
                    fontWeight: 800,
                    padding: "8px 20px",
                    borderRadius: "999px",
                  }}
                >
                  {priceLabel}
                </span>
              )}
            </div>

            <div
              style={{
                fontSize: "58px",
                fontWeight: 900,
                lineHeight: 1.04,
                color: "#181615",
                letterSpacing: "-0.03em",
              }}
            >
              {venueName}
            </div>

            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#574E49",
                lineHeight: 1.25,
              }}
            >
              {dishName}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "2px solid rgba(24,22,21,0.12)",
              paddingTop: "20px",
              fontSize: "24px",
              fontWeight: 700,
              color: "#181615",
            }}
          >
            <span>{neighborhood}, Oslo</span>
            <span style={{ color: "#E84A27" }}>smakr.no</span>
          </div>
        </div>

        {/* Right Hero Photo Frame */}
        <div
          style={{
            width: "470px",
            height: "100%",
            borderRadius: "32px",
            overflow: "hidden",
            backgroundColor: "#EDE6DA",
            border: "2px solid rgba(24,22,21,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {absoluteImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={absoluteImg}
              alt={venueName}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <span style={{ fontSize: "48px", fontWeight: 900, color: "#E84A27" }}>
              SMAKR
            </span>
          )}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
