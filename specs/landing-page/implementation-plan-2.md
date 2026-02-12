# Product UI Simulation — Intent-Driven Noblinks

## Objective

Simulate a fully working Noblinks product experience using static and mock data only.

- No database logic.
- No real monitoring.
- No real AI calls.
- No backend changes.

We are validating:

- UX flow
- Product narrative
- Intent-driven monitoring experience
- Alert → terminal → AI guidance story

---

## Architecture Decisions

### State Management

Use a single React Context provider (`NoblinksProvider`) to hold all mock state. This context wraps the `DashboardLayout` and exposes:

- `machines` — list of added machines
- `alerts` — list of triggered/resolved alerts
- `widgets` — map of machine ID → active widgets
- Helper functions: `addMachine`, `addAlert`, `updateAlertStatus`, `addWidget`

No external state library needed — React Context + `useReducer` is sufficient for mock data.

**File:** `src/context/noblinks-context.tsx`

### Charting Library

Install `recharts` — it's the most common React charting library, works with SSR, and supports the existing CSS variable chart colors (`--chart-1` through `--chart-5` already defined in `globals.css`).

**Install:** `pnpm add recharts`

### Mock Data Schema

All mock data lives in `src/lib/mock-data.ts` with shared TypeScript types in `src/lib/types.ts`.

```ts
// src/lib/types.ts

type MachineType = "linux" | "windows" | "kubernetes";
type MachineStatus = "online" | "offline";
type AlertSeverity = "critical" | "warning" | "info";
type AlertStatus = "triggered" | "resolved";

interface Machine {
  id: string;
  name: string;
  type: MachineType;
  status: MachineStatus;
  lastSeen: string;       // e.g. "2 minutes ago"
}

interface Alert {
  id: string;
  machineId: string;
  title: string;
  severity: AlertSeverity;
  status: AlertStatus;
  triggeredAt: string;     // ISO timestamp
  description: string;     // AI-generated explanation
}

interface Widget {
  id: string;
  machineId: string;
  type: "timeseries" | "stat";
  title: string;           // e.g. "Docker Storage"
  metric: string;          // e.g. "disk_usage_percent"
  data: { time: string; value: number }[];
  thresholdValue?: number; // optional threshold line
}
```

### Keyword → Widget + Alert Mapping

When the AI chat detects a keyword, it produces a specific widget and alert:

| User says (contains) | Widget created | Alert created |
|---|---|---|
| `docker storage` | Docker Storage % (timeseries, threshold 80%) | "Docker storage at 82% on {machine}" (warning) |
| `disk filling` | Disk Usage GB (timeseries, threshold 90%) | "Disk usage at 91% on {machine}" (critical) |
| `pods restart` | Pod Restarts (timeseries, threshold 5) | "Pod restart loop detected on {machine}" (critical) |
| `cpu spike` | CPU Usage % (timeseries, threshold 85%) | "CPU spike to 94% on {machine}" (warning) |

Each keyword also has a canned AI response stored in `src/lib/mock-data.ts`.

### Routing Strategy

New product pages live inside a route group `(product)` with its own layout. Existing routes remain untouched.

```
src/app/
├── page.tsx                          # Landing page (unchanged)
├── (auth)/...                        # Auth routes (unchanged)
├── (product)/                        # NEW — product route group
│   ├── layout.tsx                    # DashboardLayout with sidebar
│   ├── overview/page.tsx             # Phase 9
│   ├── machines/page.tsx             # Phase 2
│   ├── machines/[id]/page.tsx        # Phase 3 + 4 + 5
│   ├── alerts/page.tsx               # Phase 6
│   ├── alerts/[id]/page.tsx          # Phase 7 + 8
│   └── settings/page.tsx             # Phase 10
├── dashboard/page.tsx                # Existing (unchanged)
├── chat/page.tsx                     # Existing (unchanged)
└── profile/page.tsx                  # Existing (unchanged)
```

The landing page "View Dashboard" button will update to link to `/overview` instead of `/dashboard`.

### New Component File Structure

```
src/components/
├── product/
│   ├── dashboard-layout.tsx          # Sidebar + main content wrapper
│   ├── sidebar.tsx                   # Left nav with route links
│   ├── machine-card.tsx              # Machine list item
│   ├── add-machine-modal.tsx         # Add machine dialog
│   ├── ai-chat-panel.tsx             # Right-side chat panel
│   ├── terminal-block.tsx            # Simulated terminal output
│   ├── time-series-widget.tsx        # Recharts line chart card
│   ├── stat-widget.tsx               # Single-value stat card
│   ├── alert-row.tsx                 # Alert table row
│   ├── severity-badge.tsx            # Critical/Warning/Info badge
│   └── empty-state.tsx               # Reusable empty state message
```

