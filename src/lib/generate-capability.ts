import { generateObject } from "ai";
import { z } from "zod";
import { getAIModel } from "@/lib/ai";
import { db } from "@/lib/db";
import { queryMachineLabels } from "@/lib/query-machine";
import { monitoringCapability } from "@/lib/schema";

// ── Schema ────────────────────────────────────────────────────────────────────

export const generatedCapabilitySchema = z.object({
  capabilityKey: z
    .string()
    .describe("Unique snake_case identifier, e.g. linux_tcp_connections"),
  name: z.string().describe("Human-readable name, e.g. 'TCP Connections'"),
  description: z.string().describe("One sentence describing what this monitors"),
  category: z.enum(["linux", "kubernetes", "docker", "windows"]),
  metric: z
    .string()
    .describe("snake_case metric key stored in the widget, e.g. node_tcp_connections"),
  scrapeQuery: z
    .string()
    .describe("PromQL expression that returns the current scalar value of this metric"),
  alertTemplate: z
    .string()
    .describe(
      "PromQL alert condition using $machine, $threshold, $window placeholders, e.g.: avg_over_time(metric{instance=\"$machine\"}[$window]) > $threshold"
    ),
  defaultThreshold: z.number().describe("Sensible default alert threshold"),
  defaultWindow: z.string().describe("Default time window, e.g. 5m, 10m, 1h"),
  suggestedSeverity: z.enum(["critical", "warning", "info"]),
  widgetTitle: z
    .string()
    .nullable()
    .describe("Suggested widget title including machine name if known"),
  widgetType: z
    .enum(["timeseries", "stat", "bar", "pie", "toplist"])
    .describe("Best visualization type for this metric"),
  machine: z.string().nullable().describe("Target machine name extracted from the prompt"),
});

export type GeneratedCapability = z.infer<typeof generatedCapabilitySchema>;

// ── Node exporter metric catalog for the AI ───────────────────────────────────

const NODE_EXPORTER_CATALOG = `
Available node_exporter metrics you can reference in PromQL:

CPU:
  node_cpu_seconds_total{mode="idle|iowait|steal|user|system|nice|irq|softirq"}
  node_load1, node_load5, node_load15

Memory:
  node_memory_MemTotal_bytes, node_memory_MemAvailable_bytes, node_memory_MemFree_bytes
  node_memory_SwapTotal_bytes, node_memory_SwapFree_bytes
  node_memory_Cached_bytes, node_memory_Buffers_bytes

Disk filesystem:
  node_filesystem_size_bytes{mountpoint="/",fstype!~"tmpfs|devtmpfs"}
  node_filesystem_avail_bytes{mountpoint="/",fstype!~"tmpfs|devtmpfs"}
  node_filesystem_free_bytes

Disk I/O:
  node_disk_read_bytes_total{device!~"sr.*|loop.*"}
  node_disk_written_bytes_total{device!~"sr.*|loop.*"}
  node_disk_reads_completed_total, node_disk_writes_completed_total
  node_disk_read_time_seconds_total, node_disk_write_time_seconds_total
  node_disk_io_time_seconds_total

Network:
  node_network_receive_bytes_total{device!~"lo"}
  node_network_transmit_bytes_total{device!~"lo"}
  node_network_receive_packets_total, node_network_transmit_packets_total
  node_network_receive_errs_total, node_network_transmit_errs_total
  node_network_receive_drop_total, node_network_transmit_drop_total

System:
  node_boot_time_seconds, node_time_seconds
  node_filefd_allocated, node_filefd_maximum
  node_context_switches_total
  node_procs_running, node_procs_blocked
  node_forks_total, node_interrupts_total

TCP/Sockets:
  node_netstat_Tcp_CurrEstab
  node_sockstat_TCP_alloc, node_sockstat_TCP_tw
  node_sockstat_sockets_used

System processes:
  node_procs_running — number of processes currently running
  node_procs_blocked — number of processes blocked waiting for I/O
  node_filefd_allocated — number of allocated file descriptors (system-wide)

Systemd service status (ONLY metric for "is X running / is X service up" queries):
  node_systemd_unit_state{name="<service>.service",state="active",instance="$machine"}
  Returns 1 if the service is running, 0 if not.
  EXAMPLE — "is noblinks-agent running": node_systemd_unit_state{name="noblinks-agent.service",state="active",instance="$machine"}
  EXAMPLE — "is nginx running": node_systemd_unit_state{name="nginx.service",state="active",instance="$machine"}
  EXAMPLE — "is postgresql running": node_systemd_unit_state{name="postgresql.service",state="active",instance="$machine"}
  Always use widgetType="stat" for service status — shows 1 (running) or 0 (stopped).
`.trim();

