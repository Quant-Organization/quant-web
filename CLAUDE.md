# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
npm run check        # TypeScript type checking (svelte-kit sync + svelte-check)
npm run check:watch  # Type checking in watch mode
npx playwright test tests/e2e/full-test.spec.ts  # Run Playwright e2e tests
```

No ESLint or Prettier configured.

## Tech Stack

- **SvelteKit 2** with Svelte 5 (uses runes: `$state`, `$derived`, `$props`)
- **TypeScript** (strict mode)
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin) + scoped component styles
- **Chart.js** and **TradingView Lightweight Charts** for data visualization
- **Leaflet** for map rendering
- **Deployed on Netlify** (adapter-netlify)
- **Inter** font (body), **Fira Mono** (monospace)

## Architecture

### Dual Backend

Two separate API servers, accessed through wrapper functions in `src/lib/api/config.ts`:

| Function | Server | Purpose | Token key |
|----------|--------|---------|-----------|
| `fetchFastAPI()` | FastAPI `:8000` | Stock/coin simulation, trading | `fastapi_token` |
| `fetchSpring()` | Spring Boot `:80` | Game backend (auth, companies, assets, missions) | `spring_token` / `auth_token` |

Each API domain has its own module in `src/lib/api/` (e.g., `trade.ts`, `company.ts`, `bank.ts`). Both wrappers dispatch a `quant:auth-required` custom event on 401 responses (before throwing), which triggers a login modal in the root layout. Pass `{ suppressAuth: true }` in options to skip this for optional auth calls.

The API layer includes smart caching: GET requests are cached with configurable TTL (default 15s, shorter for market data), supports ETag/304 revalidation, deduplicates in-flight requests, and auto-invalidates cache on mutating requests.

**Dev proxy**: Vite proxies `/fastapi/*` to `VITE_FASTAPI_URL` (default `http://localhost:8000`).
**Production proxy**: Netlify redirects in `netlify.toml` proxy `/api/*` and `/fastapi/*` to the backend server.

### Auth Flow

Login writes tokens to `localStorage` for both backends simultaneously. The auth store (`src/lib/stores/auth.ts`) persists user/token state and exposes `auth.login()`, `auth.logout()`, and `auth.isLoggedIn` (derived). The root layout shows a `LoginModal` on first visit if not logged in, and re-shows it (unclosable) on any 401 event.

### Layout & Sidebar System

The root layout (`src/routes/+layout.svelte`) renders `Header` + `SideBar` + page content. The sidebar is conditionally shown only for `/dashboard`, `/asset`, `/business`, `/leaderboard` routes. The root page (`/`) redirects to `/dashboard/overview`.

**Section layout pattern** -- each section's `+layout.svelte` must:
1. Call `updateSection('sectionName')` on mount to set sidebar items
2. Use `afterNavigate` to sync `selectedIndex` with the current URL path
3. Read sidebar config from `sidebarConfigs` in `src/lib/stores/sidebar.ts`

To add/modify sidebar menu items, update `sidebarConfigs` in `sidebar.ts`.

### Main Sections

Five sections, four with context-sensitive sidebars:
1. **Dashboard** (`/dashboard/*`) - Financial dashboards: overview, bank, stock, bond, coin, etf
2. **Asset** (`/asset/*`) - Asset management: overview, vehicles, jet, yacht, realestate, luxury
3. **Business** (`/business/*`) - Company operations with dynamic company context
4. **Leaderboard** (`/leaderboard/*`) - Rankings, profiles, missions
5. **Auction** (`/auction`) - Standalone auction page (no sidebar entry)

### Business Dynamic Routing

Business uses a dynamic `[id]` segment for company pages:
- `/business/company/[id]/overview` - Company overview
- `/business/company/[id]/factory` - Factory management (has nested `[factoryId]` and `build/contract`, `build/settings`)
- `/business/company/[id]/rnd` - R&D center
- `/business/company/[id]/distribution` - Distribution & sales

When navigating to a company, `setCompanySidebar(companyId, name)` replaces the business sidebar items with company-specific links.

### State Management

- **Sidebar** (`src/lib/stores/sidebar.ts`): `sidebarConfigs`, `updateSection()`, `setCompanySidebar()`, `selectedIndex`, `transitionDirection`
- **Auth** (`src/lib/stores/auth.ts`): token + user persisted to localStorage, `auth.login()` / `auth.logout()` / `auth.isLoggedIn`
- **Balance** (`src/lib/stores/asset.ts`): Server-backed via `refreshBalance()` which calls Spring API
- **Login modal** (`src/lib/stores/loginModal.ts`): `showLoginModal` + `loginModalAuthRequired` flags
- **Factory build** (`src/lib/stores/factoryBuild.ts`): Multi-step factory creation wizard state

## Conventions

### Svelte 5 Runes

New components must use Svelte 5 syntax: `$props()`, `$state()`, `$derived()`, `{@render children()}`, `onclick` (not `on:click`). Some existing components still use Svelte 4 patterns (`$:`, `on:click`) -- when editing those, match the file's existing style.

### Component Script Order

```svelte
<script lang="ts">
    // 1. External package imports (svelte, chart.js, etc.)
    // 2. SvelteKit imports ($app/*)
    // 3. Internal imports ($lib/*)
    // 4. Relative imports
    // 5. Props ($props())
    // 6. State and logic
</script>
```

### TypeScript

- Always use `<script lang="ts">`
- Use `type` over `interface` for object shapes
- Avoid `any` and `@ts-ignore`

### CSS

- Use `rem` units (base 16px), never `px` -- see `FIGMA_CONVERSION.md` for conversion from 1280px Figma designs
- Reference global CSS variables from `src/app.css` (e.g., `var(--color-theme-1)`, `var(--color-positive)`)
- All styles must be scoped in component `<style>` blocks
- Don't hardcode colors -- use CSS variables
- Tailwind utility classes available via `cn()` helper from `$lib/utils.ts` (uses `clsx` + `tailwind-merge`)

### Naming

| Entity | Convention | Example |
|--------|-----------|---------|
| Components | PascalCase | `StockChart.svelte` |
| Functions/variables | camelCase | `handleNavClick` |
| CSS classes | kebab-case / BEM | `side-bar__list-item` |
| Types | PascalCase | `SidebarItem` |

### Chart.js Pattern

```svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';
    let canvas: HTMLCanvasElement;
    onMount(() => {
        const chart = new Chart(canvas, { /* config */ });
        return () => chart?.destroy();
    });
</script>
<canvas bind:this={canvas}></canvas>
```

## UI Language

All UI text is in Korean.
