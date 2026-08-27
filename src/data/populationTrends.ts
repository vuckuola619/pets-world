/** Population trend direction for each species */
export type TrendDirection = 'increasing' | 'stable' | 'decreasing' | 'unknown'

export const TREND_COLORS: Record<TrendDirection, string> = {
  increasing: '#22c55e',
  stable: '#6b7280',
  decreasing: '#ef4444',
  unknown: '#9ca3af',
}

export const TREND_ICONS: Record<TrendDirection, string> = {
  increasing: '📈',
  stable: '➡️',
  decreasing: '📉',
  unknown: '❓',
}

/** Simulated trend generator is seeded by slug so charts are stable */
function hashCode(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i++) {
    h = (Math.imul(31, h) + value.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/** IUCN status → trend direction */
export function statusToTrend(status: string): TrendDirection {
  switch (status) {
    case 'Least Concern': return 'stable'
    case 'Near Threatened': return 'stable'
    case 'Vulnerable': return 'decreasing'
    case 'Endangered': return 'decreasing'
    case 'Critically Endangered': return 'decreasing'
    case 'Extinct': return 'decreasing'
    default: return 'unknown'
  }
}

export const VALID_TRENDS: TrendDirection[] = ['increasing', 'stable', 'decreasing', 'unknown']

export interface PopulationTrend {
  direction: TrendDirection
  /** Simulated data points (relative scale 0-100) for sparkline */
  dataPoints: number[]
}

/** Deterministic pseudo-random trend data (10 points, 0-100) */
export function getPopulationTrend(slug: string, conservationStatus: string): PopulationTrend {
  const direction = statusToTrend(conservationStatus)
  const seed = hashCode(slug + direction)
  const points: number[] = []
  let value = direction === 'increasing' ? 20 : direction === 'decreasing' ? 85 : 50
  for (let i = 0; i < 10; i++) {
    const jitter = ((seed >> (i % 16)) & 7) - 3 // -3..4
    value += direction === 'increasing' ? 4 + jitter : direction === 'decreasing' ? -4 - jitter : jitter
    points.push(Math.max(0, Math.min(100, value)))
  }
  return { direction, dataPoints: points }
}