const KUBE_METRICS_CATALOG = `
Available Kubernetes metrics you can reference in PromQL:

Container memory (cAdvisor — from kubelet):
  container_memory_usage_bytes{namespace="<ns>", pod!=""}
  container_memory_working_set_bytes{namespace="<ns>", pod!=""}
  container_memory_rss{namespace="<ns>", pod!=""}
  container_memory_cache{namespace="<ns>", pod!=""}
  NOTE: use pod!="" filter, NOT container!="" — many clusters (including minikube) report pod-level
  metrics where the container label is empty/null.

Container CPU (cAdvisor):
  rate(container_cpu_usage_seconds_total{namespace="<ns>", pod!=""}[2m])

Pod status (kube-state-metrics):
  kube_pod_status_phase{namespace="<ns>", phase="Running|Pending|Failed|Succeeded|Unknown"}
  kube_pod_container_status_restarts_total{namespace="<ns>"}
  kube_pod_container_status_ready{namespace="<ns>"}
  kube_pod_info{namespace="<ns>"}

Deployment health:
  kube_deployment_status_replicas{namespace="<ns>"}
  kube_deployment_status_replicas_available{namespace="<ns>"}
  kube_deployment_spec_replicas{namespace="<ns>"}

Node metrics:
  kube_node_status_condition{condition="Ready", status="true"}
  kube_node_status_allocatable{resource="cpu|memory"}

Resource requests/limits per pod:
  kube_pod_container_resource_requests{resource="cpu|memory", namespace="<ns>"}
  kube_pod_container_resource_limits{resource="cpu|memory", namespace="<ns>"}

PVC storage:
  kubelet_volume_stats_used_bytes{namespace="<ns>"}
  kubelet_volume_stats_capacity_bytes{namespace="<ns>"}

NAMESPACE FILTERING: Always filter by namespace using {namespace="<ns>"} when the user specifies one.
MEMORY UNITS: container_memory_usage_bytes returns bytes. For MB: value / 1024 / 1024. Use sum by (pod)(...) for per-pod breakdown.
CPU UNITS: rate(...[2m]) returns cores. Multiply by 1000 for millicores.
`.trim();

const GENERATION_SYSTEM_PROMPT = `You are a Prometheus monitoring expert. The user wants to monitor a Linux machine metric that does not have a pre-defined capability. Generate a new monitoring capability for it.

${NODE_EXPORTER_CATALOG}

RULES:
0. **SERVICE STATUS** — When the user asks "is X running", "is X service up/down", "check if X is active", "monitor X service", or any variant asking whether a Linux service is running: you MUST use node_systemd_unit_state with widgetType="stat". NEVER use process_open_fds or any other metric for service status queries. Set scrapeQuery=node_systemd_unit_state{name="X.service",state="active",instance="$machine"} where X is the service name from the prompt.
1. Use ONLY metrics from the catalog above. Do not invent metric names.
2. scrapeQuery must return a single scalar value (use avg(), sum(), or scalar selectors).
   Use rate(metric[2m]) for counters, direct metric name for gauges.
   Example: rate(node_disk_read_bytes_total{device!~"sr.*|loop.*"}[2m]) — sums automatically via sum().
3. alertTemplate uses $machine, $threshold, $window as placeholders.
   Example: avg_over_time(node_load1{instance="$machine"}[$window]) > $threshold
4. capabilityKey must be snake_case, start with the category (linux_), be unique and descriptive.
5. metric is the snake_case key we store (does not have to match a real Prometheus metric name).
6. Pick widgetType thoughtfully: timeseries for trends, stat for current value, bar for comparisons.
7. Extract the machine name from the user prompt if present.`;

