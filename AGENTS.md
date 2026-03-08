# AGENTS.md

Agent guidance for the **quant-web** codebase — a SvelteKit 2 financial dashboard application.

## Build & Development Commands

```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # Production build (Vite)
npm run preview      # Preview production build
npm run check        # TypeScript type checking (svelte-check)
npm run check:watch  # Type checking in watch mode
```

**No test runner configured.** No ESLint or Prettier config files present.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | SvelteKit 2.47+ |
| UI | Svelte 5.41+ (runes: `$state`, `$derived`, `$props`) |
| Language | TypeScript (strict mode) |
| Bundler | Vite 7+ |
| Charts | Chart.js 4.5+ |
| Fonts | Inter (body), Fira Mono (code) |

## Project Structure

```
src/
├── app.css              # Global CSS variables and reset
├── app.d.ts             # SvelteKit type declarations
├── lib/
│   ├── components/      # Shared UI components (Header, SideBar)
│   ├── stores/          # Svelte stores (sidebar.ts)
│   ├── stock/           # Stock-specific components
│   └── images/          # Static assets (SVG icons)
└── routes/              # SvelteKit file-based routing
    ├── dashboard/       # Financial dashboards (bank, stock, bond, coin, ETF)
    ├── asset/           # Asset management (vehicles, jet, yacht, realestate)
    ├── business/        # Company operations with dynamic [id] routes
    └── leaderboard/     # Rankings and profiles
```

## Code Style Guidelines

### Component Structure

Always follow this order in `.svelte` files:

```svelte
<script lang="ts">
    // 1. External package imports
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';
    
    // 2. SvelteKit imports ($app/*)
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    
    // 3. Internal imports ($lib/*)
    import Header from '$lib/components/Header.svelte';
    import { updateSection } from '$lib/stores/sidebar';
    
    // 4. Relative imports
    import StockChart from '../../../lib/stock/StockChart.svelte';
    
    // 5. Props (Svelte 5 runes)
    let { children } = $props();
    
    // 6. State and logic
    let selectedIndex = 0;
</script>

<!-- Template -->
<div class="container">
    {@render children()}
</div>

<style>
    /* Scoped styles */
</style>
```

### TypeScript Patterns

```typescript
// Type exports in stores
export type SidebarItem = {
    name: string;
    img: string;
    link: string;
};

// Derived types from objects
export type SectionType = keyof typeof sidebarConfigs;

// Use lang="ts" in script tags
<script lang="ts">
```

**Rules:**
- Enable `lang="ts"` in all script blocks
- Define types in the same file or dedicated type files
- Avoid `any` — use proper typing
- Use `type` over `interface` for object shapes (project convention)

### Svelte 5 Runes (IMPORTANT)

This project uses **Svelte 5 runes**, not Svelte 4 reactive syntax:

```svelte
<!-- Props -->
let { children, playerName = "Default" } = $props();

<!-- Render children -->
{@render children()}

<!-- Event handlers (no colon) -->
<button onclick={() => handleClick()}>Click</button>

<!-- NOT this (Svelte 4): -->
<!-- <button on:click={handleClick}>Click</button> -->
```

**Mixed patterns exist:** Some components still use `$:` reactive statements and `on:click`. When editing, match the existing file's style. For new components, prefer Svelte 5 patterns.

### Store Patterns

```typescript
import { writable, get } from 'svelte/store';

// Define store with type
export const currentSection = writable<SectionType>('dashboard');

// Export functions that update stores
export function updateSection(section: SectionType, direction?: number) {
    transitionDirection.set(direction);
    currentSection.set(section);
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `StockChart.svelte` |
| Files (routes) | kebab-case or `+page.svelte` | `+page.svelte`, `+layout.svelte` |
| Functions | camelCase | `handleNavClick`, `setCompanySidebar` |
| Variables | camelCase | `selectedIndex`, `playerName` |
| CSS classes | kebab-case or BEM | `side-bar__list-item`, `user-info` |
| Types | PascalCase | `SidebarItem`, `SectionType` |
| Stores | camelCase | `currentSection`, `sidebarItems` |

### CSS Guidelines

**Global variables** (defined in `src/app.css`):

```css
--color-theme-1: #00529B      /* Primary blue */
--color-theme-1-dark: #004480 /* Dark blue hover */
--color-theme-2: #ECF2FE      /* Light blue background */
--color-text: rgba(0, 0, 0, 1)
--color-text-gray: rgba(100, 117, 139, 1)
--color-border: rgba(227, 233, 241, 1)
--color-bg-0: rgba(255, 255, 255, 1)
--font-body: 'Inter', Arial, sans-serif
--font-semiBold: 700
--font-bold: 800
--font-normal: 600
```

**Rules:**
- Use `rem` units (base 16px) — see `FIGMA_CONVERSION.md` for px→rem conversion
- Scoped styles in each component (no global CSS leakage)
- Reference CSS variables with `var(--color-theme-1)`
- Border: `0.0625rem solid var(--color-border)` (1px)

### Event Handling

```svelte
<!-- Svelte 5 style (preferred for new code) -->
<button onclick={() => handleClick(index, item.link)}>

<!-- Svelte 4 style (exists in codebase) -->
<button on:click={() => (tab = 'buy')}>

<!-- Input events -->
<input on:input={onQtyInput} bind:value={qty} />
```

### Transitions & Animations

```svelte
<script>
    import { fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
</script>

<div
    in:fly={{ x: 300, duration: 400, easing: quintOut }}
    out:fly={{ x: -300, duration: 400, easing: quintOut }}
>
```

## UI Language

**All user-facing text is in Korean.** Examples:
- "대시보드" (Dashboard)
- "매수" (Buy)
- "주문 가격" (Order Price)

## File-Based Routing

SvelteKit conventions:
- `+page.svelte` — Page component
- `+layout.svelte` — Layout wrapper (inherits to children)
- `+page.ts` — Load function (optional)
- `[param]/` — Dynamic route segment

Example: `/business/company/[id]/factory/[factoryId]/+page.svelte`

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/lib/stores/sidebar.ts` | Sidebar state, section configs, navigation functions |
| `src/lib/components/Header.svelte` | Global navigation bar |
| `src/lib/components/SideBar.svelte` | Animated sidebar with transitions |
| `src/app.css` | Global CSS variables and reset |
| `FIGMA_CONVERSION.md` | px to rem conversion guide (1280px base) |

## Common Patterns

### Layout with Sidebar

```svelte
<script lang="ts">
    import SideBar from '$lib/components/SideBar.svelte';
    let { children } = $props();
</script>

<div class="page-container">
    <SideBar />
    <div class="content">
        {@render children()}
    </div>
</div>
```

### Conditional Classes

```svelte
<button class:active={selectedIndex === index}>
<li aria-current={isActive ? 'page' : undefined}>
```

### Chart.js Usage

```svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';
    
    let canvas: HTMLCanvasElement;
    let chart: Chart;
    
    onMount(() => {
        chart = new Chart(canvas, { /* config */ });
        return () => chart?.destroy();
    });
</script>

<canvas bind:this={canvas}></canvas>
```

## Don'ts

- Don't use `as any` or `@ts-ignore`
- Don't create global CSS classes (use scoped styles)
- Don't mix Svelte 4/5 syntax in new components
- Don't hardcode colors — use CSS variables
- Don't use px units — convert to rem
