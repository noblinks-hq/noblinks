import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgScope } from "@/lib/org";
import { dashboard, metricSample, widget } from "@/lib/schema";
import { requireApiAuth } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; widgetId: string }> }
) {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const { id: dashboardId, widgetId } = await params;
  const orgId = orgScope(session);

  // Verify dashboard ownership
  const [dash] = await db
    .select()
    .from(dashboard)
    .where(and(eq(dashboard.id, dashboardId), eq(dashboard.organizationId, orgId)))
    .limit(1);

  if (!dash) {
    return Response.json({ error: "Dashboard not found" }, { status: 404 });
  }

  // Fetch widget
  const [w] = await db
    .select()
    .from(widget)
    .where(
      and(
        eq(widget.id, widgetId),
        eq(widget.dashboardId, dashboardId),
        eq(widget.organizationId, orgId)
      )
    )
    .limit(1);

  if (!w) {
    return Response.json({ error: "Widget not found" }, { status: 404 });
  }

  // Return last 120 samples (1 hour at 30s intervals) ordered oldest→newest
  const samples = await db
    .select({ value: metricSample.value, sampledAt: metricSample.sampledAt })
    .from(metricSample)
    .where(
      and(
        eq(metricSample.organizationId, orgId),
        eq(metricSample.machineName, w.machine),
        eq(metricSample.metricKey, w.metric)
      )
    )
    .orderBy(asc(metricSample.sampledAt))
    .limit(120);

  const points = samples.map((s) => ({
    t: s.sampledAt.toISOString(),
    v: s.value,
  }));

  return Response.json({ points });
}
