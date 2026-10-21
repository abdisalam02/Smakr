import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every request and guards `/admin`.
 *
 * `@supabase/ssr` stores the session in cookies. Refreshing here (as Supabase
 * recommends) keeps that cookie fresh and lets server code read the signed-in
 * user, so testers aren't bounced back to the sign-in screen on reloads or
 * after the ~1h access token lapses on a long-lived tab.
 *
 * - `getUser()` is used (not `getSession()`) so the JWT is validated against
 *   Supabase Auth before we trust it.
 * - Cookies are read from `request` and written to the fresh `response`.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Performance bypass: Public API endpoints never need SSR session refreshes
  if (
    pathname.startsWith("/api/places") ||
    pathname.startsWith("/api/kitchen") ||
    pathname.startsWith("/api/partner") ||
    pathname.startsWith("/api/ai")
  ) {
    return NextResponse.next();
  }

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

  // IMPORTANT: this call is what refreshes / rotates the session cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute =
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/studio") ||
    request.nextUrl.pathname.startsWith("/ad-reel") ||
    request.nextUrl.pathname.startsWith("/mascot-studio");

  if (isAdminRoute && !user) {
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
