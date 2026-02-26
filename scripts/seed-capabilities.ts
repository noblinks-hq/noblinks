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
  {
    capabilityKey: "linux_memory_usage_high",
    name: "Linux Memory High",
    description:
      "Alert when average memory usage exceeds threshold on a Linux machine",
    category: "linux",
    metric: "node_memory_usage_percent",
    parameters: {
      machine: "string",
      threshold: "number",
      window: "duration",
    },
    alertTemplate:
      'avg_over_time(node_memory_usage_percent{instance="$machine"}[$window]) > $threshold',
    defaultThreshold: 80,
    defaultWindow: "5m",
    suggestedSeverity: "warning",
  },
  {
    capabilityKey: "linux_cpu_usage_high",
    name: "Linux CPU High",
    description:
      "Alert when average CPU usage exceeds threshold on a Linux machine",
    category: "linux",
    metric: "node_cpu_usage_percent",
    parameters: {
      machine: "string",
      threshold: "number",
      window: "duration",
    },
    alertTemplate:
      'avg_over_time(node_cpu_usage_percent{instance="$machine"}[$window]) > $threshold',
    defaultThreshold: 80,
    defaultWindow: "5m",
    suggestedSeverity: "warning",
  },
  {
    capabilityKey: "linux_disk_usage_high",
    name: "Linux Disk Usage High",
    description:
      "Alert when filesystem usage exceeds threshold on a Linux machine root mountpoint",
    category: "linux",
    metric: "node_filesystem_usage_percent",
    parameters: {
      machine: "string",
      threshold: "number",
      window: "duration",
    },
    alertTemplate:
      'avg_over_time(node_filesystem_usage_percent{instance="$machine", mountpoint="/"}[$window]) > $threshold',
    defaultThreshold: 85,
    defaultWindow: "10m",
    suggestedSeverity: "critical",
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
