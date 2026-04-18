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
| 📊 **IUCN Conservation Status** | Interactive legend and color-coded markers (LC → EX) with rich tooltips |
| 🌿 **Natura Design System** | Premium glassmorphic UI with forest-inspired palette and smooth animations |
| ⚖️ **Species Comparison** | Select and compare stats side-by-side across distinct species |
| 📈 **Population Trends** | Visual charts depicting population decline/growth over generations |
| 🌙 **Dark Mode** | Seamless transition to a stunning eye-friendly dark theme mapping |
| 📴 **Offline-First (PWA)** | Continue exploring the map offline with automatic caching strategies |
| 🔖 **Favorites Collection** | Curate and save a list of your most loved species locally |
| ✨ **AR Mode** | Immersive Augmented Reality visualization of species in mobile viewports |
| 📱 **Responsive** | Mobile-first design with dedicated sidebar, bottom sheet, and touch interactions |
| 🌐 **Bilingual** | English and Indonesian (Bahasa) interface toggle |
| 🎲 **Random Explorer** | Discover random species with one click |
| 🔊 **Audio Feedback** | Subtle hover, selection sounds, and actual animal vocalizations |
| ⚡ **Static Export** | Zero-server deployment — works on GitHub Pages, Netlify, Cloudflare Pages |
| 🧪 **Tested** | Robust unit tests covering state logic, user preferences, and data stability |
| 🐼 **API Enrichment** | Optional API-Ninjas integration for extended taxonomy data |

---

## 🚀 Demo

### Main Atlas View
Interactive map with sidebar species list, continent filters, region search, and IUCN legend tools.

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
git clone https://github.com/vuckuola619/pets-world.git
cd pets-world

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
├── components/             # Reusable UI Components
│   ├── MapView.tsx         # MapLibre map with Canvas filters
│   ├── ComparePanel.tsx    # Species Comparison logic
│   ├── PopulationChart.tsx # Population Chart rendering
│   ├── AROverlay.tsx       # Augmented Reality view
│   ├── Sidebar.tsx         # Virtualized species list
│   └── ui/                 # shadcn/ui primitives
├── data/                   # 186 species dataset + trends
├── hooks/                  # Custom state/UI hooks
├── store/                  # Zustand global state
├── lib/                    # Config and pure utility logic
├── types/                  # TypeScript signatures
└── test/                   # Vitest suite
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16 (App Router) | RSC, file-based routing, static export |
| UI | React 19 | Component architecture |
| Styling | Tailwind CSS 4 + Custom CSS | Natura design system |
| Map | MapLibre GL / Carto | Reliable vendor-agnostic raster maps |
| State | Zustand | Lightweight resilient global state |
| Storage | IndexedDB / LocalStorage | Offline favorites and sync |
| Testing | Vitest + RTL | Behavior and component testing |
| Animation | Motion (Framer) | Page transitions |

### Design System — "Natura"

The Natura theme provides a forest-inspired, premium aesthetic:

| Token | Value | Usage |
|-------|-------|-------|
| `--natura-forest` | `#1a3a2a` | Dark backgrounds, hero sections |
| `--natura-emerald` | `#10b981` | Primary accent, active states |
| `--natura-sage` | `#8fbc8f` | Muted accents, borders |
| `--natura-ocean` | `#0ea5e9` | Links, secondary accents |
| `--natura-surface` | `#f5faf7` | Page background |

---

## 🔒 Security & Reliability

- **Hydration Safe:** Robust state management ensuring DOM safety.
- **Resilient Delivery:** Map relies on secure Carto Voyager tiles over HTTPS.
- **CSP Headers:** Defined statically in `next.config.ts`.
- **Zero Server Footprint:** Fully functional statically generated architecture.

---

## 🛣️ Roadmap

- [x] Dark mode toggle
- [x] Species comparison tool
- [x] Audio integration
- [x] Offline-first (fully functioning Service Worker / caching)
- [x] User bookmarks / favorites saving
- [x] Species population trend charts
- [x] AR mode for mobile devices

> All roadmap targets achieved.

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with 🌿 by the Wildlife Atlas team
</p>

