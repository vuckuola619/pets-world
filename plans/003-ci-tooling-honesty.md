# Plan 003: Fix the CI lint command and make dev tooling honest

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat ce812f3..HEAD -- .github/workflows/ci.yml package.json`
> On mismatch with "Current state", treat as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `ce812f3`, 2026-08-27

## Why this matters

CI's lint step runs `npx next lint`, but Next.js 16 **removed** the
`next lint` command (the repo's own `AGENTS.md` notes the local `npm run
lint` is the source of truth). The step can only fail or mislead — CI green
is currently an accident of it not running, not a gate that works. At the
same time `husky`, `lint-staged`, and `@playwright/test` are installed as
devDependencies with zero configuration anywhere (no `.husky/`, no
`prepare` script, no `playwright.config.*`, no e2e directory) — every
`npm install` pays for tooling that cannot run. This plan makes CI real and
removes the dead tooling. Playwright-based e2e is a separate future plan;
if that lands it should re-add the dep deliberately.

## Current state

- `.github/workflows/ci.yml` — the lint step (excerpt, line 25):

```yaml
      - name: Run linter
        run: npx next lint
```

  Full relevant sequence: `npm ci` → `npx next lint` → `npm run test:run`
  → `npm run build`.
- `package.json` scripts include `"lint": "eslint"` (works locally, source
  of truth).
- `package.json` devDependencies include `"husky": "^9.1.7"`,
  `"lint-staged": "^16.4.0"`, `"@playwright/test": "^1.59.1"`. Verified
  absent: no `.husky/` directory, no `"prepare"` script, no
  `lint-staged` key in package.json, no `playwright.config.*`, no
  `tests/e2e/` or `e2e/` directory.
- Convention: repo uses npm, conventional commits, GitHub Actions on
  push/PR to master.

## Commands you will need

| Purpose   | Command                | Expected on success                |
|-----------|------------------------|------------------------------------|
| Install   | `npm install`          | exit 0                             |
| Lint      | `npm run lint`         | exit 0; 0 errors, ~22 warnings     |
| Tests     | `npm run test:run`     | all pass                           |
| Build     | `npm run build`        | exit 0; ~236 pages                 |

## Scope

**In scope** (the only files you should modify):
- `.github/workflows/ci.yml`
- `package.json` (scripts + devDependencies)
- `package-lock.json` (via `npm install` after dependency removal)

**Out of scope** (do NOT touch):
- Any `src/` or `public/` file.
- Adding husky/lint-staged configuration or Playwright e2e — this plan
  *removes* the unwired deps; re-adding them deliberately is a separate
  decision.
- CI test/build steps beyond the lint command line.

## Git workflow

- Branch: `chore/ci-tooling-honesty`
- Commit style: conventional commits, e.g.
  `chore(ci): use eslint directly, drop unwired dev tooling`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Point CI at the real lint script

In `.github/workflows/ci.yml`, replace the lint step's run line:

```yaml
      - name: Run linter
        run: npm run lint
```

**Verify**: `grep -n "next lint" .github/workflows/ci.yml` → no matches;
`grep -n "npm run lint" .github/workflows/ci.yml` → 1 match.

### Step 2: Make CI fail loudly on lint errors, matching local

The local `eslint` exits non-zero on errors (0 currently exist; warnings
don't fail). No config change needed — this step is only a confirmation.

**Verify**: `npm run lint` locally → exit 0. If it exits non-zero, STOP
and report the errors (they would be new since ce812f3).

### Step 3: Remove the unwired devDependencies

In `package.json`, delete `"husky"`, `"lint-staged"`, and
`"@playwright/test"` from devDependencies. Then run `npm install` to sync
the lockfile.

**Verify**: `grep -n "husky\|lint-staged\|playwright" package.json` → no
matches; `npm install` → exit 0.

### Step 4: Prove the remaining pipeline end-to-end

Run the exact commands CI runs, in order.

**Verify**:
1. `npm ci` → exit 0
2. `npm run lint` → exit 0
3. `npm run test:run` → all tests pass
4. `npm run build` → exit 0, ~236 pages

## Test plan

- No new tests (tooling change). The Step 4 sequence is the verification.

## Done criteria

- [ ] `.github/workflows/ci.yml` lint step runs `npm run lint`
- [ ] `grep -n "husky\|lint-staged\|playwright" package.json` → nothing
- [ ] `npm ci && npm run lint && npm run test:run && npm run build` all exit 0
- [ ] No files outside the in-scope list modified
- [ ] `plans/README.md` status row for 003 updated to DONE

## STOP conditions

- Local `npm run lint` exits non-zero (new lint errors appeared since the
  plan was written) — report them; do not fix unrelated code here.
- `npm ci` fails after dependency removal (lockfile inconsistency you
  cannot resolve with one clean `npm install`).

## Maintenance notes

- If e2e coverage is added later (a planned direction), re-add
  `@playwright/test` deliberately together with `playwright.config.ts` and
  at least one spec in the same commit.
- The repo's root `AGENTS.md` says "CI uses the deprecated `npx next
  lint`" — after this lands, update that gotcha line (one-line docs fix in
  the workspace-level `AGENTS.md`; include it in the same PR).
