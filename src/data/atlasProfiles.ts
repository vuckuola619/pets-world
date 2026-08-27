import rawData from './animals.json'
import { dinosaursAsAnimals, type DinosaurAnimalEntry, type DinosaurRecord } from './dinosaurs'
import { t, type TranslationStrings, type Locale } from '../lib/i18n'

export type AtlasProfileImage = {
  url: string
  alt: string
  credit?: string
  caption?: string
}

export type AtlasProfileSourceLink = {
  label: string
  href: string
}

export type AtlasProfile = {
  id: string
  slug: string
  commonName: string
  scientificName: string
  taxonomy: {
    kingdom: string
    phylum: string
    class: string
    order: string
    family: string
    genus: string
  }
  iucnStatus: string
  description: string
  description_id?: string
  fossilDistribution?: string
  fossilDistribution_id?: string
  habitat: string[]
  diet: string
  lifespan: { min: number; max: number; unit: string }
  weight: { min: number; max: number; unit: string }
  nativeRegions: string[]
  coordinates: { lat: number; lng: number; label?: string }[]
  images: AtlasProfileImage[]
  videoUrl?: string
  modelUrl?: string
  funFacts: string[]
  funFacts_id?: string[]
  wikiUrl?: string
  updatedAt: string
  country: string
  flag: string
  region: string
  animal: string
  emoji: string
  classification: string
  conservationStatus: string
  indigenous: boolean
  habitatOld?: string
  population: string
  atlasMode: 'wildlife' | 'prehistoric'
  sourceLinks: AtlasProfileSourceLink[]
  profileFacts: string[]
  fossil?: {
    interval: string
    earlyAgeMa: number
    lateAgeMa: number
    formation: string
    locality: string
    lifeHabit: string
    taxonAttribution: string
    pbdbOccurrenceId: string
    pbdbTaxonId: string
  }
}

