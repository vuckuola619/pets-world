// Pure profile text helpers. ZERO dataset imports (everything heavy stays
// in data/atlasProfiles / data/dinosaurs) so client components that only
// need localized strings don't pull the full atlases into their chunks.
import type { TranslationStrings } from './i18n'
import { t } from './i18n'
import type { AnimalEntry } from '../data/countries'

// Structural stand-in for AtlasProfile so this module has NO import edge
// to the data-heavy atlasProfiles module (Turbopack kept that edge even
// through `import type`, pulling 777KB of dataset into detail pages).
// Mirrors the original type field-for-field (see data/atlasProfiles.ts).
type AtlasProfile = {
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
  images: { url: string; alt: string; credit?: string; caption?: string }[]
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
  sourceLinks: { label: string; href: string }[]
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
export type { AtlasProfile }

export const countryMap: { [key: string]: string } = {
  'Algeria': 'Aljazair',
  'Antarctic Waters': 'Perairan Antarktika',
  'Antarctica': 'Antarktika',
  'Argentina': 'Argentina',
  'Arizona': 'Arizona',
  'Australia': 'Australia',
  'Belgium': 'Belgia',
  'Bhutan': 'Bhutan',
  'Bolivia': 'Bolivia',
  'Botswana': 'Botswana',
  'Brazil': 'Brasil',
  'Brunei': 'Brunei',
  'Cambodia': 'Kamboja',
  'Cameroon': 'Kamerun',
  'Yemen': 'Yaman',
  'Zambia': 'Zambia'
};

export const intervalMap: { [key: string]: string } = {
  'Albian': 'Albian',
  'Aptian to Albian': 'Aptian hingga Albian',
  'Barremian to Early Aptian': 'Barremian hingga Aptian Awal',
  'Barremian': 'Barremian',
  'Coniacian to Santonian': 'Coniacian hingga Santonian',
  'Early Albian': 'Albian Awal',
  'Early Barremian': 'Barremian Awal',
  'Early Bathonian': 'Bathonian Awal',
  'Early Berriasian to Late Albian': 'Berriasian Awal hingga Albian Akhir',
  'Early Cenomanian': 'Cenomanian Awal',
  'Hettangian to Sinemurian': 'Hettangian hingga Sinemurian',
  'Kimmeridgian to Tithonian': 'Kimmeridgian hingga Tithonian',
  'Late Albian to Early Cenomanian': 'Albian Akhir hingga Cenomanian Awal',
  'Late Albian': 'Albian Akhir',
  'Late Barremian to Early Aptian': 'Barremian Akhir hingga Aptian Awal',
  'Late Campanian': 'Campanian Akhir',
  'Late Cenomanian to Turonian': 'Cenomanian Akhir hingga Turonian',
  'Late Kimmeridgian': 'Kimmeridgian Akhir',
  'Late Maastrichtian': 'Maastrichtian Akhir',
  'Maastrichtian': 'Maastrichtian',
  'Middle Cenomanian to Early Turonian': 'Cenomanian Tengah hingga Turonian Awal',
  'Norian': 'Norian',
  'Sinemurian to Pliensbachian': 'Sinemurian hingga Pliensbachian',
  'Tuvalian': 'Tuvalian',
};

export const habitMap: { [key: string]: string } = {
  'ground dwelling': 'tinggal di darat',
  'ground dwelling, gregarious': 'tinggal di darat, hidup berkelompok',
  'ground dwelling, solitary': 'tinggal di darat, penyendiri',
  'terrestrial': 'terestrial/darat'
};

export function translateCountry(country: string, locale: string): string {
  if (locale === 'id') {
    return countryMap[country] || country;
  }
  return country;
}

/** Minimal fossil shape both AtlasProfile.fossil and the dinosaur record
 *  satisfy — lets one builder serve profiles and raw entries alike. */
type FossilBits = {
  pbdbOccurrenceId: string
  formation: string
  interval: string
  earlyAgeMa: number
  lateAgeMa: number
  locality: string
  lifeHabit: string
}

type FunFactsBase = {
  commonName: string
  country: string
  diet: string
  funFacts: string[]
  funFacts_id?: string[]
  fossil?: FossilBits
}

function buildFunFacts(base: FunFactsBase, locale: string): string[] {
  if (locale === 'id') {
    if (base.fossil) {
      const fossil = base.fossil;
      const countryName = countryMap[base.country] || base.country;
      const intervalName = intervalMap[fossil.interval] || fossil.interval;
      const habitName = habitMap[fossil.lifeHabit] || fossil.lifeHabit;
      const dietName = t('id').diets[base.diet as keyof TranslationStrings['diets']] || base.diet;

      return [
        `${base.commonName} dipetakan dari temuan PBDB ${fossil.pbdbOccurrenceId} di Formasi ${fossil.formation}, ${countryName}; interval ${intervalName} (${fossil.earlyAgeMa}-${fossil.lateAgeMa} juta tahun yang lalu).`,
        `Interval PBDB: ${intervalName} (${fossil.earlyAgeMa}-${fossil.lateAgeMa} juta tahun yang lalu).`,
        `Lokasi temuan fosil: ${fossil.locality}.`,
        `Formasi/grup: ${fossil.formation}.`,
        `Ekologi PBDB: makanan ${dietName.toLowerCase()}, kebiasaan hidup ${habitName}.`,
      ];
    }
    return base.funFacts_id || base.funFacts;
  }
  return base.funFacts;
}

/** Localized fun facts from a full profile (detail pages). */
export function getProfileFunFacts(profile: AtlasProfile, locale: string): string[] {
  return buildFunFacts(
    {
      commonName: profile.commonName,
      country: profile.country,
      diet: profile.diet,
      funFacts: profile.funFacts,
      funFacts_id: profile.funFacts_id,
      fossil: profile.fossil,
    },
    locale
  );
}

/** A map-surface entry, possibly carrying the dinosaur extras that the
 *  dino atlas attaches to its records. */
export type MaybeDinoEntry = AnimalEntry & {
  atlasMode?: string
  dinosaur?: FossilBits & Record<string, unknown>
  funFacts_id?: string[]
  commonName?: string
}

/** Quick habitat line for compare cards: fossil wording for dinosaurs,
 *  plain habitat otherwise. */
export function getQuickHabitat(entry: MaybeDinoEntry): string {
  if (entry.atlasMode === 'prehistoric' && entry.dinosaur) {
    const f = entry.dinosaur;
    return `Formasi ${f.formation}, ${f.locality}, ${intervalMap[f.interval] || f.interval}`;
  }
  return entry.habitat;
}

/** Localized fun facts straight from a list entry (no profile lookup). */
export function getEntryFunFacts(entry: MaybeDinoEntry, locale: string): string[] {
  const isDino = entry.atlasMode === 'prehistoric' && entry.dinosaur
  return buildFunFacts(
    {
      commonName: entry.commonName ?? entry.animal,
      country: entry.country,
      diet: entry.diet,
      funFacts: entry.funFacts,
      funFacts_id: entry.funFacts_id,
      fossil: isDino ? (entry.dinosaur as FossilBits) : undefined,
    },
    locale
  );
}

/** Localized description from a full profile (detail pages). */
export function getProfileDescription(profile: AtlasProfile, locale: string): string {
  const isPrehistoric = profile.atlasMode === 'prehistoric';
  if (locale === 'id') {
    if (profile.description_id) return profile.description_id;
    if (isPrehistoric && profile.fossil) {
      const fossil = profile.fossil;
      const countryName = countryMap[profile.country] || profile.country;
      const intervalName = intervalMap[fossil.interval] || fossil.interval;
      return `${profile.commonName} ditampilkan dari temuan fosil PBDB yang terverifikasi di Formasi ${fossil.formation}, ${countryName}. Temuan ini berasal dari interval ${intervalName} (${fossil.earlyAgeMa}-${fossil.lateAgeMa} juta tahun yang lalu), dengan bukti lokalitas yang dicatat sebagai ${fossil.locality}.`;
    }
  }
  return profile.description;
}
