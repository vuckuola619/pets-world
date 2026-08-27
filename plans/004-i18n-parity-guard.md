# Plan 004: Enforce i18n id/en key parity at compile time and in tests

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat ce812f3..HEAD -- src/lib/i18n.ts src/test`
> On mismatch with "Current state" excerpts, treat as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `ce812f3`, 2026-08-27

## Why this matters

The i18n module's type looks like it guarantees the Indonesian (`id`) and
English (`en`) blocks have identical key shapes, but it does not.
`Translations = typeof translations.id` (i18n.ts:392) constrains nothing,
and `t()` returns `translations[locale] as TranslationStrings` (i18n.ts:399)
— a cast that stays legal even when the `en` block drops keys. Consequence:
someone adds a key to `id`, forgets `en`, TypeScript passes, and English
users get `undefined` rendered as blank UI. This plan makes the gap
impossible two ways: a compile-time `satisfies` on the `en` block and a
deep key-equality Vitest as a runtime backstop.

## Current state

- `src/lib/i18n.ts` — structure (line numbers from ce812f3):
  - `const translations = { id: {...}, en: {...} } as const` (line ~4);
    `id` block ~lines 5-197, `en` block ~lines 198-388, mirrored shapes.
  - Excerpt at the bottom (lines ~390-400):

```ts
/** Translation strings type derived from Indonesian locale */
export type Translations = typeof translations.id

/** Alias for Translations */
export type TranslationStrings = Translations

/** Returns translation strings for the given locale */
export function t(locale: Locale): TranslationStrings {
  return translations[locale] as TranslationStrings
}
```

- Consumers use property paths: `t(locale).detail.diet`,
  `t(locale).populationTrend.increasing`, etc. — the shape must not change,
  only its enforcement.
- Convention: `src/lib/i18n.ts` is a pure data+types module (no React).
  Tests are Vitest in `src/test/`; pattern exemplar
  `src/test/populationTrends.test.ts` (imports source maps, plain
  describe/it).

## Commands you will need

| Purpose   | Command                       | Expected on success        |
|-----------|-------------------------------|----------------------------|
| Install   | `npm install`                 | exit 0                     |
| Typecheck | `npm run build` (runs tsc)    | exit 0                     |
| Tests     | `npm run test:run -- i18n`    | new suite passes           |
| Tests(all)| `npm run test:run`            | all pass                   |
| Lint      | `npm run lint`                | exit 0; 0 errors           |

## Scope

**In scope** (the only files you should modify):
- `src/lib/i18n.ts`
- `src/test/i18n.test.ts` (create)

**Out of scope**:
- Renaming/reorganizing the `translations` object's export shape — 20+
  consumers import `t` and `TranslationStrings`; do not change their API.
- Translating any missing copy: if the audit step below finds a key missing
  from `en`, that is a STOP-and-report (fixing translations needs a human
  or a translation pass; the plan only adds enforcement).

## Git workflow

- Branch: `test/i18n-parity`
- Commit style: conventional commits, e.g.
  `test(i18n): enforce id/en key parity at compile time and runtime`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add the runtime deep-parity test FIRST (expect it to pass on current code)

Create `src/test/i18n.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { translations } from '../lib/i18n'

type AnyRecord = Record<string, unknown>

function keyPaths(obj: AnyRecord, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k
    return v && typeof v === 'object' ? keyPaths(v as AnyRecord, path) : [path]
  })
}

describe('i18n locale parity', () => {
  it('en has exactly the same key paths as id', () => {
    const idKeys = keyPaths(translations.id as AnyRecord).sort()
    const enKeys = keyPaths(translations.en as AnyRecord).sort()
    expect(enKeys).toEqual(idKeys)
  })

  it('no leaf value is empty in either locale', () => {
    for (const block of [translations.id, translations.en] as AnyRecord[]) {
      for (const path of keyPaths(block)) {
        const value = path.split('.').reduce<AnyRecord | unknown>(
          (acc, k) => (acc as AnyRecord)[k], block)
        expect(String(value).length, path).toBeGreaterThan(0)
      }
    }
  })
})
```

Note: `translations` is currently NOT exported — add `export` to the
existing `const translations` declaration in `src/lib/i18n.ts` (one-word
change; nothing else about the export surface changes).

**Verify**: `npm run test:run -- i18n` → 2 tests pass. If they FAIL, the
blocks already drifted: STOP and report the differing key paths (do not
translate anything yourself).

### Step 2: Add the compile-time check

In `src/lib/i18n.ts`, keep `type Translations = typeof translations.id`,
then constrain the whole object with `satisfies` so `en` must match `id`
shape. Because both blocks live in one literal, the clean minimal change
is: declare the en block's type after the fact with a check constant
appended near the bottom (after the `translations` declaration):

```ts
// Compile-time guard: en must satisfy the id-derived shape exactly.
const _enParityCheck: Translations = translations.en
void _enParityCheck
```

If `_enParityCheck` fails to compile because `en` is missing a key — STOP
and report the exact TS error (that is a live localization gap a human must
fill).

**Verify**: `npm run build` → exit 0 (build runs the TS check).

### Step 3: Prove the guard actually fires (mutation check, then revert)

Temporarily comment out one leaf key in the `en` block (e.g.
`dinosaurUnit`). Run the build — it MUST fail on `_enParityCheck`; run the
test — the parity test MUST fail. Then restore the key exactly.

**Verify**: after restoring, `npm run build` → exit 0 and
`npm run test:run -- i18n` → pass. Include the temporary mutation and
revert in your work log (report it), not in the final diff.

## Test plan

- New `src/test/i18n.test.ts` (Step 1): deep key-path equality + non-empty
  leaves, both locales. Pattern: `src/test/populationTrends.test.ts`.
- Verification: `npm run test:run` → 64 baseline + 2 new all pass.

## Done criteria

- [ ] `export const translations` exists in `src/lib/i18n.ts`
- [ ] `_enParityCheck` compile-time guard present
- [ ] `npm run build` exits 0
- [ ] `npm run test:run` exits 0; i18n suite present and passing
- [ ] Mutation check (Step 3) performed and reported
- [ ] No files outside the in-scope list modified
- [ ] `plans/README.md` status row for 004 updated to DONE

## STOP conditions

- The parity test or the compile guard fails against current code (there is
  an existing drift — report the exact keys; do not translate).
- `translations.en` is annotated/structured differently than described.

## Maintenance notes

- When adding new i18n keys: add to `id` first, then `en` — both guards now
  force the pairing at commit time.
- If a `t()` interpolation feature is ever added (values are plain strings
  today), the parity test's leaf-string assertion still holds.
