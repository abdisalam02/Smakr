import localFont from "next/font/local";
import { Anton } from "next/font/google";

export const comico = localFont({
  src: "../fonts/Comico-Regular.otf",
  variable: "--font-comico",
  display: "swap",
  preload: true,
});

export const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});
