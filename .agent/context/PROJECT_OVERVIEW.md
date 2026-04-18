# Project Overview

## General Information
- **Project Name:** World Wildlife Atlas (pets-world)
- **Project Type:** Single application (Next.js SPA with static export)
- **Primary Language:** TypeScript
- **Framework:** Next.js 16.2.3 (App Router)
- **Runtime Version:** Node.js 22+ (CI), React 19.2.4
- **Database:** None — static JSON data file (373KB, ~186 animals)
- **Cache/Queue:** IndexedDB/LocalStorage (Favorites, Theme)
- **Styling:** Tailwind CSS v4 + shadcn/ui (zinc base color)
- **Map Engine:** MapLibre GL (Carto Voyager raster tiles)
- **Package Manager:** npm

## Purpose & Goals
World Wildlife Atlas is an **interactive educational web application** that displays indigenous animals from around the world on an interactive map. Users can explore animals by clicking map markers (emoji-based), filtering by continent/region, searching by animal name or country, comparing species side-by-side, analyzing population trends, and viewing detailed information including conservation status (IUCN Red List), taxonomy, habitat, diet, weight, lifespan, and fun facts.

The app serves as both a **visual encyclopedia** and an **engagement tool** with features like AR Views, synthesized animal sounds (Web Audio API), Wikipedia image thumbnails, bilingual support (English/Indonesian), offline-first PWA caching support, and dark mode capabilities.

## Target Users
- Wildlife enthusiasts, students, and educators
- General public interested in biodiversity and conservation
- Indonesian and English-speaking audiences

## Key Features
1. **Interactive World Map** — MapLibre GL with Carto Voyager tiles, clustering, and IUCN-colored dots
2. **Animal Detail Popups** — Desktop popup cards with Wikipedia images, conservation badges, fun facts
3. **Mobile-First Detail Panel** — Bottom-sheet pattern with touch-friendly controls
4. **Command Palette Search** — ⌘K powered search with IUCN status and classification filters
5. **Region Filtering** — Continent/region pill buttons for geographic filtering
6. **Virtualized Sidebar** — TanStack Virtual for performant list rendering at scale
7. **Bilingual i18n** — Full English (en) and Indonesian (id) translation support
8. **Audio Feedback** — Native animal vocalizations via FindSounds, UI clicks/dings
9. **Map Styles & Visual Modes** — Reliable Voyager tiles manipulated iteratively with CSS Canvas Filters (Dark & Minimal mode)
10. **IUCN Legend** — Rich, interactive conservation status color legend tooltips
11. **Species Comparison** — Dedicated panel allowing 1-to-1 attribute comparisons
12. **Population Trends** — Time-series population charts derived from JSON
13. **AR View Mode** — Immersive Augmented Reality features via dedicated overlays
14. **Favorites System** — Local storage preserved bookmarking of animals
15. **Animal Detail Pages** — Server-rendered `/animal/[slug]` pages with full taxonomy, stats, and SEO metadata
16. **PWA Support** — Fully robust service worker, caching core application data for offline availability
17. **Static Export** — Full `next build && next export` for CDN hosting
18. **Random Animal** — Quick random selection with fly-to animation

## Architecture
- **Frontend-only SPA** — No backend server, API routes, or database. Highly secure and edge-independent.
- **Static JSON data** — All animal data lives in `src/data/animals.json`
- **State** — Zustand for scalable global state management across interactions (Theme, Map, Comparisons, Favorites)
- **Component-based** architecture with clean separation of concerns and robust hydration fault-proofing

## Data Pipeline
- Python scripts in `scripts/` generate and expand the `animals.json` dataset
- `fetch_thumbnails.py` (root) fetches Wikipedia thumbnails
- Data is strictly validated at runtime via Zod schemas

## Testing Profile
- High-coverage Vitest implementation with React Testing Library integrations.
- Currently passing 48 tests across 9 test suites validating state (store/favorites/compare/theme), data structures, component structural renditions, and search UI states.
