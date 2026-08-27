# Plan 001: Make the PWA offline fallback actually reachable

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat ce812f3..HEAD -- public/sw.js src/test`
> If `public/sw.js` changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `ce812f3`, 2026-08-27

## Why this matters

The service worker promises an offline screen, but a JavaScript
promise-truthiness bug makes it unreachable. `public/sw.js` evaluates
`caches.match('/') || new Response(...)` — `caches.match()` returns a
**Promise**, which is always truthy, so the handcrafted offline HTML can
never be returned. When a user requests an uncached page while offline,
`respondWith` resolves with the cached-`'/'` page even for non-`'/'` URLs
(wrong content at the wrong URL) or with `undefined` → raw browser network
error instead of the branded offline screen. The fix is one function made
async.

## Current state

- `public/sw.js` — the PWA service worker. Cache names are
  `wildlife-atlas-v3` / `wildlife-static-v3` (bumped 2026-08-24; do not
  rename again in this plan).
- Excerpt as it exists today (`public/sw.js:122-129`):

```js
/** Returns an offline fallback response */
function offlineFallback() {
  return caches.match('/') || new Response(
    '<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#666"><div style="text-align:center"><h1>🌍 Offline</h1><p>World Wildlife Atlas is not available offline yet.</p></div></body></html>',
    { headers: { 'Content-Type': 'text/html' } }
  );
}
```

- The caller at `public/sw.js:116` is inside an async function and already
  awaits: `const cached = await caches.match(request); return cached || offlineFallback();`
  — so making `offlineFallback` async requires no caller change.
- Conventions: the repo keeps `public/sw.js` dependency-free vanilla JS (no
  imports, no build step). Match that. There is no existing test harness for
  sw.js; the new unit test lives in Vitest like everything else (see
  `vitest.config.ts`, tests in `src/test/`, pattern exemplar
  `src/test/favorites.test.ts` — plain describe/it with imports from source).

## Commands you will need

| Purpose   | Command                | Expected on success                    |
|-----------|------------------------|----------------------------------------|
| Install   | `npm install`          | exit 0                                 |
| Tests     | `npm run test:run`     | all pass (64 baseline + new ones)      |
| Lint      | `npm run lint`         | exit 0; 0 errors (warnings pre-existing) |
| Build     | `npm run build`        | exit 0; ~236 static pages               |

## Scope

**In scope** (the only files you should modify):
- `public/sw.js`
- `src/test/swOffline.test.ts` (create)

**Out of scope** (do NOT touch, even though they look related):
- Cache version names / `PRECACHE_URLS` — bumping versions is a separate
  release decision.
- Runtime-caching eviction (unbounded tile cache) — a different, larger
  finding; do not attempt it here.
- Any HTML content beyond the existing offline string.

## Git workflow

- Branch: `fix/sw-offline-fallback`
- Commit style: conventional commits, e.g. `fix(sw): await cache match in offline fallback`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Make `offlineFallback` async and await the cache match

Replace the function in `public/sw.js` (lines 122-129) with:

```js
/** Returns an offline fallback response */
async function offlineFallback() {
  const cached = await caches.match('/');
  return cached || new Response(
    '<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#666"><div style="text-align:center"><h1>🌍 Offline</h1><p>World Wildlife Atlas is not available offline yet.</p></div></body></html>',
    { headers: { 'Content-Type': 'text/html' } }
  );
}
```

Note the single source of the offline HTML string stays exactly as-is — do
not reformat it.

**Verify**: `node --check public/sw.js` → exit 0 (syntax valid; service
workers are plain scripts).

### Step 2: Add a Vitest unit test proving the fallback contract

Create `src/test/swOffline.test.ts`. Because `sw.js` is not a module, test
the contract by reading the file text and asserting the async/await shape is
present (a regression guard, not a simulation), e.g.:

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const sw = readFileSync(resolve(__dirname, '../../public/sw.js'), 'utf8')

describe('service worker offline fallback', () => {
  it('awaits the cache match before falling back', () => {
    expect(sw).toMatch(/async function offlineFallback\(\)/)
    expect(sw).toMatch(/const cached = await caches\.match\('\/'\)/)
  })

  it('never returns a bare promise OR-ed with a Response', () => {
    expect(sw).not.toMatch(/return caches\.match\('\/'\) \|\|/)
  })
})
```

**Verify**: `npm run test:run -- swOffline` → 2 tests pass.

## Test plan

- New file `src/test/swOffline.test.ts` per Step 2 (regression guard for the
  promise-truthiness bug; structural pattern: `src/test/favorites.test.ts`).
- Verification: `npm run test:run` → all pass (64 existing + 2 new).

## Done criteria

- [ ] `node --check public/sw.js` exits 0
- [ ] `npm run test:run` exits 0; `swOffline.test.ts` present and passing
- [ ] `grep -n "return caches.match('/') ||" public/sw.js` returns nothing
- [ ] No files outside the in-scope list modified (`git status`)
- [ ] `plans/README.md` status row for 001 updated to DONE

## STOP conditions

Stop and report back (do not improvise) if:
- `public/sw.js` no longer matches the excerpt (cache names, structure, or
  the buggy line is already fixed).
- The test file pattern above fails because the repo's Vitest cannot read
  `__dirname` in its config — report the config you found instead of
  rewriting test infrastructure.

## Maintenance notes

- Next change that touches sw.js caching should also address the unbounded
  runtime tile cache (separate finding) — it interacts with how long the
  offline fallback stays available under storage pressure.
- Reviewer should confirm the offline HTML string was not altered (byte-
  identical except indentation is fine).
