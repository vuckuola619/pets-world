import type { AtlasMode } from '../store/useMapStore'

/** Literal hexes for maplibre paint properties (they cannot read CSS vars).
 *  Mirrors the Natura tokens: wildlife = emerald family, Era Purba = fossil
 *  amber family. Keep in sync with --natura-emerald / --natura-amber in
 *  globals.css. */
export const CLUSTER_COLOR: Record<AtlasMode, string> = {
  wildlife: '#2e7d54',
  prehistoric: '#b9791e',
}
