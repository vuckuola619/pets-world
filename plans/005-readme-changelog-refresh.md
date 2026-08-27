# Plan 005: Refresh README and CHANGELOG to describe the shipped product

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat ce812f3..HEAD -- README.md CHANGELOG.md package.json`
> On mismatch with "Current state" excerpts, treat as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `ce812f3`, 2026-08-27

## Why this matters

The README still describes the pre-dinosaur product: no mention of the
dinosaur-era atlas (46 taxa, GeologicTimeBar), the `/about` page, photo
markers, or the bilingual education pass — roughly half the current product
is invisible to evaluators. Worse, the Getting Started section says
`http://localhost:3000` while the dev server is pinned to **3987**
(`package.json` `"dev": "next dev -p 3987"`), so a new contributor follows
the instructions and sees nothing. CHANGELOG.md is frozen at 1.1.1
(2026-04-19) while five release-worthy changes shipped since (PRs #1-#6),
and `package.json` still says `1.0.0` — three version sources disagree.
Docs that are wrong in the onboarding path cost more than missing docs.

## Current state

- `README.md`:
  - Line ~8: bills the app as "186+ Wildlife Species Across 9 Continents".
  - Line ~105: `Open [http://localhost:3000](http://localhost:3000) in your browser.`
  - Features table (~lines 33-52), architecture tree (~143-159), roadmap
    (~197-207): no Era Purba / dinosaur mode / about route / GeologicTimeBar.
  - Roadmap already claims `[x] Offline-first (fully functioning Service
    Worker)` — leave the claim but see STOP conditions.
- `CHANGELOG.md`: top entry `## [1.1.1] — 2026-04-19`; format is
  Keep-a-Changelog with emoji section headers (`### 🩹 Hotfix & Image Fetch
  Update`, `#### Added`).
- `package.json`: `"version": "1.0.0"`, `"dev": "next dev -p 3987"`.
- Facts to write down (all shipped, verifiable in the repo):
  - Dinosaur era mode: 46 PBDB-sourced taxa (`src/data/dinosaurs.ts`),
    toggle in header, fossil evidence cards, GeologicTimeBar timeline
    (`src/components/GeologicTimeBar.tsx`).
  - Wikimedia life-restoration imagery for 45/46 taxa with attribution on
    detail heroes; circular photo map markers.
  - `/about` page: atlas stats, verifiable data sources, bilingual
    (`src/app/about/page.tsx`).
  - Bilingual EN/ID throughout; IUCN legend explains each status code.
  - PWA: installable, offline shell (service worker v3).
  - Icons: NASA Blue Marble app icon; og-image social card.
  - Dev server pinned to port 3987.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Sanity  | `npm run dev` (optional manual check) | app serves on localhost:3987 |
| Docs build check | none (markdown only) | — |

## Scope

**In scope** (the only files you should modify):
- `README.md`
- `CHANGELOG.md`
- `package.json` (version field only)

**Out of scope**:
- `CONTRIBUTING.md`, `SECURITY.md`, anything in `docs/superpowers/` (spec
  deltas are a separate docs decision).
- Any code change. If `npm run dev` does not serve on 3987, STOP.

## Git workflow

- Branch: `docs/readme-changelog-refresh`
- Commit style: conventional commits, e.g.
  `docs: refresh README for dinosaur era, fix dev port, changelog 1.2.0`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Fix the README's onboarding truth

1. Replace the `localhost:3000` line with port **3987** and note the pin
   (3000 is taken by VS Code on the maintainer's machine; the port lives in
   `package.json`).
2. Add a **Dinosaur Era Mode** row/section to the features table: toggle in
   the header ("Era Purba"), 46 PBDB-sourced taxa, fossil evidence with
   verify links, geologic timeline, Wikimedia life-restoration imagery.
3. Add `/about` (Tentang) to the features list and the architecture tree
   (`src/app/about/page.tsx`), alongside the existing routes.
4. Update the architecture tree to include `src/data/dinosaurs.ts`,
   `src/data/dinosaurIllustrations.ts`, `src/components/GeologicTimeBar.tsx`,
   `src/lib/wikiImages.ts`.
5. Title line: keep "186+ wildlife species", add "plus 46 dinosaur taxa".

**Verify**: `grep -n "localhost:3000" README.md` → no matches;
`grep -c "dinosaur" README.md` → several matches.

### Step 2: Write the CHANGELOG 1.2.0 entry

Insert above the `1.1.1` heading, following the file's Keep-a-Changelog +
emoji style. Base it strictly on shipped work (PRs #1-#6):

```markdown
## [1.2.0] — 2026-08-27

### 🦕 Dinosaur Era Mode & Educational Atlas

#### Added
- **Dinosaur Era Atlas** — 46 PBDB-sourced taxa with bilingual descriptions,
  fossil evidence cards linking to verifiable occurrences, and a geologic
  timeline (Triassic/Jurassic/Cretaceous) on every detail page.
- **Real paleo-art imagery** — Wikimedia life restorations for 45/46 taxa
  (SVG illustration fallback), circular photo map markers, image credits on
  detail heroes.
- **About page** (`/about`) — bilingual, with atlas stats and verifiable
  data sources (PBDB, IUCN, Wikimedia, NASA).
- **IUCN legend explanations** — hover a status code to learn what it means
  in plain language (EN/ID).
- **Natura icon set** — real NASA Blue Marble app icon, full PWA icon set
  with maskable variants, og-image social card.
- **Motion polish** — press feedback on frequent controls, era-switch
  crossfade, theme color glide, favorite heart pop (all reduced-motion
  aware).

#### Fixed
- Dead header Search button (now shares state with ⌘K).
- Offline fallback in the service worker unreachable due to a
  promise-truthiness bug.
- Favorites now share one store across map, popup, and mobile panel
  (previously three disconnected copies that could drop recently added
  favorites).
- All pre-existing ESLint errors cleared; CI lint command fixed.
```

Adjust only if a referenced change is not actually in the repo (each one is
verifiable via `git log --oneline`).

**Verify**: `head -30 CHANGELOG.md` shows the new block above `[1.1.1]`.

### Step 3: Bump the package version

`package.json`: `"version": "1.0.0"` → `"version": "1.2.0"`.

**Verify**: `grep -n '"version"' package.json` → `1.2.0`.

## Test plan

- None (markdown + version field). CI must still pass:
  `npm run lint && npm run test:run` → unchanged results.

## Done criteria

- [ ] No `localhost:3000` in README; dinosaur mode + /about + GeologicTimeBar documented
- [ ] CHANGELOG has a `1.2.0` entry covering the shipped PRs
- [ ] `package.json` version is `1.2.0`
- [ ] No code files touched (`git status`)
- [ ] `plans/README.md` status row for 005 updated to DONE

## STOP conditions

- `package.json` dev script no longer pins 3987 (the port story changed).
- The README roadmap claims you cannot verify (e.g. offline-first) — report
  which claims you left untouched rather than editing claims.

## Maintenance notes

- Future releases: keep CHANGELOG + package.json version in the same commit
  as the release PR.
- The dinosaur-spec deltas (`docs/superpowers/` contradicts shipped detail
  pages) are a separate docs decision, deliberately out of scope here.
