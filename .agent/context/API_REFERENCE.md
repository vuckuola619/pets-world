# API Reference

## Overview
This project has **no backend API endpoints**. It is a statically exported Next.js app.
All data is embedded in the build via `animals.json`.

---

## External APIs Consumed

### 1. Wikipedia REST API (Runtime — Client-Side)

**Used by:** `src/hooks/useAnimalMedia.ts`

| Field | Value |
|-------|-------|
| **Base URL** | `https://en.wikipedia.org/api/rest_v1` |
| **Endpoint** | `GET /page/summary/{title}` |
| **Auth** | None |
| **Rate Limit** | Best-effort, no explicit throttling |
| **Used for** | Fetching animal thumbnail images |

**Request:**
```
GET https://en.wikipedia.org/api/rest_v1/page/summary/{animalName}
```

**Response (used fields):**
```json
{
  "thumbnail": {
    "source": "https://upload.wikimedia.org/..." 
  }
}
```

**Error handling:** Silent catch — falls back to emoji display on failure.

> ⚠️ **Observation:** The `.catch(() => {})` in `useAnimalMedia.ts` swallows errors silently. Consider logging to aid debugging.

---

### 2. CARTO Basemap Tiles (Runtime — Map Tiles)

**Used by:** `src/components/MapView.tsx`

| Style | URL |
|-------|-----|
| Voyager (default) | `https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json` |
| Dark Matter | `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json` |
| Minimal | `https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json` |

**Auth:** None (public CARTO basemaps)

---

## Internal Route Structure (App Router)

| Route | Type | Component | Description |
|-------|------|-----------|-------------|
| `/` | Client (SPA) | `src/app/page.tsx` | Main map + sidebar view |
| `/animal/[slug]` | SSG (pre-rendered) | `src/app/animal/[slug]/page.tsx` | Animal detail page |

### Static Generation
- `generateStaticParams()` in `/animal/[slug]/page.tsx` pre-renders all 68+ animal pages at build time
- Each page has dynamic `generateMetadata()` for SEO (title, description, OpenGraph)
