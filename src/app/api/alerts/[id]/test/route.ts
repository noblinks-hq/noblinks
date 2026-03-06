import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgScope } from "@/lib/org";
import { alert, metricSample, monitoringCapability } from "@/lib/schema";
import { requireApiAuth } from "@/lib/session";

// A sample is considered "recent" if it was taken within the last 10 minutes.
const RECENT_MS = 10 * 60 * 1000;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;

  const [found] = await db
    .select()
    .from(alert)
    .where(and(eq(alert.id, id), eq(alert.organizationId, orgScope(session))));

  if (!found) {
    return Response.json({ error: "Alert not found" }, { status: 404 });
  }

  const [capability] = await db
    .select()
    .from(monitoringCapability)
    .where(eq(monitoringCapability.id, found.capabilityId));

  if (!capability) {
    return Response.json({ error: "Capability not found" }, { status: 404 });
  }

  // Look up the most recent metric sample for this machine + metric
  const [sample] = await db
    .select()
    .from(metricSample)
    .where(
      and(
        eq(metricSample.organizationId, orgScope(session)),
        eq(metricSample.machineName, found.machine),
        eq(metricSample.metricKey, capability.metric)
      )
    )
    .orderBy(desc(metricSample.sampledAt))
    .limit(1);

  if (!sample) {
    return Response.json({
      currentValue: null,
      threshold: found.threshold,
      wouldFire: null,
      sampledAt: null,
      error: "No metric data found for this machine. Ensure the agent is running and reporting metrics.",
    });
  }

  const ageMs = Date.now() - new Date(sample.sampledAt).getTime();
  const stale = ageMs > RECENT_MS;

  return Response.json({
    currentValue: sample.value,
    threshold: found.threshold,
    wouldFire: sample.value > found.threshold,
    sampledAt: sample.sampledAt,
    stale,
  });
}
