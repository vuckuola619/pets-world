# Business Domains

## Domain Map

```
┌─────────────────────────────────────────────────────┐
│                  World Wildlife Atlas                 │
├──────────┬──────────┬───────────┬───────────────────┤
│ Animals  │   Map    │   Search  │  Internationalization│
│ (data)   │ (visual) │ (discovery)│     (i18n)          │
├──────────┴──────────┴───────────┴───────────────────┤
│                  Audio (engagement)                   │
└─────────────────────────────────────────────────────┘
```

---

## Domain: Animals

### Models
- `Animal` (full schema) — Complete animal record with taxonomy, coordinates, images
- `AnimalEntry` (legacy) — Flat record used by map components

### Data Source
- `src/data/animals.json` — 68+ records, 373KB
- `src/data/countries.ts` — Zod-validated data loader with transformation

### Business Rules
- Every animal must pass Zod schema validation at import time
- Every animal must have exactly 5 fun facts
- Every animal must be `indigenous: true`
- No duplicate IDs allowed
- Coordinates must be valid lat/lng ranges (-90..90, -180..180)
- IUCN status must be one of: EX, EW, CR, EN, VU, NT, LC, DD, NE
- Diet must be one of: Carnivore, Herbivore, Omnivore, Insectivore, Piscivore

### API Surface
- `GET /animal/{slug}` — Pre-rendered detail page

### Data Pipeline
```
Python scripts (offline) → animals.json → Zod validation → Runtime usage
```

---

## Domain: Map Visualization

### Models
- `ViewState` — { longitude, latitude, zoom }
- `MapStyleName` — 'voyager' | 'dark' | 'satellite'

### Components
- `MapView.tsx` — Main map with markers, clusters, popups, IUCN legend
- `MapControls.tsx` — Zoom, reset, style switcher
- `MapSkeleton.tsx` — Loading state

### Business Rules
- Animals displayed as emoji markers on map with bounce animation
- Clustering enabled at zoom < 8, radius 50
- Cluster click expands to show individual markers
- Unclustered points colored by IUCN conservation status
- Desktop popup card appears on marker click with Wikipedia image
- Mobile uses bottom-sheet detail panel instead of popup
- Map styles: Voyager (default), Dark Matter, Minimal (no labels)
- Navigation controls at bottom-right, custom controls at top-right
- `prefers-reduced-motion` disables all animations, uses `jumpTo` instead of `flyTo`

### State
- `selectedId` — Currently selected animal (popup shown)
- `hoveredId` — Currently hovered animal (tooltip shown)
- `sidebarHoveredId` — Hovered in sidebar (highlight on map)
- `mapStyle` — Current tile style
- `viewState` — Map camera position (component-local, not in store)

---

## Domain: Search & Discovery

### Components
- `AnimalSearch.tsx` — ⌘K command palette
- `Sidebar.tsx` — Desktop sidebar with virtualized list
- `MobileSidebar.tsx` — Mobile bottom-sheet sidebar

### Business Rules
- Search triggered by ⌘K (or Ctrl+K), dismissed by ESC
- Searches across: animal name, scientific name, country name
- Filters: IUCN status chips (LC, NT, VU, EN, CR) + classification chips
- Sidebar search also filters across country name and animal name
- Region filter: "All" + dynamically extracted continent list
- Desktop sidebar uses TanStack Virtual for performance
- Animals grouped by classification with sticky headers
- Selected animal auto-scrolls into view in sidebar
- Mobile sidebar animates up from bottom (max 60vh)

### State
- `searchQuery` — Current search text
- `activeRegion` — Active continent filter
- `searchOpen` — Command palette open state
- `mobileOpen` — Mobile sidebar open state

---

## Domain: Internationalization (i18n)

### Models
- `Locale` — 'en' | 'id'
- `Translations` — Full translation string type

### Components
- `src/lib/i18n.ts` — Translation dictionaries

### Supported Locales
| Locale | Language | |
|--------|----------|---|
| `en` | English | Default |
| `id` | Indonesian (Bahasa Indonesia) | |

### Translated Content
- Page title, search placeholder, button labels
- Region names (All, Asia, Europe, Africa, Americas, etc.)
- Detail labels (Classification, Conservation, Population, Habitat, Fun Facts)
- Conservation status names
- IUCN status labels
- Classification names (Mammal, Bird, Reptile, etc.)
- Detail page labels (Taxonomy fields, Diet, Lifespan, Weight, etc.)
- Loading/error/try again messages

### Business Rules
- Locale toggle in header (EN ↔ ID)
- Locale stored in Zustand store
- All user-facing text uses `t(locale)` function
- Default locale: English

---

## Domain: Audio

### Models
- `AudioService` — Singleton class using Web Audio API

### Sound Types
| Sound | Trigger | Description |
|-------|---------|-------------|
| Click | Marker click, reset view | 880→1200Hz sine sweep, 200ms |
| Hover | Sidebar item hover | 600Hz sine, 80ms, very quiet |
| Ding | Random animal selection | C5→E5 triangle, 300ms |
| Animal | Sound button in popup | Classification-specific (freq, type, duration, LFO) |

### Classification Sound Profiles
| Class | Frequency | Waveform | Duration |
|-------|-----------|----------|----------|
| Mammal | 200→400Hz | Sawtooth + LFO | 400ms |
| Bird | 1200→2000Hz | Sine + LFO | 300ms |
| Reptile | 100→50Hz | Sawtooth | 500ms |
| Fish | 300→100Hz | Sine | 600ms |
| Insect | 3000→5000Hz | Sawtooth | 100ms |

### Business Rules
- AudioContext created lazily on first sound
- All audio errors caught silently (user may have blocked audio)
- Sound button toggles between 🔈 and 🔊 states

---

## Domain: PWA

### Components
- `ServiceWorkerRegistrar.tsx` — Registers `/sw.js`
- `public/sw.js` — Basic service worker
- `public/manifest.json` — App manifest

### Business Rules
- App installable on mobile devices
- Theme color: #2D8A00 (IUCN Least Concern green)
- Display mode: standalone
- Icons: 192x192 and 512x512 PNG
