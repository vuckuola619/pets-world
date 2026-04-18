/** Population trend direction for each species */
export type TrendDirection = 'increasing' | 'stable' | 'decreasing' | 'unknown'

/** Population trend data for a species */
export interface PopulationTrend {
  direction: TrendDirection
  /** Simulated data points (relative scale 0-100) for sparkline */
  dataPoints: number[]
}

/** Trend color mapping */
export const TREND_COLORS: Record<TrendDirection, string> = {
  increasing: '#22c55e',
  stable: '#eab308',
  decreasing: '#ef4444',
  unknown: '#9ca3af',
}

/** Trend labels */
export const TREND_LABELS: Record<TrendDirection, string> = {
  increasing: 'Increasing',
  stable: 'Stable',
  decreasing: 'Decreasing',
  unknown: 'Unknown',
}

/** Population trend icon */
export const TREND_ICONS: Record<TrendDirection, string> = {
  increasing: '📈',
  stable: '📊',
  decreasing: '📉',
  unknown: '❓',
}

/**
 * Maps IUCN conservation status to likely population trend.
 * Based on real IUCN Red List population trend assessments.
 */
function statusToTrend(status: string): TrendDirection {
  switch (status) {
    case 'Least Concern': return 'stable'
    case 'Near Threatened': return 'decreasing'
    case 'Vulnerable': return 'decreasing'
    case 'Endangered': return 'decreasing'
    case 'Critically Endangered': return 'decreasing'
    case 'Data Deficient': return 'unknown'
    default: return 'unknown'
  }
}

/** Generates simulated historical data points for a given trend */
function generateDataPoints(direction: TrendDirection, seed: number): number[] {
  const points: number[] = []
  const len = 10
  // Use a simple seeded pseudo-random for reproducibility
  let rng = seed
  const nextRng = () => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff
    return (rng % 100) / 100
  }

  let base: number
  switch (direction) {
    case 'increasing':
      base = 30
      for (let i = 0; i < len; i++) {
        base += 3 + nextRng() * 5
        points.push(Math.min(100, Math.max(0, base + (nextRng() - 0.5) * 8)))
      }
      break
    case 'stable':
      base = 50 + nextRng() * 20
      for (let i = 0; i < len; i++) {
        points.push(Math.min(100, Math.max(0, base + (nextRng() - 0.5) * 12)))
      }
      break
    case 'decreasing':
      base = 80
      for (let i = 0; i < len; i++) {
        base -= 2 + nextRng() * 5
        points.push(Math.min(100, Math.max(0, base + (nextRng() - 0.5) * 8)))
      }
      break
    case 'unknown':
    default:
      for (let i = 0; i < len; i++) {
        points.push(30 + nextRng() * 40)
      }
      break
  }
  return points
}

/** Simple hash function to generate a numeric seed from a string */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit int
  }
  return Math.abs(hash)
}

/**
 * Returns population trend data for a given species.
 * Derives trend from conservation status and generates reproducible data points.
 */
export function getPopulationTrend(slug: string, conservationStatus: string): PopulationTrend {
  const direction = statusToTrend(conservationStatus)
  const seed = hashString(slug)
  const dataPoints = generateDataPoints(direction, seed)

  return { direction, dataPoints }
}

/** Valid trend directions for validation */
export const VALID_TRENDS: TrendDirection[] = ['increasing', 'stable', 'decreasing', 'unknown']
