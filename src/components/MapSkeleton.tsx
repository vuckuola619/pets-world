'use client'

/** Animated placeholder for the map area — token-based so it follows
 *  light/dark and the prehistoric palette (was raw zinc, flashing white
 *  in dark mode). */
export default function MapSkeleton(): React.JSX.Element {
  return (
    <div className="absolute inset-0" style={{ background: 'var(--muted)' }} aria-hidden="true">
      <div className="skeleton-shimmer absolute inset-0 opacity-60" />
    </div>
  )
}
