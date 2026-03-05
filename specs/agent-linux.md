# Feature: Linux Agent — node_exporter + Prometheus + Alertmanager + noblinks-agent

## Goal

Turn noblinks from a **control-plane simulator** into a **live monitoring system**.
A single install command on any Linux machine wires up real metrics, real alert evaluation, and real alert firing — all scoped to the user's organization, with status flowing back into noblinks automatically.

---

## Multi-Tenancy Model

The existing auth system already handles organizations, members, and permissions:
- All DB queries use `orgScope(session)` → `session.session.activeOrganizationId`
- `requireApiPermission()` enforces role-based access
- Each org has an `id` and `slug` used for scoping

The agent layer introduces a second auth path (no browser session — machine-to-cloud):

```
User session auth (existing)     Agent token auth (new)
─────────────────────────────    ──────────────────────────────────
Browser → session cookie          Machine → Authorization: Bearer <token>
orgScope(session)                 machine.organizationId (from token lookup)
requireApiAuth()                  requireAgentAuth() (new utility)
```

Token chain:
```
Organization
  └── agentRegistrationToken  (nbl_reg_xxx)   ← shown in Settings to org admin
        └── used ONCE to register a machine
              └── Machine
                    └── agentToken  (nbl_agt_xxx)  ← stored on machine, never shown again
```

---

## Architecture

```
Linux Machine (one per org, or many)
├── node_exporter       (port 9100)  → exposes OS metrics (CPU, mem, disk, net)
├── Prometheus          (port 9090)  → scrapes node_exporter, evaluates rules, fires alerts
│   └── /etc/prometheus/rules/noblinks.yml  ← synced by noblinks-agent
├── Alertmanager        (port 9093)  → deduplicates, webhooks to noblinks
└── noblinks-agent      (systemd)   → the sync daemon
    ├── Registers machine on install using org registration token
    ├── Heartbeat every 30s → keeps machine "online" in noblinks
    ├── Pulls rules every 60s → writes Prometheus rules YAML
    └── Reports deployed alert IDs back to noblinks

noblinks Cloud (per-org scoped)
├── POST /api/agent/register     ← machine self-registration (org reg token → agentToken)
├── POST /api/agent/heartbeat    ← liveness ping (agentToken auth)
├── GET  /api/agent/rules        ← returns org+machine-scoped alert rules as Prometheus YAML
├── PATCH /api/agent/status      ← marks alert IDs as "active" after writing to Prometheus
└── POST /api/agent/webhook      ← Alertmanager webhook ingest (agentToken auth)
```

### Alert Lifecycle

```
User (org member)
  1. Creates alert via AI or form
     → alert.organizationId = activeOrganizationId
     → alert.machine = "prod-api-1"
     → alert.status = "configured"

noblinks-agent on prod-api-1 (30s–60s later)
  2. GET /api/agent/rules (agentToken identifies: machine=prod-api-1, org=org123)
     → receives alerts WHERE org=org123 AND machine="prod-api-1" AND status IN (configured, active)
  3. Writes /etc/prometheus/rules/noblinks.yml (includes noblinks_alert_id label per rule)
  4. Reloads Prometheus
  5. PATCH /api/agent/status → alert.status = "active"

Prometheus (evaluating rules every 15s)
  6. Detects threshold breach → sends firing alert to Alertmanager

Alertmanager
  7. Groups/waits → POSTs webhook to /api/agent/webhook with agentToken header

noblinks
  8. Verifies agentToken → finds machine → verifies alert belongs to machine's org
  9. alert.status = "firing" → Overview page shows active alert

Prometheus / Alertmanager (condition clears)
  10. Resolved webhook → alert.status = "resolved"
```

---

## Phase 1: Database — Machine Registry + Org Registration Token

### 1.1 — `machine` Table

Add to `src/lib/schema.ts`:

```typescript
export const machine = pgTable(
  "machine",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),          // user-defined (e.g. "prod-api-1"), matches PromQL instance label
    hostname: text("hostname"),            // actual hostname reported by agent
    ip: text("ip"),                        // primary IP from agent
    agentVersion: text("agent_version"),   // e.g. "0.1.0"
    status: text("status").default("unknown").notNull(), // "online" | "offline" | "unknown"
    lastSeen: timestamp("last_seen"),
    agentTokenHash: text("agent_token_hash").unique(), // sha256 of the raw token
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("machine_org_id_idx").on(table.organizationId),
    index("machine_name_org_idx").on(table.organizationId, table.name),
    index("machine_agent_token_hash_idx").on(table.agentTokenHash),
  ]
);
```

