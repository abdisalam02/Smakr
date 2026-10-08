import { HomeView, type HomeInitialData } from "@/components/home/HomeView";
import {
  fetchActiveWeeklyDropServer,
  fetchFoodPostsServer,
  fetchVenuesServer,
} from "@/lib/supabase/serverData";

/**
 * Server entry point for the feed.
 *
 * All initial records are fetched in parallel on the server and streamed to the
 * client, so the first paint already contains the dish feed, map pins and the
 * weekly drop — there is no client-side data waterfall and no skeleton delay.
 *
 * `force-dynamic` keeps the (public CMS) reads uncached so admin edits are
 * reflected on the next request.
 */
export const dynamic = "force-dynamic";

export default async function PulseFoodRadarPage() {
  const [venues, foodPosts, weeklyPick] = await Promise.all([
    fetchVenuesServer(),
    fetchFoodPostsServer(),
    fetchActiveWeeklyDropServer(),
  ]);

  const initialData: HomeInitialData = { venues, foodPosts, weeklyPick };

  return <HomeView initialData={initialData} />;
}
