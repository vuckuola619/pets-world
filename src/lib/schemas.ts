import { z } from 'zod'

/** Schema for legacy animal entry used by map components */
const conservationStatusEnum = z.enum(['Least Concern', 'Near Threatened', 'Vulnerable', 'Endangered', 'Critically Endangered', 'Data Deficient', 'Extinct'])
export const animalSchema = z.object({
  id: z.string(),
  country: z.string(),
  flag: z.string(),
  lat: z.number(),
  lng: z.number(),
  region: z.string(),
  animal: z.string(),
  scientificName: z.string(),
  emoji: z.string(),
  classification: z.string(),
  conservationStatus: conservationStatusEnum,
  indigenous: z.boolean(),
  funFacts: z.array(z.string()),
  habitat: z.string(),
  population: z.string(),
})

/** Legacy animal entry type */
export type Animal = z.infer<typeof animalSchema>

/** Legacy conservation status type */
export type ConservationStatus = z.infer<typeof conservationStatusEnum>
