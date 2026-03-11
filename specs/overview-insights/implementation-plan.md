# Overview Page Insights — Implementation Plan

## Status
**TODO** — Overview fetches real alerts and machines. But AI insights section shows hardcoded mock strings. Needs to be replaced with real computed data or removed.

## Problem
The "AI Insights" section on `/overview` shows hardcoded text like "CPU spike detected on prod-1". This is misleading and embarrassing in a demo.

## What to Build

### Option A — Replace with real summary stats (recommended)
Remove the fake AI insights section. Instead show a real "Health Summary" card:

- **Firing alerts** — count of alerts with `status = "firing"`, linked to `/alerts?status=firing`
- **Machines offline** — count of machines with `status = "offline"`, linked to `/machines`
- **Most recent fire** — last `firedAt` timestamp across all alerts, with alert name + link
- **Quiet for X hours** — if no alerts firing, show "No active incidents for Xh"

All data is already available from the existing `/api/alerts` and `/api/machines` fetches on the page.

### Option B — Remove entirely
Delete the AI insights section and add a simple "Quick Actions" panel instead (Create Alert, Add Machine, New Dashboard).

## Recommendation
Option A — it gives users genuinely useful at-a-glance data without requiring any new API calls.

## Files
- `src/app/(product)/overview/page.tsx` — replace mock insights section with real computed stats
