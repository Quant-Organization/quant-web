# Copilot Instructions — quant-web

SvelteKit 2 financial dashboard (game simulation) with all UI text in **Korean**.

## Build & Development

```bash
npm run dev          # Dev server on localhost:5173
npm run build        # Production build (Vite)
npm run check        # TypeScript checking (svelte-kit sync + svelte-check)
npx playwright test tests/e2e/full-test.spec.ts  # Run Playwright e2e tests
```

No ESLint or Prettier configured.

## Architecture

### Dual Backend

Two separate API servers, accessed through wrapper functions in `src/lib/api/config.ts`:

| Function | Server | Purpose | Token key |
|----------|--------|---------|-----------|
| `fetchFastAPI()` | FastAPI `:8000` | Stock/coin simulation, trading | `fastapi_token` |
| `fetchSpring()` | Spring Boot `:80` | Game backend (auth, companies, assets, missions) | `spring_token` / `auth_token` |

Each API domain has its own module in `src/lib/api/` (e.g., `trade.ts`, `company.ts`, `bank.ts`). Both wrappers dispatch a `quant:auth-required` custom event on 401 responses (before throwing), which triggers a login modal in the root layout. Pass `{ suppressAuth: true }` in options to skip this for optional auth calls.

### Auth Flow

Login writes tokens to `localStorage` for both backends simultaneously. The auth store (`src/lib/stores/auth.ts`) persists user/token state and exposes `auth.login()`, `auth.logout()`, and `auth.isLoggedIn` (derived). The root layout shows a `LoginModal` on first visit if not logged in, and re-shows it (unclosable) on any 401 event.

### Layout & Sidebar System

The root layout (`src/routes/+layout.svelte`) renders Header + SideBar + page content. The sidebar appears only on `/dashboard`, `/asset`, `/business`, `/leaderboard` routes.

**Section layout pattern** — each section's `+layout.svelte` must:
1. Call `updateSection('sectionName')` on init to set sidebar items
2. Use `afterNavigate` to sync `selectedIndex` with current URL path
3. Read sidebar config from `sidebarConfigs` in `src/lib/stores/sidebar.ts`

To add/modify sidebar menu items, update `sidebarConfigs` in `sidebar.ts`.

**Business dynamic sidebar** — when navigating to a company page, `setCompanySidebar(companyId, name)` replaces the standard business sidebar with company-specific links (`/business/company/[id]/*`).

### State Management

- **Sidebar**: Writable stores in `src/lib/stores/sidebar.ts` — `currentSection`, `sidebarItems`, `selectedIndex`, `transitionDirection`
- **Auth**: Custom store in `src/lib/stores/auth.ts` — wraps token + user in localStorage
- **Assets/Balance**: Server-backed via `src/lib/stores/asset.ts` — `refreshBalance()` calls Spring API
- **Login modal**: `src/lib/stores/loginModal.ts` — `showLoginModal` + `loginModalAuthRequired` flags

## Key Conventions

### Svelte 5 Runes

New components must use Svelte 5 syntax:
- `$props()` for props, `$state()` / `$derived()` for reactivity
- `{@render children()}` instead of `<slot />`
- `onclick` instead of `on:click`

Some existing components still use Svelte 4 patterns (`$:`, `on:click`). When editing those, match the file's existing style.

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

- Use `rem` units (base 16px), never `px` — see `FIGMA_CONVERSION.md` for conversion from 1280px Figma designs
- Reference global CSS variables from `src/app.css`: `var(--color-theme-1)`, `var(--color-positive)`, etc.
- All styles must be scoped in component `<style>` blocks — no global CSS classes
- Don't hardcode colors — use CSS variables

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

### Naming

| Entity | Convention | Example |
|--------|-----------|---------|
| Components | PascalCase | `StockChart.svelte` |
| Functions/variables | camelCase | `handleNavClick` |
| CSS classes | kebab-case / BEM | `side-bar__list-item` |
| Types | PascalCase | `SidebarItem` |
