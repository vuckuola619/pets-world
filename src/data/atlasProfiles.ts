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
  'California': 'Kalifornia',
  'Cambodia': 'Kamboja',
  'Cameroon': 'Kamerun',
  'Canada': 'Kanada',
  'Chile': 'Chili',
  'China': 'Tiongkok',
  'Christmas Island': 'Pulau Natal',
  'Colombia': 'Kolombia',
  'Congo': 'Kongo',
  'Costa Rica': 'Kosta Rika',
  'Democratic Republic of Congo': 'Republik Demokratik Kongo',
  'Ecuador': 'Ekuador',
  'Egypt': 'Mesir',
  'England': 'Inggris',
  'Ethiopia': 'Etiopia',
  'Fiji': 'Fiji',
  'Finland': 'Finlandia',
  'Florida': 'Florida',
  'France': 'Prancis',
  'French Polynesia': 'Polinesia Prancis',
  'Germany': 'Jerman',
  'Greece': 'Yunani',
  'Greenland': 'Greenland',
  'Guam': 'Guam',
  'Guatemala': 'Guatemala',
  'Iceland': 'Islandia',
  'India': 'India',
  'Indonesia': 'Indonesia',
  'Israel': 'Israel',
  'Italy': 'Italia',
  'Japan': 'Jepang',
  'Jordan': 'Yordania',
  'Kazakhstan': 'Kazakhstan',
  'Kenya': 'Kenya',
  'Liberia': 'Liberia',
  'Madagascar': 'Madagaskar',
  'Malaysia': 'Malaysia',
  'Maldives': 'Maladewa',
  'Mexico': 'Meksiko',
  'Mongolia': 'Mongolia',
  'Morocco': 'Maroko',
  'Mozambique': 'Mozambik',
  'Myanmar': 'Myanmar',
  'Namibia': 'Namibia',
  'Nepal': 'Nepal',
  'New Caledonia': 'Kaledonia Baru',
  'New Zealand': 'Selandia Baru',
  'Niger': 'Niger',
  'North Korea': 'Korea Utara',
  'Norway': 'Norwegia',
  'Oman': 'Oman',
  'Pakistan': 'Pakistan',
  'Panama': 'Panama',
  'Papua New Guinea': 'Papua Nugini',
  'Peru': 'Peru',
  'Philippines': 'Filipina',
  'Poland': 'Polandia',
  'Romania': 'Rumania',
  'Rwanda': 'Rwanda',
  'Samoa': 'Samoa',
  'Saudi Arabia': 'Arab Saudi',
  'Scotland': 'Skotlandia',
  'South Africa': 'Afrika Selatan',
  'Spain': 'Spanyol',
  'Sri Lanka': 'Sri Lanka',
  'Svalbard': 'Svalbard',
  'Sweden': 'Swedia',
  'Switzerland': 'Swiss',
  'Taiwan': 'Taiwan',
  'Tanzania': 'Tanzania',
  'Texas': 'Texas',
  'Thailand': 'Thailand',
  'Tonga': 'Tonga',
  'Tunisia': 'Tunisia',
  'USA': 'Amerika Serikat',
  'Uganda': 'Uganda',
  'United Arab Emirates': 'Uni Emirat Arab',
  'United Kingdom': 'Inggris Raya',
  'United States': 'Amerika Serikat',
  'Venezuela': 'Venezuela',
  'Vietnam': 'Vietnam',
  'Wyoming': 'Wyoming',
  'Yellowstone': 'Yellowstone',
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

export function getProfileFunFacts(profile: AtlasProfile, locale: string): string[] {
  const isPrehistoric = profile.atlasMode === 'prehistoric';
  const profileAny = profile as any;
  if (locale === 'id') {
    if (isPrehistoric && profile.fossil) {
      const fossil = profile.fossil;
      const countryName = countryMap[profile.country] || profile.country;
      const intervalName = intervalMap[fossil.interval] || fossil.interval;
      const habitName = habitMap[fossil.lifeHabit] || fossil.lifeHabit;
      const dietName = t('id').diets[profile.diet as keyof TranslationStrings['diets']] || profile.diet;

      return [
        `${profile.commonName} dipetakan dari temuan PBDB ${fossil.pbdbOccurrenceId} di Formasi ${fossil.formation}, ${countryName}; interval ${intervalName} (${fossil.earlyAgeMa}-${fossil.lateAgeMa} juta tahun yang lalu).`,
        `Interval PBDB: ${intervalName} (${fossil.earlyAgeMa}-${fossil.lateAgeMa} juta tahun yang lalu).`,
        `Lokasi temuan fosil: ${fossil.locality}.`,
        `Formasi/grup: ${fossil.formation}.`,
        `Ekologi PBDB: makanan ${dietName.toLowerCase()}, kebiasaan hidup ${habitName}.`,
      ];
    }
    return profileAny.funFacts_id || profile.funFacts;
  }
  return profile.funFacts;
}

export function getProfileDescription(profile: AtlasProfile, locale: string): string {
  const isPrehistoric = profile.atlasMode === 'prehistoric';
  const profileAny = profile as any;
  if (locale === 'id') {
    if (profileAny.description_id) return profileAny.description_id;
    if (isPrehistoric && profile.fossil) {
      const fossil = profile.fossil;
      const countryName = countryMap[profile.country] || profile.country;
      const intervalName = intervalMap[fossil.interval] || fossil.interval;
      return `${profile.commonName} ditampilkan dari temuan fosil PBDB yang terverifikasi di Formasi ${fossil.formation}, ${countryName}. Temuan ini berasal dari interval ${intervalName} (${fossil.earlyAgeMa}-${fossil.lateAgeMa} juta tahun yang lalu), dengan bukti lokalitas yang dicatat sebagai ${fossil.locality}.`;
    }
  }
  return profile.description;
}

