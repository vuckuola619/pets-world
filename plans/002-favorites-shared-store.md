# Plan 002: Move favorites into the shared store — one source of truth

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat ce812f3..HEAD -- src/hooks/useFavorites.ts src/store/useMapStore.ts src/components/Sidebar.tsx src/components/MapView.tsx src/components/MobileDetailPanel.tsx src/test/favorites.test.ts`
> On any mismatch with the "Current state" excerpts, treat it as a STOP
> condition.

## Status

- **Priority**: P1
- **Effort**: S–M
- **Risk**: MED (hydration timing; three consumer components touched)
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `ce812f3`, 2026-08-27

## Why this matters

`useFavorites` gives every caller its own `useState` snapshot read once from
localStorage. Three components mount it independently — Sidebar, MapView
popup, MobileDetailPanel — so toggling a heart in one leaves the other two
stale until reload. Worse, a stale instance's later toggle writes the whole
array from its outdated snapshot, permanently erasing favorites another
instance just added. This is a real lost-data path, not just a UI
inconsistency. Moving the array into the shared Zustand store (which the
codebase already uses for `compareIds` — the directly analogous feature)
makes all surfaces share one state with a single persistence subscription.

## Current state

- `src/hooks/useFavorites.ts` — owns read/write helpers + local state
  (excerpt, lines 30-53):

```ts
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => readFavorites())

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      writeFavorites(next)
      return next
    })
  }, [])
  // ... isFavorite, clearFavorites — see file
  return { favorites, toggleFavorite, isFavorite, clearFavorites }
}
```

- `readFavorites()` / `writeFavorites()` (lines 8-28) guard
  `typeof window === 'undefined'` and parse/serialize the
  `'wildlife-favorites'` localStorage key defensively (try/catch, array+
  string filter). Keep these helpers exactly as they are.
- Consumers (all three must be switched, none may keep local copies):
  - `src/components/Sidebar.tsx:38` — `const { isFavorite, toggleFavorite, favorites } = useFavorites();`
  - `src/components/MapView.tsx:116` (approx) and
  - `src/components/MobileDetailPanel.tsx:34` (approx) — same call shape.
- **Exemplar to copy** — `compareIds` in `src/store/useMapStore.ts`:
  array state on the store, `addCompare`/`removeCompare` actions. Also in
  the same file, the theme slice shows the established hydration pattern
  (store default + a lazy rehydrate on the client). Match both.
- Existing tests to preserve/extend: `src/test/favorites.test.ts` (6 tests,
  currently exercising the hook via `renderHook`). Store tests live in
  `src/test/store.test.ts` (12 tests) — mirror their style for new store
  assertions.

## Commands you will need

| Purpose   | Command                              | Expected on success                    |
|-----------|--------------------------------------|----------------------------------------|
| Install   | `npm install`                        | exit 0                                 |
| Tests     | `npm run test:run`                   | all pass (64 baseline + new)           |
| Tests(f)  | `npm run test:run -- favorites store`| favorites + store suites pass          |
| Lint      | `npm run lint`                       | exit 0; 0 errors                       |
| Build     | `npm run build`                      | exit 0; ~236 pages                     |

## Scope

**In scope** (the only files you should modify):
- `src/store/useMapStore.ts`
- `src/hooks/useFavorites.ts`
- `src/components/Sidebar.tsx`
- `src/components/MapView.tsx`
- `src/components/MobileDetailPanel.tsx`
- `src/test/favorites.test.ts`
- `src/test/store.test.ts`

**Out of scope** (do NOT touch, even though they look related):
- `src/components/AnimalSearch.tsx` and any other file that does not call
  `useFavorites` (verify with `grep -rn "useFavorites" src/` — if you find
  an additional consumer, STOP and report; the plan lists three).
- Detail-page favorite button (a planned follow-up feature; do not add it).
- localStorage key name — keep `'wildlife-favorites'` (users have data
  under it).

## Git workflow

- Branch: `fix/favorites-shared-store`
- Commit style: conventional commits, e.g.
  `fix(favorites): share one store slice across surfaces`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add the favorites slice to `useMapStore`

In `src/store/useMapStore.ts`, alongside `compareIds`:

- State: `favorites: string[]` initialized to `[]`.
- Actions: `toggleFavorite(id: string)`, `clearFavorites()`, and a
  `hydrateFavorites(ids: string[])` used once on the client.
- Persistence: call `hydrateFavorites(readFavorites())` inside the existing
  client-hydration spot (follow where the theme slice rehydrates in the
  same file). Write-through: every action that changes `favorites` also
  calls the existing `writeFavorites(next)` from the hook file — move
  `readFavorites`/`writeFavorites` into the store module (or a tiny
  `src/lib/favoritesStorage.ts`) so there is exactly one persistence
  implementation. Keep the function bodies identical.

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 2: Reduce `useFavorites` to a selector hook

Rewrite `src/hooks/useFavorites.ts` so it keeps the same return shape
(`{ favorites, toggleFavorite, isFavorite, clearFavorites }`) but sources
everything from `useMapStore` selectors — no local `useState`. Keep the
hook's public signature unchanged so consumers need no call-site changes
beyond the import (they already import the hook).

**Verify**: `grep -n "useState" src/hooks/useFavorites.ts` → no matches.

### Step 3: Confirm all three consumers still compile and render

`Sidebar.tsx`, `MapView.tsx`, `MobileDetailPanel.tsx` should need no changes
beyond possibly nothing at all (same hook signature). Run the app's type
check via build.

**Verify**: `npm run build` → exit 0.

### Step 4: Update tests

- `src/test/store.test.ts`: add tests — toggling twice returns to the
  original array; `hydrateFavorites` replaces state; toggling after
  hydration preserves pre-existing ids (this is the lost-data regression).
- `src/test/favorites.test.ts`: keep existing hook-level tests passing
  (they exercise the selector hook now); add one test asserting two
  `renderHook` instances see the same array after a toggle in either
  (shared-store guarantee).

**Verify**: `npm run test:run -- favorites store` → all pass, including
new tests.

## Test plan

- New store tests (Step 4) modeled on `src/test/store.test.ts` style.
- Regression test named above covers the exact data-loss bug: stale
  instance + toggle must not drop fresh favorites.
- Verification: `npm run test:run` → 64 baseline + new all pass.

## Done criteria

- [ ] `grep -rn "useState" src/hooks/useFavorites.ts` returns nothing
- [ ] `grep -rn "useFavorites(" src/ | wc -l` shows exactly the three
      consumer call sites plus the hook definition
- [ ] `npm run lint` exits 0 with 0 errors
- [ ] `npm run test:run` exits 0 with new tests passing
- [ ] `npm run build` exits 0
- [ ] `plans/README.md` status row for 002 updated to DONE

## STOP conditions

- A fourth `useFavorites` consumer exists (scope assumption wrong).
- The store's hydration spot for theme does not exist / moved — report what
  you found instead of inventing a new hydration mechanism.
- Existing `favorites.test.ts` tests fail for reasons unrelated to the
  state move after one fix attempt.

## Maintenance notes

- Once unified, adding a favorite button on `/animal/*` detail pages is a
  one-line hook reuse (planned follow-up, direction finding DIR-1).
- Reviewer should scrutinize: hydration runs client-side only; no SSR
  localStorage access; localStorage key unchanged.
