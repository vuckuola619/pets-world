# Context Index

> **This file is the FIRST reference** for the AI agent.
> Read this file before writing ANY new code.
> Last generated: 2026-04-18T03:42:00+07:00

## Quick Reference
- **Stack:** TypeScript + Next.js 16 (App Router) + Tailwind CSS v4 + React 19
- **Architecture:** Client-side SPA with static export (`output: 'export'`)
- **UI Library:** shadcn/ui (zinc base) + Radix UI + Lucide icons
- **State Management:** Zustand (single `useMapStore`)
- **Map Engine:** MapLibre GL via react-map-gl
- **Schema Validation:** Zod v4
- **Data Fetching:** TanStack React Query (registered, not yet heavily used)
- **Testing:** Vitest + jsdom + React Testing Library + Playwright
- **CI/CD:** GitHub Actions (lint + test + build on push/PR to `master`)
- **Deployment:** Static export (suitable for Vercel, Netlify, GitHub Pages)
- **PWA:** Service worker + manifest.json registered
- **i18n:** Custom i18n with `en` / `id` locales

## Documentation Files
| File | Purpose | Read When |
|------|---------|-----------|
| PROJECT_OVERVIEW.md | High-level project summary | Always (first) |
| ARCHITECTURE.md | System design & patterns | Creating new features/modules |
| DATABASE_SCHEMA.md | Data models & schemas | Any data work |
| API_REFERENCE.md | External APIs used | Adding data sources |
| DEPENDENCIES.md | Package list & purposes | Adding new dependencies |
| DEVELOPMENT_GUIDE.md | Setup & conventions | Setting up or onboarding |
| BUSINESS_DOMAINS.md | Domain models & rules | Understanding business logic |

## Rules to Follow
| Rule | Priority |
|------|----------|
| deep-thinking.md | HIGHEST — Anti-hallucination, quality standards |
| developer-security.md | CRITICAL — 4-layer security enforcement |
| All other .agent/rules/* | Mandatory |

## Key Constraints
- **Next.js 16** has breaking changes vs training data — read `node_modules/next/dist/docs/` before modifying framework-level code
- **No database** — all data is static JSON (`src/data/animals.json`, 373KB)
- **Static export** — no server-side API routes, no SSR at runtime
- **React 19** — uses new patterns; `use client` directives required for hooks
- **Tailwind CSS v4** — uses `@import "tailwindcss"` syntax, not v3 config
