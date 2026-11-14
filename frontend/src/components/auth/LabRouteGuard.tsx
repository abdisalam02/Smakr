import { redirect } from "next/navigation";
import { fetchCurrentUserServer } from "@/lib/supabase/serverData";

/**
 * Server-side gate for internal lab & studio routes.
 * Renders freely in local development; in production only admins may enter.
 */
export async function LabRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NODE_ENV !== "development") {
    const user = await fetchCurrentUserServer();
    if (!user || user.role !== "admin") {
      redirect("/");
    }
  }
  return <>{children}</>;
}