### Phase Dependencies

```
Phase 0 (Foundations)
  └─► Phase 1 (Layout)
        ├─► Phase 2 (Machines) ──► Phase 3 (Machine Detail)
        │                              └─► Phase 4 (AI Chat) ──► Phase 5 (Widgets)
        ├─► Phase 6 (Alerts) ──► Phase 7 (Alert Detail) ──► Phase 8 (Terminal)
        ├─► Phase 9 (Overview)
        └─► Phase 10 (Settings)
              └─► Phase 11 (Polish)
```

---

## Phase 0 — Foundations

**Goal:** Install dependencies, create shared types, mock data, and context provider.

### Tasks

- [x] Install `recharts`: `pnpm add recharts`
- [x] Create `src/lib/types.ts` with `Machine`, `Alert`, `Widget`, `MachineType`, `AlertSeverity`, `AlertStatus` types
- [x] Create `src/lib/mock-data.ts` with:
  - [x] `generateTimeSeriesData(points: number, min: number, max: number)` helper
  - [x] Pre-built widget data generators for each keyword (docker storage, disk, pods, cpu)
  - [x] Canned AI response strings for each keyword
  - [x] Seed data: 2 pre-existing machines (one Linux VM, one Kubernetes cluster)
- [x] Create `src/context/noblinks-context.tsx` with:
  - [x] `NoblinksProvider` component using `useReducer`
  - [x] Actions: `ADD_MACHINE`, `ADD_ALERT`, `UPDATE_ALERT_STATUS`, `ADD_WIDGET`
  - [x] `useNoblinks()` hook to consume context
- [x] Run `pnpm run lint` — confirm zero errors
- [x] Run `pnpm run typecheck` — confirm zero errors

---

## Phase 1 — SaaS Layout & Navigation

**Goal:** Transform app into a real monitoring SaaS layout.

**Depends on:** Phase 0

### Tasks

- [x] Create `src/components/product/sidebar.tsx`:
  - [x] Navigation items: Overview, Machines, Alerts, AI Assistant (links to `/machines` with chat panel), Settings
  - [x] Each item uses a `lucide-react` icon: `LayoutDashboard`, `Server`, `AlertTriangle`, `Bot`, `Settings`
  - [x] Active route highlighting using `usePathname()`
  - [x] Collapsed state on mobile using a hamburger toggle
- [x] Create `src/components/product/dashboard-layout.tsx`:
  - [x] Sidebar on left, scrollable main content on right
  - [x] Wrap children with `NoblinksProvider`
  - [x] Minimal top bar with user profile + dark mode toggle (reuse existing `UserProfile` and `ModeToggle`)
- [x] Create `src/app/(product)/layout.tsx` that renders `DashboardLayout`
- [ ] Verify layout renders in both dark and light mode *(manual)*
- [ ] Verify sidebar collapses on viewports below `md` breakpoint *(manual)*
- [x] Run `pnpm run lint` — confirm zero errors
- [x] Run `pnpm run typecheck` — confirm zero errors

---

## Phase 2 — Machines Page

**Route:** `/machines`

**Goal:** Allow user to add and view machines (mocked).

**Depends on:** Phase 1

### Tasks

- [ ] Create `src/app/(product)/machines/page.tsx`
- [ ] Create `src/components/product/add-machine-modal.tsx`:
  - [ ] Use existing `Dialog` component from `@/components/ui/dialog`
  - [ ] Machine Name `Input` field (required)
  - [ ] Machine Type dropdown using a `select` or `DropdownMenu`: Linux VM, Windows VM, Kubernetes Cluster
  - [ ] On submit: call `addMachine()` from context, close modal
- [ ] Create `src/components/product/machine-card.tsx`:
  - [ ] Display: name, type `Badge`, status `Badge` (green "Online"), last seen text
  - [ ] Entire card is clickable → navigates to `/machines/[id]`