function toTitleCase(value: string): string {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function dinosaurDiet(record: DinosaurRecord): 'Carnivore' | 'Herbivore' | 'Omnivore' {
  const diet = record.diet.toLowerCase()
  if (diet.includes('carnivore')) return 'Carnivore'
  if (diet.includes('herbivore')) return 'Herbivore'
  return 'Omnivore'
}

function dinosaurOrder(entry: DinosaurAnimalEntry): string {
  if (entry.classification.toLowerCase().includes('tyrannosaur')) return 'Theropoda'
  if (entry.classification.toLowerCase().includes('abelisaur')) return 'Theropoda'
  if (entry.classification.toLowerCase().includes('carcharodontosaur')) return 'Theropoda'
  if (entry.classification.toLowerCase().includes('ceratops')) return 'Ceratopsia'
  if (entry.classification.toLowerCase().includes('stegosaur')) return 'Stegosauria'
  if (entry.classification.toLowerCase().includes('ankylosaur')) return 'Ankylosauria'
  if (entry.classification.toLowerCase().includes('iguanodont')) return 'Ornithopoda'
  if (entry.dinosaur.diet.toLowerCase().includes('herbivore')) return 'Ornithischia'
  return 'Saurischia'
}

function buildDinosaurDescription(record: DinosaurRecord): string {
  return `${record.commonName} is shown from a vetted PBDB fossil occurrence in ${record.formation}, ${record.country}. The occurrence is dated to the ${record.interval} interval (${record.earlyAgeMa}-${record.lateAgeMa} Ma), with locality evidence recorded as ${record.locality}.`
}

const wildlifeProfiles: AtlasProfile[] = rawData.map((animal) => ({
  ...animal,
  country: animal.country ?? animal.coordinates[0]?.label ?? animal.nativeRegions[0] ?? 'Unknown',
  flag: animal.flag ?? '🌐',
  region: animal.region ?? animal.nativeRegions[0] ?? 'Unknown',
  animal: animal.animal ?? animal.commonName,
  emoji: animal.emoji ?? '🐾',
  classification: animal.classification ?? animal.taxonomy.class,
  conservationStatus: animal.conservationStatus ?? animal.iucnStatus,
  indigenous: animal.indigenous ?? true,
  population: animal.population ?? animal.iucnStatus,
  habitatOld: animal.habitatOld ?? animal.habitat.join(', '),
  atlasMode: 'wildlife' as const,
  sourceLinks: animal.wikiUrl ? [{ label: 'Wikipedia', href: animal.wikiUrl }] : [],
  profileFacts: animal.funFacts,
}))

export const dinosaurProfiles: AtlasProfile[] = dinosaursAsAnimals.map((entry) => {
  const record = entry.dinosaur

  return {
    id: entry.id,
    slug: entry.slug,
    commonName: record.commonName,
    scientificName: record.scientificName,
    taxonomy: {
      kingdom: 'Animalia',
      phylum: 'Chordata',
      class: 'Dinosauria',
      order: dinosaurOrder(entry),
      family: record.family,
      genus: record.scientificName.split(' ')[0] ?? record.commonName,
    },
    iucnStatus: 'EX',
    description: record.description || buildDinosaurDescription(record),
    description_id: record.description_id || undefined,
    fossilDistribution: record.fossilDistribution || undefined,
    fossilDistribution_id: record.fossilDistribution_id || undefined,
    habitat: [
      `${record.formation} Formation`,
      record.locality,
      `${record.interval} (${record.earlyAgeMa}-${record.lateAgeMa} Ma)`,
      `${toTitleCase(record.lifeHabit)}`,
    ],
    diet: dinosaurDiet(record),
    lifespan: { min: 0, max: 0, unit: 'years' },
    weight: { min: 0, max: 0, unit: 'kg' },
    nativeRegions: [record.region],
    coordinates: [{ lat: record.lat, lng: record.lng, label: `${record.formation}, ${record.country}` }],
    images: [{ url: entry.imageUrl, alt: entry.imageAlt, credit: entry.imageCredit }],
    funFacts: entry.funFacts,
    wikiUrl: entry.wikiUrl,
    updatedAt: '2026-06-08T00:00:00Z',
    country: record.country,
    flag: entry.flag,
    region: record.region,
    animal: record.commonName,
    emoji: entry.emoji,
    classification: entry.classification,
    conservationStatus: 'Extinct',
    indigenous: true,
    habitatOld: entry.habitat,
    population: entry.population,
    atlasMode: 'prehistoric' as const,
    sourceLinks: [
      { label: `PBDB occurrence ${record.pbdbOccurrenceId}`, href: record.sourceUrl },
      { label: `PBDB taxon ${record.pbdbTaxonId}`, href: record.taxonSourceUrl },
      ...(entry.wikiUrl ? [{ label: 'Wikipedia overview', href: entry.wikiUrl }] : []),
    ],
    profileFacts: [
      record.evidenceNote,
      `PBDB occurrence ${record.pbdbOccurrenceId} supplies the mapped coordinates for this atlas marker.`,
      `Taxon attribution: ${record.taxonAttribution}.`,
      `Formation/locality: ${record.formation}; ${record.locality}.`,
    ],
    fossil: {
      interval: record.interval,
      earlyAgeMa: record.earlyAgeMa,
      lateAgeMa: record.lateAgeMa,
      formation: record.formation,
      locality: record.locality,
      lifeHabit: record.lifeHabit,
      taxonAttribution: record.taxonAttribution,
      pbdbOccurrenceId: record.pbdbOccurrenceId,
      pbdbTaxonId: record.pbdbTaxonId,
    },
  }
})

export const atlasProfiles: AtlasProfile[] = [...wildlifeProfiles, ...dinosaurProfiles]

export function getAtlasProfileBySlug(slug: string): AtlasProfile | undefined {
  return atlasProfiles.find((profile) => profile.slug === slug)
}

export function getAtlasProfileStaticParams(): { slug: string }[] {
  return atlasProfiles.map((profile) => ({ slug: profile.slug }))
}
