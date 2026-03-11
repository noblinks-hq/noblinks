# Monitoring Capabilities Expansion — Implementation Plan

## Status
**TODO** — Only ~5 Linux capabilities seeded. Docker, Kubernetes, and additional Linux metrics return no AI matches.

## Problem
Users asking "alert me when a container restarts" or "notify me on high swap usage" get no capability match from the AI. The product feels limited.

## Target: 30+ capabilities

### Linux (additional)
| Key | Metric | Description |
|---|---|---|
| `linux_swap_usage` | `node_memory_SwapUsed_bytes / node_memory_SwapTotal_bytes * 100` | Swap usage % |
| `linux_inode_usage` | `node_filesystem_files_free / node_filesystem_files * 100` | Inode exhaustion |
| `linux_oom_kills` | `node_vmstat_oom_kill` | OOM kill events |
| `linux_open_files` | `node_filefd_allocated / node_filefd_maximum * 100` | Open file descriptor % |
| `linux_load_1m` | `node_load1` | 1-minute load average |
| `linux_ntp_offset` | `node_timex_offset_seconds` | NTP clock drift |
| `linux_network_errors` | `rate(node_network_transmit_errs_total[5m])` | Network tx errors/s |
| `linux_network_drops` | `rate(node_network_receive_drop_total[5m])` | Network rx drops/s |

### Docker
| Key | Metric | Description |
|---|---|---|
| `docker_container_cpu` | `rate(container_cpu_usage_seconds_total[5m]) * 100` | Container CPU % |
| `docker_container_memory` | `container_memory_usage_bytes / container_spec_memory_limit_bytes * 100` | Container memory % |
| `docker_container_restarts` | `increase(container_restart_count[15m])` | Container restart count |
| `docker_container_oom` | `container_oom_events_total` | Container OOM events |

### Kubernetes
| Key | Metric | Description |
|---|---|---|
| `k8s_pod_restarts` | `increase(kube_pod_container_status_restarts_total[15m])` | Pod restart count |
| `k8s_node_memory_pressure` | `kube_node_status_condition{condition="MemoryPressure",status="true"}` | Node memory pressure |
| `k8s_node_disk_pressure` | `kube_node_status_condition{condition="DiskPressure",status="true"}` | Node disk pressure |
| `k8s_deployment_unavailable` | `kube_deployment_status_replicas_unavailable` | Unavailable replicas |
| `k8s_pod_pending` | `kube_pod_status_phase{phase="Pending"}` | Pods stuck pending |

## Implementation
All capabilities are seeded via `scripts/seed-capabilities.ts`. Add new entries using the existing `upsert` pattern.

Each capability needs:
- `capabilityKey` — unique snake_case identifier
- `name` — human-readable
- `description` — one sentence
- `category` — `linux` | `docker` | `kubernetes`
- `metric` — the primary metric name
- `alertTemplate` — PromQL with `$machine`, `$threshold`, `$window` placeholders
- `scrapeQuery` — PromQL to get current value (for test mode)
- `defaultThreshold` — sensible default
- `defaultWindow` — e.g. `5m`
- `suggestedSeverity` — `critical` | `warning` | `info`

## Files
- `scripts/seed-capabilities.ts` — add all new capabilities here
