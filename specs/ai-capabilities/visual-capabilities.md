# Feature: AI-Powered Visualization Creation Using Database Capability Registry

## Context

We are implementing AI-based visualization creation inside dashboards.

Important constraints:

- We DO NOT have connector yet.
- We DO NOT query real Prometheus yet.
- We simulate visualization rendering.
- Queries are generated and stored.
- AI must NOT generate raw PromQL directly.
- AI must select visualization capability from database.

We will follow same pattern as alert creation.

---

# High-Level Flow

1. User opens a dashboard.
2. Clicks "Add Visualization".
3. A modal/page opens with single input:

   "Describe what you want to visualize"

   Example:
   - "Show memory usage for prod-server-1"
   - "Show CPU usage for payments namespace"
   - "Show disk usage trend for prod-server-1"

4. User submits.

5. Backend:
   - Fetches visualization capabilities from DB
   - Sends user prompt + capabilities to AI
   - AI selects best matching capability
   - AI extracts parameters

6. Backend:
   - Loads visualization template
   - Generates PromQL query
   - Creates visualization record
   - Adds to dashboard

7. Dashboard displays time-series chart using generated query (mocked data for now).

---

# Step 1 — Create Visualization Capabilities Table

We can reuse `monitoring_capabilities` table or create separate table:

Option A (Recommended):
Add field:
- type (enum: alert | visualization | both)

For now, use same table but distinguish by type.

---

# Step 2 — Seed Visualization Capabilities

Insert at least 3 visualization capabilities:

---

## 1️⃣ Linux Memory Usage

capabilityKey: linux_memory_usage_visualization  
type: visualization

metric: node_memory_usage_percent

parameters:
{
  "machine": "string",
  "window": "duration"
}

visualizationTemplate:
avg_over_time(node_memory_usage_percent{instance="$machine"}[$window])

chartType: line
unit: percent

---

## 2️⃣ Linux CPU Usage

capabilityKey: linux_cpu_usage_visualization  
type: visualization

metric: node_cpu_usage_percent

parameters:
{
  "machine": "string",
  "window": "duration"
}

visualizationTemplate:
avg_over_time(node_cpu_usage_percent{instance="$machine"}[$window])

chartType: line
unit: percent

---

## 3️⃣ Linux Disk Usage

capabilityKey: linux_disk_usage_visualization  
type: visualization

metric: node_filesystem_usage_percent

parameters:
{
  "machine": "string",
  "window": "duration"
}

visualizationTemplate:
avg_over_time(node_filesystem_usage_percent{instance="$machine", mountpoint="/"}[$window])

chartType: line
unit: percent

---

# Step 3 — Create Visualization Table

Create `visualizations` table:

- id (uuid)
- organizationId
- dashboardId
- capabilityId
- title
- machine
- window
- promqlQuery
- chartType
- unit
- createdAt
- updatedAt

---

# Step 4 — AI Processing Logic

Backend must:

1. Fetch visualization capabilities (type=visualization).
2. Send to AI:
   - User prompt
   - List of capabilities (name, description, metric, parameters)
3. AI must:
   - Select best matching capabilityKey
   - Extract parameters
   - Use default window if not provided (e.g., 5m or 15m)
   - Generate human-readable title

AI must return structured JSON:

{
  "capabilityKey": "linux_memory_usage_visualization",
  "params": {
    "machine": "prod-server-1",
    "window": "5m"
  },
  "title": "Memory Usage - prod-server-1"
}

AI must NOT generate PromQL.

---

# Step 5 — Backend Query Generation

Backend must:

1. Validate capability exists.
2. Validate parameters.
3. Replace placeholders in visualizationTemplate.
4. Generate final PromQL.
5. Store visualization in DB.

Example generated query:

avg_over_time(node_memory_usage_percent{instance="prod-server-1"}[5m])

---

# Step 6 — Dashboard Rendering (Simulation Mode)

Since no real Prometheus yet:

- Mock time-series data.
- Render line chart.
- Show title.
- Show machine label.
- Show unit (%).

Later:
Connector will execute query and return real data.

---

# Step 7 — Review Step (Optional But Recommended)

Before creating visualization, show:

---------------------------------------
Visualization: Memory Usage - prod-server-1

Machine: prod-server-1
Window: 5 minutes

Query:
avg_over_time(node_memory_usage_percent{instance="prod-server-1"}[5m])
---------------------------------------

Buttons:
- Confirm & Add
- Cancel

---

# Important Rules

- AI must select only from DB capabilities.
- AI must never invent new capabilityKey.
- PromQL must always come from template.
- Store generated query in DB.
- Keep implementation simple.
- Do not over-engineer.

---

# Goal

Implement full pipeline:

Intent → Capability (DB) → Template → Query → Review → Store → Render

This creates reusable architecture for:

- Linux dashboards
- Kubernetes dashboards
- Future multi-environment support

This mirrors alert creation feature but for visualizations.