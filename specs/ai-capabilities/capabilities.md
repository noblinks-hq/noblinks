# Feature: AI Alert Creation Using Database-Backed Capability Registry

## Context

We are implementing AI-powered alert creation where users describe alerts in plain English, and the system matches their intent to predefined monitoring capabilities stored in the database.

**Constraints:**

- No Prometheus connector yet — alerts are stored in DB only
- No real alert deployment — this is control-plane simulation mode
- AI must NOT generate raw PromQL — it selects from predefined capabilities
- AI must NOT invent new capability keys — only DB-registered capabilities are valid

**Pipeline:**
```
User Intent → AI → Capability Match (from DB) → Template Fill → PromQL → Review → Store
```

---

## Improvements Over Original Spec

1. **Added `severity` field** to alerts table — existing UI depends on it (critical/warning/info)
2. **Added `description` field** to alerts table — alert cards display descriptions
3. **Added `category` to capabilities** — groups linux/kubernetes/docker for AI context and future UI filtering
4. **Added `defaultThreshold` and `defaultWindow`** to capabilities — defaults live in DB, not hardcoded in AI logic
5. **Added `suggestedSeverity`** to capabilities — AI can suggest severity based on capability type
6. **Removed `visualizationTemplate`** — unused in any step, can be added later when needed
7. **Added error handling** for when AI can't match any capability
8. **Added migration plan** from mock alerts to DB-backed alerts
9. **Unified status enum** — `configured | active | firing | resolved` (superset of old `triggered | resolved`)
10. **Added `createdBy` field** — track which user created each alert

---

## Phase 1: Database Foundation (Schema + Seed)
> Tables, migrations, seed data

- [x] **1.1** Create `monitoring_capabilities` table in `src/lib/schema.ts`
- [x] **1.2** Create `alerts` table in `src/lib/schema.ts`
- [x] **1.3** Update `src/lib/types.ts` with new TypeScript types
- [x] **1.4** Generate and run migration
- [x] **1.5** Create seed script to insert sample capabilities

### 1.1 — `monitoring_capabilities` Table

```
Fields:
- id              uuid, primary key, default random
- capabilityKey   text, unique, not null       (e.g., "linux_memory_usage_high")
- name            text, not null               (e.g., "Linux Memory High")
- description     text, not null               (human-readable explanation)
- category        text, not null               ("linux" | "kubernetes" | "docker" | "windows")
- metric          text, not null               (e.g., "node_memory_usage_percent")
- parameters      jsonb, not null              (parameter schema definition)
- alertTemplate   text, not null               (PromQL template with $placeholders)
- defaultThreshold  integer, default 80
- defaultWindow     text, default '5m'
- suggestedSeverity text, default 'warning'    ("critical" | "warning" | "info")
- createdAt       timestamp, default now
- updatedAt       timestamp, default now, auto-update

Indexes:
- capability_key_idx on capabilityKey
- capability_category_idx on category
```

### 1.2 — `alerts` Table

```
Fields:
- id              uuid, primary key, default random
- organizationId  text, not null, FK → organization.id (cascade delete)
- name            text, not null               (e.g., "High Memory Usage - prod-server-1")
- description     text                         (auto-generated or user-provided)
- capabilityId    uuid, not null, FK → monitoring_capabilities.id
- machine         text, not null               (target machine name/instance)
- threshold       integer, not null
- window          text, not null               (e.g., "5m", "15m")
- severity        text, not null, default 'warning'  ("critical" | "warning" | "info")
- promqlQuery     text, not null               (generated from template)
- status          text, not null, default 'configured'  ("configured" | "active" | "firing" | "resolved")
- createdBy       text, not null, FK → user.id (cascade delete)
- createdAt       timestamp, default now
- updatedAt       timestamp, default now, auto-update

Indexes:
- alert_org_id_idx on organizationId
- alert_capability_id_idx on capabilityId
- alert_created_by_idx on createdBy
- alert_status_idx on status
```

### 1.3 — TypeScript Types

