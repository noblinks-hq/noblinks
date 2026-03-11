# Empty States & Loading Skeletons — Implementation Plan

## Status
**TODO** — Most pages show blank content or flash "0 items" before data loads.

## What to Build

### Alerts list — empty state
- When `alerts.length === 0` and `!loading`:
  - Show centered illustration + "No alerts configured" heading
  - CTA button: "Create your first alert" → `/alerts/create`

### Alerts list — firing badge
- When an alert has `status === "firing"`: show a pulsing red dot next to the alert name
- CSS: `animate-pulse bg-red-500 rounded-full h-2 w-2`

### Dashboards page — empty state
- When `dashboards.length === 0` and `!loading`:
  - "No dashboards yet" + "Create Dashboard" button

### Machines page — empty state
- When no machines and no environments:
  - Show install command snippet (already available from settings page pattern)
  - CTA: "View setup instructions" → `/settings`

### Dashboard detail — widget skeleton
- While widgets are loading: show 4 skeleton cards in the grid
- Use `<Skeleton className="h-48 w-full rounded-xl" />`

### Overview page — loading skeleton
- Replace "0 active alerts" flash with skeleton while `loading === true`
- `<Skeleton className="h-6 w-20" />` for each stat

## Files
- `src/app/(product)/alerts/page.tsx`
- `src/app/(product)/dashboards/page.tsx`
- `src/app/(product)/machines/page.tsx`
- `src/app/(product)/dashboards/[id]/page.tsx`
- `src/app/(product)/overview/page.tsx`