- [ ] Page layout:
  - [ ] Header row: "Machines" title + "Add Machine" `Button`
  - [ ] Grid of `MachineCard` components (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
  - [ ] Empty state when no machines: "No machines connected. Add your first machine to get started."
- [ ] Seed page with 2 pre-existing machines from context
- [ ] Run `pnpm run lint` — confirm zero errors
- [ ] Run `pnpm run typecheck` — confirm zero errors

---

## Phase 3 — Machine Detail Page

**Route:** `/machines/[id]`

**Goal:** Simulate monitoring surface for a single machine with AI chat panel.

**Depends on:** Phase 2

### Tasks

- [ ] Create `src/app/(product)/machines/[id]/page.tsx`
- [ ] Page header:
  - [ ] Breadcrumb: Machines → {Machine Name}
  - [ ] Machine Name as `h1`
  - [ ] Status `Badge` + Type `Badge` inline
- [ ] Two-column layout:
  - [ ] Left (2/3 width): widget area
  - [ ] Right (1/3 width): AI chat panel
- [ ] Widget area:
  - [ ] When no widgets exist, show `EmptyState`: "This machine is not being monitored yet. Tell Noblinks what you care about."
  - [ ] When widgets exist, render them in a `grid-cols-1 lg:grid-cols-2` grid
- [ ] Create `src/components/product/empty-state.tsx` — reusable centered message with icon
- [ ] On mobile: stack chat panel below widget area (single column)
- [ ] Run `pnpm run lint` — confirm zero errors
- [ ] Run `pnpm run typecheck` — confirm zero errors

---

## Phase 4 — AI Chat Simulation

**Goal:** Simulate AI creating monitoring from plain English. No real API calls.

**Depends on:** Phase 3

### Tasks

- [ ] Create `src/components/product/ai-chat-panel.tsx`:
  - [ ] Fixed-height panel with scrollable message area + input at bottom
  - [ ] User messages: right-aligned, primary background
  - [ ] AI messages: left-aligned, muted background
  - [ ] Typing indicator: 3-dot animation shown for 1 second before AI responds
- [ ] Implement keyword detection in `handleSend`:
  - [ ] Normalize input to lowercase
  - [ ] Match against: `docker storage`, `disk filling`, `pods restart`, `cpu spike`
  - [ ] If matched:
    - [ ] Append user message to chat
    - [ ] Show typing indicator (1s delay)
    - [ ] Append canned AI response from `mock-data.ts`
    - [ ] Call `addWidget()` from context with generated data for that keyword
    - [ ] Call `addAlert()` from context with corresponding alert
  - [ ] If not matched:
    - [ ] Respond with fallback: "I can help you monitor that. Try asking about Docker storage, disk usage, CPU, or pod restarts."
- [ ] Auto-scroll to bottom on new messages
- [ ] Store chat messages in component state (not persisted — resets on navigation)
- [ ] Pass `machineId` as prop so widgets and alerts are linked to the current machine
- [ ] Run `pnpm run lint` — confirm zero errors
- [ ] Run `pnpm run typecheck` — confirm zero errors

---

## Phase 5 — Widget Simulation

**Goal:** Show believable monitoring visualizations using recharts.

**Depends on:** Phase 4 (widgets are created by chat)

### Tasks

- [ ] Create `src/components/product/time-series-widget.tsx`:
  - [ ] Card with title in header
  - [ ] `recharts` `LineChart` with `ResponsiveContainer`
  - [ ] X-axis: time labels, Y-axis: metric values
  - [ ] Optional `ReferenceLine` for threshold (dashed, red)
  - [ ] Use CSS variable chart colors (`--chart-1`, etc.)
  - [ ] Card styling: `p-6 rounded-xl border`
- [ ] Create `src/components/product/stat-widget.tsx`:
  - [ ] Card with title, large number, and trend indicator (up/down arrow + percentage)
  - [ ] Same card styling as timeseries widget
- [ ] `generateTimeSeriesData()` in `mock-data.ts`:
  - [ ] Generates 24 data points (simulating 24 hours)
  - [ ] Values fluctuate realistically within min/max range
  - [ ] Final 3–4 points trend upward to simulate the alert trigger
- [ ] Verify widgets render inside the machine detail page grid when created by chat
- [ ] Verify widgets look correct in both dark and light mode
- [ ] Run `pnpm run lint` — confirm zero errors
- [ ] Run `pnpm run typecheck` — confirm zero errors

---

## Phase 6 — Alerts Page

**Route:** `/alerts`

**Goal:** Simulate alert lifecycle with a filterable table.

**Depends on:** Phase 1 (layout only — alerts can also be seeded)

### Tasks

- [ ] Create `src/app/(product)/alerts/page.tsx`
- [ ] Create `src/components/product/severity-badge.tsx`:
  - [ ] `critical` → red `Badge` (destructive variant)
  - [ ] `warning` → yellow/amber `Badge`
  - [ ] `info` → blue `Badge` (secondary variant)
- [ ] Create `src/components/product/alert-row.tsx`:
  - [ ] Displays: title, severity badge, machine name, status badge, triggered time
  - [ ] Clickable → navigates to `/alerts/[id]`
  - [ ] Status toggle button: Triggered ↔ Resolved (calls `updateAlertStatus` from context)
- [ ] Page layout:
  - [ ] Header: "Alerts" title
  - [ ] Table with column headers: Alert, Severity, Machine, Status, Triggered, Action
  - [ ] Empty state when no alerts: "No alerts yet. Alerts will appear here when monitors detect issues."
- [ ] Seed with 2–3 pre-existing alerts from mock data (linked to seed machines)
- [ ] Run `pnpm run lint` — confirm zero errors
- [ ] Run `pnpm run typecheck` — confirm zero errors

---

## Phase 7 — Alert Detail Page

**Route:** `/alerts/[id]`

**Goal:** Simulate contextual alert investigation.

**Depends on:** Phase 6, Phase 5 (reuses `TimeSeriesWidget`)

### Tasks

- [ ] Create `src/app/(product)/alerts/[id]/page.tsx`
- [ ] Page header:
  - [ ] Breadcrumb: Alerts → {Alert Title}
  - [ ] Alert title as `h1`
  - [ ] Severity badge + Status badge inline
  - [ ] Machine name as subtitle link (→ `/machines/[machineId]`)
- [ ] Main content:
  - [ ] `TimeSeriesWidget` showing the metric that triggered the alert, with threshold `ReferenceLine`
  - [ ] AI explanation card: shows the alert `description` field in a highlighted panel (e.g. amber background for warning, red for critical)
  - [ ] Timeline: "Triggered at {time}" → "AI analyzed" → "Suggested fix"
- [ ] Action buttons:
  - [ ] "Open Terminal" `Button` → navigates to `/alerts/[id]#terminal` or scrolls to terminal section
  - [ ] "Mark Resolved" `Button` → calls `updateAlertStatus` from context
- [ ] Run `pnpm run lint` — confirm zero errors
- [ ] Run `pnpm run typecheck` — confirm zero errors

---

## Phase 8 — Terminal Simulation

**Goal:** Simulate embedded debugging experience. No real SSH or backend logic.

**Depends on:** Phase 7 (rendered inside or below alert detail)

### Tasks

- [ ] Create `src/components/product/terminal-block.tsx`:
  - [ ] Dark background (`bg-zinc-900`), monospace font (`font-mono`), rounded corners
  - [ ] Renders a list of command + output pairs
  - [ ] Command lines prefixed with `$` in green
  - [ ] Output lines in gray/white
  - [ ] Scrollable container with max height
- [ ] Add terminal section to alert detail page (`/alerts/[id]`):
  - [ ] Rendered below the chart and AI explanation
  - [ ] Section title: "Terminal"
  - [ ] Hardcoded commands based on alert type:
    - Docker storage alert: `docker system df`, `docker image prune --dry-run`
    - Disk filling alert: `df -h`, `du -sh /var/lib/docker/*`
    - Pod restart alert: `kubectl get pods`, `kubectl describe pod {name}`
    - CPU spike alert: `top -bn1 | head -20`, `ps aux --sort=-%cpu | head -10`
- [ ] Add AI guidance panel beside or below terminal:
  - [ ] 2–3 contextual suggestions based on alert type
  - [ ] Each suggestion is a card with icon + text
  - [ ] Example: "Unused Docker images are consuming 4.2 GB. Run `docker image prune` to reclaim space."
- [ ] Run `pnpm run lint` — confirm zero errors
- [ ] Run `pnpm run typecheck` — confirm zero errors

---

## Phase 9 — Overview Page

**Route:** `/overview`

**Goal:** Create high-level monitoring summary. This is the default product landing page.

**Depends on:** Phase 1 (layout), Phase 5 (reuses widget components)

### Tasks

- [ ] Create `src/app/(product)/overview/page.tsx`
- [ ] Top stat cards row (`grid-cols-2 lg:grid-cols-4`):
  - [ ] Machines Online — count from context, `Server` icon
  - [ ] Active Alerts — count of `triggered` alerts from context, `AlertTriangle` icon
  - [ ] Total Monitors — count of all widgets from context, `Activity` icon
  - [ ] AI Suggestions — hardcoded "3", `Sparkles` icon
- [ ] Charts section (`grid-cols-1 lg:grid-cols-2`):
  - [ ] CPU Usage (24h) — `TimeSeriesWidget` with seed data
  - [ ] Memory Usage (24h) — `TimeSeriesWidget` with seed data
- [ ] Recent Alerts section:
  - [ ] List last 5 alerts from context using `AlertRow` component
  - [ ] "View all alerts" link → `/alerts`
- [ ] AI Suggestions box:
  - [ ] Card with `Sparkles` icon header
  - [ ] 2–3 hardcoded suggestions: "Docker storage trending upward on prod-api-1", "Pod restarts detected on k8s-cluster-1"
  - [ ] Each suggestion clickable → navigates to relevant machine or alert
- [ ] Update landing page "View Dashboard" link from `/dashboard` to `/overview`
- [ ] Run `pnpm run lint` — confirm zero errors
- [ ] Run `pnpm run typecheck` — confirm zero errors

---

## Phase 10 — Settings Page

**Route:** `/settings`

**Goal:** Make product feel complete with account and org settings.

**Depends on:** Phase 1 (layout only)

### Tasks

- [ ] Create `src/app/(product)/settings/page.tsx`
- [ ] Organization section (card):
  - [ ] Organization Name — static `Input` with value "My Organization"
  - [ ] Plan — `Badge` showing "Free"
  - [ ] "Upgrade Plan" `Button` (outline variant, disabled or no-op)
- [ ] Notifications section (card):
  - [ ] Email field — static `Input` with placeholder email
  - [ ] Alert channels label — "Email only" with muted text
- [ ] Connected Machines section (card):
  - [ ] Count of machines from context
  - [ ] "Manage Machines" link → `/machines`
- [ ] Danger Zone section (card with red/destructive border):
  - [ ] "Delete Organization" `Button` (destructive variant, disabled)
- [ ] All fields are static/read-only — no save functionality
- [ ] Run `pnpm run lint` — confirm zero errors
- [ ] Run `pnpm run typecheck` — confirm zero errors

---

## Phase 11 — UX Polish Pass

**Goal:** Make product feel production-ready visually.

**Depends on:** All previous phases

### Tasks

- [ ] Consistent spacing: all page content uses `space-y-6` or `space-y-8` top-level
- [ ] Consistent card styling: all cards use `border rounded-lg` (not mixed `rounded-xl` / `rounded-lg`)
- [ ] Responsive checks:
  - [ ] Sidebar collapses below `md`
  - [ ] Grids fall to single column on mobile
  - [ ] Chat panel stacks below content on mobile
  - [ ] Tables scroll horizontally on mobile
- [ ] Dark mode checks:
  - [ ] All pages render without color issues
  - [ ] Terminal block is readable in both modes
  - [ ] Charts use CSS variable colors (auto-adapt to theme)
  - [ ] Badges are legible in both modes
- [ ] Loading states:
  - [ ] Add `Skeleton` loaders on overview stat cards (brief flash on mount)
- [ ] Empty states verified:
  - [ ] Machines page with no machines
  - [ ] Alerts page with no alerts
  - [ ] Machine detail with no widgets
- [ ] No console warnings or errors
- [ ] Run `pnpm run lint` — confirm zero errors
- [ ] Run `pnpm run typecheck` — confirm zero errors

---

## Demo Flow Validation Checklist

Full end-to-end walkthrough:

- [ ] Land on `/` → click "View Dashboard" → arrive at `/overview`
- [ ] Overview shows stat cards, charts, recent alerts, AI suggestions
- [ ] Navigate to Machines via sidebar
- [ ] Click "Add Machine" → fill form → machine appears in list
- [ ] Click machine → arrive at `/machines/[id]` → see empty state
- [ ] Type "Monitor docker storage so builds don't fail" in chat
- [ ] AI responds with explanation
- [ ] Docker Storage widget appears in widget area
- [ ] Navigate to Alerts via sidebar
- [ ] New alert "Docker storage at 82%" visible in table
- [ ] Click alert → arrive at `/alerts/[id]`
- [ ] See chart with threshold line, AI explanation, timeline
- [ ] Click "Open Terminal"
- [ ] Terminal shows `docker system df` output
- [ ] AI guidance panel shows actionable suggestions
- [ ] Navigate to Settings → see org info and machine count
- [ ] Toggle dark mode → all pages render correctly
- [ ] Test on mobile viewport → sidebar collapses, layouts stack

---

## Constraints

Do NOT:

- Connect real database
- Implement real monitoring logic
- Implement real AI API calls
- Add backend routes
- Add real authentication logic changes
- Modify existing `/dashboard`, `/chat`, or `/profile` pages
- Modify auth routes or auth logic

Everything must use static or frontend state only.

---

## Definition of Done

- Product feels like a real monitoring SaaS
- Intent → visualization → alert → terminal flow works end-to-end
- All sidebar navigation works
- All breadcrumbs and back-navigation works
- Empty states shown when no data exists
- No runtime errors or console warnings
- UI looks polished and cohesive in both light and dark mode
- `pnpm run lint` passes
- `pnpm run typecheck` passes
