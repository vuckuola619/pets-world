<p align="center">
  <img src="public/icon-512.png" width="80" alt="World Wildlife Atlas" />
</p>

<h1 align="center">🌍 World Wildlife Atlas</h1>

<p align="center">
  <strong>Interactive Species Explorer — Discover 186+ Wildlife Species Across 9 Continents</strong>
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#demo">Demo</a> ·
  <a href="#getting-started">Getting Started</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#contributing">Contributing</a> ·
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-black?logo=nextdotjs" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.2-61dafb?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-4.2-06b6d4?logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/MapLibre-5.23-orange?logo=maplibre" alt="MapLibre" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🗺️ **Interactive Globe** | Full MapLibre GL map with zoom, pan, and marker clustering across all continents |
| 🦁 **186+ Species** | Comprehensive database with taxonomy, IUCN status, habitats, and fun facts |
| 🔍 **Instant Search** | Fuzzy search by species name, country, or continent with keyboard shortcuts (⌘K) |
| 📊 **IUCN Conservation Status** | Color-coded markers (LC → EX) with interactive legend |
| 🌿 **Natura Design System** | Premium glassmorphic UI with forest-inspired palette and smooth animations |
| 📱 **Responsive** | Mobile-first design with dedicated sidebar, bottom sheet, and touch interactions |
| 🌐 **Bilingual** | English and Indonesian (Bahasa) interface toggle |
| 🎲 **Random Explorer** | Discover random species with one click |
| 🔊 **Audio Feedback** | Subtle hover and selection sounds for enhanced UX |
| ⚡ **Static Export** | Zero-server deployment — works on GitHub Pages, Netlify, Cloudflare Pages |
| 🧪 **Tested** | 16 unit tests covering data integrity, store logic, and component rendering |
| 🐼 **API Enrichment** | Optional API-Ninjas integration for extended taxonomy data |

---

## 🚀 Demo

### Main Atlas View
Interactive map with sidebar species list, continent filters, and IUCN legend.

### Species Detail Page
Full-page species profile with hero banner, stat cards, taxonomy tree, fun facts, and related species.

> Visit `/animal/{slug}` for any species (e.g., `/animal/giant-panda`, `/animal/bengal-tiger`)

---

## 📋 Getting Started

### Prerequisites

- **Node.js** 22+ (LTS recommended)
- **npm** 10+

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/world-wildlife-atlas.git
cd world-wildlife-atlas

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Optional: API-Ninjas key for extended species data
# Get a free key at https://api-ninjas.com
NEXT_PUBLIC_API_NINJAS_KEY=your_api_key_here
```

> **Note:** The app works fully without the API key. The key enables extended data (top speed, gestation period, threats) on detail pages.

### Development

```bash
# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build & Export

```bash
# Build static export
npm run build

# The output is in the `out/` directory — deploy anywhere
```

### Testing

```bash
# Run all tests
npm run test:run

# Watch mode
npm test

# With coverage
npm run test:coverage
```

### Linting & Formatting

```bash
# Lint
npm run lint

# Format
npm run format
```

---

## 🏗️ Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── animal/[slug]/      # Dynamic species detail pages
│   ├── globals.css         # Natura design system tokens
│   ├── layout.tsx          # Root layout (fonts, meta, SW)
│   ├── page.tsx            # Main atlas page
│   ├── loading.tsx         # Skeleton loading state
│   └── error.tsx           # Error boundary
├── components/
│   ├── MapView.tsx         # MapLibre GL map with popups
│   ├── Sidebar.tsx         # Virtualized species list (desktop)
│   ├── MobileSidebar.tsx   # Sheet-based sidebar (mobile)
│   ├── MobileDetailPanel.tsx # Bottom sheet species detail
│   ├── AnimalSearch.tsx    # ⌘K command palette search
│   ├── MapControls.tsx     # Zoom, reset, style controls
│   ├── AudioService.ts    # Sound effect manager
│   └── ui/                # shadcn/ui primitives
├── data/
│   ├── animals.json        # 186 species dataset
│   └── countries.ts        # Zod schema + parser
├── hooks/
│   ├── useAnimals.ts       # Filtered animal list hook
│   └── useAnimalDetails.ts # API-Ninjas enrichment hook
├── store/
│   └── useMapStore.ts      # Zustand global state
├── lib/
│   ├── iucn.ts             # IUCN status config & colors
│   ├── i18n.ts             # Internationalization strings
│   └── utils.ts            # Utility functions
├── types/
│   └── api-ninjas.ts       # API type definitions
└── test/                   # Vitest unit tests
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16 (App Router) | RSC, file-based routing, static export |
| UI | React 19 | Component architecture |
| Styling | Tailwind CSS 4 + Custom CSS | Natura design system |
| Components | shadcn/ui + Radix | Accessible UI primitives |
| Map | MapLibre GL + react-map-gl | Vector tile map rendering |
| State | Zustand | Lightweight global state |
| Virtualization | TanStack Virtual | 186-item sidebar performance |
| Validation | Zod 4 | Runtime data schema validation |
| Animation | Motion (Framer) | Page transitions & micro-animations |
| Testing | Vitest + Testing Library | Unit & component tests |
| Linting | ESLint + Prettier | Code quality & formatting |