```typescript
// New types to add to src/lib/types.ts

export type CapabilityCategory = "linux" | "kubernetes" | "docker" | "windows";

export interface MonitoringCapability {
  id: string;
  capabilityKey: string;
  name: string;
  description: string;
  category: CapabilityCategory;
  metric: string;
  parameters: Record<string, string>;  // { "machine": "string", "threshold": "number", "window": "duration" }
  alertTemplate: string;
  defaultThreshold: number;
  defaultWindow: string;
  suggestedSeverity: AlertSeverity;
  createdAt: string;
  updatedAt: string;
}

// Updated AlertStatus (replaces old "triggered" | "resolved")
export type AlertStatus = "configured" | "active" | "firing" | "resolved";

export interface DbAlert {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  capabilityId: string;
  machine: string;
  threshold: number;
  window: string;
  severity: AlertSeverity;
  promqlQuery: string;
  status: AlertStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

### 1.5 — Seed Data (3 Linux capabilities)

**1. Linux Memory High**
```
capabilityKey:     linux_memory_usage_high
name:              Linux Memory High
description:       Alert when average memory usage exceeds threshold on a Linux machine
category:          linux
metric:            node_memory_usage_percent
parameters:        { "machine": "string", "threshold": "number", "window": "duration" }
alertTemplate:     avg_over_time(node_memory_usage_percent{instance="$machine"}[$window]) > $threshold
defaultThreshold:  80
defaultWindow:     5m
suggestedSeverity: warning
```

**2. Linux CPU High**
```
capabilityKey:     linux_cpu_usage_high
name:              Linux CPU High
description:       Alert when average CPU usage exceeds threshold on a Linux machine
category:          linux
metric:            node_cpu_usage_percent
parameters:        { "machine": "string", "threshold": "number", "window": "duration" }
alertTemplate:     avg_over_time(node_cpu_usage_percent{instance="$machine"}[$window]) > $threshold
defaultThreshold:  80
defaultWindow:     5m
suggestedSeverity: warning
```

**3. Linux Disk Usage High**
```
capabilityKey:     linux_disk_usage_high
name:              Linux Disk Usage High
description:       Alert when filesystem usage exceeds threshold on a Linux machine root mountpoint
category:          linux
metric:            node_filesystem_usage_percent
parameters:        { "machine": "string", "threshold": "number", "window": "duration" }
alertTemplate:     avg_over_time(node_filesystem_usage_percent{instance="$machine", mountpoint="/"}[$window]) > $threshold
defaultThreshold:  85
defaultWindow:     10m
suggestedSeverity: critical
```

---

## Phase 2: API Layer (CRUD Endpoints)
> Backend routes for capabilities and alerts

- [x] **2.1** Create `GET /api/capabilities` — list all capabilities (with optional category filter)
- [x] **2.2** Create `POST /api/alerts` — create alert (after AI processing + template fill)
- [x] **2.3** Create `GET /api/alerts` — list alerts for current organization
- [x] **2.4** Create `GET /api/alerts/[id]` — get single alert detail
- [x] **2.5** Create `PATCH /api/alerts/[id]` — update alert status
- [x] **2.6** Create `DELETE /api/alerts/[id]` — delete alert

### API Details

**GET `/api/capabilities`**
- Auth: required
- Query: `?category=linux` (optional filter)
- Returns: `{ capabilities: MonitoringCapability[] }`

**POST `/api/alerts`**
- Auth: required (uses session.user.id as createdBy, session.activeOrganizationId as organizationId)
- Body: `{ capabilityKey, machine, threshold, window, severity?, name?, description? }`
- Logic:
  1. Find capability by key — 404 if not found
  2. Validate parameter types (threshold is number, window matches duration pattern)
  3. Replace placeholders in alertTemplate → generate promqlQuery
  4. Auto-generate name if not provided: `"{capability.name} - {machine}"`
  5. Auto-generate description from capability.description + params
  6. Insert into alerts table with status = "configured"
- Returns: `{ alert: DbAlert }`

**GET `/api/alerts`**
- Auth: required
- Scoped to current organization
- Query: `?status=configured` (optional filter)
- Returns: `{ alerts: DbAlert[] }`

**GET `/api/alerts/[id]`**
- Auth: required
- Scoped to current organization
- Returns: `{ alert: DbAlert, capability: MonitoringCapability }`

**PATCH `/api/alerts/[id]`**
- Auth: required
- Scoped to current organization
- Body: `{ status }` (only status updates for now)
- Returns: `{ alert: DbAlert }`

**DELETE `/api/alerts/[id]`**
- Auth: required
- Scoped to current organization
- Returns: `{ success: true }`

---

## Phase 3: AI Processing Endpoint
> Natural language → structured capability match via AI

- [x] **3.1** Create `POST /api/chat/create-alert` endpoint
- [x] **3.2** Build system prompt with capability context from DB
- [x] **3.3** Use Vercel AI SDK `generateObject()` for structured JSON output
- [x] **3.4** Handle AI failure / no-match cases

### AI Endpoint Details

**POST `/api/chat/create-alert`**
- Auth: required
- Body: `{ prompt: string }` (user's plain English description)
- Logic:
  1. Fetch all monitoring_capabilities from DB
  2. Build system prompt with capability list (key, name, description, metric, parameters, defaults)
  3. Call AI with `generateObject()` to get structured response
  4. Validate AI response against DB (capability must exist)
  5. Return structured result

### System Prompt Template

```
You are an alert configuration assistant for a monitoring platform.