const KUBE_GENERATION_SYSTEM_PROMPT = `You are a Prometheus monitoring expert. The user wants to monitor a Kubernetes cluster metric. Generate a new monitoring capability using kube-state-metrics and cAdvisor metrics.

${KUBE_METRICS_CATALOG}

RULES:
1. Use ONLY metrics from the catalog above. Do not invent metric names.
2. scrapeQuery MUST return a single scalar number. The agent sums all result rows — always wrap in sum(...) or avg(...).
   - Memory for all pods in namespace X: sum(container_memory_usage_bytes{namespace="X", pod!=""}) / 1024 / 1024
   - Memory for a specific pod: sum(container_memory_usage_bytes{pod="podname"}) / 1024 / 1024
   - CPU for all pods: sum(rate(container_cpu_usage_seconds_total{namespace="X", pod!=""}[2m])) * 1000
   - Pod count: count(kube_pod_info{namespace="X"})
   - For per-pod widget (__POD__ placeholder): sum(container_memory_usage_bytes{pod="__POD__"}) / 1024 / 1024
   - CRITICAL: NEVER use container!="" or container!="POD" — use pod!="" instead
3. alertTemplate uses $machine (cluster name), $threshold, $window as placeholders.
4. capabilityKey must be snake_case, start with kubernetes_ prefix, be unique and descriptive.
5. metric is the snake_case key we store (does not have to match a real Prometheus metric name).
6. Pick widgetType thoughtfully:
   - timeseries: use for ALL per-pod metrics with __POD__ placeholder (memory trend, CPU trend per pod)
   - timeseries: also for aggregate trends (total memory, total CPU over time)
   - stat: single current value (total pod count, node count, single pod current memory)
   - bar: comparison across namespaces or deployments
   - NEVER use toplist — per-pod data is shown via individual timeseries widgets, one per pod
7. Namespace filtering:
   - If the user mentions a specific namespace, filter by it: {namespace="X"}
   - If the user mentions a specific pod name but NO namespace, do NOT add a namespace filter — the pod name alone is sufficient. Example: sum(container_memory_usage_bytes{pod="mypod", container!="", container!="POD"}) / 1024 / 1024
   - NEVER use the machine/cluster name (e.g. "minikube") as a namespace unless the user explicitly says "minikube namespace"
8. Always set category to "kubernetes".
9. For per-pod metrics (when user says "each pod", "all pods", "per pod"): use __POD__ as the pod name placeholder in scrapeQuery and alertTemplate. Always wrap in sum(...) to guarantee a scalar. Example: sum(container_memory_usage_bytes{pod="__POD__"}) / 1024 / 1024`;

// ── Step 1 schema: does the AI need real-time machine data? ───────────────────

const needsQuerySchema = z.object({
  needsQuery: z
    .boolean()
    .describe(
      "True only when the correct answer depends on data that varies per machine and cannot be guessed reliably. Examples that NEED a query: 'is firewall running' (ufw vs firewalld?), 'monitor X service' (does X.service exist?). Examples that do NOT need a query: CPU usage, memory usage, disk I/O, network throughput, load average."
    ),
  promql: z
    .string()
    .nullable()
    .describe(
      "The PromQL to run against the machine to get the needed data, or null if needsQuery is false. Example: node_systemd_unit_state{state=\"active\"} == 1"
    ),
  queryPurpose: z
    .string()
    .nullable()
    .describe(
      "One sentence explaining what the query result will tell us, or null if needsQuery is false. Example: 'Determine which firewall service is installed (ufw, firewalld, nftables, etc.)'"
    ),
});

const NEEDS_QUERY_SYSTEM_PROMPT = `You are a Prometheus monitoring expert deciding whether generating a monitoring capability requires querying the target machine first.

RULE — Named services/daemons: if the request mentions a service, daemon, or process by a generic name (firewall, database, web server, cache, proxy, mail, etc.) you MUST set needsQuery=true. Different Linux distributions use completely different unit names:
  - "firewall" → could be ufw.service, firewalld.service, nftables.service, iptables.service
  - "database" → could be postgresql.service, mysql.service, mariadb.service, mongod.service
  - "web server" → could be nginx.service, apache2.service, httpd.service
  - "cache" → could be redis.service, redis-server.service, memcached.service
  Never guess — always query first for any named service.

Set needsQuery=false ONLY for:
- Standard node_exporter metrics with fixed names: CPU, memory, disk, network I/O, load average, file descriptors, TCP sockets, running processes. These do not vary by distribution.

When needsQuery=true, set promql to: node_systemd_unit_state{state="active"} == 1
This returns all active systemd services so you can find the exact unit name.`;

const KUBE_NEEDS_QUERY_SYSTEM_PROMPT = `You are a Prometheus monitoring expert deciding whether generating a Kubernetes monitoring capability requires querying the cluster first.

Set needsQuery=true ONLY when:
- The user asks about a specific named deployment, service, or pod whose exact name you cannot know (e.g. "is my-app deployment healthy")
- The user asks about a namespace that is non-standard and you need to verify it exists

Set needsQuery=false for:
- Standard metrics filtered by namespace: memory usage, CPU usage, pod counts, restart counts
- Node-level metrics (CPU, memory allocatable/capacity)
- Generic "all pods in namespace X" requests — namespace is known from the prompt

When needsQuery=true, set promql to: kube_pod_info{namespace="<ns>"}
This returns pod info so you can verify the namespace and get pod names.`;

