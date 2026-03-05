#!/usr/bin/env bash
# noblinks agent uninstaller
# Usage: curl -fsSL https://www.noblinks.com/uninstall.sh | sudo bash
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'
log()   { echo -e "${GREEN}[noblinks]${NC} $*"; }
step()  { echo -e "\n${GREEN}──${NC} $*"; }

[[ $EUID -ne 0 ]] && echo -e "${RED}ERROR:${NC} Run as root (sudo bash)" >&2 && exit 1

step "Stopping services"
for svc in noblinks-agent alertmanager prometheus node_exporter; do
  systemctl stop    "$svc" 2>/dev/null && log "stopped $svc"    || true
  systemctl disable "$svc" 2>/dev/null && log "disabled $svc"   || true
done

step "Removing service files"
rm -f /etc/systemd/system/noblinks-agent.service
rm -f /etc/systemd/system/prometheus.service
rm -f /etc/systemd/system/alertmanager.service
rm -f /etc/systemd/system/node_exporter.service
systemctl daemon-reload

step "Removing binaries"
rm -f /usr/local/bin/noblinks-agent
rm -f /usr/local/bin/prometheus /usr/local/bin/promtool
rm -f /usr/local/bin/alertmanager /usr/local/bin/amtool
rm -f /usr/local/bin/node_exporter

step "Removing config and data"
rm -rf /etc/noblinks
rm -rf /etc/prometheus
rm -rf /etc/alertmanager
rm -rf /var/lib/prometheus
rm -rf /var/lib/alertmanager

step "Removing system users"
userdel prometheus    2>/dev/null && log "removed user: prometheus"    || true
userdel alertmanager  2>/dev/null && log "removed user: alertmanager"  || true
userdel node_exporter 2>/dev/null && log "removed user: node_exporter" || true

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  noblinks agent uninstalled."
echo "  All services, binaries, and config have been removed."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
