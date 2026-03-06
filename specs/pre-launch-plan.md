# Pre-Launch Plan — Noblinks

Everything required before adding payment and offering to the public.
Ordered by priority. Each item has a clear scope so it can be implemented in one session.

---

## Current State Summary

The product has solid foundations:
- Auth, orgs, invites ✅
- Agent registration + heartbeat + metrics push ✅
- Dashboard + widget creation (AI-powered) ✅
- Alert creation (AI-powered) ✅
- Slideshow mode ✅
- Agent pending-queries (real-time PromQL) ✅

Critical gaps before charging users:
- Alerts never fire automatically (no Prometheus → AlertManager loop)
- No notifications (no email, no webhook)
- Overview AI insights are hardcoded mock data
- No metric data cleanup (table grows unbounded)
- No widget editing
- No pagination (will break at scale)
- Several UX gaps that make the product feel unpolished

---

## Phase 1 — Core Reliability (Must-have before any paid users)

### 1.1 Alert Firing Detection
**Problem:** Alerts are created and set to "active" but the status never changes to "firing" or "resolved" automatically. The AlertManager webhook endpoint exists but does nothing.

**What to build:**
- Wire `POST /api/agent/webhook` to parse AlertManager webhook payload
- When an alert fires: find matching alert by `noblinks_alert_id` label → set `status = "firing"`
- When resolved: set `status = "resolved"`
- Store `firedAt` / `resolvedAt` timestamps (add columns to `alert` table)
- Show a firing indicator (pulsing red dot) on the alert list page

**Files:** `src/app/api/agent/webhook/route.ts`, `src/lib/schema.ts` (add columns), `src/app/(product)/alerts/page.tsx`

---

### 1.2 Email Notifications
**Problem:** No notifications are sent when an alert fires. Users have no reason to log in unless they notice.

