'use client'

import { useMemo } from 'react'
import { countries, continents, type AnimalEntry } from '../data/countries'
import { dinosaurRegions, dinosaursAsAnimals } from '../data/dinosaurs'
import { useMapStore, type AtlasMode } from '../store/useMapStore'

/** Returns the active atlas records for a mode. */
export function getAtlasRecords(mode: AtlasMode): AnimalEntry[] {
  return mode === 'prehistoric' ? dinosaursAsAnimals : countries
}

/** Returns the active atlas region filters for a mode. */
export function getAtlasRegions(mode: AtlasMode): string[] {
  return mode === 'prehistoric' ? dinosaurRegions : continents
}

/** Filters atlas records by region and a broad search query. */
export function filterAtlasRecords(records: AnimalEntry[], searchQuery: string, activeRegion: string): AnimalEntry[] {
  const s = searchQuery.trim().toLowerCase()
  return records.filter((record) => {
    const matchRegion = activeRegion === 'All' || record.region === activeRegion
    const searchable = [
      record.country,
      record.region,
      record.animal,
      record.scientificName,
      record.classification,
      record.diet,
      record.habitat,
      record.population,
      ...record.funFacts,
    ]
      .join(' ')
      .toLowerCase()
    const matchSearch = !s || searchable.includes(s)
    return matchRegion && matchSearch
  })
}

/** Returns filtered active atlas records from global map store state. */
export function useFilteredAtlasAnimals(): AnimalEntry[] {
  const { activeRegion, atlasMode, searchQuery } = useMapStore()

  return useMemo(() => {
    return filterAtlasRecords(getAtlasRecords(atlasMode), searchQuery, activeRegion)
  }, [activeRegion, atlasMode, searchQuery])
}

/** Returns all records and regions for the current atlas mode. */
export function useAtlasData(): { records: AnimalEntry[]; regions: string[] } {
  const atlasMode = useMapStore((state) => state.atlasMode)

  return useMemo(
    () => ({
      records: getAtlasRecords(atlasMode),
      regions: getAtlasRegions(atlasMode),
    }),
    [atlasMode],
  )
}
