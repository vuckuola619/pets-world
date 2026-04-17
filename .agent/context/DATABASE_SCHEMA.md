# Database Schema

## Database Type
**No database** — this project uses a static JSON file as its data source.

## Data Source
- **File:** `src/data/animals.json` (373KB)
- **Records:** 68+ animal entries
- **Validated:** At runtime via Zod schemas in `src/data/countries.ts` and `src/types/animal.ts`

---

## Schema Definitions

### Full Animal Schema (New Format — `src/types/animal.ts`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier |
| `slug` | string (min 1) | Yes | URL-safe slug for detail pages |
| `commonName` | string | Yes | Common animal name |
| `scientificName` | string | Yes | Latin scientific name |
| `taxonomy.kingdom` | string | Yes | Taxonomic kingdom |
| `taxonomy.phylum` | string | Yes | Taxonomic phylum |
| `taxonomy.class` | string | Yes | Taxonomic class |
| `taxonomy.order` | string | Yes | Taxonomic order |
| `taxonomy.family` | string | Yes | Taxonomic family |
| `taxonomy.genus` | string | Yes | Taxonomic genus |
| `iucnStatus` | enum | Yes | IUCN code: EX, EW, CR, EN, VU, NT, LC, DD, NE |
| `description` | string | Yes | Full text description |
| `habitat` | string[] | Yes | List of habitat types |
| `diet` | enum | Yes | Carnivore, Herbivore, Omnivore, Insectivore, Piscivore |
| `lifespan.min` | number | Yes | Minimum lifespan |
| `lifespan.max` | number | Yes | Maximum lifespan |
| `lifespan.unit` | literal "years" | Yes | Always "years" |
| `weight.min` | number | Yes | Minimum weight |
| `weight.max` | number | Yes | Maximum weight |
| `weight.unit` | enum | Yes | "kg" or "g" |
| `nativeRegions` | string[] | Yes | Geographic regions |
| `coordinates[].lat` | number (-90..90) | Yes | Latitude |
| `coordinates[].lng` | number (-180..180) | Yes | Longitude |
| `coordinates[].label` | string | No | Location label |
| `images[].url` | URL | Yes | Image source URL |
| `images[].credit` | string | Yes | Attribution |
| `images[].alt` | string | Yes | Alt text |
| `funFacts` | string[] | Yes | Fun fact entries (exactly 5) |
| `wikiUrl` | URL | No | Wikipedia article link |
| `iucnUrl` | URL | No | IUCN Red List page |
| `updatedAt` | datetime | Yes | ISO datetime string |

### Legacy Animal Schema (Map Components — `src/lib/schemas.ts`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier |
| `country` | string | Yes | Country name |
| `flag` | string | Yes | Country flag emoji |
| `lat` | number | Yes | Latitude (from coordinates[0]) |
| `lng` | number | Yes | Longitude (from coordinates[0]) |
| `region` | string | Yes | Continent/region name |
| `animal` | string | Yes | Common name (mapped from commonName) |
| `scientificName` | string | Yes | Latin scientific name |
| `emoji` | string | Yes | Animal emoji |
| `classification` | string | Yes | Animal class (Mammal, Bird, etc.) |
| `conservationStatus` | enum | Yes | Full text: Least Concern, Endangered, etc. |
| `indigenous` | boolean | Yes | Always `true` |
| `funFacts` | string[] | Yes | 5 fun fact strings |
| `habitat` | string | Yes | Comma-separated habitat string |
| `population` | string | Yes | Population estimate text |

### Additional JSON Fields (in animals.json, not in legacy schema)
- `taxonomy` — Full taxonomic classification object
- `diet` — Dietary classification
- `lifespan` — Min/max with unit
- `weight` — Min/max with unit
- `nativeRegions` — Array of native region strings
- `coordinates` — Array of lat/lng objects (multiple locations possible)
- `images` — Array of image objects with credits
- `wikiUrl`, `iucnUrl` — External reference links
- `iucnStatus` — Short IUCN code
- `description` — Full text description
- `habitatOld` — Legacy habitat string for backward compat

## Data Transformation

```
animals.json (raw)
  → countries.ts transforms each record:
     - coordinates[0].lat → lat
     - coordinates[0].lng → lng
     - commonName → animal
     - habitatOld || habitat.join(', ') → habitat (string)
  → Validates through legacy animalSchema.parse()
  → Exports as `countries: AnimalEntry[]`
```

## Data Integrity Rules (from tests)
- All entries must pass Zod schema validation
- No duplicate IDs
- All `funFacts` arrays must have exactly 5 items
- All entries must have `indigenous: true`
- Minimum 50 animals expected

## Entity Relationships

```
AnimalEntry (1)
  └── funFacts (5 strings)
  └── coordinates (1+ lat/lng points)
  └── images (1+ image objects)
  └── taxonomy (1 taxonomy object)
  └── habitat (1+ strings)
  └── nativeRegions (1+ strings)
```
