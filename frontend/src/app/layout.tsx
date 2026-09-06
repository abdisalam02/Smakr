import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/ui/Header";
import { QuickCheckInModal } from "@/components/checkin/QuickCheckInModal";
import { SpeedTestWidget } from "@/components/checkin/SpeedTestWidget";

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
    <html lang="en">
      <body className="bg-[#f6f3ee] text-[#221e19] min-h-screen flex flex-col antialiased selection:bg-[#b85434] selection:text-white">
        <Header />
        <main className="flex-1 flex flex-col relative overflow-hidden bg-[#f6f3ee]">
          {children}
        </main>
        <QuickCheckInModal />
        <SpeedTestWidget />
      </body>
    </html>
  );
}
