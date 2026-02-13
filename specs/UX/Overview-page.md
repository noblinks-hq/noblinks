# Noblinks — Overview Page Implementation Spec

## Philosophy

The Overview page is a **signal-only situation room**.

It must answer one question:

> Is anything wrong right now?

No dashboards.
No charts.
No metrics.
No counts.
No clutter.

If everything is healthy → the page should feel calm and mostly empty.
If something is wrong → it should be immediately obvious.

---

## Review Notes

> **Improvements applied during phase planning:**
> - Removed "dark background" visual rule — the page respects the app's light/dark theme system (`bg-background`, `text-foreground`, etc.)
> - Clarified data sources: machines and alerts come from `useNoblinks()` mock context for now (no DB tables for these yet). AI insights use hardcoded mock data.
> - Removed "environment" from alert/machine subtext — the current `Alert` and `Machine` types don't have an `environment` field. Can be added later when real data exists.
> - Alert status in mock data uses `"triggered"` not `"firing"` — filter accordingly.
> - Added `AiInsight` interface to types for structured mock data.

---

# Implementation Phases

## Phase 1: Core Layout + Firing Alerts + Empty State — `[ ]`

**Goal:** Replace the current dashboard-style overview with the signal-only layout. Show active alerts and the calm empty state.

### Tasks:
- [ ] Rewrite `src/app/(product)/overview/page.tsx`:
  - Remove stat cards, charts, table, and AI suggestions sidebar
  - Vertical stacked layout with centered container (max-w-4xl)
  - Read `alerts` and `machines` from `useNoblinks()` context
- [ ] Build "Active Alerts" section:
  - Only renders when there are alerts with `status === "triggered"`
  - Section header "Active Alerts" with subtle divider
  - Each alert as a horizontal card: severity dot (red=critical, orange=warning), title, machine name, relative trigger time, "View" link to `/alerts/[id]`
  - Subtle border, hover state, clean spacing
- [ ] Build "All systems operational" empty state:
  - Renders when no firing alerts, no offline machines, no AI insights
  - Centered: CheckCircle2 icon, "All systems operational" title, "No active alerts or risks detected." subtext
  - Large vertical breathing space

### Files:
- Modify: `src/app/(product)/overview/page.tsx`

---

## Phase 2: Offline Machines + AI Insights Sections — `[ ]`

**Goal:** Add the remaining two signal sections.

### Tasks:
- [ ] Build "Offline Machines" section:
  - Only renders when there are machines with `status === "offline"`
  - Section header "Offline Machines"
  - Each machine as horizontal card: yellow/red dot, machine name, "Last seen X ago", "View Machine" link to `/machines/[id]`
- [ ] Add `AiInsight` type to `src/lib/types.ts`:
  - `id`, `message`, `machineId`, `machineName`, `confidence` (optional)
- [ ] Build "AI Insights" section:
  - Uses hardcoded mock data (same pattern as current `aiSuggestions`)
  - Only renders when insights exist
  - Section header "AI Insights"
  - Each insight as horizontal card: blue dot, AI message, affected machine, optional confidence text, "Review" link
- [ ] Ensure empty state logic accounts for all three sections

### Files:
- Modify: `src/app/(product)/overview/page.tsx`
- Modify: `src/lib/types.ts` (add `AiInsight` interface)

---

## Phase 3: Polish + Seed Data Tuning — `[ ]`

**Goal:** Add an offline machine to seed data so the section is visible, refine spacing, and verify behavioral rules.

### Tasks:
- [ ] Add one offline machine to `seedMachines` in `src/lib/mock-data.ts` (e.g. `staging-db-1`, status `"offline"`, lastSeen `"4 minutes ago"`)
- [ ] Verify all three sections appear/disappear correctly based on data
- [ ] Verify empty state shows when all alerts are resolved and no offline machines
- [ ] Run `pnpm run lint && pnpm run typecheck`

### Files:
- Modify: `src/lib/mock-data.ts`

---

# Original Spec Details (Reference)

## Layout Structure

Vertical stacked sections.
No grids.
No cards mosaic.
Full-width centered content container (max-width ~900–1100px).

Order (top → bottom):

1. Firing Alerts
2. Offline Machines
3. AI Risk Warnings

Sections should only render if they contain items.

---

## 1. Firing Alerts Section

### When Empty
Do not render the section.

### When Present
Render section at the very top.

#### Section Header
"Active Alerts"

Subtle divider below header.

#### Alert Item Design

Each alert is a horizontal card:

Left:
- Severity dot
  - Red → Critical
  - Orange → Warning

Center:
- Alert title (human-readable, AI-generated)
- Subtext:
  - Machine name
  - Trigger time ("Triggered 3m ago")

Right:
- "View" button (routes to alert detail page)

#### Visual Rules
- Subtle border
- No charts
- No metric previews
- No unnecessary icons

High contrast but not flashy.

---

## 2. Offline Machines Section

### Purpose
Show machines where:
- Agent heartbeat missing
- Host unreachable
- Endpoint down

### When Empty
Do not render.

### When Present

#### Section Header
"Offline Machines"

#### Machine Item Layout

Horizontal row:

Left:
- Yellow status dot

Center:
- Machine name
- "Last seen 4m ago"

Right:
- "View Machine" button

No charts.
No CPU/memory.
Just status.

---

## 3. AI Risk Warnings Section

### Purpose
Predictive warnings.
Not yet alerts.

Examples:
- "Disk usage trending toward 90% within 2 days"
- "Memory growth anomaly detected"
- "CPU saturation spikes increasing"

### When Empty
Do not render.

### When Present

#### Section Header
"AI Insights"

#### Risk Item Layout

Horizontal card:

Left:
- Subtle blue indicator (NOT red)

Center:
- AI message (clear, natural language)
- Affected machine
- Confidence level (optional small muted text)

Right:
- "Review" button

Tone must feel intelligent, not alarming.

---

## Empty State (All Healthy)

If:
- No firing alerts
- No offline machines
- No AI risks

Then render a centered calm state:

Title:
"All systems operational"

Subtext:
"No active alerts or risks detected."

Optional subtle checkmark icon.

Large vertical breathing space.
Minimal UI elements.
No noise.

This state should feel calm and controlled.

---

## Visual Rules

- Respects the app's light/dark theme system (use standard shadcn tokens)
- Red used ONLY for firing alerts (critical)
- Orange used for warnings
- Blue used for AI insights
- Yellow used for offline machines

Avoid:
- Charts
- Graphs
- Metrics tiles
- Environment filters
- Dashboard previews
- Activity feeds

Overview is not analytics.
It is triage.

---

## Data Requirements

Overview page reads from `useNoblinks()` context:

- Alerts where status = "triggered"
- Machines where status = "offline"
- AI insights (hardcoded mock data for now)

No historical data.
No pagination required initially.

---

## Behavioral Rules

- Sections dynamically appear/disappear based on data.
- Page height adjusts naturally.
- No empty placeholders for empty sections.
- Page should feel quiet when healthy.

---

## Future Extension (Not MVP)

- Auto-refresh every 15–30 seconds.
- Optional sound for new critical alert.
- Collapsible sections.
- Real API data sources (when machine/alert DB tables exist).

Not required for initial implementation.

---

## Goal

Overview must feel like:

A calm mission control surface that only speaks when necessary.
