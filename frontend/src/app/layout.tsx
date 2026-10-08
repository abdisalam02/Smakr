import type { Metadata } from "next";
import "./globals.css";
import { comico } from "@/lib/fonts";
import { Header } from "@/components/ui/Header";
import { QuickCheckInModal } from "@/components/checkin/QuickCheckInModal";
import { SpeedTestWidget } from "@/components/checkin/SpeedTestWidget";
import { ThemeStudioModal } from "@/components/ui/ThemeStudioModal";
import { MascotConfigHydrator } from "@/components/avatar/MascotConfigHydrator";
import { AppStateHydrator } from "@/components/state/AppStateHydrator";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { UserOnboardingModal } from "@/components/auth/UserOnboardingModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { CreateFoodPostModal } from "@/components/food/CreateFoodPostModal";
import { ToastBanner } from "@/components/ui/ToastBanner";

export const metadata: Metadata = {
  metadataBase: new URL("https://smakr.vercel.app"),
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${comico.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m={'electric-orange':'oat-espresso','oslo-minimalist':'oat-espresso','obsidian-slate':'late-night','cyber-midnight':'late-night','midnight-gastro':'late-night','smoked-espresso':'late-night','nordic-linen':'warm-bakery','nordic-bakery':'warm-bakery','nordic-amber':'warm-bakery','copenhagen-clay':'warm-bakery','alabaster-bronze':'warm-bakery','retro-diner':'warm-bakery','bordeaux-chalk':'warm-bakery','seoul-sunset':'warm-bakery','swiss-monolith':'nordic-minimal','oslo-brutalist':'nordic-minimal','oslo-monolith':'nordic-minimal','stockholm-sage':'nordic-minimal','kyoto-matcha':'nordic-minimal','matcha-botanic':'nordic-minimal','bistro-navy':'nordic-minimal','amalfi-coast':'nordic-minimal'};var t=localStorage.getItem('smakr_theme')||'oat-espresso';t=m[t]||t;var v={'oat-espresso':1,'warm-bakery':1,'late-night':1,'nordic-minimal':1};if(!v[t])t='oat-espresso';document.documentElement.setAttribute('data-theme',t);var f=localStorage.getItem('smakr_font')||'modern-sans';document.documentElement.setAttribute('data-font',f);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased selection:bg-[var(--accent)] selection:text-white transition-colors duration-300">
        <AuthProvider>
          <Header />
          <main className="flex-1 flex flex-col relative overflow-hidden">
            {children}
          </main>
          <QuickCheckInModal />
          <SpeedTestWidget />
          <ThemeStudioModal />
          <MascotConfigHydrator />
          <AppStateHydrator />
          <UserOnboardingModal />
          <AuthModal />
          <CreateFoodPostModal />
          <ToastBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
