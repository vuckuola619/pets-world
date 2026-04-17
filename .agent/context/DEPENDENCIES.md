# Dependencies

## Production Dependencies

| Package | Version | Category | Purpose |
|---------|---------|----------|---------|
| `next` | 16.2.3 | Framework | React meta-framework with App Router |
| `react` | 19.2.4 | Core | UI library |
| `react-dom` | 19.2.4 | Core | React DOM renderer |
| `maplibre-gl` | ^5.23.0 | Map Engine | WebGL-based vector map rendering |
| `react-map-gl` | ^8.1.1 | Map Engine | React wrapper for MapLibre GL |
| `zustand` | ^5.0.12 | State | Lightweight global state management |
| `zod` | ^4.3.6 | Validation | Runtime schema validation |
| `@tanstack/react-query` | ^5.99.0 | Data Fetching | Server state management (registered, minimal use) |
| `@tanstack/react-virtual` | ^3.13.23 | UI Performance | Virtual scrolling for large lists |
| `motion` | ^12.38.0 | Animation | Framer Motion animation library |
| `lucide-react` | ^1.8.0 | Icons | SVG icon library |
| `@radix-ui/react-dialog` | ^1.1.15 | UI Primitive | Accessible dialog/modal |
| `@radix-ui/react-navigation-menu` | ^1.2.14 | UI Primitive | Navigation component |
| `@radix-ui/react-scroll-area` | ^1.2.10 | UI Primitive | Custom scrollbar areas |
| `@radix-ui/react-separator` | ^1.1.8 | UI Primitive | Visual separator |
| `@radix-ui/react-slot` | ^1.2.4 | UI Primitive | Polymorphic component slot |
| `@radix-ui/react-tabs` | ^1.1.13 | UI Primitive | Tab navigation |
| `class-variance-authority` | ^0.7.1 | Styling | Component variant management (shadcn) |
| `clsx` | ^2.1.1 | Styling | Conditional className utility |
| `tailwind-merge` | ^3.5.0 | Styling | Tailwind class deduplication |

## Development Dependencies

| Package | Version | Category | Purpose |
|---------|---------|----------|---------|
| `typescript` | ^5 | Language | Type safety |
| `@types/node` | ^20 | Types | Node.js type definitions |
| `@types/react` | ^19 | Types | React type definitions |
| `@types/react-dom` | ^19 | Types | React DOM type definitions |
| `tailwindcss` | ^4 | Styling | Utility-first CSS (v4 with CSS-native) |
| `@tailwindcss/postcss` | ^4 | Build | PostCSS plugin for Tailwind v4 |
| `postcss` | (peer) | Build | CSS post-processing |
| `shadcn` | ^4.2.0 | UI | shadcn/ui CLI for component generation |
| `vitest` | ^4.1.4 | Testing | Unit/integration test runner |
| `jsdom` | ^29.0.2 | Testing | DOM environment for tests |
| `@testing-library/react` | ^16.3.2 | Testing | React component testing utilities |
| `@testing-library/jest-dom` | ^6.9.1 | Testing | Custom DOM matchers |
| `@playwright/test` | ^1.59.1 | Testing | E2E browser testing |
| `eslint` | ^9 | Linting | Code quality analysis |
| `eslint-config-next` | 16.2.3 | Linting | Next.js ESLint rules |
| `prettier` | ^3.8.3 | Formatting | Code formatter |
| `prettier-plugin-tailwindcss` | ^0.7.2 | Formatting | Tailwind class sorting |
| `husky` | ^9.1.7 | Git Hooks | Pre-commit hook manager |
| `lint-staged` | ^16.4.0 | Git Hooks | Staged file linting |

## Dependency Categories Summary

| Category | Count | Key Packages |
|----------|-------|--------------|
| Core Framework | 3 | Next.js, React, React DOM |
| Map Engine | 2 | MapLibre GL, react-map-gl |
| UI/Styling | 9 | Radix UI (6), CVA, clsx, tailwind-merge |
| State & Data | 3 | Zustand, TanStack Query, Zod |
| Testing | 5 | Vitest, jsdom, RTL, Playwright |
| Tooling | 6 | TypeScript, ESLint, Prettier, Husky |

## Security Status
> **Note:** Run `npm audit` to check for vulnerabilities before deploying.

## Notable Version Constraints
- **Next.js 16** — Breaking changes from v15. Consult `AGENTS.md` before modifying framework code.
- **React 19** — New patterns, concurrent features. `use client` directives required.
- **Tailwind CSS v4** — Uses `@import "tailwindcss"` instead of v3 `@tailwind` directives.
- **Zod v4** — Different API surface from v3 in some areas.
