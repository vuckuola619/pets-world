import { describe, expect, it } from 'vitest'
import { countries } from '../data/countries'
import { dinosaursAsAnimals } from '../data/dinosaurs'
import { filterAtlasRecords, getAtlasRecords, getAtlasRegions } from '../hooks/useAtlasAnimals'

describe('atlas animal helpers', () => {
  it('returns wildlife records for wildlife mode', () => {
    expect(getAtlasRecords('wildlife')).toBe(countries)
  })

  it('returns dinosaur records for prehistoric mode', () => {
    expect(getAtlasRecords('prehistoric')).toBe(dinosaursAsAnimals)
  })

  it('returns mode-specific region filters', () => {
    expect(getAtlasRegions('wildlife')).toContain('Asia')
    expect(getAtlasRegions('prehistoric')).toContain('Antarctic')
  })

  it('filters prehistoric records by dinosaur name, country, and interval', () => {
    const prehistoric = getAtlasRecords('prehistoric')

    expect(filterAtlasRecords(prehistoric, 'tyrannosaurus', 'All').map((record) => record.animal)).toContain(
      'Tyrannosaurus rex',
    )
    expect(filterAtlasRecords(prehistoric, 'argentina', 'All').some((record) => record.country === 'Argentina')).toBe(
      true,
    )
    expect(
      filterAtlasRecords(prehistoric, 'maastrichtian', 'All').some((record) =>
        record.funFacts.some((fact) => fact.toLowerCase().includes('maastrichtian')),
      ),
    ).toBe(true)
  })

  it('filters prehistoric records by region', () => {
    const prehistoric = getAtlasRecords('prehistoric')
    const antarctic = filterAtlasRecords(prehistoric, '', 'Antarctic')

    expect(antarctic.length).toBeGreaterThan(0)
    expect(antarctic.every((record) => record.region === 'Antarctic')).toBe(true)
  })
})
