# Project Overview

## General Information
- **Project Name:** World Wildlife Atlas (pets-world)
- **Project Type:** Single application (Next.js SPA with static export)
- **Primary Language:** TypeScript
- **Framework:** Next.js 16.2.3 (App Router)
- **Runtime Version:** Node.js 22+ (CI), React 19.2.4
- **Database:** None — static JSON data file (373KB, ~68 animals)
- **Cache/Queue:** None
- **Styling:** Tailwind CSS v4 + shadcn/ui (zinc base color)
- **Map Engine:** MapLibre GL (via react-map-gl v8)
- **Package Manager:** npm

## Purpose & Goals
World Wildlife Atlas is an **interactive educational web application** that displays indigenous animals from around the world on an interactive map. Users can explore animals by clicking map markers (emoji-based), filtering by continent/region, searching by animal name or country, and viewing detailed information including conservation status (IUCN Red List), taxonomy, habitat, diet, weight, lifespan, and fun facts.

The app serves as both a **visual encyclopedia** and an **engagement tool** with features like synthesized animal sounds (Web Audio API), Wikipedia image thumbnails, bilingual support (English/Indonesian), and a PWA-ready offline experience.

## Target Users
- Wildlife enthusiasts, students, and educators
- General public interested in biodiversity and conservation
- Indonesian and English-speaking audiences

## Key Features
1. **Interactive World Map** — MapLibre GL with emoji markers, clustering, and IUCN-colored dots
2. **Animal Detail Popups** — Desktop popup cards with Wikipedia images, conservation badges, fun facts
3. **Mobile-First Detail Panel** — Bottom-sheet pattern with touch-friendly controls
4. **Command Palette Search** — ⌘K powered search with IUCN status and classification filters
5. **Region Filtering** — Continent/region pill buttons for geographic filtering
6. **Virtualized Sidebar** — TanStack Virtual for performant list rendering at scale
7. **Bilingual i18n** — Full English (en) and Indonesian (id) translation support
8. **Audio Feedback** — Web Audio API synthesized sounds: click, hover, ding, and classification-specific animal representative sounds
9. **Map Styles** — Three tile styles: Voyager (colorful), Dark Matter, Minimal
10. **IUCN Legend** — Interactive conservation status color legend with zoom indicator
11. **Animal Detail Pages** — Server-rendered `/animal/[slug]` pages with full taxonomy, stats, and SEO metadata
12. **PWA Support** — Service worker, manifest.json, apple-touch-icon
13. **Static Export** — Full `next build && next export` for CDN hosting
14. **Random Animal** — Quick random selection with fly-to animation
15. **Accessibility** — `aria-label` on markers, `sr-only` status text, `prefers-reduced-motion` support

## Architecture
- **Frontend-only SPA** — No backend server, API routes, or database
- **Static JSON data** — All animal data lives in `src/data/animals.json`
- **Client-side rendering** for the map page, **server-side rendering** for `/animal/[slug]` detail pages
- **Zustand** for global state management (single store)
- **Component-based** architecture with clean separation of concerns

## Data Pipeline
- Python scripts in `scripts/` generate and expand the `animals.json` dataset
- `fetch_thumbnails.py` (root) fetches Wikipedia thumbnails
- Data is validated at runtime via Zod schemas
