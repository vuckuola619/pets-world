/** Shared region/continent color map used across Sidebar, MapView, MobileDetailPanel, etc. */
export const CONTINENT_COLORS: Record<string, string> = {
  "North America": "#f87171",
  "South America": "#fb923c",
  Europe: "#60a5fa",
  Africa: "#fbbf24",
  Asia: "#f472b6",
  Oceania: "#34d399",
  "Middle East": "#c084fc",
  Arctic: "#93c5fd",
  Antarctic: "#e0f2fe",
} as const;

/** Fallback tint for regions missing from the map (was copy-pasted as
 *  #6366f1 across Sidebar, MobileSidebar, and MobileDetailPanel). */
const REGION_FALLBACK_COLOR = "#6366f1";

export function regionColor(region: string): string {
  return CONTINENT_COLORS[region] ?? REGION_FALLBACK_COLOR;
}
