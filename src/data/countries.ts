import { z } from 'zod'
import rawData from './animals.json'
// Animal type is used via the Zod schema below

/** Legacy schema for backward compat with existing components */
export const animalSchema = z.object({
  id: z.string(),
  slug: z.string(),
  country: z.string(),
  flag: z.string(),
  lat: z.number(),
  lng: z.number(),
  region: z.string(),
  animal: z.string(),
  scientificName: z.string(),
  emoji: z.string(),
  classification: z.string(),
  diet: z.string(),
  conservationStatus: z.enum(['Least Concern', 'Near Threatened', 'Vulnerable', 'Endangered', 'Critically Endangered', 'Data Deficient', 'Extinct']),
  indigenous: z.boolean(),
  funFacts: z.array(z.string()),
  funFacts_id: z.array(z.string()).optional(),
  habitat_id: z.array(z.string()).optional(),
  habitat: z.string(),
  population: z.string(),
  wikiUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  imageAlt: z.string().optional(),
  imageCredit: z.string().optional(),
  imageKind: z.enum(['photo', 'illustration']).optional(),
})

/** Parsed animal entries from raw JSON data */
export const countries = rawData.map(a => {
  const firstImage = a.images?.[0]
  const parsed = { ...a, lat: a.coordinates[0]?.lat ?? 0, lng: a.coordinates[0]?.lng ?? 0, animal: a.commonName, habitat: a.habitatOld || a.habitat?.join(', ') || '', wikiUrl: a.wikiUrl, imageUrl: firstImage?.url, imageAlt: firstImage?.alt }
  return animalSchema.parse(parsed)
})

/** Legacy animal entry type inferred from schema */
export type AnimalEntry = z.infer<typeof animalSchema>

/** New full animal type (with taxonomy, diet, etc.) */
export { type Animal } from '../types/animal'

/** Sorted unique continent/region list */
export const continents: string[] = Array.from(new Set(countries.map(c => c.region))).sort()