### 1.2 — Org Registration Token

Add to `organization` table:

```typescript
agentRegistrationToken: text("agent_registration_token").unique(),
```

- Generated on first use (lazy): if null, generate and store when user views Settings
- Format: `nbl_reg_` + `crypto.randomBytes(24).toString('hex')`
- Only org `owner` and `admin` roles can view or rotate it
- Does NOT expire — rotation is manual via Settings

### 1.3 — TypeScript Types

Add to `src/lib/types.ts`:

```typescript
export type MachineStatus = "online" | "offline" | "unknown";

export interface DbMachine {
  id: string;
  organizationId: string;
  name: string;
  hostname: string | null;
  ip: string | null;
  agentVersion: string | null;
  status: MachineStatus;
  lastSeen: string | null;
  createdAt: string;
  updatedAt: string;
  // agentTokenHash is never returned to the client
}
```

### 1.4 — Migration

```bash
npm run db:generate
npm run db:migrate
```

### 1.5 — Agent Auth Utility

Create `src/lib/agent-auth.ts`:

```typescript
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { machine } from "@/lib/schema";
import { eq } from "drizzle-orm";

/**
 * Authenticates a request using the agent token in the Authorization header.
 * Looks up the machine by hashed token. All agent API calls use this.
 *
 * Usage in route handlers:
 *   const { machine, error } = await requireAgentAuth(request)
 *   if (error) return error
 *   // machine.organizationId is the tenant scope
 */
export async function requireAgentAuth(request: Request): Promise<
  | { machine: DbMachine; error: null }
  | { machine: null; error: Response }
> {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return { machine: null, error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const rawToken = auth.slice(7);
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  const [found] = await db.select().from(machine)
    .where(eq(machine.agentTokenHash, tokenHash))
    .limit(1);

  if (!found) {
    return { machine: null, error: Response.json({ error: "Invalid agent token" }, { status: 401 }) };
  }

  return { machine: found, error: null };
}
```

---

## Phase 2: Agent API Endpoints

All agent endpoints live under `/api/agent/`. They do NOT use BetterAuth sessions.
The agent is a machine process, not a browser — it authenticates with tokens only.

### 2.1 — POST /api/agent/register

**Auth**: `Authorization: Bearer <orgRegistrationToken>` (from Settings)
**One-time setup** — called by `install.sh` on the Linux machine

Request:
```json
{
  "machineName": "prod-api-1",
  "hostname": "prod-api-1.internal.example.com",
  "ip": "10.0.1.5",
  "agentVersion": "0.1.0"
}
```

Logic:
1. Extract and validate `orgRegistrationToken` from `Authorization` header
2. Look up org by `agentRegistrationToken` → `404` if not found
3. Check if a machine with same `name` already exists in this org
   - If yes: re-registration → generate new agentToken, update machine record
   - If no: create new machine record
4. Generate raw `agentToken` = `nbl_agt_` + `crypto.randomBytes(32).toString('hex')`
5. Hash it: `sha256(rawToken)` → store as `agentTokenHash`
6. Set `machine.status = "online"`, `machine.lastSeen = now()`

Response (raw token returned ONCE — never again):
```json
{
  "machineId": "uuid",
  "machineName": "prod-api-1",
  "organizationId": "org-id",
  "agentToken": "nbl_agt_<hex>",
  "noblinksUrl": "https://app.noblinks.io"
}
```

Multi-tenancy guarantee: machine is bound to the org of the registration token.

---

### 2.2 — POST /api/agent/heartbeat

**Auth**: `Authorization: Bearer <agentToken>`

Called every 30s by noblinks-agent daemon.

Request:
```json
{
  "agentVersion": "0.1.0",
  "prometheusRunning": true,
  "alertmanagerRunning": true,
  "nodeExporterRunning": true
}
```

Logic:
- `requireAgentAuth()` → identifies machine + org
- Update `machine.lastSeen = now()`, `machine.status = "online"`
- Update component status in metadata (stored as jsonb or separate columns — TBD)

