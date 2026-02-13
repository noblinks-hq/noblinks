# Dashboards Page — UI Specification (Manual Creation Version)

## Purpose

The Dashboards page is an index page that displays a grid of dashboard cards.

Each card represents:
- One environment
- One category (Infrastructure / Docker / Kubernetes / Custom)
- One logical monitoring board

Clicking a card opens the full Dashboard Detail view.

This page is a selection hub, NOT the visualization canvas itself.

---

## Review Notes

> **Improvements applied during phase planning:**
> - Added DB schema requirements (no `dashboard` table exists yet)
> - Deferred slideshow to Phase 4 (too heavy for MVP)
> - Clarified "environment" as a free-text field (for now)
> - Made preview section more concrete (colored gradient placeholder)
> - Added search/filter to Phase 3
> - Added edit/delete dashboard to Phase 3
> - Sidebar integration note: use existing `(product)` layout, add "Dashboards" nav item

---

# Implementation Phases

## Phase 1: Database Schema & API — `[ ]`

**Goal:** Create the data layer for dashboards.

### Tasks:
- [ ] Add `dashboard` table to `src/lib/schema.ts`:
  - `id` (UUID, primary key)
  - `name` (text, not null)
  - `environment` (text, not null) — free-text for now
  - `category` (text, not null) — one of: infrastructure, docker, kubernetes, custom
  - `organizationId` (text, FK to organization)
  - `createdBy` (text, FK to user)
  - `visualizationCount` (integer, default 0)
  - `createdAt` (timestamp)
  - `updatedAt` (timestamp)
- [ ] Generate and run migration
- [ ] Create API routes under `src/app/api/dashboards/`:
  - `GET /api/dashboards` — list dashboards for active org
  - `POST /api/dashboards` — create dashboard
- [ ] Add `Dashboard` type to `src/lib/types.ts`

---

## Phase 2: Dashboards Index Page (Core UI) — `[ ]`

**Goal:** Build the page layout, card grid, empty state, and create modal.

### Tasks:
- [ ] Create `src/app/(product)/dashboards/page.tsx`
- [ ] Add "Dashboards" link to the product sidebar navigation
- [ ] Implement page header: title "Dashboards" + [+ New Dashboard] button
- [ ] Implement responsive card grid (3 cols / 2 cols / 1 col)
- [ ] Build Dashboard Card component with three sections:
  - **Title section:** Dashboard name (bold), environment (muted), category badge
  - **Preview section:** Colored gradient placeholder block (no real metrics)
  - **Footer section:** "X visualizations" + "Updated Y ago" (relative time)
- [ ] Card styling: subtle shadow, rounded corners, hover elevation/border
- [ ] Implement empty state (monitor icon + "No dashboards yet" + Create button)
- [ ] Build "New Dashboard" modal (Dialog):
  - Dashboard Name (text input)
  - Environment (text input)
  - Category (select: Infrastructure / Docker / Kubernetes / Custom)
  - Create button → calls POST API → refreshes grid
- [ ] Wire up click on card → navigate to `/dashboards/[id]` (placeholder page for now)

---

## Phase 3: Search, Filter & CRUD — `[ ]`

**Goal:** Add filtering, search, edit, and delete capabilities.

### Tasks:
- [ ] Add search input to header (filter cards by name)
- [ ] Add category filter tabs or dropdown (All / Infrastructure / Docker / Kubernetes / Custom)
- [ ] Add card context menu (three-dot menu or right-click):
  - Edit dashboard (opens modal with pre-filled fields)
  - Delete dashboard (confirmation dialog)
- [ ] API routes:
  - `PATCH /api/dashboards/[id]` — update dashboard
  - `DELETE /api/dashboards/[id]` — delete dashboard
- [ ] Add optimistic UI updates for create/edit/delete

---

## Phase 4: Slideshow Feature — `[ ]`

**Goal:** Add the slideshow/rotation feature for NOC/wall-display use cases.

### Tasks:
- [ ] Add [Start Slideshow] button to header (only visible when dashboards exist)
- [ ] Build slideshow configuration modal:
  - Dashboard selection with checkboxes
  - Slide duration input (default: 5 seconds)
  - Mode toggle: cycle all selected / single dashboard
  - Start button
- [ ] Implement fullscreen slideshow view:
  - Enter fullscreen mode (Fullscreen API)
  - Hide sidebar and top navigation
  - Display dashboard detail view
  - Show exit button (top-right corner)
  - Exit on ESC key
- [ ] Rotation logic:
  - Rotate through pages within a dashboard
  - Move to next selected dashboard
  - Loop continuously
- [ ] Smooth fade transitions (300–500ms)
- [ ] No scrolling during slideshow

---

# Original Spec Details (Reference)

## Page Layout

### Top Header Bar

Left side:
- Page title: "Dashboards"

Right side:
- [+ New Dashboard] button
- [Start Slideshow] button (Phase 4)

The header should be clean and minimal.
No environment nesting.
No dropdown clutter.

---

## Main Content — Dashboard Cards Grid

Display dashboards in a responsive grid:

- 3 columns on large screens
- 2 columns on medium screens
- 1 column on mobile

Cards should have:
- Subtle shadow
- Rounded corners
- Clean spacing
- Hover effect (slight elevation or border highlight)
- Clickable cursor

---

## Dashboard Card Structure

Each dashboard card must contain three sections:

### 1. Title Section (Top)

- Dashboard Name (bold, prominent)
- Environment Name (smaller, muted text below title)
- Category Badge (small label like: Linux / Docker / Kubernetes / Custom)

Example layout:

Infrastructure Health
Production
[ Linux ]

Do NOT show:
- Owner
- Organization
- Billing info
- Member count

---

### 2. Preview Section (Middle)

A visual placeholder preview.

For MVP:
- Show a colored gradient block matching the category
- Optionally show abstract mini chart lines as SVG

This is only a visual preview.
No real metrics required yet.

Keep it lightweight and clean.

---

### 3. Footer Section (Bottom)

Small muted text:

- "6 visualizations"
- "Updated 2 hours ago"

Optional (Phase 3+):
- Small health indicator dot (green / yellow / red)

---

## Empty State

If no dashboards exist:

Center the following:

Icon (subtle monitor icon)

Text:
"No dashboards yet."

Subtext:
"Create your first dashboard to start visualizing your infrastructure."

Button:
[ Create Dashboard ]

---

## New Dashboard Flow

Clicking [+ New Dashboard] opens a modal (Dialog component).

Fields:

- Dashboard Name (text input, required)
- Environment (text input, required)
- Category (select: Infrastructure / Docker / Kubernetes / Custom)

Create button at bottom-right.

On creation:
- Close modal
- Add new dashboard card to grid
- Show success toast

---

## Navigation Behavior

Clicking a dashboard card:
- Opens `/dashboards/[id]` — Dashboard Detail page
- Shows full visualization canvas
- Allows editing and AI interactions

This page is only the dashboard index.

---

## Design Constraints

Keep design:
- Minimal
- Clean
- Operational
- Not administrative
- Integrate with existing `(product)` layout and sidebar
