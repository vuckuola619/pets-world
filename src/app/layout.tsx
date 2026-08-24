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
    "Discover 186+ wildlife species across 9 continents. Explore conservation status, habitats, and fun facts on an interactive global map.",
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
      "Interactive map exploring 186+ species with conservation data, habitats, and taxonomy.",
    type: "website",
  },
};

/** Inline script to apply theme before first paint to prevent flash */
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('wildlife-theme') || 'light';
    var d = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (d) document.documentElement.classList.add('dark');
  } catch(e) {}
})();
`;

/** Root layout with Inter + Outfit fonts, theme anti-flash, and service worker */
export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactNode {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a3a2a" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="h-full overflow-hidden bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
