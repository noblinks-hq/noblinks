import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgScope } from "@/lib/org";
import { alert, monitoringCapability } from "@/lib/schema";
import { requireApiAuth, requireApiPermission } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;

  const [found] = await db
    .select()
    .from(alert)
    .where(
      and(
        eq(alert.id, id),
        eq(alert.organizationId, orgScope(session))
      )
    );

  if (!found) {
    return Response.json({ error: "Alert not found" }, { status: 404 });
  }

  const [capability] = await db
    .select()
    .from(monitoringCapability)
    .where(eq(monitoringCapability.id, found.capabilityId));

  return Response.json({ alert: found, capability });
}

const VALID_STATUSES = ["configured", "active", "firing", "resolved"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiPermission({
    alert: ["update"],
  });
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const { status } = body as { status?: string };

  if (!status || !VALID_STATUSES.includes(status)) {
    return Response.json(
      { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(alert)
    .set({ status })
    .where(
      and(
        eq(alert.id, id),
        eq(alert.organizationId, orgScope(session))
      )
    )
    .returning();

  if (!updated) {
    return Response.json({ error: "Alert not found" }, { status: 404 });
  }

  return Response.json({ alert: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiPermission({
    alert: ["delete"],
  });
  if (error) return error;

  const { id } = await params;

  const [deleted] = await db
    .delete(alert)
    .where(
      and(
        eq(alert.id, id),
        eq(alert.organizationId, orgScope(session))
      )
    )
    .returning();

  if (!deleted) {
    return Response.json({ error: "Alert not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}
