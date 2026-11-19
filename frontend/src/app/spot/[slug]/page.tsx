import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomeView, type HomeInitialData } from "@/components/home/HomeView";
import {
  fetchActiveWeeklyDropServer,
  fetchFoodPostsServer,
  fetchVenuesServer,
} from "@/lib/supabase/serverData";
import { slugifyVenue } from "@/lib/slugify";
import { isPopupVenue, resolvePopupLifecycle } from "@/lib/popupUtils";
import { formatOsloLocation } from "@/lib/location";

export const dynamic = "force-dynamic";

function resolveVenueBySlug(
  venues: HomeInitialData["venues"],
  foodPosts: HomeInitialData["foodPosts"],
  slug: string
) {
  const normalized = slugifyVenue(slug);
  const byVenue = venues.find(
    (v) =>
      v.id === slug ||
      v.id.toLowerCase() === slug.toLowerCase() ||
      slugifyVenue(v.name) === normalized
  );
  if (byVenue) return byVenue;

  const byPost = foodPosts.find(
    (p) =>
      p.spot_id === slug ||
      p.id === slug ||
      slugifyVenue(p.spot_name || "") === normalized
  );
  return byPost ? venues.find((v) => v.id === byPost.spot_id) ?? null : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [venues, foodPosts] = await Promise.all([
    fetchVenuesServer(),
    fetchFoodPostsServer(),
  ]);

  const venue = resolveVenueBySlug(venues, foodPosts, slug);
  if (!venue) {
    return {
      title: "Spot Not Found — Oslo · Smakr",
    };
  }

  const heroPost = foodPosts.find(
    (p) => p.spot_id === venue.id && !p.is_archived && p.is_published !== false
  );
  const locationInfo = formatOsloLocation(venue.address, venue.city);
  const neighborhood =
    locationInfo.neighborhood || venue.neighborhood || "Oslo";
  const canonicalSlug = slugifyVenue(venue.name) || slug;
  const lifecycle = isPopupVenue(venue) ? resolvePopupLifecycle(venue) : null;

  const descParts: string[] = [];
  if (heroPost?.dish_name) {
    descParts.push(
      heroPost.price_nok
        ? `${heroPost.dish_name} (${heroPost.price_nok} kr)`
        : heroPost.dish_name
    );
  }
  descParts.push(`${neighborhood}, Oslo`);
  if (lifecycle && lifecycle.state !== "tba" && lifecycle.shortDateLabel) {
    descParts.push(lifecycle.shortDateLabel);
  }
  const description = `${descParts.join(" · ")} — Live food radar on Smakr.`;
  const title = `${venue.name} — Oslo · Smakr`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://smakr.no/spot/${canonicalSlug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://smakr.no/spot/${canonicalSlug}`,
      siteName: "Smakr",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function SpotSharePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [venues, foodPosts, weeklyPick] = await Promise.all([
    fetchVenuesServer(),
    fetchFoodPostsServer(),
    fetchActiveWeeklyDropServer(),
  ]);

  const venue = resolveVenueBySlug(venues, foodPosts, slug);
  if (!venue) {
    notFound();
  }

  const initialData: HomeInitialData = { venues, foodPosts, weeklyPick };

  return (
    <HomeView
      initialData={initialData}
      bypassBoot={true}
      initialSpotSlug={venue.id}
    />
  );
}
