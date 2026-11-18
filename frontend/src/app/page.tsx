import { HomeView, type HomeInitialData } from "@/components/home/HomeView";
import {
  fetchActiveWeeklyDropServer,
  fetchFoodPostsServer,
  fetchVenuesServer,
} from "@/lib/supabase/serverData";

/**
 * Server entry point for the feed.
 *
 * All initial records are fetched in parallel via `unstable_cache` (60s TTL +
 * tag invalidation from admin routes), so SSR resolves in <50ms warm while
 * the first paint already contains venues, dishes, and the weekly drop.
 */
export const dynamic = "force-dynamic";

export default async function PulseFoodRadarPage({
  searchParams,
}: {
  searchParams?: Promise<{ spot?: string; boot?: string }>;
}) {
  const [venues, foodPosts, weeklyPick, sp] = await Promise.all([
    fetchVenuesServer(),
    fetchFoodPostsServer(),
    fetchActiveWeeklyDropServer(),
    searchParams ?? Promise.resolve({} as { spot?: string; boot?: string }),
  ]);

  const initialData: HomeInitialData = { venues, foodPosts, weeklyPick };
  const bypassBoot = Boolean(sp?.spot) || sp?.boot === "0";

  return <HomeView initialData={initialData} bypassBoot={bypassBoot} />;
}
