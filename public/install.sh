#!/usr/bin/env bash
# noblinks agent installer — served at https://www.noblinks.com/install.sh
# Usage: curl -fsSL https://www.noblinks.com/install.sh | sudo bash -s -- --token <TOKEN> --name <MACHINE_NAME>
set -euo pipefail

# ── Pinned versions ────────────────────────────────────────────────────────────
NODE_EXPORTER_VERSION="1.8.2"
PROMETHEUS_VERSION="2.53.1"
ALERTMANAGER_VERSION="0.27.0"
AGENT_VERSION="0.1.0"
NOBLINKS_URL="${NOBLINKS_URL:-https://www.noblinks.com}"

# ── Helpers ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()   { echo -e "${GREEN}[noblinks]${NC} $*"; }
warn()  { echo -e "${YELLOW}[noblinks]${NC} $*"; }
error() { echo -e "${RED}[noblinks] ERROR:${NC} $*" >&2; exit 1; }
step()  { echo -e "\n${GREEN}──${NC} $*"; }

# ── Argument parsing ───────────────────────────────────────────────────────────
REG_TOKEN=""
MACHINE_NAME=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --token)        REG_TOKEN="$2";    shift 2 ;;
    --name)         MACHINE_NAME="$2"; shift 2 ;;
    --noblinks-url) NOBLINKS_URL="$2"; shift 2 ;;
    *) error "Unknown argument: $1" ;;
  esac
done

[[ -z "$REG_TOKEN"    ]] && error "--token is required (get it from Settings → Agent Integration)"
[[ -z "$MACHINE_NAME" ]] && error "--name is required (e.g. --name prod-api-1)"

if ! [[ "$MACHINE_NAME" =~ ^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$ ]]; then
  error "Machine name must be alphanumeric with hyphens only (e.g. prod-api-1)"
fi

# ── Root check ─────────────────────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && error "This script must be run as root. Use: sudo bash -s ..."

# ── Detect arch ────────────────────────────────────────────────────────────────
ARCH=$(uname -m)
case "$ARCH" in
  x86_64)  ARCH_PROM="amd64"; ARCH_NE="amd64" ;;
  aarch64) ARCH_PROM="arm64"; ARCH_NE="arm64" ;;
  armv7l)  ARCH_PROM="armv7"; ARCH_NE="armv7" ;;
  *) error "Unsupported architecture: $ARCH" ;;
esac

# ── Detect distro / package manager ───────────────────────────────────────────
if [[ -f /etc/os-release ]]; then
  # shellcheck source=/dev/null
  source /etc/os-release
  DISTRO_ID="${ID:-unknown}"
else
  DISTRO_ID="unknown"
fi

case "$DISTRO_ID" in
  ubuntu|debian|linuxmint)
    PKG_INSTALL="apt-get install -y -q"
    PKG_UPDATE="apt-get update -q"
    ;;
  centos|rhel|fedora|amzn|rocky|almalinux)
    if command -v dnf &>/dev/null; then
      PKG_INSTALL="dnf install -y -q"
      PKG_UPDATE="dnf makecache -q"
    else
      PKG_INSTALL="yum install -y -q"
      PKG_UPDATE="yum makecache -q"
    fi
    ;;
  *)
    warn "Unknown distro: $DISTRO_ID. Attempting apt-get..."
    PKG_INSTALL="apt-get install -y -q"
    PKG_UPDATE="apt-get update -q"
    ;;
esac

# ── Dependency check ───────────────────────────────────────────────────────────
step "Checking dependencies"
MISSING_PKGS=()
for cmd in curl tar jq sha256sum; do
  command -v "$cmd" &>/dev/null || MISSING_PKGS+=("$cmd")
done

