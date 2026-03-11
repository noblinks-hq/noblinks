# Metrics Explorer — Implementation Plan

## Status
**PARTIAL** — `GET /api/metrics` exists. No UI surface to browse available metrics.

## Problem
When creating a widget, users must know the exact metric key (e.g. `node_cpu_usage_percent`). There is no way to browse what a machine is actually reporting.

## What to Build

### "Browse metrics" button on dashboard detail page
- Add a "Browse metrics" button near the "Add Widget" button on the dashboard page
- Opens a modal listing metric keys being reported by machines in the org

### Metrics browser modal
- Fetch `GET /api/metrics?limit=100` — returns distinct `{ machineName, metricKey, latestValue, sampledAt }`
- Group by machine
- Show a table: machine name | metric key | latest value | last seen
- Click a metric row → close modal and pre-fill the "Add Widget" AI prompt with the metric name

### API contract
```
GET /api/metrics?machine=<name>&limit=100
Response: {
  metrics: [{ machineName, metricKey, latestValue, sampledAt }]
}
```
Check `src/app/api/metrics/route.ts` to confirm current response shape before building the modal.

## Files
- `src/app/(product)/dashboards/[id]/page.tsx` — add "Browse metrics" button
- `src/components/product/metrics-browser-modal.tsx` — new modal component
- `src/app/api/metrics/route.ts` — verify/extend if needed
