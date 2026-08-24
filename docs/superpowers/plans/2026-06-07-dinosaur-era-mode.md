# Dinosaur Era Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-tested "Era Purba" mode that swaps the wildlife atlas into a PBDB-backed dinosaur fossil occurrence atlas.

**Architecture:** Add a small atlas-mode abstraction so existing map/sidebar/search components read from active records instead of directly from wildlife-only data. Keep curated dinosaur fossil records in a static TypeScript module, with source URLs and Zod validation. Reuse existing MapLibre, Zustand, React, and Vitest patterns.

**Tech Stack:** Next.js 16, React 19, TypeScript, Zustand, Zod, Vitest, MapLibre/react-map-gl.

---

## File Structure

- Modify `src/store/useMapStore.ts`: add `atlasMode`, `setAtlasMode`, and reset stale selection/filter state when switching.
- Create `src/data/dinosaurs.ts`: PBDB-backed dinosaur schema, curated records, region list, and wildlife-compatible record mapping.
- Create `src/hooks/useAtlasAnimals.ts`: active dataset and filtering helpers.
- Keep `src/hooks/useAnimals.ts`: compatibility wrapper that calls the new active helper.
- Modify `src/app/page.tsx`: add the Era Purba/Wildlife toggle, use active records for random selection and header counts.
- Modify `src/components/Sidebar.tsx`, `src/components/MobileSidebar.tsx`, `src/components/AnimalSearch.tsx`, `src/components/MapView.tsx`, `src/components/MobileDetailPanel.tsx`, `src/components/ComparePanel.tsx`: consume active records and render dinosaur evidence where the selected record is prehistoric.
- Modify `src/lib/iucn.ts`, `src/data/countries.ts`, `src/lib/schemas.ts`: allow `Extinct` status consistently without breaking existing user edits.
- Create/modify tests under `src/test/`: data, store, and active filtering contracts.

---

### Task 1: Failing Store And Active Atlas Tests

**Files:**
- Modify: `src/test/store.test.ts`
- Create: `src/test/dinosaurs.test.ts`
- Create: `src/test/atlasAnimals.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests that expect:

```ts
expect(useMapStore.getState().atlasMode).toBe('wildlife')
useMapStore.getState().setAtlasMode('prehistoric')
expect(useMapStore.getState().selectedId).toBeNull()
expect(useMapStore.getState().activeRegion).toBe('All')
```

Add dinosaur data tests that expect at least 30 records, all valid against `dinosaurSchema`, all source URLs starting with `https://paleobiodb.org/data1.2/`, and all regions include North America, South America, Europe, Africa, Asia, Oceania, and Antarctic.

Add active filtering tests that expect `getAtlasRecords('prehistoric')` to return dinosaur IDs and `filterAtlasRecords(...)` to search dinosaur names/countries/periods.

- [ ] **Step 2: Run RED verification**

Run: `npm run test:run -- src/test/store.test.ts src/test/dinosaurs.test.ts src/test/atlasAnimals.test.ts`

Expected: fail because `atlasMode`, dinosaur data, and atlas helpers do not exist yet.

---

### Task 2: Data Model And Valid PBDB Records

**Files:**
- Create: `src/data/dinosaurs.ts`
- Modify: `src/data/countries.ts`
- Modify: `src/lib/schemas.ts`
- Modify: `src/lib/iucn.ts`

- [ ] **Step 1: Create dinosaur schema**

Create a `dinosaurSchema` requiring ID, slug, names, country, region, coordinates, period, age range, formation/locality strings, ecology/diet strings, evidence note, PBDB taxon/occurrence IDs, and source URLs.

- [ ] **Step 2: Add curated records**

Use PBDB occurrence/taxon API fields only for placement and evidence. Each record source URL must be the exact PBDB occurrence query for its taxon, using `show=coords,phylo,ident,attr,loc,strat,time`.

- [ ] **Step 3: Add compatibility mapping**

Expose `dinosaursAsAnimals` with `AnimalEntry`-compatible fields so existing map/list components can render dinosaurs without a second component tree.

- [ ] **Step 4: Run GREEN verification for data tests**

Run: `npm run test:run -- src/test/dinosaurs.test.ts`

Expected: pass.

---

### Task 3: Store Mode And Active Dataset Helpers

**Files:**
- Modify: `src/store/useMapStore.ts`
- Create: `src/hooks/useAtlasAnimals.ts`
- Modify: `src/hooks/useAnimals.ts`

- [ ] **Step 1: Implement store mode**

Add:

```ts
type AtlasMode = 'wildlife' | 'prehistoric'
atlasMode: 'wildlife'
setAtlasMode: (mode) => set({
  atlasMode: mode,
  selectedId: null,
  hoveredId: null,
  sidebarHoveredId: null,
  activeRegion: 'All',
  compareIds: [],
  compareOpen: false,
})
```

- [ ] **Step 2: Implement active helpers**

Add pure helpers `getAtlasRecords(mode)`, `getAtlasRegions(mode)`, and `filterAtlasRecords(records, query, region)`, plus React hooks wrapping the store.

- [ ] **Step 3: Run GREEN verification for store/filtering tests**

Run: `npm run test:run -- src/test/store.test.ts src/test/atlasAnimals.test.ts`

Expected: pass.

---

### Task 4: UI Integration

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/components/MobileSidebar.tsx`
- Modify: `src/components/AnimalSearch.tsx`
- Modify: `src/components/MapView.tsx`
- Modify: `src/components/MobileDetailPanel.tsx`
- Modify: `src/components/ComparePanel.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add mode toggle**

Add a compact header button that switches between Wildlife and Era Purba and uses an existing icon from `lucide-react`.

- [ ] **Step 2: Replace wildlife-only imports**

Replace direct `countries`/`continents` usage in list/search/random/map flows with active atlas helpers.

- [ ] **Step 3: Add prehistoric visual state**

Add `.prehistoric-atlas` CSS variables/classes and prehistoric map canvas filter, marker class, and popup evidence block.

- [ ] **Step 4: Hide wildlife-only links for dinosaur records**

Do not render `/animal/{slug}` links for records where `atlasMode === 'prehistoric'`.

- [ ] **Step 5: Run targeted UI tests**

Run: `npm run test:run -- src/app/test/search.test.tsx src/test/compare.test.ts`

Expected: pass or update tests only if they were asserting wildlife-only labels.

---

### Task 5: Full Verification And Local Smoke

**Files:**
- No planned source edits unless verification reveals a defect.

- [ ] **Step 1: Run full unit tests**

Run: `npm run test:run`

Expected: all tests pass.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: exit 0.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: exit 0.

- [ ] **Step 4: Run local dev server**

Run: `npm run dev -- --port 3000`

Expected: app serves locally and both Wildlife and Era Purba modes render without console/runtime errors.
