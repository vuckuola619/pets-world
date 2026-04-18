# Changelog

All notable changes to the World Wildlife Atlas are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] — 2026-04-19

### 🩹 Hotfix & Image Fetch Update

#### Added
- **Wikipedia Thumbnail Integration** — Directly fetching and displaying real Wikipedia animal photos in the hero banner of the Animal Detail page, replacing emoji-only fallbacks.
- **Dynamic Map Theme** — The map style now automatically switches to "Minimal" (satellite) when standard Dark Mode is activated, satisfying visual aesthetic expectations natively.

#### Fixed
- **Page Scrolling** — Corrected a global `overflow-hidden` constraint that previously disabled scrolling on the detailed animal pages.
- **Wikipedia API 403 Forbidden Error** — Added correct `User-Agent` string with version pinning to API requests to ensure reliable image fetches.

## [1.1.0] — 2026-04-18

### 🎉 Hardened & Feature-Complete Release

#### Added
- **Dark & Minimal Modes** — Beautiful CSS-filter based map styles, removing external dependency on unstable style endpoints.
- **Species Comparison** — Dedicated panel allowing users to compare stats (lifespan, weight, diet) side-by-side.
- **Offline PWA Engine** — Service worker implementation capturing essential assets to allow continued usage without internet.
- **Favorites Collection** — Users can bookmark specific animals, persisting via robust Local Storage sync.
- **Population Trends** — Clean visual charts demonstrating historical species population dynamics.
- **AR View Mode** — Augmented Reality interface for devices with AR capability.
- **Animal Audio Data** — Full audio integration adding native roars and calls using the FindSounds API structure.

#### Changed
- **Stable Base Map Rendering** — Transitioned entirely to Carto Voyager raster tiles to ensure a 100% uptime map rendering experience without WebGL Context exhaustion.
- **Extended Tooltips** — Upgraded the IUCN legend overlay with rich descriptions, accessibility attributes, and overflow layout adjustments.

#### Fixed
- **Hydration Violations** — Rewrote `<Sidebar>` internal nodes from illegal nested `<button>` to accessible `div role="button"` to fully pass strict React 19 hydration checks.
- **Map Initialization Faults** — Shielded `queryRenderedFeatures` with a source layer lifecycle guard to avoid null invocations during rapid zooming.

## [1.0.0] — 2026-04-17

### 🎉 Initial Release

#### Added
- **Interactive Map** — Full MapLibre GL map with 186 species markers across 9 continents
- **Species Database** — Comprehensive JSON dataset with taxonomy, IUCN status, habitats, fun facts
- **Natura Design System** — Premium glassmorphic UI with forest-inspired color palette
- **Detail Pages** — Full-page species profiles at `/animal/{slug}` with hero banners, stat cards, taxonomy
- **Search** — ⌘K command palette with fuzzy search by name, country, or continent
- **Continent Filters** — Region-based filtering with emoji pills
- **Virtualized Sidebar** — TanStack Virtual-powered list handling 186+ items
- **IUCN Legend** — Color-coded conservation status overlay on the map
- **Mobile Responsive** — Bottom sheet detail panel, drawer sidebar for mobile viewports
- **Bilingual Support** — English and Indonesian (Bahasa) interface toggle
- **Random Explorer** — One-click random species discovery with map fly-to animation
- **Audio Feedback** — Subtle hover and selection sounds
- **API Enrichment** — Optional API-Ninjas integration for extended species data
- **PWA Support** — Service worker for offline capability, manifest for installability
- **Static Export** — Zero-server deployment (`output: 'export'`)
- **CI Pipeline** — GitHub Actions for automated testing, linting, and build verification
- **Unit Tests** — 16 tests across 5 suites (data integrity, store, components)
- **Security Headers** — X-Frame-Options, X-Content-Type-Options, Referrer-Policy configured

#### Tech Stack
- Next.js 16.2 (App Router)
- React 19.2
- Tailwind CSS 4.2
- MapLibre GL 5.23
- TypeScript 5.x
- Zustand 5
- Zod 4
- Vitest 4
