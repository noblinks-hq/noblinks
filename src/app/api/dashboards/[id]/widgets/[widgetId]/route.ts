import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgScope } from "@/lib/org";
import { dashboard, widget } from "@/lib/schema";
import { requireApiAuth } from "@/lib/session";

const VALID_WIDGET_TYPES = ["timeseries", "stat", "bar", "pie", "toplist"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; widgetId: string }> }
) {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const { id: dashboardId, widgetId } = await params;
  const body = (await request.json()) as { title?: string; type?: string };

  if (body.type && !VALID_WIDGET_TYPES.includes(body.type)) {
    return Response.json({ error: "Invalid widget type" }, { status: 400 });
  }

  const updates: { title?: string; type?: string } = {};
  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.type !== undefined) updates.type = body.type;

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(widget)
    .set(updates)
    .where(
      and(
        eq(widget.id, widgetId),
        eq(widget.dashboardId, dashboardId),
        eq(widget.organizationId, orgScope(session))
      )
    )
    .returning();

  if (!updated) {
    return Response.json({ error: "Widget not found" }, { status: 404 });
  }

  return Response.json({ widget: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; widgetId: string }> }
) {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const { id: dashboardId, widgetId } = await params;

  // Verify the dashboard belongs to the org
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

  const [deleted] = await db
    .delete(widget)
    .where(
      and(
        eq(widget.id, widgetId),
        eq(widget.dashboardId, dashboardId),
        eq(widget.organizationId, orgScope(session))
      )
    )
    .returning();

  if (!deleted) {
    return Response.json({ error: "Widget not found" }, { status: 404 });
  }

  // Decrement visualizationCount
  await db
    .update(dashboard)
    .set({ visualizationCount: Math.max(0, dash.visualizationCount - 1) })
    .where(eq(dashboard.id, dashboardId));

  return new Response(null, { status: 204 });
}
