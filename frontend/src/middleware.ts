import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every request and guards `/admin`.
 *
 * - `getUser()` is used (not `getSession()`) so the JWT is validated against
 *   Supabase Auth before we trust it.
 * - Cookies are read from `request` and written to the fresh `response`.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function middleware(request: NextRequest) {
  // The Supabase `getUser()` round-trip below is only needed to guard /admin.
  // Every other route is public, and the browser client refreshes its own
  // session cookies — so we skip the network call entirely (removing a Supabase
  // Auth round-trip from the critical path of every feed page load).
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  if (!isAdminRoute) return NextResponse.next({ request });

  // Supabase not configured yet (beta fallback) — let requests through.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Mirror onto the request so downstream reads see the refreshed token…
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        // …and rebuild the response so the browser receives the new cookies.
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The client-only "Beta Dev Access" bypass can't produce a server session, so
  // outside production we defer /admin protection to the client-side role gate.
  const devBypassAllowed = process.env.NODE_ENV !== "production";

  if (!user && !devBypassAllowed) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("auth", "required");
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
