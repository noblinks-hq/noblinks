# Mobile Responsiveness — Implementation Plan

## Status
**TODO** — Product is desktop-only. Sidebar, tables, and modals break on mobile.

## What to Build

### Sidebar — hamburger menu on mobile
- On `md:` breakpoint, sidebar collapses to a hamburger icon in the top bar
- Click hamburger → sidebar slides in as a drawer (left side)
- Click outside or nav link → close drawer
- Use `useState` for open/close, `Sheet` component from shadcn/ui or plain CSS transform

### Dashboard widget grid — single column on mobile
- Widgets grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Already likely using Tailwind grid — just add responsive breakpoints

### Modals — full-screen on mobile
- Add `sm:max-w-lg max-w-full` and `sm:rounded-lg rounded-none` to all `DialogContent` components
- Or add `w-screen h-screen sm:w-auto sm:h-auto` for small screens

### Alert + machine tables — card layout on mobile
- On `< md`: hide table columns that don't fit, or switch to a stacked card per row
- Show: name, status badge, key action button
- Hide: created date, machine name (move to expanded state)

### Slideshow — single column on mobile
- Already single dashboard at a time — should work, just verify widget grid is 1-col

### Navigation text — icons only on small screens
- Sidebar nav items: show icon only below `md:`, full label above
- Already likely has icons — just hide `<span>` with `hidden md:inline`

## Priority order
1. Sidebar hamburger (most visible break)
2. Modal full-screen
3. Widget grid breakpoints
4. Table card layout

## Files
- `src/components/product/dashboard-layout.tsx` — sidebar collapse
- `src/app/(product)/dashboards/[id]/page.tsx` — widget grid
- `src/components/product/create-dashboard-modal.tsx` + other modals — full-screen on mobile
- `src/app/(product)/alerts/page.tsx` — responsive table
- `src/app/(product)/machines/page.tsx` — responsive layout
