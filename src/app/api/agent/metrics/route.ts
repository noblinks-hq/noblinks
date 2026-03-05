import { and, eq, lt } from "drizzle-orm";
import { z } from "zod";
import { requireAgentAuth } from "@/lib/agent-auth";
import { db } from "@/lib/db";
import { metricSample } from "@/lib/schema";

const bodySchema = z.object({
  samples: z
    .array(
      z.object({
        metric: z.string().min(1),
        value: z.number().finite(),
      })
    )
    .min(1)
    .max(50),
});

// Keep 2 hours of data at 30s intervals ≈ 240 rows per metric.
// Prune anything older than 3 hours to leave a comfortable buffer.
const PRUNE_OLDER_THAN_MS = 3 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const { machine: m, error } = await requireAgentAuth(request);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const now = new Date();
  const pruneThreshold = new Date(now.getTime() - PRUNE_OLDER_THAN_MS);

  // Insert new samples
  await db.insert(metricSample).values(
    parsed.data.samples.map((s) => ({
      organizationId: m.organizationId,
      machineName: m.name,
      metricKey: s.metric,
      value: s.value,
      sampledAt: now,
    }))
  );

  // Prune old samples for this machine (run async, don't block response)
  db.delete(metricSample)
    .where(
      and(
        eq(metricSample.organizationId, m.organizationId),
        eq(metricSample.machineName, m.name),
        lt(metricSample.sampledAt, pruneThreshold)
      )
    )
    .catch(() => {});

  return Response.json({ ok: true });
}