if [[ ${#MISSING_PKGS[@]} -gt 0 ]]; then
  log "Installing missing packages: ${MISSING_PKGS[*]}"
  $PKG_UPDATE
  $PKG_INSTALL "${MISSING_PKGS[@]}"
fi

# ── Create system users ────────────────────────────────────────────────────────
create_user() {
  local user="$1"
  if ! id "$user" &>/dev/null; then
    useradd --system --no-create-home --shell /sbin/nologin "$user"
  fi
}

# ── 1. node_exporter ──────────────────────────────────────────────────────────
step "Installing node_exporter ${NODE_EXPORTER_VERSION}"

NE_URL="https://github.com/prometheus/node_exporter/releases/download/v${NODE_EXPORTER_VERSION}/node_exporter-${NODE_EXPORTER_VERSION}.linux-${ARCH_NE}.tar.gz"
NE_TMP=$(mktemp -d)
curl -fsSL --progress-bar "$NE_URL" -o "$NE_TMP/ne.tar.gz"
tar -xzf "$NE_TMP/ne.tar.gz" -C "$NE_TMP" --strip-components=1
install -o root -g root -m 0755 "$NE_TMP/node_exporter" /usr/local/bin/node_exporter
rm -rf "$NE_TMP"

create_user node_exporter

cat > /etc/systemd/system/node_exporter.service <<'SVCEOF'
[Unit]
Description=Prometheus Node Exporter
Documentation=https://prometheus.io/docs/guides/node-exporter/
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=node_exporter
Group=node_exporter
ExecStart=/usr/local/bin/node_exporter \
  --collector.systemd \
  --collector.processes
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
systemctl enable --now node_exporter
log "node_exporter started on port 9100"

# ── 2. Prometheus ──────────────────────────────────────────────────────────────
step "Installing Prometheus ${PROMETHEUS_VERSION}"

PROM_URL="https://github.com/prometheus/prometheus/releases/download/v${PROMETHEUS_VERSION}/prometheus-${PROMETHEUS_VERSION}.linux-${ARCH_PROM}.tar.gz"
PROM_TMP=$(mktemp -d)
curl -fsSL --progress-bar "$PROM_URL" -o "$PROM_TMP/prom.tar.gz"
tar -xzf "$PROM_TMP/prom.tar.gz" -C "$PROM_TMP" --strip-components=1
install -o root -g root -m 0755 "$PROM_TMP/prometheus" /usr/local/bin/prometheus
install -o root -g root -m 0755 "$PROM_TMP/promtool"   /usr/local/bin/promtool
rm -rf "$PROM_TMP"

create_user prometheus
mkdir -p /etc/prometheus/rules /var/lib/prometheus/data
chown -R prometheus:prometheus /etc/prometheus /var/lib/prometheus

cat > /etc/prometheus/prometheus.yml <<EOF
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
      - target_label: instance
        replacement: '${MACHINE_NAME}'
EOF

cat > /etc/prometheus/rules/noblinks.yml <<'RULESEOF'
groups:
  - name: noblinks
    rules: []
RULESEOF

chown prometheus:prometheus /etc/prometheus/prometheus.yml /etc/prometheus/rules/noblinks.yml

cat > /etc/systemd/system/prometheus.service <<'SVCEOF'
[Unit]
Description=Prometheus Monitoring System
Documentation=https://prometheus.io/docs/introduction/overview/
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=prometheus
Group=prometheus
ExecStart=/usr/local/bin/prometheus \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/var/lib/prometheus/data \
  --storage.tsdb.retention.time=15d \
  --web.enable-lifecycle \
  --web.listen-address=127.0.0.1:9090
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
systemctl enable --now prometheus
log "Prometheus started on port 9090 (localhost only)"

# ── 3. Alertmanager ───────────────────────────────────────────────────────────
step "Installing Alertmanager ${ALERTMANAGER_VERSION}"

AM_URL="https://github.com/prometheus/alertmanager/releases/download/v${ALERTMANAGER_VERSION}/alertmanager-${ALERTMANAGER_VERSION}.linux-${ARCH_PROM}.tar.gz"
AM_TMP=$(mktemp -d)
curl -fsSL --progress-bar "$AM_URL" -o "$AM_TMP/am.tar.gz"
tar -xzf "$AM_TMP/am.tar.gz" -C "$AM_TMP" --strip-components=1
install -o root -g root -m 0755 "$AM_TMP/alertmanager" /usr/local/bin/alertmanager
install -o root -g root -m 0755 "$AM_TMP/amtool"       /usr/local/bin/amtool
rm -rf "$AM_TMP"

create_user alertmanager
mkdir -p /etc/alertmanager /var/lib/alertmanager/data
chown -R alertmanager:alertmanager /etc/alertmanager /var/lib/alertmanager

# Write placeholder config — replaced with real token after registration
cat > /etc/alertmanager/alertmanager.yml <<EOF
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
      - url: '${NOBLINKS_URL}/api/agent/webhook'
        http_config:
          authorization:
            credentials: 'PLACEHOLDER'
        send_resolved: true
EOF
chown alertmanager:alertmanager /etc/alertmanager/alertmanager.yml

cat > /etc/systemd/system/alertmanager.service <<'SVCEOF'
[Unit]
Description=Prometheus Alertmanager
Documentation=https://prometheus.io/docs/alerting/latest/alertmanager/
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=alertmanager
Group=alertmanager
ExecStart=/usr/local/bin/alertmanager \
  --config.file=/etc/alertmanager/alertmanager.yml \
  --storage.path=/var/lib/alertmanager/data \
  --web.listen-address=127.0.0.1:9093
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
systemctl enable alertmanager
# Start after registration so the real token is in the config

# ── 4. noblinks-agent binary ───────────────────────────────────────────────────
step "Installing noblinks-agent ${AGENT_VERSION}"

curl -fsSL "${NOBLINKS_URL}/noblinks-agent" -o /usr/local/bin/noblinks-agent
chmod 0755 /usr/local/bin/noblinks-agent

cat > /etc/systemd/system/noblinks-agent.service <<'SVCEOF'
[Unit]
Description=Noblinks Agent
Documentation=https://noblinks.io/docs/agent
After=network-online.target prometheus.service
Wants=network-online.target
Requires=prometheus.service

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/noblinks-agent
Restart=on-failure
RestartSec=10s
StandardOutput=journal
StandardError=journal
SyslogIdentifier=noblinks-agent

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload

# ── 5. Register machine ────────────────────────────────────────────────────────
step "Registering machine with noblinks"

HOSTNAME_VAL=$(hostname -f 2>/dev/null || hostname)
IP_VAL=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "")

REGISTER_PAYLOAD=$(printf '{"machineName":"%s","hostname":"%s","ip":"%s","agentVersion":"%s"}' \
  "$MACHINE_NAME" "$HOSTNAME_VAL" "$IP_VAL" "$AGENT_VERSION")

REGISTER_RESPONSE=$(curl -sf \
  --max-time 30 \
  -X POST "${NOBLINKS_URL}/api/agent/register" \
  -H "Authorization: Bearer ${REG_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$REGISTER_PAYLOAD") \
  || error "Registration failed. Check your --token and that ${NOBLINKS_URL} is reachable."

AGENT_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.agentToken // empty')
MACHINE_ID=$(echo  "$REGISTER_RESPONSE" | jq -r '.machineId  // empty')
ORG_NAME=$(echo    "$REGISTER_RESPONSE" | jq -r '.organizationId // "your org"')

[[ -z "$AGENT_TOKEN" ]] && error "Registration response missing agentToken. Response: $REGISTER_RESPONSE"
[[ -z "$MACHINE_ID"  ]] && error "Registration response missing machineId. Response: $REGISTER_RESPONSE"

# ── 6. Write agent config ─────────────────────────────────────────────────────
step "Writing agent config"

mkdir -p /etc/noblinks
cat > /etc/noblinks/agent.env <<EOF
NOBLINKS_URL=${NOBLINKS_URL}
AGENT_TOKEN=${AGENT_TOKEN}
MACHINE_NAME=${MACHINE_NAME}
MACHINE_ID=${MACHINE_ID}
AGENT_VERSION=${AGENT_VERSION}
EOF
chmod 600 /etc/noblinks/agent.env

# ── 7. Inject real token into Alertmanager config ─────────────────────────────
step "Configuring Alertmanager"

sed -i "s|credentials: 'PLACEHOLDER'|credentials: '${AGENT_TOKEN}'|g" \
  /etc/alertmanager/alertmanager.yml

systemctl start alertmanager
log "Alertmanager started on port 9093 (localhost only)"

# ── 8. Start noblinks-agent ───────────────────────────────────────────────────
step "Starting noblinks-agent"
systemctl enable --now noblinks-agent

sleep 3

# ── Status summary ─────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  noblinks agent installed successfully"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_service() {
  if systemctl is-active --quiet "$1" 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} $1 running"
  else
    echo -e "  ${RED}✗${NC} $1 NOT running  (journalctl -u $1)"
  fi
}
check_service node_exporter
check_service prometheus
check_service alertmanager
check_service noblinks-agent
echo ""
echo "  Machine:  ${MACHINE_NAME}"
echo "  ID:       ${MACHINE_ID}"
echo "  Org:      ${ORG_NAME}"
echo ""
echo "  Your machine is now connected to noblinks."
echo "  View it at: ${NOBLINKS_URL}/machines"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
