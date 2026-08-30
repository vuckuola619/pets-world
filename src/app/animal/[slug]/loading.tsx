import React from 'react'

/** Loading skeleton for the animal detail page. Token-based (--muted /
 *  .skeleton-shimmer) so it follows light/dark and the prehistoric amber
 *  palette instead of flashing raw zinc white. Layout mirrors
 *  AnimalProfileView: hero, stat cards, description, habitat chips, facts. */
export default function Loading(): React.JSX.Element {
  return (
    <div className="min-h-screen" style={{ background: 'var(--natura-surface)' }}>
      {/* Hero skeleton */}
      <div style={{ height: 280, background: 'var(--muted)' }}>
        <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24 space-y-4">
          <div className="skeleton-shimmer h-4 w-24 rounded" />
          <div className="flex items-center gap-3">
            <div className="skeleton-shimmer w-14 h-14 rounded-full" />
            <div className="skeleton-shimmer w-10 h-10 rounded" />
          </div>
          <div className="skeleton-shimmer h-12 w-64 rounded" />
          <div className="skeleton-shimmer h-5 w-48 rounded" />
          <div className="flex gap-2">
            <div className="skeleton-shimmer h-7 w-32 rounded-full" />
            <div className="skeleton-shimmer h-7 w-20 rounded-full" />
            <div className="skeleton-shimmer h-7 w-28 rounded-full" />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card rounded-xl px-4 py-3">
              <div className="skeleton-shimmer h-3 w-16 rounded" />
              <div className="skeleton-shimmer h-4 w-24 mt-2 rounded" />
            </div>
          ))}
        </div>

        {/* Description skeleton */}
        <div className="space-y-2">
          <div className="skeleton-shimmer h-5 w-28 rounded" />
          <div className="skeleton-shimmer h-4 w-full rounded" />
          <div className="skeleton-shimmer h-4 w-5/6 rounded" />
          <div className="skeleton-shimmer h-4 w-3/4 rounded" />
        </div>

        {/* Habitat skeleton */}
        <div className="space-y-2">
          <div className="skeleton-shimmer h-5 w-20 rounded" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer h-7 w-24 rounded-full" />
            ))}
          </div>
        </div>

        {/* Fun facts skeleton */}
        <div className="space-y-2">
          <div className="skeleton-shimmer h-5 w-24 rounded" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-4 w-full rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}
