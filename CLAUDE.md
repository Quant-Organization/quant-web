# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
npm run check        # TypeScript type checking (svelte-kit sync + svelte-check)
npm run check:watch  # Type checking in watch mode
```

No test framework or linter is configured.

## Tech Stack

- **SvelteKit 2** with Svelte 5 (uses runes: `$state`, `$derived`, `$props`)
- **TypeScript** (strict mode)
- **Vite** for bundling
- **Chart.js** for data visualization
- **Inter** font (body), **Fira Mono** (monospace)

## Architecture

### Layout Structure

The root layout (`src/routes/+layout.svelte`) renders `Header` + `SideBar` + page content. The sidebar is conditionally shown only for `/dashboard`, `/asset`, `/business`, `/leaderboard` routes. The root page (`/`) redirects to `/dashboard/overview`.

### Main Sections

Five sections, four with context-sensitive sidebars:
1. **Dashboard** (`/dashboard/*`) - Financial dashboards: overview, bank, stock, bond, coin, etf, loan
2. **Asset** (`/asset/*`) - Asset management: overview, vehicles, jet, yacht, realestate, luxury, special, storage, market
3. **Business** (`/business/*`) - Company operations with dynamic company context
4. **Leaderboard** (`/leaderboard/*`) - Rankings and profiles
5. **Auction** (`/auction`) - Standalone auction page (no sidebar entry)

### Section Layout Pattern

Each section has a `+layout.svelte` that calls `updateSection()` on mount and uses `afterNavigate` to sync `selectedIndex` with the current URL path. When adding a new section, follow this pattern.

### Business Dynamic Routing

Business uses a dynamic `[id]` segment for company pages:
- `/business/company/[id]/overview` - Company overview
- `/business/company/[id]/factory` - Factory management (has nested `[factoryId]` and `build/contract`, `build/settings`)
- `/business/company/[id]/rnd` - R&D center
- `/business/company/[id]/distribution` - Distribution & sales

When navigating to a company, `setCompanySidebar(companyId, name)` replaces the business sidebar items with company-specific links.

### State Management

**Sidebar state** (`src/lib/stores/sidebar.ts`):
- `sidebarConfigs` - Static sidebar menu definitions per section
- `updateSection(section, direction)` - Switch sections with fly animation
- `setCompanySidebar(companyId, name)` - Replace sidebar with company-specific items

To add/modify sidebar items, update `sidebarConfigs` in `sidebar.ts`.

**Asset state** (`src/lib/stores/asset.ts`):
- Persists balance, storage facilities, and owned vehicles to `localStorage` (key: `quant-web-assets`)
- Storage types: garage, hangar, marina (mapped to car, jet, yacht)
- Storage tiers: basic, standard, premium (upgradeable, not downgradeable)
- Actions: `purchaseStorage()`, `purchaseVehicle()`, `formatCurrency()`

### Styling

- Global CSS variables in `src/app.css` (colors, fonts, spacing, card/stat styling)
- Scoped styles in each component's `<style>` block
- Design based on 1280px Figma mockups (see `FIGMA_CONVERSION.md` for px-to-rem conversion)
- SVG icons imported from `$lib/images/` and used as `<img>` src attributes

Key CSS variables:
```css
--color-theme-1: #00529B     /* Primary blue */
--color-theme-2: #ECF2FE     /* Light blue background */
--color-text-gray: rgba(100, 117, 139, 1)
--color-border: rgba(227, 233, 241, 1)
--color-positive: #10b981    /* Green for gains */
--color-negative: #ef4444    /* Red for losses */
```

## UI Language

All UI text is in Korean.