**What to build:**
- Add `notificationEmail` field to organization table (already shown in settings UI but not stored)
- Add `notifyOnFire` and `notifyOnResolve` boolean fields to `alert` table
- When webhook marks alert as firing → send email via Resend/Nodemailer
- When resolved → send resolution email
- Email template: alert name, machine, severity, threshold, current value, link to alert detail
- Settings UI: configure notification email (save it, it's currently display-only)

**Files:** `src/lib/schema.ts`, `src/app/api/agent/webhook/route.ts`, `src/app/(product)/settings/page.tsx`, new `src/lib/email.ts`

---

### 1.3 Metric Sample Retention Cleanup
**Problem:** `metric_sample` table grows forever. With one machine pushing every 30s, that's 2,880 rows/day per metric. At 10 machines × 5 metrics = 144,000 rows/day.

**What to build:**
- Add a cleanup cron via `GET /api/cron/cleanup` (Vercel cron or external ping)
- Delete `metric_sample` rows older than 24 hours
- Add `vercel.json` cron schedule (daily)
- Document the endpoint

**Files:** `src/app/api/cron/cleanup/route.ts`, `vercel.json`

---

### 1.4 Widget Editing
**Problem:** Once a widget is created, users cannot change its title or type. They must delete and recreate it.

**What to build:**
- Add edit button to `WidgetCard` (pencil icon alongside the delete button)
- Inline edit for title (click title → text input)
- Dropdown to change widget type (timeseries/stat/bar/pie/toplist)
- `PATCH /api/dashboards/[id]/widgets/[widgetId]` already exists — just wire the UI

**Files:** `src/app/(product)/dashboards/[id]/page.tsx`

---

### 1.5 Real AI Insights on Overview
**Problem:** The `/overview` page AI insights section shows hardcoded mock data ("CPU spike detected..."). This is embarrassing and misleading.

**What to build:**
- Either: replace with real data (recent metric trends from `metric_sample` + active alert count)
- Or: remove the AI insights section entirely until it's properly built
- Show real stats: active alerts count, machines online/offline count, top metric by value
- Add a "last updated" timestamp

**Files:** `src/app/(product)/overview/page.tsx`

---

## Phase 2 — UX Polish (Required for good first impression)

### 2.1 Pagination
**Problem:** Dashboards, alerts, and machines pages load all records with no pagination. Will break with 50+ items.

**What to build:**
- Add `limit`/`offset` query params to GET endpoints: `/api/dashboards`, `/api/alerts`, `/api/machines`
- Add simple prev/next pagination UI (no need for full pagination component — just "Show more" button)
- Default page size: 20

**Files:** All three list API routes + their corresponding pages

---

### 2.2 Machine Status Auto-Update
**Problem:** Machine `status` is set to "online" when agent registers and heartbeats, but never automatically set to "offline" if the agent stops.

**What to build:**
- Add a background check: if `lastSeen` is older than 2 minutes → mark as "offline"
- Run this check in the heartbeat route (mark OTHER stale machines as offline on each heartbeat call, or in the cron cleanup)
- Show accurate online/offline badge in machines list
- Show offline warning on dashboard widgets that belong to offline machines

**Files:** `src/app/api/agent/heartbeat/route.ts`, `src/app/(product)/machines/page.tsx`

---

### 2.3 Metrics Explorer
**Problem:** Users don't know what metrics are available when creating widgets. There's no way to browse what a machine is actually reporting.

**What to build:**
- Add a "Browse metrics" button/tab on the dashboard detail page
- Show a list of metric keys being pushed by each machine (query distinct `metricKey` from `metric_sample` for that org)
- Click a metric → pre-fills the "Add Widget" modal prompt
- Simple list, no charts needed here

**Files:** `src/app/(product)/dashboards/[id]/page.tsx`, new API route `GET /api/metrics` (list distinct keys per machine)

---

### 2.4 Alert Firing History
**Problem:** There's no history of when an alert fired or was resolved. Users can't audit past incidents.

**What to build:**
- Add `alert_event` table: `alertId`, `event` (fired|resolved), `occurredAt`, `details` (jsonb)
- When webhook fires/resolves an alert → insert an event row
- On alert detail page → show a simple timeline of events (fired at X, resolved at Y)
- Keep last 30 events per alert

**Files:** `src/lib/schema.ts`, `src/app/api/agent/webhook/route.ts`, `src/app/(product)/alerts/[id]/page.tsx`

---

### 2.5 Slideshow Pause/Play + Manual Advance
**Problem:** Slideshow has no pause or manual navigation. If a user wants to stay on a dashboard longer they can't.

**What to build:**
- Add pause/play button to slideshow overlay
- Add left/right arrow buttons for manual advance
- Keyboard: space to pause, arrow keys to advance
- Pause on mouse hover

**Files:** `src/components/product/slideshow-view.tsx`

---

### 2.6 Empty States and Loading Skeletons
**Problem:** Several pages show blank content or layout-breaking states while loading or when empty.

**What to build:**
- Dashboard detail: proper skeleton while widgets load
- Alerts list: better empty state with CTA to create first alert
- Machines list: better empty state with install command snippet
- Overview: skeleton loading state instead of "0 active alerts" flash

**Files:** Multiple pages — quick targeted fixes

---

### 2.7 Mobile Responsiveness
**Problem:** The product is desktop-only. Tables, modals, and the sidebar break on mobile/tablet.

**What to build:**
- Sidebar: collapse to hamburger menu on mobile
- Dashboard/widget grid: single column on mobile
- Modals: full-screen on mobile
- Alert/machine tables: stack to card layout on small screens
- Slideshow: works on tablet (1 column widgets)

**Files:** `src/components/product/dashboard-layout.tsx`, `src/components/product/sidebar.tsx`, responsive classes on page components

---

## Phase 3 — Product Completeness (Nice-to-have before public launch)

### 3.1 Notification Channels
**Problem:** Only email notifications — no Slack, no webhooks.

**What to build:**
- Add `notificationChannel` table: `orgId`, `type` (email|slack|webhook), `config` (jsonb), `enabled`
- Settings page: add channel management UI (add Slack webhook URL, custom webhook)
- When alert fires → fan out to all enabled channels
- Slack: simple block message with alert name, severity, machine, link
- Webhook: POST JSON payload with full alert context

**Files:** `src/lib/schema.ts`, `src/lib/notify.ts`, settings page, webhook route

---

### 3.2 Capability Seed Expansion
**Problem:** Only ~5 Linux capabilities are seeded. Users asking about Docker, Kubernetes, Windows metrics get no matches.

**What to build:**
- Expand `scripts/seed-capabilities.ts` with:
  - Docker: container CPU, memory, restarts, status
  - Kubernetes: pod restarts, node pressure, deployment replicas
  - Linux additional: swap usage, inode usage, NTP offset, OOM kills
  - Network: packet loss, interface errors, bandwidth saturation
- Aim for 30+ capabilities total
- Run seed as part of deployment

**Files:** `scripts/seed-capabilities.ts`

---

### 3.3 Dashboard Sharing (Read-only Public Link)
**Problem:** Users can't share dashboards with stakeholders who don't have accounts.

**What to build:**
- Add `publicToken` field to `dashboard` table
- `POST /api/dashboards/[id]/share` → generates a token, returns public URL
- `GET /share/[token]` → public page showing dashboard widgets (read-only, no auth)
- Revoke button in dashboard settings

**Files:** `src/lib/schema.ts`, new API route, new public page `src/app/share/[token]/page.tsx`

---

### 3.4 Alert Test Mode
**Problem:** No way to verify an alert is configured correctly without waiting for the condition to occur.

**What to build:**
- "Test alert" button on alert detail page
- Uses the pending-query system to run the alert's PromQL on the machine right now
- Shows the current value vs threshold
- Tells the user if it would fire or not

**Files:** `src/app/(product)/alerts/[id]/page.tsx`, reuse `queryMachineLabels` pattern

---

### 3.5 Agent Version Management
**Problem:** No way to tell which machines are running outdated agents.

**What to build:**
- Store current `AGENT_VERSION` in a server config
- Heartbeat endpoint: compare agent version vs latest, set a `needsUpdate` flag on machine
- Machines list: show "Update available" badge for outdated agents
- Settings/install page: always shows the latest install command

**Files:** `src/app/api/agent/heartbeat/route.ts`, `src/app/(product)/machines/page.tsx`

---

## Phase 4 — Pre-Payment Checklist

Before integrating Polar/Stripe:

- [ ] **Usage limits defined** — decide what's free vs paid (e.g., 1 machine free, 5 paid; 3 dashboards free, unlimited paid)
- [ ] **Usage tracking** — count machines per org, widgets per dashboard, alerts per org in queries
- [ ] **Limit enforcement** — return 402 from create endpoints when over limit
- [ ] **Upgrade CTA** — show upgrade banner when approaching limits
- [ ] **Terms of Service + Privacy Policy** — required for payment
- [ ] **Email verification** — required before payment (check if BetterAuth enforces this)
- [ ] **Billing portal** — Polar handles most of this, just need to wire org → customer ID
- [ ] **Onboarding flow** — new user lands somewhere useful (not blank dashboard)
- [ ] **Error monitoring** — Sentry or similar (don't find out about crashes from users)
- [ ] **Rate limiting** — API routes need rate limiting before going public

---

## Implementation Order

```
Phase 1  (reliability)     → 1.1 → 1.2 → 1.3 → 1.4 → 1.5
Phase 2  (polish)          → 2.2 → 2.6 → 2.1 → 2.3 → 2.4 → 2.5 → 2.7
Phase 3  (completeness)    → 3.2 → 3.4 → 3.1 → 3.3 → 3.5
Phase 4  (payment prep)    → all checklist items → integrate Polar
```

Total estimated items: **20 features + 10 pre-payment checklist items**
