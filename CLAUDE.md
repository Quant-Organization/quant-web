# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
npm run check        # TypeScript type checking
npm run check:watch  # Type checking in watch mode
```

## Tech Stack

- **SvelteKit 2** with Svelte 5 (uses runes: `$state`, `$derived`, etc.)
- **TypeScript** (strict mode)
- **Vite** for bundling
- **Chart.js** for data visualization

## Architecture

### File-Based Routing
SvelteKit convention: routes live in `src/routes/`. Each folder can have:
- `+page.svelte` - Page component
- `+layout.svelte` - Layout wrapper for child routes
- `+page.ts` - Optional load function
- `[param]/` - Dynamic route segments

### Main Sections
Four sections with context-sensitive sidebars:
1. **Dashboard** (`/dashboard/*`) - Financial dashboards (bank, stock, bond, coin, ETF)
2. **Asset** (`/asset/*`) - Asset management (vehicles, jet, yacht, realestate, luxury)
3. **Business** (`/business/*`) - Company operations with dynamic company context
4. **Leaderboard** (`/leaderboard/*`) - Rankings and profiles

### State Management
Sidebar state managed via Svelte stores in `src/lib/stores/sidebar.ts`:
- `currentSection` - Active section
- `sidebarItems` - Current sidebar menu items
- `updateSection(section, direction)` - Switch sections with animation
- `setCompanySidebar(companyId, name)` - Set company-specific sidebar

To add/modify sidebar items, update `sidebarConfigs` in `sidebar.ts`.

### Components
- `src/lib/components/Header.svelte` - Global navigation bar
- `src/lib/components/SideBar.svelte` - Animated context-aware sidebar
- `src/lib/stock/` - Stock-specific components (StockChart, OrderPanel, etc.)

### Styling
- CSS variables defined in `src/app.css` (colors, fonts, spacing)
- Scoped styles in each component's `<style>` block
- Design based on 1280px Figma mockups (see `FIGMA_CONVERSION.md` for px-to-rem conversion)

Key CSS variables:
```css
--color-theme-1: #00529B     /* Primary blue */
--color-theme-2: #ECF2FE     /* Light blue background */
--color-text-gray: rgba(100, 117, 139, 1)
--color-border: rgba(227, 233, 241, 1)
```

## UI Language

All UI text is in Korean.
