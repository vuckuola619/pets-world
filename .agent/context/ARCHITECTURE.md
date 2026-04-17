# Architecture

## System Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Browser (Client)                   │
│  ┌────────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ MapView    │  │ Sidebar  │  │ AnimalSearch     │ │
│  │ (MapLibre) │  │ (Virtual)│  │ (⌘K Palette)    │ │
│  └─────┬──────┘  └────┬─────┘  └────────┬─────────┘ │
│        │               │                 │           │
│        └───────┬───────┴────────┬────────┘           │
│                ▼                ▼                     │
│  ┌──────────────────────────────────────────────┐    │
│  │           Zustand Store (useMapStore)         │    │
│  │  selectedId, hoveredId, searchQuery,          │    │
│  │  activeRegion, mapStyle, locale, mobileOpen   │    │
│  └──────────────────┬───────────────────────────┘    │
│                     ▼                                │
│  ┌──────────────────────────────────────────────┐    │
│  │        Static Data Layer                      │    │
│  │  animals.json → countries.ts (Zod-validated)  │    │
│  └──────────────────────────────────────────────┘    │
│                     │                                │
│                     ▼                                │
│  ┌──────────────────────────────────────────────┐    │
│  │       External APIs (runtime)                 │    │
│  │  • Wikipedia REST API (thumbnails)            │    │
│  │  • CARTO Basemaps (map tiles)                 │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
                      │
                      ▼ (build time)
┌──────────────────────────────────────────────────────┐
│               Static Export (output: 'export')        │
│  • /index.html          → Map SPA                     │
│  • /animal/[slug].html  → Pre-rendered detail pages   │
│  • /_next/              → JS/CSS chunks               │
│  • /manifest.json       → PWA manifest                │
│  • /sw.js               → Service worker              │
└──────────────────────────────────────────────────────┘
```

## Directory Structure

```
pets-world/
├── .github/workflows/ci.yml       → GitHub Actions CI (lint + test + build)
├── public/                         → Static assets
│   ├── manifest.json               → PWA manifest
│   ├── sw.js                       → Service worker (basic cache)
│   ├── icon-192.png / icon-512.png → PWA icons
│   └── *.svg                       → Next.js default assets
├── scripts/                        → Python data generation scripts
│   ├── add_animals_batch1.py       → Bulk animal data insertion
│   ├── animals_data.py             → Animal data definitions
│   ├── expand.py / expand_animals.py → Data expansion utilities
│   ├── fetch_thumbnails_v*.py      → Wikipedia thumbnail fetchers
│   └── run_expand.py               → Expansion runner
├── src/
│   ├── app/                        → Next.js App Router
│   │   ├── layout.tsx              → Root layout (Inter font, PWA heads)
│   │   ├── page.tsx                → Home page (map + sidebar + controls)
│   │   ├── globals.css             → Tailwind v4 + shadcn + custom animations
│   │   ├── error.tsx               → Error boundary
│   │   ├── loading.tsx             → Loading fallback
│   │   └── animal/[slug]/          → Dynamic animal detail pages
│   │       ├── page.tsx            → SSG detail page with generateStaticParams
│   │       └── loading.tsx         → Detail page skeleton
│   ├── components/                 → UI components
│   │   ├── MapView.tsx             → Main map with markers, clusters, popups
│   │   ├── Sidebar.tsx             → Desktop sidebar with virtualized list
│   │   ├── MobileSidebar.tsx       → Mobile bottom-sheet sidebar
│   │   ├── MobileDetailPanel.tsx   → Mobile animal detail panel
│   │   ├── AnimalSearch.tsx        → ⌘K command palette search
│   │   ├── MapControls.tsx         → Zoom, reset, style switcher
│   │   ├── MapSkeleton.tsx         → Map loading skeleton
│   │   ├── AnimalListSkeleton.tsx  → Sidebar loading skeleton
│   │   ├── AudioService.ts        → Web Audio API singleton (sounds)
│   │   ├── ServiceWorkerRegistrar.tsx → SW registration
│   │   └── ui/                    → shadcn/ui components
│   │       ├── badge.tsx, button.tsx, card.tsx
│   │       ├── input.tsx, separator.tsx, tooltip.tsx
│   ├── data/
│   │   ├── animals.json            → Primary data (373KB, 68+ animals)
│   │   └── countries.ts            → Zod-validated data loader
│   ├── hooks/
│   │   ├── useAnimals.ts           → Filtered/searched animal list hook
│   │   └── useAnimalMedia.ts       → Wikipedia thumbnail fetcher hook
│   ├── lib/
│   │   ├── i18n.ts                 → Bilingual translation strings (en/id)
│   │   ├── iucn.ts                 → IUCN conservation status colors/labels
│   │   ├── schemas.ts             → Legacy Zod schema
│   │   └── utils.ts               → cn() utility (clsx + tailwind-merge)
│   ├── store/
│   │   └── useMapStore.ts          → Zustand global state store
│   ├── test/
│   │   ├── data.test.ts            → Data validation tests
│   │   ├── store.test.ts           → Store behavior tests
│   │   └── setup.ts               → Vitest setup
│   └── types/
│       └── animal.ts               → Full Animal schema (new format with taxonomy)
├── components.json                 → shadcn/ui config
├── next.config.ts                  → Static export, security headers, image config
├── tsconfig.json                   → TypeScript strict mode, bundler resolution
├── vitest.config.ts                → Vitest with jsdom, path aliases
├── eslint.config.mjs               → ESLint 9 flat config
├── postcss.config.mjs              → PostCSS with @tailwindcss/postcss
├── .prettierrc                     → Prettier config
├── AGENTS.md                       → Next.js 16 agent rules (breaking changes warning)
├── CLAUDE.md                       → Minimal agent notes
└── package.json                    → Dependencies & scripts
```

## Design Patterns

| Pattern | Usage |
|---------|-------|
| **Component Composition** | Page → Sidebar + MapView + AnimalSearch |
| **Zustand Store** | Single flat store for all map state |
| **Zod Runtime Validation** | Data validated on import via `animalSchema.parse()` |
| **Singleton Service** | `AudioService` as module-level singleton |
| **Custom Hooks** | `useFilteredAnimals`, `useAnimalMedia` for data logic |
| **Virtualized Lists** | TanStack Virtual for sidebar performance |
| **Static Site Generation** | `generateStaticParams()` for all `/animal/[slug]` pages |
| **Barrel Exports** | Types re-exported from `data/countries.ts` |

## Data Flow

```
animals.json (static)
  → countries.ts (Zod parse + transform)
    → useFilteredAnimals() (search + region filter via Zustand state)
      → Sidebar.tsx (virtualized list) + MapView.tsx (GeoJSON markers)
        → useMapStore (selectedId, hoveredId)
          → MapView popup + MobileDetailPanel
            → useAnimalMedia() (Wikipedia API fetch)
```

## Authentication
- **None** — this is a public educational application with no auth

## Error Handling
- `error.tsx` — Global error boundary with retry button (bilingual)
- `loading.tsx` — Global loading fallback (bilingual)
- `animal/[slug]/loading.tsx` — Detail page skeleton loader
- Audio errors caught silently with `console.warn`
- Wikipedia API failures caught silently (fallback to emoji)
- Zod validation errors throw at build time (fail-fast)

## Security Headers (next.config.ts)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
