# Alert Test Mode — Implementation Plan

## Status
**PARTIAL** — `POST /api/alerts/[id]/test` exists. No UI button on the alert detail page.

## Problem
Users can't verify an alert is configured correctly without waiting for the condition to actually occur. A misconfigured threshold could mean they never get notified.

## What to Build

### "Test alert" button on alert detail page
- Add a "Test Alert" button to the alert detail page (`/alerts/[id]`)
- On click → call `POST /api/alerts/[id]/test`
- Show a loading spinner while waiting (uses the pending-query system, may take 5-10s)

### Result display
Show inline result below the button:
- **Would fire**: current value (e.g. `87%`) exceeds threshold (e.g. `80%`) → red badge "Would fire"
- **Would not fire**: current value below threshold → green badge "Would not fire"
- **Machine offline / no data**: grey badge "No data available"

### API contract (verify against existing implementation)
```
POST /api/alerts/[id]/test
Response: {
  wouldFire: boolean,
  currentValue: number | null,
  threshold: number,
  machine: string,
  error?: string
}
```

## Files
- `src/app/(product)/alerts/[id]/page.tsx` — add Test button + result display
- `src/app/api/alerts/[id]/test/route.ts` — verify response shape, no changes likely needed
