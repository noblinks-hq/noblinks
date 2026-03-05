import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgScope } from "@/lib/org";
import { dashboard, widget } from "@/lib/schema";
import { requireApiAuth } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const { id: dashboardId } = await params;

  // Verify dashboard belongs to the active organization
  const [dash] = await db
    .select()
    .from(dashboard)
    .where(
      and(
        eq(dashboard.id, dashboardId),
        eq(dashboard.organizationId, orgScope(session))
      )
    )
    .limit(1);

  if (!dash) {
    return Response.json({ error: "Dashboard not found" }, { status: 404 });
  }

  const widgets = await db
    .select()
    .from(widget)
    .where(
      and(
        eq(widget.dashboardId, dashboardId),
        eq(widget.organizationId, orgScope(session))
      )
    )
    .orderBy(widget.createdAt);

  return Response.json({ widgets });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const { id: dashboardId } = await params;

  // Verify dashboard belongs to the active organization
  const [dash] = await db
    .select()
    .from(dashboard)
    .where(
      and(
        eq(dashboard.id, dashboardId),
        eq(dashboard.organizationId, orgScope(session))
      )
    )
    .limit(1);

  if (!dash) {
    return Response.json({ error: "Dashboard not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    title?: string;
    type?: string;
    metric?: string;
    machine?: string;
    capabilityKey?: string;
    thresholdValue?: number;
  };

  const VALID_TYPES = ["timeseries", "stat", "bar", "pie", "toplist"];

  if (!body.title?.trim()) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }
  if (!body.type || !VALID_TYPES.includes(body.type)) {
    return Response.json(
      { error: "Valid type is required" },
      { status: 400 }
    );
  }
  if (!body.metric?.trim()) {
    return Response.json({ error: "Metric is required" }, { status: 400 });
  }
  if (!body.machine?.trim()) {
    return Response.json({ error: "Machine is required" }, { status: 400 });
  }

  const [created] = await db
    .insert(widget)
    .values({
      dashboardId,
      organizationId: orgScope(session),
      title: body.title.trim(),
      type: body.type,
      metric: body.metric.trim(),
      machine: body.machine.trim(),
      capabilityKey: body.capabilityKey ?? null,
      thresholdValue: body.thresholdValue ?? null,
    })
    .returning();

  // Increment visualizationCount on the parent dashboard
  await db
    .update(dashboard)
    .set({ visualizationCount: dash.visualizationCount + 1 })
    .where(eq(dashboard.id, dashboardId));

  return Response.json({ widget: created }, { status: 201 });
}
