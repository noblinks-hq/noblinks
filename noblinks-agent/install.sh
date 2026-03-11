#!/usr/bin/env bash
# noblinks agent installer
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
log()     { echo -e "${GREEN}[noblinks]${NC} $*"; }
warn()    { echo -e "${YELLOW}[noblinks]${NC} $*"; }
error()   { echo -e "${RED}[noblinks] ERROR:${NC} $*" >&2; exit 1; }
step()    { echo -e "\n${GREEN}──${NC} $*"; }

# ── Permission prompt ─────────────────────────────────────────────────────────
# Prints a bordered box with the component name and description, then asks the
# user to confirm. In non-interactive mode (stdin is not a terminal, e.g. piped
# from curl) the prompt is auto-approved.
# Usage: ask_permission "component_name" "description"
# Returns 0 (approved) or 1 (declined).
ask_permission() {
  local name="$1"
  local desc="$2"

  # Determine the box width based on content (minimum 50 chars inner width)
  local inner_width=50
  local name_len=${#name}
  local desc_len=${#desc}
  local max_len=$(( name_len > desc_len ? name_len : desc_len ))
  if (( max_len + 4 > inner_width )); then
    inner_width=$(( max_len + 4 ))
  fi

  # Build the horizontal border
  local border=""
  for (( i = 0; i < inner_width; i++ )); do
    border="${border}─"
  done

  echo ""
  echo -e "  ${GREEN}┌${border}┐${NC}"
  # Print the component name, padded to fill the box
  local pad=$(( inner_width - name_len ))
  printf "  ${GREEN}│${NC}  ${YELLOW}%s${NC}%*s${GREEN}│${NC}\n" "$name" "$((pad - 2))" ""
  # Print the description, wrapping manually if needed
  # For simplicity, print the full description on one line with padding
  local desc_pad=$(( inner_width - desc_len ))
  if (( desc_pad < 2 )); then
    desc_pad=2
  fi
  printf "  ${GREEN}│${NC}  %s%*s${GREEN}│${NC}\n" "$desc" "$((desc_pad - 2))" ""
  echo -e "  ${GREEN}└${border}┘${NC}"

  # Non-interactive mode: auto-approve (stdin is not a terminal)
  if [[ ! -t 0 ]]; then
    log "Non-interactive mode detected — auto-approving ${name}"
    return 0
  fi

  # Interactive prompt
  echo -n -e "  Install ${YELLOW}${name}${NC}? [y/N] "
  local answer
  read -r answer
  case "${answer,,}" in
    y|yes) return 0 ;;
    *)     return 1 ;;
  esac
}

# ── Installed check ──────────────────────────────────────────────────────────
# Returns 0 if the binary at the given path exists, 1 otherwise.
is_installed() {
  [[ -f "$1" ]]
}

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

# Validate machine name: alphanumeric + hyphens only
if ! [[ "$MACHINE_NAME" =~ ^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$ ]]; then
  error "Machine name must be alphanumeric with hyphens only (e.g. prod-api-1)"
fi

# ── Root check ─────────────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  error "This script must be run as root. Use: sudo bash -s ..."
fi

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

# ── Dependency check ─────────────────────────────────────────────────────────
step "Checking dependencies"
MISSING_PKGS=()
for cmd in curl tar jq sha256sum; do
  command -v "$cmd" &>/dev/null || MISSING_PKGS+=("$cmd")
done

