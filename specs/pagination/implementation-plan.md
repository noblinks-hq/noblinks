# Pagination — Implementation Plan

## Status
**PARTIAL** — Machines page has `limit`/`offset` support and a "Load more" button. Alerts and dashboards pages fetch all records with no pagination UI.

## Problem
Alerts and dashboards list pages load all records. Will break visually and performance-wise at 50+ items.

## What to Build

### Alerts page (`/alerts`)
- API already supports `limit` + `offset` params (default page size 20)
- Add "Load more" button at the bottom of the list, shown when `hasMore === true`
- On click → fetch next page, append to existing list
- Show a spinner while loading more

### Dashboards page (`/dashboards`)
- Same pattern — API supports `limit` + `offset`
- Add "Load more" button below dashboard grid
- Append new page to existing grid on load

## Files
- `src/app/(product)/alerts/page.tsx` — add `offset` state, "Load more" button, append logic
- `src/app/(product)/dashboards/page.tsx` — same pattern

## Pattern (already working in machines page)
```ts
const [offset, setOffset] = useState(0)
const [hasMore, setHasMore] = useState(false)

async function loadMore() {
  const res = await fetch(`/api/alerts?limit=20&offset=${offset + 20}`)
  const data = await res.json()
  setAlerts(prev => [...prev, ...data.alerts])
  setHasMore(data.hasMore)
  setOffset(o => o + 20)
}
```