// ── Main function ─────────────────────────────────────────────────────────────

export async function generateCapability(
  prompt: string,
  machineContext?: { orgId: string; machineName: string; category?: string | null } | null
): Promise<GeneratedCapability | null> {
  const isKubernetes = machineContext?.category === "kubernetes";
  let systemPrompt = isKubernetes ? KUBE_GENERATION_SYSTEM_PROMPT : GENERATION_SYSTEM_PROMPT;

  // Step 1: ask the AI if it needs real-time data before it can generate correctly
  if (machineContext) {
    let needsQueryResult;
    try {
      const step1 = await generateObject({
        model: getAIModel(),
        schema: needsQuerySchema,
        system: isKubernetes ? KUBE_NEEDS_QUERY_SYSTEM_PROMPT : NEEDS_QUERY_SYSTEM_PROMPT,
        prompt,
      });
      needsQueryResult = step1.object;
    } catch (err) {
      console.error("[generateCapability] step1 (needs-query check) failed:", err);
      // fall through without live data
    }

    if (needsQueryResult?.needsQuery && needsQueryResult.promql) {
      console.log(
        `[generateCapability] querying agent on ${machineContext.machineName}: ${needsQueryResult.promql} (purpose: ${needsQueryResult.queryPurpose})`
      );
      const liveValues = await queryMachineLabels(
        machineContext.orgId,
        machineContext.machineName,
        needsQueryResult.promql
      );
      if (liveValues && liveValues.length > 0) {
        systemPrompt +=
          `\n\nLIVE DATA from ${machineContext.machineName}` +
          (needsQueryResult.queryPurpose ? ` (${needsQueryResult.queryPurpose})` : "") +
          `: ${liveValues.join(", ")}` +
          `\nPick the SINGLE most relevant service name from this list that matches the user's request. Use exactly one — never combine multiple names in one expression.`;
        console.log(`[generateCapability] live data:`, liveValues);
      } else {
        // AI said it needs live data but the agent didn't respond — refuse to guess
        console.error(
          `[generateCapability] agent query returned no data for ${machineContext.machineName} — aborting to avoid wrong capability`
        );
        return null;
      }
    } else {
      console.log(`[generateCapability] no agent query needed for: "${prompt}"`);
    }
  }

  // Step 2: generate the capability (with live data injected if fetched)
  try {
    const result = await generateObject({
      model: getAIModel(),
      schema: generatedCapabilitySchema,
      system: systemPrompt,
      prompt,
    });

    const cap = result.object;

    // Sanitize Kubernetes scrapeQuery — replace container!="" / container!="POD" with pod!=""
    // Many clusters (minikube) expose pod-level cAdvisor metrics without container labels.
    if (cap.category === "kubernetes") {
      cap.scrapeQuery = cap.scrapeQuery
        .replace(/,?\s*container!="",?\s*container!="POD"/g, ', pod!=""')
        .replace(/,?\s*container!="POD",?\s*container!=""/g, ', pod!=""')
        .replace(/,?\s*container!=""/g, ', pod!=""')
        .replace(/,?\s*container!="POD"/g, '');
    }

    return cap;
  } catch (err) {
    console.error("generateCapability failed:", err);
    return null;
  }
}

// ── Save to DB (upsert by key) ────────────────────────────────────────────────

export async function saveGeneratedCapability(
  cap: GeneratedCapability
): Promise<typeof monitoringCapability.$inferSelect> {
  const [saved] = await db
    .insert(monitoringCapability)
    .values({
      capabilityKey: cap.capabilityKey,
      name: cap.name,
      description: cap.description,
      category: cap.category,
      metric: cap.metric,
      scrapeQuery: cap.scrapeQuery,
      alertTemplate: cap.alertTemplate,
      defaultThreshold: Math.round(cap.defaultThreshold),
      defaultWindow: cap.defaultWindow,
      suggestedSeverity: cap.suggestedSeverity,
      parameters: { machine: "string", threshold: "number", window: "duration" },
    })
    .onConflictDoUpdate({
      target: monitoringCapability.capabilityKey,
      set: {
        name: cap.name,
        description: cap.description,
        scrapeQuery: cap.scrapeQuery,
        alertTemplate: cap.alertTemplate,
        defaultThreshold: Math.round(cap.defaultThreshold),
        defaultWindow: cap.defaultWindow,
        suggestedSeverity: cap.suggestedSeverity,
      },
    })
    .returning();

  return saved!;
}