### Design System — "Natura"

The Natura theme provides a forest-inspired, premium aesthetic:

| Token | Value | Usage |
|-------|-------|-------|
| `--natura-forest` | `#1a3a2a` | Dark backgrounds, hero sections |
| `--natura-emerald` | `#10b981` | Primary accent, active states |
| `--natura-sage` | `#8fbc8f` | Muted accents, borders |
| `--natura-ocean` | `#0ea5e9` | Links, secondary accents |
| `--natura-surface` | `#f5faf7` | Page background |

Typography: **Inter** (body) + **Outfit** (headings) via `next/font/google`.

---

## 🗂️ Data Model

Each species entry follows this schema:

```typescript
{
  id: string;
  slug: string;
  commonName: string;
  scientificName: string;
  country: string;
  flag: string;
  emoji: string;
  classification: string;       // Mammal, Bird, Reptile, etc.
  region: string;               // Continent
  conservationStatus: string;   // IUCN Red List status
  diet: string;                 // Herbivore, Carnivore, Omnivore
  coordinates: [{ lat, lng }];
  taxonomy: { kingdom, phylum, class, order, family, genus };
  lifespan: { min, max, unit };
  weight: { min, max, unit };
  funFacts: string[];
  description: string;
  habitat: string[];
}
```

---

## 🧪 Testing

The project maintains **16 passing tests** across 5 test suites:

| Suite | Tests | Coverage |
|-------|-------|----------|
| `data.test.ts` | 5 | Schema validation, ID uniqueness, coordinate bounds |
| `store.test.ts` | 7 | Zustand store operations, state transitions |
| `skeleton.test.tsx` | 1 | Loading skeleton rendering |
| `loading.test.tsx` | 2 | Loading page display |
| `search.test.tsx` | 1 | Search functionality |

```bash
✓ src/test/store.test.ts (7 tests)
✓ src/test/data.test.ts (5 tests)
✓ src/app/test/skeleton.test.tsx (1 test)
✓ src/app/test/loading.test.tsx (2 tests)
✓ src/app/test/search.test.tsx (1 test)

Test Files  5 passed (5)
     Tests  16 passed (16)
```

---

## 🚢 Deployment

The app is statically exported (`output: 'export'`) — no server required.

### GitHub Pages

```yaml
# .github/workflows/deploy.yml (included)
# Automatically builds and deploys on push to master
```

### Vercel / Netlify / Cloudflare Pages

1. Connect your GitHub repo
2. Set build command: `npm run build`
3. Set output directory: `out`
4. Add `NEXT_PUBLIC_API_NINJAS_KEY` as environment variable (optional)

### Docker

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/out /usr/share/nginx/html
EXPOSE 80
```

---

## 🔒 Security

- **CSP Headers** configured via `next.config.ts` (X-Frame-Options, X-Content-Type-Options)
- **No server-side secrets** — fully static client-side app
- **API key** (if used) is a free-tier public key with rate limiting
- **Zod validation** on all imported data
- **Dependencies** auditable via `npm audit`

---

## 🛣️ Roadmap

- [ ] Dark mode toggle (Natura Dark theme tokens already defined)
- [ ] Species comparison tool
- [ ] FindSounds.com audio integration
- [ ] Offline-first with enhanced service worker caching
- [ ] User bookmarks / favorites (localStorage)
- [ ] Species population trend charts
- [ ] AR mode for mobile devices

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **IUCN Red List** — Conservation status data
- **API-Ninjas** — Extended animal taxonomy API
- **MapLibre** — Open-source map rendering
- **Next.js** — React framework
- **shadcn/ui** — Accessible UI components

---

<p align="center">
  Built with 🌿 by the Wildlife Atlas team
</p>
