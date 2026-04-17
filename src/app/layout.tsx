import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistrar from "../components/ServiceWorkerRegistrar";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "World Wildlife Atlas — Interactive Species Explorer",
  description:
    "Discover 184+ wildlife species across 9 continents. Explore conservation status, habitats, and fun facts on an interactive global map.",
  keywords: [
    "wildlife",
    "animals",
    "conservation",
    "IUCN",
    "interactive map",
    "species explorer",
    "education",
  ],
  openGraph: {
    title: "World Wildlife Atlas",
    description:
      "Interactive map exploring 184+ species with conservation data, habitats, and taxonomy.",
    type: "website",
  },
};

/** Root layout with Inter + Outfit fonts and service worker */
export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactNode {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} h-full antialiased`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a3a2a" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="h-full overflow-hidden bg-background text-foreground">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
