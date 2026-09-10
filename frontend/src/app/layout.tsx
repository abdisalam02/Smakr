import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/ui/Header";
import { QuickCheckInModal } from "@/components/checkin/QuickCheckInModal";
import { SpeedTestWidget } from "@/components/checkin/SpeedTestWidget";
import { ThemeStudioModal, ThemeStudioTrigger } from "@/components/ui/ThemeStudioModal";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('smakr_theme')||'oslo-minimalist';if(t==='electric-orange')t='oslo-minimalist';if(t==='cyber-midnight'||t==='midnight-gastro')t='obsidian-slate';if(t==='nordic-bakery'||t==='nordic-amber')t='nordic-linen';if(t==='kyoto-matcha'||t==='matcha-botanic')t='stockholm-sage';if(t==='amalfi-coast')t='bistro-navy';if(t==='seoul-sunset')t='bordeaux-chalk';if(t==='oslo-brutalist'||t==='oslo-monolith')t='swiss-monolith';if(t==='retro-diner')t='alabaster-bronze';document.documentElement.setAttribute('data-theme',t);var f=localStorage.getItem('smakr_font')||'modern-sans';document.documentElement.setAttribute('data-font',f);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased selection:bg-[var(--accent)] selection:text-white transition-colors duration-300">
        <Header />
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {children}
        </main>
        <QuickCheckInModal />
        <SpeedTestWidget />
        <ThemeStudioTrigger />
        <ThemeStudioModal />
      </body>
    </html>
  );
}
