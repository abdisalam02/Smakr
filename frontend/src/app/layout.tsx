import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";
import { comico } from "@/lib/fonts";
import { Header } from "@/components/ui/Header";
import { MascotConfigHydrator } from "@/components/avatar/MascotConfigHydrator";
import { AppStateHydrator } from "@/components/state/AppStateHydrator";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { fetchCurrentUserServer } from "@/lib/supabase/serverData";
import { GlobalModalsHost } from "@/components/ui/GlobalModalsHost";
import { ToastBanner } from "@/components/ui/ToastBanner";
import { PostHogProvider } from "@/components/PostHogProvider";

// The root layout reads the auth session (cookies) to SSR the header, so every
// route is rendered on demand — declare it explicitly to avoid static-generation
// `DYNAMIC_SERVER_USAGE` warnings.
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://smakr.no"),
  title: "Smakr — Oslo Food Discovery & Live Foodie Radar",
  description:
    "Discover trending meals, authentic Vietnamese coconut coffee, cardamom buns, artisan ramen, and real-time food spots across Oslo.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Smakr — Oslo Food Discovery & Live Foodie Radar",
    description:
      "Discover viral coconut coffee, sourdough cardamom buns, and artisan street food spots across Oslo.",
    siteName: "Smakr",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smakr — Oslo Food Discovery & Live Foodie Radar",
    description:
      "Discover viral coconut coffee, sourdough cardamom buns, and artisan street food spots across Oslo.",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read the session server-side so the very first painted frame already knows
  // the signed-in user (no logged-out flash on hard refresh).
  const initialUser = await fetchCurrentUserServer();
  return (
    <html
      lang="en"
      data-theme="oat-espresso"
      className={`${comico.variable} ${plusJakarta.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://api.maptiler.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.maptiler.com" />
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link
            rel="preconnect"
            href={process.env.NEXT_PUBLIC_SUPABASE_URL}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className="min-h-dvh flex flex-col antialiased selection:bg-[var(--accent)] selection:text-white transition-colors duration-300">
        <PostHogProvider>
          <AuthProvider initialUser={initialUser}>
            <Header initialUser={initialUser} />
            <main className="flex-1 flex flex-col relative overflow-x-hidden w-full max-w-[100vw]">
              {children}
            </main>
            <MascotConfigHydrator />
            <AppStateHydrator />
            <GlobalModalsHost />
            <ToastBanner />
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
