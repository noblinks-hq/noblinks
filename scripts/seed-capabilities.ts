import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { monitoringCapability } from "../src/lib/schema";

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
  console.error("POSTGRES_URL environment variable is not set");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

const capabilities = [
  // ── CPU ──────────────────────────────────────────────────────────────────
  {
    capabilityKey: "linux_cpu_usage_high",
    name: "CPU Usage",
    description: "Overall CPU utilisation across all cores",
    category: "linux",
    metric: "node_cpu_usage_percent",
    parameters: { machine: "string", threshold: "number", window: "duration" },
    alertTemplate: 'avg_over_time(node_cpu_usage_percent{instance="$machine"}[$window]) > $threshold',
    defaultThreshold: 80,
    defaultWindow: "5m",
    suggestedSeverity: "warning",
    scrapeQuery: '100 - avg(rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100',
  },
  {
    capabilityKey: "linux_cpu_iowait_high",
    name: "CPU I/O Wait",
    description: "Percentage of time CPUs are waiting on disk I/O",
    category: "linux",
    metric: "node_cpu_iowait_percent",
    parameters: { machine: "string", threshold: "number", window: "duration" },
    alertTemplate: 'avg_over_time(node_cpu_iowait_percent{instance="$machine"}[$window]) > $threshold',
    defaultThreshold: 20,
    defaultWindow: "5m",
    suggestedSeverity: "warning",
    scrapeQuery: 'avg(rate(node_cpu_seconds_total{mode="iowait"}[2m])) * 100',
  },
  {
    capabilityKey: "linux_load1_high",
    name: "Load Average (1m)",
    description: "1-minute load average — high values indicate CPU saturation",
    category: "linux",
    metric: "node_load1",
    parameters: { machine: "string", threshold: "number", window: "duration" },
    alertTemplate: 'avg_over_time(node_load1{instance="$machine"}[$window]) > $threshold',
    defaultThreshold: 4,
    defaultWindow: "5m",
    suggestedSeverity: "warning",
    scrapeQuery: "node_load1",
  },
  {
    capabilityKey: "linux_load5_high",
    name: "Load Average (5m)",
    description: "5-minute load average",
    category: "linux",
    metric: "node_load5",
    parameters: { machine: "string", threshold: "number", window: "duration" },
    alertTemplate: 'avg_over_time(node_load5{instance="$machine"}[$window]) > $threshold',
    defaultThreshold: 4,
    defaultWindow: "10m",
    suggestedSeverity: "warning",
    scrapeQuery: "node_load5",
  },

  // ── Memory ────────────────────────────────────────────────────────────────
  {
    capabilityKey: "linux_memory_usage_high",
    name: "Memory Usage",
    description: "RAM utilisation percentage",
    category: "linux",
    metric: "node_memory_usage_percent",
    parameters: { machine: "string", threshold: "number", window: "duration" },
    alertTemplate: 'avg_over_time(node_memory_usage_percent{instance="$machine"}[$window]) > $threshold',
    defaultThreshold: 80,
    defaultWindow: "5m",
    suggestedSeverity: "warning",
    scrapeQuery: "(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100",
  },
  {
    capabilityKey: "linux_swap_usage_high",
    name: "Swap Usage",
    description: "Swap space utilisation percentage",
    category: "linux",
    metric: "node_swap_usage_percent",
    parameters: { machine: "string", threshold: "number", window: "duration" },
    alertTemplate: 'avg_over_time(node_swap_usage_percent{instance="$machine"}[$window]) > $threshold',
    defaultThreshold: 50,
    defaultWindow: "5m",
    suggestedSeverity: "warning",
    scrapeQuery: "(1 - node_memory_SwapFree_bytes / node_memory_SwapTotal_bytes) * 100",
  },

  // ── Disk ─────────────────────────────────────────────────────────────────
  {
    capabilityKey: "linux_disk_usage_high",
    name: "Disk Usage",
    description: "Root filesystem utilisation percentage",
    category: "linux",
    metric: "node_filesystem_usage_percent",
    parameters: { machine: "string", threshold: "number", window: "duration" },
    alertTemplate: 'avg_over_time(node_filesystem_usage_percent{instance="$machine",mountpoint="/"}[$window]) > $threshold',
    defaultThreshold: 85,
    defaultWindow: "10m",
    suggestedSeverity: "critical",
    scrapeQuery: '(1 - node_filesystem_avail_bytes{mountpoint="/",fstype!~"tmpfs|devtmpfs"} / node_filesystem_size_bytes{mountpoint="/",fstype!~"tmpfs|devtmpfs"}) * 100',
  },
  {
    capabilityKey: "linux_disk_read_throughput",
    name: "Disk Read Throughput",
    description: "Disk read throughput in bytes per second",
    category: "linux",
    metric: "node_disk_read_bytes_per_sec",
    parameters: { machine: "string", threshold: "number", window: "duration" },
    alertTemplate: 'avg_over_time(node_disk_read_bytes_per_sec{instance="$machine"}[$window]) > $threshold',
    defaultThreshold: 104857600,
    defaultWindow: "5m",
    suggestedSeverity: "warning",
    scrapeQuery: 'sum(rate(node_disk_read_bytes_total{device!~"sr.*|loop.*"}[2m]))',
  },
  {
    capabilityKey: "linux_disk_write_throughput",
    name: "Disk Write Throughput",
    description: "Disk write throughput in bytes per second",
    category: "linux",
    metric: "node_disk_write_bytes_per_sec",
    parameters: { machine: "string", threshold: "number", window: "duration" },
    alertTemplate: 'avg_over_time(node_disk_write_bytes_per_sec{instance="$machine"}[$window]) > $threshold',
    defaultThreshold: 104857600,
    defaultWindow: "5m",
    suggestedSeverity: "warning",
    scrapeQuery: 'sum(rate(node_disk_written_bytes_total{device!~"sr.*|loop.*"}[2m]))',
  },

  // ── Network ───────────────────────────────────────────────────────────────
  {
    capabilityKey: "linux_network_rx_high",
    name: "Network Receive Throughput",
    description: "Inbound network traffic in bytes per second",
    category: "linux",
    metric: "node_network_receive_bytes_per_sec",
    parameters: { machine: "string", threshold: "number", window: "duration" },
    alertTemplate: 'avg_over_time(node_network_receive_bytes_per_sec{instance="$machine"}[$window]) > $threshold',
    defaultThreshold: 104857600,
    defaultWindow: "5m",
    suggestedSeverity: "warning",
    scrapeQuery: 'sum(rate(node_network_receive_bytes_total{device!~"lo"}[2m]))',
  },
  {
    capabilityKey: "linux_network_tx_high",
    name: "Network Transmit Throughput",
    description: "Outbound network traffic in bytes per second",
    category: "linux",
    metric: "node_network_transmit_bytes_per_sec",
    parameters: { machine: "string", threshold: "number", window: "duration" },
    alertTemplate: 'avg_over_time(node_network_transmit_bytes_per_sec{instance="$machine"}[$window]) > $threshold',
    defaultThreshold: 104857600,
    defaultWindow: "5m",
    suggestedSeverity: "warning",
    scrapeQuery: 'sum(rate(node_network_transmit_bytes_total{device!~"lo"}[2m]))',
  },
  {
    capabilityKey: "linux_network_errors",
    name: "Network Errors",
    description: "Network interface error rate per second",
    category: "linux",
    metric: "node_network_errors_per_sec",
    parameters: { machine: "string", threshold: "number", window: "duration" },
    alertTemplate: 'avg_over_time(node_network_errors_per_sec{instance="$machine"}[$window]) > $threshold',
    defaultThreshold: 10,
    defaultWindow: "5m",
    suggestedSeverity: "critical",
    scrapeQuery: 'sum(rate(node_network_receive_errs_total{device!~"lo"}[2m])) + sum(rate(node_network_transmit_errs_total{device!~"lo"}[2m]))',
  },

  // ── System ────────────────────────────────────────────────────────────────
  {
    capabilityKey: "linux_open_file_descriptors_high",
    name: "Open File Descriptors",
    description: "Number of open file descriptors — nearing system limits causes failures",
    category: "linux",
    metric: "node_open_file_descriptors",
    parameters: { machine: "string", threshold: "number", window: "duration" },
    alertTemplate: 'avg_over_time(node_open_file_descriptors{instance="$machine"}[$window]) > $threshold',
    defaultThreshold: 65536,
    defaultWindow: "5m",
    suggestedSeverity: "warning",
    scrapeQuery: "node_filefd_allocated",
  },
  {
    capabilityKey: "linux_context_switches_high",
    name: "Context Switches",
    description: "CPU context switch rate per second — high values indicate CPU pressure",
    category: "linux",
    metric: "node_context_switches_per_sec",
    parameters: { machine: "string", threshold: "number", window: "duration" },
    alertTemplate: 'avg_over_time(node_context_switches_per_sec{instance="$machine"}[$window]) > $threshold',
    defaultThreshold: 100000,
    defaultWindow: "5m",
    suggestedSeverity: "warning",
    scrapeQuery: "rate(node_context_switches_total[2m])",
  },
  {
    capabilityKey: "linux_uptime",
    name: "System Uptime",
    description: "Machine uptime in seconds — monitors unexpected reboots",
    category: "linux",
    metric: "node_uptime_seconds",
    parameters: { machine: "string", threshold: "number", window: "duration" },
    alertTemplate: 'node_uptime_seconds{instance="$machine"} < $threshold',
    defaultThreshold: 300,
    defaultWindow: "1m",
    suggestedSeverity: "critical",
    scrapeQuery: "node_time_seconds - node_boot_time_seconds",
  },
];

async function seed() {
  console.log("Seeding monitoring capabilities...");

  for (const cap of capabilities) {
    await db
      .insert(monitoringCapability)
      .values(cap)
      .onConflictDoUpdate({
        target: monitoringCapability.capabilityKey,
        set: {
          name: cap.name,
          description: cap.description,
          category: cap.category,
          metric: cap.metric,
          parameters: cap.parameters,
          alertTemplate: cap.alertTemplate,
          defaultThreshold: cap.defaultThreshold,
          defaultWindow: cap.defaultWindow,
          suggestedSeverity: cap.suggestedSeverity,
          scrapeQuery: cap.scrapeQuery,
        },
      });
    console.log(`  ✓ ${cap.capabilityKey}`);
  }

  console.log("Done! Seeded", capabilities.length, "capabilities.");
  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