Response: `{ ok: true }`

---

### 2.3 — GET /api/agent/rules

**Auth**: `Authorization: Bearer <agentToken>`

Returns Prometheus rules YAML for this machine's alerts.

Logic:
- `requireAgentAuth()` → `machine.id`, `machine.name`, `machine.organizationId`
- Fetch alerts WHERE:
  - `alert.organizationId = machine.organizationId` ← org-scoped
  - `alert.machine = machine.name`
  - `alert.status IN ('configured', 'active')`
- Render as Prometheus rules YAML

Response (`Content-Type: text/yaml`):
```yaml
groups:
  - name: noblinks
    rules:
      - alert: LinuxMemoryHigh_prod-api-1
        expr: avg_over_time(node_memory_usage_percent{instance="prod-api-1"}[5m]) > 80
        for: 5m
        labels:
          severity: warning
          noblinks_alert_id: "uuid-abc"
          noblinks_machine: "prod-api-1"
          noblinks_org: "org-123"
        annotations:
          summary: "Linux Memory High on prod-api-1"
          description: "Memory usage exceeded 80% threshold"
```

The `noblinks_alert_id` label is critical — Alertmanager preserves it in webhooks,
so noblinks can identify which DB alert to update when a webhook arrives.

---

### 2.4 — PATCH /api/agent/status

**Auth**: `Authorization: Bearer <agentToken>`

Called after the agent successfully writes rules to Prometheus and reloads it.

Request:
```json
{
  "activatedAlertIds": ["uuid-abc", "uuid-def"]
}
```