Available monitoring capabilities:
{{#each capabilities}}
- Key: {{capabilityKey}}
  Name: {{name}}
  Description: {{description}}
  Category: {{category}}
  Parameters: {{JSON.stringify(parameters)}}
  Default Threshold: {{defaultThreshold}}
  Default Window: {{defaultWindow}}
  Suggested Severity: {{suggestedSeverity}}
{{/each}}

RULES:
1. You MUST select a capabilityKey from the list above. Never invent a new one.
2. Extract parameters from the user's message.
3. If threshold is not specified, use the capability's defaultThreshold.
4. If window/duration is not specified, use the capability's defaultWindow.
5. If severity is not specified, use the capability's suggestedSeverity.
6. Generate a clear, descriptive alertName.
7. If the user's request doesn't match ANY capability, set matched to false.
```

### AI Response Schema (Zod)

```typescript
const aiAlertSchema = z.object({
  matched: z.boolean(),
  capabilityKey: z.string().optional(),
  params: z.object({
    machine: z.string(),
    threshold: z.number(),
    window: z.string(),
  }).optional(),
  severity: z.enum(["critical", "warning", "info"]).optional(),
  alertName: z.string().optional(),
  description: z.string().optional(),
  noMatchReason: z.string().optional(),  // Explains why no capability matched
});
```

### Error Handling

- If `matched === false`: return the `noMatchReason` to the user, suggest available capabilities
- If AI returns invalid capabilityKey: reject and return error with valid options
- If AI times out: return generic error, let user retry

---

## Phase 4: Create Alert UI Flow
> Frontend: input → AI processing → review → confirm

- [x] **4.1** Create "Create Alert" button on alerts list page
- [x] **4.2** Build create alert page/modal with natural language input
- [x] **4.3** Show loading state during AI processing
- [x] **4.4** Build review screen showing parsed alert details + PromQL
- [x] **4.5** Implement confirm & cancel actions
- [x] **4.6** Show success state and redirect to alerts list

### UI Flow

```
[Alerts Page]
    ↓ Click "Create Alert"
[Create Alert Page]
    ↓ User types: "Alert me if memory usage is above 80% on prod-server-1"
    ↓ Click "Analyze"
[Loading State]
    ↓ AI returns structured response
[Review Screen]
    ┌─────────────────────────────────────────┐
    │ Alert Name: High Memory Usage - prod... │
    │ Capability: Linux Memory High           │
    │ Machine:    prod-server-1               │
    │ Threshold:  80%                         │
    │ Window:     5 minutes                   │
    │ Severity:   Warning                     │
    │                                         │
    │ PromQL Query:                           │
    │ avg_over_time(node_memory_usage_pe...   │
    │                                         │
    │ [Edit] [Confirm & Create] [Cancel]      │
    └─────────────────────────────────────────┘
    ↓ Click "Confirm & Create"
[Success] → Redirect to alerts list
```

### Error States

- **No match**: "We couldn't match your request to any available monitoring capability. Available capabilities: [list]. Try rephrasing your request."
- **Network error**: "Something went wrong. Please try again."
- **Validation error**: Show specific field errors on the review screen

---

## Phase 5: Alerts List Migration (Mock → DB)
> Replace client-side mock alerts with real DB-backed alerts

- [x] **5.1** Update alerts list page to fetch from `GET /api/alerts`
- [x] **5.2** Update alert detail page to fetch from `GET /api/alerts/[id]`
- [x] **5.3** Add status badge for new statuses (configured, active, firing, resolved)
- [x] **5.4** Add delete alert functionality
- [x] **5.5** Remove mock alert data from context (or keep for demo mode)
- [x] **5.6** Update Overview page alert counts to use DB data

### Migration Notes

- The `NoblinksContext` currently provides mock alerts — we'll add API-fetched alerts alongside
- Existing alert detail page (`/alerts/[id]`) and AI investigation page (`/alerts/[id]/ai`) should work with DB alerts
- Status mapping: `configured` → shows "Not Deployed" badge, `firing` → maps to old "triggered" behavior

---

## Phase 6: Polish & Edge Cases
> Error handling, empty states, UX refinements

- [x] **6.1** Empty state for alerts list (no alerts yet → show CTA to create first alert)
- [ ] **6.2** Capability category filter in create flow (optional — show grouped capabilities)
- [x] **6.3** Edit alert parameters (threshold, window, severity) without re-running AI
- [x] **6.4** Duplicate alert detection (warn if similar alert already exists for same machine + capability)
- [x] **6.5** Run lint + typecheck, fix any issues

---

## Important Rules (Unchanged)

- AI must only select from DB capabilities
- AI must never invent new capabilityKey values
- Backend must validate capability exists before creating alert
- Backend must validate parameter types (threshold=number, window=duration pattern)
- Always show generated PromQL to user before saving
- This is control-plane simulation only — no real Prometheus deployment

---

## Goal

Build the full pipeline:

```
Intent → Capability (from DB) → Template → Query → Review → Store
```

This becomes the foundation for real Prometheus deployment later.
