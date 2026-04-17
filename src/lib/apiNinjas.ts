/**
 * API-Ninjas Animals API client
 * @see https://api-ninjas.com/api/animals
 */

/** Shape of each characteristic field from the API */
export interface ApiNinjasAnimal {
  name: string;
  taxonomy: {
    kingdom?: string;
    phylum?: string;
    class?: string;
    order?: string;
    family?: string;
    genus?: string;
    scientific_name?: string;
  };
  locations: string[];
  characteristics: {
    prey?: string;
    name_of_young?: string;
    group_behavior?: string;
    estimated_population_size?: string;
    biggest_threat?: string;
    most_distinctive_feature?: string;
    gestation_period?: string;
    habitat?: string;
    diet?: string;
    average_litter_size?: string;
    lifestyle?: string;
    common_name?: string;
    number_of_species?: string;
    location?: string;
    slogan?: string;
    group?: string;
    color?: string;
    skin_type?: string;
    top_speed?: string;
    lifespan?: string;
    weight?: string;
    height?: string;
    age_of_sexual_maturity?: string;
    age_of_weaning?: string;
    [key: string]: string | undefined;
  };
}

const API_BASE = 'https://api.api-ninjas.com/v1/animals';
const API_KEY = process.env.NEXT_PUBLIC_API_NINJAS_KEY ?? '';
const CACHE_PREFIX = 'api-ninjas-animal:';

/** Fetches animal details from API-Ninjas with session caching */
export async function fetchAnimalDetails(animalName: string): Promise<ApiNinjasAnimal | null> {
  if (!API_KEY || !animalName) return null;

  // Check sessionStorage cache first
  const cacheKey = `${CACHE_PREFIX}${animalName.toLowerCase()}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached) as ApiNinjasAnimal;
  } catch {
    // sessionStorage unavailable (SSR) — continue without cache
  }

  try {
    const res = await fetch(
      `${API_BASE}?name=${encodeURIComponent(animalName)}`,
      {
        headers: { 'X-Api-Key': API_KEY },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return null;

    const data: ApiNinjasAnimal[] = await res.json();
    if (!data.length) return null;

    // Find the best match (exact name match first, then first result)
    const best = data.find(
      (d) => d.name.toLowerCase() === animalName.toLowerCase()
    ) ?? data[0];

    // Cache in sessionStorage
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(best));
    } catch {
      // Storage full — skip caching
    }

    return best;
  } catch {
    return null;
  }
}
