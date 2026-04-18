import { describe, it, expect } from 'vitest'
import { getPopulationTrend, VALID_TRENDS, TREND_COLORS, TREND_LABELS, TREND_ICONS } from '../data/populationTrends'

describe('Population Trends', () => {
  it('returns valid trend direction for all conservation statuses', () => {
    const statuses = ['Least Concern', 'Near Threatened', 'Vulnerable', 'Endangered', 'Critically Endangered', 'Data Deficient']
    for (const status of statuses) {
      const trend = getPopulationTrend('test-slug', status)
      expect(VALID_TRENDS).toContain(trend.direction)
    }
  })

  it('returns "unknown" for unrecognized status', () => {
    const trend = getPopulationTrend('test', 'Nonexistent Status')
    expect(trend.direction).toBe('unknown')
  })

  it('generates 10 data points', () => {
    const trend = getPopulationTrend('komodo-dragon', 'Endangered')
    expect(trend.dataPoints).toHaveLength(10)
  })

  it('all data points are between 0 and 100', () => {
    const trend = getPopulationTrend('komodo-dragon', 'Endangered')
    for (const point of trend.dataPoints) {
      expect(point).toBeGreaterThanOrEqual(0)
      expect(point).toBeLessThanOrEqual(100)
    }
  })

  it('generates reproducible data for the same slug', () => {
    const trend1 = getPopulationTrend('bengal-tiger', 'Endangered')
    const trend2 = getPopulationTrend('bengal-tiger', 'Endangered')
    expect(trend1.dataPoints).toEqual(trend2.dataPoints)
  })

  it('generates different data for different slugs', () => {
    const trend1 = getPopulationTrend('bengal-tiger', 'Endangered')
    const trend2 = getPopulationTrend('polar-bear', 'Vulnerable')
    expect(trend1.dataPoints).not.toEqual(trend2.dataPoints)
  })

  it('maps "Least Concern" to "stable"', () => {
    const trend = getPopulationTrend('test', 'Least Concern')
    expect(trend.direction).toBe('stable')
  })

  it('maps "Critically Endangered" to "decreasing"', () => {
    const trend = getPopulationTrend('test', 'Critically Endangered')
    expect(trend.direction).toBe('decreasing')
  })

  it('has colors for all valid trends', () => {
    for (const dir of VALID_TRENDS) {
      expect(TREND_COLORS[dir]).toBeDefined()
      expect(typeof TREND_COLORS[dir]).toBe('string')
    }
  })

  it('has labels for all valid trends', () => {
    for (const dir of VALID_TRENDS) {
      expect(TREND_LABELS[dir]).toBeDefined()
      expect(typeof TREND_LABELS[dir]).toBe('string')
    }
  })

  it('has icons for all valid trends', () => {
    for (const dir of VALID_TRENDS) {
      expect(TREND_ICONS[dir]).toBeDefined()
    }
  })
})
