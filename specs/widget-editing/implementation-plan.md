# Widget Editing — Implementation Plan

## Status
**TODO** — `PATCH /api/dashboards/[id]/widgets/[widgetId]` exists and works. The UI has no way to invoke it.

## Problem
Once a widget is created, users cannot change its title or type. They must delete and recreate it.

## What to Build

### Inline title editing
- Click the widget title → becomes a text `<input>`
- On blur or Enter → call `PATCH` with `{ title }`
- On Escape → cancel edit

### Type switcher
- Add a small dropdown (or icon row) on the widget card's edit mode
- Options: timeseries, stat
- On change → call `PATCH` with `{ type }`
- Widget re-renders with new type immediately (optimistic)

### Edit mode toggle
- Pencil icon on widget card hover (alongside existing delete button)
- Click → enters "edit mode" for that widget (shows title input + type switcher)
- Click again or click away → exits edit mode

## Files
- `src/app/(product)/dashboards/[id]/page.tsx` — add edit state per widget, inline input, type switcher
- `src/app/api/dashboards/[id]/widgets/[widgetId]/route.ts` — already exists, no changes needed

## PATCH endpoint contract
```
PATCH /api/dashboards/[id]/widgets/[widgetId]
Body: { title?: string, type?: "timeseries" | "stat" }
Response: { widget: Widget }
```
