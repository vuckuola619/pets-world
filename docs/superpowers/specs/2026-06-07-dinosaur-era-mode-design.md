# Dinosaur Era Mode Design

## Goal

Add an optional "Era Purba" map mode to World Wildlife Atlas. When enabled, the atlas changes from modern wildlife into a prehistoric dinosaur atlas: the map uses an ancient-earth visual treatment and the markers/sidebar show dinosaurs tied to real fossil occurrence evidence by region.

## Data Requirements

- Dinosaur records must be curated, source-backed, and non-avian dinosaur taxa only.
- Each dinosaur marker must include:
  - common/scientific name
  - region and modern country of fossil occurrence
  - latitude/longitude from a fossil occurrence record
  - geological interval and age range in Ma from PBDB occurrence fields
  - formation/group/locality detail from PBDB occurrence fields, or an explicit "Not listed in PBDB" value
  - diet/ecology from PBDB taxon ecospace fields, or an explicit "Not listed in PBDB" value
  - a short evidence note written from the occurrence/taxon fields
  - a source URL to the exact PBDB API query used for verification
- The initial dataset must include at least 30 curated records across North America, South America, Europe, Africa, Asia, Oceania, and Antarctica where PBDB has usable coordinates.
- The app must validate dinosaur records with Zod in tests. Records without coordinates, source URLs, names, region, country, or age/interval evidence are rejected.

Primary data source: Paleobiology Database Data Service 1.2, because it exposes fossil occurrences with taxon, location, time, stratigraphy, and bibliographic reference IDs. Museum pages may be used for user-facing explanatory copy, but map coordinates and occurrence evidence come from PBDB.

## Product Behavior

- Add a visible header toggle labeled "Era Purba" / "Wildlife".
- Wildlife mode remains the default.
- Switching to Era Purba:
  - clears selected/hovered IDs to prevent stale wildlife selection
  - changes the map canvas filter to a warmer fossil/ancient-earth palette
  - changes marker styling to dinosaur/fossil markers
  - swaps sidebar, search, random, and popup data from `countries` to dinosaur records
  - updates counters from "species" to "dinosaurs"
  - keeps existing region filters, search, favorites, and comparison behavior where they still make sense
- Switching back to Wildlife restores existing behavior and data.

## UI Design

Use the "Scientific Museum Atlas" direction:

- restrained prehistoric palette, not a game screen
- parchment/amber fossil badges in popups
- dinosaur emoji markers with PBDB evidence labels
- source/evidence copy visible in the popup rather than hidden behind a separate research page
- no new landing page

The implementation should reuse existing full-screen map, sidebar, popup, mobile sheet, and map control patterns. Avoid creating a parallel app shell.

## Technical Design

Add a small data abstraction rather than branching every component on raw imports:

- `src/data/dinosaurs.ts`
  - Zod schema
  - curated PBDB-backed dinosaur records
  - `dinosaurRegions`
  - helper to map dinosaur records into the existing marker/list surface
- `src/hooks/useAtlasAnimals.ts`
  - selects wildlife or dinosaur records based on store mode
  - applies search and region filtering
- `src/store/useMapStore.ts`
  - add `atlasMode: 'wildlife' | 'prehistoric'`
  - add `setAtlasMode`
  - reset selection/hover state and active region on mode switch
- UI components update imports from `useFilteredAnimals`/`countries` to the active atlas helpers where needed.

Keep the existing animal detail route unchanged for dinosaur records in the first release. Dinosaur popups should not link to `/animal/{slug}` unless a dinosaur detail page exists.

## Testing

Follow test-first implementation:

- store test: switching atlas mode resets stale selected/hovered IDs and active region
- data test: all dinosaur records validate, have unique IDs, coordinates, source URLs, country/region, and PBDB evidence
- filtering test: prehistoric mode filters/searches dinosaur records instead of wildlife records
- component test: header/sidebar exposes the mode toggle and prehistoric count text

Verification before completion:

- `npm run test:run`
- `npm run lint`
- `npm run build`
- local dev server smoke test in browser for both modes

## Out Of Scope

- full fossil database import UI
- live PBDB network calls from the client
- dinosaur detail pages
- paleogeographic plate reconstruction; the map uses modern fossil discovery coordinates
