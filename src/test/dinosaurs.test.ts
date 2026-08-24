import { describe, expect, it } from 'vitest'
import {
  dinosaurRegions,
  dinosaurSchema,
  dinosaurs,
  dinosaursAsAnimals,
} from '../data/dinosaurs'

describe('Dinosaur fossil occurrence data', () => {
  it('has a research-backed regional dataset', () => {
    expect(dinosaurs.length).toBeGreaterThanOrEqual(30)
  })

  it('covers the required discovery regions', () => {
    expect(dinosaurRegions).toEqual(
      expect.arrayContaining([
        'Africa',
        'Antarctic',
        'Asia',
        'Europe',
        'North America',
        'Oceania',
        'South America',
      ]),
    )
  })

  it('all records pass the dinosaur schema', () => {
    dinosaurs.forEach((dinosaur) => {
      const result = dinosaurSchema.safeParse(dinosaur)
      expect(
        result.success,
        `Failed for ${dinosaur.id}: ${JSON.stringify(result.error?.issues)}`,
      ).toBe(true)
    })
  })

  it('has unique IDs and PBDB source URLs', () => {
    const ids = dinosaurs.map((dinosaur) => dinosaur.id)
    expect(new Set(ids).size).toBe(ids.length)

    dinosaurs.forEach((dinosaur) => {
      expect(dinosaur.sourceUrl).toMatch(/^https:\/\/paleobiodb\.org\/data1\.2\//)
      expect(dinosaur.pbdbOccurrenceId).toMatch(/^occ:\d+$/)
      expect(dinosaur.pbdbTaxonId).toMatch(/^txn:\d+$/)
      expect(dinosaur.evidenceNote).toContain(dinosaur.interval)
    })
  })

  it('maps dinosaurs into the existing animal marker surface', () => {
    expect(dinosaursAsAnimals).toHaveLength(dinosaurs.length)
    expect(dinosaursAsAnimals.every((record) => record.conservationStatus === 'Extinct')).toBe(true)
    expect(dinosaursAsAnimals.every((record) => record.indigenous)).toBe(true)
    expect(dinosaursAsAnimals.every((record) => record.funFacts.length === 5)).toBe(true)
  })

  it('uses illustration thumbnails instead of fossil-only images', () => {
    dinosaursAsAnimals.forEach((record) => {
      const isSvg = record.imageUrl.startsWith('data:image/svg+xml');
      const isRealImg = record.imageUrl.startsWith('https://upload.wikimedia.org/');
      expect(isSvg || isRealImg, `${record.animal} needs a thumbnail (SVG or Wikimedia URL)`).toBe(true)
      expect(record.imageKind).toMatch(/illustration|photo/)
      expect(record.imageCredit).toMatch(/Generated paleoart|Wikimedia/)
      expect(record.imageAlt).toContain(record.animal)
      expect(record.imageUrl.toLowerCase()).not.toMatch(/fossil|skeleton|skull|museum|holotype/)
    })
  })
})
