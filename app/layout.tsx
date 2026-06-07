import type { Metadata } from "next";
import { Libre_Baskerville, Source_Sans_3, IBM_Plex_Mono } from "next/font/google";
import "@arcgis/core/assets/esri/themes/light/main.css";
import "./globals.css";

const headline = Libre_Baskerville({
  variable: "--font-headline",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

const body = Source_Sans_3({
  variable: "--font-body",
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Same Data, Your Design — ArcGIS Live Re-Styling",
  description:
    "A demonstration that the ArcGIS Maps SDK for JavaScript can completely re-style any existing AGOL map in the browser, read-only, without ever modifying the source.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${headline.variable} ${body.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
