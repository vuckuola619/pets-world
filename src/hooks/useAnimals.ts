import type { AnimalEntry } from '../data/countries'
import { useFilteredAtlasAnimals } from './useAtlasAnimals'

/** Returns filtered and searched animal list from the map store */
export function useFilteredAnimals(): AnimalEntry[] {
  return useFilteredAtlasAnimals()
}
