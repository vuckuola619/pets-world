# Contributing to World Wildlife Atlas

Thank you for your interest in contributing to the World Wildlife Atlas! 🌿

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Adding Species Data](#adding-species-data)
- [Design System](#design-system)

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code.

---

## Getting Started

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/your-username/world-wildlife-atlas.git
   cd world-wildlife-atlas
   ```
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Create** a branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
5. **Start** the dev server:
   ```bash
   npm run dev
   ```

---

## Development Workflow

```bash
# Run dev server
npm run dev

# Run tests (watch mode)
npm test

# Run tests (CI mode)
npm run test:run

# Lint
npm run lint

# Format
npm run format

# Build
npm run build
```

### Pre-commit Hooks

This project uses [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/lint-staged/lint-staged) to automatically lint and format staged files before each commit.

---

## Coding Standards

### TypeScript

- Use **strict mode** — no `any` types without justification
- Export types/interfaces from dedicated `.ts` files
- Use **Zod** for runtime validation of external data

### React

- Use **functional components** with hooks
- Prefer **named exports** for components
- Use `"use client"` directive only where necessary
- Components should have explicit `React.JSX.Element` return types

### CSS / Styling

- Use **Tailwind CSS v4** utility classes
- Custom styles go in `globals.css` under the Natura theme section
- Use CSS custom properties (`var(--natura-*)`) for theme tokens
- No inline color values — always reference design tokens

### File Organization

```
src/
├── app/              # Routes and pages only
├── components/       # Reusable UI components
├── data/             # Static data and schemas
├── hooks/            # Custom React hooks
├── lib/              # Pure utility functions
├── store/            # Zustand state stores
├── types/            # TypeScript type definitions
└── test/             # Unit tests
```

---

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Formatting, no code change |
| `refactor` | Code restructuring |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |
| `perf` | Performance improvements |

### Examples

```
feat(map): add satellite imagery toggle
fix(sidebar): resolve virtualizer measurement on mobile
docs: update API integration guide
test(store): add tests for region filter actions
```

---

## Pull Request Process

1. **Ensure** all tests pass: `npm run test:run`
2. **Ensure** the build succeeds: `npm run build`
3. **Ensure** linting passes: `npm run lint`
4. **Update** documentation if you changed behavior
5. **Fill out** the PR template completely
6. **Request** review from maintainers

### PR Title Format

Use the same convention as commits:
```
feat(component): add species population chart
```

---

## Adding Species Data

To add a new species to the atlas:

1. Edit `src/data/animals.json`
2. Follow the existing schema:

```json
{
  "id": "unique-id",
  "slug": "species-slug",
  "commonName": "Species Name",
  "scientificName": "Genus species",
  "country": "Country",
  "flag": "🇨🇳",
  "emoji": "🐼",
  "classification": "Mammal",
  "region": "Asia",
  "conservationStatus": "Vulnerable",
  "diet": "Herbivore",
  "coordinates": [{ "lat": 30.0, "lng": 103.0 }],
  "taxonomy": {
    "kingdom": "Animalia",
    "phylum": "Chordata",
    "class": "Mammalia",
    "order": "Carnivora",
    "family": "Ursidae",
    "genus": "Ailuropoda"
  },
  "lifespan": { "min": 20, "max": 35, "unit": "years" },
  "weight": { "min": 70, "max": 135, "unit": "kg" },
  "funFacts": [
    "Fact one.",
    "Fact two.",
    "Fact three."
  ],
  "description": "Description of the species...",
  "habitat": ["habitat description"]
}
```

3. Run tests to validate: `npm run test:run`
4. The Zod schema in `src/data/countries.ts` will catch any missing or malformed fields

### IUCN Status Values

Use one of these exact values:
- `Least Concern`
- `Near Threatened`
- `Vulnerable`
- `Endangered`
- `Critically Endangered`
- `Extinct in the Wild`
- `Extinct`
- `Data Deficient`

---

## Design System

The **Natura** design system uses these tokens. Always use CSS variables rather than raw colors:

```css
/* Primary palette */
var(--natura-forest)    /* Dark green — backgrounds */
var(--natura-emerald)   /* Bright green — accents */
var(--natura-sage)      /* Muted green — borders */
var(--natura-ocean)     /* Blue — links */
var(--natura-surface)   /* Light background */

/* Glassmorphism */
.glass-header          /* Frosted glass nav bar */
.region-pill-active    /* Active filter pill */
.sidebar-item          /* Sidebar list item hover */
```

---

## Questions?

Open a [Discussion](../../discussions) for questions, ideas, or feedback. Use [Issues](../../issues) for bug reports and feature requests.

Thank you for helping make the World Wildlife Atlas better! 🌍🦁🐧