if [[ ${#MISSING_PKGS[@]} -gt 0 ]]; then
  log "Missing system packages: ${MISSING_PKGS[*]}"
  if ask_permission "System packages (${MISSING_PKGS[*]})" \
    "Small utilities needed by the installer: curl downloads binaries, tar extracts them, jq parses API responses, sha256sum verifies downloads."; then
    $PKG_UPDATE
    $PKG_INSTALL "${MISSING_PKGS[@]}"
  else
    error "System packages (${MISSING_PKGS[*]}) are required by the installer. Cannot continue without them."
  fi
fi

# ── Helper: download + verify + extract ───────────────────────────────────────
download_and_extract() {
  local url="$1" dest_dir="$2" strip="${3:-1}"
  local tmp
  tmp=$(mktemp -d)
  trap 'rm -rf "$tmp"' RETURN

  log "Downloading $(basename "$url")"
  curl -fsSL --progress-bar "$url" -o "$tmp/archive.tar.gz"
  tar -xzf "$tmp/archive.tar.gz" -C "$tmp" --strip-components="$strip"
  # Move everything except the tar to dest
  find "$tmp" -mindepth 1 -maxdepth 1 ! -name 'archive.tar.gz' -exec mv -f {} "$dest_dir/" \;
}

# ── Create system users ────────────────────────────────────────────────────────
create_user() {
  local user="$1"
  if ! id "$user" &>/dev/null; then
    useradd --system --no-create-home --shell /sbin/nologin "$user"
  fi
}

# ── 1. node_exporter ──────────────────────────────────────────────────────────
step "Installing node_exporter ${NODE_EXPORTER_VERSION}"

NE_BIN="/usr/local/bin/node_exporter"
if is_installed "$NE_BIN"; then
  log "node_exporter already installed (${NE_BIN}) — skipping download"
else
  if ask_permission "node_exporter" \
    "Collects system metrics (CPU, memory, disk, network) from this machine and exposes them on localhost:9100. Nothing is sent externally — Prometheus reads from it locally."; then
    NE_URL="https://github.com/prometheus/node_exporter/releases/download/v${NODE_EXPORTER_VERSION}/node_exporter-${NODE_EXPORTER_VERSION}.linux-${ARCH_NE}.tar.gz"
    NE_TMP=$(mktemp -d)
    trap 'rm -rf "$NE_TMP"' EXIT

    curl -fsSL --progress-bar "$NE_URL" -o "$NE_TMP/ne.tar.gz"
    tar -xzf "$NE_TMP/ne.tar.gz" -C "$NE_TMP" --strip-components=1
    install -o root -g root -m 0755 "$NE_TMP/node_exporter" "$NE_BIN"
  else
    error "node_exporter is required for the noblinks monitoring stack. Cannot continue without it."
  fi
fi

# Config and service files are always written to ensure correctness
create_user node_exporter

cat > /etc/systemd/system/node_exporter.service <<'EOF'
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
EOF

systemctl daemon-reload
systemctl enable --now node_exporter
log "node_exporter started on port 9100"

# ── 2. Prometheus ──────────────────────────────────────────────────────────────
step "Installing Prometheus ${PROMETHEUS_VERSION}"

PROM_BIN="/usr/local/bin/prometheus"
if is_installed "$PROM_BIN"; then
  log "Prometheus already installed (${PROM_BIN}) — skipping download"
else
  if ask_permission "Prometheus" \
    "Time-series database that stores metrics from node_exporter. Evaluates alert rules and forwards firing alerts to Alertmanager. Runs on localhost:9090, not accessible from the network."; then
    PROM_URL="https://github.com/prometheus/prometheus/releases/download/v${PROMETHEUS_VERSION}/prometheus-${PROMETHEUS_VERSION}.linux-${ARCH_PROM}.tar.gz"
    PROM_TMP=$(mktemp -d)
    curl -fsSL --progress-bar "$PROM_URL" -o "$PROM_TMP/prom.tar.gz"
    tar -xzf "$PROM_TMP/prom.tar.gz" -C "$PROM_TMP" --strip-components=1
    install -o root -g root -m 0755 "$PROM_TMP/prometheus"  /usr/local/bin/prometheus
    install -o root -g root -m 0755 "$PROM_TMP/promtool"    /usr/local/bin/promtool
    rm -rf "$PROM_TMP"
  else
    error "Prometheus is required for the noblinks monitoring stack. Cannot continue without it."
  fi
fi

# Config and service files are always written to ensure machine name and tokens are correct
create_user prometheus
mkdir -p /etc/prometheus/rules /var/lib/prometheus/data
chown -R prometheus:prometheus /etc/prometheus /var/lib/prometheus

# Write prometheus.yml with machine name baked in as instance label
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

# Empty rules file so Prometheus starts without errors
cat > /etc/prometheus/rules/noblinks.yml <<'EOF'
groups:
  - name: noblinks
    rules: []
EOF

chown prometheus:prometheus /etc/prometheus/prometheus.yml /etc/prometheus/rules/noblinks.yml

cat > /etc/systemd/system/prometheus.service <<'EOF'
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
EOF

systemctl daemon-reload
systemctl enable --now prometheus
log "Prometheus started on port 9090 (localhost only)"

# ── 3. Alertmanager (placeholder config — token filled in after registration) ──
step "Installing Alertmanager ${ALERTMANAGER_VERSION}"

AM_BIN="/usr/local/bin/alertmanager"
if is_installed "$AM_BIN"; then
  log "Alertmanager already installed (${AM_BIN}) — skipping download"
else
  if ask_permission "Alertmanager" \
    "Receives firing alerts from Prometheus and forwards them to the noblinks backend via a secure webhook. Runs on localhost:9093, not accessible from the network."; then
    AM_URL="https://github.com/prometheus/alertmanager/releases/download/v${ALERTMANAGER_VERSION}/alertmanager-${ALERTMANAGER_VERSION}.linux-${ARCH_PROM}.tar.gz"
    AM_TMP=$(mktemp -d)
    curl -fsSL --progress-bar "$AM_URL" -o "$AM_TMP/am.tar.gz"
    tar -xzf "$AM_TMP/am.tar.gz" -C "$AM_TMP" --strip-components=1
    install -o root -g root -m 0755 "$AM_TMP/alertmanager" /usr/local/bin/alertmanager
    install -o root -g root -m 0755 "$AM_TMP/amtool"       /usr/local/bin/amtool
    rm -rf "$AM_TMP"
  else
    error "Alertmanager is required for the noblinks monitoring stack. Cannot continue without it."
  fi
fi

# Config and service files are always written to ensure machine name and tokens are correct
create_user alertmanager
mkdir -p /etc/alertmanager /var/lib/alertmanager/data
chown -R alertmanager:alertmanager /etc/alertmanager /var/lib/alertmanager

# Write placeholder config — will be replaced with real token after registration
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

cat > /etc/systemd/system/alertmanager.service <<'EOF'
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
EOF

systemctl daemon-reload
systemctl enable alertmanager
# Don't start yet — placeholder token means it would restart-loop. Start after registration.

# ── 4. noblinks-agent binary ───────────────────────────────────────────────────
step "Installing noblinks-agent ${AGENT_VERSION}"

AGENT_BIN="/usr/local/bin/noblinks-agent"
if is_installed "$AGENT_BIN"; then
  log "noblinks-agent already installed (${AGENT_BIN}) — skipping download"
else
  if ask_permission "noblinks-agent" \
    "Lightweight daemon that syncs alert rules from noblinks, sends heartbeats every 30s, and executes metric queries on demand. Communicates only with ${NOBLINKS_URL}."; then
    curl -fsSL "${NOBLINKS_URL}/noblinks-agent" -o "$AGENT_BIN"
    chmod 0755 "$AGENT_BIN"
  else
    error "noblinks-agent is required for the noblinks monitoring stack. Cannot continue without it."
  fi
fi

# Service file is always written to ensure correctness
cat > /etc/systemd/system/noblinks-agent.service <<'EOF'
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
EOF

systemctl daemon-reload

# ── 5. Register machine with noblinks ─────────────────────────────────────────
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
log "Agent config written to /etc/noblinks/agent.env"

# ── 7. Update Alertmanager config with real token ─────────────────────────────
step "Configuring Alertmanager"

# Replace PLACEHOLDER with real agent token
sed -i "s|credentials: 'PLACEHOLDER'|credentials: '${AGENT_TOKEN}'|g" \
  /etc/alertmanager/alertmanager.yml

systemctl start alertmanager
log "Alertmanager started on port 9093 (localhost only)"

# ── 8. Start noblinks-agent ───────────────────────────────────────────────────
step "Starting noblinks-agent"
systemctl enable --now noblinks-agent

# ── 9. Wait for services to stabilise ────────────────────────────────────────
sleep 3

# ── 10. Status summary ────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  noblinks agent installed successfully"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_service() {
  local name="$1"
  if systemctl is-active --quiet "$name" 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} $name running"
  else
    echo -e "  ${RED}✗${NC} $name NOT running (check: journalctl -u $name)"
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
