# Development Guide

## Prerequisites
- **Node.js** 22+ (specified in CI)
- **npm** (package manager — lock file committed)
- **Git** (version control)

## Setup

```bash
# 1. Navigate to project
cd pets-world

# 2. Install dependencies
npm ci

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables
**None required** — this is a fully static application with no backend secrets.

## Available Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev` | Start dev server with hot reload |
| `build` | `next build` | Build static export to `out/` |
| `start` | `next start` | Serve production build locally |
| `lint` | `eslint` | Run ESLint |
| `lint:fix` | `eslint --fix .` | Auto-fix lint issues |
| `format` | `prettier --write .` | Format all files |
| `test` | `vitest` | Run tests in watch mode |
| `test:run` | `vitest run` | Run tests once (CI) |
| `test:coverage` | `vitest run --coverage` | Run tests with coverage |

## Running Tests

```bash
# Watch mode (development)
npm test

# Single run (CI)
npm run test:run

# With coverage
npm run test:coverage
```

### Test Structure
- `src/test/data.test.ts` — Validates all animal data against Zod schemas
- `src/test/store.test.ts` — Tests Zustand store behavior
- `src/test/setup.ts` — Vitest setup (imports `@testing-library/jest-dom`)
- `vitest.config.ts` — jsdom environment, path aliases

## Building for Production

```bash
# Static export (generates out/ directory)
npm run build
```

The build process:
1. Compiles TypeScript
2. Generates static pages for all `/animal/[slug]` routes via `generateStaticParams()`
3. Exports to `out/` directory (configured via `output: 'export'` in next.config.ts)

## Deployment
- **Static hosting** — Upload `out/` to any CDN (Vercel, Netlify, GitHub Pages, Cloudflare Pages)
- **PWA-ready** — Service worker and manifest are included
- Build output is fully self-contained with no server runtime needed

## CI/CD Pipeline
- **GitHub Actions** (`.github/workflows/ci.yml`)
- Triggers on push/PR to `master`
- Two jobs:
  - `test` — `npm ci` → `vitest run` → `next build`
  - `lint` — `npm ci` → `next lint`
- Runs on `ubuntu-latest` with Node.js 22

## Coding Conventions

### File Naming
- Components: `PascalCase.tsx` (e.g., `MapView.tsx`)
- Hooks: `camelCase.ts` prefixed with `use` (e.g., `useAnimals.ts`)
- Utilities: `camelCase.ts` (e.g., `utils.ts`)
- Types: `camelCase.ts` (e.g., `animal.ts`)
- Tests: `*.test.ts` (e.g., `data.test.ts`)

### Component Patterns
- All client components use `"use client"` directive
- All components export `React.JSX.Element` return types
- JSDoc comments on every exported function
- Zustand store accessed via hooks or `getState()` for callbacks

### Styling
- Tailwind CSS v4 with `@import "tailwindcss"` syntax
- shadcn/ui components in `src/components/ui/`
- `cn()` utility for conditional classes
- Custom CSS animations in `globals.css` (marker bounce, sidebar slide, fade-in)
- `prefers-reduced-motion` respected

### Code Quality
- **TypeScript strict mode** enabled
- **ESLint 9** with Next.js config
- **Prettier** with Tailwind class sorting plugin
- **Husky + lint-staged** for pre-commit checks

### Data Patterns
- All data validated through Zod schemas at import time
- Dual schema system: Full `AnimalSchema` (new) + Legacy `animalSchema` (map compat)
- Countries exported as pre-parsed, validated array
