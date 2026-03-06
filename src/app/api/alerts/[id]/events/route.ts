import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgScope } from "@/lib/org";
import { alert, alertEvent } from "@/lib/schema";
import { requireApiAuth } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;

  // Verify alert belongs to org
  const [found] = await db
    .select({ id: alert.id })
    .from(alert)
    .where(and(eq(alert.id, id), eq(alert.organizationId, orgScope(session))))
    .limit(1);

  if (!found) {
    return Response.json({ error: "Alert not found" }, { status: 404 });
  }

  const events = await db
    .select()
    .from(alertEvent)
    .where(eq(alertEvent.alertId, id))
    .orderBy(desc(alertEvent.occurredAt))
    .limit(30);

  return Response.json({ events });
}
