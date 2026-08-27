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

const PROXY_URL = '/api/ninjas';
const CACHE_PREFIX = 'api-ninjas-animal:';

/**
 * Fetches animal details from API-Ninjas with session caching.
 * Requests go through the same-origin Cloudflare Pages Function
 * (`functions/api/ninjas.ts`), which holds the real key server-side —
 * no credential ships in the client bundle. Without the function
 * (local `next dev`, or a deploy without it) the fetch 404s and this
 * returns null, which the UI already treats as "no extended data".
 */
export async function fetchAnimalDetails(animalName: string): Promise<ApiNinjasAnimal | null> {
  if (!animalName) return null;

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
      `${PROXY_URL}?name=${encodeURIComponent(animalName)}`,
      {
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return null;

    const best = (await res.json()) as ApiNinjasAnimal | null;
    if (!best) return null;

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