Logic:
- `requireAgentAuth()` → `machine.organizationId`
- For each alertId:
  - Verify `alert.organizationId = machine.organizationId` ← tenant boundary check
  - Verify `alert.machine = machine.name`
  - Set `alert.status = "active"` if currently `"configured"`
  - (Don't downgrade `firing` or `resolved` back to `active`)

Response: `{ updated: 2 }`

---

### 2.5 — POST /api/agent/webhook

**Auth**: `Authorization: Bearer <agentToken>`

Receives Alertmanager webhook payloads when alerts fire or resolve.

Alertmanager sends (standard webhook format):
```json
{
  "version": "4",
  "status": "firing",
  "alerts": [
    {
      "status": "firing",
      "labels": {
        "alertname": "LinuxMemoryHigh_prod-api-1",
        "noblinks_alert_id": "uuid-abc",
        "noblinks_org": "org-123",
        "severity": "warning"
      },
      "startsAt": "2025-01-01T12:00:00Z",
      "endsAt": "0001-01-01T00:00:00Z"
    }
  ]
}
```

Logic:
- `requireAgentAuth()` → `machine.organizationId`
- For each alert in payload:
  - Extract `noblinks_alert_id` from labels
  - Fetch alert from DB, verify `alert.organizationId = machine.organizationId` ← tenant boundary check
  - `status = "firing"` → set `alert.status = "firing"`
  - `status = "resolved"` → set `alert.status = "resolved"`

Response: `{ ok: true }`

---

### 2.6 — Machine CRUD (Session Auth — existing pattern)

These use `requireApiAuth()` / `requireApiPermission()` like all other org-scoped routes:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/machines` | `requireApiAuth()` | List machines for `orgScope(session)` |
| `POST` | `/api/machines` | `requireApiPermission({ machine: ["create"] })` | Create machine record (pre-registration) |
| `GET` | `/api/machines/[id]` | `requireApiAuth()` | Get machine detail (verify org ownership) |
| `DELETE` | `/api/machines/[id]` | `requireApiPermission({ machine: ["delete"] })` | Remove machine + alerts |
| `GET` | `/api/org/agent-token` | `requireApiAuth()` | Get org registration token (shown in Settings) |
| `POST` | `/api/org/agent-token/rotate` | `requireApiPermission({ organization: ["update"] })` | Rotate org registration token |

Org scoping pattern (same as alerts):
```typescript
const machines = await db.select().from(machine)
  .where(eq(machine.organizationId, orgScope(session)))
```

---

## Phase 3: noblinks-agent (Bash Installer + Daemon)

The agent lives in `noblinks-agent/` in the repo.
It's a bash installer script + a bash daemon running under systemd.

### 3.1 — Directory Structure

```
noblinks-agent/
├── install.sh              # downloaded via curl, bootstraps everything
├── bin/
│   └── noblinks-agent      # the daemon script (installed to /usr/local/bin/)
├── templates/
│   ├── prometheus.yml      # Prometheus config template
│   ├── alertmanager.yml    # Alertmanager config template
│   ├── node_exporter.service
│   ├── prometheus.service
│   ├── alertmanager.service
│   └── noblinks-agent.service
└── README.md
```

### 3.2 — install.sh

One-line install command (shown in noblinks Settings):
```bash
curl -fsSL https://app.noblinks.io/install.sh | sudo bash -s -- \
  --token nbl_reg_xxxx \
  --machine prod-api-1
```

Parameters:
- `--token` — org registration token (from Settings)
- `--machine` — machine name (must match the name used in noblinks alerts)
- `--noblinks-url` — optional, defaults to `https://app.noblinks.io`

Steps:
1. Validate root / sudo
2. Detect arch: `uname -m` → amd64 or arm64
3. Detect distro: `/etc/os-release` → Ubuntu/Debian → `apt`, CentOS/RHEL/Amazon → `yum/dnf`
4. **Install node_exporter** from GitHub releases (pinned version):
   - Download, extract, move to `/usr/local/bin/node_exporter`
   - Create system user `node_exporter`
   - Write systemd service file
   - `systemctl enable --now node_exporter`
5. **Install Prometheus**:
   - Download, extract, move binaries
   - Create dirs: `/etc/prometheus/`, `/etc/prometheus/rules/`, `/var/lib/prometheus/`
   - Write `prometheus.yml` (scrapes `localhost:9100`, uses machine name as instance label)
   - Create empty `noblinks.yml` rules file
   - Create system user `prometheus`
   - Write systemd service, enable + start
6. **Install Alertmanager**:
   - Download, extract, move binaries
   - Create `/etc/alertmanager/`
   - Write `alertmanager.yml` with placeholder `AGENT_TOKEN` (filled in step 8)
   - Create system user `alertmanager`
   - Write systemd service, enable + start (will fail until token is set — OK)
7. **Install noblinks-agent daemon**:
   - Download `noblinks-agent` script from noblinks URL
   - Move to `/usr/local/bin/noblinks-agent`, chmod +x
8. **Register machine**:
   ```bash
   REGISTER_RESPONSE=$(curl -s -X POST "${NOBLINKS_URL}/api/agent/register" \
     -H "Authorization: Bearer ${TOKEN}" \
     -H "Content-Type: application/json" \
     -d "{\"machineName\":\"${MACHINE}\",\"hostname\":\"$(hostname)\",\"ip\":\"$(hostname -I | awk '{print $1}')\",\"agentVersion\":\"${AGENT_VERSION}\"}")
   AGENT_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.agentToken')
   MACHINE_ID=$(echo $REGISTER_RESPONSE | jq -r '.machineId')
   ```
9. **Write agent config**:
   ```bash
   mkdir -p /etc/noblinks
   cat > /etc/noblinks/agent.env <<EOF
   NOBLINKS_URL=https://app.noblinks.io
   AGENT_TOKEN=${AGENT_TOKEN}
   MACHINE_NAME=${MACHINE}
   MACHINE_ID=${MACHINE_ID}
   AGENT_VERSION=${AGENT_VERSION}
   EOF
   chmod 600 /etc/noblinks/agent.env
   ```
10. **Update Alertmanager config** with real agent token:
    - Replace `AGENT_TOKEN` placeholder in `/etc/alertmanager/alertmanager.yml`
    - `systemctl restart alertmanager`
11. **Start noblinks-agent service** → begins heartbeat + rule sync loop
12. **Print summary**:
    ```
    ✓ node_exporter running    (port 9100)
    ✓ Prometheus running       (port 9090)
    ✓ Alertmanager running     (port 9093)
    ✓ noblinks-agent running
    ✓ Machine registered: prod-api-1 (org: Acme Corp)

    Your machine is now connected to noblinks.
    ```

### 3.3 — noblinks-agent Daemon

`/usr/local/bin/noblinks-agent`:

```bash
#!/bin/bash
set -euo pipefail

source /etc/noblinks/agent.env

PROMETHEUS_URL="http://localhost:9090"
RULES_FILE="/etc/prometheus/rules/noblinks.yml"
HEARTBEAT_INTERVAL=30   # seconds
SYNC_INTERVAL=60        # seconds
LAST_SYNC=0
LAST_RULES_HASH=""

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] noblinks-agent: $*"; }

send_heartbeat() {
  curl -sf -X POST "${NOBLINKS_URL}/api/agent/heartbeat" \
    -H "Authorization: Bearer ${AGENT_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"agentVersion\":\"${AGENT_VERSION}\",\"prometheusRunning\":true,\"alertmanagerRunning\":true,\"nodeExporterRunning\":true}" \
    > /dev/null || log "heartbeat failed"
}

sync_rules() {
  NEW_RULES=$(curl -sf "${NOBLINKS_URL}/api/agent/rules" \
    -H "Authorization: Bearer ${AGENT_TOKEN}" || echo "")

  if [ -z "$NEW_RULES" ]; then
    log "failed to fetch rules, skipping"
    return
  fi

  NEW_HASH=$(echo "$NEW_RULES" | sha256sum | awk '{print $1}')
  if [ "$NEW_HASH" = "$LAST_RULES_HASH" ]; then
    return  # no changes
  fi

  log "rules changed, updating Prometheus"
  echo "$NEW_RULES" > "${RULES_FILE}"
  LAST_RULES_HASH="$NEW_HASH"

  # Reload Prometheus (hot reload — no restart needed)
  curl -sf -X POST "${PROMETHEUS_URL}/-/reload" > /dev/null || log "prometheus reload failed"

  # Extract alert IDs and report them as active
  ALERT_IDS=$(echo "$NEW_RULES" | grep 'noblinks_alert_id:' | sed 's/.*noblinks_alert_id: *"\?\([^"]*\)"\?.*/\1/' | tr '\n' ',')
  if [ -n "$ALERT_IDS" ]; then
    IDS_JSON=$(echo "$ALERT_IDS" | sed 's/,$//' | awk -F',' '{for(i=1;i<=NF;i++) printf "\"%s\",", $i}' | sed 's/,$//')
    curl -sf -X PATCH "${NOBLINKS_URL}/api/agent/status" \
      -H "Authorization: Bearer ${AGENT_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"activatedAlertIds\":[${IDS_JSON}]}" \
      > /dev/null || log "status update failed"
  fi
}

log "starting (machine=${MACHINE_NAME}, version=${AGENT_VERSION})"

while true; do
  send_heartbeat
  NOW=$(date +%s)
  if [ $((NOW - LAST_SYNC)) -ge $SYNC_INTERVAL ]; then
    sync_rules
    LAST_SYNC=$NOW
  fi
  sleep $HEARTBEAT_INTERVAL
done
```

### 3.4 — Prometheus Config Template

`/etc/prometheus/prometheus.yml`:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']

rule_files:
  - /etc/prometheus/rules/noblinks.yml

scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
    relabel_configs:
      # Force instance label to match machine name in noblinks
      # This ensures PromQL queries like instance="prod-api-1" resolve correctly
      - target_label: instance
        replacement: 'MACHINE_NAME_PLACEHOLDER'
```

`MACHINE_NAME_PLACEHOLDER` is replaced by `install.sh` with the `--machine` arg.

### 3.5 — Alertmanager Config Template

`/etc/alertmanager/alertmanager.yml`:
```yaml
global:
  resolve_timeout: 5m

route:
  receiver: 'noblinks'
  group_by: ['noblinks_alert_id']
  group_wait: 10s
  group_interval: 30s
  repeat_interval: 4h

receivers:
  - name: 'noblinks'
    webhook_configs:
      - url: 'NOBLINKS_URL_PLACEHOLDER/api/agent/webhook'
        http_config:
          authorization:
            credentials: 'AGENT_TOKEN_PLACEHOLDER'
        send_resolved: true
```

---

## Phase 4: Frontend Updates

### 4.1 — Machine List (Real Data from DB)

- `GET /api/machines` → replaces `seedMachines` from `NoblinksContext`
- `MachineCard` now renders real `lastSeen` (relative time), real `status`, real `hostname`
- Status determination: if `lastSeen > 90s ago` → mark display as offline (not DB status — that's updated on heartbeat)
- Remove mock machines from context (or keep for demo-mode orgs with no machines)

### 4.2 — Add Machine → Install Instructions

**Flow**:
1. User clicks "Add Machine"
2. Form: enter machine name (validated: alphanumeric + dash only, must match hostname convention)
3. Submit → `POST /api/machines` → creates machine record (status: `"unknown"`)
4. Modal transitions to **"Install Agent"** step showing:

```
Connect prod-api-1

Run this command on your Linux machine:

┌──────────────────────────────────────────────────────────────┐
│ curl -fsSL https://app.noblinks.io/install.sh | sudo bash \  │
│   -s -- --token nbl_reg_xxxx --machine prod-api-1            │
└──────────────────────────────────────────────────────────────┘
  [Copy]

This installs: node_exporter · Prometheus · Alertmanager · noblinks-agent

Waiting for agent to connect...  ⟳

(You can close this — we'll show the machine once it connects)
```

5. Poll `GET /api/machines/[id]` every 5s
6. When `status === "online"` → show success, close modal

### 4.3 — Machine Detail (Real Data)

Load from `GET /api/machines/[id]` (verify org ownership server-side).
Show:
- Hostname, IP, agent version, last seen
- Component status (prometheus/alertmanager/node_exporter running?)
- Active alerts count for this machine
- Link to Prometheus UI: note that Prometheus runs locally on the machine; user must open `http://<machine-ip>:9090` directly (not proxied through noblinks in this phase)

### 4.4 — Alert Status Badges

Updated `statusConfig` in the alerts table and detail pages:

| Status | Badge | Meaning |
|--------|-------|---------|
| `configured` | Outline | Created in noblinks, agent hasn't synced yet |
| `active` | Blue | Prometheus is evaluating the rule |
| `firing` | Red/Destructive | Threshold breached, alert is live |
| `resolved` | Secondary | Was firing, condition has cleared |

### 4.5 — Settings Page — Agent Integration Section

New section in Settings below "Connected Machines":

```
Agent Integration

Org Registration Token
Used to connect new machines. Keep this secret.
[ nbl_reg_•••••••••••• ]  [Show]  [Copy]  [Rotate]

Quick Install
Copy the one-liner to run on any Linux machine:
[ curl -fsSL .../install.sh | sudo bash -s -- --token nbl_reg_xxx --machine <machine-name> ]

→ Go to Machines to see connected machines
```

- `GET /api/org/agent-token` → lazy-creates token if null, returns it
- Token visible only to `owner` and `admin` roles
- Rotate button calls `POST /api/org/agent-token/rotate` with confirmation dialog

### 4.6 — Overview Page (Real Machine Status)

Replace `machines.filter(m => m.status === "offline")` from context with
API-fetched machines from `/api/machines`. Offline detection is based on `lastSeen`.

---

## Phase 5: Offline Detection (Background)

The agent sends heartbeats every 30s. If noblinks doesn't receive a heartbeat for 90s,
the machine should be considered offline.

**Option A — Lazy detection (recommended for MVP)**:
- On `GET /api/machines`, compute `lastSeen > 90s → display as offline`
- Don't update the DB status — just compute at read time
- Avoids needing a cron job

**Option B — Active detection (future)**:
- A cron job (Vercel Cron or pg_cron) runs every 2 minutes
- Sets `status = "offline"` for machines where `lastSeen < now() - interval '90 seconds'`

For MVP, use Option A.

---

## Implementation Checklist

### Phase 1 — Database
- [ ] Add `machine` table to `src/lib/schema.ts`
- [ ] Add `agentRegistrationToken` column to `organization` table
- [ ] Add `DbMachine`, `MachineStatus` types to `src/lib/types.ts`
- [ ] Generate + run migration (`npm run db:generate && npm run db:migrate`)
- [ ] Create `src/lib/agent-auth.ts` with `requireAgentAuth()`

### Phase 2 — Agent API
- [ ] `POST /api/agent/register` — org token → issue agentToken per machine
- [ ] `POST /api/agent/heartbeat` — liveness, update lastSeen
- [ ] `GET /api/agent/rules` — return org+machine-scoped rules as Prometheus YAML
- [ ] `PATCH /api/agent/status` — mark alerts as active
- [ ] `POST /api/agent/webhook` — Alertmanager ingest, update alert status
- [ ] `GET /api/machines` — list machines for org (session auth)
- [ ] `POST /api/machines` — create machine (session auth)
- [ ] `GET /api/machines/[id]` — machine detail (session auth, org-scoped)
- [ ] `DELETE /api/machines/[id]` — delete machine (session auth, org-scoped)
- [ ] `GET /api/org/agent-token` — get/lazy-create org reg token
- [ ] `POST /api/org/agent-token/rotate` — rotate org reg token

### Phase 3 — noblinks-agent
- [ ] Create `noblinks-agent/` directory
- [ ] Write `install.sh` (node_exporter + Prometheus + Alertmanager + daemon install)
- [ ] Write `bin/noblinks-agent` (heartbeat + rule sync daemon)
- [ ] Write `templates/prometheus.yml` with machine name relabeling
- [ ] Write `templates/alertmanager.yml` with noblinks webhook
- [ ] Write systemd service templates for all 4 services
- [ ] Test on Ubuntu 22.04 LTS (primary target)
- [ ] Test on Ubuntu 24.04, Debian 12, Amazon Linux 2023
- [ ] Verify arm64 (Raspberry Pi / AWS Graviton)

### Phase 4 — Frontend
- [ ] Replace mock machines in context with `/api/machines` fetch
- [ ] Update `MachineCard` for real data (lastSeen, hostname, status)
- [ ] Update `AddMachineModal` → show install instructions after creation
- [ ] Add polling until machine comes online after install
- [ ] Update `MachineDetailPage` to load from API
- [ ] Update `OverviewPage` offline machines to use real API data
- [ ] Update alert status badges (configured/active/firing/resolved)
- [ ] Add "Agent Integration" section to `SettingsPage`
- [ ] Run `npm run lint && npm run typecheck`

---

## Security Considerations

1. **Token storage on machine**: `agentToken` stored in `/etc/noblinks/agent.env` with `chmod 600`, owned by `noblinks` user. Never logged.

2. **Token storage in DB**: Only `sha256(agentToken)` stored in DB. Raw token returned once at registration. If lost, machine must be deleted and re-registered.

3. **Org registration token**: Shown only to `admin`/`owner` roles. Rotating it does not invalidate existing machines (they have their own `agentToken`).

4. **Tenant boundary in webhook**: Webhook validates that `noblinks_alert_id` belongs to `machine.organizationId`. An attacker with a stolen agentToken can only affect their own org's alerts.

5. **HTTPS required**: Alertmanager must send webhooks over HTTPS in production. The `agentToken` is in the `Authorization` header — plain HTTP would expose it.

6. **Agent can only affect its own machine's alerts**: `PATCH /api/agent/status` only updates alerts where `alert.machine = machine.name AND alert.organizationId = machine.organizationId`.

---

## Open Questions

1. **Agent language**: Bash is simplest for MVP. Go binary is better for production (single static binary, better error handling). Start with bash, migrate to Go in v2.

2. **Metrics access from noblinks UI**: Prometheus runs on the user's machine (potentially behind a firewall). For MVP, noblinks doesn't proxy metrics — users access Prometheus directly. In a future phase, the agent could expose a reverse tunnel or relay metrics.

3. **Multiple machines, same alert**: Alert `machine` field is text matching the machine name. If two machines are named identically within the same org, both agents would pick up the same rule. The installer should warn if the machine name already exists in the org.

4. **Prometheus version pinning**: The install script should pin to tested Prometheus versions to avoid breaking changes. Maintain a version matrix in `noblinks-agent/README.md`.

---

## Future Phases (Out of Scope for MVP)

- **Metrics proxy**: Agent relays Prometheus query results to noblinks → real dashboard widgets
- **Docker monitoring**: Install cAdvisor, add docker capabilities to the registry
- **Grafana**: Auto-install and pre-configure dashboards for registered machines
- **Notification channels**: Alertmanager routing rules synced from noblinks (email, Slack, PagerDuty)
- **Windows agent**: PowerShell installer + windows_exporter
- **Kubernetes agent**: Prometheus Operator + PodMonitor/ServiceMonitor CRDs
- **Multi-machine alerts**: Alert targets a group of machines by label/tag rather than single name
